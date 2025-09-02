import { TILE_SIZE, clampLat, lngLatToWorld, worldToLngLat } from './mercator';

export type LngLat = { lng: number; lat: number };
export type MapOptions = {
  tileUrl?: string;
  minZoom?: number;
  maxZoom?: number;
  wrapX?: boolean;
  freePan?: boolean;
  center?: LngLat;
  zoom?: number;
};
export type EaseOptions = {
  easeBaseMs?: number;
  easePerUnitMs?: number;
  pinchEaseMs?: number;
  easePinch?: boolean;
};

export default class GTMap {
  container: HTMLDivElement;
  canvas!: HTMLCanvasElement;
  gl!: WebGLRenderingContext;
  tileUrl: string;
  minZoom: number;
  maxZoom: number;
  wrapX: boolean;
  freePan: boolean;
  center: LngLat;
  zoom: number;

  private _needsRender = true;
  private _raf: number | null = null;
  private _cleanupEvents: (() => void) | null = null;
  private _dpr = 1;
  private _prog: WebGLProgram | null = null;
  private _quad: WebGLBuffer | null = null;
  private _loc: {
    a_pos: number;
    u_translate: WebGLUniformLocation | null;
    u_size: WebGLUniformLocation | null;
    u_resolution: WebGLUniformLocation | null;
    u_tex: WebGLUniformLocation | null;
    u_alpha: WebGLUniformLocation | null;
  } | null = null;
  private _tileCache = new Map<string, { status: 'ready' | 'loading' | 'error'; tex?: WebGLTexture; width?: number; height?: number }>();
  private _maxTiles = 256;

  constructor(container: HTMLDivElement, options: MapOptions = {}) {
    this.container = container;
    this.tileUrl = options.tileUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.minZoom = options.minZoom ?? 1;
    this.maxZoom = options.maxZoom ?? 19;
    this.wrapX = options.wrapX ?? true;
    this.freePan = options.freePan ?? false;
    this.center = { lng: options.center?.lng ?? 0, lat: options.center?.lat ?? 0 };
    this.zoom = options.zoom ?? 2;
    this._initCanvas();
    this._initGL();
    this._initPrograms();
    this.resize();
    this._initEvents();
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }

  setCenter(lng: number, lat: number) {
    this.center.lng = lng;
    this.center.lat = clampLat(lat);
    this._needsRender = true;
  }
  setZoom(zoom: number) {
    const z = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    if (z !== this.zoom) {
      this.zoom = z;
      this._needsRender = true;
    }
  }
  setTileSource(opts: {
    url?: string;
    minZoom?: number;
    maxZoom?: number;
    wrapX?: boolean;
    clearCache?: boolean;
  }) {
    if (typeof opts.url === 'string') this.tileUrl = opts.url;
    if (Number.isFinite(opts.minZoom as number)) this.minZoom = opts.minZoom as number;
    if (Number.isFinite(opts.maxZoom as number)) this.maxZoom = opts.maxZoom as number;
    if (typeof opts.wrapX === 'boolean') this.wrapX = opts.wrapX;
    this._needsRender = true;
  }
  setEaseOptions(_opts: EaseOptions) {
    /* to be ported */
  }
  recenter() {
    const zInt = Math.floor(this.zoom);
    const worldSize = 256 * (1 << zInt);
    const lng = (worldSize / 2 / (256 * (1 << zInt))) * 360 - 180;
    const lat = 0;
    this.setCenter(lng, lat);
  }
  destroy() {
    if (this._raf != null) cancelAnimationFrame(this._raf);
    this._cleanupEvents?.();
  }

  private _initCanvas() {
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      display: 'block',
      position: 'absolute',
      left: '0',
      top: '0',
      right: '0',
      bottom: '0',
      zIndex: '0',
    } as CSSStyleDeclaration);
    this.container.appendChild(this.canvas);
  }
  private _initGL() {
    const gl = this.canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;
    gl.clearColor(0.93, 0.93, 0.93, 1);
  }
  private _compile(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const sh = gl.createShader(type) as WebGLShader;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(sh) || '';
      gl.deleteShader(sh);
      throw new Error('Shader compile error: ' + info);
    }
    return sh;
  }
  private _link(vs: WebGLShader, fs: WebGLShader): WebGLProgram {
    const gl = this.gl;
    const p = gl.createProgram() as WebGLProgram;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(p) || '';
      gl.deleteProgram(p);
      throw new Error('Program link error: ' + info);
    }
    return p;
  }
  private _initPrograms() {
    const gl = this.gl;
    const vs = this._compile(
      gl.VERTEX_SHADER,
      `
      attribute vec2 a_pos; uniform vec2 u_translate; uniform vec2 u_size; uniform vec2 u_resolution; varying vec2 v_uv; void main(){ vec2 pixelPos=u_translate + a_pos*u_size; vec2 clip=(pixelPos/u_resolution)*2.0-1.0; clip.y*=-1.0; gl_Position=vec4(clip,0.0,1.0); v_uv=a_pos; }
    `,
    );
    const fs = this._compile(
      gl.FRAGMENT_SHADER,
      `
      precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_alpha; void main(){ vec4 c=texture2D(u_tex, v_uv); gl_FragColor=vec4(c.rgb, c.a*u_alpha); }
    `,
    );
    const prog = (this._prog = this._link(vs, fs));
    this._loc = {
      a_pos: gl.getAttribLocation(prog, 'a_pos'),
      u_translate: gl.getUniformLocation(prog, 'u_translate'),
      u_size: gl.getUniformLocation(prog, 'u_size'),
      u_resolution: gl.getUniformLocation(prog, 'u_resolution'),
      u_tex: gl.getUniformLocation(prog, 'u_tex'),
      u_alpha: gl.getUniformLocation(prog, 'u_alpha'),
    };
    const quad = (this._quad = gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  }
  resize() {
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    const rect = this.container.getBoundingClientRect();
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this._dpr = dpr;
      this.gl.viewport(0, 0, w, h);
      this._needsRender = true;
    }
  }
  private _initEvents() {
    const canvas = this.canvas;
    let dragging = false;
    let lastX = 0,
      lastY = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX,
        dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const zInt = Math.floor(this.zoom);
      const rect = this.container.getBoundingClientRect();
      const scale = Math.pow(2, this.zoom - zInt);
      const widthCSS = rect.width,
        heightCSS = rect.height;
      const centerWorld = lngLatToWorld(this.center.lng, this.center.lat, zInt);
      const tl = {
        x: centerWorld.x - widthCSS / (2 * scale),
        y: centerWorld.y - heightCSS / (2 * scale),
      };
      const newTL = { x: tl.x - dx / scale, y: tl.y - dy / scale };
      const newCenter = {
        x: newTL.x + widthCSS / (2 * scale),
        y: newTL.y + heightCSS / (2 * scale),
      };
      const { lng, lat } = worldToLngLat(newCenter.x, newCenter.y, zInt);
      this.setCenter(lng, lat);
    };
    const onUp = () => {
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      let lines = e.deltaY;
      if (e.deltaMode === 0) lines = e.deltaY / 100;
      else if (e.deltaMode === 2) lines = e.deltaY * 3;
      if (!Number.isFinite(lines)) return;
      let dz = -lines * 0.2;
      dz = Math.max(-1.5, Math.min(1.5, dz));
      this.setZoom(this.zoom + dz);
    };
    const onResize = () => this.resize();
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', onResize);
    this._cleanupEvents = () => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
    };
  }
  private _loop() {
    this._raf = requestAnimationFrame(this._loop);
    if (!this._needsRender) return;
    this._render();
    this._needsRender = false;
  }
  private _render() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!this._prog || !this._loc || !this._quad) return;
    // Compute current view
    const zInt = Math.floor(this.zoom);
    const rect = this.container.getBoundingClientRect();
    const widthCSS = rect.width;
    const heightCSS = rect.height;
    const scale = Math.pow(2, this.zoom - zInt);
    const centerWorld = lngLatToWorld(this.center.lng, this.center.lat, zInt);
    const tlWorld = {
      x: centerWorld.x - widthCSS / (2 * scale),
      y: centerWorld.y - heightCSS / (2 * scale),
    };

    // Setup program/state
    gl.useProgram(this._prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quad);
    gl.enableVertexAttribArray(this._loc.a_pos);
    gl.vertexAttribPointer(this._loc.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(this._loc.u_resolution, this.canvas.width, this.canvas.height);
    gl.uniform1i(this._loc.u_tex, 0);
    gl.uniform1f(this._loc.u_alpha, 1.0);

    this._drawTilesForLevel(zInt, tlWorld, scale, this._dpr, widthCSS, heightCSS);
  }

  private _drawTilesForLevel(
    zLevel: number,
    tlWorld: { x: number; y: number },
    scale: number,
    dpr: number,
    widthCSS: number,
    heightCSS: number,
  ) {
    const gl = this.gl;
    const startX = Math.floor(tlWorld.x / TILE_SIZE);
    const startY = Math.floor(tlWorld.y / TILE_SIZE);
    const endX = Math.floor((tlWorld.x + widthCSS / scale) / TILE_SIZE) + 1;
    const endY = Math.floor((tlWorld.y + heightCSS / scale) / TILE_SIZE) + 1;
    const tilePixelSizeCSS = TILE_SIZE * scale;
    const tilePixelSize = tilePixelSizeCSS * dpr;

    for (let ty = startY; ty <= endY; ty++) {
      if (ty < 0 || ty >= (1 << zLevel)) continue;
      for (let tx = startX; tx <= endX; tx++) {
        if (!this.wrapX && (tx < 0 || tx >= (1 << zLevel))) continue;
        const tileX = this.wrapX ? this._wrapX(tx, zLevel) : tx;
        const wx = tx * TILE_SIZE;
        const wy = ty * TILE_SIZE;
        let sxCSS = (wx - tlWorld.x) * scale;
        const syCSS = (wy - tlWorld.y) * scale;
        if (this.wrapX && tileX !== tx) {
          const dxTiles = tx - tileX;
          sxCSS -= dxTiles * TILE_SIZE * scale;
        }
        const key = `${zLevel}/${tileX}/${ty}`;
        const rec = this._tileCache.get(key);
        if (!rec) this._enqueueTile(zLevel, tileX, ty);
        if (rec?.status === 'ready' && rec.tex) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, rec.tex);
          gl.uniform2f(this._loc!.u_translate, sxCSS * dpr, syCSS * dpr);
          gl.uniform2f(this._loc!.u_size, tilePixelSize, tilePixelSize);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
    }
  }

  private _enqueueTile(z: number, x: number, y: number) {
    const key = `${z}/${x}/${y}`;
    if (this._tileCache.has(key)) return;
    this._tileCache.set(key, { status: 'loading' });
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      const gl = this.gl;
      const tex = gl.createTexture();
      if (!tex) { this._tileCache.set(key, { status: 'error' }); return; }
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      this._tileCache.set(key, { status: 'ready', tex, width: img.naturalWidth, height: img.naturalHeight });
      this._evictIfNeeded();
      this._needsRender = true;
    };
    img.onerror = () => { this._tileCache.set(key, { status: 'error' }); };
    img.src = this._tileUrl(z, x, y);
  }

  private _tileUrl(z: number, x: number, y: number) {
    return this.tileUrl.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
  }

  private _wrapX(x: number, z: number) { const n = 1 << z; return ((x % n) + n) % n }

  private _evictIfNeeded() {
    if (this._tileCache.size <= this._maxTiles) return;
    // naive eviction: remove first non-loading entry(s)
    for (const [k, rec] of this._tileCache) {
      if (rec.status === 'ready' || rec.status === 'error') {
        if (rec.tex) this.gl.deleteTexture(rec.tex);
        this._tileCache.delete(k);
        if (this._tileCache.size <= this._maxTiles) break;
      }
    }
  }
}
