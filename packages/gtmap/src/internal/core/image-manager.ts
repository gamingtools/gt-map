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

	/**
	 * Compute maximum zoom level for an image based on its dimensions
	 */
	computeImageMaxZoom(width: number, height: number): number {
		const baseGridSize = 256;
		const maxDim = Math.max(width, height);
		if (maxDim <= baseGridSize) return 0;
		return Math.ceil(Math.log2(maxDim / baseGridSize));
	}

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

			// Create WebGL texture
			const gl = this.host.gl;
			const texture = gl.createTexture();
			if (!texture) {
				throw new Error('Failed to create WebGL texture');
			}

			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.bindTexture(gl.TEXTURE_2D, null);

			// Update image state
			if (this._image.texture) {
				gl.deleteTexture(this._image.texture);
			}
			// If caller provided new intrinsic dimensions (e.g., upgrading preview -> full),
			// apply them atomically with the texture swap to keep uniforms coherent.
			if (nextDims && Number.isFinite(nextDims.width) && Number.isFinite(nextDims.height)) {
				this._image.width = Math.max(1, Math.floor(nextDims.width));
				this._image.height = Math.max(1, Math.floor(nextDims.height));
				this._image.url = url;
			}
			this._image.texture = texture;
			this._image.ready = true;
			this._imageReadyAtMs = this.host._nowMs();

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
