/**
 * IconAtlasManager -- texture loading, atlas management, UV rects, retina handling.
 */
import type { SpriteAtlasDescriptor } from '../../../api/types';
import type { IconMeta, IconSizeProvider } from './types';
import { IconMaskBuilder } from './icon-mask-builder';
import { createAtlas } from './icon-atlas';

export class IconAtlasManager implements IconSizeProvider {
	private textures = new Map<string, WebGLTexture>();
	private textures2x = new Map<string, WebGLTexture>();
	private texSize = new Map<string, { w: number; h: number }>();
	private texAnchor = new Map<string, { ax: number; ay: number }>();
	private _iconMeta = new Map<string, IconMeta>();
	private uvRect = new Map<string, { u0: number; v0: number; u1: number; v1: number }>();
	private uvRect2x = new Map<string, { u0: number; v0: number; u1: number; v1: number }>();
	private hasRetina = new Map<string, boolean>();
	private maskBuilder = new IconMaskBuilder();

	// -- Accessors --

	getSize(type: string): { w: number; h: number } {
		return this.texSize.get(type) || { w: 32, h: 32 };
	}

	getAnchor(type: string): { ax: number; ay: number } {
		const sz = this.getSize(type);
		return this.texAnchor.get(type) || { ax: sz.w / 2, ay: sz.h / 2 };
	}

	getMeta(type: string): IconMeta | undefined {
		return this._iconMeta.get(type);
	}

	/** Get the appropriate texture for a type (retina if available). */
	getTexture(type: string): WebGLTexture | undefined {
		const useRetina = this.hasRetina.get(type);
		if (useRetina && this.textures2x.has(type)) return this.textures2x.get(type);
		return this.textures.get(type);
	}

	/** Get the UV rect for a type (retina if available). */
	getUV(type: string): { u0: number; v0: number; u1: number; v1: number } {
		const useRetina = this.hasRetina.get(type);
		if (useRetina && this.uvRect2x.has(type)) return this.uvRect2x.get(type)!;
		return this.uvRect.get(type) || { u0: 0, v0: 0, u1: 1, v1: 1 };
	}

	// -- Loading --

	/**
	 * Load icon definitions into the atlas.
	 * @param gl - WebGL context for texture creation
	 * @param defs - Icon definitions keyed by icon ID
	 * @param opts - Options
	 * @param opts.replaceAll - If true, clears ALL existing icons and atlases before loading.
	 */
	async loadIcons(
		gl: WebGLRenderingContext,
		defs: Record<string, { iconPath: string; x2IconPath?: string; width: number; height: number; anchorX?: number; anchorY?: number }>,
		opts?: { replaceAll?: boolean },
	) {
		const entries = Object.entries(defs);

		// Collect old atlas textures for cleanup if doing a full replace
		let oldAtlases: Set<WebGLTexture> | null = null;
		if (opts?.replaceAll) {
			oldAtlases = new Set<WebGLTexture>();
			for (const t of this.textures.values()) if (t) oldAtlases.add(t);
			for (const t of this.textures2x.values()) if (t) oldAtlases.add(t);
			this.textures.clear();
			this.textures2x.clear();
			this.uvRect.clear();
			this.uvRect2x.clear();
			this.texSize.clear();
			this.texAnchor.clear();
			this._iconMeta.clear();
			this.hasRetina.clear();
			this.maskBuilder.reset();
		}

		// Track old textures for keys being updated (incremental mode) to avoid GL leaks
		const staleTextures = new Set<WebGLTexture>();
		if (!opts?.replaceAll) {
			for (const [key] of entries) {
				const old1x = this.textures.get(key);
				const old2x = this.textures2x.get(key);
				if (old1x) staleTextures.add(old1x);
				if (old2x) staleTextures.add(old2x);
			}
		}

		// Load both 1x and 2x images for each icon (in parallel)
		const imgs1x: Array<{ key: string; w: number; h: number; src: ImageBitmap | HTMLImageElement }> = [];
		const imgs2x: Array<{ key: string; w: number; h: number; src: ImageBitmap | HTMLImageElement }> = [];

		const loadTasks = entries.map(async ([key, d]) => {
			this.texSize.set(key, { w: d.width, h: d.height });
			this.texAnchor.set(key, { ax: d.anchorX ?? d.width / 2, ay: d.anchorY ?? d.height / 2 });
			this._iconMeta.set(key, {
				iconPath: d.iconPath,
				...(d.x2IconPath !== undefined ? { x2IconPath: d.x2IconPath } : {}),
				width: d.width,
				height: d.height,
				anchorX: d.anchorX ?? d.width / 2,
				anchorY: d.anchorY ?? d.height / 2,
			});

			let src2x: ImageBitmap | HTMLImageElement | null = null;
			if (d.x2IconPath) src2x = await this.loadImageSource(d.x2IconPath);
			if (src2x) {
				imgs2x.push({ key, w: d.width, h: d.height, src: src2x });
				this.hasRetina.set(key, true);
				this.maskBuilder.enqueue(key, src2x, d.width, d.height);
			} else {
				const src1x = await this.loadImageSource(d.iconPath);
				if (src1x) {
					imgs1x.push({ key, w: d.width, h: d.height, src: src1x });
					this.maskBuilder.enqueue(key, src1x, d.width, d.height);
				}
				this.hasRetina.set(key, false);
			}
		});
		await Promise.all(loadTasks);

		// Create 1x atlas
		if (imgs1x.length > 0) {
			const atlas1x = createAtlas(gl, imgs1x);
			if (atlas1x) {
				for (const [key, data] of atlas1x) {
					this.textures.set(key, data.tex);
					this.uvRect.set(key, data.uv);
				}
			}
		}

		// Create 2x atlas
		if (imgs2x.length > 0) {
			const atlas2x = createAtlas(gl, imgs2x);
			if (atlas2x) {
				for (const [key, data] of atlas2x) {
					this.textures2x.set(key, data.tex);
					this.uvRect2x.set(key, data.uv);
				}
			}
		}

		// Delete old atlases after new ones are created (only for full replace)
		if (oldAtlases) {
			for (const tex of oldAtlases) {
				try {
					gl.deleteTexture(tex);
				} catch {
					/* expected: GL context may be lost */
				}
			}
			this.maskBuilder.start();
		}

		// Delete stale textures from incremental updates (not referenced by any icon)
		if (staleTextures.size > 0) {
			const liveTextures = new Set<WebGLTexture>();
			for (const t of this.textures.values()) if (t) liveTextures.add(t);
			for (const t of this.textures2x.values()) if (t) liveTextures.add(t);
			for (const tex of staleTextures) {
				if (!liveTextures.has(tex)) {
					try {
						gl.deleteTexture(tex);
					} catch {
						/* expected: GL context may be lost */
					}
				}
			}
		}
	}

	/**
	 * Load a sprite atlas: single image + JSON descriptor.
	 * Creates one WebGL texture from the full image and registers each sprite
	 * with correct UV rects, sizes, anchors, and masks.
	 */
	async loadSpriteAtlas(gl: WebGLRenderingContext, atlasImageUrl: string, descriptor: SpriteAtlasDescriptor, atlasId: string): Promise<Record<string, string>> {
		const src = await this.loadImageSource(atlasImageUrl);
		if (!src) return {};

		// Create a single WebGL texture from the full atlas image
		const tex = gl.createTexture();
		if (!tex) return {};
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src as TexImageSource);

		const atlasW = descriptor.meta.size.width;
		const atlasH = descriptor.meta.size.height;
		const spriteIds: Record<string, string> = {};

		for (const [name, entry] of Object.entries(descriptor.sprites)) {
			const iconId = `${atlasId}/${name}`;
			spriteIds[name] = iconId;

			// Compute UV rect
			const u0 = entry.x / atlasW;
			const v0 = entry.y / atlasH;
			const u1 = (entry.x + entry.width) / atlasW;
			const v1 = (entry.y + entry.height) / atlasH;

			this.textures.set(iconId, tex);
			this.uvRect.set(iconId, { u0, v0, u1, v1 });
			this.texSize.set(iconId, { w: entry.width, h: entry.height });

			const ax = entry.anchorX ?? entry.width / 2;
			const ay = entry.anchorY ?? entry.height / 2;
			this.texAnchor.set(iconId, { ax, ay });
			this._iconMeta.set(iconId, {
				iconPath: atlasImageUrl,
				width: entry.width,
				height: entry.height,
				anchorX: ax,
				anchorY: ay,
			});
			this.hasRetina.set(iconId, false);

			// Enqueue mask building with crop rect for this sprite
			this.maskBuilder.enqueue(iconId, src, entry.width, entry.height, {
				sx: entry.x,
				sy: entry.y,
				sw: entry.width,
				sh: entry.height,
			});
		}

		this.maskBuilder.start();
		return spriteIds;
	}

	startMaskBuild() {
		this.maskBuilder.start();
	}

	getMaskInfo(type: string): { data: Uint8Array; w: number; h: number } | null {
		return this.maskBuilder.getMaskInfo(type);
	}

	// -- Image loading --

	private async loadImageSource(url: string): Promise<ImageBitmap | HTMLImageElement | null> {
		if (typeof fetch === 'function' && typeof createImageBitmap === 'function') {
			try {
				const r = await fetch(url, { mode: 'cors', credentials: 'omit' });
				if (!r.ok) throw new Error(`HTTP ${r.status}`);
				const blob = await r.blob();
				const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
				return bmp;
			} catch (err) {
				if (typeof console !== 'undefined' && console.debug) {
					console.debug('[icons] fetch+createImageBitmap failed for:', url, err);
				}
			}
		}
		try {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			(img as HTMLImageElement & { decoding?: 'async' | 'sync' | 'auto' }).decoding = 'async';
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject(new Error('icon load failed'));
				img.src = url;
			});
			return img;
		} catch (err) {
			if (typeof console !== 'undefined' && console.warn) {
				console.warn('[icons] Failed to load icon:', url, err);
			}
			return null;
		}
	}

	// -- Cleanup --

	dispose(gl: WebGLRenderingContext) {
		try {
			const unique = new Set<WebGLTexture>();
			for (const t of this.textures.values()) if (t) unique.add(t);
			for (const t of this.textures2x.values()) if (t) unique.add(t);
			for (const tex of unique) {
				try {
					gl.deleteTexture(tex);
				} catch {
					/* expected: GL context may be lost */
				}
			}
		} catch {
			/* expected: GL context may be lost */
		}
		this.textures.clear();
		this.textures2x.clear();
		this.uvRect.clear();
		this.uvRect2x.clear();
		this.hasRetina.clear();
		this.texSize.clear();
		this.texAnchor.clear();
		this._iconMeta.clear();
	}
}
