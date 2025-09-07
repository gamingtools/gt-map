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
  /** True when user is not actively interacting (pan/zoom) for a short debounce. */
  isIdle(): boolean;
}

interface QueuedTile {
	key: string;
	url: string;
	priority: number;
	abortController: AbortController;
}

export class TileLoader {
	private deps: TileLoaderDeps;
	private abortControllers = new Map<string, AbortController>();
	private decodeQueue: QueuedTile[] = [];
	private activeDecodes = 0;
  private maxConcurrentDecodes: number;
  private pendingMips: Array<{ key: string; tex: WebGLTexture }> = [];
  private mipsScheduled = false;

  constructor(deps: TileLoaderDeps) {
		this.deps = deps;
		// Scale concurrent decodes based on hardware cores
		const cores = navigator.hardwareConcurrency || 2;
		// Use half the cores for decoding, minimum 2, maximum 8
    this.maxConcurrentDecodes = Math.max(2, Math.min(Math.floor(cores / 2), 8));
  }

  private scheduleMips() {
    if (this.mipsScheduled) return;
    this.mipsScheduled = true;
    const process = () => {
      this.mipsScheduled = false;
      if (!this.deps.isIdle()) {
        requestAnimationFrame(() => this.scheduleMips());
        return;
      }
      const gl: WebGLRenderingContext = this.deps.getGL();
      const MAX_PER_FRAME = 2;
      let n = 0;
      while (n < MAX_PER_FRAME && this.pendingMips.length > 0) {
        const it = this.pendingMips.shift()!;
        gl.bindTexture(gl.TEXTURE_2D, it.tex);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        n++;
      }
      if (this.pendingMips.length > 0) requestAnimationFrame(() => this.scheduleMips());
      this.deps.requestRender();
    };
    requestAnimationFrame(process);
  }

	cancel(key: string) {
		const controller = this.abortControllers.get(key);
		if (controller) {
			controller.abort();
			this.abortControllers.delete(key);
		}
		// Also remove from queue if queued
		this.decodeQueue = this.decodeQueue.filter((t) => t.key !== key);
	}

  cancelAll() {
		for (const controller of this.abortControllers.values()) {
			controller.abort();
		}
		this.abortControllers.clear();
		this.decodeQueue = [];
		this.activeDecodes = 0;
	}

  /** Abort any in-flight or queued tiles that are not in the wanted set. */
  cancelUnwanted(wantedKeys: Set<string>) {
    // Abort in-flight requests not in wanted
    for (const key of Array.from(this.abortControllers.keys())) {
      if (!wantedKeys.has(key)) this.cancel(key);
    }
    // Filter decode queue to only keep wanted
    if (this.decodeQueue.length) {
      this.decodeQueue = this.decodeQueue.filter((t) => wantedKeys.has(t.key));
    }
  }

	private processQueue() {
		// Process tiles from queue while under decode limit
		while (this.activeDecodes < this.maxConcurrentDecodes && this.decodeQueue.length > 0) {
			// Sort queue by priority (higher priority first)
			this.decodeQueue.sort((a, b) => b.priority - a.priority);

			// Take the highest priority tile
			const tile = this.decodeQueue.shift();
			if (!tile) continue;

			// Check if already aborted
			if (tile.abortController.signal.aborted) continue;

			// Start the actual decode
			this.activeDecodes++;
			this.performDecode(tile);
		}
	}

	start({ key, url, priority = 1 }: { key: string; url: string; priority?: number }) {
		const deps = this.deps;

		// Cancel any existing request for this key
		this.cancel(key);

		// Create new abort controller
		const abortController = new AbortController();
		this.abortControllers.set(key, abortController);

		deps.addPending(key);
		deps.incInflight();
		deps.setLoading(key);

		// Queue the tile for processing
		this.decodeQueue.push({ key, url, priority, abortController });
		this.processQueue();
	}

	private performDecode(tile: QueuedTile) {
		const { key, url, abortController } = tile;
		const deps = this.deps;

		const onFinally = () => {
			try {
				/* noop */
			} finally {
				this.abortControllers.delete(key);
				deps.removePending(key);
				deps.decInflight();
				this.activeDecodes--;
				// Process next items in queue
				this.processQueue();
			}
		};

		if (deps.getUseImageBitmap()) {
			fetch(url, {
				mode: 'cors',
				credentials: 'omit',
				signal: abortController.signal,
				// Non-standard but supported in Chromium; harmless elsewhere.
				// Cast limited to request init to avoid spreading any.
				...( { priority: tile.priority > 1 ? 'high' : 'low' } as { priority?: 'high' | 'low' | 'auto' } ),
			})
				.then((r: Response) => {
					if (!r.ok) throw new Error(`HTTP ${r.status}`);
					return r.blob();
				})
				.then((blob: Blob) => createImageBitmap(blob, {
					premultiplyAlpha: 'none',
					colorSpaceConversion: 'none',
				}))
                .then((bmp: ImageBitmap) => {
                    try {
                        const gl: WebGLRenderingContext = deps.getGL();
                        const tex = deps.acquireTexture();
                        if (!tex) { deps.setError(key); return; }
                        gl.bindTexture(gl.TEXTURE_2D, tex);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        // Defer mipmap generation; start with non-mipmap filter
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
                        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
                        deps.setReady(key, tex, bmp.width, bmp.height, deps.getFrame());
                        // Queue mipmaps for idle time
                        this.pendingMips.push({ key, tex });
                        this.scheduleMips();
                        deps.requestRender();
                    } finally {
                        try { (bmp as ImageBitmap).close?.(); } catch {}
                        onFinally();
                    }
                })
				.catch((err) => {
					if (err.name === 'AbortError') {
						// Request was cancelled, clean up silently
						onFinally();
					} else {
						deps.setUseImageBitmap(false);
						onFinally();
						this.start({ key, url, priority: tile.priority });
					}
				});
			return;
		}

		const img = new Image();
		img.crossOrigin = 'anonymous';
		(img as HTMLImageElement & { decoding?: 'async' | 'auto' | 'sync' }).decoding = 'async';

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
            if (!tex) { deps.setError(key); return; }
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            deps.setReady(key, tex, img.naturalWidth, img.naturalHeight, deps.getFrame());
            this.pendingMips.push({ key, tex });
            this.scheduleMips();
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
