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
  /** Check whether a tile is still in cache as ready with the given texture. */
  isTileReady(key: string, tex: WebGLTexture): boolean;
  /** True when user is actively interacting (pan/zoom) within short debounce. */
  isMoving(): boolean;
  /** True when user is not actively interacting (pan/zoom) for a long debounce. */
  isIdle(): boolean;
  log(msg: string): void;
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
  private bitmapFailedKeys = new Set<string>();
  private static readonly BITMAP_FAILURE_THRESHOLD = 3;
  private _retryScheduled = false;

  constructor(deps: TileLoaderDeps) {
    this.deps = deps;
    const cores = navigator.hardwareConcurrency || 2;
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
      const MIP_BUDGET_MS = 2;
      const start = performance.now();
      while (performance.now() - start < MIP_BUDGET_MS && this.pendingMips.length > 0) {
        const it = this.pendingMips.shift()!;
        if (!gl.isTexture(it.tex) || !this.deps.isTileReady(it.key, it.tex)) continue;
        gl.bindTexture(gl.TEXTURE_2D, it.tex);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      }
      if (this.pendingMips.length > 0) requestAnimationFrame(() => this.scheduleMips());
      this.deps.requestRender();
    };
    requestAnimationFrame(process);
  }

  cancel(key: string, reason?: string) {
    const controller = this.abortControllers.get(key);
    const wasInflight = !!controller;
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
    const prevLen = this.decodeQueue.length;
    this.decodeQueue = this.decodeQueue.filter((t) => t.key !== key);
    const wasQueued = this.decodeQueue.length < prevLen;
    // If the tile was removed from the queue before performDecode() picked it
    // up, onFinally() will never fire -- clean up pending/inflight here.
    if (wasQueued) {
      this.deps.removePending(key);
      this.deps.decInflight();
    }
    this.pendingMips = this.pendingMips.filter((m) => m.key !== key);
    if (wasInflight || wasQueued) {
      const source = wasQueued ? 'queued' : 'inflight';
      this.deps.log(`tile:cancel key=${key} source=${source} reason=${reason ?? 'explicit'}`);
    }
  }

  cancelAll(reason?: string) {
    const inflightCount = this.abortControllers.size;
    const queuedCount = this.decodeQueue.length;
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
    for (const t of this.decodeQueue) {
      this.deps.removePending(t.key);
      this.deps.decInflight();
    }
    this.decodeQueue = [];
    this.activeDecodes = 0;
    this.pendingMips = [];
    this.bitmapFailedKeys.clear();
    this._retryScheduled = false;
    if (inflightCount > 0 || queuedCount > 0) {
      this.deps.log(`tile:cancel-all inflight=${inflightCount} queued=${queuedCount} reason=${reason ?? 'explicit'}`);
    }
  }

  /** Abort any in-flight or queued tiles that are not in the wanted set. */
  cancelUnwanted(wantedKeys: Set<string>) {
    for (const key of Array.from(this.abortControllers.keys())) {
      if (!wantedKeys.has(key)) this.cancel(key, 'unwanted');
    }
    if (this.decodeQueue.length) {
      const prev = this.decodeQueue;
      this.decodeQueue = prev.filter((t) => wantedKeys.has(t.key));
      for (const t of prev) {
        if (!wantedKeys.has(t.key)) {
          t.abortController.abort();
          this.abortControllers.delete(t.key);
          this.deps.removePending(t.key);
          this.deps.decInflight();
          this.deps.log(`tile:cancel key=${t.key} source=queued reason=unwanted-orphan`);
        }
      }
    }
  }

  private processQueue() {
    this.decodeQueue.sort((a, b) => b.priority - a.priority);
    const moving = this.deps.isMoving();
    const effectiveMax = moving
      ? Math.max(1, this.maxConcurrentDecodes >> 1)
      : this.maxConcurrentDecodes;
    while (this.activeDecodes < effectiveMax && this.decodeQueue.length > 0) {
      const tile = this.decodeQueue.shift();
      if (!tile) continue;
      if (tile.abortController.signal.aborted) continue;
      this.activeDecodes++;
      this.performDecode(tile);
    }
    // If throttled and queue still has items, retry next frame
    if (this.decodeQueue.length > 0 && this.activeDecodes >= effectiveMax && !this._retryScheduled) {
      this._retryScheduled = true;
      requestAnimationFrame(() => {
        this._retryScheduled = false;
        this.processQueue();
      });
    }
  }

  start({ key, url, priority = 1 }: { key: string; url: string; priority?: number }) {
    const deps = this.deps;
    this.cancel(key, 'restart');
    const abortController = new AbortController();
    this.abortControllers.set(key, abortController);
    deps.addPending(key);
    deps.incInflight();
    deps.setLoading(key);
    this.decodeQueue.push({ key, url, priority, abortController });
    deps.log(`tile:fetch key=${key} priority=${priority} queued=${this.decodeQueue.length} active=${this.activeDecodes}`);
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
        this.activeDecodes = Math.max(0, this.activeDecodes - 1);
        this.processQueue();
      }
    };

    if (deps.getUseImageBitmap() && !this.bitmapFailedKeys.has(key)) {
      fetch(url, {
        mode: 'cors',
        credentials: 'omit',
        signal: abortController.signal,
        ...({ priority: tile.priority > 1 ? 'high' : 'low' } as { priority?: 'high' | 'low' | 'auto' }),
      })
        .then((r: Response) => {
          if (!r.ok) {
            const err = new Error(`HTTP ${r.status}`);
            (err as Error & { httpError: boolean }).httpError = true;
            throw err;
          }
          return r.blob();
        })
        .then((blob: Blob) =>
          createImageBitmap(blob, {
            premultiplyAlpha: 'none',
            colorSpaceConversion: 'none',
          }),
        )
        .then((bmp: ImageBitmap) => {
          try {
            if (abortController.signal.aborted) return;
            const gl: WebGLRenderingContext = deps.getGL();
            const tex = deps.acquireTexture();
            if (!tex) {
              deps.log(`tile:error key=${key} reason=no-texture-slot`);
              deps.setError(key);
              return;
            }
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
            deps.setReady(key, tex, bmp.width, bmp.height, deps.getFrame());
            deps.log(`tile:ready key=${key} size=${bmp.width}x${bmp.height}`);
            this.pendingMips.push({ key, tex });
            this.scheduleMips();
            deps.requestRender();
          } finally {
            try {
              (bmp as ImageBitmap).close?.();
            } catch {}
            onFinally();
          }
        })
        .catch((err) => {
          if (err.name === 'AbortError') {
            deps.log(`tile:abort key=${key} reason=aborted`);
            onFinally();
          } else if ((err as Error & { httpError?: boolean }).httpError) {
            // HTTP error (404, 500, etc.) -- not an ImageBitmap issue.
            // Mark tile as error; do NOT disable ImageBitmap or retry.
            deps.log(`tile:error key=${key} reason=${err.message}`);
            deps.setError(key);
            onFinally();
          } else {
            // Decode/ImageBitmap API failure -- retry tile with Image element
            // unless the tile was canceled during decode.
            if (abortController.signal.aborted) {
              deps.log(`tile:abort key=${key} reason=aborted-during-decode`);
              onFinally();
              return;
            }
            this.bitmapFailedKeys.add(key);
            if (this.bitmapFailedKeys.size >= TileLoader.BITMAP_FAILURE_THRESHOLD) {
              deps.log(`tile:fallback-global key=${key} reason=bitmap-decode-failed failures=${this.bitmapFailedKeys.size}`);
              deps.setUseImageBitmap(false);
            } else {
              deps.log(`tile:fallback key=${key} reason=bitmap-decode-failed failures=${this.bitmapFailedKeys.size}`);
            }
            onFinally();
            this.start({ key, url, priority: tile.priority });
          }
        });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    (img as HTMLImageElement & { decoding?: 'async' | 'auto' | 'sync' }).decoding = 'async';

    const onAbort = () => {
      deps.log(`tile:abort key=${key} reason=aborted`);
      img.src = '';
      img.onload = null;
      img.onerror = null;
      onFinally();
    };

    if (abortController.signal.aborted) {
      onAbort();
      return;
    }
    abortController.signal.addEventListener('abort', onAbort);

    img.onload = () => {
      abortController.signal.removeEventListener('abort', onAbort);
      if (abortController.signal.aborted) {
        onFinally();
        return;
      }
      try {
        const gl: WebGLRenderingContext = deps.getGL();
        const tex = deps.acquireTexture();
        if (!tex) {
          deps.log(`tile:error key=${key} reason=no-texture-slot`);
          deps.setError(key);
          return;
        }
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        deps.setReady(key, tex, img.naturalWidth, img.naturalHeight, deps.getFrame());
        deps.log(`tile:ready key=${key} size=${img.naturalWidth}x${img.naturalHeight}`);
        this.pendingMips.push({ key, tex });
        this.scheduleMips();
        deps.requestRender();
      } finally {
        onFinally();
      }
    };
    img.onerror = () => {
      abortController.signal.removeEventListener('abort', onAbort);
      deps.log(`tile:error key=${key} reason=image-load-failed`);
      deps.setError(key);
      onFinally();
    };
    img.src = url;
  }
}
