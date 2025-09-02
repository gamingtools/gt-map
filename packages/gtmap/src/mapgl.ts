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
  private _tileCache = new Map<string, { status: 'ready' | 'loading' | 'error'; tex?: WebGLTexture; width?: number; height?: number; lastUsed?: number; pinned?: boolean }>();
  private _maxTiles = 384;
  private _frame = 0;
  // Simple zoom easing
  private wheelSpeed = 1.0;
  private wheelImmediate = 0.9;
  private _zoomAnim: { from: number; to: number; px: number; py: number; start: number; dur: number; anchor: 'pointer' | 'center' } | null = null;
  private anchorMode: 'pointer' | 'center' = 'pointer';
  private _renderBaseLockZInt: number | null = null;
  // Screen-space cache
  private useScreenCache = true;
  private _screenTex: WebGLTexture | null = null;
  private _screenCacheState: { zInt: number; scale: number; tlWorld: { x: number; y: number }; widthCSS: number; heightCSS: number; dpr: number } | null = null;
  private _screenTexFormat: number | null = null;
  // Grid overlay
  private showGrid = true;
  private gridCanvas: HTMLCanvasElement | null = null;
  private _gridCtx: CanvasRenderingContext2D | null = null;
  public pointerAbs: { x: number; y: number } | null = null;
  // Loading pacing/cancel
  private interactionIdleMs = 160;
  private _lastInteractAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  private _maxInflightLoads = 8;
  private _inflightLoads = 0;
  private _pendingKeys = new Set<string>();
  private _loadQueue: Array<{ key: string; url: string; z: number; x: number; y: number; priority: number }> = [];
  private _loadQueueSet = new Set<string>();
  private _inflightMap = new Map<string, HTMLImageElement>();
  private _wantedKeys = new Set<string>();
  private _pinnedKeys = new Set<string>();
  private prefetchBaselineLevel = 2;

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
    this._initGridCanvas();
    this.resize();
    this._initEvents();
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
    this._scheduleBaselinePrefetch();
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
    if (opts.clearCache) {
      // clear GPU textures and cache
      for (const rec of this._tileCache.values()) { if (rec.tex) this.gl.deleteTexture(rec.tex); }
      this._tileCache.clear();
      this._pendingKeys.clear();
      this._loadQueue = [];
      this._loadQueueSet.clear();
      this._inflightMap.clear();
    }
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

  // Public controls
  public setGridVisible(visible: boolean) {
    this.showGrid = !!visible;
    if (this.gridCanvas) {
      this.gridCanvas.style.display = this.showGrid ? 'block' : 'none';
      if (!this.showGrid) this._gridCtx?.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
    }
    this._needsRender = true;
  }
  public setWheelSpeed(speed: number) {
    if (Number.isFinite(speed)) {
      this.wheelSpeed = Math.max(0.01, Math.min(2, speed));
      const t = Math.max(0, Math.min(1, this.wheelSpeed / 2));
      this.wheelImmediate = 0.05 + t * (1.75 - 0.05);
    }
  }
  public setAnchorMode(mode: 'pointer' | 'center') { this.anchorMode = mode; }

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
  private _initGridCanvas() {
    const c = document.createElement('canvas');
    this.gridCanvas = c;
    c.style.display = 'block';
    c.style.position = 'absolute';
    c.style.left = '0'; c.style.top = '0'; c.style.right = '0'; c.style.bottom = '0';
    c.style.zIndex = '5'; c.style.pointerEvents = 'none';
    this.container.appendChild(c);
    this._gridCtx = c.getContext('2d');
    c.style.display = this.showGrid ? 'block' : 'none';
  }
  private _initGL() {
    const gl = this.canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;
    gl.clearColor(0.93, 0.93, 0.93, 1);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    try {
      const attrs = (gl as any).getContextAttributes?.();
      this._screenTexFormat = attrs && attrs.alpha === false ? gl.RGB : gl.RGBA;
    } catch { this._screenTexFormat = gl.RGBA; }
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
      precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_alpha; uniform vec2 u_uv0; uniform vec2 u_uv1; void main(){ vec2 uv = mix(u_uv0, u_uv1, v_uv); vec4 c=texture2D(u_tex, uv); gl_FragColor=vec4(c.rgb, c.a*u_alpha); }
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
      u_uv0: gl.getUniformLocation(prog, 'u_uv0'),
      u_uv1: gl.getUniformLocation(prog, 'u_uv1'),
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
    if (this.gridCanvas) {
      this.gridCanvas.style.width = rect.width + 'px';
      this.gridCanvas.style.height = rect.height + 'px';
      if (this.gridCanvas.width !== w || this.gridCanvas.height !== h) {
        this.gridCanvas.width = w; this.gridCanvas.height = h; this._needsRender = true;
      }
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
      this._lastInteractAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const zInt = Math.floor(this.zoom);
      const rect = this.container.getBoundingClientRect();
      const scale = Math.pow(2, this.zoom - zInt);
      const widthCSS = rect.width, heightCSS = rect.height;
      const centerWorld = lngLatToWorld(this.center.lng, this.center.lat, zInt);
      const tl = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };
      // update pointerAbs always
      const px = e.clientX - rect.left; const py = e.clientY - rect.top;
      const wx = tl.x + px / scale; const wy = tl.y + py / scale; const zAbs = Math.floor(this.maxZoom);
      const factor = Math.pow(2, zAbs - zInt); this.pointerAbs = { x: wx * factor, y: wy * factor };
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      const newTL = { x: tl.x - dx / scale, y: tl.y - dy / scale };
      const newCenter = { x: newTL.x + widthCSS / (2 * scale), y: newTL.y + heightCSS / (2 * scale) };
      const { lng, lat } = worldToLngLat(newCenter.x, newCenter.y, zInt);
      this.setCenter(lng, lat);
    };
    const onUp = () => {
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this._lastInteractAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      let lines = e.deltaY;
      if (e.deltaMode === 0) lines = e.deltaY / 100;
      else if (e.deltaMode === 2) lines = e.deltaY * 3;
      if (!Number.isFinite(lines)) return;
      const step = this.wheelImmediate; let dz = -lines * step; dz = Math.max(-2.0, Math.min(2.0, dz));
      const rect = this.container.getBoundingClientRect(); const px = e.clientX - rect.left; const py = e.clientY - rect.top;
      this._startZoomEase(dz, px, py, this.anchorMode);
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
    this._frame++;
    // Render if we have work or an active animation
    if (!this._needsRender && !this._zoomAnim) return;
    this._render();
    // Keep rendering while animating
    if (!this._zoomAnim) this._needsRender = false;
  }
  private _render() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!this._prog || !this._loc || !this._quad) return;
    this._wantedKeys.clear();
    this._stepAnimation();
    const zIntActual = Math.floor(this.zoom);
    const baseZ = this._renderBaseLockZInt ?? zIntActual;
    const rect = this.container.getBoundingClientRect();
    const widthCSS = rect.width;
    const heightCSS = rect.height;
    const scale = Math.pow(2, this.zoom - baseZ);
    const centerWorld = lngLatToWorld(this.center.lng, this.center.lat, baseZ);
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
    gl.uniform2f(this._loc.u_uv0!, 0.0, 0.0);
    gl.uniform2f(this._loc.u_uv1!, 1.0, 1.0);

    if (this.useScreenCache && this._screenCacheState && this._screenTex) this._drawScreenCache({ zInt: baseZ, scale, widthCSS, heightCSS, dpr: this._dpr, tlWorld });
    const coverage = this._tileCoverage(baseZ, tlWorld, scale, widthCSS, heightCSS);
    const zIntPrev = Math.max(this.minZoom, baseZ - 1);
    if (coverage < 0.995 && zIntPrev >= this.minZoom) {
      for (let lvl = zIntPrev; lvl >= this.minZoom; lvl--) {
        const centerL = lngLatToWorld(this.center.lng, this.center.lat, lvl);
        const scaleL = Math.pow(2, this.zoom - lvl);
        const tlL = { x: centerL.x - widthCSS / (2 * scaleL), y: centerL.y - heightCSS / (2 * scaleL) };
        const covL = this._tileCoverage(lvl, tlL, scaleL, widthCSS, heightCSS);
        this._drawTilesForLevel(lvl, tlL, scaleL, this._dpr, widthCSS, heightCSS);
        if (covL >= 0.995) break;
      }
    }
    this._drawTilesForLevel(baseZ, tlWorld, scale, this._dpr, widthCSS, heightCSS);
    // Prefetch neighbors around current view
    this._prefetchNeighbors(baseZ, tlWorld, scale, widthCSS, heightCSS);
    const zIntNext = Math.min(this.maxZoom, baseZ + 1); const frac = this.zoom - baseZ;
    if (zIntNext > baseZ && frac > 0) {
      const centerN = lngLatToWorld(this.center.lng, this.center.lat, zIntNext); const scaleN = Math.pow(2, this.zoom - zIntNext);
      const tlN = { x: centerN.x - widthCSS / (2 * scaleN), y: centerN.y - heightCSS / (2 * scaleN) };
      gl.uniform1f(this._loc.u_alpha!, Math.max(0, Math.min(1, frac))); this._drawTilesForLevel(zIntNext, tlN, scaleN, this._dpr, widthCSS, heightCSS); gl.uniform1f(this._loc.u_alpha!, 1.0);
    }
    if (this.showGrid) this._drawGrid(baseZ, scale, widthCSS, heightCSS, tlWorld);
    if (this.useScreenCache) this._updateScreenCache({ zInt: baseZ, scale, widthCSS, heightCSS, dpr: this._dpr, tlWorld });
    this._cancelUnwantedLoads();
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
        if (!rec) this._enqueueTile(zLevel, tileX, ty, 0);
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

  // --- Grid overlay ---
  private _chooseGridSpacing(scale: number) {
    const base = TILE_SIZE; const candidates = [base/16, base/8, base/4, base/2, base, base*2, base*4, base*8, base*16, base*32, base*64];
    const targetPx = 100; let best = candidates[0]; let bestErr = Infinity; for (const w of candidates) { const css = w * scale; const err = Math.abs(css - targetPx); if (err < bestErr) { bestErr = err; best = w; } } return Math.max(1, Math.round(best));
  }
  private _drawGrid(zInt: number, scale: number, widthCSS: number, heightCSS: number, tlWorld: { x: number; y: number }) {
    const ctx = this._gridCtx; if (!ctx || !this.gridCanvas) return; const dpr = this._dpr || 1; ctx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height); ctx.save(); ctx.scale(dpr, dpr);
    const spacingWorld = this._chooseGridSpacing(scale); const base = TILE_SIZE; const zAbs = Math.floor(this.maxZoom); const factorAbs = Math.pow(2, zAbs - zInt);
    ctx.font = '11px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    let startWX = Math.floor(tlWorld.x / spacingWorld) * spacingWorld;
    for (let wx = startWX; (wx - tlWorld.x) * scale <= widthCSS + spacingWorld * scale; wx += spacingWorld) { const xCSS = (wx - tlWorld.x) * scale; const isMajor = (Math.round(wx) % base) === 0; ctx.beginPath(); ctx.strokeStyle = isMajor ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)'; ctx.lineWidth = isMajor ? 1.2 : 0.8; ctx.moveTo(Math.round(xCSS) + 0.5, 0); ctx.lineTo(Math.round(xCSS) + 0.5, heightCSS); ctx.stroke(); if (isMajor) { const xAbs = Math.round(wx * factorAbs); const label = `x ${xAbs}`; const tx = Math.round(xCSS) + 2; const ty = 2; const m = ctx.measureText(label); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(tx - 2, ty - 1, m.width + 4, 12); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillText(label, tx, ty); } }
    let startWY = Math.floor(tlWorld.y / spacingWorld) * spacingWorld;
    for (let wy = startWY; (wy - tlWorld.y) * scale <= heightCSS + spacingWorld * scale; wy += spacingWorld) { const yCSS = (wy - tlWorld.y) * scale; const isMajor = (Math.round(wy) % base) === 0; ctx.beginPath(); ctx.strokeStyle = isMajor ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)'; ctx.lineWidth = isMajor ? 1.2 : 0.8; ctx.moveTo(0, Math.round(yCSS) + 0.5); ctx.lineTo(widthCSS, Math.round(yCSS) + 0.5); ctx.stroke(); if (isMajor) { const yAbs = Math.round(wy * factorAbs); const label = `y ${yAbs}`; const tx = 2; const ty = Math.round(yCSS) + 2; const m = ctx.measureText(label); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(tx - 2, ty - 1, m.width + 4, 12); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillText(label, tx, ty); } }
    ctx.restore();
  }

  public setGridVisible(visible: boolean) { this.showGrid = !!visible; if (this.gridCanvas) { this.gridCanvas.style.display = this.showGrid ? 'block' : 'none'; if (!this.showGrid) this._gridCtx?.clearRect(0,0,this.gridCanvas.width,this.gridCanvas.height); } this._needsRender = true; }

  private _enqueueTile(z: number, x: number, y: number, priority = 1) {
    const key = `${z}/${x}/${y}`;
    if (this._tileCache.has(key) || this._pendingKeys.has(key) || this._loadQueueSet.has(key)) return;
    const url = this._tileUrl(z, x, y);
    this._loadQueue.push({ key, url, z, x, y, priority });
    this._loadQueueSet.add(key);
    this._processLoadQueue();
  }

  private _tileUrl(z: number, x: number, y: number) {
    return this.tileUrl.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
  }

  private _wrapX(x: number, z: number) { const n = 1 << z; return ((x % n) + n) % n }

  private _evictIfNeeded() {
    if (this._tileCache.size <= this._maxTiles) return;
    // Evict least recently used ready tiles (skip pinned)
    const candidates: Array<{ key: string; used: number }>=[];
    for (const [k, rec] of this._tileCache) {
      if (rec.status !== 'ready' || rec.pinned) continue;
      candidates.push({ key: k, used: rec.lastUsed ?? -1 });
    }
    candidates.sort((a,b)=>a.used-b.used);
    let needed = this._tileCache.size - this._maxTiles;
    for (const c of candidates) {
      if (needed<=0) break;
      const rec = this._tileCache.get(c.key);
      if (rec?.tex) this.gl.deleteTexture(rec.tex);
      this._tileCache.delete(c.key);
      needed--;
    }
  }

  // --- Minimal implementations to complete port; refined next ---
  private _stepAnimation(): boolean {
    if (!this._zoomAnim) return false;
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const a = this._zoomAnim;
    const t = Math.min(1, (now - a.start) / a.dur);
    const ease = 1 - Math.pow(1 - t, 3);
    const z = a.from + (a.to - a.from) * ease;
    this._zoomToAnchored(z, a.px, a.py, a.anchor);
    if (t >= 1) { this._zoomAnim = null; this._renderBaseLockZInt = null; }
    return true;
  }
  private _startZoomEase(dz: number, px: number, py: number, anchor: 'pointer' | 'center') {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    let current = this.zoom;
    if (this._zoomAnim) {
      const a = this._zoomAnim;
      const t = Math.min(1, (now - a.start) / a.dur);
      const ease = 1 - Math.pow(1 - t, 3);
      current = a.from + (a.to - a.from) * ease;
    }
    const to = Math.max(this.minZoom, Math.min(this.maxZoom, current + dz));
    const dist = Math.abs(to - current);
    const base = 150; const per = 240; const raw = base + per * dist;
    const dur = Math.max(120, Math.min(420, raw));
    this._zoomAnim = { from: current, to, px, py, start: now, dur, anchor };
    this._renderBaseLockZInt = Math.floor(current);
    this._needsRender = true;
  }
  private _zoomToAnchored(targetZoom: number, pxCSS: number, pyCSS: number, anchor: 'pointer' | 'center') {
    const zInt = Math.floor(this.zoom)
    const scale = Math.pow(2, this.zoom - zInt)
    const rect = this.container.getBoundingClientRect()
    const widthCSS = rect.width
    const heightCSS = rect.height
    const centerNow = lngLatToWorld(this.center.lng, this.center.lat, zInt)
    const tlWorld = { x: centerNow.x - widthCSS / (2 * scale), y: centerNow.y - heightCSS / (2 * scale) }
    const zClamped = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom))
    const zInt2 = Math.floor(zClamped)
    const s2 = Math.pow(2, zClamped - zInt2)
    let center2
    if (anchor === 'center') {
      const factor = Math.pow(2, zInt2 - zInt)
      center2 = { x: centerNow.x * factor, y: centerNow.y * factor }
    } else {
      const worldBefore = { x: tlWorld.x + pxCSS / scale, y: tlWorld.y + pyCSS / scale }
      const factor = Math.pow(2, zInt2 - zInt)
      const worldBefore2 = { x: worldBefore.x * factor, y: worldBefore.y * factor }
      const tl2 = { x: worldBefore2.x - pxCSS / s2, y: worldBefore2.y - pyCSS / s2 }
      center2 = { x: tl2.x + widthCSS / (2 * s2), y: tl2.y + heightCSS / (2 * s2) }
    }
    const { lng, lat } = worldToLngLat(center2.x, center2.y, zInt2)
    this.center = { lng, lat: clampLat(lat) }
    this.zoom = zClamped
    this._needsRender = true
  }
  private _tileCoverage(zLevel: number, tlWorld: { x: number; y: number }, scale: number, widthCSS: number, heightCSS: number) {
    const startX = Math.floor(tlWorld.x / TILE_SIZE)
    const startY = Math.floor(tlWorld.y / TILE_SIZE)
    const endX = Math.floor((tlWorld.x + widthCSS / scale) / TILE_SIZE) + 1
    const endY = Math.floor((tlWorld.y + heightCSS / scale) / TILE_SIZE) + 1
    let total = 0, ready = 0
    for (let ty = startY; ty <= endY; ty++) {
      if (ty < 0 || ty >= (1 << zLevel)) continue
      for (let tx = startX; tx <= endX; tx++) {
        let tileX = tx
        if (this.wrapX) tileX = this._wrapX(tx, zLevel)
        else if (tx < 0 || tx >= (1 << zLevel)) continue
        total++
        const key = `${zLevel}/${tileX}/${ty}`
        const rec = this._tileCache.get(key)
        if (rec?.status === 'ready') ready++
      }
    }
    if (total === 0) return 1
    return ready / total
  }
  private _ensureScreenTex() {
    const gl = this.gl;
    if (!this._screenTex) {
      this._screenTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this._screenTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fmt = this._screenTexFormat ?? gl.RGBA;
      gl.texImage2D(gl.TEXTURE_2D, 0, fmt, this.canvas.width, this.canvas.height, 0, fmt, gl.UNSIGNED_BYTE, null);
    } else {
      gl.bindTexture(gl.TEXTURE_2D, this._screenTex);
    }
  }
  private _updateScreenCache(state: { zInt: number; scale: number; tlWorld: { x: number; y: number }; widthCSS: number; heightCSS: number; dpr: number }) {
    try {
      const gl = this.gl; this._ensureScreenTex(); gl.bindTexture(gl.TEXTURE_2D, this._screenTex);
      gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, this.canvas.width, this.canvas.height);
      this._screenCacheState = { zInt: state.zInt, scale: state.scale, tlWorld: { x: state.tlWorld.x, y: state.tlWorld.y }, widthCSS: state.widthCSS, heightCSS: state.heightCSS, dpr: state.dpr };
    } catch {}
  }
  private _drawScreenCache(curr: { zInt: number; scale: number; tlWorld: { x: number; y: number }; widthCSS: number; heightCSS: number; dpr: number }) {
    const prev = this._screenCacheState; if (!prev) return; if (prev.widthCSS !== curr.widthCSS || prev.heightCSS !== curr.heightCSS || prev.dpr !== curr.dpr) return; if (prev.zInt !== curr.zInt) return;
    const gl = this.gl; const s = curr.scale / Math.max(1e-6, prev.scale); if (!(s > 0.92 && s < 1.08)) return; const dxCSS = (prev.tlWorld.x - curr.tlWorld.x) * curr.scale; const dyCSS = (prev.tlWorld.y - curr.tlWorld.y) * curr.scale; const dxPx = dxCSS * curr.dpr; const dyPx = dyCSS * curr.dpr; const wPx = this.canvas.width * s; const hPx = this.canvas.height * s; if (Math.abs(dxPx) > this.canvas.width * 0.5 || Math.abs(dyPx) > this.canvas.height * 0.5) return;
    gl.useProgram(this._prog!); gl.bindBuffer(gl.ARRAY_BUFFER, this._quad!); gl.enableVertexAttribArray(this._loc!.a_pos!); gl.vertexAttribPointer(this._loc!.a_pos!, 2, gl.FLOAT, false, 0, 0); gl.uniform2f(this._loc!.u_resolution!, this.canvas.width, this.canvas.height);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this._screenTex); gl.uniform1i(this._loc!.u_tex!, 0); gl.uniform1f(this._loc!.u_alpha!, 0.85); gl.uniform2f(this._loc!.u_uv0!, 0.0, 1.0); gl.uniform2f(this._loc!.u_uv1!, 1.0, 0.0); gl.uniform2f(this._loc!.u_translate!, dxPx, dyPx); gl.uniform2f(this._loc!.u_size!, wPx, hPx); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.uniform1f(this._loc!.u_alpha!, 1.0); gl.uniform2f(this._loc!.u_uv0!, 0.0, 0.0); gl.uniform2f(this._loc!.u_uv1!, 1.0, 1.0);
  }
  private _processLoadQueue() {
    while (this._inflightLoads < this._maxInflightLoads && this._loadQueue.length) {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const idle = (now - this._lastInteractAt) > this.interactionIdleMs; const zAllow = Math.floor(this.zoom);
      let idx = -1; let bestPri = Infinity;
      for (let i = 0; i < this._loadQueue.length; i++) { const t = this._loadQueue[i]; if (!idle && t.z > zAllow) continue; if (t.priority < bestPri) { bestPri = t.priority; idx = i; if (bestPri === 0) break; } }
      if (idx === -1) break; const task = this._loadQueue.splice(idx, 1)[0]; if (!task) break; this._loadQueueSet.delete(task.key); this._startImageLoad(task);
    }
  }
  private _startImageLoad({ key, url }: { key: string; url: string }) {
    this._pendingKeys.add(key); this._inflightLoads++;
    const img = new Image(); img.crossOrigin = 'anonymous'; img.decoding = 'async'; this._tileCache.set(key, { status: 'loading' });
    img.onload = () => { try { const gl = this.gl; const tex = gl.createTexture(); if (!tex) { this._tileCache.set(key, { status: 'error' }); return; } gl.bindTexture(gl.TEXTURE_2D, tex); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0); if ((gl as any).UNPACK_COLORSPACE_CONVERSION_WEBGL !== undefined) gl.pixelStorei((gl as any).UNPACK_COLORSPACE_CONVERSION_WEBGL, (gl as any).NONE); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D); this._tileCache.set(key, { status: 'ready', tex, width: img.naturalWidth, height: img.naturalHeight, lastUsed: this._frame }); this._evictIfNeeded(); this._needsRender = true; } finally { this._pendingKeys.delete(key); this._inflightLoads = Math.max(0, this._inflightLoads - 1); this._inflightMap.delete(key); this._processLoadQueue(); } };
    img.onerror = () => { this._tileCache.set(key, { status: 'error' }); this._pendingKeys.delete(key); this._inflightLoads = Math.max(0, this._inflightLoads - 1); this._inflightMap.delete(key); this._processLoadQueue(); };
    this._inflightMap.set(key, img); img.src = url;
  }
  private _cancelUnwantedLoads() {
    // Only prune queued tasks that are no longer wanted; keep inflight loads to avoid churn
    if (this._loadQueue.length) {
      const keep: typeof this._loadQueue = [];
      for (const task of this._loadQueue) {
        if (this._wantedKeys.has(task.key)) keep.push(task);
        else this._loadQueueSet.delete(task.key);
      }
      this._loadQueue = keep;
    }
    this._wantedKeys.clear();
    this._processLoadQueue();
  }

  private _scheduleBaselinePrefetch() {
    const z = this.prefetchBaselineLevel; const n = 1 << z;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const key = `${z}/${x}/${y}`; this._pinnedKeys.add(key);
        if (!this._tileCache.has(key)) this._enqueueTile(z, x, y, 2);
      }
    }
  }
}
