import { clampLat, lngLatToWorld } from './mercator';
// programs are initialized via Graphics
import Graphics from './gl/Graphics';
import { initCanvas, initGridCanvas, setGridVisible as setGridVisibleCore } from './core/canvas';
import { resize as resizeCore } from './core/resize';
import { ScreenCache } from './render/screenCache';
import { TileCache } from './tiles/cache';
// import { TileQueue } from './tiles/queue';
import TilePipeline from './tiles/TilePipeline';
import type { TileDeps } from './types';
import { urlFromTemplate } from './tiles/source';
import { RasterRenderer } from './layers/raster';
import { EventBus } from './events/stream';
// grid and wheel helpers are used via delegated modules
// zoom core used via ZoomController
import ZoomController from './core/ZoomController';
import InputController from './input/InputController';
import type { InputDeps } from './types';
import { startImageLoad as loaderStartImageLoad } from './tiles/loader';
import MapRenderer from './render/MapRenderer';
import type { ViewState } from './types';
import { prefetchNeighborsCtx } from './tiles/prefetch';
import { drawGrid } from './render/grid';
import { clampCenterWorld as clampCenterWorldCore } from './core/bounds';

export type LngLat = { lng: number; lat: number };
export type MapOptions = {
  tileUrl?: string;
  tileSize?: number;
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
  tileSize: number;
  minZoom: number;
  maxZoom: number;
  wrapX: boolean;
  freePan: boolean;
  center: LngLat;
  zoom: number;

  private _needsRender = true;
  private _raf: number | null = null;
  private _input: InputController | null = null;
  private _inputDeps!: InputDeps;
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
  // removed: wheelGain/wheelGainCtrl (not used after DI)
  private zoomDamping = 0.09;
  private maxZoomRate = 12.0;
  // private _zoomAnim: { from: number; to: number; px: number; py: number; start: number; dur: number; anchor: 'pointer' | 'center' } | null = null;
  private anchorMode: 'pointer' | 'center' = 'pointer';
  // Easing options now owned by ZoomController
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
  private _zoomCtrl!: ZoomController;
  private _gfx!: Graphics;
  private _state!: ViewState;
  private _view(): ViewState { return this._state; }
  // Build the rendering context (internal)
  public getRenderCtx() {
    return {
      gl: this.gl,
      prog: this._prog!,
      loc: this._loc!,
      quad: this._quad!,
      canvas: this.canvas,
      dpr: this._dpr,
      container: this.container,
      zoom: this.zoom,
      center: this.center,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      wrapX: this.wrapX,
      useScreenCache: this.useScreenCache,
      screenCache: this._screenCache,
      raster: this._raster,
      tileCache: this._tileCache,
      tileSize: this.tileSize,
      enqueueTile: (z: number, x: number, y: number, p = 1) => this._enqueueTile(z, x, y, p),
    } as any;
  }
  public prefetchNeighbors(z: number, tl: { x: number; y: number }, scale: number, w: number, h: number) {
    prefetchNeighborsCtx({ wrapX: this.wrapX, tileSize: this.tileSize, hasTile: (key: string) => this._tileCache.has(key), enqueueTile: (zz: number, xx: number, yy: number, p = 1) => this._enqueueTile(zz, xx, yy, p) }, z, tl, scale, w, h);
  }
  public cancelUnwantedLoads() { this._cancelUnwantedLoads(); }
  public clearWantedKeys() { this._wantedKeys.clear(); }
  public zoomVelocityTick() {
    if (Math.abs(this._zoomVel) <= 1e-4) return;
    const dt = Math.max(0.0005, Math.min(0.1, this._dt || 1 / 60));
    const maxStep = Math.max(0.0001, this.maxZoomRate * dt);
    let step = this._zoomVel * dt; step = Math.max(-maxStep, Math.min(maxStep, step));
    const anchor = (this._wheelAnchor?.mode || this.anchorMode) as 'pointer' | 'center';
    const px = this._wheelAnchor?.px ?? 0; const py = this._wheelAnchor?.py ?? 0;
    this._zoomCtrl.applyAnchoredZoom(this.zoom + step, px, py, anchor);
    const k = Math.exp(-dt / this.zoomDamping); this._zoomVel *= k; if (Math.abs(this._zoomVel) < 1e-3) this._zoomVel = 0;
  }
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
  private _tiles!: TilePipeline;
  private _tileDeps!: TileDeps;
  private _loaderDeps!: any;
  private _wantedKeys = new Set<string>();
  private _pinnedKeys = new Set<string>();
  private prefetchBaselineLevel = 2;
  // Wheel coalescing + velocity tail
  // removed: legacy wheel coalescing fields (handled via easing)
  private _wheelAnchor: { px: number; py: number; mode: 'pointer' | 'center' } = { px: 0, py: 0, mode: 'pointer' };
  private _zoomVel = 0;
  // Loader checks this dynamically; no need to track read locally
  useImageBitmap = typeof createImageBitmap === 'function';
  // private _movedSinceDown = false; // deprecated; input handled by controller

  constructor(container: HTMLDivElement, options: MapOptions = {}) {
    this.container = container;
    this.tileUrl = options.tileUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.tileSize = (Number.isFinite(options.tileSize as number) ? (options.tileSize as number) : 256);
    this.minZoom = options.minZoom ?? 1;
    this.maxZoom = options.maxZoom ?? 19;
    this.wrapX = options.wrapX ?? true;
    this.freePan = options.freePan ?? false;
    this.center = { lng: options.center?.lng ?? 0, lat: options.center?.lat ?? 0 };
    this.zoom = options.zoom ?? 2;
    initCanvas(this);
    this._gfx = new Graphics(this as any);
    this._gfx.init();
    this._initPrograms();
    // Initialize screen cache module (uses detected format)
    this._screenCache = new ScreenCache(this.gl, (this._screenTexFormat ?? this.gl.RGBA) as any);
    // Initialize tile cache (LRU)
    this._tileCache = new TileCache(this.gl, this._maxTiles);
    this._tileDeps = {
      hasTile: (key: string) => this._tileCache.has(key),
      isPending: (key: string) => this._pendingKeys.has(key),
      urlFor: (z: number, x: number, y: number) => this._tileUrl(z, x, y),
      hasCapacity: () => this._inflightLoads < this._maxInflightLoads,
      now: () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
      getInteractionIdleMs: () => this.interactionIdleMs,
      getLastInteractAt: () => this._lastInteractAt,
      getZoom: () => this.zoom,
      getCenter: () => this.center,
      getTileSize: () => this.tileSize,
      startImageLoad: ({ key, url }: { key: string; url: string }) => this._startImageLoad({ key, url }),
      addPinned: (key: string) => { this._pinnedKeys.add(key); },
    };
    this._loaderDeps = {
      addPending: (key: string) => this._pendingKeys.add(key),
      removePending: (key: string) => this._pendingKeys.delete(key),
      incInflight: () => { this._inflightLoads++; },
      decInflight: () => { this._inflightLoads = Math.max(0, this._inflightLoads - 1); this._tiles.process(); },
      setLoading: (key: string) => this._tileCache.setLoading(key),
      setError: (key: string) => this._tileCache.setError(key),
      setReady: (key: string, tex: WebGLTexture, width: number, height: number, frame: number) => this._tileCache.setReady(key, tex, width, height, frame),
      getGL: () => this.gl,
      getFrame: () => this._frame,
      requestRender: () => { this._needsRender = true },
      getUseImageBitmap: () => this.useImageBitmap,
      setUseImageBitmap: (v: boolean) => { this.useImageBitmap = v },
    };
    this._tiles = new TilePipeline(this._tileDeps);
    // Raster renderer
    this._raster = new RasterRenderer(this.gl);
    this._renderer = new MapRenderer(
      () => this.getRenderCtx(),
      {
        stepAnimation: () => this._zoomCtrl.step(),
        zoomVelocityTick: () => this.zoomVelocityTick(),
        prefetchNeighbors: (z, tl, scale, w, h) => this.prefetchNeighbors(z, tl, scale, w, h),
        cancelUnwanted: () => this.cancelUnwantedLoads(),
        clearWanted: () => this.clearWantedKeys(),
      },
    );
    this._zoomCtrl = new ZoomController({
      getZoom: () => this.zoom,
      getMinZoom: () => this.minZoom,
      getMaxZoom: () => this.maxZoom,
      getTileSize: () => this.tileSize,
      shouldAnchorCenterForZoom: (target) => this._shouldAnchorCenterForZoom(target),
      getMap: () => this,
      getOutCenterBias: () => this.outCenterBias,
      clampCenterWorld: (cw, zInt, s, w, h) => clampCenterWorldCore(cw, zInt, s, w, h, this.wrapX, this.freePan, this.tileSize),
      emit: (name: string, payload: any) => this._events.emit(name, payload),
      requestRender: () => { this._needsRender = true },
      now: () => ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()),
    });
    // View state
    this._state = { center: this.center, zoom: this.zoom, minZoom: this.minZoom, maxZoom: this.maxZoom, wrapX: this.wrapX };
    // DI configured; no temporary TS-usage hacks required
    initGridCanvas(this);
    this.resize();
    this._initEvents();
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
    this._tiles.scheduleBaselinePrefetch(this.prefetchBaselineLevel);
    // DI in place for input/tiles/render; no need for TS usage hacks
  }

  setCenter(lng: number, lat: number) {
    this.center.lng = lng;
    this.center.lat = clampLat(lat);
    this._state.center = this.center;
    this._needsRender = true;
  }
  setZoom(zoom: number) {
    const z = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    if (z !== this.zoom) {
      this.zoom = z;
      this._state.zoom = this.zoom;
      this._needsRender = true;
    }
  }
  setTileSource(opts: {
    url?: string;
    tileSize?: number;
    minZoom?: number;
    maxZoom?: number;
    wrapX?: boolean;
    clearCache?: boolean;
  }) {
    if (typeof opts.url === 'string') this.tileUrl = opts.url;
    if (Number.isFinite(opts.tileSize as number)) this.tileSize = opts.tileSize as number;
    if (Number.isFinite(opts.minZoom as number)) this.minZoom = opts.minZoom as number;
    if (Number.isFinite(opts.maxZoom as number)) this.maxZoom = opts.maxZoom as number;
    if (typeof opts.wrapX === 'boolean') this.wrapX = opts.wrapX;
    // reflect to view state
    this._state.minZoom = this.minZoom;
    this._state.maxZoom = this.maxZoom;
    this._state.wrapX = this.wrapX;
    if (opts.clearCache) {
      // clear GPU textures and cache
      this._tileCache.clear();
      this._pendingKeys.clear();
      this._tiles.clear();
    }
    this._needsRender = true;
  }
  setEaseOptions(_opts: EaseOptions) {
    this._zoomCtrl.setOptions({ easeBaseMs: _opts.easeBaseMs, easePerUnitMs: _opts.easePerUnitMs });
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
    try { (this as any)._renderer?.dispose?.(); } catch {}
    try { (this as any)._tiles?.clear?.(); } catch {}
    try { (this as any)._gfx?.dispose?.(); } catch {}
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
    this._tiles.clear();
    this._inflightLoads = 0;
  }
  public setWheelSpeed(speed: number) {
    if (Number.isFinite(speed)) {
      this.wheelSpeed = Math.max(0.01, Math.min(2, speed));
      const t = Math.max(0, Math.min(1, this.wheelSpeed / 2));
      // Map speed to immediate step size; velocity gain removed in DI path
      this.wheelImmediate = 0.05 + t * (1.75 - 0.05);
    }
    // Keep ctrl-step in sync if desired
    const t2 = Math.max(0, Math.min(1, (this.wheelSpeedCtrl || 0.4) / 2));
    this.wheelImmediateCtrl = 0.10 + t2 * (1.90 - 0.10);
  }
  public setAnchorMode(mode: 'pointer' | 'center') { this.anchorMode = mode; }

  private _initPrograms() {
    // Delegate to Graphics to set up programs and buffers
    this._gfx.initPrograms();
  }
  resize() {
    resizeCore(this);
  }
  private _initEvents() {
    this._inputDeps = {
      getContainer: () => this.container,
      getCanvas: () => this.canvas,
      getMaxZoom: () => this.maxZoom,
      getView: () => this._view(),
      getTileSize: () => this.tileSize,
      setCenter: (lng: number, lat: number) => this.setCenter(lng, lat),
      clampCenterWorld: (cw, zInt, scale, w, h) => clampCenterWorldCore(cw, zInt, scale, w, h, this.wrapX, this.freePan, this.tileSize),
      updatePointerAbs: (x: number, y: number) => { this.pointerAbs = { x, y }; },
      emit: (name: string, payload: any) => this._events.emit(name, payload),
      setLastInteractAt: (t: number) => { this._lastInteractAt = t; },
      getAnchorMode: () => this.anchorMode,
      getWheelStep: (ctrl: boolean) => ctrl ? (this.wheelImmediateCtrl || this.wheelImmediate || 0.16) : (this.wheelImmediate || 0.16),
      startEase: (dz, px, py, anchor) => this._zoomCtrl.startEase(dz, px, py, anchor),
      cancelZoomAnim: () => { this._zoomCtrl.cancel(); },
      applyAnchoredZoom: (targetZoom, px, py, anchor) => this._zoomCtrl.applyAnchoredZoom(targetZoom, px, py, anchor),
    };
    this._input = new InputController(this._inputDeps);
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
    if (!this._needsRender && !this._zoomCtrl.isAnimating()) return;
    this._render();
    // Keep rendering while animating
    if (!this._zoomCtrl.isAnimating()) this._needsRender = false;
  }
  private _render() {
    this._renderer.render();
    if (this.showGrid) {
      const rect = this.container.getBoundingClientRect();
      const baseZ = Math.floor(this.zoom);
      const scale = Math.pow(2, this.zoom - baseZ);
      const widthCSS = rect.width; const heightCSS = rect.height;
      const centerWorld = lngLatToWorld(this.center.lng, this.center.lat, baseZ, this.tileSize);
      const tlWorld = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };
      drawGrid(this._gridCtx, this.gridCanvas, baseZ, scale, widthCSS, heightCSS, tlWorld, this._dpr, this.maxZoom, this.tileSize);
    }
  }
  

  // Prefetch a 1-tile border beyond current viewport at the given level
  // grid drawing via render/grid.drawGrid

  // (moved to the main definition above)
  // public setGridVisible removed (duplicate)

  private _enqueueTile(z: number, x: number, y: number, priority = 1) { this._tiles.enqueue(z, x, y, priority); }

  private _tileUrl(z: number, x: number, y: number) {
    return urlFromTemplate(this.tileUrl, z, x, y);
  }

  // wrapX and eviction helpers now provided by tiles/source and TileCache

  // Zoom actions handled by ZoomController

  // Finite-world center anchoring hysteresis
  private _viewportCoverageRatio(zInt: number, scale: number, widthCSS: number, heightCSS: number) {
    const worldSize = this.tileSize * (1 << zInt);
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



  // (TEMP helper removed after Render DI completion)

  // Bounds clamping similar to JS version
  
  // Deprecated: loader now calls _tiles.process() directly
  private _startImageLoad({ key, url }: { key: string; url: string }) { loaderStartImageLoad(this._loaderDeps, { key, url }); }
  private _cancelUnwantedLoads() {
    // Only prune queued tasks that are no longer wanted; keep inflight loads to avoid churn
    this._tiles.cancelUnwanted(this._wantedKeys);
    this._wantedKeys.clear();
    this._tiles.process();
  }

  


}
