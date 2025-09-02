import { TILE_SIZE, clampLat, lngLatToWorld, worldToLngLat } from './mercator';
import { createProgramFromSources } from './gl/program';
import { createUnitQuad } from './gl/quad';
import { ScreenCache } from './render/screenCache';
import { TileCache } from './tiles/cache';
import { urlFromTemplate, wrapX as wrapXTile, tileKey as tileKeyOf } from './tiles/source';

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
  private _tileCache!: TileCache;
  private _maxTiles = 384;
  private _frame = 0;
  private _lastTS: number | null = null;
  private _dt = 0;
  // Simple zoom easing
  private wheelSpeed = 1.0;
  private wheelImmediate = 0.9;
  private wheelSpeedCtrl = 0.4;
  private wheelImmediateCtrl = 0.24;
  private wheelGain = 0.22;
  private wheelGainCtrl = 0.44;
  private zoomDamping = 0.09;
  private maxZoomRate = 12.0;
  private _zoomAnim: { from: number; to: number; px: number; py: number; start: number; dur: number; anchor: 'pointer' | 'center' } | null = null;
  private anchorMode: 'pointer' | 'center' = 'pointer';
  private _renderBaseLockZInt: number | null = null;
  // Easing options
  private easeBaseMs = 150;
  private easePerUnitMs = 240;
  private easeMinMs = 120;
  private easeMaxMs = 420;
  // Zoom-out stability bias toward center
  private outCenterBias = 0.15;
  // Sticky center anchor hysteresis for finite worlds
  private _stickyCenterAnchor = false;
  private _stickyAnchorUntil = 0;
  // Screen-space cache
  private useScreenCache = true;
  private _screenTex: WebGLTexture | null = null;
  private _screenCacheState: { zInt: number; scale: number; tlWorld: { x: number; y: number }; widthCSS: number; heightCSS: number; dpr: number } | null = null;
  private _screenTexFormat: number | null = null;
  private _screenCache: ScreenCache | null = null;
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
  // Wheel coalescing + velocity tail
  private _wheelLinesAccum = 0;
  private _wheelLastCtrl = false;
  private _wheelAnchor: { px: number; py: number; mode: 'pointer' | 'center' } = { px: 0, py: 0, mode: 'pointer' };
  private _zoomVel = 0;

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
    // Initialize screen cache module (uses detected format)
    this._screenCache = new ScreenCache(this.gl, this._screenTexFormat ?? this.gl.RGBA);
    // Initialize tile cache (LRU)
    this._tileCache = new TileCache(this.gl, this._maxTiles);
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
      this._tileCache.clear();
      this._pendingKeys.clear();
      this._loadQueue = [];
      this._loadQueueSet.clear();
      this._inflightMap.clear();
    }
    this._needsRender = true;
  }
  setEaseOptions(_opts: EaseOptions) {
    if (Number.isFinite(_opts.easeBaseMs as number)) this.easeBaseMs = Math.max(50, Math.min(600, _opts.easeBaseMs as number));
    if (Number.isFinite(_opts.easePerUnitMs as number)) this.easePerUnitMs = Math.max(0, Math.min(600, _opts.easePerUnitMs as number));
    if (Number.isFinite(_opts.pinchEaseMs as number)) this.easeBaseMs = Math.max(40, Math.min(600, _opts.pinchEaseMs as number));
    if (typeof _opts.easePinch === 'boolean') {/* reserved for future pinch easing */}
  }
  recenter() {
    const zInt = Math.floor(this.zoom);
    const worldSize = 256 * (1 << zInt);
    const lng = (worldSize / 2 / (256 * (1 << zInt))) * 360 - 180;
    const lat = 0;
    this.setCenter(lng, lat);
  }
  destroy() {
    if (this._raf != null) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    this._cleanupEvents?.();
    this._cleanupEvents = null;
    this._clearCache();
    const gl = this.gl;
    this._screenCache?.dispose();
    if (this._quad) { try { gl.deleteBuffer(this._quad); } catch {} this._quad = null; }
    if (this._prog) { try { gl.deleteProgram(this._prog); } catch {} this._prog = null; }
    try { this.canvas.remove(); } catch {}
    if (this.gridCanvas) { try { this.gridCanvas.remove(); } catch {} this.gridCanvas = null; this._gridCtx = null; }
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
  private _clearCache() {
    // Delete GPU textures in tile cache and reset queues
    this._tileCache.clear();
    this._wantedKeys.clear();
    this._pinnedKeys.clear();
    this._pendingKeys.clear();
    this._loadQueueSet.clear();
    this._loadQueue.length = 0;
    this._inflightLoads = 0;
    this._inflightMap.clear();
  }
  public setWheelSpeed(speed: number) {
    if (Number.isFinite(speed)) {
      this.wheelSpeed = Math.max(0.01, Math.min(2, speed));
      const t = Math.max(0, Math.min(1, this.wheelSpeed / 2));
      // Match JS mapping for immediate step and velocity gain
      this.wheelImmediate = 0.05 + t * (1.75 - 0.05);
      this.wheelGain = 0.12 + t * (0.5 - 0.12);
    }
    // Keep ctrl speed in sync if desired
    const t2 = Math.max(0, Math.min(1, (this.wheelSpeedCtrl || 0.4) / 2));
    this.wheelImmediateCtrl = 0.10 + t2 * (1.90 - 0.10);
    this.wheelGainCtrl = 0.20 + t2 * (0.60 - 0.20);
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
    this._detectScreenFormat();
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
    const vsSrc = `
      attribute vec2 a_pos; uniform vec2 u_translate; uniform vec2 u_size; uniform vec2 u_resolution; varying vec2 v_uv; void main(){ vec2 pixelPos=u_translate + a_pos*u_size; vec2 clip=(pixelPos/u_resolution)*2.0-1.0; clip.y*=-1.0; gl_Position=vec4(clip,0.0,1.0); v_uv=a_pos; }
    `;
    const fsSrc = `
      precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_alpha; uniform vec2 u_uv0; uniform vec2 u_uv1; void main(){ vec2 uv = mix(u_uv0, u_uv1, v_uv); vec4 c=texture2D(u_tex, uv); gl_FragColor=vec4(c.rgb, c.a*u_alpha); }
    `;
    const prog = (this._prog = createProgramFromSources(gl, vsSrc, fsSrc));
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
    const quad = (this._quad = createUnitQuad(gl));
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
      let newCenter = { x: newTL.x + widthCSS / (2 * scale), y: newTL.y + heightCSS / (2 * scale) };
      newCenter = this._clampCenterWorld(newCenter, zInt, scale, widthCSS, heightCSS);
      const { lng, lat } = worldToLngLat(newCenter.x, newCenter.y, zInt);
      this.setCenter(lng, lat);
    };
    const onUp = () => {
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this._lastInteractAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const lines = this._normalizeWheel(e);
      if (!Number.isFinite(lines)) return;
      const rect = this.container.getBoundingClientRect();
      const px = e.clientX - rect.left; const py = e.clientY - rect.top;
      const ctrl = !!e.ctrlKey;
      const step = ctrl ? (this.wheelImmediateCtrl || this.wheelImmediate || 0.16) : (this.wheelImmediate || 0.16);
      let dz = -lines * step; dz = Math.max(-2.0, Math.min(2.0, dz));
      this._startZoomEase(dz, px, py, this.anchorMode);
    };
    const onResize = () => this.resize();
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    // Touch pinch & pan
    let touchState: null | { mode: 'pan' | 'pinch'; x?: number; y?: number; cx?: number; cy?: number; dist?: number } = null;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchState = { mode: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const t0 = e.touches[0]; const t1 = e.touches[1];
        const dx = t1.clientX - t0.clientX; const dy = t1.clientY - t0.clientY;
        touchState = { mode: 'pinch', cx: (t0.clientX + t1.clientX) / 2, cy: (t0.clientY + t1.clientY) / 2, dist: Math.hypot(dx, dy) };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touchState) return;
      if (touchState.mode === 'pan' && e.touches.length === 1) {
        const t = e.touches[0];
        const dx = t.clientX - (touchState.x || 0); const dy = t.clientY - (touchState.y || 0);
        touchState.x = t.clientX; touchState.y = t.clientY;
        const zInt = Math.floor(this.zoom);
        const rect = this.container.getBoundingClientRect();
        const scale = Math.pow(2, this.zoom - zInt);
        const widthCSS = rect.width, heightCSS = rect.height;
        const centerWorld = lngLatToWorld(this.center.lng, this.center.lat, zInt);
        const tl = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };
        let newCenter = { x: tl.x - dx / scale + widthCSS / (2 * scale), y: tl.y - dy / scale + heightCSS / (2 * scale) };
        newCenter = this._clampCenterWorld(newCenter, zInt, scale, widthCSS, heightCSS);
        const { lng, lat } = worldToLngLat(newCenter.x, newCenter.y, zInt);
        this.setCenter(lng, lat);
      } else if (touchState.mode === 'pinch' && e.touches.length === 2) {
        const t0 = e.touches[0]; const t1 = e.touches[1];
        const dx = t1.clientX - t0.clientX; const dy = t1.clientY - t0.clientY;
        const dist = Math.hypot(dx, dy);
        const scaleDelta = Math.log2(dist / (touchState.dist || dist));
        const rect = this.container.getBoundingClientRect();
        const px = ((t0.clientX + t1.clientX) / 2) - rect.left;
        const py = ((t0.clientY + t1.clientY) / 2) - rect.top;
        this._zoomAnim = null;
        this._zoomToAnchored(this.zoom + scaleDelta, px, py, this.anchorMode);
        touchState.dist = dist;
      }
      e.preventDefault();
    };
    const onTouchEnd = () => { touchState = null; };
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', onResize);
    this._cleanupEvents = () => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart as any);
      canvas.removeEventListener('touchmove', onTouchMove as any);
      canvas.removeEventListener('touchend', onTouchEnd as any);
      window.removeEventListener('resize', onResize);
    };
  }
  private _normalizeWheel(e: WheelEvent): number {
    const lineHeight = 16; // px baseline for converting pixels to lines
    if (e.deltaMode === 1) return e.deltaY; // lines
    if (e.deltaMode === 2) return (e.deltaY * this.canvas.height) / lineHeight; // pages -> lines-ish
    return e.deltaY / lineHeight; // pixels -> lines
  }
  private _loop() {
    this._raf = requestAnimationFrame(this._loop);
    this._frame++;
    // Compute dt like JS for smooth velocity tail
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (this._lastTS == null) this._lastTS = now;
    this._dt = (now - this._lastTS) / 1000;
    this._lastTS = now;
    // Render if we have work or an active animation
    if (!this._needsRender && !this._zoomAnim) return;
    this._render();
    // Keep rendering while animating
    if (!this._zoomAnim) this._needsRender = false;
  }
  private _detectScreenFormat() {
    const gl = this.gl;
    try {
      const attrs = (gl as any).getContextAttributes?.();
      this._screenTexFormat = attrs && attrs.alpha === false ? gl.RGB : gl.RGBA;
    } catch {
      this._screenTexFormat = gl.RGBA;
    }
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

    /* easing handles wheel animation */ if (false) {
      const ctrl = !!this._wheelLastCtrl;
      const step = ctrl ? (this.wheelImmediateCtrl || this.wheelImmediate || 0.16) : (this.wheelImmediate || 0.16);
      const linesAccum = this._wheelLinesAccum;
      let dz = -linesAccum * step;
      const maxDzFrame = 0.8;
      dz = Math.max(-maxDzFrame, Math.min(maxDzFrame, dz));
      const anchor = this._wheelAnchor?.mode || this.anchorMode;
      const px = this._wheelAnchor?.px ?? 0; const py = this._wheelAnchor?.py ?? 0;
      this._zoomToAnchored(this.zoom + dz, px, py, anchor);
      this._wheelLinesAccum = 0;
    }

    // (velocity tail removed in favor of easing path)
    if (Math.abs(this._zoomVel) > 1e-4) {
      const dt = Math.max(0.0005, Math.min(0.1, this._dt || 1 / 60));
      const maxStep = Math.max(0.0001, this.maxZoomRate * dt);
      let step = this._zoomVel * dt; step = Math.max(-maxStep, Math.min(maxStep, step));
      const anchor = this._wheelAnchor?.mode || this.anchorMode; const px = this._wheelAnchor?.px ?? 0; const py = this._wheelAnchor?.py ?? 0;
      this._zoomToAnchored(this.zoom + step, px, py, anchor);
      const k = Math.exp(-dt / this.zoomDamping); this._zoomVel *= k; if (Math.abs(this._zoomVel) < 1e-3) this._zoomVel = 0;
    }

    if (this.useScreenCache && this._screenCache)
      this._screenCache.draw({ zInt: baseZ, scale, widthCSS, heightCSS, dpr: this._dpr, tlWorld }, this._loc!, this._prog!, this._quad!, this.canvas);
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
    if (this.useScreenCache && this._screenCache)
      this._screenCache.update({ zInt: baseZ, scale, widthCSS, heightCSS, dpr: this._dpr, tlWorld }, this.canvas);
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
        const key = tileKeyOf(zLevel, tileX, ty);
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

  // Prefetch a 1-tile border beyond current viewport at the given level
  private _prefetchNeighbors(zLevel: number, tlWorld: { x: number; y: number }, scale: number, widthCSS: number, heightCSS: number) {
    const startX = Math.floor(tlWorld.x / TILE_SIZE) - 1;
    const startY = Math.floor(tlWorld.y / TILE_SIZE) - 1;
    const endX = Math.floor((tlWorld.x + widthCSS / scale) / TILE_SIZE) + 1;
    const endY = Math.floor((tlWorld.y + heightCSS / scale) / TILE_SIZE) + 1;
    for (let ty = startY; ty <= endY; ty++) {
      if (ty < 0 || ty >= (1 << zLevel)) continue;
      for (let tx = startX; tx <= endX; tx++) {
        let tileX = tx;
        if (this.wrapX) tileX = this._wrapX(tx, zLevel); else if (tx < 0 || tx >= (1 << zLevel)) continue;
        const key = tileKeyOf(zLevel, tileX, ty);
        if (!this._tileCache.has(key)) this._enqueueTile(zLevel, tileX, ty, 1);
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
    const key = tileKeyOf(z, x, y);
    if (this._tileCache.has(key) || this._pendingKeys.has(key) || this._loadQueueSet.has(key)) return;
    const url = this._tileUrl(z, x, y);
    this._loadQueue.push({ key, url, z, x, y, priority });
    this._loadQueueSet.add(key);
    this._processLoadQueue();
  }

  private _tileUrl(z: number, x: number, y: number) {
    return urlFromTemplate(this.tileUrl, z, x, y);
  }

  private _wrapX(x: number, z: number) { return wrapXTile(x, z); }

  private _evictIfNeeded() { this._tileCache.evictIfNeeded(); }

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
    const base = this.easeBaseMs; const per = this.easePerUnitMs; const raw = base + per * dist;
    const dur = Math.max(this.easeMinMs, Math.min(this.easeMaxMs, raw));
    this._zoomAnim = { from: current, to, px, py, start: now, dur, anchor };
    this._renderBaseLockZInt = Math.floor(current);
    this._needsRender = true;
  }
  private _zoomToAnchored(targetZoom: number, pxCSS: number, pyCSS: number, anchor: 'pointer' | 'center') {
    const zInt = Math.floor(this.zoom);
    const scale = Math.pow(2, this.zoom - zInt);
    const rect = this.container.getBoundingClientRect();
    const widthCSS = rect.width; const heightCSS = rect.height;
    const centerNow = lngLatToWorld(this.center.lng, this.center.lat, zInt);
    const tlWorld = { x: centerNow.x - widthCSS / (2 * scale), y: centerNow.y - heightCSS / (2 * scale) };
    const zClamped = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));
    const zInt2 = Math.floor(zClamped); const s2 = Math.pow(2, zClamped - zInt2);
    // Override to center anchor when viewport would be larger than world (finite worlds)
    let anchorEff: 'pointer' | 'center' = anchor;
    if (!this.wrapX && this._shouldAnchorCenterForZoom(zClamped)) anchorEff = 'center';
    let center2;
    if (anchorEff === 'center') {
      const factor = Math.pow(2, zInt2 - zInt);
      center2 = { x: centerNow.x * factor, y: centerNow.y * factor };
    } else {
      const worldBefore = { x: tlWorld.x + pxCSS / scale, y: tlWorld.y + pyCSS / scale };
      const factor = Math.pow(2, zInt2 - zInt);
      const worldBefore2 = { x: worldBefore.x * factor, y: worldBefore.y * factor };
      const tl2 = { x: worldBefore2.x - pxCSS / s2, y: worldBefore2.y - pyCSS / s2 };
      const pointerCenter = { x: tl2.x + widthCSS / (2 * s2), y: tl2.y + heightCSS / (2 * s2) };
      // When zooming out, bias slightly toward keeping the visual center stable
      if (zClamped < this.zoom) {
        const centerScaled = { x: centerNow.x * factor, y: centerNow.y * factor };
        const dz = Math.max(0, this.zoom - zClamped);
        const bias = Math.max(0, Math.min(0.6, this.outCenterBias * dz));
        center2 = { x: pointerCenter.x * (1 - bias) + centerScaled.x * bias, y: pointerCenter.y * (1 - bias) + centerScaled.y * bias };
      } else {
        center2 = pointerCenter;
      }
    }
    // Clamp center in world bounds (respect wrapX and freePan)
    center2 = this._clampCenterWorld(center2, zInt2, s2, widthCSS, heightCSS);
    const { lng, lat } = worldToLngLat(center2.x, center2.y, zInt2);
    this.center = { lng, lat: clampLat(lat) };
    this.zoom = zClamped;
    this._needsRender = true;
  }

  // Finite-world center anchoring hysteresis
  private _isViewportLarger(zInt: number, scale: number, widthCSS: number, heightCSS: number) {
    const worldSize = TILE_SIZE * (1 << zInt);
    const halfW = widthCSS / (2 * scale);
    const halfH = heightCSS / (2 * scale);
    const margin = 0.98;
    return halfW >= (worldSize / 2) * margin || halfH >= (worldSize / 2) * margin;
  }
  private _viewportCoverageRatio(zInt: number, scale: number, widthCSS: number, heightCSS: number) {
    const worldSize = TILE_SIZE * (1 << zInt);
    const halfW = widthCSS / (2 * scale);
    const halfH = heightCSS / (2 * scale);
    const halfWorld = worldSize / 2;
    return Math.max(halfW, halfH) / halfWorld;
  }
  private _shouldAnchorCenterForZoom(targetZoom: number) {
    if (this.wrapX) return false;
    const rect = this.container.getBoundingClientRect();
    const widthCSS = rect.width; const heightCSS = rect.height;
    const zClamped = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));
    const zInt2 = Math.floor(zClamped); const s2 = Math.pow(2, zClamped - zInt2);
    const ratio = this._viewportCoverageRatio(zInt2, s2, widthCSS, heightCSS);
    const enter = 0.995; const exit = 0.90;
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (this._stickyCenterAnchor) {
      if (this._stickyAnchorUntil && now < this._stickyAnchorUntil) return true;
      if (ratio <= exit) this._stickyCenterAnchor = false;
    } else {
      if (ratio >= enter) { this._stickyCenterAnchor = true; this._stickyAnchorUntil = now + 300; }
    }
    return this._stickyCenterAnchor;
  }

  // Bounds clamping similar to JS version
  private _clampCenterWorld(centerWorld: { x: number; y: number }, zInt: number, scale: number, widthCSS: number, heightCSS: number) {
    if (this.freePan) return centerWorld;
    const worldSize = TILE_SIZE * (1 << zInt);
    const halfW = widthCSS / (2 * scale); const halfH = heightCSS / (2 * scale);
    let cx = centerWorld.x; let cy = centerWorld.y;
    if (!this.wrapX) {
      if (halfW >= worldSize / 2) cx = worldSize / 2; else cx = Math.max(halfW, Math.min(worldSize - halfW, cx));
    }
    if (halfH >= worldSize / 2) cy = worldSize / 2; else cy = Math.max(halfH, Math.min(worldSize - halfH, cy));
    return { x: cx, y: cy };
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
      const idle = (now - this._lastInteractAt) > this.interactionIdleMs;
      const baseZ = Math.floor(this.zoom);
      const centerWorld = lngLatToWorld(this.center.lng, this.center.lat, baseZ);
      let bestIdx = -1; let bestScore = Infinity;
      for (let i = 0; i < this._loadQueue.length; i++) {
        const t = this._loadQueue[i];
        if (!idle && t.z > baseZ) continue;
        const centerTileX = Math.floor(centerWorld.x / Math.pow(2, baseZ - t.z) / TILE_SIZE);
        const centerTileY = Math.floor(centerWorld.y / Math.pow(2, baseZ - t.z) / TILE_SIZE);
        const dx = t.x - centerTileX; const dy = t.y - centerTileY;
        const dist = Math.hypot(dx, dy);
        const zBias = Math.abs(t.z - baseZ);
        const score = t.priority * 100 + zBias * 10 + dist;
        if (score < bestScore) { bestScore = score; bestIdx = i; if (score === 0) break; }
      }
      if (bestIdx === -1) break;
      const task = this._loadQueue.splice(bestIdx, 1)[0];
      this._loadQueueSet.delete(task.key);
      this._startImageLoad(task);
    }
  }
  private _startImageLoad({ key, url }: { key: string; url: string }) {
    this._pendingKeys.add(key); this._inflightLoads++;
    this._tileCache.setLoading(key);
    if (this.useImageBitmap) {
      fetch(url, { mode: 'cors', credentials: 'omit' })
        .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); })
        .then((blob) => createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }))
        .then((bmp) => {
          try {
            const gl = this.gl; const tex = gl.createTexture(); if (!tex) { this._tileCache.setError(key); return; }
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
            gl.generateMipmap(gl.TEXTURE_2D);
            this._tileCache.setReady(key, tex, (bmp as any).width, (bmp as any).height, this._frame);
            this._needsRender = true;
          } finally { try { (bmp as any).close?.(); } catch {} this._pendingKeys.delete(key); this._inflightLoads = Math.max(0, this._inflightLoads - 1); this._processLoadQueue(); }
        })
        .catch(() => { this.useImageBitmap = false; this._startImageLoad({ key, url }); });
      return;
    }
    const img = new Image(); img.crossOrigin = 'anonymous'; img.decoding = 'async';
    img.onload = () => { try { const gl = this.gl; const tex = gl.createTexture(); if (!tex) { this._tileCache.setError(key); return; } gl.bindTexture(gl.TEXTURE_2D, tex); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D); this._tileCache.setReady(key, tex, img.naturalWidth, img.naturalHeight, this._frame); this._needsRender = true; } finally { this._pendingKeys.delete(key); this._inflightLoads = Math.max(0, this._inflightLoads - 1); this._processLoadQueue(); } };
    img.onerror = () => { this._tileCache.setError(key); this._pendingKeys.delete(key); this._inflightLoads = Math.max(0, this._inflightLoads - 1); this._processLoadQueue(); };
    img.src = url;
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
