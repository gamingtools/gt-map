export type TileStatus = 'ready' | 'loading' | 'error';
export type TileRecord = {
  status: TileStatus;
  tex?: WebGLTexture;
  width?: number;
  height?: number;
  lastUsed?: number;
  pinned?: boolean;
};

export class TileCache {
  private gl: WebGLRenderingContext;
  private maxTiles: number;
  private map = new Map<string, TileRecord>();
  private texturePool: WebGLTexture[] = [];
  private readonly poolSize = 20;
  /** Keys requested for pinning before the tile record existed. */
  private deferredPins = new Set<string>();

  constructor(gl: WebGLRenderingContext, maxTiles: number) {
    this.gl = gl;
    this.maxTiles = Math.max(0, maxTiles | 0);
  }

  acquireTexture(): WebGLTexture | null {
    if (this.texturePool.length > 0) {
      return this.texturePool.pop()!;
    }
    return this.gl.createTexture();
  }

  private releaseTexture(tex: WebGLTexture) {
    if (this.texturePool.length < this.poolSize) {
      this.texturePool.push(tex);
    } else {
      try {
        this.gl.deleteTexture(tex);
      } catch {}
    }
  }

  size() {
    return this.map.size;
  }
  has(key: string) {
    return this.map.has(key);
  }
  get(key: string) {
    return this.map.get(key);
  }

  /** Update lastUsed so the tile survives LRU eviction. */
  touch(key: string, frame: number) {
    const rec = this.map.get(key);
    if (rec) rec.lastUsed = frame;
  }
  keys() {
    return this.map.keys();
  }
  /** Check whether a tile is still ready with the given texture. */
  isTileReady(key: string, tex: WebGLTexture): boolean {
    const rec = this.map.get(key);
    return rec?.status === 'ready' && rec.tex === tex;
  }

  setLoading(key: string) {
    const existing = this.map.get(key);
    if (existing?.tex) this.releaseTexture(existing.tex);
    const pinned = this.deferredPins.delete(key) || existing?.pinned === true;
    this.map.set(key, { status: 'loading', pinned });
  }
  setError(key: string) {
    const existing = this.map.get(key);
    if (existing?.tex) this.releaseTexture(existing.tex);
    const pinned = this.deferredPins.delete(key) || existing?.pinned === true;
    this.map.set(key, { status: 'error', pinned });
  }
  setReady(key: string, tex: WebGLTexture, width: number, height: number, frame: number) {
    const existing = this.map.get(key);
    if (existing?.tex && existing.tex !== tex) this.releaseTexture(existing.tex);
    const pinned = this.deferredPins.delete(key) || existing?.pinned === true;
    this.map.set(key, { status: 'ready', tex, width, height, lastUsed: frame, pinned });
    this.evictIfNeeded();
  }

  pin(key: string) {
    const rec = this.map.get(key);
    if (rec) {
      rec.pinned = true;
    } else {
      this.deferredPins.add(key);
    }
  }
  unpin(key: string) {
    this.deferredPins.delete(key);
    const rec = this.map.get(key);
    if (rec) rec.pinned = false;
  }

  delete(key: string) {
    const rec = this.map.get(key);
    if (rec?.tex) {
      this.releaseTexture(rec.tex);
    }
    this.map.delete(key);
    this.deferredPins.delete(key);
  }

  clear() {
    for (const [, rec] of this.map) {
      if (rec.tex) {
        this.releaseTexture(rec.tex);
      }
    }
    this.map.clear();
    this.deferredPins.clear();
  }

  destroy() {
    this.clear();
    for (const tex of this.texturePool) {
      try {
        this.gl.deleteTexture(tex);
      } catch {}
    }
    this.texturePool = [];
  }

  evictIfNeeded() {
    if (this.map.size <= this.maxTiles) return;
    const candidates: Array<{ key: string; used: number }> = [];
    for (const [k, rec] of this.map) {
      if (rec.status !== 'ready' || rec.pinned) continue;
      candidates.push({ key: k, used: rec.lastUsed ?? -1 });
    }
    candidates.sort((a, b) => a.used - b.used);
    let needed = this.map.size - this.maxTiles;
    for (const c of candidates) {
      if (needed <= 0) break;
      this.delete(c.key);
      needed--;
    }
    // If still over capacity, evict error tiles
    if (needed > 0) {
      for (const [k, rec] of this.map) {
        if (needed <= 0) break;
        if (rec.status === 'error' && !rec.pinned) {
          this.delete(k);
          needed--;
        }
      }
    }
  }
}
