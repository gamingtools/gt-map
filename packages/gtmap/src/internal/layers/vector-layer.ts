/**
 * VectorLayer handles vector drawing on Canvas 2D and WebGL overlay compositing.
 */

import * as Coords from '../coords';
import type { VectorPrimitive, VectorStyle } from '../types';

import { OverlayRenderer } from './vectors/overlay-renderer';

export interface VectorLayerDeps {
	getContainer(): HTMLDivElement;
	getGL(): WebGLRenderingContext;
	getDpr(): number;
	getZoom(): number;
	getCenter(): { lng: number; lat: number };
	getImageMaxZoom(): number;
}

export class VectorLayer {
	private _vectorCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
	private _vectorCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
	private _vectorOverlay: OverlayRenderer | null = null;
	private _vectors: VectorPrimitive[] = [];

	constructor(private deps: VectorLayerDeps) {}

	/**
	 * Initialize the vector canvas (OffscreenCanvas if available, otherwise hidden HTMLCanvasElement).
	 */
	init(): void {
		const container = this.deps.getContainer();
		const rect = container.getBoundingClientRect();
		const dpr = this.deps.getDpr();
		const w = Math.max(1, Math.floor(rect.width * dpr));
		const h = Math.max(1, Math.floor(rect.height * dpr));

		// Use OffscreenCanvas if available, otherwise hidden HTMLCanvasElement
		if (typeof OffscreenCanvas !== 'undefined') {
			this._vectorCanvas = new OffscreenCanvas(w, h);
			this._vectorCtx = this._vectorCanvas.getContext('2d');
		} else {
			const c = document.createElement('canvas');
			c.width = w;
			c.height = h;
			this._vectorCanvas = c;
			this._vectorCtx = c.getContext('2d');
		}

		// Initialize overlay renderer for WebGL compositing
		const gl = this.deps.getGL();
		if (!this._vectorOverlay && gl) {
			this._vectorOverlay = new OverlayRenderer(gl);
		}
	}

	/**
	 * Ensure the vector canvas matches the current container size.
	 */
	private _ensureOverlaySizes(): void {
		const container = this.deps.getContainer();
		const rect = container.getBoundingClientRect();
		const wCSS = Math.max(1, rect.width | 0);
		const hCSS = Math.max(1, rect.height | 0);
		const dpr = this.deps.getDpr();
		const wPx = Math.max(1, Math.round(wCSS * dpr));
		const hPx = Math.max(1, Math.round(hCSS * dpr));

		if (this._vectorCanvas && (this._vectorCanvas.width !== wPx || this._vectorCanvas.height !== hPx)) {
			this._vectorCanvas.width = wPx;
			this._vectorCanvas.height = hPx;
		}
	}

	/**
	 * Set the vectors to draw.
	 */
	setVectors(vectors: VectorPrimitive[]): void {
		this._vectors = vectors.slice();
	}

	/**
	 * Get the current vectors.
	 */
	getVectors(): VectorPrimitive[] {
		return this._vectors;
	}

	/**
	 * Check if there are any vectors.
	 */
	hasVectors(): boolean {
		return this._vectors.length > 0;
	}

	/**
	 * Get the overlay renderer for WebGL compositing.
	 */
	getOverlay(): OverlayRenderer | null {
		return this._vectorOverlay;
	}

	/**
	 * Draw vectors to the canvas and upload to WebGL overlay.
	 */
	draw(): void {
		if (!this._vectorCtx) this.init();
		if (!this._vectorCanvas || !this._vectorCtx) return;

		this._ensureOverlaySizes();
		const ctx = this._vectorCtx;
		const canvas = this._vectorCanvas;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.save();
		try {
			ctx.scale(this.deps.getDpr() || 1, this.deps.getDpr() || 1);
		} catch {}

		if (this._vectors.length) {
			const z = this.deps.getZoom();
			const container = this.deps.getContainer();
			const rect = container.getBoundingClientRect();
			const viewport = { x: rect.width, y: rect.height };
			const imageMaxZ = this.deps.getImageMaxZoom();
			const center = this.deps.getCenter();

			// Subtle zoom-based stroke scaling: ~8% per zoom level, clamped
			const refZoom = 2;
			const zoomScale = Math.max(0.6, Math.min(1.8, 1 + (z - refZoom) * 0.08));

			for (const prim of this._vectors) {
				const style = (prim.style ?? {}) as VectorStyle;
				const baseWeight = style.weight ?? 2;
				ctx.lineWidth = Math.max(1, baseWeight * zoomScale);
				ctx.strokeStyle = style.color || 'rgba(0,0,0,0.85)';
				ctx.globalAlpha = style.opacity ?? 1;

				const begin = () => ctx.beginPath();
				const finishStroke = () => ctx.stroke();
				const finishFill = () => {
					if (style.fill) {
						ctx.globalAlpha = style.fillOpacity ?? 0.25;
						ctx.fillStyle = style.fillColor || style.color || 'rgba(0,0,0,0.25)';
						ctx.fill();
						ctx.globalAlpha = style.opacity ?? 1;
					}
				};

				if (prim.type === 'polyline' || prim.type === 'polygon') {
					const pts = prim.points as Array<{ lng: number; lat: number }>;
					if (!pts.length) continue;
					begin();
					for (let i = 0; i < pts.length; i++) {
						const p = pts[i];
						const css = Coords.worldToCSS({ x: p.lng, y: p.lat }, z, { x: center.lng, y: center.lat }, viewport, imageMaxZ);
						if (i === 0) ctx.moveTo(css.x, css.y);
						else ctx.lineTo(css.x, css.y);
					}
					if (prim.type === 'polygon') ctx.closePath();
					finishStroke();
					finishFill();
				} else if (prim.type === 'circle') {
					const c = prim.center as { lng: number; lat: number };
					const css = Coords.worldToCSS({ x: c.lng, y: c.lat }, z, { x: center.lng, y: center.lat }, viewport, imageMaxZ);
					// Radius: specified in native px; convert to CSS using current zInt/scale
					const { zInt, scale } = Coords.zParts(z);
					const s = Coords.sFor(imageMaxZ as number, zInt);
					const rCss = ((prim.radius as number) / s) * scale;
					begin();
					ctx.arc(css.x, css.y, rCss, 0, Math.PI * 2);
					finishStroke();
					finishFill();
				}
			}
		}
		ctx.restore();

		// Upload to WebGL overlay (drawing happens via IconRenderer z-index callback)
		if (this._vectorOverlay && this._vectors.length) {
			this._vectorOverlay.uploadCanvas(canvas);
		}
	}

	/**
	 * Draw the overlay to the WebGL context.
	 */
	drawOverlay(): void {
		if (!this._vectorOverlay || !this._vectorCanvas) return;
		this._vectorOverlay.draw();
	}

	/**
	 * Resize the vector canvas.
	 */
	resize(w: number, h: number): void {
		if (this._vectorCanvas) {
			// OffscreenCanvas doesn't have style; just resize the buffer
			if (this._vectorCanvas instanceof HTMLCanvasElement) {
				const cssW = Math.round(w / this.deps.getDpr());
				const cssH = Math.round(h / this.deps.getDpr());
				this._vectorCanvas.style.width = cssW + 'px';
				this._vectorCanvas.style.height = cssH + 'px';
			}
			if (this._vectorCanvas.width !== w || this._vectorCanvas.height !== h) {
				this._vectorCanvas.width = w;
				this._vectorCanvas.height = h;
			}
		}
	}

	/**
	 * Clean up resources.
	 */
	dispose(): void {
		if (this._vectorCanvas) {
			// OffscreenCanvas doesn't need removal from DOM
			if (this._vectorCanvas instanceof HTMLCanvasElement) {
				try {
					this._vectorCanvas.remove();
				} catch {}
			}
			this._vectorCanvas = null;
			this._vectorCtx = null;
		}
		if (this._vectorOverlay) {
			this._vectorOverlay.dispose();
			this._vectorOverlay = null;
		}
		this._vectors = [];
	}
}
