import { TILE_SIZE, clampLat } from './mercator';
import { initPrograms } from './gl/programs';
import { initGL } from './gl/context';
import { initCanvas, initGridCanvas, setGridVisible as setGridVisibleCore } from './core/canvas';
import { resize as resizeCore } from './core/resize';
import { ScreenCache } from './render/screenCache';
import { TileCache } from './tiles/cache';
import { TileQueue } from './tiles/queue';
import TilePipeline from './tiles/TilePipeline';
import { urlFromTemplate, wrapX as wrapXTile } from './tiles/source';
import { RasterRenderer } from './layers/raster';
import { EventBus } from './events/stream';
// grid and wheel helpers are used via delegated modules
import { startZoomEase as coreStartZoomEase, zoomToAnchored as coreZoomToAnchored } from './core/zoom';
import InputController from './input/InputController';
import { startImageLoad as loaderStartImageLoad } from './tiles/loader';
import MapRenderer from './render/MapRenderer';
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
  private _input: InputController | null = null;
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
  private _renderer!: MapRenderer;
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
  private _tiles!: TilePipeline;
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
    initCanvas(this);
    initGL(this);
    this._initPrograms();
    // Initialize screen cache module (uses detected format)
    this._screenCache = new ScreenCache(this.gl, (this._screenTexFormat ?? this.gl.RGBA) as any);
    // Initialize tile cache (LRU)
    this._tileCache = new TileCache(this.gl, this._maxTiles);
    this._tiles = new TilePipeline(this as any);
    // Raster renderer
    this._raster = new RasterRenderer(this.gl);
    this._renderer = new MapRenderer();
    initGridCanvas(this);
    this.resize();
    this._initEvents();
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
    this._scheduleBaselinePrefetch();
    if (false) this._markUsed();
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
      this._tiles.clear();
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
    this._input?.dispose();
    this._input = null;
    this._clearCache();
    const gl = this.gl;
    this._screenCache?.dispose();
    if (this._quad) { try { gl.deleteBuffer(this._quad); } catch {} this._quad = null; }
    if (this._prog) { try { gl.deleteProgram(this._prog); } catch {} this._prog = null; }
    try { this.canvas.remove(); } catch {}
    if (this.gridCanvas) { try { this.gridCanvas.remove(); } catch {} this.gridCanvas = null; this._gridCtx = null; }
  }

  // Public controls
  public setGridVisible(visible: boolean) { setGridVisibleCore(this, visible); }
  private _clearCache() {
    // Delete GPU textures in tile cache and reset queues
    this._tileCache.clear();
    this._wantedKeys.clear();
    this._pinnedKeys.clear();
    this._pendingKeys.clear();
    this._queue = new TileQueue();
    this._tiles.clear();
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

  private _initPrograms() {
    const { prog, loc, quad } = initPrograms(this.gl);
    this._prog = prog;
    this._loc = loc as any;
    this._quad = quad;
  }
  resize() {
    resizeCore(this);
  }
  private _initEvents() {
    this._input = new InputController(this as any);
    this._input.attach();
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
  private _render() { this._renderer.render(this); }


  // Prefetch a 1-tile border beyond current viewport at the given level
  private _prefetchNeighbors(zLevel: number, tlWorld: { x: number; y: number }, scale: number, widthCSS: number, heightCSS: number) { prefetchNeighbors(this, zLevel, tlWorld, scale, widthCSS, heightCSS); }

  // grid drawing via render/grid.drawGrid

  // (moved to the main definition above)
  // public setGridVisible removed (duplicate)

  private _enqueueTile(z: number, x: number, y: number, priority = 1) { this._tiles.enqueue(z, x, y, priority); }

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
  private _processLoadQueue() { this._tiles.process(); }
  private _startImageLoad({ key, url }: { key: string; url: string }) { loaderStartImageLoad(this, { key, url }); }
  private _cancelUnwantedLoads() {
    // Only prune queued tasks that are no longer wanted; keep inflight loads to avoid churn
    this._tiles.cancelUnwanted(this._wantedKeys);
    this._wantedKeys.clear();
    this._tiles.process();
  }

  private _scheduleBaselinePrefetch() { this._tiles.scheduleBaselinePrefetch(this.prefetchBaselineLevel); }

  // Reference private fields so TS noUnusedLocals doesn't flag them; they are used by delegated modules at runtime.
  private _markUsed() {
    console.log(
      this._dpr,
      this._loc,
      this._dt,
      this.interactionIdleMs,
      this._lastInteractAt,
      this._maxInflightLoads,
      this._inflightLoads,
      this._queue,
      this.wheelImmediate,
      this.wheelImmediateCtrl,
      this.wheelGain,
      this.wheelGainCtrl,
      this.zoomDamping,
      this.maxZoomRate,
      this.anchorMode,
      this._renderBaseLockZInt,
      this.easeBaseMs,
      this.easePerUnitMs,
      this.easeMinMs,
      this.easeMaxMs,
      this.outCenterBias,
      this.useScreenCache,
      this._raster,
      this.showGrid,
      this._gridCtx,
      this._wheelLinesAccum,
      this._wheelLastCtrl,
      this._wheelAnchor,
      this._zoomVel,
      this.useImageBitmap,
      this._movedSinceDown,
      this._detectScreenFormat,
      this._enqueueTile,
      this._tileUrl,
      this._prefetchNeighbors,
      this._wrapX,
      this._evictIfNeeded,
      this._processLoadQueue,
      this._startImageLoad,
      this._stepAnimation,
      this._startZoomEase,
      this._isViewportLarger,
      this._shouldAnchorCenterForZoom,
      this._clampCenterWorld,
      this._cancelUnwantedLoads,
    );
  }
}
