// Pixel-CRS: treat lng=x, lat=y in image pixel coordinates at native resolution
// programs are initialized via Graphics
import Graphics from './gl/Graphics';
import { ScreenCache } from './render/screenCache';
import { TileCache } from './tiles/cache';
// import { TileQueue } from './tiles/queue';
import TilePipeline from './tiles/TilePipeline';
import { TileLoader, type TileLoaderDeps } from './tiles/loader';
import type { TileDeps, RenderCtx } from './types';
// url templating moved inline
import { RasterRenderer } from './layers/raster';
import { IconRenderer } from './layers/icons';
import { EventBus } from './events/stream';
// grid and wheel helpers are used via delegated modules
// zoom core used via ZoomController
import ZoomController from './core/ZoomController';
import InputController from './input/InputController';
import type { InputDeps } from './types';
import MapRenderer from './render/MapRenderer';
import type { ViewState } from './types';
// prefetch/grid helpers moved inline
import { clampCenterWorld as clampCenterWorldCore } from './core/bounds';
import { FrameLoop } from './core/FrameLoop';

export type LngLat = { lng: number; lat: number };
export type MapOptions = {
  tileUrl?: string;
  tileSize?: number;
  minZoom?: number;
  maxZoom?: number;
  mapSize?: { width: number; height: number };
  wrapX?: boolean;
  freePan?: boolean;
  center?: LngLat;
  zoom?: number;
  zoomOutCenterBias?: number | boolean;
  // Render pacing
  fpsCap?: number; // cap rendering to this FPS (default 60)
  // Recommended tunables
  maxTiles?: number;
  maxInflightLoads?: number;
  interactionIdleMs?: number;
  prefetch?: { enabled?: boolean; baselineLevel?: number };
  screenCache?: boolean;
  wheelSpeedCtrl?: number;
  // Leaflet-like bounds
  maxBoundsPx?: { minX: number; minY: number; maxX: number; maxY: number } | null;
  maxBoundsViscosity?: number;
  bounceAtZoomLimits?: boolean;
};
export type EaseOptions = {
  easeBaseMs?: number;
  easePerUnitMs?: number;
  pinchEaseMs?: number;
  easePinch?: boolean;
};
export type IconDefInput = { iconPath: string; x2IconPath?: string; width: number; height: number };
export type MarkerInput = { lng: number; lat: number; type: string; size?: number };

export default class GTMap {
  container: HTMLDivElement;
  canvas!: HTMLCanvasElement;
  gl!: WebGLRenderingContext;
  tileUrl: string;
  tileSize: number;
  minZoom: number;
  maxZoom: number;
  mapSize: { width: number; height: number };
  wrapX: boolean;
  freePan: boolean;
  center: LngLat;
  zoom: number;

  private _needsRender = true;
  private _raf: number | null = null; // deprecated, kept for backward compat in setActive
  private _frameLoop: FrameLoop | null = null;
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
  // lastFrameAt handled by FrameLoop
  private _targetFps = 60;
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
  private _icons!: IconRenderer;
  private _renderer!: MapRenderer;
  private _rasterOpacity = 1.0;
  private _upscaleFilter: 'auto' | 'linear' | 'bicubic' = 'auto';
  private _zoomCtrl!: ZoomController;
  private _gfx!: Graphics;
  private _state!: ViewState;
  private _active = true;
  private _glReleased = false;
  private _maxBoundsPx: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
  private _maxBoundsViscosity = 0;
  _bounceAtZoomLimits = false;
  // Tile source availability
  private _sourceMaxZoom: number = 0;
  // Home view (initial center)
  // Home view (initial center) no longer tracked
  // Leaflet-like inertia options and state
  private inertia = true;
  private inertiaDeceleration = 3400; // px/s^2
  private inertiaMaxSpeed = 2000; // px/s (cap to prevent excessive throw)
  private easeLinearity = 0.2;
  private _panAnim: null | { start: number; dur: number; from: { x: number; y: number }; offsetWorld: { x: number; y: number } } = null;
  private _view(): ViewState {
    return {
      center: this.center,
      zoom: this.zoom,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      wrapX: this.wrapX,
    };
  }
  // Build the rendering context (internal)
  public getRenderCtx(): RenderCtx {
    return {
      gl: this.gl,
      prog: this._prog!,
      loc: this._loc as any,
      quad: this._quad!,
      canvas: this.canvas,
      dpr: this._dpr,
      container: this.container,
      zoom: this.zoom,
      center: this.center,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      mapSize: this.mapSize,
      wrapX: this.wrapX,
      useScreenCache: this.useScreenCache,
      screenCache: this._screenCache,
      raster: this._raster,
      rasterOpacity: this._rasterOpacity,
      upscaleFilter: this._upscaleFilter,
      icons: this._icons,
      tileCache: this._tileCache,
      tileSize: this.tileSize,
      sourceMaxZoom: this._sourceMaxZoom,
      // Project image pixels at native resolution into level-z pixel coords
      project: (x: number, y: number, z: number) => {
        const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
        const s = Math.pow(2, imageMaxZ - z);
        return { x: x / s, y: y / s };
      },
      enqueueTile: (z: number, x: number, y: number, p = 1) => this._enqueueTile(z, x, y, p),
    };
  }
  // prefetchNeighbors moved below (inline implementation)
  public cancelUnwantedLoads() {
    this._cancelUnwantedLoads();
  }
  public clearWantedKeys() {
    this._wantedKeys.clear();
  }
  public zoomVelocityTick() {
    if (Math.abs(this._zoomVel) <= 1e-4) return;
    const dt = Math.max(0.0005, Math.min(0.1, this._dt || 1 / 60));
    const maxStep = Math.max(0.0001, this.maxZoomRate * dt);
    let step = this._zoomVel * dt;
    step = Math.max(-maxStep, Math.min(maxStep, step));
    const anchor = (this._wheelAnchor?.mode || this.anchorMode) as 'pointer' | 'center';
    const px = this._wheelAnchor?.px ?? 0;
    const py = this._wheelAnchor?.py ?? 0;
    this._zoomCtrl.applyAnchoredZoom(this.zoom + step, px, py, anchor);
    const k = Math.exp(-dt / this.zoomDamping);
    this._zoomVel *= k;
    if (Math.abs(this._zoomVel) < 1e-3) this._zoomVel = 0;
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
  private _lastInteractAt =
    typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  private _maxInflightLoads = 8;
  private _inflightLoads = 0;
  private _pendingKeys = new Set<string>();
  private _tiles!: TilePipeline;
  private _tileDeps!: TileDeps;
  private _loader!: TileLoader;
  private _loaderDeps!: TileLoaderDeps;
  private _wantedKeys = new Set<string>();
  private _pinnedKeys = new Set<string>();
  private prefetchEnabled = false;
  // Wheel coalescing + velocity tail
  // removed: legacy wheel coalescing fields (handled via easing)
  private _wheelAnchor: { px: number; py: number; mode: 'pointer' | 'center' } = {
    px: 0,
    py: 0,
    mode: 'pointer',
  };
  private _zoomVel = 0;
  // Loader checks this dynamically; no need to track read locally
  useImageBitmap = typeof createImageBitmap === 'function';
  // private _movedSinceDown = false; // deprecated; input handled by controller

  constructor(container: HTMLDivElement, options: MapOptions = {}) {
    this.container = container;
    this.tileUrl = options.tileUrl ?? '';
    this.tileSize = Number.isFinite(options.tileSize as number)
      ? (options.tileSize as number)
      : 256;
    this.minZoom = options.minZoom ?? 0;
    // Infer maxZoom from mapSize if provided
    if (options.mapSize && !Number.isFinite(options.maxZoom as number)) {
      const maxDim = Math.max(options.mapSize.width, options.mapSize.height);
      this.maxZoom = Math.max(0, Math.floor(Math.log2(Math.max(1, maxDim / this.tileSize))));
    } else {
      this.maxZoom = options.maxZoom ?? 19;
    }
    this.mapSize = options.mapSize ?? { width: this.tileSize * (1 << this.maxZoom), height: this.tileSize * (1 << this.maxZoom) };
    this.wrapX = options.wrapX ?? false;
    this.freePan = options.freePan ?? false;
    this.center = { lng: options.center?.lng ?? (this.mapSize.width / 2), lat: options.center?.lat ?? (this.mapSize.height / 2) };
    // Initial center captured by the app as needed
    this.zoom = options.zoom ?? 2;
    if (typeof options.zoomOutCenterBias === 'boolean') {
      this.outCenterBias = options.zoomOutCenterBias ? 0.15 : 0.0;
    } else if (Number.isFinite(options.zoomOutCenterBias as number)) {
      const v = Math.max(0, Math.min(1, options.zoomOutCenterBias as number));
      this.outCenterBias = v;
    }
    this._initCanvas();
    this._gfx = new Graphics(this as any);
    this._gfx.init();
    this._initPrograms();
    // Apply recommended options
    if (Number.isFinite(options.maxTiles as number)) this._maxTiles = Math.max(0, (options.maxTiles as number) | 0);
    if (Number.isFinite(options.maxInflightLoads as number)) this._maxInflightLoads = Math.max(0, (options.maxInflightLoads as number) | 0);
    if (Number.isFinite(options.interactionIdleMs as number)) this.interactionIdleMs = Math.max(0, (options.interactionIdleMs as number) | 0);
    if (Number.isFinite(options.fpsCap as number)) {
      const v = Math.max(15, Math.min(240, (options.fpsCap as number) | 0));
      this._targetFps = v;
    }
    if (options.prefetch) {
      if (typeof options.prefetch.enabled === 'boolean') this.prefetchEnabled = options.prefetch.enabled;
    }
    if (typeof options.screenCache === 'boolean') this.useScreenCache = options.screenCache;
    if (Number.isFinite(options.wheelSpeedCtrl as number)) this.wheelSpeedCtrl = Math.max(0.01, Math.min(2, options.wheelSpeedCtrl as number));
    if (options.maxBoundsPx) this._maxBoundsPx = { ...options.maxBoundsPx };
    if (Number.isFinite(options.maxBoundsViscosity as number)) this._maxBoundsViscosity = Math.max(0, Math.min(1, options.maxBoundsViscosity as number));
    if (typeof options.bounceAtZoomLimits === 'boolean') this._bounceAtZoomLimits = options.bounceAtZoomLimits;

    // Initialize screen cache module (uses detected format)
    this._screenCache = new ScreenCache(this.gl, (this._screenTexFormat ?? this.gl.RGBA) as any);
    // Initialize tile cache (LRU)
    this._tileCache = new TileCache(this.gl, this._maxTiles);
    this._tileDeps = {
      hasTile: (key: string) => this._tileCache.has(key),
      isPending: (key: string) => this._pendingKeys.has(key),
      urlFor: (z: number, x: number, y: number) => this._tileUrl(z, x, y),
      hasCapacity: () => this._active && (this._inflightLoads < this._maxInflightLoads),
      now: () =>
        typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
      getInteractionIdleMs: () => this.interactionIdleMs,
      getLastInteractAt: () => this._lastInteractAt,
      getZoom: () => this.zoom,
      getMaxZoom: () => this.maxZoom,
      getCenter: () => this.center,
      getTileSize: () => this.tileSize,
      startImageLoad: ({ key, url }: { key: string; url: string }) =>
        this._loader.start({ key, url }),
      addPinned: (key: string) => {
        this._pinnedKeys.add(key);
      },
    };
    this._loaderDeps = {
      addPending: (key: string) => this._pendingKeys.add(key),
      removePending: (key: string) => this._pendingKeys.delete(key),
      incInflight: () => {
        this._inflightLoads++;
      },
      decInflight: () => {
        this._inflightLoads = Math.max(0, this._inflightLoads - 1);
        this._tiles.process();
      },
      setLoading: (key: string) => this._tileCache.setLoading(key),
      setError: (key: string) => this._tileCache.setError(key),
      setReady: (key: string, tex: WebGLTexture, width: number, height: number, frame: number) =>
        this._tileCache.setReady(key, tex, width, height, frame),
      getGL: () => this.gl,
      getFrame: () => this._frame,
      requestRender: () => {
        this._needsRender = true;
      },
      getUseImageBitmap: () => this.useImageBitmap,
      setUseImageBitmap: (v: boolean) => {
        this.useImageBitmap = v;
      },
    };
    this._tiles = new TilePipeline(this._tileDeps);
    this._loader = new TileLoader(this._loaderDeps);
    // Raster renderer
    this._raster = new RasterRenderer(this.gl);
    this._icons = new IconRenderer(this.gl);
    this._renderer = new MapRenderer(() => this.getRenderCtx(), {
      stepAnimation: () => this._zoomCtrl.step(),
      zoomVelocityTick: () => this.zoomVelocityTick(),
      panVelocityTick: () => this.panVelocityTick(),
      prefetchNeighbors: (z, tl, scale, w, h) => this.prefetchNeighbors(z, tl, scale, w, h),
      cancelUnwanted: () => this.cancelUnwantedLoads(),
      clearWanted: () => this.clearWantedKeys(),
    });
    this._zoomCtrl = new ZoomController({
      getZoom: () => this.zoom,
      getMinZoom: () => this.minZoom,
      getMaxZoom: () => this.maxZoom,
      getImageMaxZoom: () => (this._sourceMaxZoom || this.maxZoom) as number,
      getTileSize: () => this.tileSize,
      shouldAnchorCenterForZoom: (target) => this._shouldAnchorCenterForZoom(target),
      getMap: () => this,
      getOutCenterBias: () => this.outCenterBias,
      clampCenterWorld: (cw, zInt, s, w, h) =>
        clampCenterWorldCore(cw, zInt, s, w, h, this.wrapX, this.freePan, this.tileSize, this.mapSize, this.maxZoom, this._maxBoundsPx, this._maxBoundsViscosity, false),
      emit: (name: string, payload: any) => this._events.emit(name, payload),
      requestRender: () => {
        this._needsRender = true;
      },
      now: () =>
        typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
    });
    // View state
    this._state = {
      center: this.center,
      zoom: this.zoom,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      wrapX: this.wrapX,
    };
    // DI configured; no temporary TS-usage hacks required
    this._initGridCanvas();
    this.resize();
    this._initEvents();
    this._frameLoop = new FrameLoop(
      () => this._targetFps,
      (now: number, allowRender: boolean) => this._tick(now, allowRender),
    );
    this._frameLoop.start();
    // Delay baseline prefetch until a tile source is explicitly set
    // DI in place for input/tiles/render; no need for TS usage hacks
  }

  setCenter(lng: number, lat: number) {
    // If bounds are set, strictly clamp center against bounds (Leaflet-like)
    if (this._maxBoundsPx) {
      const zInt = Math.floor(this.zoom);
      const scale = Math.pow(2, this.zoom - zInt);
      const rect = this.container.getBoundingClientRect();
      const wCSS = rect.width, hCSS = rect.height;
      const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
      const s0 = Math.pow(2, imageMaxZ - zInt);
      const cw = { x: lng / s0, y: lat / s0 };
      const clamped = clampCenterWorldCore(cw, zInt, scale, wCSS, hCSS, this.wrapX, this.freePan, this.tileSize, this.mapSize, this.maxZoom, this._maxBoundsPx, this._maxBoundsViscosity, false);
      this.center.lng = clamped.x * s0;
      this.center.lat = clamped.y * s0;
    } else {
      // No bounds: allow free panning
      this.center.lng = lng;
      this.center.lat = lat;
    }
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
    sourceMinZoom?: number;
    sourceMaxZoom?: number;
    mapSize?: { width: number; height: number };
    wrapX?: boolean;
    clearCache?: boolean;
  }) {
    if (typeof opts.url === 'string') this.tileUrl = opts.url;
    if (Number.isFinite(opts.tileSize as number)) this.tileSize = opts.tileSize as number;
    if (Number.isFinite(opts.sourceMaxZoom as number)) this._sourceMaxZoom = (opts.sourceMaxZoom as number) | 0;
    if (opts.mapSize) this.mapSize = { width: Math.max(1, opts.mapSize.width), height: Math.max(1, opts.mapSize.height) };
    if (typeof opts.wrapX === 'boolean') this.wrapX = opts.wrapX;
    // reflect to view state (min/max zoom remain view constraints, not source constraints)
    this._state.wrapX = this.wrapX;
    if (opts.clearCache) {
      // clear GPU textures and cache
      this._tileCache.clear();
      this._pendingKeys.clear();
      this._tiles.clear();
      // also invalidate the screen cache to avoid ghosting from prior source
      try { this._screenCache?.clear?.(); } catch {}
    }
    this._needsRender = true;
  }
  // Marker icons API (simple, high-performance batch per type)
  async setIconDefs(defs: Record<string, IconDefInput>) {
    await this._icons.loadIcons(defs);
    // Icon atlases changed; invalidate screen cache to avoid ghosting
    try { this._screenCache?.clear?.(); } catch {}
    this._needsRender = true;
  }
  setMarkers(markers: MarkerInput[]) {
    this._icons.setMarkers(markers as any);
    // Marker set changed; invalidate screen cache so removed markers don't linger
    try { this._screenCache?.clear?.(); } catch {}
    this._needsRender = true;
  }
  public setUpscaleFilter(mode: 'auto' | 'linear' | 'bicubic') {
    const next = (mode === 'linear' || mode === 'bicubic') ? mode : 'auto';
    if (next !== this._upscaleFilter) {
      this._upscaleFilter = next;
      try { this._screenCache?.clear?.(); } catch {}
      this._needsRender = true;
    }
  }
  setEaseOptions(_opts: EaseOptions) {
    this._zoomCtrl.setOptions({ easeBaseMs: _opts.easeBaseMs, easePerUnitMs: _opts.easePerUnitMs });
    if (typeof _opts.easePinch === 'boolean') {
      /* reserved for future pinch easing */
    }
  }
  public setRasterOpacity(opacity: number) {
    const v = Math.max(0, Math.min(1, opacity));
    if (v !== this._rasterOpacity) {
      this._rasterOpacity = v;
      this._needsRender = true;
    }
  }
  // recenter helper removed from public surface; use setCenter/setView via facade
  destroy() {
    if (this._raf != null) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    this._input?.dispose();
    this._input = null;
    try {
      (this as any)._renderer?.dispose?.();
    } catch {}
    try {
      (this as any)._tiles?.clear?.();
    } catch {}
    try {
      (this as any)._gfx?.dispose?.();
    } catch {}
    this._clearCache();
    const gl = this.gl;
    this._screenCache?.dispose();
    if (this._quad) {
      try {
        gl.deleteBuffer(this._quad);
      } catch {}
      this._quad = null;
    }
    if (this._prog) {
      try {
        gl.deleteProgram(this._prog);
      } catch {}
      this._prog = null;
    }
    try { (this as any)._icons = null; } catch {}
    try {
      this.canvas.remove();
    } catch {}
    if (this.gridCanvas) {
      try {
        this.gridCanvas.remove();
      } catch {}
      this.gridCanvas = null;
      this._gridCtx = null;
    }
  }

  // Public controls
  private _initCanvas() {
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      display: 'block',
      position: 'absolute',
      left: '0',
      top: '0',
      right: '0',
      bottom: '0',
      zIndex: '0',
    } as CSSStyleDeclaration);
    this.container.appendChild(canvas);
    this.canvas = canvas;
  }
  private _initGridCanvas() {
    const c = document.createElement('canvas');
    this.gridCanvas = c;
    c.style.display = 'block';
    c.style.position = 'absolute';
    c.style.left = '0';
    c.style.top = '0';
    c.style.right = '0';
    c.style.bottom = '0';
    c.style.zIndex = '5';
    (c.style as any).pointerEvents = 'none';
    this.container.appendChild(c);
    this._gridCtx = c.getContext('2d');
    c.style.display = this.showGrid ? 'block' : 'none';
  }
  public setGridVisible(visible: boolean) {
    this.showGrid = !!visible;
    if (this.gridCanvas) {
      this.gridCanvas.style.display = this.showGrid ? 'block' : 'none';
      if (!this.showGrid)
        this._gridCtx?.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
    }
    this._needsRender = true;
  }
  private _clearCache() {
    // Delete GPU textures in tile cache and reset queues
    this._tileCache.clear();
    this._wantedKeys.clear();
    this._pinnedKeys.clear();
    this._pendingKeys.clear();
    this._tiles.clear();
    this._inflightLoads = 0;
  }
  // Public cache clear for API facades
  public clearCache() { this._clearCache(); this._needsRender = true; }
  public setWheelSpeed(speed: number) {
    if (Number.isFinite(speed)) {
      this.wheelSpeed = Math.max(0.01, Math.min(2, speed));
      const t = Math.max(0, Math.min(1, this.wheelSpeed / 2));
      // Map speed to immediate step size; velocity gain removed in DI path
      this.wheelImmediate = 0.05 + t * (1.75 - 0.05);
    }
    // Keep ctrl-step in sync if desired
    const t2 = Math.max(0, Math.min(1, (this.wheelSpeedCtrl || 0.4) / 2));
    this.wheelImmediateCtrl = 0.1 + t2 * (1.9 - 0.1);
  }
  public setWheelCtrlSpeed(speed: number) {
    if (Number.isFinite(speed)) {
      this.wheelSpeedCtrl = Math.max(0.01, Math.min(2, speed));
      const t2 = Math.max(0, Math.min(1, (this.wheelSpeedCtrl || 0.4) / 2));
      this.wheelImmediateCtrl = 0.1 + t2 * (1.9 - 0.1);
    }
  }
  public setAnchorMode(mode: 'pointer' | 'center') {
    this.anchorMode = mode;
  }

  // Inertia options (Leaflet-like) setters
  public setInertiaOptions(opts: { inertia?: boolean; inertiaDeceleration?: number; inertiaMaxSpeed?: number; easeLinearity?: number }) {
    if (typeof opts.inertia === 'boolean') this.inertia = opts.inertia;
    if (Number.isFinite(opts.inertiaDeceleration as number)) {
      // clamp to sensible range (px/s^2)
      const v = Math.max(100, Math.min(20000, opts.inertiaDeceleration as number));
      this.inertiaDeceleration = v;
    }
    if (Number.isFinite(opts.inertiaMaxSpeed as number)) {
      const v = Math.max(10, Math.min(1e6, opts.inertiaMaxSpeed as number));
      this.inertiaMaxSpeed = v;
    }
    if (Number.isFinite(opts.easeLinearity as number)) {
      const v = Math.max(0.01, Math.min(1.0, opts.easeLinearity as number));
      this.easeLinearity = v;
    }
  }

  // Zoom-out center bias: when zooming out, bias the center toward previous visual center
  // v is approximately per-unit-zoom bias (0..1), internally clamped and capped.
  public setZoomOutCenterBias(v: number | boolean) {
    if (typeof v === 'boolean') {
      this.outCenterBias = v ? 0.15 : 0.0;
      return;
    }
    if (Number.isFinite(v)) this.outCenterBias = Math.max(0, Math.min(1, v as number));
  }

  private _initPrograms() {
    // Delegate to Graphics to set up programs and buffers
    this._gfx.initPrograms();
  }
  resize() {
    const dpr = Math.max(1, Math.min((window as any).devicePixelRatio || 1, 3));
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
        this.gridCanvas.width = w;
        this.gridCanvas.height = h;
        this._needsRender = true;
      }
    }
  }
  // Toggle screen-space cache
  public setScreenCacheEnabled(enabled: boolean) {
    this.useScreenCache = !!enabled;
    this._needsRender = true;
  }
  // Runtime tunables
  public setFpsCap(fps: number) {
    const v = Math.max(15, Math.min(240, (fps as any) | 0));
    if (v !== this._targetFps) { this._targetFps = v; this._needsRender = true; }
  }
  public setFreePan(on: boolean) {
    const v = !!on;
    if (v !== this.freePan) { this.freePan = v; this._needsRender = true; }
  }
  public setWrapX(on: boolean) {
    const v = !!on;
    if (v !== this.wrapX) { this.wrapX = v; this._state.wrapX = v; this._needsRender = true; }
  }
  // Loader/cache options
  public setLoaderOptions(opts: { maxTiles?: number; maxInflightLoads?: number; interactionIdleMs?: number }) {
    if (Number.isFinite(opts.maxTiles as number) && (opts.maxTiles as number) !== this._maxTiles) {
      this._maxTiles = Math.max(0, (opts.maxTiles as number) | 0);
      // Recreate cache to apply new capacity
      try { this._tileCache.clear(); } catch {}
      this._tileCache = new TileCache(this.gl, this._maxTiles);
    }
    if (Number.isFinite(opts.maxInflightLoads as number)) this._maxInflightLoads = Math.max(0, (opts.maxInflightLoads as number) | 0);
    if (Number.isFinite(opts.interactionIdleMs as number)) this.interactionIdleMs = Math.max(0, (opts.interactionIdleMs as number) | 0);
    this._needsRender = true;
  }
  public setPrefetchOptions(opts: { enabled?: boolean; baselineLevel?: number }) {
    if (typeof opts.enabled === 'boolean') this.prefetchEnabled = opts.enabled;
    // baselineLevel no longer used
  }
  public setMaxBoundsPx(bounds: { minX: number; minY: number; maxX: number; maxY: number } | null) {
    this._maxBoundsPx = bounds ? { ...bounds } : null;
    this._needsRender = true;
  }
  public setMaxBoundsViscosity(v: number) {
    this._maxBoundsViscosity = Math.max(0, Math.min(1, v));
    this._needsRender = true;
  }
  private _initEvents() {
    this._inputDeps = {
      getContainer: () => this.container,
      getCanvas: () => this.canvas,
      getMaxZoom: () => this.maxZoom,
      getImageMaxZoom: () => (this._sourceMaxZoom || this.maxZoom) as number,
      getView: () => this._view(),
      getTileSize: () => this.tileSize,
      setCenter: (lng: number, lat: number) => this.setCenter(lng, lat),
      setZoom: (z: number) => this.setZoom(z),
      clampCenterWorld: (cw, zInt, scale, w, h, viscous?: boolean) =>
        clampCenterWorldCore(cw, zInt, scale, w, h, this.wrapX, this.freePan, this.tileSize, this.mapSize, this.maxZoom, this._maxBoundsPx, this._maxBoundsViscosity, !!viscous),
      updatePointerAbs: (x: number | null, y: number | null) => {
        if (Number.isFinite(x as number) && Number.isFinite(y as number)) this.pointerAbs = { x: x as number, y: y as number };
        else this.pointerAbs = null;
      },
      emit: (name: string, payload: any) => this._events.emit(name, payload),
      setLastInteractAt: (t: number) => {
        this._lastInteractAt = t;
      },
      getAnchorMode: () => this.anchorMode,
      getWheelStep: (ctrl: boolean) =>
        ctrl ? this.wheelImmediateCtrl || this.wheelImmediate || 0.16 : this.wheelImmediate || 0.16,
      startEase: (dz, px, py, anchor) => this._zoomCtrl.startEase(dz, px, py, anchor),
      cancelZoomAnim: () => {
        this._zoomCtrl.cancel();
      },
      applyAnchoredZoom: (targetZoom, px, py, anchor) =>
        this._zoomCtrl.applyAnchoredZoom(targetZoom, px, py, anchor),
      getInertia: () => this.inertia,
      getInertiaDecel: () => this.inertiaDeceleration,
      getInertiaMaxSpeed: () => this.inertiaMaxSpeed,
      getEaseLinearity: () => this.easeLinearity,
      startPanBy: (dxPx: number, dyPx: number, durSec: number, _ease?: number) => this._startPanBy(dxPx, dyPx, durSec),
      cancelPanAnim: () => { this._panAnim = null; },
    };
    this._input = new InputController(this._inputDeps);
    this._input.attach();
  }
  // wheel normalization handled in input/handlers internally
  private _tick(now: number, allowRender: boolean) {
    this._frame++;
    if (this._lastTS == null) this._lastTS = now;
    this._dt = (now - this._lastTS) / 1000;
    this._lastTS = now;
    const animating = this._zoomCtrl.isAnimating() || !!this._panAnim;
    if (!this._needsRender && !animating) return;
    if (!allowRender) {
      try { this._zoomCtrl.step(); } catch {}
      try { this.zoomVelocityTick(); } catch {}
      try { this.panVelocityTick(); } catch {}
      this._needsRender = true;
      return;
    }
    this._render();
    if (!this._zoomCtrl.isAnimating() && !this._panAnim) this._needsRender = false;
  }
  private _render() {
    this._renderer.render();
    // Emit a frame event for HUD/diagnostics
    try {
      const t = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      (this as any)._events?.emit?.('frame', { now: t });
    } catch {}
    if (this.showGrid) {
      const rect = this.container.getBoundingClientRect();
      const baseZ = Math.floor(this.zoom);
      const scale = Math.pow(2, this.zoom - baseZ);
      const widthCSS = rect.width;
      const heightCSS = rect.height;
      const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
      const s = Math.pow(2, imageMaxZ - baseZ);
      const centerWorld = { x: this.center.lng / s, y: this.center.lat / s };
      let tlWorld = {
        x: centerWorld.x - widthCSS / (2 * scale),
        y: centerWorld.y - heightCSS / (2 * scale),
      };
      // Snap to device pixel grid to reduce shimmer during pan
      const snap = (v: number) => Math.round(v * scale * this._dpr) / (scale * this._dpr);
      tlWorld = { x: snap(tlWorld.x), y: snap(tlWorld.y) };
      this._drawGrid(
        this._gridCtx,
        this.gridCanvas,
        baseZ,
        scale,
        widthCSS,
        heightCSS,
        tlWorld,
        this._dpr,
        (this._sourceMaxZoom || this.maxZoom) as number,
        this.tileSize,
      );
    }
  }

  // Prefetch a 1-tile border beyond current viewport at the given level
  // grid drawing via render/grid.drawGrid

  // (moved to the main definition above)
  // public setGridVisible removed (duplicate)

  private _enqueueTile(z: number, x: number, y: number, priority = 1) {
    this._tiles.enqueue(z, x, y, priority);
  }

  private _tileUrl(z: number, x: number, y: number) {
    if (!this.tileUrl) return '' as any;
    return this.tileUrl
      .replace('{z}', String(z))
      .replace('{x}', String(x))
      .replace('{y}', String(y));
  }

  // wrapX and eviction helpers now provided by tiles/source and TileCache

  // Zoom actions handled by ZoomController

  // Finite-world center anchoring hysteresis
  private _viewportCoverageRatio(zInt: number, scale: number, widthCSS: number, heightCSS: number) {
    const s = Math.pow(2, this.maxZoom - zInt);
    const levelW = this.mapSize.width / s;
    const levelH = this.mapSize.height / s;
    const halfW = widthCSS / (2 * scale);
    const halfH = heightCSS / (2 * scale);
    const covX = halfW / (levelW / 2);
    const covY = halfH / (levelH / 2);
    return Math.max(covX, covY);
  }
  private _shouldAnchorCenterForZoom(targetZoom: number) {
    if (this.wrapX) return false;
    const rect = this.container.getBoundingClientRect();
    const widthCSS = rect.width;
    const heightCSS = rect.height;
    const zClamped = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));
    const zInt2 = Math.floor(zClamped);
    const s2 = Math.pow(2, zClamped - zInt2);
    const ratio = this._viewportCoverageRatio(zInt2, s2, widthCSS, heightCSS);
    const enter = 0.995;
    const exit = 0.9;
    const now =
      typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    if (this._stickyCenterAnchor) {
      if (this._stickyAnchorUntil && now < this._stickyAnchorUntil) return true;
      if (ratio <= exit) this._stickyCenterAnchor = false;
    } else {
      if (ratio >= enter) {
        this._stickyCenterAnchor = true;
        this._stickyAnchorUntil = now + 300;
      }
    }
    return this._stickyCenterAnchor;
  }

  // (TEMP helper removed after Render DI completion)

  // Bounds clamping similar to JS version

  // image tile loading handled by TileLoader

  public panVelocityTick() {
    if (!this._panAnim) return;
    const a = this._panAnim;
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const t = Math.min(1, (now - a.start) / (a.dur * 1000));
    const p = 1 - Math.pow(1 - t, 3); // easeOutCubic
    const zInt = Math.floor(this.zoom);
    const scale = Math.pow(2, this.zoom - zInt);
    const rect = this.container.getBoundingClientRect();
    const widthCSS = rect.width; const heightCSS = rect.height;
    const from = a.from;
    const target = { x: from.x + a.offsetWorld.x * p, y: from.y + a.offsetWorld.y * p };
    let newCenter = clampCenterWorldCore(target, zInt, scale, widthCSS, heightCSS, this.wrapX, this.freePan, this.tileSize, this.mapSize, this.maxZoom, this._maxBoundsPx, this._maxBoundsViscosity, false);
    const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
    const s0 = Math.pow(2, imageMaxZ - zInt);
    const nx = newCenter.x * s0;
    const ny = newCenter.y * s0;
    this.center = { lng: nx, lat: ny };
    this._state.center = this.center;
    this._needsRender = true;
    if (t >= 1) { this._panAnim = null; this._events.emit('moveend', { view: this._view() }); }
  }

  private _startPanBy(dxPx: number, dyPx: number, durSec: number) {
    const zInt = Math.floor(this.zoom);
    const scale = Math.pow(2, this.zoom - zInt);
    const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
    const s = Math.pow(2, imageMaxZ - zInt);
    const cw = { x: this.center.lng / s, y: this.center.lat / s };
    // Use the same screen->world sign convention as during drag updates
    const offsetWorld = { x: dxPx / scale, y: dyPx / scale };
    this._panAnim = { start: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(), dur: Math.max(0.05, durSec), from: cw, offsetWorld };
    this._needsRender = true;
  }

  // Suspend/resume this map instance and optionally release the WebGL context.
  public setActive(active: boolean, opts?: { releaseGL?: boolean }) {
    if (active === this._active && !(active && this._glReleased)) return;
    if (!active) {
      this._active = false;
      try { this._frameLoop?.stop?.(); } catch {}
      if (this._raf != null) { try { cancelAnimationFrame(this._raf); } catch {} this._raf = null; }
      try { this._input?.dispose(); } catch {}
      if (opts?.releaseGL && this.gl) {
        try {
          this._screenCache?.dispose(); this._screenCache = null;
          this._tileCache?.clear();
          const ext = (this.gl as any).getExtension?.('WEBGL_lose_context');
          ext?.loseContext?.();
          this._glReleased = true;
        } catch {}
      }
      return;
    }
    // Resume
    if (this._glReleased) {
      try { const ext = (this.gl as any)?.getExtension?.('WEBGL_lose_context'); ext?.restoreContext?.(); } catch {}
      try { this._gfx.init(); } catch {}
      try { this._initPrograms(); } catch {}
      try {
        this._screenCache = new ScreenCache(this.gl, (this._screenTexFormat ?? this.gl.RGBA) as any);
        this._tileCache = new TileCache(this.gl, this._maxTiles);
      } catch {}
      this._glReleased = false;
    }
    try { this._input?.attach?.(); } catch {}
    this._active = true;
    this._needsRender = true;
    try { this._tiles.process(); } catch {}
    try { this._frameLoop?.start?.(); } catch {}
  }

  private static _chooseGridSpacing(scale: number, tileSize: number): number {
    const base = tileSize;
    const candidates = [
      base / 16,
      base / 8,
      base / 4,
      base / 2,
      base,
      base * 2,
      base * 4,
      base * 8,
      base * 16,
      base * 32,
      base * 64,
    ];
    const targetPx = 100;
    let best = candidates[0];
    let bestErr = Infinity;
    for (const w of candidates) {
      const css = w * scale;
      const err = Math.abs(css - targetPx);
      if (err < bestErr) {
        bestErr = err;
        best = w;
      }
    }
    return Math.max(1, Math.round(best));
  }
  private _drawGrid(
    ctx: CanvasRenderingContext2D | null,
    canvas: HTMLCanvasElement | null,
    zInt: number,
    scale: number,
    widthCSS: number,
    heightCSS: number,
    tlWorld: { x: number; y: number },
    dpr: number,
    maxZoom: number,
    tileSize: number,
  ): void {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, (canvas as any).width, (canvas as any).height);
    ctx.save();
    ctx.scale(dpr || 1, dpr || 1);
    const spacingWorld = GTMap._chooseGridSpacing(scale, tileSize);
    const base = tileSize;
    const zAbs = Math.floor(maxZoom);
    const factorAbs = Math.pow(2, zAbs - zInt);
    ctx.font =
      '11px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    let startWX = Math.floor(tlWorld.x / spacingWorld) * spacingWorld;
    for (
      let wx = startWX;
      (wx - tlWorld.x) * scale <= widthCSS + spacingWorld * scale;
      wx += spacingWorld
    ) {
      const xCSS = (wx - tlWorld.x) * scale;
      const isMajor = Math.round(wx) % base === 0;
      ctx.beginPath();
      ctx.strokeStyle = isMajor ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.2)';
      ctx.lineWidth = isMajor ? 1.0 : 0.6;
      ctx.moveTo(Math.round(xCSS) + 0.5, 0);
      ctx.lineTo(Math.round(xCSS) + 0.5, heightCSS);
      ctx.stroke();
      if (isMajor) {
        const xAbs = Math.round(wx * factorAbs);
        const label = `x ${xAbs}`;
        const tx = Math.round(xCSS) + 2;
        const ty = 2;
        const m = ctx.measureText(label);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(tx - 2, ty - 1, (m as any).width + 4, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(label, tx, ty);
      }
    }
    let startWY = Math.floor(tlWorld.y / spacingWorld) * spacingWorld;
    for (
      let wy = startWY;
      (wy - tlWorld.y) * scale <= heightCSS + spacingWorld * scale;
      wy += spacingWorld
    ) {
      const yCSS = (wy - tlWorld.y) * scale;
      const isMajor = Math.round(wy) % base === 0;
      ctx.beginPath();
      ctx.strokeStyle = isMajor ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.2)';
      ctx.lineWidth = isMajor ? 1.0 : 0.6;
      ctx.moveTo(0, Math.round(yCSS) + 0.5);
      ctx.lineTo(widthCSS, Math.round(yCSS) + 0.5);
      ctx.stroke();
      if (isMajor) {
        const yAbs = Math.round(wy * factorAbs);
        const label = `y ${yAbs}`;
        const tx = 2;
        const ty = Math.round(yCSS) + 2;
        const m = ctx.measureText(label);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(tx - 2, ty - 1, (m as any).width + 4, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(label, tx, ty);
      }
    }
    ctx.restore();
  }

  public prefetchNeighbors(
    z: number,
    tl: { x: number; y: number },
    scale: number,
    w: number,
    h: number,
  ) {
    if (!this.prefetchEnabled) return;
    const zClamped = Math.min(z, this._sourceMaxZoom || z);
    const TS = this.tileSize;
    const startX = Math.floor(tl.x / TS) - 1;
    const startY = Math.floor(tl.y / TS) - 1;
    const endX = Math.floor((tl.x + w / scale) / TS) + 1;
    const endY = Math.floor((tl.y + h / scale) / TS) + 1;
    for (let ty = startY; ty <= endY; ty++) {
      if (ty < 0 || ty >= 1 << zClamped) continue;
      for (let tx = startX; tx <= endX; tx++) {
        let tileX = tx;
        if (this.wrapX) {
          const n = 1 << zClamped;
          tileX = ((tx % n) + n) % n;
        } else if (tx < 0 || tx >= 1 << zClamped) continue;
        const key = `${zClamped}/${tileX}/${ty}`;
        if (!this._tileCache.has(key)) this._enqueueTile(zClamped, tileX, ty, 1);
      }
    }
  }
  private _cancelUnwantedLoads() {
    // Only prune queued tasks that are no longer wanted; keep inflight loads to avoid churn
    this._tiles.cancelUnwanted(this._wantedKeys);
    this._wantedKeys.clear();
    this._tiles.process();
  }
}
