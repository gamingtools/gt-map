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
  keys() {
    return this.map.keys();
  }

  setLoading(key: string) {
    this.map.set(key, { status: 'loading' });
  }
  setError(key: string) {
    this.map.set(key, { status: 'error' });
  }
  setReady(key: string, tex: WebGLTexture, width: number, height: number, frame: number) {
    this.map.set(key, { status: 'ready', tex, width, height, lastUsed: frame });
    this.evictIfNeeded();
  }

  pin(key: string) {
    const rec = this.map.get(key);
    if (rec) rec.pinned = true;
  }
  unpin(key: string) {
    const rec = this.map.get(key);
    if (rec) rec.pinned = false;
  }

  delete(key: string) {
    const rec = this.map.get(key);
    if (rec?.tex) {
      this.releaseTexture(rec.tex);
    }
    this.map.delete(key);
  }

  clear() {
    for (const [, rec] of this.map) {
      if (rec.tex) {
        this.releaseTexture(rec.tex);
      }
    }
    this.map.clear();
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
  }
}
