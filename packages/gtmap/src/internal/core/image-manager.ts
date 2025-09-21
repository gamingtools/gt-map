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
	preview?: {
		url: string;
		width: number;
		height: number;
	};
	progressiveSwapDelayMs?: number;
}

export interface ImageManagerHost {
	readonly gl: WebGLRenderingContext;
	useImageBitmap: boolean;
	_log(msg: string): void;
	_nowMs(): number;
	_isPowerOfTwo(value: number): boolean;
	_gpuWaitEnabled(): boolean;
	onImageReady(): void;
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

			// Check if this load is still current. For progressive flows, allow a stale
			// (older) preview load to commit if no texture has been committed yet.
			if (token !== this._imageLoadToken) {
				if (this._image.texture) {
					this.host._log('image:load stale; ignoring');
					return;
				} else {
					this.host._log('image:load stale but no texture yet; committing preview');
				}
			}

			// Create WebGL texture and upload. For large images, perform a chunked upload
			// across animation frames to mitigate long main-thread stalls.
			const gl = this.host.gl;
			const width = Math.max(1, nextDims?.width ?? this._image.width);
			const height = Math.max(1, nextDims?.height ?? this._image.height);

			const isBitmap = (obj: unknown): obj is ImageBitmap => {
				return !!obj && typeof (obj as ImageBitmap).close === 'function';
			};

			const shouldChunk = typeof createImageBitmap === 'function' && width >= 2048 && height >= 2048 && isBitmap(bitmap);

			if (shouldChunk) {
				const newTex = gl.createTexture();
				if (!newTex) throw new Error('Failed to create WebGL texture');
				gl.bindTexture(gl.TEXTURE_2D, newTex);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				// Allocate storage first
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Math.max(1, width), Math.max(1, height), 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

				try {
					await this._uploadChunked(gl, newTex, bitmap as ImageBitmap, width, height);
				} catch {
					// Fallback: single upload if chunked path fails
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap as TexImageSource);
				} finally {
					gl.bindTexture(gl.TEXTURE_2D, null);
				}

				// Swap textures atomically after upload completes
				const oldTex = this._image.texture;
				if (nextDims && Number.isFinite(nextDims.width) && Number.isFinite(nextDims.height)) {
					this._image.width = Math.max(1, Math.floor(nextDims.width));
					this._image.height = Math.max(1, Math.floor(nextDims.height));
					this._image.url = url;
				}
				this._image.texture = newTex;
				this._image.ready = true;
				this._imageReadyAtMs = this.host._nowMs();
				if (oldTex) {
					try {
						gl.deleteTexture(oldTex);
					} catch {}
				}
			} else {
				// Single upload path
				const texture = gl.createTexture();
				if (!texture) throw new Error('Failed to create WebGL texture');
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap as TexImageSource);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.bindTexture(gl.TEXTURE_2D, null);

				if (this._image.texture) {
					gl.deleteTexture(this._image.texture);
				}
				if (nextDims && Number.isFinite(nextDims.width) && Number.isFinite(nextDims.height)) {
					this._image.width = Math.max(1, Math.floor(nextDims.width));
					this._image.height = Math.max(1, Math.floor(nextDims.height));
					this._image.url = url;
				}
				this._image.texture = texture;
				this._image.ready = true;
				this._imageReadyAtMs = this.host._nowMs();
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

	private async _uploadChunked(gl: WebGLRenderingContext, tex: WebGLTexture, source: ImageBitmap, width: number, height: number): Promise<void> {
		const stripeH = Math.max(128, Math.min(1024, Math.floor(height / 8)));
		for (let y = 0; y < height; y += stripeH) {
			const h = Math.min(stripeH, height - y);
			let sub: ImageBitmap | null = null;
			try {
				sub = await createImageBitmap(source, 0, y, width, h, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
			} catch {
				// If cropping fails, fall back to uploading the full image in one go
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
				return;
			}
			await new Promise<void>((resolve) => {
				const step = () => {
					try {
						gl.bindTexture(gl.TEXTURE_2D, tex);
						gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, gl.RGBA, gl.UNSIGNED_BYTE, sub);
					} catch {}
					try {
						sub.close?.();
					} catch {}
					resolve();
				};
				if (typeof requestAnimationFrame === 'function') requestAnimationFrame(step);
				else setTimeout(step, 0);
			});
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
