/**
 * ImageManager - Handles image loading, texture management, and progressive loading
 * Extracted from mapgl.ts to reduce class complexity and improve maintainability
 */

export interface ImageData {
	url: string;
	width: number;
	height: number;
	texture: WebGLTexture | null;
	ready: boolean;
	version: number;
}

export interface ImageLoadOptions {
	url: string;
	width: number;
	height: number;
}

export interface ImageManagerHost {
	readonly gl: WebGLRenderingContext;
	useImageBitmap: boolean;
	_log(msg: string): void;
	_nowMs(): number;
	_isPowerOfTwo(value: number): boolean;
	_gpuWaitEnabled(): boolean;
	onImageReady(): void;
	/** Whether the app is currently idle (no interactions/animations). Used to gate heavy uploads. */
	isIdle(): boolean;
	/** Visible vertical range in image pixel coordinates. */
	getVisibleYRangePx(): { y0: number; y1: number };
}

export class ImageManager {
	private host: ImageManagerHost;
	private _image: ImageData = {
		url: '',
		width: 256,
		height: 256,
		texture: null,
		ready: false,
		version: 0,
	};
	private _imageLoadToken = 0;
	private _imageReadyAtMs: number | null = null;

	// Heuristics for platform quirks
	private _isIOSWebKit(): boolean {
		try {
			if (typeof navigator === 'undefined') return false;
			const ua = navigator.userAgent || '';
			// Both Safari and Chrome on iOS use WebKit
			return /iP(hone|ad|od)/.test(ua) && /WebKit/.test(ua);
		} catch {
			return false;
		}
	}

	private _preferCanvasChunkUpload(): boolean {
		// On iOS WebKit, creating many ImageBitmap sub-rects can be memory-intensive.
		// Prefer a single reusable 2D canvas for stripe uploads.
		return this._isIOSWebKit();
	}

	constructor(host: ImageManagerHost) {
		this.host = host;
	}

	get image(): ImageData {
		return this._image;
	}

	get imageReadyAtMs(): number | null {
		return this._imageReadyAtMs;
	}

	// Note: max zoom computation is owned by MapGL; keep ImageManager focused on I/O

	/**
	 * Set a new image source and begin loading
	 */
	setImage(options: ImageLoadOptions | { url: string; width: number; height: number }): void {
		const { url, width, height } = options;
		this._image = {
			url,
			width: Math.max(1, width),
			height: Math.max(1, height),
			texture: null,
			ready: false,
			version: this._image.version + 1,
		};
		this._imageLoadToken++;
		this._loadImage(url, this._imageLoadToken);
	}

	/**
	 * Load image from URL
	 */
	async loadImage(url: string, nextDims?: { width: number; height: number }): Promise<void> {
		const token = ++this._imageLoadToken;
		return this._loadImage(url, token, nextDims);
	}

	/**
	 * Get current image data
	 */
	getImage(): ImageData {
		return this._image;
	}

	/**
	 * Load and create texture from image URL
	 */
	private async _loadImage(url: string, token: number, nextDims?: { width: number; height: number }): Promise<void> {
		const tStart = this.host._nowMs();
		this.host._log(`image:load begin url=${url}`);

		try {
			let bitmap: ImageBitmap | HTMLImageElement | null = null;

			// Try fetch + createImageBitmap first (better performance and CORS handling)
			if (this.host.useImageBitmap && typeof fetch === 'function' && typeof createImageBitmap === 'function') {
				try {
					this.host._log(`image:load path=fetch+createImageBitmap`);
					const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
					if (!response.ok) {
						throw new Error(`HTTP ${response.status}: ${response.statusText}`);
					}
					const blob = await response.blob();
					const tDecode0 = this.host._nowMs();
					bitmap = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
					const tDecode1 = this.host._nowMs();
					this.host._log(`image:decode done path=bitmap dt=${(tDecode1 - tDecode0).toFixed(1)}ms total=${(tDecode1 - tStart).toFixed(1)}ms`);
				} catch (err) {
					this.host.useImageBitmap = false;
					this.host._log('image:bitmap path failed; falling back to <img>');
					if (typeof console !== 'undefined' && console.debug) {
						console.debug('[ImageManager] fetch+createImageBitmap failed for:', url, err);
					}
				}
			}

			// Fallback to Image element
			if (!bitmap) {
				try {
					this.host._log(`image:load path=img`);
					const img = new Image();
					img.crossOrigin = 'anonymous';
					(img as HTMLImageElement & { decoding?: 'async' | 'sync' | 'auto' }).decoding = 'async';
					await new Promise<void>((resolve, reject) => {
						img.onload = () => resolve();
						img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
						img.src = url;
					});
					bitmap = img;
				} catch (err) {
					if (typeof console !== 'undefined' && console.warn) {
						console.warn('[ImageManager] Failed to load image:', url, err);
					}
					return;
				}
			}

			// Check if this load is still current. Ignore stale loads.
			if (token !== this._imageLoadToken) {
				this.host._log('image:load stale; ignoring');
				return;
			}

			// Create WebGL texture and upload. For large images, perform a chunked upload
			// across animation frames to mitigate long main-thread stalls.
			const gl = this.host.gl;
			const reqW = Math.max(1, nextDims?.width ?? this._image.width);
			const reqH = Math.max(1, nextDims?.height ?? this._image.height);
			let width = reqW;
			let height = reqH;
			// Clamp to MAX_TEXTURE_SIZE while preserving aspect ratio
			let maxTex = 8192;
			try {
				maxTex = Math.max(1, (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) | 0);
			} catch {}
			if (reqW > maxTex || reqH > maxTex) {
				const scale = Math.max(1e-6, Math.min(maxTex / reqW, maxTex / reqH));
				const tw = Math.max(1, Math.floor(reqW * scale));
				const th = Math.max(1, Math.floor(reqH * scale));
				if (tw !== reqW || th !== reqH) {
					this.host._log(`image:downscale due to MAX_TEXTURE_SIZE=${maxTex} requested=${reqW}x${reqH} target=${tw}x${th}`);
					width = tw;
					height = th;
				}
			}

			const isBitmap = (obj: unknown): obj is ImageBitmap => {
				return !!obj && typeof (obj as ImageBitmap).close === 'function';
			};

			// Allow chunking either with ImageBitmap (cropped sub-bitmaps) or via a reusable 2D canvas
			const needsScale = width !== reqW || height !== reqH;
			const canUseBitmapChunk = typeof createImageBitmap === 'function' && isBitmap(bitmap);
			const canUseCanvasChunk = this._preferCanvasChunkUpload() || needsScale;
			const shouldChunk = width >= 2048 && height >= 2048 && (canUseBitmapChunk || canUseCanvasChunk);

			if (shouldChunk) {
				const chunkMode = canUseBitmapChunk && !needsScale && !this._preferCanvasChunkUpload() ? 'chunked-bitmap' : 'chunked-canvas';
				this.host._log(`image:upload path=${chunkMode} source=${isBitmap(bitmap) ? 'bitmap' : 'img'} size=${width}x${height}`);
				const newTex = gl.createTexture();
				if (!newTex) throw new Error('Failed to create WebGL texture');
				gl.bindTexture(gl.TEXTURE_2D, newTex);
				// Upload defaults optimized for raster
				try {
					gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
					const gle = gl as WebGLRenderingContext & {
						UNPACK_COLORSPACE_CONVERSION_WEBGL?: number;
						UNPACK_PREMULTIPLY_ALPHA_WEBGL?: number;
						UNPACK_FLIP_Y_WEBGL?: number;
						NONE?: number;
					};
					if (gle.UNPACK_COLORSPACE_CONVERSION_WEBGL != null && gle.NONE != null) {
						gl.pixelStorei(gle.UNPACK_COLORSPACE_CONVERSION_WEBGL, gle.NONE);
					}
					if (gle.UNPACK_PREMULTIPLY_ALPHA_WEBGL != null) gl.pixelStorei(gle.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
					if (gle.UNPACK_FLIP_Y_WEBGL != null) gl.pixelStorei(gle.UNPACK_FLIP_Y_WEBGL, 0);
				} catch {}
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				// Allocate storage first
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Math.max(1, width), Math.max(1, height), 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

				try {
					await this._uploadChunked(gl, newTex, (bitmap as ImageBitmap | HTMLImageElement)!, width, height, chunkMode);
				} catch {
					// Fallback: single upload if chunked path fails
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap as TexImageSource);
				} finally {
					gl.bindTexture(gl.TEXTURE_2D, null);
				}

				// Swap textures atomically after upload completes
				const oldTex = this._image.texture;
				const upgradingFromPreview = !!oldTex && this._image.url !== url;
				if (nextDims && Number.isFinite(nextDims.width) && Number.isFinite(nextDims.height)) {
					this._image.width = Math.max(1, Math.floor(nextDims.width));
					this._image.height = Math.max(1, Math.floor(nextDims.height));
					this._image.url = url;
				}
				this._image.texture = newTex;
				this._image.ready = true;
				this._imageReadyAtMs = this.host._nowMs();
				this.host._log(`image:swap committed upgrade=${upgradingFromPreview ? 'preview->full' : 'replace'} url=${url}`);
				if (oldTex) {
					try {
						gl.deleteTexture(oldTex);
					} catch {}
				}
			} else {
				// Single upload path
				this.host._log(`image:upload path=single source=${isBitmap(bitmap) ? 'bitmap' : 'img'} size=${width}x${height}`);
				const texture = gl.createTexture();
				if (!texture) throw new Error('Failed to create WebGL texture');
				gl.bindTexture(gl.TEXTURE_2D, texture);
				// Upload defaults optimized for raster
				try {
					gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
					const gle = gl as WebGLRenderingContext & {
						UNPACK_COLORSPACE_CONVERSION_WEBGL?: number;
						UNPACK_PREMULTIPLY_ALPHA_WEBGL?: number;
						UNPACK_FLIP_Y_WEBGL?: number;
						NONE?: number;
					};
					if (gle.UNPACK_COLORSPACE_CONVERSION_WEBGL != null && gle.NONE != null) {
						gl.pixelStorei(gle.UNPACK_COLORSPACE_CONVERSION_WEBGL, gle.NONE);
					}
					if (gle.UNPACK_PREMULTIPLY_ALPHA_WEBGL != null) gl.pixelStorei(gle.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
					if (gle.UNPACK_FLIP_Y_WEBGL != null) gl.pixelStorei(gle.UNPACK_FLIP_Y_WEBGL, 0);
				} catch {}
				if (width !== reqW || height !== reqH) {
					// Scale once via canvas to target size before single upload
					try {
						const cnv = document.createElement('canvas');
						cnv.width = Math.max(1, width);
						cnv.height = Math.max(1, height);
						const ctx = cnv.getContext('2d');
						if (ctx) {
							ctx.clearRect(0, 0, cnv.width, cnv.height);
							const srcW = 'width' in (bitmap as ImageBitmap | HTMLImageElement) ? (bitmap as ImageBitmap).width : (bitmap as HTMLImageElement).naturalWidth;
							const srcH = 'height' in (bitmap as ImageBitmap | HTMLImageElement) ? (bitmap as ImageBitmap).height : (bitmap as HTMLImageElement).naturalHeight;
							ctx.drawImage(bitmap as CanvasImageSource, 0, 0, srcW, srcH, 0, 0, width, height);
							gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cnv);
						} else {
							gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap as TexImageSource);
						}
					} catch {
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap as TexImageSource);
					}
				} else {
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap as TexImageSource);
				}
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.bindTexture(gl.TEXTURE_2D, null);

				if (this._image.texture) {
					gl.deleteTexture(this._image.texture);
				}
				const upgradingFromPreview = !!this._image.texture && this._image.url !== url;
				if (nextDims && Number.isFinite(nextDims.width) && Number.isFinite(nextDims.height)) {
					this._image.width = Math.max(1, Math.floor(nextDims.width));
					this._image.height = Math.max(1, Math.floor(nextDims.height));
					this._image.url = url;
				}
				this._image.texture = texture;
				this._image.ready = true;
				this._imageReadyAtMs = this.host._nowMs();
				this.host._log(`image:swap committed upgrade=${upgradingFromPreview ? 'preview->full' : 'replace'} url=${url}`);
			}

			const tEnd = this.host._nowMs();
			this.host._log(`image:load done dt=${(tEnd - tStart).toFixed(1)}ms ready=${this._image.ready}`);

			// Notify host that image is ready
			this.host.onImageReady();
		} catch (err) {
			this.host._log(`image:load error: ${err}`);
			if (typeof console !== 'undefined' && console.error) {
				console.error('[ImageManager] Image load failed:', url, err);
			}
		}
	}

	private async _uploadChunked(
		gl: WebGLRenderingContext,
		tex: WebGLTexture,
		source: ImageBitmap | HTMLImageElement,
		width: number,
		height: number,
		mode: 'chunked-bitmap' | 'chunked-canvas',
	): Promise<void> {
		// Smaller stripes on iOS to reduce per-frame upload and memory pressure
		const baseStripe = Math.floor(height / 8) || 1;
		const targetStripe = mode === 'chunked-canvas' ? Math.min(512, Math.max(64, Math.floor(height / 16))) : Math.min(1024, baseStripe);
		const minStripe = 64;
		const maxStripe = mode === 'chunked-canvas' ? 512 : 1024;
		let stripeH = Math.max(minStripe, Math.min(maxStripe, targetStripe));
		const logicalStripe = stripeH; // logical segments for prioritization
		const budgetMs = this._isIOSWebKit() ? 5 : 8; // target per-frame CPU time for upload call

		let tileCnv: HTMLCanvasElement | null = null;
		let tileCtx: CanvasRenderingContext2D | null = null;
		if (mode === 'chunked-canvas') {
			tileCnv = document.createElement('canvas');
			tileCnv.width = Math.max(1, width);
			tileCnv.height = Math.max(1, stripeH);
			tileCtx = tileCnv.getContext('2d');
		}
		// Build prioritized segment list based on current visible Y-range
		type Segment = { y: number; h: number; done: boolean };
		const segments: Segment[] = [];
		for (let y0 = 0; y0 < height; y0 += logicalStripe) {
			const h0 = Math.min(logicalStripe, height - y0);
			segments.push({ y: y0, h: h0, done: false });
		}

		let remaining = segments.length;
		const pickNextIndex = (): number => {
			const vis = this.host.getVisibleYRangePx();
			const center = (vis.y0 + vis.y1) * 0.5;
			let best = -1;
			let bestDist = Number.POSITIVE_INFINITY;
			for (let i = 0; i < segments.length; i++) {
				const seg = segments[i];
				if (seg.done) continue;
				const a = seg.y;
				const b = seg.y + seg.h;
				let dist = 0;
				if (b < vis.y0) dist = vis.y0 - b;
				else if (a > vis.y1) dist = a - vis.y1;
				else dist = Math.abs((a + b) * 0.5 - center);
				if (dist < bestDist) {
					bestDist = dist;
					best = i;
				}
			}
			return best;
		};

		while (remaining > 0) {
			const idx = pickNextIndex();
			if (idx < 0) break;
			const seg = segments[idx];
			// Upload this segment in adaptive sub-chunks
			let offset = 0;
			while (offset < seg.h) {
				const chunkH = Math.min(stripeH, seg.h - offset);
				await new Promise<void>((resolve) => {
					const step = async () => {
						try {
							// Defer uploads while interacting/animating
							if (!this.host.isIdle()) {
								if (typeof requestAnimationFrame === 'function') requestAnimationFrame(step);
								else setTimeout(step, 16);
								return;
							}
							gl.bindTexture(gl.TEXTURE_2D, tex);
							const yStart = seg.y + offset;
							const t0 = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
							if (mode === 'chunked-bitmap') {
								let sub: ImageBitmap | null = null;
								try {
									sub = await createImageBitmap(source as ImageBitmap, 0, yStart, width, chunkH, {
										premultiplyAlpha: 'none',
										colorSpaceConversion: 'none',
									});
								} catch {
									gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source as TexImageSource);
									resolve();
									return;
								}
								try {
									gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, yStart, gl.RGBA, gl.UNSIGNED_BYTE, sub);
								} catch {}
								try {
									sub.close?.();
								} catch {}
							} else {
								if (tileCtx && tileCnv) {
									if (tileCnv.height !== chunkH) tileCnv.height = chunkH;
									tileCtx.clearRect(0, 0, tileCnv.width, tileCnv.height);
									try {
										tileCtx.drawImage(source as CanvasImageSource, 0, yStart, width, chunkH, 0, 0, width, chunkH);
									} catch {}
									try {
										gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, yStart, gl.RGBA, gl.UNSIGNED_BYTE, tileCnv);
									} catch {}
								}
							}
							const t1 = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
							const dt = t1 - t0;
							if (Number.isFinite(dt)) {
								if (dt > budgetMs && stripeH > minStripe) {
									const prev = stripeH;
									stripeH = Math.max(minStripe, Math.floor(stripeH * 0.75));
									this.host._log(`image:upload adapt stripeH ${prev}->${stripeH} dt=${dt.toFixed(2)}ms budget=${budgetMs}ms`);
								} else if (dt < budgetMs * 0.5 && stripeH < maxStripe) {
									const prev = stripeH;
									stripeH = Math.min(maxStripe, Math.floor(stripeH * 1.25));
									this.host._log(`image:upload adapt stripeH ${prev}->${stripeH} dt=${dt.toFixed(2)}ms budget=${budgetMs}ms`);
								}
							}
							resolve();
						} catch {
							resolve();
						}
					};
					if (typeof requestAnimationFrame === 'function') requestAnimationFrame(step);
					else setTimeout(step, 0);
				});
				offset += chunkH;
			}
			segments[idx].done = true;
			remaining--;
		}
	}

	/**
	 * Cleanup resources
	 */
	dispose(): void {
		if (this._image.texture) {
			this.host.gl.deleteTexture(this._image.texture);
			this._image.texture = null;
		}
		this._image.ready = false;
		this._imageReadyAtMs = null;
	}
}
