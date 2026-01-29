/**
 * RenderCoordinator -- owns frame loop, render tick, animation stepping,
 * grid overlay, screen cache, and MapRenderer orchestration.
 *
 * Replaces _tick(), _render(), getRenderCtx(), zoom velocity tick, grid
 * drawing, scissor clipping, FPS cap, and screen cache management from mapgl.ts.
 */
import type { RenderCtx } from '../types';
import type { MapContext } from '../context/map-context';
import { FrameLoop } from '../core/frame-loop';
import ZoomController from '../core/zoom-controller';
import PanController from '../core/pan-controller';
import { RasterRenderer } from '../layers/raster';
import { clampCenterWorld as clampCenterWorldCore } from '../core/bounds';
import * as Coords from '../coords';

import MapRenderer from './map-renderer';
import { ScreenCache } from './screen-cache';
import { drawGrid } from './grid';


export class RenderCoordinator {
	private ctx: MapContext;
	private _frameLoop: FrameLoop | null = null;
	private _renderer!: MapRenderer;
	private _raster!: RasterRenderer;
	private _screenCache: ScreenCache | null = null;

	// Zoom
	private _zoomCtrl!: ZoomController;
	private _zoomVel = 0;
	private _wheelAnchor: { px: number; py: number; mode: 'pointer' | 'center' } = { px: 0, py: 0, mode: 'pointer' };
	private zoomDamping = 0.09;
	private maxZoomRate = 12.0;

	// Pan
	private _panCtrl!: PanController;

	// Timing
	private _dt = 0;
	private _lastTS: number | null = null;
	private _frame = 0;
	private _firstRasterDrawAtMs: number | null = null;

	// Grid overlay
	private _gridCanvas: HTMLCanvasElement | null = null;
	private _gridCtx: CanvasRenderingContext2D | null = null;
	private _showGrid = false;

	// Screen cache toggle
	useScreenCache = true;

	// FPS
	private _targetFps = 60;

	// Anchor mode for zoom
	anchorMode: 'pointer' | 'center' = 'pointer';

	// Sticky center anchor hysteresis
	private _stickyCenterAnchor = false;
	private _stickyAnchorUntil = 0;

	constructor(ctx: MapContext) {
		this.ctx = ctx;
		this._targetFps = ctx.config.fpsCap;
		this.useScreenCache = ctx.config.screenCache;
	}

	// -- Init phases --

	initRaster(): void {
		this._raster = new RasterRenderer(this.ctx.gl!);
	}

	initScreenCache(): void {
		const gl = this.ctx.gl!;
		const fmt = this.ctx.glResources?.screenTexFormat ?? gl.RGBA;
		this._screenCache = new ScreenCache(gl, fmt as 6408 | 6407);
	}

	initControllers(): void {
		const ctx = this.ctx;
		const vs = ctx.viewState;

		this._zoomCtrl = new ZoomController({
			getZoom: () => vs.zoom,
			getMinZoom: () => vs.minZoom,
			getMaxZoom: () => vs.maxZoom,
			getImageMaxZoom: () => vs.imageMaxZoom,
			shouldAnchorCenterForZoom: (target) => this._shouldAnchorCenterForZoom(target),
			getContainer: () => ctx.container,
			getBoundsPx: () => vs.maxBoundsPx,
			getBounceAtZoomLimits: () => vs.bounceAtZoomLimits,
			setCenterLngLat: (lng: number, lat: number) => vs.setCenter(lng, lat),
			setZoom: (z: number) => vs.setZoom(z),
			getOutCenterBias: () => ctx.options.outCenterBias,
			clampCenterWorld: (cw, zInt, s, w, h) => clampCenterWorldCore(cw, zInt, s, w, h, vs.wrapX, vs.freePan, vs.mapSize, vs.maxZoom, vs.maxBoundsPx, vs.maxBoundsViscosity, false),
			emit: (name, payload) => ctx.events.emit(name, payload),
			requestRender: () => ctx.requestRender(),
			now: () => ctx.now(),
			getPublicView: () => vs.toPublic(),
		});

		this._panCtrl = new PanController({
			getZoom: () => vs.zoom,
			getImageMaxZoom: () => vs.imageMaxZoom,
			getContainer: () => ctx.container,
			getWrapX: () => vs.wrapX,
			getFreePan: () => vs.freePan,
			getMapSize: () => vs.mapSize,
			getMaxZoom: () => vs.maxZoom,
			getMaxBoundsPx: () => vs.maxBoundsPx,
			getMaxBoundsViscosity: () => vs.maxBoundsViscosity,
			getCenter: () => ({ x: vs.center.lng, y: vs.center.lat }),
			setCenter: (lng: number, lat: number) => vs.setCenter(lng, lat),
			requestRender: () => ctx.requestRender(),
			emit: (name, payload) => ctx.events.emit(name, payload),
			now: () => ctx.now(),
			getPublicView: () => vs.toPublic(),
		});
	}

	initRenderer(): void {
		const ctx = this.ctx;
		this._renderer = new MapRenderer(() => this.buildRenderCtx(), {
			stepAnimation: () => this._zoomCtrl.step(),
			zoomVelocityTick: () => this.zoomVelocityTick(),
			panVelocityTick: () => {
				this._panCtrl.step();
			},
			prefetchNeighbors: (z) => ctx.tileManager?.prefetchNeighbors(z),
			cancelUnwanted: () => ctx.tileManager?.cancelUnwanted(),
			clearWanted: () => ctx.tileManager?.clearWanted(),
		});
	}

	initGridCanvas(): void {
		const c = document.createElement('canvas');
		c.classList.add('gtmap-grid-canvas');
		this._gridCanvas = c;
		c.style.display = 'block';
		c.style.position = 'absolute';
		c.style.left = '0';
		c.style.top = '0';
		c.style.right = '0';
		c.style.bottom = '0';
		c.style.zIndex = '5';
		c.style.pointerEvents = 'none';
		this.ctx.container.appendChild(c);
		this._gridCtx = c.getContext('2d');
		c.style.display = this._showGrid ? 'block' : 'none';
	}

	startFrameLoop(): void {
		this._frameLoop = new FrameLoop(
			() => this._targetFps,
			(now: number, allowRender: boolean) => this.tick(now, allowRender),
		);
		this._frameLoop.start();
	}

	// -- Frame tick --

	private tick(now: number, allowRender: boolean): void {
		this._frame++;
		// Sync frame counter to tile manager
		if (this.ctx.tileManager) this.ctx.tileManager.frame = this._frame;

		if (this._lastTS == null) this._lastTS = now;
		this._dt = (now - this._lastTS) / 1000;
		this._lastTS = now;

		const animating = this._zoomCtrl.isAnimating() || this._panCtrl.isAnimating();
		if (!this.ctx.needsRender && !animating) return;

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
			this.ctx.requestRender();
			return;
		}
		this.render();
		if (!this._zoomCtrl.isAnimating() && !this._panCtrl.isAnimating()) this.ctx.consumeRenderFlag();
	}

	private render(): void {
		const ctx = this.ctx;
		const tR0 = ctx.now();
		const gl = ctx.gl!;
		const vs = ctx.viewState;
		let scissorEnabled = false;

		if (vs.clipToBounds) {
			if (ctx.debug.enabled && this._frame === 1) {
				console.log('[GTMap] clipToBounds enabled, scissor clipping active');
			}
			try {
				gl.clear(gl.COLOR_BUFFER_BIT);
				const rect = ctx.container.getBoundingClientRect();
				const wCSS = rect.width;
				const hCSS = rect.height;
				const dpr = vs.dpr;
				const tl = Coords.worldToCSS({ x: 0, y: 0 }, vs.zoom, { x: vs.center.lng, y: vs.center.lat }, { x: wCSS, y: hCSS }, vs.imageMaxZoom);
				const br = Coords.worldToCSS({ x: vs.mapSize.width, y: vs.mapSize.height }, vs.zoom, { x: vs.center.lng, y: vs.center.lat }, { x: wCSS, y: hCSS }, vs.imageMaxZoom);
				const x0 = Math.max(0, Math.floor(tl.x * dpr));
				const y0 = Math.max(0, Math.floor(tl.y * dpr));
				const x1 = Math.min(ctx.canvas.width, Math.ceil(br.x * dpr));
				const y1 = Math.min(ctx.canvas.height, Math.ceil(br.y * dpr));
				const scissorX = x0;
				const scissorY = ctx.canvas.height - y1;
				const scissorW = Math.max(0, x1 - x0);
				const scissorH = Math.max(0, y1 - y0);
				if (scissorW > 0 && scissorH > 0) {
					gl.enable(gl.SCISSOR_TEST);
					gl.scissor(scissorX, scissorY, scissorW, scissorH);
					scissorEnabled = true;
				}
			} catch {}
		}

		// Upload vector overlay before rendering
		try {
			ctx.contentManager?.drawVectors();
		} catch {}

		this._renderer.render();

		if (scissorEnabled) {
			try {
				gl.disable(gl.SCISSOR_TEST);
			} catch {}
		}

		if (this._firstRasterDrawAtMs == null) {
			if (ctx.debug.gpuWaitEnabled()) {
				try {
					gl.finish();
				} catch {}
			}
			this._firstRasterDrawAtMs = ctx.now();
			const dtRender = this._firstRasterDrawAtMs - tR0;
			ctx.debug.log(`first-render done dtRender=${dtRender.toFixed(1)}ms`);
		}

		// Deferred icon mask build
		ctx.contentManager?.requestMaskBuild();

		// Emit frame event for HUD/diagnostics
		try {
			const t = ctx.now();
			const stats = { frame: this._frame };
			ctx.events.emit('frame', { now: t, stats });
		} catch {}

		// Draw grid overlay
		if (this._showGrid) {
			const rect = ctx.container.getBoundingClientRect();
			const { zInt: baseZ, scale } = Coords.zParts(vs.zoom);
			const widthCSS = rect.width;
			const heightCSS = rect.height;
			const s = Coords.sFor(vs.imageMaxZoom, baseZ);
			const centerLevel = { x: vs.center.lng / s, y: vs.center.lat / s };
			let tlWorld = Coords.tlLevelFor(centerLevel, vs.zoom, { x: widthCSS, y: heightCSS });
			const snap = (v: number) => Coords.snapLevelToDevice(v, scale, vs.dpr);
			tlWorld = { x: snap(tlWorld.x), y: snap(tlWorld.y) };
			const pal = ctx.bgUI?.getGridPalette() ?? { minor: 'rgba(200,200,200,0.3)', major: 'rgba(200,200,200,0.5)', labelBg: 'rgba(0,0,0,0.55)', labelFg: 'rgba(255,255,255,0.9)' };
			drawGrid(this._gridCtx, this._gridCanvas, baseZ, scale, widthCSS, heightCSS, tlWorld, vs.dpr, vs.imageMaxZoom, 256, pal);
		}
	}

	// -- Build RenderCtx --

	buildRenderCtx(): RenderCtx {
		const ctx = this.ctx;
		const vs = ctx.viewState;
		const gl = ctx.gl!;
		const res = ctx.glResources!;
		const tm = ctx.tileManager!;
		const cm = ctx.contentManager;

		return {
			gl,
			prog: res.prog,
			loc: res.loc,
			quad: res.quad,
			canvas: ctx.canvas,
			dpr: vs.dpr,
			container: ctx.container,
			zoom: vs.zoom,
			center: vs.center,
			minZoom: vs.minZoom,
			maxZoom: vs.maxZoom,
			imageMaxZoom: vs.imageMaxZoom,
			mapSize: vs.mapSize,
			wrapX: vs.wrapX,
			useScreenCache: this.useScreenCache,
			screenCache: this._screenCache,
			raster: this._raster,
			rasterOpacity: cm?.rasterOpacity ?? 1.0,
			upscaleFilter: cm?.upscaleFilter ?? 'linear',
			...(cm?.iconScaleFunction !== undefined ? { iconScaleFunction: cm.iconScaleFunction } : {}),
			icons: cm?.icons ?? null,
			isIdle: () => tm.isIdle(),
			project: (x: number, y: number, z: number) => Coords.worldToLevel({ x, y }, vs.imageMaxZoom, Math.floor(z)),
			tileCache: tm.cache,
			tileSize: tm.tileSize,
			sourceMaxZoom: tm.sourceMaxZoom,
			enqueueTile: (z: number, x: number, y: number, priority?: number) => tm.enqueue(z, x, y, priority ?? 0),
			wantTileKey: (key: string) => tm.wantKey(key),
			vectorZIndices: cm?.getVectorZIndices() ?? [],
			drawVectorOverlay: () => { cm?.drawVectorOverlay(); },
		};
	}

	// -- Zoom velocity --

	zoomVelocityTick(): void {
		if (Math.abs(this._zoomVel) <= 1e-4) return;
		const dt = Math.max(0.0005, Math.min(0.1, this._dt || 1 / 60));
		const maxStep = Math.max(0.0001, this.maxZoomRate * dt);
		let step = this._zoomVel * dt;
		step = Math.max(-maxStep, Math.min(maxStep, step));
		const anchor = (this._wheelAnchor?.mode || this.anchorMode) as 'pointer' | 'center';
		const px = this._wheelAnchor?.px ?? 0;
		const py = this._wheelAnchor?.py ?? 0;
		this._zoomCtrl.applyAnchoredZoom(this.ctx.viewState.zoom + step, px, py, anchor);
		const k = Math.exp(-dt / this.zoomDamping);
		this._zoomVel *= k;
		if (Math.abs(this._zoomVel) < 1e-3) this._zoomVel = 0;
	}

	// -- Sticky center anchor --

	private _viewportCoverageRatio(zInt: number, scale: number, widthCSS: number, heightCSS: number): number {
		const vs = this.ctx.viewState;
		const s = Coords.sFor(vs.imageMaxZoom, zInt);
		const levelW = vs.mapSize.width / s;
		const levelH = vs.mapSize.height / s;
		const halfW = widthCSS / (2 * scale);
		const halfH = heightCSS / (2 * scale);
		const covX = halfW / (levelW / 2);
		const covY = halfH / (levelH / 2);
		return Math.max(covX, covY);
	}

	private _shouldAnchorCenterForZoom(targetZoom: number): boolean {
		const vs = this.ctx.viewState;
		if (vs.wrapX) return false;
		const rect = this.ctx.container.getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
		const zClamped = Math.max(vs.minZoom, Math.min(vs.maxZoom, targetZoom));
		const zInt2 = Math.floor(zClamped);
		const s2 = Math.pow(2, zClamped - zInt2);
		const ratio = this._viewportCoverageRatio(zInt2, s2, widthCSS, heightCSS);
		const enter = 0.995;
		const exit = 0.9;
		const now = this.ctx.now();
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

	// -- Public accessors for controllers --

	get zoomController(): ZoomController {
		return this._zoomCtrl;
	}

	get panController(): PanController {
		return this._panCtrl;
	}

	get screenCache(): ScreenCache | null {
		return this._screenCache;
	}

	get raster(): RasterRenderer {
		return this._raster;
	}

	get frame(): number {
		return this._frame;
	}

	isAnimating(): boolean {
		return this._zoomCtrl?.isAnimating() || this._panCtrl?.isAnimating();
	}

	// -- Settings --

	setGridVisible(visible: boolean): void {
		this._showGrid = !!visible;
		if (this._gridCanvas) {
			this._gridCanvas.style.display = this._showGrid ? 'block' : 'none';
			if (!this._showGrid) this._gridCtx?.clearRect(0, 0, this._gridCanvas.width, this._gridCanvas.height);
		}
		this.ctx.requestRender();
	}

	setFpsCap(fps: number): void {
		const v = Math.max(15, Math.min(240, Math.trunc(fps)));
		if (v !== this._targetFps) {
			this._targetFps = v;
			this.ctx.requestRender();
		}
	}

	setScreenCacheEnabled(enabled: boolean): void {
		this.useScreenCache = !!enabled;
		this.ctx.requestRender();
	}

	// -- Resize --

	resize(): void {
		const ctx = this.ctx;
		const vs = ctx.viewState;
		const dpr = Math.max(1, Math.min(globalThis.devicePixelRatio || 1, 3));
		const rect = ctx.container.getBoundingClientRect();
		const cssW = Math.max(1, Math.round(rect.width));
		const cssH = Math.max(1, Math.round(rect.height));
		ctx.canvas.style.width = cssW + 'px';
		ctx.canvas.style.height = cssH + 'px';
		const w = Math.max(1, Math.floor(rect.width * dpr));
		const h = Math.max(1, Math.floor(rect.height * dpr));
		if (ctx.canvas.width !== w || ctx.canvas.height !== h) {
			ctx.canvas.width = w;
			ctx.canvas.height = h;
			vs.dpr = dpr;
			ctx.gl!.viewport(0, 0, w, h);
			ctx.requestRender();
		}
		if (this._gridCanvas) {
			this._gridCanvas.style.width = cssW + 'px';
			this._gridCanvas.style.height = cssH + 'px';
			if (this._gridCanvas.width !== w || this._gridCanvas.height !== h) {
				this._gridCanvas.width = w;
				this._gridCanvas.height = h;
				ctx.requestRender();
			}
		}
		// Resize vector layer
		ctx.contentManager?.resizeVectorLayer?.(w, h);
	}

	// -- Pan helpers --

	startPanBy(dxPx: number, dyPx: number, durSec: number, easing?: (t: number) => number): void {
		this._panCtrl.startBy(dxPx, dyPx, Math.max(0.05, durSec), easing);
	}

	panTo(lng: number, lat: number, durationMs = 500): void {
		const vs = this.ctx.viewState;
		const { zInt, scale } = Coords.zParts(vs.zoom);
		const s0 = Coords.sFor(vs.imageMaxZoom, zInt);
		const cw = { x: vs.center.lng / s0, y: vs.center.lat / s0 };
		const target = { x: lng / s0, y: lat / s0 };
		const dxPx = (cw.x - target.x) * scale;
		const dyPx = (cw.y - target.y) * scale;
		this.startPanBy(dxPx, dyPx, Math.max(0.05, durationMs / 1000));
	}

	flyTo(opts: { lng?: number; lat?: number; zoom?: number; durationMs?: number; easing?: (t: number) => number }): void {
		const durMs = Math.max(0, (opts.durationMs ?? 600) | 0);
		if (Number.isFinite(opts.lng as number) && Number.isFinite(opts.lat as number)) this.panTo(opts.lng as number, opts.lat as number, durMs);
		if (Number.isFinite(opts.zoom as number)) {
			const rect = this.ctx.container.getBoundingClientRect();
			const dz = (opts.zoom as number) - this.ctx.viewState.zoom;
			this._zoomCtrl.startEase(dz, rect.width / 2, rect.height / 2, 'center', opts.easing);
		}
	}

	// -- Lifecycle --

	suspend(): void {
		try {
			this._frameLoop?.stop?.();
		} catch {}
	}

	resume(): void {
		this.ctx.requestRender();
		try {
			this._frameLoop?.start?.();
		} catch {}
	}

	rebuildScreenCache(): void {
		const gl = this.ctx.gl!;
		const fmt = this.ctx.glResources?.screenTexFormat ?? gl.RGBA;
		try {
			this._screenCache = new ScreenCache(gl, fmt as 6408 | 6407);
		} catch (e) {
			this.ctx.debug.warn('GL reinit screen cache', e);
		}
	}

	destroy(): void {
		if (this._frameLoop) {
			try {
				this._frameLoop.stop();
			} catch {}
			this._frameLoop = null;
		}
		try {
			this._renderer?.dispose?.();
		} catch {}
		this._screenCache?.dispose();
		this._screenCache = null;
		if (this._gridCanvas) {
			try {
				this._gridCanvas.remove();
			} catch {}
			this._gridCanvas = null;
			this._gridCtx = null;
		}
	}
}
