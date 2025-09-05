export interface TileLoaderDeps {
	addPending(key: string): void;
	removePending(key: string): void;
	incInflight(): void;
	decInflight(): void;
	setLoading(key: string): void;
	setError(key: string): void;
	setReady(key: string, tex: WebGLTexture, width: number, height: number, frame: number): void;
	getGL(): WebGLRenderingContext;
	getFrame(): number;
	requestRender(): void;
	getUseImageBitmap(): boolean;
	setUseImageBitmap(v: boolean): void;
	acquireTexture(): WebGLTexture | null;
}

export class TileLoader {
	private deps: TileLoaderDeps;
	private abortControllers = new Map<string, AbortController>();

	constructor(deps: TileLoaderDeps) {
		this.deps = deps;
	}

	cancel(key: string) {
		const controller = this.abortControllers.get(key);
		if (controller) {
			controller.abort();
			this.abortControllers.delete(key);
		}
	}

	cancelAll() {
		for (const controller of this.abortControllers.values()) {
			controller.abort();
		}
		this.abortControllers.clear();
	}

	start({ key, url }: { key: string; url: string }) {
		const deps = this.deps;
		
		// Cancel any existing request for this key
		this.cancel(key);
		
		// Create new abort controller
		const abortController = new AbortController();
		this.abortControllers.set(key, abortController);
		
		deps.addPending(key);
		deps.incInflight();
		deps.setLoading(key);
		
		const onFinally = () => {
			try {
				/* noop */
			} finally {
				this.abortControllers.delete(key);
				deps.removePending(key);
				deps.decInflight();
			}
		};
		
		if (deps.getUseImageBitmap()) {
			fetch(url, { 
				mode: 'cors', 
				credentials: 'omit',
				signal: abortController.signal 
			} as any)
				.then((r: any) => {
					if (!r.ok) throw new Error(`HTTP ${r.status}`);
					return r.blob();
				})
				.then((blob: any) =>
					(self as any).createImageBitmap(blob, {
						premultiplyAlpha: 'none',
						colorSpaceConversion: 'none',
					}),
				)
				.then((bmp: any) => {
					try {
						const gl: WebGLRenderingContext = deps.getGL();
						const tex = deps.acquireTexture();
						if (!tex) {
							deps.setError(key);
							return;
						}
						gl.bindTexture(gl.TEXTURE_2D, tex);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
						gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
						gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp as any);
						gl.generateMipmap(gl.TEXTURE_2D);
						deps.setReady(key, tex, (bmp as any).width, (bmp as any).height, deps.getFrame());
						deps.requestRender();
					} finally {
						try {
							(bmp as any).close?.();
						} catch {}
						onFinally();
					}
				})
				.catch((err) => {
					if (err.name === 'AbortError') {
						// Request was cancelled, clean up silently
						onFinally();
					} else {
						deps.setUseImageBitmap(false);
						this.start({ key, url });
					}
				});
			return;
		}
		
		const img: any = new Image();
		img.crossOrigin = 'anonymous';
		img.decoding = 'async';
		
		// Handle abort for image loading
		const onAbort = () => {
			img.src = '';
			img.onload = null;
			img.onerror = null;
			onFinally();
		};
		
		// Listen for abort signal
		if (abortController.signal.aborted) {
			onAbort();
			return;
		}
		abortController.signal.addEventListener('abort', onAbort);
		
		img.onload = () => {
			abortController.signal.removeEventListener('abort', onAbort);
			try {
				const gl: WebGLRenderingContext = deps.getGL();
				const tex = deps.acquireTexture();
				if (!tex) {
					deps.setError(key);
					return;
				}
				gl.bindTexture(gl.TEXTURE_2D, tex);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
				gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img as any);
				gl.generateMipmap(gl.TEXTURE_2D);
				deps.setReady(key, tex, (img as any).naturalWidth, (img as any).naturalHeight, deps.getFrame());
				deps.requestRender();
			} finally {
				onFinally();
			}
		};
		img.onerror = () => {
			abortController.signal.removeEventListener('abort', onAbort);
			deps.setError(key);
			onFinally();
		};
		img.src = url;
	}
}
