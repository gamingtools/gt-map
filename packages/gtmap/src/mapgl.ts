import { TILE_SIZE, clampLat, lngLatToWorld, worldToLngLat } from './mercator';
import { createProgramFromSources } from './gl/program';
import { createUnitQuad } from './gl/quad';
import { ScreenCache } from './render/screenCache';
import { TileCache } from './tiles/cache';
import { TileQueue } from './tiles/queue';
import { urlFromTemplate, wrapX as wrapXTile, tileKey as tileKeyOf } from './tiles/source';
import { RasterRenderer } from './layers/raster';
import { EventBus } from './events/stream';
import { drawGrid } from './render/grid';
import { normalizeWheel } from './core/wheel';
import { startZoomEase as coreStartZoomEase, zoomToAnchored as coreZoomToAnchored } from './core/zoom';
import { attachHandlers } from './input/handlers';
import { startImageLoad as loaderStartImageLoad } from './tiles/loader';
import { renderFrame } from './render/frame';
import { prefetchNeighbors } from './tiles/prefetch';

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
    u_uv0: WebGLUniformLocation | null;
    u_uv1: WebGLUniformLocation | null;
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
  private _screenTexFormat: number | null = null;
  private _screenCache: ScreenCache | null = null;
  private _raster!: RasterRenderer;
  private _events = new EventBus();
  public readonly events = this._events; // experimental chainable events API
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
  private _queue: TileQueue = new TileQueue();
  private _inflightMap = new Map<string, HTMLImageElement>();
  private _wantedKeys = new Set<string>();
  private _pinnedKeys = new Set<string>();
  private prefetchBaselineLevel = 2;
  // Wheel coalescing + velocity tail
  private _wheelLinesAccum = 0;
  private _wheelLastCtrl = false;
  private _wheelAnchor: { px: number; py: number; mode: 'pointer' | 'center' } = { px: 0, py: 0, mode: 'pointer' };
  private _zoomVel = 0;
  private useImageBitmap = typeof createImageBitmap === 'function';
  private _movedSinceDown = false;

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
    this._screenCache = new ScreenCache(this.gl, (this._screenTexFormat ?? this.gl.RGBA) as any);
    // Initialize tile cache (LRU)
    this._tileCache = new TileCache(this.gl, this._maxTiles);
    // Raster renderer
    this._raster = new RasterRenderer(this.gl);
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
      this._queue = new TileQueue();
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
    this._queue = new TileQueue();
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
    this._cleanupEvents = attachHandlers(this as any);
  }
  // wheel normalization handled in input/handlers via core/wheel
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
    renderFrame(this);
  }


  // Prefetch a 1-tile border beyond current viewport at the given level
  private _prefetchNeighbors(zLevel: number, tlWorld: { x: number; y: number }, scale: number, widthCSS: number, heightCSS: number) { prefetchNeighbors(this, zLevel, tlWorld, scale, widthCSS, heightCSS); }

  // grid drawing via render/grid.drawGrid

  // (moved to the main definition above)
  // public setGridVisible removed (duplicate)

  private _enqueueTile(z: number, x: number, y: number, priority = 1) {
    const key = tileKeyOf(z, x, y);
    if (this._tileCache.has(key) || this._pendingKeys.has(key) || this._queue.has(key)) return;
    const url = this._tileUrl(z, x, y);
    this._queue.enqueue({ key, url, z, x, y, priority });
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
    if (t >= 1) { this._zoomAnim = null; this._renderBaseLockZInt = null; this._events.emit('zoomend', { center: this.center, zoom: this.zoom }); }
    return true;
  }
  private _startZoomEase(dz: number, px: number, py: number, anchor: 'pointer' | 'center') { coreStartZoomEase(this, dz, px, py, anchor); }
  private _zoomToAnchored(targetZoom: number, pxCSS: number, pyCSS: number, anchor: 'pointer' | 'center') { coreZoomToAnchored(this, targetZoom, pxCSS, pyCSS, anchor); }

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
  private _processLoadQueue() {
    while (this._inflightLoads < this._maxInflightLoads) {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const idle = (now - this._lastInteractAt) > this.interactionIdleMs;
      const baseZ = Math.floor(this.zoom);
      const centerWorld = lngLatToWorld(this.center.lng, this.center.lat, baseZ);
      const task = this._queue.next(baseZ, centerWorld, idle);
      if (!task) break;
      this._startImageLoad(task);
    }
  }
  private _startImageLoad({ key, url }: { key: string; url: string }) { loaderStartImageLoad(this, { key, url }); }
  private _cancelUnwantedLoads() {
    // Only prune queued tasks that are no longer wanted; keep inflight loads to avoid churn
    this._queue.prune(this._wantedKeys);
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
