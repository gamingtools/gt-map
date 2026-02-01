/**
 * RenderCoordinator -- owns frame loop, render tick, animation stepping,
 * screen cache, and MapRenderer orchestration.
 */
import type { EventMap, UpscaleFilterMode, IconScaleFunction } from '../../api/types';
import type { RenderCtx } from '../types';
import type { ViewStateStore } from '../context/view-state';
import type { GLResources } from '../context/gl-resources';
import type { TileCache } from '../tiles/cache';
import type { IconRenderer } from '../layers/icons';
import { FrameLoop } from '../core/frame-loop';
import ZoomController from '../core/zoom-controller';
import PanController from '../core/pan-controller';
import { RasterRenderer } from '../layers/raster';
import { clampCenterWorld as clampCenterWorldCore } from '../core/bounds';
import * as Coords from '../coords';

import MapRenderer from './map-renderer';
import { ScreenCache } from './screen-cache';
import { GridOverlay } from './grid-overlay';

const FPS_CLAMP = { min: 15, max: 240 } as const;
const DPR_CLAMP = 3;

export interface RenderCoordinatorDeps {
  getGL(): WebGLRenderingContext;
  getGLResources(): GLResources | null;
  getCanvas(): HTMLCanvasElement;
  getContainer(): HTMLDivElement;
  viewState: ViewStateStore;
  getOutCenterBias(): number;
  emit<K extends keyof EventMap>(name: K, payload: EventMap[K]): void;
  getNeedsRender(): boolean;
  requestRender(): void;
  consumeRenderFlag(): boolean;
  now(): number;
  debugWarn(msg: string, err?: unknown): void;
  debugLog(msg: string): void;
  debugEnabled(): boolean;
  debugGpuWaitEnabled(): boolean;
  getGridPalette(): { minor: string; major: string; labelBg: string; labelFg: string };
  // Cross-cutting: tiles (lazy -- TileManager created after RenderCoordinator)
  tiles: {
    cancelUnwanted(): void;
    clearWanted(): void;
    getCache(): TileCache;
    enqueue(z: number, x: number, y: number, priority: number): void;
    wantKey(key: string): void;
    getTileSize(): number;
    getSourceMaxZoom(): number;
    isIdle(): boolean;
    setFrame(f: number): void;
  };
  // Cross-cutting: content
  content: {
    drawVectors(): void;
    drawVectorOverlay(): void;
    requestMaskBuild(): void;
    getIcons(): IconRenderer | null;
    getRasterOpacity(): number;
    getUpscaleFilter(): UpscaleFilterMode;
    getIconScaleFunction(): IconScaleFunction | null;
    getVectorZIndices(): number[];
    resizeVectorLayer(w: number, h: number): void;
  };
}

export class RenderCoordinator {
	private deps: RenderCoordinatorDeps;
	private _frameLoop: FrameLoop | null = null;
	private _renderer!: MapRenderer;
	private _raster!: RasterRenderer;
	private _screenCache: ScreenCache | null = null;

	// Zoom
	private _zoomCtrl!: ZoomController;

	// Pan
	private _panCtrl!: PanController;

	// Timing
	private _lastTS: number | null = null;
	private _frame = 0;
	private _firstRasterDrawAtMs: number | null = null;

	// Grid overlay
	private _grid: GridOverlay | null = null;

	// Screen cache toggle
	useScreenCache = true;

	// FPS
	private _targetFps = 60;

	// Anchor mode for zoom (read by input-manager)
	anchorMode: 'pointer' | 'center' = 'pointer';

	constructor(deps: RenderCoordinatorDeps, config: { fpsCap: number; screenCache: boolean }) {
		this.deps = deps;
		this._targetFps = config.fpsCap;
		this.useScreenCache = config.screenCache;
	}

	// -- Init phases --

	initRaster(): void {
		this._raster = new RasterRenderer(this.deps.getGL());
	}

	initScreenCache(): void {
		const gl = this.deps.getGL();
		const fmt = this.deps.getGLResources()?.screenTexFormat ?? gl.RGBA;
		this._screenCache = new ScreenCache(gl, fmt as 6408 | 6407);
	}

	initControllers(): void {
		const d = this.deps;
		const vs = d.viewState;

		this._zoomCtrl = new ZoomController({
			getZoom: () => vs.zoom,
			getMinZoom: () => vs.minZoom,
			getMaxZoom: () => vs.maxZoom,
			getImageMaxZoom: () => vs.imageMaxZoom,
			getContainer: () => d.getContainer(),
			getMaxBoundsPx: () => vs.maxBoundsPx,
			getBounceAtZoomLimits: () => vs.bounceAtZoomLimits,
			setCenter: (x: number, y: number) => vs.setCenter(x, y),
			setZoom: (z: number) => vs.setZoom(z),
			getOutCenterBias: () => d.getOutCenterBias(),
			clampCenterWorld: (cw, zInt, s, w, h) => clampCenterWorldCore(cw, zInt, s, w, h, vs.wrapX, vs.freePan, vs.mapSize, vs.maxZoom, vs.maxBoundsPx, vs.maxBoundsViscosity, false),
			emit: (name, payload) => d.emit(name, payload),
			requestRender: () => d.requestRender(),
			now: () => d.now(),
			getPublicView: () => vs.toPublic(),
		});

		this._panCtrl = new PanController({
			getZoom: () => vs.zoom,
			getImageMaxZoom: () => vs.imageMaxZoom,
			getContainer: () => d.getContainer(),
			getWrapX: () => vs.wrapX,
			getFreePan: () => vs.freePan,
			getMapSize: () => vs.mapSize,
			getMaxZoom: () => vs.maxZoom,
			getMaxBoundsPx: () => vs.maxBoundsPx,
			getMaxBoundsViscosity: () => vs.maxBoundsViscosity,
			getCenter: () => ({ x: vs.center.x, y: vs.center.y }),
			setCenter: (x: number, y: number) => vs.setCenter(x, y),
			requestRender: () => d.requestRender(),
			emit: (name, payload) => d.emit(name, payload),
			now: () => d.now(),
			getPublicView: () => vs.toPublic(),
		});
	}

	initRenderer(): void {
		const d = this.deps;
		this._renderer = new MapRenderer(() => this.buildRenderCtx(), {
			stepAnimation: () => this._zoomCtrl.step(),
			panVelocityTick: () => {
				this._panCtrl.step();
			},
			cancelUnwanted: () => d.tiles.cancelUnwanted(),
			clearWanted: () => d.tiles.clearWanted(),
		});
	}

	initGridCanvas(): void {
		const d = this.deps;
		const vs = d.viewState;
		this._grid = new GridOverlay({
			getContainer: () => d.getContainer(),
			getZoom: () => vs.zoom,
			getCenter: () => ({ x: vs.center.x, y: vs.center.y }),
			getImageMaxZoom: () => vs.imageMaxZoom,
			getMinZoom: () => vs.minZoom,
			getMapSize: () => vs.mapSize,
			getTileSize: () => d.tiles.getTileSize(),
			getDpr: () => vs.dpr,
			getZoomSnapThreshold: () => vs.zoomSnapThreshold,
			getGridPalette: () => d.getGridPalette(),
			requestRender: () => d.requestRender(),
		});
		this._grid.init();
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
		this.deps.tiles.setFrame(this._frame);

		if (this._lastTS == null) this._lastTS = now;
		this._lastTS = now;

		const animating = this._zoomCtrl.isAnimating() || this._panCtrl.isAnimating();
		if (!this.deps.getNeedsRender() && !animating) return;

		if (!allowRender) {
			try {
				this._zoomCtrl.step();
			} catch (e) { this.deps.debugWarn('zoom step (throttled)', e); }
			try {
				this._panCtrl.step();
			} catch (e) { this.deps.debugWarn('pan step (throttled)', e); }
			this.deps.requestRender();
			return;
		}
		this.render();
		if (!this._zoomCtrl.isAnimating() && !this._panCtrl.isAnimating()) this.deps.consumeRenderFlag();
	}

	private render(): void {
		const d = this.deps;
		const tR0 = d.now();
		const gl = d.getGL();
		const vs = d.viewState;
		const canvas = d.getCanvas();
		let scissorEnabled = false;

		if (vs.clipToBounds) {
			if (d.debugEnabled() && this._frame === 1) {
				console.log('[GTMap] clipToBounds enabled, scissor clipping active');
			}
			try {
				gl.clear(gl.COLOR_BUFFER_BIT);
				const rect = d.getContainer().getBoundingClientRect();
				const wCSS = rect.width;
				const hCSS = rect.height;
				const dpr = vs.dpr;
				const tl = Coords.worldToCSS({ x: 0, y: 0 }, vs.zoom, { x: vs.center.x, y: vs.center.y }, { x: wCSS, y: hCSS }, vs.imageMaxZoom);
				const br = Coords.worldToCSS({ x: vs.mapSize.width, y: vs.mapSize.height }, vs.zoom, { x: vs.center.x, y: vs.center.y }, { x: wCSS, y: hCSS }, vs.imageMaxZoom);
				const x0 = Math.max(0, Math.floor(tl.x * dpr));
				const y0 = Math.max(0, Math.floor(tl.y * dpr));
				const x1 = Math.min(canvas.width, Math.ceil(br.x * dpr));
				const y1 = Math.min(canvas.height, Math.ceil(br.y * dpr));
				const scissorX = x0;
				const scissorY = canvas.height - y1;
				const scissorW = Math.max(0, x1 - x0);
				const scissorH = Math.max(0, y1 - y0);
				if (scissorW > 0 && scissorH > 0) {
					gl.enable(gl.SCISSOR_TEST);
					gl.scissor(scissorX, scissorY, scissorW, scissorH);
					scissorEnabled = true;
				}
			} catch (e) { d.debugWarn('scissor setup', e); }
		}

		// Upload vector overlay before rendering
		try {
			d.content.drawVectors();
		} catch (e) { d.debugWarn('drawVectors', e); }

		this._renderer.render();

		if (scissorEnabled) {
			try {
				gl.disable(gl.SCISSOR_TEST);
			} catch { /* expected: GL context may be lost */ }
		}

		if (this._firstRasterDrawAtMs == null) {
			if (d.debugGpuWaitEnabled()) {
				try {
					gl.finish();
				} catch { /* expected: GL context may be lost */ }
			}
			this._firstRasterDrawAtMs = d.now();
			const dtRender = this._firstRasterDrawAtMs - tR0;
			d.debugLog(`first-render done dtRender=${dtRender.toFixed(1)}ms`);
		}

		// Deferred icon mask build
		d.content.requestMaskBuild();

		// Emit frame event for HUD/diagnostics
		try {
			const t = d.now();
			const stats = { frame: this._frame };
			d.emit('frame', { now: t, stats });
		} catch { /* expected: user event handler may throw */ }

		// Draw grid overlay
		this._grid?.draw();
	}

	// -- Build RenderCtx --

	buildRenderCtx(): RenderCtx {
		const d = this.deps;
		const vs = d.viewState;
		const gl = d.getGL();
		const res = d.getGLResources()!;
		const tiles = d.tiles;
		const content = d.content;

		const iconScaleFunction = content.getIconScaleFunction();

		return {
			gl,
			prog: res.prog,
			loc: res.loc,
			quad: res.quad,
			canvas: d.getCanvas(),
			dpr: vs.dpr,
			container: d.getContainer(),
			zoom: vs.zoom,
			center: vs.center,
			minZoom: vs.minZoom,
			maxZoom: vs.maxZoom,
			imageMaxZoom: vs.imageMaxZoom,
			mapSize: vs.mapSize,
			wrapX: vs.wrapX,
			zoomSnapThreshold: vs.zoomSnapThreshold,
			useScreenCache: this.useScreenCache,
			screenCache: this._screenCache,
			raster: this._raster,
			rasterOpacity: content.getRasterOpacity(),
			upscaleFilter: content.getUpscaleFilter(),
			...(iconScaleFunction !== undefined ? { iconScaleFunction } : {}),
			icons: content.getIcons(),
			isIdle: () => tiles.isIdle(),
			project: (x: number, y: number, z: number) => Coords.worldToLevel({ x, y }, vs.imageMaxZoom, Math.floor(z)),
			tileCache: tiles.getCache(),
			tileSize: tiles.getTileSize(),
			sourceMaxZoom: tiles.getSourceMaxZoom(),
			enqueueTile: (z: number, x: number, y: number, priority?: number) => tiles.enqueue(z, x, y, priority ?? 0),
			wantTileKey: (key: string) => tiles.wantKey(key),
			vectorZIndices: content.getVectorZIndices(),
			drawVectorOverlay: () => { content.drawVectorOverlay(); },
		};
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
		this._grid?.setVisible(visible);
	}

	setFpsCap(fps: number): void {
		const v = Math.max(FPS_CLAMP.min, Math.min(FPS_CLAMP.max, Math.trunc(fps)));
		if (v !== this._targetFps) {
			this._targetFps = v;
			this.deps.requestRender();
		}
	}

	setScreenCacheEnabled(enabled: boolean): void {
		this.useScreenCache = !!enabled;
		this.deps.requestRender();
	}

	// -- Resize --

	resize(): void {
		const d = this.deps;
		const vs = d.viewState;
		const canvas = d.getCanvas();
		const dpr = Math.max(1, Math.min(globalThis.devicePixelRatio || 1, DPR_CLAMP));
		const rect = d.getContainer().getBoundingClientRect();
		const cssW = Math.max(1, Math.round(rect.width));
		const cssH = Math.max(1, Math.round(rect.height));
		canvas.style.width = cssW + 'px';
		canvas.style.height = cssH + 'px';
		const w = Math.max(1, Math.floor(rect.width * dpr));
		const h = Math.max(1, Math.floor(rect.height * dpr));
		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
			vs.dpr = dpr;
			d.getGL().viewport(0, 0, w, h);
			d.requestRender();
		}
		this._grid?.resize(w, h, cssW, cssH);
		// Resize vector layer
		d.content.resizeVectorLayer(w, h);
	}

	// -- Pan helpers --

	startPanBy(dxPx: number, dyPx: number, durSec: number, easing?: (t: number) => number): void {
		this._panCtrl.startBy(dxPx, dyPx, Math.max(0.05, durSec), easing);
	}

	panTo(x: number, y: number, durationMs = 500): void {
		const vs = this.deps.viewState;
		const { zInt, scale } = Coords.zParts(vs.zoom);
		const s0 = Coords.sFor(vs.imageMaxZoom, zInt);
		const cw = { x: vs.center.x / s0, y: vs.center.y / s0 };
		const target = { x: x / s0, y: y / s0 };
		const dxPx = (cw.x - target.x) * scale;
		const dyPx = (cw.y - target.y) * scale;
		this.startPanBy(dxPx, dyPx, Math.max(0.05, durationMs / 1000));
	}

	flyTo(opts: { x?: number; y?: number; zoom?: number; durationMs?: number; easing?: (t: number) => number }): void {
		const durMs = Math.max(0, (opts.durationMs ?? 600) | 0);
		if (Number.isFinite(opts.x as number) && Number.isFinite(opts.y as number)) this.panTo(opts.x as number, opts.y as number, durMs);
		if (Number.isFinite(opts.zoom as number)) {
			const rect = this.deps.getContainer().getBoundingClientRect();
			const dz = (opts.zoom as number) - this.deps.viewState.zoom;
			this._zoomCtrl.startEase(dz, rect.width / 2, rect.height / 2, 'center', opts.easing);
		}
	}

	// -- Lifecycle --

	suspend(): void {
		try {
			this._frameLoop?.stop?.();
		} catch { /* expected: frame loop may already be stopped */ }
	}

	resume(): void {
		this.deps.requestRender();
		try {
			this._frameLoop?.start?.();
		} catch { /* expected: frame loop may not be initialized */ }
	}

	rebuildScreenCache(): void {
		const gl = this.deps.getGL();
		const fmt = this.deps.getGLResources()?.screenTexFormat ?? gl.RGBA;
		try {
			this._screenCache = new ScreenCache(gl, fmt as 6408 | 6407);
		} catch (e) {
			this.deps.debugWarn('GL reinit screen cache', e);
		}
	}

	destroy(): void {
		if (this._frameLoop) {
			try {
				this._frameLoop.stop();
			} catch { /* expected: frame loop may already be stopped */ }
			this._frameLoop = null;
		}
		try {
			this._renderer?.dispose?.();
		} catch { /* expected: renderer may already be disposed */ }
		this._screenCache?.dispose();
		this._screenCache = null;
		this._grid?.dispose();
		this._grid = null;
	}
}
