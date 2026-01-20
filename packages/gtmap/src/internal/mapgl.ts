// Pixel-CRS: treat lng=x, lat=y in image pixel coordinates at native resolution
// programs are initialized via Graphics
import type { EventMap, ViewState as PublicViewState, ShaderLocations, WebGLLoseContext, MarkerEventData, MarkerInternal } from '../api/types';
import type { MapOptions as PublicMapOptions, Point } from '../api/types';

import Graphics, { type GraphicsHost } from './gl/graphics';
import { ScreenCache } from './render/screen-cache';
import type { RenderCtx, MapImpl, VectorStyle as VectorStyleInternal, VectorPrimitive } from './types';
import * as Coords from './coords';
// url templating moved inline
import { RasterRenderer } from './layers/raster';
import { IconRenderer } from './layers/icons';
import { OverlayRenderer } from './layers/vectors/overlay-renderer';
import { TypedEventBus } from './events/typed-stream';
// grid and wheel helpers are used via delegated modules
// zoom core used via ZoomController
import ZoomController from './core/zoom-controller';
import InputController from './input/input-controller';
import PanController from './core/pan-controller';
import type { InputDeps } from './types';
import MapRenderer from './render/map-renderer';
import { drawGrid } from './render/grid';
import type { ViewState } from './types';
// prefetch/grid helpers moved inline
import { clampCenterWorld as clampCenterWorldCore } from './core/bounds';
import { FrameLoop } from './core/frame-loop';
import AutoResizeManager from './core/auto-resize-manager';
import EventBridge from './events/event-bridge';
import { ImageManager, type ImageManagerHost, type ImageData } from './core/image-manager';
import { AsyncInitManager, type InitProgress } from './core/async-init-manager';

export type LngLat = { lng: number; lat: number };

/** Internal map options extending the public API with internal-only settings. */
export type MapOptions = Omit<PublicMapOptions, 'center'> & {
	/** Center accepts Point (x/y) or legacy LngLat (lng/lat). */
	center?: Point | LngLat;
	/** Zoom-out center bias factor (internal). */
	zoomOutCenterBias?: number | boolean;
	/** Ctrl+wheel speed multiplier (internal). */
	wheelSpeedCtrl?: number;
};
export type EaseOptions = {
	easeBaseMs?: number;
	easePerUnitMs?: number;
	pinchEaseMs?: number;
	easePinch?: boolean;
};
export type IconDefInput = { iconPath: string; x2IconPath?: string; width: number; height: number };

export default class GTMap implements MapImpl, GraphicsHost, ImageManagerHost {
	container: HTMLDivElement;
	canvas!: HTMLCanvasElement;
	gl!: WebGLRenderingContext;
	minZoom: number;
	maxZoom: number;
	mapSize: { width: number; height: number };
	wrapX: boolean;
	freePan: boolean;
	center: LngLat;
	zoom: number;
	private readonly baseGridSize = 256;
	private _imageManager: ImageManager;
	private _asyncInitManager: AsyncInitManager;
	private _imageMaxZoom = 0;

	private _needsRender = true;
	private _frameLoop: FrameLoop | null = null;
	private _input: InputController | null = null;
	private _inputDeps!: InputDeps;
	private _dpr = 1;
	public _prog: WebGLProgram | null = null;
	public _quad: WebGLBuffer | null = null;
	public _loc: ShaderLocations | null = null;
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
	private zoomDamping = 0.09;
	private maxZoomRate = 12.0;
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
	private _pendingIconDefs: Record<string, IconDefInput> | null = null;
	private _pendingMarkers: MarkerInternal[] | null = null;
	private _pendingDecals: MarkerInternal[] | null = null;
	private _debug = false;
	private _renderer!: MapRenderer;
	private _allIconDefs: Record<string, IconDefInput> = {};
	private _lastMarkers: MarkerInternal[] = [];
	private _lastDecals: MarkerInternal[] = [];
	private _rasterOpacity = 1.0;
	private _upscaleFilter: 'auto' | 'linear' | 'bicubic' = 'linear';
	private _iconScaleFunction: ((zoom: number, minZoom: number, maxZoom: number) => number) | null = null;
	private _zoomCtrl!: ZoomController;
	private _gfx!: Graphics;
	private _state!: ViewState;
	private _active = true;
	private _glReleased = false;
	private _inputsAttached = false;
	private _maxBoundsPx: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
	private _maxBoundsViscosity = 0;
	private _clipToBounds = false;
	_bounceAtZoomLimits = false;
	// Home view (initial center)
	// Home view (initial center) no longer tracked
	// Leaflet-like inertia options and state
	private inertia = true;
	private inertiaDeceleration = 3400; // px/s^2
	private inertiaMaxSpeed = 2000; // px/s (cap to prevent excessive throw)
	private easeLinearity = 0.2;
	private _panCtrl!: PanController;
	// (moved to EventBridge)
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
			this.canvas.style.backgroundColor = bg.a < 1 ? 'transparent' : `rgb(${Math.round(bg.r * 255)}, ${Math.round(bg.g * 255)}, ${Math.round(bg.b * 255)})`;
		} catch {}
	}

	private _ensureSpinnerCss() {
		if (GTMap._spinnerCssInjected) return;
		try {
			const style = document.createElement('style');
			style.textContent = `@keyframes gtmap_spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
			document.head.appendChild(style);
			GTMap._spinnerCssInjected = true;
		} catch {}
	}

	private _createLoadingEl() {
		if (!this._showLoading || this._loadingEl) return;
		try {
			const wrap = document.createElement('div');
			Object.assign(wrap.style, {
				position: 'absolute',
				left: '0',
				top: '0',
				right: '0',
				bottom: '0',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				pointerEvents: 'none',
				zIndex: '10',
			} as CSSStyleDeclaration);
			const spinner = document.createElement('div');
			const { size, thickness, color, trackColor, speedMs } = this._spinner;
			Object.assign(spinner.style, {
				width: `${size}px`,
				height: `${size}px`,
				border: `${thickness}px solid ${trackColor}`,
				borderTopColor: color,
				borderRadius: '50%',
				animation: `gtmap_spin ${speedMs}ms linear infinite`,
			} as CSSStyleDeclaration);
			wrap.appendChild(spinner);
			// Ensure container is positioned
			const cs = getComputedStyle(this.container);
			if (cs.position === 'static' || !cs.position) this.container.style.position = 'relative';
			this.container.appendChild(wrap);
			this._loadingEl = wrap;
			this._setLoadingVisible(false);
		} catch {}
	}

	private _setLoadingVisible(on: boolean) {
		this._loadingEl && (this._loadingEl.style.display = on ? 'flex' : 'none');
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
	private _resizeDebounceMs = 150;
	private _resizeMgr: AutoResizeManager | null = null;

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
			imageMaxZoom: this._imageMaxZoom,
			mapSize: this.mapSize,
			wrapX: this.wrapX,
			useScreenCache: this.useScreenCache,
			screenCache: this._screenCache,
			raster: this._raster,
			rasterOpacity: this._rasterOpacity,
			upscaleFilter: this._upscaleFilter,
			iconScaleFunction: this._iconScaleFunction,
			icons: this._icons,
			isIdle: () => {
				const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
				const idleByTime = now - this._lastInteractAt > this.interactionIdleMs;
				const anim = this._zoomCtrl.isAnimating() || this._panCtrl.isAnimating();
				return idleByTime && !anim;
			},
			// Project image pixels at native resolution into level-z pixel coords
			project: (x: number, y: number, z: number) => {
				return Coords.worldToLevel({ x, y }, this._imageMaxZoom, Math.floor(z));
			},
			image: {
				texture: this.getImage().texture,
				// width/height here refer to the underlying texture's pixel dimensions
				width: this.getImage().width,
				height: this.getImage().height,
				ready: this.getImage().ready,
			},
			vectorZIndices: this._getVectorZIndices(),
			drawVectorOverlay: () => this._drawVectorOverlay(),
		};
	}

	/** Get the z-index at which to draw the vector overlay (always 0). */
	private _getVectorZIndices(): number[] {
		// Vectors always render at z=0. Markers/decals default to z=1.
		return this._vectors.length ? [0] : [];
	}

	/** Draw vector overlay (called from IconRenderer at z-index boundaries) */
	private _drawVectorOverlay(): void {
		if (!this._vectorOverlay || !this._vectorCanvas) return;
		this._vectorOverlay.draw();
	}

	// ImageManagerHost API: allow background uploads to pause during interaction
	public isIdle(): boolean {
		try {
			const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
			const idleByTime = now - this._lastInteractAt > this.interactionIdleMs;
			const anim = this._zoomCtrl.isAnimating() || this._panCtrl.isAnimating();
			return idleByTime && !anim;
		} catch {
			return true;
		}
	}

	public getVisibleYRangePx(): { y0: number; y1: number } {
		try {
			const rect = this.container.getBoundingClientRect();
			const wCSS = Math.max(1, Math.round(rect.width));
			const hCSS = Math.max(1, Math.round(rect.height));
			const { zInt, scale } = Coords.zParts(this.zoom);
			const tlLevel = Coords.tlWorldFor({ x: this.center.lng, y: this.center.lat }, this.zoom, { x: wCSS, y: hCSS }, this._imageMaxZoom);
			const tlWorld = Coords.levelToWorld({ x: 0, y: tlLevel.y }, this._imageMaxZoom, zInt);
			const brLevelY = tlLevel.y + hCSS / scale;
			const brWorld = Coords.levelToWorld({ x: 0, y: brLevelY }, this._imageMaxZoom, zInt);
			const y0 = Math.max(0, Math.min(this.mapSize.height, Math.floor(tlWorld.y)));
			const y1 = Math.max(0, Math.min(this.mapSize.height, Math.ceil(brWorld.y)));
			return y0 <= y1 ? { y0, y1 } : { y0: y1, y1: y0 };
		} catch {
			return { y0: 0, y1: this.mapSize.height };
		}
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
	// Grid overlay (disabled by default)
	private showGrid = false;
	private gridCanvas: HTMLCanvasElement | null = null;
	private _gridCtx: CanvasRenderingContext2D | null = null;
	// Vector overlay (Canvas 2D rendered to OffscreenCanvas, copied to WebGL texture)
	private _vectorCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
	private _vectorCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
	private _vectorOverlay: OverlayRenderer | null = null;
	private _vectors: VectorPrimitive[] = [];
	public pointerAbs: { x: number; y: number } | null = null;
	// Loading pacing/cancel
	private interactionIdleMs = 160;
	private _lastInteractAt = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
	// Wheel coalescing + velocity tail
	private _wheelAnchor: { px: number; py: number; mode: 'pointer' | 'center' } = {
		px: 0,
		py: 0,
		mode: 'pointer',
	};
	private _zoomVel = 0;
	// Loader checks this dynamically; no need to track read locally
	useImageBitmap = typeof createImageBitmap === 'function';
	// Hover hit-testing debounce to avoid churn during interactions
	private _hitTestDebounceMs = 75;

	// Timing + logging helpers (relative to instance creation)
	private _t0Ms: number = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
	private _imageReadyAtMs: number | null = null;
	private _firstRasterDrawAtMs: number | null = null;
	private _showLoading = true;
	private _loadingEl: HTMLDivElement | null = null;
	private static _spinnerCssInjected = false;
	private _gateRenderUntilImageReady = false;
	private _spinner = { size: 32, thickness: 3, color: 'rgba(0,0,0,0.6)', trackColor: 'rgba(0,0,0,0.2)', speedMs: 1000 };
	private _pendingFullImage: { url: string; width: number; height: number } | null = null;
	public _nowMs(): number {
		return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
	}
	public _log(msg: string): void {
		try {
			if (!this._debug) return;
			const t = this._nowMs() - this._t0Ms;
			console.log(`[GTMap t=${t.toFixed(1)}ms] ${msg}`);
		} catch {}
	}
	public _gpuWaitEnabled(): boolean {
		try {
			return typeof localStorage !== 'undefined' && localStorage.getItem('GTMAP_DEBUG_GPUWAIT') === '1';
		} catch {
			return false;
		}
	}

	constructor(container: HTMLDivElement, options: MapOptions = {}) {
		this.container = container;
		this._t0Ms = this._nowMs();
		this._log('ctor: begin');

		// Basic configuration setup (synchronous)
		const fullImage = options.image;
		const previewImage = options.preview;
		this.minZoom = options.minZoom ?? 0;
		if (fullImage) {
			// Always size the world to the full image for seamless preview->full upgrade
			this.mapSize = { width: Math.max(1, fullImage.width), height: Math.max(1, fullImage.height) };
		} else if (previewImage) {
			this.mapSize = { width: Math.max(1, previewImage.width), height: Math.max(1, previewImage.height) };
		} else {
			this.mapSize = { width: 512, height: 512 };
		}

		this._imageManager = new ImageManager(this);
		this._asyncInitManager = new AsyncInitManager();

		// Spinner mode is always on; gate rendering until image is ready
		this._showLoading = true;
		this._gateRenderUntilImageReady = true;
		// Merge spinner options
		if (options.spinner) {
			const o = options.spinner;
			this._spinner = {
				size: Math.max(4, Math.floor(o.size ?? this._spinner.size)),
				thickness: Math.max(1, Math.floor(o.thickness ?? this._spinner.thickness)),
				color: o.color ?? this._spinner.color,
				trackColor: o.trackColor ?? this._spinner.trackColor,
				speedMs: Math.max(100, Math.floor(o.speedMs ?? this._spinner.speedMs)),
			};
		}

		// Defer image load until async finalize. If a preview is provided,
		// we avoid kicking off the full-res load here to prevent duplicate requests.
		this._imageMaxZoom = this._computeImageMaxZoom(this.mapSize.width, this.mapSize.height);
		const defaultMaxZoom = options.maxZoom ?? this._imageMaxZoom;
		this.maxZoom = Math.max(this.minZoom, defaultMaxZoom);
		this.wrapX = options.wrapX ?? false;
		this.freePan = options.freePan ?? false;
		// Accept either Point (x/y) or LngLat (lng/lat) for center
		const c = options.center as (Point & Partial<LngLat>) | undefined;
		this.center = {
			lng: c?.x ?? c?.lng ?? this.mapSize.width / 2,
			lat: c?.y ?? c?.lat ?? this.mapSize.height / 2,
		};
		this.zoom = options.zoom ?? Math.min(this.maxZoom, this._imageMaxZoom);

		if (typeof options.zoomOutCenterBias === 'boolean') {
			this.outCenterBias = options.zoomOutCenterBias ? 0.15 : 0.0;
		} else if (Number.isFinite(options.zoomOutCenterBias as number)) {
			const v = Math.max(0, Math.min(1, options.zoomOutCenterBias as number));
			this.outCenterBias = v;
		}

		// Store options for async initialization
		if (Number.isFinite(options.fpsCap as number)) {
			const v = Math.max(15, Math.min(240, (options.fpsCap as number) | 0));
			this._targetFps = v;
		}
		if (typeof options.screenCache === 'boolean') this.useScreenCache = options.screenCache;
		if (options.debug === true) this._debug = true;
		if (Number.isFinite(options.wheelSpeedCtrl as number)) this.wheelSpeedCtrl = Math.max(0.01, Math.min(2, options.wheelSpeedCtrl as number));
		if (options.maxBoundsPx) this._maxBoundsPx = { ...options.maxBoundsPx };
		if (Number.isFinite(options.maxBoundsViscosity as number)) this._maxBoundsViscosity = Math.max(0, Math.min(1, options.maxBoundsViscosity as number));
		if (typeof options.bounceAtZoomLimits === 'boolean') this._bounceAtZoomLimits = options.bounceAtZoomLimits;
		if (typeof options.clipToBounds === 'boolean') this._clipToBounds = options.clipToBounds;
		this._autoResize = options.autoResize !== false;

		// Start async initialization
		this._startAsyncInit(options, fullImage);
	}

	private async _startAsyncInit(options: MapOptions, initialImage: MapOptions['image']): Promise<void> {
		// Set up initialization steps
		this._asyncInitManager.addSteps([
			{
				name: 'Initialize Canvas',
				execute: () => this._initCanvas(),
				weight: 1,
			},
			{
				name: 'Initialize Graphics',
				execute: () => {
					this._gfx = new Graphics(this);
					this._parseBackground(options.backgroundColor);
					this._gfx.init(true, [this._bg.r, this._bg.g, this._bg.b, this._bg.a]);
					// Prepare loading indicator overlay
					this._ensureSpinnerCss();
					this._createLoadingEl();
				},
				weight: 3,
			},
			{
				name: 'Initialize Programs',
				execute: () => this._initPrograms(),
				weight: 2,
			},
			{
				name: 'Initialize Renderers',
				execute: () => {
					this._screenCache = new ScreenCache(this.gl, (this._screenTexFormat ?? this.gl.RGBA) as 6408 | 6407);
					this._raster = new RasterRenderer(this.gl);
					this._icons = new IconRenderer(this.gl);
					// If icon defs were provided before the renderer was constructed (e.g., from facade ctor),
					// apply them now so markers can render immediately.
					if (this._pendingIconDefs) {
						const defs = this._pendingIconDefs;
						this._pendingIconDefs = null;
						// Fire and forget; screen cache clearing and re-render will follow in setIconDefs
						void this.setIconDefs(defs);
					}
					// If markers were provided early, apply them once icons are ready
					if (this._pendingMarkers && this._pendingMarkers.length) {
						const m = this._pendingMarkers.slice();
						this._pendingMarkers = null;
						this.setMarkers(m);
					}
					// If decals were provided early, apply them once icons are ready
					if (this._pendingDecals && this._pendingDecals.length) {
						const d = this._pendingDecals.slice();
						this._pendingDecals = null;
						this.setDecals(d);
					}
				},
				weight: 3,
			},
			{
				name: 'Initialize Controllers',
				execute: () => {
					this._renderer = new MapRenderer(() => this.getRenderCtx(), {
						stepAnimation: () => this._zoomCtrl.step(),
						zoomVelocityTick: () => this.zoomVelocityTick(),
						panVelocityTick: () => {
							this._panCtrl.step();
						},
					});
					this._zoomCtrl = new ZoomController({
						getZoom: () => this.zoom,
						getMinZoom: () => this.minZoom,
						getMaxZoom: () => this.maxZoom,
						getImageMaxZoom: () => this._imageMaxZoom,
						shouldAnchorCenterForZoom: (target) => this._shouldAnchorCenterForZoom(target),
						getContainer: () => this.container,
						getBoundsPx: () => this._maxBoundsPx,
						getBounceAtZoomLimits: () => this._bounceAtZoomLimits,
						setCenterLngLat: (lng: number, lat: number) => {
							this.center = { lng, lat };
							this._state.center = this.center;
						},
						setZoom: (z: number) => {
							this.zoom = z;
							this._state.zoom = this.zoom;
						},
						getOutCenterBias: () => this.outCenterBias,
						clampCenterWorld: (cw, zInt, s, w, h) =>
							clampCenterWorldCore(cw, zInt, s, w, h, this.wrapX, this.freePan, this.mapSize, this.maxZoom, this._maxBoundsPx, this._maxBoundsViscosity, false),
						emit: <K extends keyof EventMap>(name: K, payload: EventMap[K]) => this._events.emit(name, payload),
						requestRender: () => {
							this._needsRender = true;
						},
						now: () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()),
						getPublicView: () => this._viewPublic(),
					});
					this._panCtrl = new PanController({
						getZoom: () => this.zoom,
						getImageMaxZoom: () => this._imageMaxZoom,
						getContainer: () => this.container,
						getWrapX: () => this.wrapX,
						getFreePan: () => this.freePan,
						getMapSize: () => this.mapSize,
						getMaxZoom: () => this.maxZoom,
						getMaxBoundsPx: () => this._maxBoundsPx,
						getMaxBoundsViscosity: () => this._maxBoundsViscosity,
						getCenter: () => ({ x: this.center.lng, y: this.center.lat }),
						setCenter: (lng: number, lat: number) => {
							this.center = { lng, lat };
							this._state.center = this.center;
						},
						requestRender: () => {
							this._needsRender = true;
						},
						emit: <K extends keyof EventMap>(name: K, payload: EventMap[K]) => this._events.emit(name, payload),
						now: () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()),
						getPublicView: () => this._viewPublic(),
					});
				},
				weight: 4,
			},
			{
				name: 'Initialize State',
				execute: () => {
					this._state = {
						center: this.center,
						zoom: this.zoom,
						minZoom: this.minZoom,
						maxZoom: this.maxZoom,
						wrapX: this.wrapX,
					};
				},
				weight: 1,
			},
			{
				name: 'Initialize Canvas Elements',
				execute: () => {
					this._initGridCanvas();
					this._initVectorCanvas();
				},
				weight: 2,
			},
			{
				name: 'Initial Resize',
				execute: () => this.resize(),
				weight: 1,
			},
			{
				name: 'Initialize Events',
				execute: () => this._initEvents(),
				weight: 2,
			},
			{
				name: 'Start Frame Loop',
				execute: () => {
					this._frameLoop = new FrameLoop(
						() => this._targetFps,
						(now: number, allowRender: boolean) => this._tick(now, allowRender),
					);
					this._frameLoop.start();
				},
				weight: 1,
			},
		]);

		// Run async initialization with progress tracking
		try {
			await this._asyncInitManager.initialize({
				yieldAfterMs: 16, // Yield every 16ms to maintain 60fps
				onProgress: (progress: InitProgress) => {
					this._log(`init:progress step=${progress.step} ${progress.percentage}% (${progress.completed}/${progress.total})`);
				},
				onComplete: () => {
					this._log('init:complete - async initialization finished');
					this._finalizeInit(options, initialImage);
				},
				onError: (error: Error) => {
					this._log(`init:error ${error.message}`);
					console.error('[GTMap] Async initialization failed:', error);
				},
			});
		} catch (error) {
			this._log(`init:fatal-error ${error}`);
			console.error('[GTMap] Fatal initialization error:', error);
		}
	}

	private _finalizeInit(_options: MapOptions, initialImage: MapOptions['image']): void {
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

		if (this._autoResize) {
			const attach = () => {
				this._resizeMgr = new AutoResizeManager({
					getContainer: () => this.container,
					onResize: () => this.resize(),
					getDebounceMs: () => this._resizeDebounceMs,
				});
				this._resizeMgr.attach();
			};
			if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(attach));
			else setTimeout(attach, 0);
		}

		// Start image loading after async init
		const fullImage = initialImage;
		const previewImage = _options.preview;
		if (previewImage && fullImage) {
			// Progressive path: show preview first, then upgrade to full in background
			if (this._showLoading) this._setLoadingVisible(true);
			this._pendingFullImage = { url: fullImage.url, width: fullImage.width, height: fullImage.height };
			// Load preview but scale/fit to full image dimensions to avoid any geometry changes on upgrade
			try {
				void this._imageManager.loadImage(previewImage.url, { width: this.mapSize.width, height: this.mapSize.height });
			} catch {}
		} else if (fullImage) {
			// Non-progressive path (default): load full image with spinner gating
			if (this._showLoading) this._setLoadingVisible(true);
			this.setImageSource(fullImage);
		}

		this._log('ctor: end');
	}

	// ImageManagerHost interface implementation
	onImageReady(): void {
		this._imageReadyAtMs = this._nowMs();
		try {
			this._screenCache?.clear?.();
		} catch {}
		this._needsRender = true;
		// Hide loading overlay when image becomes ready (full image path)
		if (this._showLoading) this._setLoadingVisible(false);
		// Allow rendering now if it was gated
		this._gateRenderUntilImageReady = false;
		// Attach inputs if they were deferred
		if (this._input && !this._inputsAttached) {
			try {
				this._input.attach();
				this._inputsAttached = true;
			} catch {}
		}
		// If a full image is pending (progressive), kick off the upgrade in the background now.
		if (this._pendingFullImage) {
			const cur = this.getImage();
			const want = this._pendingFullImage;
			if (cur && cur.url !== want.url) {
				try {
					void this._imageManager.loadImage(want.url, { width: this.mapSize.width, height: this.mapSize.height });
				} catch {}
			}
			this._pendingFullImage = null;
		}
	}

	getImage(): ImageData {
		return this._imageManager.getImage();
	}

	setCenter(lng: number, lat: number) {
		// If bounds are set, strictly clamp center against bounds (Leaflet-like)
		if (this._maxBoundsPx) {
			const { zInt, scale } = Coords.zParts(this.zoom);
			const rect = this.container.getBoundingClientRect();
			const wCSS = rect.width,
				hCSS = rect.height;
			const imageMaxZ = this._imageMaxZoom;
			const s0 = Coords.sFor(imageMaxZ, zInt);
			const cw = { x: lng / s0, y: lat / s0 };
			const clamped = clampCenterWorldCore(cw, zInt, scale, wCSS, hCSS, this.wrapX, this.freePan, this.mapSize, this.maxZoom, this._maxBoundsPx, this._maxBoundsViscosity, false);
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
	setImageSource(opts: { url: string; width: number; height: number }) {
		if (!opts || typeof opts.url !== 'string' || !opts.url.trim()) throw new Error('GTMap: image url must be a non-empty string');
		if (!Number.isFinite(opts.width) || opts.width <= 0) throw new Error('GTMap: image width must be a positive number');
		if (!Number.isFinite(opts.height) || opts.height <= 0) throw new Error('GTMap: image height must be a positive number');
		this._log(`image:set url=${opts.url} size=${opts.width}x${opts.height}`);
		const currentImage = this.getImage();
		if (currentImage.texture) {
			try {
				this.gl.deleteTexture(currentImage.texture);
			} catch {}
		}
		this.mapSize = { width: Math.max(1, Math.floor(opts.width)), height: Math.max(1, Math.floor(opts.height)) };
		this._imageManager.setImage({ url: opts.url, width: this.mapSize.width, height: this.mapSize.height });
		this._imageMaxZoom = this._computeImageMaxZoom(this.mapSize.width, this.mapSize.height);
		this.maxZoom = Math.max(this.minZoom, this.maxZoom);
		this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
		this._state.maxZoom = this.maxZoom;
		this._state.center = this.center;
		this._state.zoom = this.zoom;
		this._state.wrapX = this.wrapX;
		this.setCenter(this.center.lng, this.center.lat);
		try {
			this._screenCache?.clear?.();
		} catch {}
		this._needsRender = true;
		// ImageManager.setImage() already begins async loading
	}

	private _computeImageMaxZoom(width: number, height: number): number {
		const maxDim = Math.max(1, Math.max(width, height));
		const base = Math.max(1, this.baseGridSize);
		const ratio = maxDim / base;
		const value = Math.log2(ratio);
		if (!Number.isFinite(value)) return 0;
		return Math.max(0, Math.floor(value));
	}

	public _isPowerOfTwo(value: number): boolean {
		return (value & (value - 1)) === 0;
	}

	async setIconDefs(defs: Record<string, IconDefInput>) {
		// Track all icon defs for GL resume
		for (const k of Object.keys(defs)) this._allIconDefs[k] = defs[k];
		if (!this._icons) {
			// Renderer not ready yet; merge into pending and apply later.
			if (!this._pendingIconDefs) this._pendingIconDefs = {};
			for (const k of Object.keys(defs)) this._pendingIconDefs[k] = defs[k];
			return;
		}
		try {
			await this._icons.loadIcons(defs);
		} catch (err) {
			// Log error but don't propagate - icon loading failures shouldn't crash the map
			if (typeof console !== 'undefined' && console.warn) {
				console.warn('[GTMap] Icon loading failed:', err);
			}
		}
		try {
			this._screenCache?.clear?.();
		} catch {}
		this._needsRender = true;
	}
	setMarkers(markers: MarkerInternal[]) {
		// Remember last marker set for GL resume
		try {
			this._lastMarkers = markers.slice();
		} catch {
			this._lastMarkers = markers as MarkerInternal[];
		}
		if (!this._icons) {
			// Buffer until icon renderer is ready
			this._pendingMarkers = markers.slice();
			return;
		}
		try {
			// Filter out empty strings in addition to non-strings to avoid false matches
			const nextIds = new Set<string>(markers.map((m) => m.id).filter((id): id is string => typeof id === 'string' && id.length > 0));
			if (this._lastHover && this._lastHover.id && !nextIds.has(this._lastHover.id)) {
				const prev = this._lastHover;
				const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
				this._emitMarker('leave', {
					now,
					view: this._viewPublic(),
					screen: { x: -1, y: -1 },
					marker: { id: prev.id || '', index: prev.idx ?? -1, world: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
					icon: { id: prev.type, iconPath: '', width: 0, height: 0, anchorX: 0, anchorY: 0 },
				});
				this._lastHover = null;
			}
		} catch {}
		this._icons.setMarkers(markers);
		if (this._debug) this._log(`setMarkers count=${markers.length}`);
		try {
			this._screenCache?.clear?.();
		} catch {}
		this._needsRender = true;
	}
	setDecals(decals: MarkerInternal[]) {
		// Remember decals for GL resume
		try {
			this._lastDecals = decals.slice();
		} catch {
			this._lastDecals = decals as MarkerInternal[];
		}
		if (!this._icons) {
			// Buffer until icon renderer is ready
			this._pendingDecals = decals.slice();
			return;
		}
		// Decals use the same icon renderer but are non-interactive
		this._icons.setDecals?.(decals);
		if (this._debug) this._log(`setDecals count=${decals.length}`);
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
	public panTo(lng: number, lat: number, durationMs = 500) {
		const { zInt, scale } = Coords.zParts(this.zoom);
		const imageMaxZ = this._imageMaxZoom;
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
		this._panCtrl.cancel();
	}
	public getMinZoom(): number {
		return this.minZoom;
	}
	public getMaxZoom(): number {
		return this.maxZoom;
	}
	public getImageMaxZoom(): number {
		return this._imageMaxZoom;
	}

	public cancelZoomAnim() {
		try {
			this._zoomCtrl.cancel();
		} catch {}
	}
	// recenter helper removed from public surface; use setCenter/setView via facade
	destroy() {
		// Detach observers and listeners first
		try {
			this._resizeMgr?.detach();
			this._resizeMgr = null;
		} catch {}
		if (this._frameLoop) {
			try {
				this._frameLoop.stop();
			} catch {}
			this._frameLoop = null;
		}
		this._input?.dispose();
		this._input = null;
		try {
			this._renderer?.dispose?.();
		} catch {}
		try {
			this._gfx?.dispose?.();
		} catch {}
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
		try {
			this._icons?.dispose?.();
		} catch {}
		try {
			this._icons = null;
		} catch {}
		try {
			this.canvas.remove();
		} catch {}
		if (this.gridCanvas) {
			try {
				this.gridCanvas.remove();
			} catch {}
			this.gridCanvas = null;
			this._gridCtx = null;
			if (this._vectorCanvas) {
				// OffscreenCanvas doesn't need removal from DOM
				if (this._vectorCanvas instanceof HTMLCanvasElement) {
					try {
						this._vectorCanvas.remove();
					} catch {}
				}
				this._vectorCanvas = null;
				this._vectorCtx = null;
				this._vectors = [];
			}
			if (this._vectorOverlay) {
				this._vectorOverlay.dispose();
				this._vectorOverlay = null;
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
		this._imageManager.dispose();
	}
	public clearCache() {
		this._clearCache();
		this._needsRender = true;
	}
	private _destroyCache() {
		this._clearCache();
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
		if (this._vectorCanvas) {
			// OffscreenCanvas doesn't have style; just resize the buffer
			if (this._vectorCanvas instanceof HTMLCanvasElement) {
				this._vectorCanvas.style.width = cssW + 'px';
				this._vectorCanvas.style.height = cssH + 'px';
			}
			if (this._vectorCanvas.width !== w || this._vectorCanvas.height !== h) {
				this._vectorCanvas.width = w;
				this._vectorCanvas.height = h;
				this._needsRender = true;
			}
		}
	}

	public setAutoResize(on: boolean) {
		const v = !!on;
		if (v === this._autoResize) return;
		this._autoResize = v;
		if (v) {
			this._resizeMgr = new AutoResizeManager({
				getContainer: () => this.container,
				onResize: () => this.resize(),
				getDebounceMs: () => this._resizeDebounceMs,
			});
			this._resizeMgr.attach();
		} else {
			this._resizeMgr?.detach();
			this._resizeMgr = null;
		}
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
			this._state.wrapX = this.wrapX;
			this._needsRender = true;
		}
	}
	public setLoaderOptions(opts: { maxTiles?: number; maxInflightLoads?: number; interactionIdleMs?: number }) {
		if (Number.isFinite(opts.interactionIdleMs as number)) this.interactionIdleMs = Math.max(0, (opts.interactionIdleMs as number) | 0);
	}
	public setMaxBoundsPx(bounds: { minX: number; minY: number; maxX: number; maxY: number } | null) {
		this._maxBoundsPx = bounds ? { ...bounds } : null;
		this._needsRender = true;
	}
	public setMaxBoundsViscosity(v: number) {
		this._maxBoundsViscosity = Math.max(0, Math.min(1, v));
		this._needsRender = true;
	}
	public setClipToBounds(on: boolean) {
		const v = !!on;
		if (v !== this._clipToBounds) {
			this._clipToBounds = v;
			this._needsRender = true;
		}
	}
	private _initEvents() {
		this._inputDeps = {
			getContainer: () => this.container,
			getCanvas: () => this.canvas,
			getMaxZoom: () => this.maxZoom,
			getImageMaxZoom: () => this._imageMaxZoom,
			getView: () => this._viewPublic(),
			setCenter: (lng: number, lat: number) => this.setCenter(lng, lat),
			setZoom: (z: number) => this.setZoom(z),
			clampCenterWorld: (cw, zInt, scale, w, h, viscous?: boolean) =>
				clampCenterWorldCore(cw, zInt, scale, w, h, this.wrapX, this.freePan, this.mapSize, this.maxZoom, this._maxBoundsPx, this._maxBoundsViscosity, !!viscous),
			updatePointerAbs: (x: number | null, y: number | null) => {
				if (Number.isFinite(x as number) && Number.isFinite(y as number)) this.pointerAbs = { x: x as number, y: y as number };
				else this.pointerAbs = null;
			},
			emit: <K extends keyof EventMap>(name: K, payload: EventMap[K]) => this._events.emit(name, payload),
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
				this._panCtrl.cancel();
			},
		};
		this._input = new InputController(this._inputDeps);
		if (!this._gateRenderUntilImageReady) {
			this._input.attach();
			this._inputsAttached = true;
		}
		// Wire marker hover/click and mouse derivations via EventBridge
		try {
			const bridge = new EventBridge({
				events: this._events,
				getView: () => this._viewPublic(),
				now: () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()),
				isMoving: () => this._zoomCtrl.isAnimating() || this._panCtrl.isAnimating(),
				getLastInteractAt: () => this._lastInteractAt,
				getHitTestDebounceMs: () => this._hitTestDebounceMs,
				hitTest: (x, y, alpha) => this._hitTestMarker(x, y, alpha),
				computeHits: (x, y) => this._computeMarkerHits(x, y),
				emitMarker: (name, payload) => this._emitMarker(name, payload),
				getLastHover: () => this._lastHover,
				setLastHover: (h) => {
					this._lastHover = h;
				},
				getMarkerDataById: (id: string) => this._markerData.get(id),
			});
			bridge.attach();
		} catch {}
	}

	public setMarkerData(payloads: Record<string, unknown | null | undefined>) {
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
		const animating = this._zoomCtrl.isAnimating() || this._panCtrl.isAnimating();
		if (!this._needsRender && !animating) return;
		if (!allowRender) {
			try {
				this._zoomCtrl.step();
			} catch {}
			try {
				this.zoomVelocityTick();
			} catch {}
			try {
				this._panCtrl.step();
			} catch {}
			this._needsRender = true;
			return;
		}
		this._render();
		if (!this._zoomCtrl.isAnimating() && !this._panCtrl.isAnimating()) this._needsRender = false;
	}
	private _render() {
		// Gate rendering until the full image is ready (spinner shown)
		if (this._gateRenderUntilImageReady && !this.getImage().ready) {
			return;
		}
		const imageReadyAtCall = this.getImage().ready;
		const tR0 = this._nowMs();

		// Apply scissor clipping to map bounds if enabled
		const gl = this.gl;
		let scissorEnabled = false;
		if (this._clipToBounds) {
			try {
				const rect = this.container.getBoundingClientRect();
				const wCSS = rect.width;
				const hCSS = rect.height;
				const dpr = this._dpr;

				// Compute map corners in screen space
				const tl = Coords.worldToCSS({ x: 0, y: 0 }, this.zoom, { x: this.center.lng, y: this.center.lat }, { x: wCSS, y: hCSS }, this._imageMaxZoom);
				const br = Coords.worldToCSS({ x: this.mapSize.width, y: this.mapSize.height }, this.zoom, { x: this.center.lng, y: this.center.lat }, { x: wCSS, y: hCSS }, this._imageMaxZoom);

				// Clamp to viewport
				const x0 = Math.max(0, Math.floor(tl.x * dpr));
				const y0 = Math.max(0, Math.floor(tl.y * dpr));
				const x1 = Math.min(this.canvas.width, Math.ceil(br.x * dpr));
				const y1 = Math.min(this.canvas.height, Math.ceil(br.y * dpr));

				// WebGL scissor uses bottom-left origin
				const scissorX = x0;
				const scissorY = this.canvas.height - y1;
				const scissorW = Math.max(0, x1 - x0);
				const scissorH = Math.max(0, y1 - y0);

				if (scissorW > 0 && scissorH > 0) {
					gl.enable(gl.SCISSOR_TEST);
					gl.scissor(scissorX, scissorY, scissorW, scissorH);
					scissorEnabled = true;
				}
			} catch {}
		}

		// Upload vector overlay before rendering (so IconRenderer can draw it)
		try {
			this._drawVectors();
		} catch {}

		this._renderer.render();

		// Disable scissor test after rendering
		if (scissorEnabled) {
			try {
				gl.disable(gl.SCISSOR_TEST);
			} catch {}
		}
		if (imageReadyAtCall && this._firstRasterDrawAtMs == null) {
			if (this._gpuWaitEnabled()) {
				try {
					this.gl.finish();
				} catch {}
			}
			this._firstRasterDrawAtMs = this._nowMs();
			const dtRender = this._firstRasterDrawAtMs - tR0;
			const dtSinceReady = this._imageReadyAtMs ? this._firstRasterDrawAtMs - this._imageReadyAtMs : NaN;
			this._log(`first-render done dtRender=${dtRender.toFixed(1)}ms sinceReady=${Number.isFinite(dtSinceReady) ? dtSinceReady.toFixed(1) : 'n/a'}ms`);
		}
		// Kick off deferred icon mask build after first render
		try {
			// Defer icon mask build until after the first render, using requestIdleCallback when available.
			if (!this._maskBuildRequested) {
				this._maskBuildRequested = true;
				const start = () => {
					try {
						this._icons?.startMaskBuild?.();
					} catch {}
				};
				// Feature-test requestIdleCallback safely
				const w = window as { requestIdleCallback?: (cb: () => void) => number };
				if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(start);
				else setTimeout(start, 0);
			}
		} catch {}
		// Emit a frame event for HUD/diagnostics
		try {
			const t = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
			const stats = { frame: this._frame };
			this._events.emit('frame', { now: t, stats });
		} catch {}
		if (this.showGrid) {
			const rect = this.container.getBoundingClientRect();
			const { zInt: baseZ, scale } = Coords.zParts(this.zoom);
			const widthCSS = rect.width;
			const heightCSS = rect.height;
			const imageMaxZ = this._imageMaxZoom;
			const s = Coords.sFor(imageMaxZ, baseZ);
			const centerLevel = { x: this.center.lng / s, y: this.center.lat / s };
			let tlWorld = Coords.tlLevelFor(centerLevel, this.zoom, { x: widthCSS, y: heightCSS });
			// Snap to device pixel grid to reduce shimmer during pan
			const snap = (v: number) => Coords.snapLevelToDevice(v, scale, this._dpr);
			tlWorld = { x: snap(tlWorld.x), y: snap(tlWorld.y) };
			const pal = this._gridPalette();
			drawGrid(this._gridCtx, this.gridCanvas, baseZ, scale, widthCSS, heightCSS, tlWorld, this._dpr, this._imageMaxZoom, this.baseGridSize, pal);
		}
	}

	// Zoom actions handled by ZoomController

	// Finite-world center anchoring hysteresis
	private _viewportCoverageRatio(zInt: number, scale: number, widthCSS: number, heightCSS: number) {
		const zImg = this._imageMaxZoom;
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

	// pan velocity handled by PanController

	private _startPanBy(dxPx: number, dyPx: number, durSec: number, easing?: number | ((t: number) => number)) {
		const ef = typeof easing === 'function' ? easing : undefined;
		this._panCtrl.startBy(dxPx, dyPx, Math.max(0.05, durSec), ef);
	}

	// Suspend/resume this map instance and optionally release the WebGL context.
	public setActive(active: boolean, opts?: { releaseGL?: boolean }) {
		if (active === this._active && !(active && this._glReleased)) return;
		if (!active) {
			this._active = false;
			try {
				this._frameLoop?.stop?.();
			} catch {}
			try {
				this._input?.dispose();
			} catch {}
			if (opts?.releaseGL && this.gl) {
				try {
					this._screenCache?.dispose();
					this._screenCache = null;
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
			} catch {}
			try {
				// Rebuild icons and reapply markers
				this._icons = new IconRenderer(this.gl);
				const defs = this._allIconDefs;
				if (defs && Object.keys(defs).length) {
					void this._icons.loadIcons(defs);
				}
				if (this._lastMarkers && this._lastMarkers.length) {
					this._icons.setMarkers(this._lastMarkers);
				}
				if (this._lastDecals && this._lastDecals.length) {
					this._icons.setDecals?.(this._lastDecals);
				}
			} catch {}
			try {
				// Reload base image texture
				const img = this._imageManager.getImage();
				if (img && img.url) {
					void this._imageManager.loadImage(img.url, { width: img.width, height: img.height });
				}
			} catch {}
			this._glReleased = false;
		}
		try {
			this._input?.attach?.();
		} catch {}
		this._active = true;
		this._needsRender = true;
		try {
			this._frameLoop?.start?.();
		} catch {}
	}

	public prefetchNeighbors(_z: number, _tl: { x: number; y: number }, _scale: number, _w: number, _h: number) {
		/* no-op: single image renderer */
	}

	private _initVectorCanvas() {
		const rect = this.container.getBoundingClientRect();
		const w = Math.max(1, Math.floor(rect.width * (this._dpr || 1)));
		const h = Math.max(1, Math.floor(rect.height * (this._dpr || 1)));

		// Use OffscreenCanvas if available, otherwise hidden HTMLCanvasElement
		if (typeof OffscreenCanvas !== 'undefined') {
			this._vectorCanvas = new OffscreenCanvas(w, h);
			this._vectorCtx = this._vectorCanvas.getContext('2d');
		} else {
			const c = document.createElement('canvas');
			c.width = w;
			c.height = h;
			this._vectorCanvas = c;
			this._vectorCtx = c.getContext('2d');
		}

		// Initialize overlay renderer for WebGL compositing
		if (!this._vectorOverlay && this.gl) {
			this._vectorOverlay = new OverlayRenderer(this.gl);
		}
	}

	public setVectors(vectors: VectorPrimitive[]) {
		this._vectors = vectors.slice();
		this._needsRender = true;
	}

	// Simple hover/click hit testing on markers (AABB, ignores rotation)
	private _lastHover: { type: string; idx: number; id?: string } | null = null;
	// (moved to EventBridge)
	private _markerData = new Map<string, unknown | null | undefined>();
	// Private marker event sinks (not exposed on public bus)
	private _markerSinks: Record<'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', Set<(e: MarkerEventData) => void>> = {
		enter: new Set(),
		leave: new Set(),
		click: new Set(),
		down: new Set(),
		up: new Set(),
		longpress: new Set(),
	};

	public onMarkerEvent(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', handler: (e: MarkerEventData) => void): () => void {
		const set = this._markerSinks[name];
		set.add(handler);
		return () => set.delete(handler);
	}

	private _emitMarker(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', payload: MarkerEventData) {
		const set = this._markerSinks[name];
		if (!set || set.size === 0) return;
		for (const fn of Array.from(set)) {
			try {
				fn(payload);
			} catch {}
		}
	}
	/**
	 * Hit test markers at a screen position, returning the topmost hit.
	 *
	 * ## Algorithm Overview
	 *
	 * 1. **Iterate top-to-bottom**: Markers are rendered in array order, so later
	 *    markers appear on top. We iterate in reverse to find the topmost hit first.
	 *
	 * 2. **AABB test**: First check if point is within the marker's axis-aligned
	 *    bounding box (fast rejection for most markers).
	 *
	 * 3. **Alpha mask test** (optional): For pixel-accurate hits on non-rectangular
	 *    icons, sample the icon's alpha channel. This handles irregular shapes,
	 *    transparency, and rotation.
	 *
	 * ## Rotation Handling
	 *
	 * When a marker is rotated, we need to "unrotate" the hit point before sampling
	 * the alpha mask. The rotation is around the anchor point:
	 *
	 * ```
	 * 1. Translate point to anchor-relative coords: (lx - ax, ly - ay)
	 * 2. Apply inverse rotation: rotate by -theta
	 * 3. Translate back: add anchor offset
	 * 4. Sample mask at the unrotated position
	 * ```
	 *
	 * @param px - Screen X in CSS pixels (relative to container)
	 * @param py - Screen Y in CSS pixels (relative to container)
	 * @param requireAlpha - Reserved for future use (currently ignored)
	 * @returns Hit info for the topmost marker, or null if no hit
	 */
	private _hitTestMarker(px: number, py: number, requireAlpha = false) {
		void requireAlpha;
		if (!this._icons) return null;

		const rect = this.container.getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
		const iconScale = this._iconScaleFunction ? this._iconScaleFunction(this.zoom, this.minZoom, this.maxZoom) : 1.0;
		const info = this._icons.getMarkerInfo(iconScale);
		const imageMaxZ = this._imageMaxZoom;

		// Iterate in reverse: last marker rendered is on top, so check it first
		for (let i = info.length - 1; i >= 0; i--) {
			const it = info[i];

			// Convert marker world position to screen position
			const css = Coords.worldToCSS({ x: it.lng, y: it.lat }, this.zoom, { x: this.center.lng, y: this.center.lat }, { x: widthCSS, y: heightCSS }, imageMaxZ);

			// Compute AABB bounds (anchor offsets from the marker's screen position)
			const left = css.x - it.anchor.ax;
			const top = css.y - it.anchor.ay;

			// Fast AABB rejection test
			if (px >= left && px <= left + it.w && py >= top && py <= top + it.h) {
				// Point is within bounding box - now check alpha mask for pixel-accuracy
				const mask = this._icons.getMaskInfo?.(it.type) || null;
				if (mask) {
					// Transform hit point to icon's local coordinate space
					const ax = it.anchor.ax; // Anchor X (rotation pivot)
					const ay = it.anchor.ay; // Anchor Y (rotation pivot)
					const lx = px - left; // Local X (0 to width)
					const ly = py - top; // Local Y (0 to height)

					// Translate to anchor-relative coords for rotation
					const cx = lx - ax;
					const cy = ly - ay;

					// Apply INVERSE rotation to get the unrotated position
					// (We're undoing the marker's rotation to find the original texel)
					const theta = ((it.rotation || 0) * Math.PI) / 180;
					const c = Math.cos(-theta),
						s = Math.sin(-theta);
					const rx = cx * c - cy * s + ax; // Rotated X + translate back
					const ry = cx * s + cy * c + ay; // Rotated Y + translate back

					// Bounds check after rotation (point might rotate outside icon)
					if (rx < 0 || ry < 0 || rx >= it.w || ry >= it.h) continue;

					// Map local coords to mask texel coords
					const mx = Math.max(0, Math.min(mask.w - 1, Math.floor((rx / it.w) * mask.w)));
					const my = Math.max(0, Math.min(mask.h - 1, Math.floor((ry / it.h) * mask.h)));

					// Sample alpha value (0-255)
					const alpha = mask.data[my * mask.w + mx] | 0;
					const THRESH = 32; // ~12.5% opacity threshold
					if (alpha < THRESH) continue; // Transparent pixel - no hit
				}

				// Hit confirmed - return marker info
				return {
					idx: it.index,
					id: it.id,
					type: it.type,
					world: { x: it.lng, y: it.lat },
					screen: { x: css.x, y: css.y },
					size: { width: it.w, height: it.h },
					rotation: it.rotation,
					icon: it.icon,
				};
			}
		}
		return null;
	}

	/**
	 * Compute all markers that hit a screen position, ordered top-to-bottom.
	 *
	 * Unlike `_hitTestMarker` which returns only the topmost hit, this method
	 * returns ALL markers under the cursor. Useful for:
	 * - Click-through: showing a menu of overlapping markers
	 * - Analytics: counting markers at a point
	 * - Debugging: visualizing marker stacking
	 *
	 * ## Algorithm
	 *
	 * Same as `_hitTestMarker`:
	 * 1. Iterate markers in reverse render order (top-to-bottom)
	 * 2. AABB test for fast rejection
	 * 3. Alpha mask test for pixel-accurate hits (with rotation handling)
	 * 4. Collect all hits instead of returning on first hit
	 *
	 * ## Return Order
	 *
	 * Results are ordered from topmost (first) to bottommost (last),
	 * matching visual stacking order.
	 *
	 * @param px - Screen X in CSS pixels (relative to container)
	 * @param py - Screen Y in CSS pixels (relative to container)
	 * @returns Array of hit markers with position, size, rotation, and icon info
	 */
	private _computeMarkerHits(
		px: number,
		py: number,
	): Array<{
		id: string;
		idx: number;
		world: { x: number; y: number };
		size: { width: number; height: number };
		rotation?: number;
		icon: { id: string; iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
	}> {
		const out: Array<{
			id: string;
			idx: number;
			world: { x: number; y: number };
			size: { width: number; height: number };
			rotation?: number;
			icon: { id: string; iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
		}> = [];
		if (!this._icons) return out;

		const rect = this.container.getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
		const iconScale = this._iconScaleFunction ? this._iconScaleFunction(this.zoom, this.minZoom, this.maxZoom) : 1.0;
		const info = this._icons.getMarkerInfo(iconScale);
		const imageMaxZ = this._imageMaxZoom;

		// Iterate in reverse: top-to-bottom in visual stacking order
		for (let i = info.length - 1; i >= 0; i--) {
			const it = info[i];

			// Convert marker world position to screen position
			const css = Coords.worldToCSS({ x: it.lng, y: it.lat }, this.zoom, { x: this.center.lng, y: this.center.lat }, { x: widthCSS, y: heightCSS }, imageMaxZ);

			// Compute AABB bounds
			const left = css.x - it.anchor.ax;
			const top = css.y - it.anchor.ay;

			// Fast AABB rejection
			if (px < left || px > left + it.w || py < top || py > top + it.h) continue;

			// Alpha mask test for pixel-accurate hit detection
			const mask = this._icons.getMaskInfo?.(it.type) || null;
			if (mask) {
				// Transform to local coords and apply inverse rotation (same as _hitTestMarker)
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

				// Bounds check after rotation
				if (rx < 0 || ry < 0 || rx >= it.w || ry >= it.h) continue;

				// Sample alpha mask
				const mx = Math.max(0, Math.min(mask.w - 1, Math.floor((rx / it.w) * mask.w)));
				const my = Math.max(0, Math.min(mask.h - 1, Math.floor((ry / it.h) * mask.h)));
				const alpha = mask.data[my * mask.w + mx] | 0;
				const THRESH = 32; // ~12.5% opacity threshold
				if (alpha < THRESH) continue;
			}

			// Hit confirmed - add to results (unlike _hitTestMarker, we collect all)
			out.push({
				id: it.id,
				idx: it.index,
				world: { x: it.lng, y: it.lat },
				size: { width: it.w, height: it.h },
				rotation: it.rotation,
				icon: { id: it.type, iconPath: it.icon.iconPath, x2IconPath: it.icon.x2IconPath, width: it.icon.width, height: it.icon.height, anchorX: it.icon.anchorX, anchorY: it.icon.anchorY },
			});
		}
		return out;
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
		if (this._vectorCanvas && (this._vectorCanvas.width !== wPx || this._vectorCanvas.height !== hPx)) {
			this._vectorCanvas.width = wPx;
			this._vectorCanvas.height = hPx;
		}
	}

	private _drawVectors() {
		if (!this._vectorCtx) this._initVectorCanvas();
		if (!this._vectorCanvas || !this._vectorCtx) return;

		this._ensureOverlaySizes();
		const ctx = this._vectorCtx;
		const canvas = this._vectorCanvas;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.save();
		try {
			ctx.scale(this._dpr || 1, this._dpr || 1);
		} catch {}
		if (this._vectors.length) {
			const z = this.zoom;
			const rect = this.container.getBoundingClientRect();
			const viewport = { x: rect.width, y: rect.height };
			const imageMaxZ = this._imageMaxZoom;
			// Subtle zoom-based stroke scaling: ~8% per zoom level, clamped
			const refZoom = 2;
			const zoomScale = Math.max(0.6, Math.min(1.8, 1 + (z - refZoom) * 0.08));
			for (const prim of this._vectors) {
				const style = (prim.style ?? {}) as VectorStyleInternal;
				const baseWeight = style.weight ?? 2;
				ctx.lineWidth = Math.max(1, baseWeight * zoomScale);
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
					const rCss = ((prim.radius as number) / s) * scale;
					begin();
					ctx.arc(css.x, css.y, rCss, 0, Math.PI * 2);
					finishStroke();
					finishFill();
				}
			}
		}
		ctx.restore();

		// Upload to WebGL overlay (drawing happens via IconRenderer z-index callback)
		if (this._vectorOverlay && this._vectors.length) {
			this._vectorOverlay.uploadCanvas(canvas);
		}
	}
}
