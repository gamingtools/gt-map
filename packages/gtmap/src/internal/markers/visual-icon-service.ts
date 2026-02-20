/**
 * VisualIconService -- converts Visual objects into internal icon definitions.
 *
 * Handles text-to-canvas rendering, SVG-to-dataUrl conversion, image visuals,
 * and default icon generation. Maintains caches for visual-to-iconId and
 * visual-to-size mappings.
 *
 * Generated visuals (text, shapes, SVG async) pass their canvas through
 * IconDefInternal to avoid a wasteful base64 encode/decode roundtrip.
 */
import type { IconDefInternal, SpriteAtlasHandle } from '../../api/types';
import { Visual, isImageVisual, isTextVisual, isSvgVisual, isSpriteVisual, isCircleVisual, isRectVisual, resolveAnchor, resolveSize } from '../../api/visual';
import { renderTextToCanvas } from '../layers/text-renderer';
import { renderSvgToDataUrlSync, renderSvgToCanvasAsync } from '../layers/svg-renderer';
import { renderCircleToCanvas, renderRectToCanvas } from '../layers/shape-renderer';
import { applyVisualEffects, applyVisualEffectsAsync, type VisualEffectsOptions, type SpriteRegion } from '../layers/visual-effects';

export interface VisualIconServiceDeps {
	setIconDefs(defs: Record<string, IconDefInternal>): Promise<void>;
	onVisualUpdated(): void;
}

export class VisualIconService {
	private _deps: VisualIconServiceDeps;
	private _visualToIconId: WeakMap<Visual, string> = new WeakMap();
	private _visualToSize: WeakMap<Visual, { width: number; height: number }> = new WeakMap();
	private _atlasCanvasCache: WeakMap<SpriteAtlasHandle, HTMLCanvasElement> = new WeakMap();
	private _atlasCanvasPending: WeakMap<SpriteAtlasHandle, Promise<HTMLCanvasElement | null>> = new WeakMap();
	private _visualIdSeq = 0;
	private _defaultIconReady = false;

	constructor(deps: VisualIconServiceDeps) {
		this._deps = deps;
	}

	ensureDefaultIcon(): void {
		if (this._defaultIconReady) return;
		try {
			const size = 16;
			const r = 7;
			const cnv = document.createElement('canvas');
			cnv.width = size;
			cnv.height = size;
			const ctx = cnv.getContext('2d');
			if (ctx) {
				ctx.clearRect(0, 0, size, size);
				ctx.fillStyle = '#2563eb';
				ctx.beginPath();
				ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
				ctx.fill();
				ctx.strokeStyle = 'rgba(0,0,0,0.6)';
				ctx.lineWidth = 1;
				ctx.stroke();
			}
			const defaultIcon: IconDefInternal = { iconPath: '', canvas: cnv, width: size, height: size };
			this._deps.setIconDefs({ default: defaultIcon });
			this._defaultIconReady = true;
		} catch {
			/* expected: canvas API may not be available (SSR) */
		}
	}

	ensureRegistered(visual: Visual): string {
		const cached = this._visualToIconId.get(visual);
		if (cached) return cached;

		// Sprite visuals are pre-registered via loadSpriteAtlas.
		// If no base-class effects, just map directly to the atlas icon ID.
		if (isSpriteVisual(visual) && !visual.hasEffects()) {
			const iconId = visual.getIconId();
			this._visualToIconId.set(visual, iconId);
			return iconId;
		}

		this._visualIdSeq = (this._visualIdSeq + 1) % Number.MAX_SAFE_INTEGER;
		const iconId = `v_${this._visualIdSeq.toString(36)}`;
		let iconDef: IconDefInternal | null = null;

		if (isSpriteVisual(visual)) {
			// Sprite with effects: resolve atlas canvas lazily to avoid preloading all atlases.
			const spriteSize = visual.getSize();
			const entry = visual.atlasHandle.descriptor.sprites[visual.spriteName];
			const w = spriteSize?.width ?? entry?.width ?? 32;
			const h = spriteSize?.height ?? entry?.height ?? 32;
			const anchor = this._resolveSpriteAnchor(visual, entry, w, h);
			this._visualToIconId.set(visual, iconId);
			const region: SpriteRegion | undefined = entry ? { x: entry.x, y: entry.y, width: entry.width, height: entry.height } : undefined;
			if (region) {
				const cachedCanvas = this._atlasCanvasCache.get(visual.atlasHandle);
				if (cachedCanvas) {
					this._applyEffectsFromCanvas(iconId, cachedCanvas, w, h, anchor, visual, region);
				} else {
					this._ensureAtlasCanvas(visual.atlasHandle)
						.then((atlasCanvas) => {
							if (atlasCanvas) {
								this._applyEffectsFromCanvas(iconId, atlasCanvas, w, h, anchor, visual, region);
							} else {
								this._applyEffectsFromIconUrl(iconId, visual.atlasHandle.url, w, h, anchor, visual, region);
							}
						})
						.catch(() => {
							this._applyEffectsFromIconUrl(iconId, visual.atlasHandle.url, w, h, anchor, visual, region);
						});
				}
			} else {
				this._applyEffectsFromIconUrl(iconId, visual.atlasHandle.url, w, h, anchor, visual, region);
			}
			return iconId;
		} else if (isImageVisual(visual)) {
			const size = visual.getSize();
			const anchor = resolveAnchor(visual.anchor);
			if (visual.hasEffects()) {
				// Image with effects: async post-process path
				this._visualToIconId.set(visual, iconId);
				this._applyEffectsFromIconUrl(iconId, visual.icon, size.width, size.height, anchor, visual);
				return iconId;
			}
			iconDef = {
				iconPath: visual.icon,
				...(visual.icon2x != null ? { x2IconPath: visual.icon2x } : {}),
				width: size.width,
				height: size.height,
				anchorX: anchor.x * size.width,
				anchorY: anchor.y * size.height,
			};
		} else if (isTextVisual(visual)) {
			const result = renderTextToCanvas({
				text: visual.text,
				fontSize: visual.fontSize,
				fontFamily: visual.fontFamily,
				color: visual.color,
				...(visual.backgroundColor != null ? { backgroundColor: visual.backgroundColor } : {}),
				...(visual.padding != null ? { padding: visual.padding } : {}),
				...(visual.strokeColor != null ? { strokeColor: visual.strokeColor } : {}),
				...(visual.strokeWidth != null ? { strokeWidth: visual.strokeWidth } : {}),
				...(visual.fontWeight != null ? { fontWeight: visual.fontWeight } : {}),
				...(visual.fontStyle != null ? { fontStyle: visual.fontStyle } : {}),
			});
			const anchor = resolveAnchor(visual.anchor);
			const displayW = result.width / 2;
			const displayH = result.height / 2;
			if (visual.hasEffects()) {
				// Text with base-class effects: apply post-process synchronously using the canvas
				this._visualToIconId.set(visual, iconId);
				this._applyEffectsFromCanvas(iconId, result.canvas, displayW, displayH, anchor, visual);
				return iconId;
			}
			iconDef = {
				iconPath: '',
				canvas: result.canvas,
				width: displayW,
				height: displayH,
				anchorX: anchor.x * displayW,
				anchorY: anchor.y * displayH,
			};
		} else if (isSvgVisual(visual)) {
			const size = visual.getSize();
			const anchor = resolveAnchor(visual.anchor);
			const needsAsync = visual.shadow || visual.svg.trim().startsWith('http');

			if (!needsAsync) {
				const dataUrl = renderSvgToDataUrlSync({
					svg: visual.svg,
					width: size.width,
					height: size.height,
					...(visual.fill != null ? { fill: visual.fill } : {}),
					...(visual.stroke != null ? { stroke: visual.stroke } : {}),
					...(visual.strokeWidth != null ? { strokeWidth: visual.strokeWidth } : {}),
				});
				if (dataUrl) {
					// SVG sync path: produces data:image/svg+xml (not PNG), stays on string path
					iconDef = {
						iconPath: dataUrl,
						width: size.width,
						height: size.height,
						anchorX: anchor.x * size.width,
						anchorY: anchor.y * size.height,
					};
				}
			} else {
				this._visualToIconId.set(visual, iconId);
				renderSvgToCanvasAsync(
					{
						svg: visual.svg,
						width: size.width,
						height: size.height,
						...(visual.fill != null ? { fill: visual.fill } : {}),
						...(visual.stroke != null ? { stroke: visual.stroke } : {}),
						...(visual.strokeWidth != null ? { strokeWidth: visual.strokeWidth } : {}),
						...(visual.shadow != null ? { shadow: visual.shadow } : {}),
					},
					(result) => {
						const displayW = result.width / 2;
						const displayH = result.height / 2;
						const updatedDef: IconDefInternal = {
							iconPath: '',
							canvas: result.canvas,
							width: displayW,
							height: displayH,
							anchorX: anchor.x * displayW,
							anchorY: anchor.y * displayH,
						};
						this._deps.setIconDefs(Object.fromEntries([[iconId, updatedDef]]));
						this._visualToSize.set(visual, { width: displayW, height: displayH });
						this._deps.onVisualUpdated();
					},
				);
				return iconId;
			}
		} else if (isCircleVisual(visual)) {
			const result = renderCircleToCanvas({
				radius: visual.radius,
				...(visual.fill != null ? { fill: visual.fill } : {}),
				...(visual.stroke != null ? { stroke: visual.stroke } : {}),
				...(visual.strokeWidth != null ? { strokeWidth: visual.strokeWidth } : {}),
			});
			const anchor = resolveAnchor(visual.anchor);
			const displayW = result.width / 2;
			const displayH = result.height / 2;
			if (visual.shadow) {
				this._visualToIconId.set(visual, iconId);
				this._applyEffectsFromCanvas(iconId, result.canvas, displayW, displayH, anchor, visual);
				return iconId;
			}
			iconDef = {
				iconPath: '',
				canvas: result.canvas,
				width: displayW,
				height: displayH,
				anchorX: anchor.x * displayW,
				anchorY: anchor.y * displayH,
			};
		} else if (isRectVisual(visual)) {
			const size = visual.getSize();
			const result = renderRectToCanvas({
				width: size.width,
				height: size.height,
				...(visual.fill != null ? { fill: visual.fill } : {}),
				...(visual.stroke != null ? { stroke: visual.stroke } : {}),
				...(visual.strokeWidth != null ? { strokeWidth: visual.strokeWidth } : {}),
				...(visual.borderRadius != null ? { borderRadius: visual.borderRadius } : {}),
			});
			const anchor = resolveAnchor(visual.anchor);
			const displayW = result.width / 2;
			const displayH = result.height / 2;
			if (visual.shadow) {
				this._visualToIconId.set(visual, iconId);
				this._applyEffectsFromCanvas(iconId, result.canvas, displayW, displayH, anchor, visual);
				return iconId;
			}
			iconDef = {
				iconPath: '',
				canvas: result.canvas,
				width: displayW,
				height: displayH,
				anchorX: anchor.x * displayW,
				anchorY: anchor.y * displayH,
			};
		} else {
			console.warn(`GTMap: Visual type '${visual.type}' is not yet supported for rendering. Using default icon.`);
			return 'default';
		}

		if (iconDef) {
			this._deps.setIconDefs(Object.fromEntries([[iconId, iconDef]]));
			this._visualToSize.set(visual, { width: iconDef.width, height: iconDef.height });
		}

		this._visualToIconId.set(visual, iconId);
		return iconId;
	}

	getIconId(visual: Visual): string {
		return this._visualToIconId.get(visual) ?? 'default';
	}

	getScaledSize(visual: Visual, scale: number): { width: number; height: number } | undefined {
		if (isSpriteVisual(visual) && visual.size !== undefined) {
			const sz = resolveSize(visual.size);
			return { width: sz.width * scale, height: sz.height * scale };
		}
		const cachedSize = this._visualToSize.get(visual);
		if (cachedSize) {
			if (scale === 1) return undefined;
			return { width: cachedSize.width * scale, height: cachedSize.height * scale };
		}
		if (isImageVisual(visual)) {
			const sz = visual.getSize();
			if (scale === 1) return undefined;
			return { width: sz.width * scale, height: sz.height * scale };
		}
		return undefined;
	}

	/** Build effect options from base-class Visual properties. */
	private _buildEffectsOpts(visual: Visual): VisualEffectsOptions {
		return {
			...(visual.stroke != null ? { stroke: visual.stroke } : {}),
			...(visual.strokeWidth != null ? { strokeWidth: visual.strokeWidth } : {}),
			...(visual.shadow != null ? { shadow: visual.shadow } : {}),
		};
	}

	/** Apply effects synchronously using an already-rendered canvas as source. */
	private _applyEffectsFromCanvas(
		iconId: string,
		sourceCanvas: HTMLCanvasElement,
		srcW: number,
		srcH: number,
		anchor: { x: number; y: number },
		visual: Visual,
		region?: SpriteRegion,
	): void {
		const opts = this._buildEffectsOpts(visual);
		const result = applyVisualEffects(sourceCanvas, srcW, srcH, opts, region);
		const displayW = result.width / 2;
		const displayH = result.height / 2;
		const updatedDef: IconDefInternal = {
			iconPath: '',
			canvas: result.canvas,
			width: displayW,
			height: displayH,
			anchorX: anchor.x * displayW,
			anchorY: anchor.y * displayH,
		};
		this._deps.setIconDefs(Object.fromEntries([[iconId, updatedDef]]));
		this._visualToSize.set(visual, { width: displayW, height: displayH });
		this._deps.onVisualUpdated();
	}

	/** Apply effects on an icon loaded from a URL (image/sprite). Stays async. */
	private _applyEffectsFromIconUrl(
		iconId: string,
		iconUrl: string,
		srcW: number,
		srcH: number,
		anchor: { x: number; y: number },
		visual: Visual,
		region?: SpriteRegion,
	): void {
		const opts = this._buildEffectsOpts(visual);
		applyVisualEffectsAsync(iconUrl, srcW, srcH, opts, (result) => {
			if (!result.canvas.width) return;
			const displayW = result.width / 2;
			const displayH = result.height / 2;
			const updatedDef: IconDefInternal = {
				iconPath: '',
				canvas: result.canvas,
				width: displayW,
				height: displayH,
				anchorX: anchor.x * displayW,
				anchorY: anchor.y * displayH,
			};
			this._deps.setIconDefs(Object.fromEntries([[iconId, updatedDef]]));
			this._visualToSize.set(visual, { width: displayW, height: displayH });
			this._deps.onVisualUpdated();
		}, region);
	}

	/** Resolve sprite anchor, preserving atlas-provided anchors when visual anchor is left at default center. */
	private _resolveSpriteAnchor(
		visual: Visual,
		entry: { width: number; height: number; anchorX?: number; anchorY?: number } | undefined,
		w: number,
		h: number,
	): { x: number; y: number } {
		if (visual.anchor !== 'center') return resolveAnchor(visual.anchor);
		const baseW = entry?.width ?? w;
		const baseH = entry?.height ?? h;
		const anchorX = entry?.anchorX ?? baseW / 2;
		const anchorY = entry?.anchorY ?? baseH / 2;
		return { x: anchorX / baseW, y: anchorY / baseH };
	}

	private _ensureAtlasCanvas(handle: SpriteAtlasHandle): Promise<HTMLCanvasElement | null> {
		const cached = this._atlasCanvasCache.get(handle);
		if (cached) return Promise.resolve(cached);
		const pending = this._atlasCanvasPending.get(handle);
		if (pending) return pending;

		const task = this._loadAtlasCanvas(handle)
			.then((canvas) => {
				if (canvas) this._atlasCanvasCache.set(handle, canvas);
				this._atlasCanvasPending.delete(handle);
				return canvas;
			})
			.catch(() => {
				this._atlasCanvasPending.delete(handle);
				return null;
			});
		this._atlasCanvasPending.set(handle, task);
		return task;
	}

	private async _loadAtlasCanvas(handle: SpriteAtlasHandle): Promise<HTMLCanvasElement | null> {
		const response = await fetch(handle.url, { mode: 'cors', credentials: 'omit' });
		if (!response.ok) return null;
		const blob = await response.blob();
		const bitmap = await createImageBitmap(blob);
		try {
			const width = handle.descriptor.meta.size.width;
			const height = handle.descriptor.meta.size.height;
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) return null;
			ctx.clearRect(0, 0, width, height);
			ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, width, height);
			return canvas;
		} finally {
			try {
				bitmap.close();
			} catch {
				/* expected: bitmap may already be closed */
			}
		}
	}
}
