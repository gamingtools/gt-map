/**
 * LifecycleManager -- orchestrates async multi-step initialization,
 * suspend/resume with optional GL release, and destroy.
 *
 * Owns AsyncInitManager, BackgroundUIManager, GLManager, AutoResizeManager.
 */
import type { SpinnerOptions as SpinnerOpts } from '../../api/types';
import type { MapContext } from '../context/map-context';
import { AsyncInitManager, type InitProgress } from '../core/async-init-manager';
import { BackgroundUIManager } from '../core/background-ui';
import AutoResizeManager from '../core/auto-resize-manager';
import { GLManager } from './gl-manager';

import { RenderCoordinator } from '../render/render-coordinator';
import { InputManager } from '../input/input-manager';
import { LayerHitTester } from '../events/layer-hit-tester';

export class LifecycleManager {
	private ctx: MapContext;
	private _asyncInit: AsyncInitManager;
	private _glMgr!: GLManager;
	private _resizeMgr: AutoResizeManager | null = null;
	private _autoResize: boolean;
	private _resizeDebounceMs = 150;
	private _active = true;

	// Pending background color (may be set before init completes)
	private _pendingBackgroundColor: string | { r: number; g: number; b: number; a?: number } | null = null;

	constructor(ctx: MapContext) {
		this.ctx = ctx;
		this._asyncInit = new AsyncInitManager();
		this._autoResize = ctx.config.autoResize;
	}

	// ---------------------------------------------------------------
	// Async initialization -- mirrors the 9-step sequence from mapgl.ts
	// ---------------------------------------------------------------

	async init(): Promise<void> {
		const ctx = this.ctx;
		const config = ctx.config;

		// Initialize options from config
		const zoomBias = (config as { zoomOutCenterBias?: number | boolean }).zoomOutCenterBias;
		const wheelSpeed = (config as { wheelSpeedCtrl?: number }).wheelSpeedCtrl;
		ctx.options.initFromOptions({
			...(zoomBias !== undefined ? { zoomOutCenterBias: zoomBias } : {}),
			...(wheelSpeed !== undefined ? { wheelSpeedCtrl: wheelSpeed } : {}),
		});

		this._asyncInit.addSteps([
			{
				name: 'Initialize Canvas',
				execute: () => this._initCanvas(),
				weight: 1,
			},
			{
				name: 'Initialize Graphics',
				execute: () => this._initGraphics(config),
				weight: 3,
			},
			{
				name: 'Initialize Programs',
				execute: () => this._initPrograms(),
				weight: 2,
			},
			{
				name: 'Initialize Renderers',
				execute: () => this._initRenderers(),
				weight: 3,
			},
			{
				name: 'Initialize Controllers',
				execute: () => this._initControllers(),
				weight: 4,
			},
			{
				name: 'Initialize Canvas Elements',
				execute: () => this._initCanvasElements(),
				weight: 2,
			},
			{
				name: 'Initial Resize',
				execute: () => ctx.renderCoordinator!.resize(),
				weight: 1,
			},
			{
				name: 'Initialize Events',
				execute: () => this._initEvents(),
				weight: 2,
			},
			{
				name: 'Start Frame Loop',
				execute: () => ctx.renderCoordinator!.startFrameLoop(),
				weight: 1,
			},
		]);

		try {
			await this._asyncInit.initialize({
				yieldAfterMs: 16,
				onProgress: (progress: InitProgress) => {
					ctx.debug.log(`init:progress step=${progress.step} ${progress.percentage}% (${progress.completed}/${progress.total})`);
				},
				onComplete: () => {
					ctx.debug.log('init:complete - async initialization finished');
					this._finalize();
				},
				onError: (error: Error) => {
					ctx.debug.log(`init:error ${error.message}`);
					console.error('[GTMap] Async initialization failed:', error);
				},
			});
		} catch (error) {
			ctx.debug.log(`init:fatal-error ${error}`);
			console.error('[GTMap] Fatal initialization error:', error);
		}
	}

	// -- Step implementations --

	private _initCanvas(): void {
		const ctx = this.ctx;
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
		// Ensure container behaves as a viewport
		try {
			const cs = ctx.container.style as CSSStyleDeclaration;
			if (!cs.position) cs.position = 'relative';
			cs.overflow = 'hidden';
		} catch {}
		ctx.container.appendChild(canvas);
		ctx.canvas = canvas;
	}

	private _initGraphics(config: MapContext['config']): void {
		const ctx = this.ctx;
		this._glMgr = new GLManager(ctx.canvas);

		// BackgroundUI
		const bgUI = new BackgroundUIManager({
			getContainer: () => ctx.container,
			getCanvas: () => ctx.canvas,
		});
		ctx.bgUI = bgUI;
		if (config.spinner) {
			bgUI.setSpinnerOptions(config.spinner as SpinnerOpts);
		}
		// Apply pending or initial background color
		const bgColor = this._pendingBackgroundColor ?? config.backgroundColor;
		this._pendingBackgroundColor = null;
		bgUI.parseBackground(bgColor);
		const bg = bgUI.getBackground();

		ctx.gl = this._glMgr.initContext([bg.r, bg.g, bg.b, bg.a]);

		// Prepare loading indicator
		bgUI.ensureSpinnerCss();
		bgUI.createLoadingEl();
	}

	private _initPrograms(): void {
		this.ctx.glResources = this._glMgr.initPrograms();
	}

	private _initRenderers(): void {
		const ctx = this.ctx;
		const vs = ctx.viewState;

		// Render coordinator -- screen cache + layer registry
		const coord = new RenderCoordinator(
			{
				getGL: () => ctx.gl!,
				getGLResources: () => ctx.glResources,
				getCanvas: () => ctx.canvas,
				getContainer: () => ctx.container,
				viewState: vs,
				getOutCenterBias: () => ctx.options.outCenterBias,
				emit: (name, payload) => ctx.events.emit(name, payload),
				getNeedsRender: () => ctx.needsRender,
				requestRender: () => ctx.requestRender(),
				consumeRenderFlag: () => ctx.consumeRenderFlag(),
				now: () => ctx.now(),
				debugWarn: (msg, err) => ctx.debug.warn(msg, err),
				debugLog: (msg) => ctx.debug.log(msg),
				debugEnabled: () => ctx.debug.enabled,
				debugGpuWaitEnabled: () => ctx.debug.gpuWaitEnabled(),
				getGridPalette: () => ctx.bgUI?.getGridPalette() ?? { minor: 'rgba(200,200,200,0.3)', major: 'rgba(200,200,200,0.5)', labelBg: 'rgba(0,0,0,0.55)', labelFg: 'rgba(255,255,255,0.9)' },
				getGridTileSize: () => {
					if (ctx.layerRegistry) {
						for (const entry of ctx.layerRegistry.entries()) {
							if (entry.layer.type === 'tile' && entry.renderer) return (entry.renderer as unknown as { tileSize: number }).tileSize;
						}
					}
					return 256;
				},
			},
			{ fpsCap: ctx.config.fpsCap, screenCache: ctx.config.screenCache },
		);
		ctx.renderCoordinator = coord;
		coord.initScreenCache();

		// Wire layer registry for user-created layers
		if (ctx.layerRegistry) {
			coord.setLayerRegistry(ctx.layerRegistry);
		}
	}

	private _initControllers(): void {
		const coord = this.ctx.renderCoordinator!;
		coord.initControllers();
		coord.initRenderer();
	}

	private _initCanvasElements(): void {
		const coord = this.ctx.renderCoordinator!;
		coord.initGridCanvas();
	}

	private _initEvents(): void {
		const ctx = this.ctx;
		const vs = ctx.viewState;
		const coord = ctx.renderCoordinator!;

		// LayerHitTester coordinates hit testing across all interactive layers
		const hitTester = new LayerHitTester({ layerRegistry: ctx.layerRegistry! });

		const im = new InputManager({
			getContainer: () => ctx.container,
			getCanvas: () => ctx.canvas,
			events: ctx.events,
			getZoom: () => vs.zoom,
			getMaxZoom: () => vs.maxZoom,
			getImageMaxZoom: () => vs.imageMaxZoom,
			getMapSize: () => vs.mapSize,
			getWrapX: () => vs.wrapX,
			getFreePan: () => vs.freePan,
			getMaxBoundsPx: () => vs.maxBoundsPx,
			getMaxBoundsViscosity: () => vs.maxBoundsViscosity,
			getView: () => vs.toPublic(),
			setCenter: (x, y) => vs.setCenter(x, y),
			setZoom: (z) => vs.setZoom(z),
			requestRender: () => ctx.requestRender(),
			now: () => ctx.now(),
			debugWarn: (msg, err) => ctx.debug.warn(msg, err),
			updatePointerAbs: (x, y) => {
				if (Number.isFinite(x as number) && Number.isFinite(y as number)) ctx.pointerAbs = { x: x as number, y: y as number };
				else ctx.pointerAbs = null;
			},
			setLastInteractAt: (t) => {
				ctx.lastInteractAt = t;
			},
			getLastInteractAt: () => ctx.lastInteractAt,
			getAnchorMode: () => coord.anchorMode,
			getWheelStep: (ctrl) => ctx.options.getWheelStep(ctrl),
			startEase: (dz, px, py, anchor) => coord.zoomController.startEase(dz, px, py, anchor),
			cancelZoomAnim: () => coord.zoomController.cancel(),
			applyAnchoredZoom: (targetZoom, px, py, anchor) => coord.zoomController.applyAnchoredZoom(targetZoom, px, py, anchor),
			getInertia: () => ctx.options.inertia,
			getInertiaDecel: () => ctx.options.inertiaDeceleration,
			getInertiaMaxSpeed: () => ctx.options.inertiaMaxSpeed,
			getEaseLinearity: () => ctx.options.easeLinearity,
			startPanBy: (dxPx, dyPx, durSec) => coord.startPanBy(dxPx, dyPx, durSec),
			cancelPanAnim: () => coord.panController.cancel(),
			isAnimating: () => coord.isAnimating(),
			hitTestMarker: (px, py, alpha) => hitTester.hitTest(px, py, alpha),
			computeMarkerHits: (px, py) => hitTester.computeHits(px, py),
			emitMarker: (name, payload) => hitTester.emitMarker(name, payload),
			getLastHover: () => hitTester.getLastHover(),
			setLastHover: (h) => hitTester.setLastHover(h),
			getMarkerDataById: (id) => hitTester.getMarkerDataById(id),
			getClusterForMarkerId: (id) => hitTester.getClusterForMarkerId(id),
		});
		ctx.inputManager = im;
		im.init();
	}

	// -- Finalization (post-init) --

	private _finalize(): void {
		const ctx = this.ctx;

		// Emit 'load' event
		try {
			const emitLoad = () => {
				const rect = ctx.container.getBoundingClientRect();
				const cssW = Math.max(1, Math.round(rect.width));
				const cssH = Math.max(1, Math.round(rect.height));
				const dpr = ctx.viewState.dpr || (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1);
				ctx.events.emit('load', { view: ctx.viewState.toPublic(), size: { width: cssW, height: cssH, dpr } });
			};
			if (typeof requestAnimationFrame === 'function') requestAnimationFrame(emitLoad);
			else setTimeout(emitLoad, 0);
		} catch {}

		// Auto-resize
		if (this._autoResize) {
			const attach = () => {
				this._resizeMgr = new AutoResizeManager({
					getContainer: () => ctx.container,
					onResize: () => ctx.renderCoordinator?.resize(),
					getDebounceMs: () => this._resizeDebounceMs,
				});
				this._resizeMgr.attach();
			};
			if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(attach));
			else setTimeout(attach, 0);
		}

		// Initialize any layer renderers that were queued before GL was ready
		if (ctx.layerRegistry) {
			for (const entry of ctx.layerRegistry.entries()) {
				if (entry.renderer) {
					try {
						(entry.renderer as { init?: () => void }).init?.();
					} catch (e) {
						ctx.debug.warn('layer renderer init', e);
					}
				}
			}
		}

		ctx.debug.log('ctor: end');
	}

	// ---------------------------------------------------------------
	// Suspend / Resume
	// ---------------------------------------------------------------

	setActive(active: boolean, opts?: { releaseGL?: boolean }): void {
		const glReleased = this._glMgr?.glReleased ?? false;
		if (active === this._active && !(active && glReleased)) return;
		const ctx = this.ctx;

		if (!active) {
			this._active = false;
			ctx.renderCoordinator?.suspend();
			ctx.inputManager?.detach();

			if (opts?.releaseGL && ctx.gl) {
				try {
					ctx.renderCoordinator?.screenCache?.dispose();
				} catch {}
				this._glMgr.releaseContext(ctx.gl);
			}
			return;
		}

		// -- Resume --
		if (glReleased) {
			const bg = ctx.bgUI?.getBackground() ?? { r: 0, g: 0, b: 0, a: 0 };
			const result = this._glMgr.reinit(ctx.gl ?? null, [bg.r, bg.g, bg.b, bg.a], (msg, err) => ctx.debug.warn(msg, err));
			ctx.gl = result.gl;
			ctx.glResources = result.glResources;

			try {
				ctx.renderCoordinator?.rebuildScreenCache();
			} catch (e) {
				ctx.debug.warn('GL reinit screen cache', e);
			}
			// Rebuild user-created layer renderers
			if (ctx.layerRegistry) {
				for (const entry of ctx.layerRegistry.entries()) {
					try {
						entry.renderer?.rebuild?.(ctx.gl!);
					} catch (e) {
						ctx.debug.warn('GL reinit layer', e);
					}
				}
			}
		}

		ctx.inputManager?.attach();
		this._active = true;
		ctx.requestRender();
		ctx.renderCoordinator?.resume();
	}

	// ---------------------------------------------------------------
	// Background color
	// ---------------------------------------------------------------

	setBackgroundColor(color: string | { r: number; g: number; b: number; a?: number }): void {
		const ctx = this.ctx;
		if (!ctx.bgUI) {
			// Queue for after init
			this._pendingBackgroundColor = color;
			return;
		}
		ctx.bgUI.parseBackground(color);
		try {
			const bg = ctx.bgUI.getBackground();
			ctx.gl?.clearColor(bg.r, bg.g, bg.b, bg.a);
		} catch {}
		ctx.requestRender();
	}

	// ---------------------------------------------------------------
	// Auto-resize
	// ---------------------------------------------------------------

	setAutoResize(on: boolean): void {
		const v = !!on;
		if (v === this._autoResize) return;
		this._autoResize = v;
		if (v) {
			this._resizeMgr = new AutoResizeManager({
				getContainer: () => this.ctx.container,
				onResize: () => this.ctx.renderCoordinator?.resize(),
				getDebounceMs: () => this._resizeDebounceMs,
			});
			this._resizeMgr.attach();
		} else {
			this._resizeMgr?.detach();
			this._resizeMgr = null;
		}
	}

	// ---------------------------------------------------------------
	// Destroy
	// ---------------------------------------------------------------

	destroy(): void {
		const ctx = this.ctx;

		// Auto-resize
		try {
			this._resizeMgr?.detach();
			this._resizeMgr = null;
		} catch {}

		// Frame loop + render
		try {
			ctx.renderCoordinator?.destroy();
		} catch {}

		// Input
		try {
			ctx.inputManager?.dispose();
			ctx.inputManager = null;
		} catch {}

		// GL resources
		const gl = ctx.gl;
		if (gl && ctx.glResources) {
			try {
				ctx.glResources.dispose(gl);
			} catch {}
			ctx.glResources = null;
		}

		// Canvas
		try {
			ctx.canvas?.remove();
		} catch {}

		// Background UI
		try {
			ctx.bgUI?.dispose();
			ctx.bgUI = null;
		} catch {}
	}
}
