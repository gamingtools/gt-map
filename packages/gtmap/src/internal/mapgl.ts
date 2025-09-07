// Pixel-CRS: treat lng=x, lat=y in image pixel coordinates at native resolution
// programs are initialized via Graphics
import type { EventMap, ViewState as PublicViewState, ShaderLocations, WebGLLoseContext } from '../api/types';
import { DEBUG } from '../debug';

import Graphics, { type GraphicsHost } from './gl/Graphics';
import { ScreenCache } from './render/screenCache';
import { TileCache } from './tiles/cache';
// import { TileQueue } from './tiles/queue';
import TilePipeline from './tiles/TilePipeline';
import { TileLoader, type TileLoaderDeps } from './tiles/loader';
import type { TileDeps, RenderCtx, MapImpl } from './types';
import * as Coords from './coords';
// url templating moved inline
import { RasterRenderer } from './layers/raster';
import { IconRenderer } from './layers/icons';
import { TypedEventBus } from './events/typed-stream';
// grid and wheel helpers are used via delegated modules
// zoom core used via ZoomController
import ZoomController from './core/ZoomController';
import InputController from './input/InputController';
import type { InputDeps } from './types';
import MapRenderer from './render/MapRenderer';
import { drawGrid } from './render/grid';
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
	// Auto-resize when container or window DPR changes
	autoResize?: boolean;
    // Viewport background: either 'transparent' (default when omitted) or a solid color.
    // Alpha on provided colors is ignored; use hex like '#0a0a0a' or RGB components.
    backgroundColor?: string | { r: number; g: number; b: number; a?: number };
	// Render pacing
	fpsCap?: number; // cap rendering to this FPS (default 60)
	// Recommended tunables
	maxTiles?: number;
	maxInflightLoads?: number;
	interactionIdleMs?: number;
	prefetch?: { enabled?: boolean; baselineLevel?: number; ring?: number };
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
export type MarkerInput = { id?: string; lng: number; lat: number; type: string; size?: number; rotation?: number };

export default class GTMap implements MapImpl, GraphicsHost {
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
	public _prog: WebGLProgram | null = null;
	public _quad: WebGLBuffer | null = null;
	public _loc: ShaderLocations | null = null;
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
	public _screenTexFormat: number = 0;
	private _screenCache: ScreenCache | null = null;
	private _raster!: RasterRenderer;
    private _icons: IconRenderer | null = null;
	private _renderer!: MapRenderer;
	private _rasterOpacity = 1.0;
	private _upscaleFilter: 'auto' | 'linear' | 'bicubic' = 'auto';
	private _iconScaleFunction: ((zoom: number, minZoom: number, maxZoom: number) => number) | null = null;
	private _zoomCtrl!: ZoomController;
	private _gfx!: Graphics;
	private _state!: ViewState;
	private _showMarkerHitboxes = false;
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
    private _panAnim: null | {
        start: number;
        dur: number;
        from: { x: number; y: number };
        offsetWorld: { x: number; y: number };
        velocity?: { x: number; y: number };
        lastTime?: number;
        easing?: (t: number) => number;
    } = null;
    // Track last mouse enrich time to throttle hover enrichment
    private _lastMouseEnrichAt: number = 0;
    // RequestIdleCallback gating for mask build
    private _maskBuildRequested = false;

	// Background color (normalized 0..1). Default: fully transparent.
	private _bg = { r: 0, g: 0, b: 0, a: 0 };

	private _parseBackground(input?: string | { r: number; g: number; b: number; a?: number }) {
		// Policy: if omitted or 'transparent' => fully transparent; otherwise use solid color (alpha forced to 1)
		const transparent = { r: 0, g: 0, b: 0, a: 0 };
		const toSolid = (str: string) => {
			const s = str.trim().toLowerCase();
			if (s === 'transparent') return transparent;
			const m = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
			if (m) {
				const hex = m[1];
				const rr = parseInt(hex.slice(0, 2), 16) / 255;
				const gg = parseInt(hex.slice(2, 4), 16) / 255;
				const bb = parseInt(hex.slice(4, 6), 16) / 255;
				return { r: rr, g: gg, b: bb, a: 1 };
			}
			return transparent;
		};
		let bg = transparent;
		if (typeof input === 'string') bg = toSolid(input);
		else if (input && typeof input.r === 'number' && typeof input.g === 'number' && typeof input.b === 'number') {
			bg = {
				r: Math.max(0, Math.min(1, input.r / (input.r > 1 ? 255 : 1))),
				g: Math.max(0, Math.min(1, input.g / (input.g > 1 ? 255 : 1))),
				b: Math.max(0, Math.min(1, input.b / (input.b > 1 ? 255 : 1))),
				a: 1,
			};
		}
		this._bg = bg;
		try {
			// For alpha < 1 (only 'transparent' case), keep the element background transparent so the page can show through
			// and let the WebGL clear color's alpha drive compositing (alpha will be 0 in that case).
			this.canvas.style.backgroundColor = bg.a < 1
				? 'transparent'
				: `rgb(${Math.round(bg.r * 255)}, ${Math.round(bg.g * 255)}, ${Math.round(bg.b * 255)})`;
		} catch {}
	}

	private _gridPalette() {
		// Choose contrasting grid based on background luminance
		const L = 0.2126 * this._bg.r + 0.7152 * this._bg.g + 0.0722 * this._bg.b;
		const lightBg = L >= 0.5;
		if (lightBg) {
			return { minor: 'rgba(0,0,0,0.2)', major: 'rgba(0,0,0,0.45)', labelBg: 'rgba(0,0,0,0.55)', labelFg: 'rgba(255,255,255,0.9)' };
		}
		return { minor: 'rgba(255,255,255,0.25)', major: 'rgba(255,255,255,0.55)', labelBg: 'rgba(255,255,255,0.75)', labelFg: 'rgba(0,0,0,0.9)' };
	}

	public setBackgroundColor(color: string | { r: number; g: number; b: number; a?: number }) {
		this._parseBackground(color);
		try {
			this.gl.clearColor(this._bg.r, this._bg.g, this._bg.b, this._bg.a);
		} catch {}
		this._needsRender = true;
	}

	// Auto-resize
	private _autoResize = true;
	private _ro: ResizeObserver | null = null;
	private _resizeTimer: number | null = null;
	private _resizeDebounceMs = 150;
	private _onWindowResize = () => this._scheduleResizeTrailing();

	private _viewPublic(): PublicViewState {
		return {
			center: { x: this.center.lng, y: this.center.lat },
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
			loc: this._loc!,
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
			iconScaleFunction: this._iconScaleFunction,
			icons: this._icons,
			tileCache: this._tileCache,
			tileSize: this.tileSize,
			sourceMaxZoom: this._sourceMaxZoom,
			// Project image pixels at native resolution into level-z pixel coords
			project: (x: number, y: number, z: number) => {
				const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
				return Coords.worldToLevel({ x, y }, imageMaxZ, Math.floor(z));
			},
			enqueueTile: (z: number, x: number, y: number, p = 1) => this._enqueueTile(z, x, y, p),
			wantTileKey: (key: string) => {
				this._wantedKeys.add(key);
			},
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
	private _events: TypedEventBus<EventMap> = new TypedEventBus<EventMap>();
	public readonly events = this._events; // experimental chainable events API
	// Grid overlay
	private showGrid = true;
	private gridCanvas: HTMLCanvasElement | null = null;
	private _gridCtx: CanvasRenderingContext2D | null = null;
	// Vector overlay (initially 2D canvas; upgradeable to WebGL later)
	private vectorCanvas: HTMLCanvasElement | null = null;
	private _vectorCtx: CanvasRenderingContext2D | null = null;
	private _vectors: Array<{ type: string; [k: string]: any }> = [];
	public pointerAbs: { x: number; y: number } | null = null;
	// Loading pacing/cancel
	private interactionIdleMs = 160;
	private _lastInteractAt = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
	private _maxInflightLoads = 20; // Increased for HTTP/2-3 on Cloudflare
	private _inflightLoads = 0;
	private _pendingKeys = new Set<string>();
	private _tiles!: TilePipeline;
	private _tileDeps!: TileDeps;
	private _loader!: TileLoader;
	private _loaderDeps!: TileLoaderDeps;
	private _wantedKeys = new Set<string>();
	private _pinnedKeys = new Set<string>();
	private prefetchEnabled = false;
	private prefetchBaselineLevel: number | null = null;
	private prefetchRing: number = 2;
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
	// Hover hit-testing debounce to avoid churn during interactions
	private _hitTestDebounceMs = 75;

	constructor(container: HTMLDivElement, options: MapOptions = {}) {
		this.container = container;
		this.tileUrl = options.tileUrl ?? '';
		this.tileSize = Number.isFinite(options.tileSize as number) ? (options.tileSize as number) : 256;
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
		this.center = { lng: options.center?.lng ?? this.mapSize.width / 2, lat: options.center?.lat ?? this.mapSize.height / 2 };
		// Initial center captured by the app as needed
		this.zoom = options.zoom ?? 2;
		if (typeof options.zoomOutCenterBias === 'boolean') {
			this.outCenterBias = options.zoomOutCenterBias ? 0.15 : 0.0;
		} else if (Number.isFinite(options.zoomOutCenterBias as number)) {
			const v = Math.max(0, Math.min(1, options.zoomOutCenterBias as number));
			this.outCenterBias = v;
		}
		this._initCanvas();
		this._gfx = new Graphics(this);
		this._parseBackground(options.backgroundColor);
		// Always request an alpha-enabled context so viewport transparency works even if toggled later
		this._gfx.init(true, [this._bg.r, this._bg.g, this._bg.b, this._bg.a]);
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
			if (Number.isFinite(options.prefetch.baselineLevel as number)) this.prefetchBaselineLevel = Math.max(0, (options.prefetch.baselineLevel as number) | 0);
			if (Number.isFinite(options.prefetch.ring as number)) this.prefetchRing = Math.max(0, Math.min(8, (options.prefetch.ring as number) | 0));
		}
		if (typeof options.screenCache === 'boolean') this.useScreenCache = options.screenCache;
		if (Number.isFinite(options.wheelSpeedCtrl as number)) this.wheelSpeedCtrl = Math.max(0.01, Math.min(2, options.wheelSpeedCtrl as number));
		if (options.maxBoundsPx) this._maxBoundsPx = { ...options.maxBoundsPx };
		if (Number.isFinite(options.maxBoundsViscosity as number)) this._maxBoundsViscosity = Math.max(0, Math.min(1, options.maxBoundsViscosity as number));
		if (typeof options.bounceAtZoomLimits === 'boolean') this._bounceAtZoomLimits = options.bounceAtZoomLimits;

		// Auto-resize setup (attach after first frame to avoid startup jitter)
		this._autoResize = options.autoResize !== false;

		// Initialize screen cache module (uses detected format)
		this._screenCache = new ScreenCache(this.gl, (this._screenTexFormat ?? this.gl.RGBA) as 6408 | 6407);
		// Initialize tile cache (LRU)
		this._tileCache = new TileCache(this.gl, this._maxTiles);
		this._tileDeps = {
			hasTile: (key: string) => this._tileCache.has(key),
			isPending: (key: string) => this._pendingKeys.has(key),
			urlFor: (z: number, x: number, y: number) => this._tileUrl(z, x, y),
			hasCapacity: () => this._active && this._inflightLoads < this._maxInflightLoads,
			now: () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()),
			getInteractionIdleMs: () => this.interactionIdleMs,
			getLastInteractAt: () => this._lastInteractAt,
			getZoom: () => this.zoom,
			getMaxZoom: () => this.maxZoom,
			getImageMaxZoom: () => (this._sourceMaxZoom || this.maxZoom) as number,
			getCenter: () => this.center,
			getTileSize: () => this.tileSize,
			getMapSize: () => this.mapSize,
			getWrapX: () => this.wrapX,
			getViewportSizeCSS: () => {
				const r = this.container.getBoundingClientRect();
				return { width: Math.max(1, r.width), height: Math.max(1, r.height) };
			},
			startImageLoad: (task: { key: string; url: string; priority?: number }) => this._loader.start(task),
			addPinned: (key: string) => {
				this._pinnedKeys.add(key);
				try {
					this._tileCache.pin(key);
				} catch {}
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
			setReady: (key: string, tex: WebGLTexture, width: number, height: number, frame: number) => this._tileCache.setReady(key, tex, width, height, frame),
			getGL: () => this.gl,
			getFrame: () => this._frame,
			requestRender: () => {
				this._needsRender = true;
			},
			getUseImageBitmap: () => this.useImageBitmap,
			setUseImageBitmap: (v: boolean) => {
				this.useImageBitmap = v;
			},
			acquireTexture: () => this._tileCache.acquireTexture(),
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
			emit: (name: any, payload: any) => this._events.emit(name, payload),
			requestRender: () => {
				this._needsRender = true;
			},
			now: () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()),
			getPublicView: () => this._viewPublic(),
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
		this._initVectorCanvas();
		this.resize();
		this._initEvents();
		this._frameLoop = new FrameLoop(
			() => this._targetFps,
			(now: number, allowRender: boolean) => this._tick(now, allowRender),
		);
		this._frameLoop.start();
		// Fire load event after first frame has been scheduled
		try {
			const emitLoad = () => {
				const rect2 = this.container.getBoundingClientRect();
				const cssW2 = Math.max(1, Math.round(rect2.width));
				const cssH2 = Math.max(1, Math.round(rect2.height));
				const dpr2 = this._dpr || (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1);
            this._events.emit('load', { view: this._viewPublic(), size: { width: cssW2, height: cssH2, dpr: dpr2 } });
			};
			if (typeof requestAnimationFrame === 'function') requestAnimationFrame(emitLoad);
			else setTimeout(emitLoad, 0);
		} catch {}
		// Attach auto-resize after first stable frame to avoid initial layout interference
		if (this._autoResize) {
			const attach = () => this._attachAutoResize();
			if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(attach));
			else setTimeout(attach, 0);
		}
		// Delay baseline prefetch until a tile source is explicitly set
		// DI in place for input/tiles/render; no need for TS usage hacks
	}

	setCenter(lng: number, lat: number) {
		// If bounds are set, strictly clamp center against bounds (Leaflet-like)
		if (this._maxBoundsPx) {
			const { zInt, scale } = Coords.zParts(this.zoom);
			const rect = this.container.getBoundingClientRect();
			const wCSS = rect.width,
				hCSS = rect.height;
			const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
			const s0 = Coords.sFor(imageMaxZ, zInt);
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
	setTileSource(opts: { url?: string; tileSize?: number; sourceMinZoom?: number; sourceMaxZoom?: number; mapSize?: { width: number; height: number }; wrapX?: boolean; clearCache?: boolean }) {
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
			try {
				this._screenCache?.clear?.();
			} catch {}
		}
		// Optional baseline prefetch
		if (this.prefetchEnabled && Number.isFinite(this.prefetchBaselineLevel as number)) {
			try {
				this._tiles.scheduleBaselinePrefetch(this.prefetchBaselineLevel as number, this.prefetchRing);
			} catch {}
		}
		this._needsRender = true;
	}
	// Marker icons API (simple, high-performance batch per type)
	async setIconDefs(defs: Record<string, IconDefInput>) {
		if (!this._icons) return;
		await this._icons.loadIcons(defs);
		// Icon atlases changed; invalidate screen cache to avoid ghosting
		try {
			this._screenCache?.clear?.();
		} catch {}
		this._needsRender = true;
	}
    setMarkers(markers: MarkerInput[]) {
        if (!this._icons) return;
        // Detect removals vs. previous set to emit a leave for hovered marker when removed
        try {
            const nextIds = new Set<string>((markers.map((m) => m.id).filter((id): id is string => typeof id === 'string')));
            if (this._lastHover && this._lastHover.id && !nextIds.has(this._lastHover.id)) {
                // Hovered marker no longer exists: emit leave and clear
                const prev = this._lastHover;
                const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
                this._emitMarker('leave', {
                    now,
                    view: this._viewPublic(),
                    screen: { x: -1, y: -1 },
                    marker: { id: prev.id || '', index: prev.idx ?? -1, world: { x: 0, y: 0 }, size: { w: 0, h: 0 } },
                    icon: { id: prev.type, iconPath: '', width: 0, height: 0, anchorX: 0, anchorY: 0 },
                });
                this._lastHover = null;
            }
            // no persistent marker id set required here
        } catch {}
        this._icons.setMarkers(markers);
		try {
			if (DEBUG) console.debug('[map.setMarkers]', { count: markers.length });
		} catch {}
		// Marker set changed; invalidate screen cache so removed markers don't linger
		try {
			this._screenCache?.clear?.();
		} catch {}
		this._needsRender = true;
	}
	public setUpscaleFilter(mode: 'auto' | 'linear' | 'bicubic') {
		const next = mode === 'linear' || mode === 'bicubic' ? mode : 'auto';
		if (next !== this._upscaleFilter) {
			this._upscaleFilter = next;
			try {
				this._screenCache?.clear?.();
			} catch {}
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

	// Pan animation to a specific native center (x=lng,y=lat)
    public panTo(lng: number, lat: number, durationMs = 500) {
		const { zInt, scale } = Coords.zParts(this.zoom);
		const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
		const s0 = Coords.sFor(imageMaxZ, zInt);
		const cw = { x: this.center.lng / s0, y: this.center.lat / s0 };
		const target = { x: lng / s0, y: lat / s0 };
		const dxPx = (cw.x - target.x) * scale;
		const dyPx = (cw.y - target.y) * scale;
        this._startPanBy(dxPx, dyPx, Math.max(0.05, durationMs / 1000));
    }

	public flyTo(opts: { lng?: number; lat?: number; zoom?: number; durationMs?: number; easing?: (t: number) => number }) {
        const durMs = Math.max(0, (opts.durationMs ?? 600) | 0);
        if (Number.isFinite(opts.lng as number) && Number.isFinite(opts.lat as number)) this.panTo(opts.lng as number, opts.lat as number, durMs);
        if (Number.isFinite(opts.zoom as number)) {
            const rect = this.container.getBoundingClientRect();
            const dz = (opts.zoom as number) - this.zoom;
            this._zoomCtrl.startEase(dz, rect.width / 2, rect.height / 2, 'center', opts.easing);
        }
    }

	public cancelPanAnim() {
		this._panAnim = null;
	}

	public getMinZoom(): number { return this.minZoom; }
	public getMaxZoom(): number { return this.maxZoom; }
public getImageMaxZoom(): number { return this._sourceMaxZoom || this.maxZoom; }

	public cancelZoomAnim() {
		try {
			this._zoomCtrl.cancel();
		} catch {}
	}
	// recenter helper removed from public surface; use setCenter/setView via facade
	destroy() {
		// Detach observers and listeners first
		try {
			this._detachAutoResize();
		} catch {}
		if (this._frameLoop) {
			try {
				this._frameLoop.stop();
			} catch {}
			this._frameLoop = null;
		}
		if (this._raf != null) {
			cancelAnimationFrame(this._raf);
			this._raf = null;
		}
		this._input?.dispose();
		this._input = null;
            try { this._renderer?.dispose?.(); } catch {}
            try { this._tiles?.clear?.(); } catch {}
            try { this._gfx?.dispose?.(); } catch {}
		this._destroyCache();
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
            try { this._icons = null; } catch {}
		try {
			this.canvas.remove();
		} catch {}
		if (this.gridCanvas) {
			try {
				this.gridCanvas.remove();
			} catch {}
			this.gridCanvas = null;
			this._gridCtx = null;
			if (this.vectorCanvas) {
				try {
					this.vectorCanvas.remove();
				} catch {}
				this.vectorCanvas = null;
				this._vectorCtx = null;
				this._vectors = [];
			}
		}
	}

	// Public controls
	private _initCanvas() {
		const canvas = document.createElement('canvas');
		canvas.classList.add('gtmap-canvas');
		Object.assign(canvas.style, {
			display: 'block',
			position: 'absolute',
			left: '0',
			top: '0',
			right: '0',
			bottom: '0',
			zIndex: '0',
		} as CSSStyleDeclaration);
		// Ensure container behaves as a viewport without scrollbars during resize
		try {
			const cs = this.container.style as CSSStyleDeclaration;
			if (!cs.position) cs.position = 'relative';
			cs.overflow = 'hidden';
		} catch {}
		this.container.appendChild(canvas);
		this.canvas = canvas;
	}
	private _initGridCanvas() {
		const c = document.createElement('canvas');
		c.classList.add('gtmap-grid-canvas');
		this.gridCanvas = c;
		c.style.display = 'block';
		c.style.position = 'absolute';
		c.style.left = '0';
		c.style.top = '0';
		c.style.right = '0';
		c.style.bottom = '0';
		c.style.zIndex = '5';
		c.style.pointerEvents = 'none';
		this.container.appendChild(c);
		this._gridCtx = c.getContext('2d');
		c.style.display = this.showGrid ? 'block' : 'none';
	}
	public setGridVisible(visible: boolean) {
		this.showGrid = !!visible;
		if (this.gridCanvas) {
			this.gridCanvas.style.display = this.showGrid ? 'block' : 'none';
			if (!this.showGrid) this._gridCtx?.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
		}
		this._needsRender = true;
	}
	private _clearCache() {
		// Cancel all pending loads
		this._loader.cancelAll();
		// Delete GPU textures in tile cache and reset queues
		this._tileCache.clear();
		this._wantedKeys.clear();
		this._pinnedKeys.clear();
		this._pendingKeys.clear();
		this._tiles.clear();
		this._inflightLoads = 0;
	}
	// Public cache clear for API facades
	public clearCache() {
		this._clearCache();
		this._needsRender = true;
	}
	private _destroyCache() {
		// Cancel all pending loads
		this._loader.cancelAll();
		// Fully destroy cache including texture pool
		this._tileCache.destroy();
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
		this.wheelImmediateCtrl = 0.1 + t2 * (1.9 - 0.1);
	}
	public setWheelCtrlSpeed(speed: number) {
		if (Number.isFinite(speed)) {
			this.wheelSpeedCtrl = Math.max(0.01, Math.min(2, speed));
			const t2 = Math.max(0, Math.min(1, (this.wheelSpeedCtrl || 0.4) / 2));
			this.wheelImmediateCtrl = 0.1 + t2 * (1.9 - 0.1);
		}
	}
	public setWheelOptions(opts: { base?: number; ctrl?: number }) {
		if (Number.isFinite(opts.base as number)) this.setWheelSpeed(opts.base as number);
		if (Number.isFinite(opts.ctrl as number)) this.setWheelCtrlSpeed(opts.ctrl as number);
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
		const dpr = Math.max(1, Math.min(globalThis.devicePixelRatio || 1, 3));
		const rect = this.container.getBoundingClientRect();
		const cssW = Math.max(1, Math.round(rect.width));
		const cssH = Math.max(1, Math.round(rect.height));
		// Snap CSS size to integer pixels to avoid subpixel jitter
		this.canvas.style.width = cssW + 'px';
		this.canvas.style.height = cssH + 'px';
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
			this.gridCanvas.style.width = cssW + 'px';
			this.gridCanvas.style.height = cssH + 'px';
			if (this.gridCanvas.width !== w || this.gridCanvas.height !== h) {
				this.gridCanvas.width = w;
				this.gridCanvas.height = h;
				this._needsRender = true;
			}
		}
		if (this.vectorCanvas) {
			this.vectorCanvas.style.width = cssW + 'px';
			this.vectorCanvas.style.height = cssH + 'px';
			if (this.vectorCanvas.width !== w || this.vectorCanvas.height !== h) {
				this.vectorCanvas.width = w;
				this.vectorCanvas.height = h;
				this._needsRender = true;
			}
		}
	}

	private _scheduleResizeTrailing() {
		if (this._resizeTimer != null) {
			clearTimeout(this._resizeTimer);
		}
		const fire = () => {
			this._resizeTimer = null;
			const run = () => this.resize();
			if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
			else run();
		};
		this._resizeTimer = window.setTimeout(fire, this._resizeDebounceMs);
	}

	private _attachAutoResize() {
		try {
			if (typeof window !== 'undefined') window.addEventListener('resize', this._onWindowResize);
			if (typeof ResizeObserver !== 'undefined') {
				this._ro = new ResizeObserver(() => this._scheduleResizeTrailing());
				this._ro.observe(this.container);
			}
		} catch {}
	}

	private _detachAutoResize() {
		try {
			if (typeof window !== 'undefined') window.removeEventListener('resize', this._onWindowResize);
			this._ro?.disconnect();
		} catch {}
		this._ro = null;
		if (this._resizeTimer != null) {
			clearTimeout(this._resizeTimer);
			this._resizeTimer = null;
		}
	}

	public setAutoResize(on: boolean) {
		const v = !!on;
		if (v === this._autoResize) return;
		this._autoResize = v;
		if (v) this._attachAutoResize();
		else this._detachAutoResize();
	}
	// Toggle screen-space cache
	public setScreenCacheEnabled(enabled: boolean) {
		this.useScreenCache = !!enabled;
		this._needsRender = true;
	}
	// Runtime tunables
	public setFpsCap(fps: number) {
		const v = Math.max(15, Math.min(240, Math.trunc(fps)));
		if (v !== this._targetFps) {
			this._targetFps = v;
			this._needsRender = true;
		}
	}
	public setFreePan(on: boolean) {
		const v = !!on;
		if (v !== this.freePan) {
			this.freePan = v;
			this._needsRender = true;
		}
	}
	public setWrapX(on: boolean) {
		const v = !!on;
		if (v !== this.wrapX) {
			this.wrapX = v;
			this._state.wrapX = v;
			this._needsRender = true;
		}
	}
	// Loader/cache options
	public setLoaderOptions(opts: { maxTiles?: number; maxInflightLoads?: number; interactionIdleMs?: number }) {
		if (Number.isFinite(opts.maxTiles as number) && (opts.maxTiles as number) !== this._maxTiles) {
			this._maxTiles = Math.max(0, (opts.maxTiles as number) | 0);
			// Recreate cache to apply new capacity
			try {
				this._tileCache.clear();
			} catch {}
			this._tileCache = new TileCache(this.gl, this._maxTiles);
		}
		if (Number.isFinite(opts.maxInflightLoads as number)) this._maxInflightLoads = Math.max(0, (opts.maxInflightLoads as number) | 0);
		if (Number.isFinite(opts.interactionIdleMs as number)) this.interactionIdleMs = Math.max(0, (opts.interactionIdleMs as number) | 0);
		this._needsRender = true;
	}
	public setPrefetchOptions(opts: { enabled?: boolean; baselineLevel?: number; ring?: number }) {
		if (typeof opts.enabled === 'boolean') this.prefetchEnabled = opts.enabled;
		if (Number.isFinite(opts.baselineLevel as number)) this.prefetchBaselineLevel = Math.max(0, (opts.baselineLevel as number) | 0);
		if (Number.isFinite(opts.ring as number)) this.prefetchRing = Math.max(0, Math.min(8, (opts.ring as number) | 0));
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
			getView: () => this._viewPublic(),
			getTileSize: () => this.tileSize,
			setCenter: (lng: number, lat: number) => this.setCenter(lng, lat),
			setZoom: (z: number) => this.setZoom(z),
			clampCenterWorld: (cw, zInt, scale, w, h, viscous?: boolean) =>
				clampCenterWorldCore(cw, zInt, scale, w, h, this.wrapX, this.freePan, this.tileSize, this.mapSize, this.maxZoom, this._maxBoundsPx, this._maxBoundsViscosity, !!viscous),
			updatePointerAbs: (x: number | null, y: number | null) => {
				if (Number.isFinite(x as number) && Number.isFinite(y as number)) this.pointerAbs = { x: x as number, y: y as number };
				else this.pointerAbs = null;
			},
			emit: (name: any, payload: any) => this._events.emit(name, payload),
			setLastInteractAt: (t: number) => {
				this._lastInteractAt = t;
			},
			getAnchorMode: () => this.anchorMode,
			getWheelStep: (ctrl: boolean) => (ctrl ? this.wheelImmediateCtrl || this.wheelImmediate || 0.16 : this.wheelImmediate || 0.16),
			startEase: (dz, px, py, anchor) => this._zoomCtrl.startEase(dz, px, py, anchor),
			cancelZoomAnim: () => {
				this._zoomCtrl.cancel();
			},
			applyAnchoredZoom: (targetZoom, px, py, anchor) => this._zoomCtrl.applyAnchoredZoom(targetZoom, px, py, anchor),
			getInertia: () => this.inertia,
			getInertiaDecel: () => this.inertiaDeceleration,
			getInertiaMaxSpeed: () => this.inertiaMaxSpeed,
			getEaseLinearity: () => this.easeLinearity,
            startPanBy: (dxPx: number, dyPx: number, durSec: number, _ease?: number) => this._startPanBy(dxPx, dyPx, durSec, undefined),
			cancelPanAnim: () => {
				this._panAnim = null;
			},
		};
		this._input = new InputController(this._inputDeps);
		this._input.attach();
		// Wire marker hover/click based on pointer events
		try {
			// State for long-press gesture
			let longPressTimer: number | null = null;
			let longPressed = false;
			let pressTarget: { id: string; idx: number } | null = null;
			// Click intention: record down and detect movement
			this.events.on('pointerdown').each((e: any) => {
				if (!e || e.x == null || e.y == null) return;
				const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
				const ptrType = (e.originalEvent?.pointerType || '').toString();
				const tol = ptrType === 'touch' ? 18 : 8;
				this._downAt = { x: e.x, y: e.y, t: now, tol };
				this._movedSinceDown = false;
				// Emit markerdown if hit
				const hit = this._hitTestMarker(e.x, e.y, false);
				if (hit) {
                this._emitMarker('down', {
                    now,
                    view: this._viewPublic(),
                    screen: { x: e.x, y: e.y },
                    marker: { id: hit.id, index: hit.idx, world: { x: hit.world.x, y: hit.world.y }, size: hit.size, rotation: hit.rotation, data: this._markerData.get(hit.id) },
                    icon: {
							id: hit.type,
							iconPath: hit.icon.iconPath,
							x2IconPath: hit.icon.x2IconPath,
							width: hit.icon.width,
							height: hit.icon.height,
							anchorX: hit.icon.anchorX,
							anchorY: hit.icon.anchorY,
						},
                    originalEvent: e.originalEvent,
                });
					pressTarget = { id: hit.id, idx: hit.idx };
					longPressed = false;
					// Start long-press timer for touch
					if (ptrType === 'touch') {
						if (longPressTimer != null) clearTimeout(longPressTimer);
						longPressTimer = window.setTimeout(() => {
							longPressTimer = null;
							longPressed = true;
							// Emit markerlongpress at current pointer
							const lpHit = this._hitTestMarker(e.x, e.y, false);
							if (lpHit && pressTarget && lpHit.id === pressTarget.id) {
								this._emitMarker('longpress', {
									now: typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
									view: this._viewPublic(),
									screen: { x: e.x, y: e.y },
									marker: {
										id: lpHit.id,
										index: lpHit.idx,
										world: { x: lpHit.world.x, y: lpHit.world.y },
										size: lpHit.size,
										rotation: lpHit.rotation,
										data: this._markerData.get(lpHit.id),
									},
									icon: {
										id: lpHit.type,
										iconPath: lpHit.icon.iconPath,
										x2IconPath: lpHit.icon.x2IconPath,
										width: lpHit.icon.width,
										height: lpHit.icon.height,
										anchorX: lpHit.icon.anchorX,
										anchorY: lpHit.icon.anchorY,
									},
                            originalEvent: e.originalEvent,
								});
							}
						}, 500);
					}
				} else {
					pressTarget = null;
				}
			});
			this.events.on('pointermove').each((e: any) => {
				if (!e || e.x == null || e.y == null) return;
				if (this._downAt) {
					const dx = e.x - this._downAt.x;
					const dy = e.y - this._downAt.y;
					if (Math.hypot(dx, dy) > this._downAt.tol) this._movedSinceDown = true;
					// Cancel long-press if moved too far
					if (this._movedSinceDown && longPressTimer != null) {
						clearTimeout(longPressTimer);
						longPressTimer = null;
					}
				}
				// Disable hover hit-testing during active pan/zoom and for a short debounce after
				const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
				const moving = this._zoomCtrl.isAnimating() || !!this._panAnim;
				const idle = !moving && now - this._lastInteractAt >= this._hitTestDebounceMs;
				if (!idle) {
					if (this._lastHover) {
						const prev = this._lastHover;
						this._emitMarker('leave', {
							now,
							view: this._viewPublic(),
							screen: { x: e.x, y: e.y },
							marker: { id: prev.id || '', index: prev.idx ?? -1, world: { x: 0, y: 0 }, size: { w: 0, h: 0 } },
							icon: { id: prev.type, iconPath: '', width: 0, height: 0, anchorX: 0, anchorY: 0 },
						});
						this._lastHover = null;
					}
					return;
				}
				const hit = this._hitTestMarker(e.x, e.y, false);
				if (hit) {
					// If the top-most hit changed, emit leave for previous then enter for new
					if (!this._lastHover || this._lastHover.id !== hit.id) {
						if (this._lastHover) {
							const prev = this._lastHover;
							this._emitMarker('leave', {
								now,
								view: this._viewPublic(),
								screen: { x: e.x, y: e.y },
								marker: { id: prev.id || '', index: prev.idx ?? -1, world: { x: 0, y: 0 }, size: { w: 0, h: 0 } },
								icon: { id: prev.type, iconPath: '', width: 0, height: 0, anchorX: 0, anchorY: 0 },
                            originalEvent: e.originalEvent,
							});
						}
						this._emitMarker('enter', {
							now,
							view: this._viewPublic(),
							screen: { x: e.x, y: e.y },
							marker: { id: hit.id, index: hit.idx, world: { x: hit.world.x, y: hit.world.y }, size: hit.size, rotation: hit.rotation, data: this._markerData.get(hit.id) },
							icon: {
								id: hit.type,
								iconPath: hit.icon.iconPath,
								x2IconPath: hit.icon.x2IconPath,
								width: hit.icon.width,
								height: hit.icon.height,
								anchorX: hit.icon.anchorX,
								anchorY: hit.icon.anchorY,
							},
                        originalEvent: e.originalEvent,
						});
						this._lastHover = { idx: hit.idx, type: hit.type, id: hit.id };
					}
				} else if (this._lastHover) {
					const prev = this._lastHover;
					this._emitMarker('leave', {
						now,
						view: this._viewPublic(),
						screen: { x: e.x, y: e.y },
						marker: { id: prev.id || '', index: prev.idx ?? -1, world: { x: 0, y: 0 }, size: { w: 0, h: 0 } },
						icon: { id: prev.type, iconPath: '', width: 0, height: 0, anchorX: 0, anchorY: 0 },
                    originalEvent: e.originalEvent,
					});
					this._lastHover = null;
				}
			});
			this.events.on('pointerup').each((e: any) => {
				if (!e || e.x == null || e.y == null) return;
				const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
				const moving = this._zoomCtrl.isAnimating() || !!this._panAnim;
				const isClick = !!this._downAt && !this._movedSinceDown && !moving && now - this._downAt.t < 400;
				this._downAt = null;
				// Emit markerup if hit
				const upHit = this._hitTestMarker(e.x, e.y, true);
				if (upHit) {
					this._emitMarker('up', {
						now,
						view: this._viewPublic(),
						screen: { x: e.x, y: e.y },
						marker: { id: upHit.id, index: upHit.idx, world: { x: upHit.world.x, y: upHit.world.y }, size: upHit.size, rotation: upHit.rotation, data: this._markerData.get(upHit.id) },
						icon: {
							id: upHit.type,
							iconPath: upHit.icon.iconPath,
							x2IconPath: upHit.icon.x2IconPath,
							width: upHit.icon.width,
							height: upHit.icon.height,
							anchorX: upHit.icon.anchorX,
							anchorY: upHit.icon.anchorY,
						},
                    originalEvent: e.originalEvent,
					});
				}
				// Cancel any pending long-press
				if (longPressTimer != null) {
					clearTimeout(longPressTimer);
					longPressTimer = null;
				}
				if (!isClick) return;
				const hit = this._hitTestMarker(e.x, e.y, true);
				if (hit)
					this._emitMarker('click', {
						now,
						view: this._viewPublic(),
						screen: { x: e.x, y: e.y },
						marker: { id: hit.id, index: hit.idx, world: { x: hit.world.x, y: hit.world.y }, size: hit.size, rotation: hit.rotation, data: this._markerData.get(hit.id) },
						icon: {
							id: hit.type,
							iconPath: hit.icon.iconPath,
							x2IconPath: hit.icon.x2IconPath,
							width: hit.icon.width,
							height: hit.icon.height,
							anchorX: hit.icon.anchorX,
							anchorY: hit.icon.anchorY,
						},
						originalEvent: e.originalEvent,
					});
				// Reset press state
				pressTarget = null;
				if (longPressed) {
					// suppress synthetic follow-up behaviors if needed
					longPressed = false;
				}
			});

			// Enrich mouse events with markers when hover is enabled
			const emitMouseOnce = (name: keyof import('../api/types').EventMap, e: any) => {
				if (!e || e.x == null || e.y == null) {
					this._events.emit(name, e);
					return;
				}
				const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
				const moving = this._zoomCtrl.isAnimating() || !!this._panAnim;
				const idle = !moving && now - this._lastInteractAt >= this._hitTestDebounceMs;
				let payload = e;
				if (idle) {
					if (name === 'mousemove') {
                    const last = this._lastMouseEnrichAt || 0;
                    if (now - last >= 16) this._lastMouseEnrichAt = now;
						else idle && (payload = e);
					}
					try {
						const hits = this._computeMarkerHits(e.x, e.y);
						if (hits.length) {
							const mapped = hits.map((h) => ({
								marker: { id: h.id, index: h.idx, world: { x: h.world.x, y: h.world.y }, size: h.size, rotation: h.rotation, data: this._markerData.get(h.id) },
								icon: h.icon,
							}));
                        // Enrich mouse event payload with marker hits; MouseEventData.markers is optional
                        payload = { ...e, markers: mapped };
						}
					} catch {}
				}
				this._events.emit(name, payload);
			};
			// Derive mouse events from pointer events to avoid duplicate emissions
			this.events.on('pointerdown').each((e: any) => {
				if ((e.originalEvent?.pointerType || '') === 'mouse') {
					emitMouseOnce('mousedown', e);
				}
			});
			this.events.on('pointermove').each((e: any) => {
				if ((e.originalEvent?.pointerType || '') === 'mouse') {
					emitMouseOnce('mousemove', e);
				}
			});
			this.events.on('pointerup').each((e: any) => {
				if ((e.originalEvent?.pointerType || '') === 'mouse') {
					emitMouseOnce('mouseup', e);
				}
			});
			// Click and dblclick/contextmenu derived here if needed
			this.events.on('pointerup').each((e: any) => {
				if ((e.originalEvent?.pointerType || '') !== 'mouse') return;
				const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
				const moving = this._zoomCtrl.isAnimating() || !!this._panAnim;
				const isClick = !!this._downAt && !this._movedSinceDown && !moving && now - this._downAt.t < 400;
				if (!isClick) return;
				emitMouseOnce('click', e);
			});
		} catch {}
	}

	public setMarkerData(payloads: Record<string, any | null | undefined>) {
		try {
			for (const k of Object.keys(payloads)) this._markerData.set(k, payloads[k]);
		} catch {}
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
			try {
				this._zoomCtrl.step();
			} catch {}
			try {
				this.zoomVelocityTick();
			} catch {}
			try {
				this.panVelocityTick();
			} catch {}
			this._needsRender = true;
			return;
		}
		this._render();
		if (!this._zoomCtrl.isAnimating() && !this._panAnim) this._needsRender = false;
	}
	private _render() {
		this._renderer.render();
		// Kick off deferred icon mask build after first render
		try {
            // Defer icon mask build until after the first render, using requestIdleCallback when available.
            if (!this._maskBuildRequested) {
                this._maskBuildRequested = true;
                const start = () => { try { this._icons?.startMaskBuild?.(); } catch {} };
                // requestIdleCallback is not in TS lib in all environments; feature-test and bind if present
                const idle: ((cb: () => void) => any) | undefined = typeof (window as unknown as { requestIdleCallback?: (cb: () => void) => any }).requestIdleCallback === 'function'
                    ? (window as unknown as { requestIdleCallback: (cb: () => void) => any }).requestIdleCallback.bind(window)
                    : undefined;
				if (idle) idle(start); else setTimeout(start, 0);
			}
		} catch {}
		// Emit a frame event for HUD/diagnostics
		try {
			const t = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
			const stats = {
				cacheSize: this._tileCache?.size?.() ?? undefined,
				inflight: this._inflightLoads ?? undefined,
				pending: this._pendingKeys?.size ?? undefined,
				frame: this._frame,
			};
			this._events.emit('frame', { now: t, stats });
		} catch {}
		if (this.showGrid) {
			const rect = this.container.getBoundingClientRect();
			const { zInt: baseZ, scale } = Coords.zParts(this.zoom);
			const widthCSS = rect.width;
			const heightCSS = rect.height;
			const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
			const s = Coords.sFor(imageMaxZ, baseZ);
			const centerLevel = { x: this.center.lng / s, y: this.center.lat / s };
			let tlWorld = Coords.tlLevelFor(centerLevel, this.zoom, { x: widthCSS, y: heightCSS });
			// Snap to device pixel grid to reduce shimmer during pan
			const snap = (v: number) => Coords.snapLevelToDevice(v, scale, this._dpr);
			tlWorld = { x: snap(tlWorld.x), y: snap(tlWorld.y) };
			const pal = this._gridPalette();
			drawGrid(this._gridCtx, this.gridCanvas, baseZ, scale, widthCSS, heightCSS, tlWorld, this._dpr, (this._sourceMaxZoom || this.maxZoom) as number, this.tileSize, pal);
		}
		// Draw vector overlay (if any)
		try {
			this._drawVectors();
		} catch {}
	}

	// Prefetch a 1-tile border beyond current viewport at the given level
	// grid drawing via render/grid.drawGrid

	// (moved to the main definition above)
	// public setGridVisible removed (duplicate)

	private _enqueueTile(z: number, x: number, y: number, priority = 1) {
		this._tiles.enqueue(z, x, y, priority);
	}

	private _tileUrl(z: number, x: number, y: number) {
		if (!this.tileUrl) return '';
		return this.tileUrl.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
	}

	// wrapX and eviction helpers now provided by tiles/source and TileCache

	// Zoom actions handled by ZoomController

	// Finite-world center anchoring hysteresis
	private _viewportCoverageRatio(zInt: number, scale: number, widthCSS: number, heightCSS: number) {
		const zImg = (this._sourceMaxZoom || this.maxZoom) as number;
		const s = Coords.sFor(zImg, zInt);
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
		const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
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
        const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
        const t = Math.min(1, (now - a.start) / (a.dur * 1000));
        // Use custom easing if provided, otherwise default easeOutExpo
        let p = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        try { if (typeof a.easing === 'function') p = a.easing(t); } catch {}

		const { zInt, scale } = Coords.zParts(this.zoom);
		const rect = this.container.getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
		const from = a.from;
		const target = { x: from.x + a.offsetWorld.x * p, y: from.y + a.offsetWorld.y * p };
		let newCenter = clampCenterWorldCore(
			target,
			zInt,
			scale,
			widthCSS,
			heightCSS,
			this.wrapX,
			this.freePan,
			this.tileSize,
			this.mapSize,
			this.maxZoom,
			this._maxBoundsPx,
			this._maxBoundsViscosity,
			false,
		);
		const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
		const s0 = Coords.sFor(imageMaxZ, zInt);
		const nx = newCenter.x * s0;
		const ny = newCenter.y * s0;
		this.center = { lng: nx, lat: ny };
		this._state.center = this.center;
		this._needsRender = true;
		if (t >= 1) {
			this._panAnim = null;
			this._events.emit('moveend', { view: this._viewPublic() });
		}
	}

    private _startPanBy(dxPx: number, dyPx: number, durSec: number, easing?: number | ((t: number) => number)) {
        const { zInt, scale } = Coords.zParts(this.zoom);
        const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
        const s = Coords.sFor(imageMaxZ, zInt);
        const cw = { x: this.center.lng / s, y: this.center.lat / s };
        // Use the same screen->world sign convention as during drag updates
        const offsetWorld = { x: dxPx / scale, y: dyPx / scale };
        const efn = typeof easing === 'function' ? easing : undefined;
        this._panAnim = { start: typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(), dur: Math.max(0.05, durSec), from: cw, offsetWorld, easing: efn };
        this._needsRender = true;
    }

	// Suspend/resume this map instance and optionally release the WebGL context.
	public setActive(active: boolean, opts?: { releaseGL?: boolean }) {
		if (active === this._active && !(active && this._glReleased)) return;
		if (!active) {
			this._active = false;
			try {
				this._frameLoop?.stop?.();
			} catch {}
			if (this._raf != null) {
				try {
					cancelAnimationFrame(this._raf);
				} catch {}
				this._raf = null;
			}
			try {
				this._input?.dispose();
			} catch {}
			if (opts?.releaseGL && this.gl) {
				try {
					this._screenCache?.dispose();
					this._screenCache = null;
					this._tileCache?.clear();
					const ext = this.gl.getExtension?.('WEBGL_lose_context') as WebGLLoseContext | null;
					ext?.loseContext();
					this._glReleased = true;
				} catch {}
			}
			return;
		}
		// Resume
		if (this._glReleased) {
			try {
				const ext = this.gl.getExtension?.('WEBGL_lose_context') as WebGLLoseContext | null;
				ext?.restoreContext();
			} catch {}
			try {
				// Reinitialize with alpha enabled so background transparency is supported after resume
				this._gfx.init(true, [this._bg.r, this._bg.g, this._bg.b, this._bg.a]);
			} catch {}
			try {
				this._initPrograms();
			} catch {}
			try {
				this._screenCache = new ScreenCache(this.gl, (this._screenTexFormat ?? this.gl.RGBA) as 6408 | 6407);
				this._tileCache = new TileCache(this.gl, this._maxTiles);
			} catch {}
			this._glReleased = false;
		}
		try {
			this._input?.attach?.();
		} catch {}
		this._active = true;
		this._needsRender = true;
		try {
			this._tiles.process();
		} catch {}
		try {
			this._frameLoop?.start?.();
		} catch {}
	}

	public prefetchNeighbors(z: number, tl: { x: number; y: number }, scale: number, w: number, h: number) {
		if (!this.prefetchEnabled) return;
		const zClamped = Math.min(z, this._sourceMaxZoom || z);
		const zInt = Math.floor(zClamped);
		const TS = this.tileSize;
		const startX = Math.floor(tl.x / TS) - 1;
		const startY = Math.floor(tl.y / TS) - 1;
		const endX = Math.floor((tl.x + w / scale) / TS) + 1;
		const endY = Math.floor((tl.y + h / scale) / TS) + 1;
		const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
		const counts = Coords.tileCounts(this.mapSize.width, this.mapSize.height, TS, imageMaxZ, zInt);
		const NX = counts.NX;
		const NY = counts.NY;
		for (let ty = startY; ty <= endY; ty++) {
			if (ty < 0 || ty >= NY) continue;
			for (let tx = startX; tx <= endX; tx++) {
				let tileX = tx;
				if (this.wrapX) {
					const n = NX;
					tileX = ((tx % n) + n) % n;
				} else if (tx < 0 || tx >= NX) continue;
				const key = `${zInt}/${tileX}/${ty}`;
				// mark prefetch tiles as wanted to prevent pruning
				this._wantedKeys.add(key);
				if (!this._tileCache.has(key)) this._enqueueTile(zInt, tileX, ty, 1);
			}
		}
	}
	private _cancelUnwantedLoads() {
		// For now, only cancel the queue, not inflight requests
		// Include pinned keys so baseline prefetch isn't pruned
		const wanted = new Set<string>(this._wantedKeys);
		for (const key of this._pinnedKeys) wanted.add(key);
		this._tiles.cancelUnwanted(wanted);
		this._wantedKeys.clear();
		this._tiles.process();
	}

	private _initVectorCanvas() {
		const c = document.createElement('canvas');
		c.classList.add('gtmap-vector-canvas');
		this.vectorCanvas = c;
		c.style.display = 'block';
		c.style.position = 'absolute';
		c.style.left = '0';
		c.style.top = '0';
		c.style.right = '0';
		c.style.bottom = '0';
		c.style.zIndex = '6';
		(c.style as CSSStyleDeclaration).pointerEvents = 'none';
		this.container.appendChild(c);
		this._vectorCtx = c.getContext('2d');
	}

	public setVectors(vectors: Array<{ type: string; [k: string]: any }>) {
		this._vectors = vectors.slice();
		this._needsRender = true;
	}

	// Simple hover/click hit testing on markers (AABB, ignores rotation)
	private _lastHover: { type: string; idx: number; id?: string } | null = null;
	private _downAt: { x: number; y: number; t: number; tol: number } | null = null;
	private _movedSinceDown = false;
	private _markerData = new Map<string, any | null | undefined>();
	// Private marker event sinks (not exposed on public bus)
	private _markerSinks: Record<'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', Set<(e: any) => void>> = {
		enter: new Set(),
		leave: new Set(),
		click: new Set(),
		down: new Set(),
		up: new Set(),
		longpress: new Set(),
	};

	public onMarkerEvent(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', handler: (e: any) => void): () => void {
		const set = this._markerSinks[name];
		set.add(handler);
		return () => set.delete(handler);
	}

	private _emitMarker(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', payload: any) {
		const set = this._markerSinks[name];
		if (!set || set.size === 0) return;
		for (const fn of Array.from(set)) {
			try {
				fn(payload);
			} catch {}
		}
	}
	private _hitTestMarker(px: number, py: number, requireAlpha = false) {
		void requireAlpha;
		if (!this._icons) return null;
		const rect = this.container.getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
		const iconScale = this._iconScaleFunction ? this._iconScaleFunction(this.zoom, this.minZoom, this.maxZoom) : 1.0;
		const info = this._icons.getMarkerInfo(iconScale);
		const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
		for (let i = info.length - 1; i >= 0; i--) {
			const it = info[i];
			const css = Coords.worldToCSS({ x: it.lng, y: it.lat }, this.zoom, { x: this.center.lng, y: this.center.lat }, { x: widthCSS, y: heightCSS }, imageMaxZ);
			const left = css.x - it.anchor.ax;
			const top = css.y - it.anchor.ay;
			if (px >= left && px <= left + it.w && py >= top && py <= top + it.h) {
				// Optional alpha-mask sampling for pixel-accurate hits
                const mask = this._icons.getMaskInfo?.(it.type) || null;
				if (mask) {
					// Map pointer to icon local coords (account for rotation around anchor)
					const ax = it.anchor.ax;
					const ay = it.anchor.ay;
					const lx = px - left;
					const ly = py - top;
					const cx = lx - ax;
					const cy = ly - ay;
					const theta = ((it.rotation || 0) * Math.PI) / 180;
					const c = Math.cos(-theta),
						s = Math.sin(-theta);
					const rx = cx * c - cy * s + ax;
					const ry = cx * s + cy * c + ay;
					if (rx < 0 || ry < 0 || rx >= it.w || ry >= it.h) continue;
					const mx = Math.max(0, Math.min(mask.w - 1, Math.floor((rx / it.w) * mask.w)));
					const my = Math.max(0, Math.min(mask.h - 1, Math.floor((ry / it.h) * mask.h)));
					const alpha = mask.data[my * mask.w + mx] | 0;
					const THRESH = 32; // ~12.5%
					if (alpha < THRESH) continue; // treat as transparent: no hit
				}
				return { idx: it.index, id: it.id, type: it.type, world: { x: it.lng, y: it.lat }, screen: { x: css.x, y: css.y }, size: { w: it.w, h: it.h }, rotation: it.rotation, icon: it.icon };
			}
		}
		return null;
	}

	private _computeMarkerHits(
		px: number,
		py: number,
	): Array<{
		id: string;
		idx: number;
		world: { x: number; y: number };
		size: { w: number; h: number };
		rotation?: number;
		icon: { id: string; iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
	}> {
		const out: Array<{
			id: string;
			idx: number;
			world: { x: number; y: number };
			size: { w: number; h: number };
			rotation?: number;
			icon: { id: string; iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
		}> = [];
		if (!this._icons) return out;
		const rect = this.container.getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
		const iconScale = this._iconScaleFunction ? this._iconScaleFunction(this.zoom, this.minZoom, this.maxZoom) : 1.0;
		const info = this._icons.getMarkerInfo(iconScale);
		const imageMaxZ = (this._sourceMaxZoom || this.maxZoom) as number;
		for (let i = info.length - 1; i >= 0; i--) {
			const it = info[i];
			const css = Coords.worldToCSS({ x: it.lng, y: it.lat }, this.zoom, { x: this.center.lng, y: this.center.lat }, { x: widthCSS, y: heightCSS }, imageMaxZ);
			const left = css.x - it.anchor.ax;
			const top = css.y - it.anchor.ay;
			if (px < left || px > left + it.w || py < top || py > top + it.h) continue;
                const mask = this._icons.getMaskInfo?.(it.type) || null;
			if (mask) {
				const ax = it.anchor.ax;
				const ay = it.anchor.ay;
				const lx = px - left;
				const ly = py - top;
				const cx = lx - ax;
				const cy = ly - ay;
				const theta = ((it.rotation || 0) * Math.PI) / 180;
				const c = Math.cos(-theta),
					s = Math.sin(-theta);
				const rx = cx * c - cy * s + ax;
				const ry = cx * s + cy * c + ay;
				if (rx < 0 || ry < 0 || rx >= it.w || ry >= it.h) continue;
				const mx = Math.max(0, Math.min(mask.w - 1, Math.floor((rx / it.w) * mask.w)));
				const my = Math.max(0, Math.min(mask.h - 1, Math.floor((ry / it.h) * mask.h)));
				const alpha = mask.data[my * mask.w + mx] | 0;
				const THRESH = 32;
				if (alpha < THRESH) continue;
			}
			out.push({
				id: it.id,
				idx: it.index,
				world: { x: it.lng, y: it.lat },
				size: { w: it.w, h: it.h },
				rotation: it.rotation,
				icon: { id: it.type, iconPath: it.icon.iconPath, x2IconPath: it.icon.x2IconPath, width: it.icon.width, height: it.icon.height, anchorX: it.icon.anchorX, anchorY: it.icon.anchorY },
			});
		}
		return out;
	}

	public setMarkerHitboxesVisible(on: boolean) {
		this._showMarkerHitboxes = !!on;
		this._needsRender = true;
	}

	public setIconScaleFunction(fn: ((zoom: number, minZoom: number, maxZoom: number) => number) | null) {
		this._iconScaleFunction = fn;
		// Invalidate screen cache since icon sizes will change
		try {
			this._screenCache?.clear?.();
		} catch {}
		this._needsRender = true;
	}

	private _ensureOverlaySizes() {
		const rect = this.container.getBoundingClientRect();
		const wCSS = Math.max(1, rect.width | 0);
		const hCSS = Math.max(1, rect.height | 0);
		const dpr = this._dpr || (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1);
		const wPx = Math.max(1, Math.round(wCSS * dpr));
		const hPx = Math.max(1, Math.round(hCSS * dpr));
		if (this.gridCanvas && (this.gridCanvas.width !== wPx || this.gridCanvas.height !== hPx)) {
			this.gridCanvas.width = wPx;
			this.gridCanvas.height = hPx;
		}
		if (this.vectorCanvas && (this.vectorCanvas.width !== wPx || this.vectorCanvas.height !== hPx)) {
			this.vectorCanvas.width = wPx;
			this.vectorCanvas.height = hPx;
		}
	}

	private _drawVectors() {
		if (!this._vectorCtx) this._initVectorCanvas();
		this._ensureOverlaySizes();
		const ctx = this._vectorCtx!;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.save();
		try {
			ctx.scale(this._dpr || 1, this._dpr || 1);
		} catch {}
		if (this._vectors.length) {
			const z = this.zoom;
			const rect = this.container.getBoundingClientRect();
			const viewport = { x: rect.width, y: rect.height };
            const imageMaxZ = this._sourceMaxZoom || this.maxZoom;
			for (const prim of this._vectors) {
				const style: any = prim.style || {};
				ctx.lineWidth = Math.max(1, style.weight ?? 2);
				ctx.strokeStyle = style.color || 'rgba(0,0,0,0.85)';
				ctx.globalAlpha = style.opacity ?? 1;
				const begin = () => ctx.beginPath();
				const finishStroke = () => ctx.stroke();
				const finishFill = () => {
					if (style.fill) {
						ctx.globalAlpha = style.fillOpacity ?? 0.25;
						ctx.fillStyle = style.fillColor || style.color || 'rgba(0,0,0,0.25)';
						ctx.fill();
						ctx.globalAlpha = style.opacity ?? 1;
					}
				};
				if (prim.type === 'polyline' || prim.type === 'polygon') {
					const pts = prim.points as Array<{ lng: number; lat: number }>;
					if (!pts.length) continue;
					begin();
					for (let i = 0; i < pts.length; i++) {
						const p = pts[i];
						const css = Coords.worldToCSS({ x: p.lng, y: p.lat }, z, { x: this.center.lng, y: this.center.lat }, viewport, imageMaxZ);
						if (i === 0) ctx.moveTo(css.x, css.y);
						else ctx.lineTo(css.x, css.y);
					}
					if (prim.type === 'polygon') ctx.closePath();
					finishStroke();
					finishFill();
				} else if (prim.type === 'circle') {
					const c = prim.center as { lng: number; lat: number };
					const css = Coords.worldToCSS({ x: c.lng, y: c.lat }, z, { x: this.center.lng, y: this.center.lat }, viewport, imageMaxZ);
					// Radius: specified in native px; convert to CSS using current zInt/scale
					const { zInt, scale } = Coords.zParts(z);
					const s = Coords.sFor(imageMaxZ as number, zInt);
					const rCss = (prim.radius / s) * scale;
					begin();
					ctx.arc(css.x, css.y, rCss, 0, Math.PI * 2);
					finishStroke();
					finishFill();
				}
			}
		}
		ctx.restore();

		// Draw marker hitboxes (debug aid)
		if (this._showMarkerHitboxes && this._icons) {
			ctx.save();
			try {
				ctx.scale(this._dpr || 1, this._dpr || 1);
			} catch {}
			const rect = this.container.getBoundingClientRect();
			const viewport = { x: rect.width, y: rect.height };
            const imageMaxZ = this._sourceMaxZoom || this.maxZoom;
			const info = this._icons.getMarkerInfo();
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgba(255,0,0,0.9)';
			ctx.fillStyle = 'rgba(255,0,0,0.06)';
			ctx.font = '10px system-ui, sans-serif';
			ctx.textBaseline = 'top';
			for (const it of info) {
				const css = Coords.worldToCSS({ x: it.lng, y: it.lat }, this.zoom, { x: this.center.lng, y: this.center.lat }, viewport, imageMaxZ);
				const left = css.x - it.w / 2;
				const top = css.y - it.h / 2;
				// Skip if completely outside viewport
				if (left + it.w < 0 || top + it.h < 0 || left > viewport.x || top > viewport.y) continue;
				ctx.beginPath();
				ctx.rect(Math.round(left) + 0.5, Math.round(top) + 0.5, Math.round(it.w), Math.round(it.h));
				ctx.fill();
				ctx.stroke();
				try {
					ctx.fillText(it.type, Math.round(left) + 2, Math.round(top) + 2);
				} catch {}
			}
			ctx.restore();
		}
	}
}
