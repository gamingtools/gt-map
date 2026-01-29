/**
 * LifecycleManager -- orchestrates async multi-step initialization,
 * suspend/resume with optional GL release, and destroy.
 *
 * Owns AsyncInitManager, BackgroundUIManager, Graphics, AutoResizeManager.
 */
import type { WebGLLoseContext, SpinnerOptions as SpinnerOpts } from '../../api/types';
import type { MapContext } from '../context/map-context';
import { GLResources } from '../context/gl-resources';
import Graphics, { type GraphicsHost } from '../gl/graphics';
import { AsyncInitManager, type InitProgress } from '../core/async-init-manager';
import { BackgroundUIManager } from '../core/background-ui';
import AutoResizeManager from '../core/auto-resize-manager';
import { TileManager } from '../tiles/tile-manager';

import { RenderCoordinator } from '../render/render-coordinator';
import { InputManager } from '../input/input-manager';

/**
 * Lightweight GraphicsHost adapter so Graphics can write prog/quad/loc
 * into our GLResources rather than the old god-class fields.
 */
class GLHostAdapter implements GraphicsHost {
	canvas: HTMLCanvasElement;
	gl!: WebGLRenderingContext;
	_screenTexFormat = 0;
	_prog: WebGLProgram | null = null;
	_loc: import('../../api/types').ShaderLocations | null = null;
	_quad: WebGLBuffer | null = null;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
	}

	/** Build a GLResources bundle from what Graphics wrote. */
	toResources(): GLResources {
		return new GLResources(this._prog!, this._quad!, this._loc!, this._screenTexFormat);
	}
}

export class LifecycleManager {
	private ctx: MapContext;
	private _asyncInit: AsyncInitManager;
	private _gfx!: Graphics;
	private _host!: GLHostAdapter;
	private _resizeMgr: AutoResizeManager | null = null;
	private _autoResize: boolean;
	private _resizeDebounceMs = 150;
	private _active = true;
	private _glReleased = false;

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
		this._host = new GLHostAdapter(ctx.canvas);
		this._gfx = new Graphics(this._host);

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

		this._gfx.init(true, [bg.r, bg.g, bg.b, bg.a]);
		// Copy GL context up to MapContext
		ctx.gl = this._host.gl;

		// Prepare loading indicator
		bgUI.ensureSpinnerCss();
		bgUI.createLoadingEl();
	}

	private _initPrograms(): void {
		this._gfx.initPrograms();
		// Build GLResources from what Graphics wrote to the host adapter
		this.ctx.glResources = this._host.toResources();
	}

	private _initRenderers(): void {
		const ctx = this.ctx;

		// Render coordinator -- raster + screen cache
		const coord = new RenderCoordinator(ctx);
		ctx.renderCoordinator = coord;
		coord.initRaster();
		coord.initScreenCache();

		// Content manager -- initialize GL-dependent renderers on the
		// instance created eagerly by MapEngine (so buffered icon defs survive).
		ctx.contentManager!.initRenderers();
	}

	private _initControllers(): void {
		const coord = this.ctx.renderCoordinator!;
		coord.initControllers();
		coord.initRenderer();
	}

	private _initCanvasElements(): void {
		const ctx = this.ctx;
		const coord = ctx.renderCoordinator!;
		const cm = ctx.contentManager!;

		coord.initGridCanvas();
		cm.initVectorLayer();
	}

	private _initEvents(): void {
		const ctx = this.ctx;
		const cm = ctx.contentManager!;
		cm.initHitTesting();

		const im = new InputManager(ctx);
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

		// Initialize tile pipeline
		const tm = new TileManager(ctx);
		ctx.tileManager = tm;
		tm.init();

		ctx.debug.log('ctor: end');
	}

	// ---------------------------------------------------------------
	// Suspend / Resume
	// ---------------------------------------------------------------

	setActive(active: boolean, opts?: { releaseGL?: boolean }): void {
		if (active === this._active && !(active && this._glReleased)) return;
		const ctx = this.ctx;

		if (!active) {
			this._active = false;
			ctx.renderCoordinator?.suspend();
			ctx.inputManager?.detach();

			if (opts?.releaseGL && ctx.gl) {
				try {
					ctx.renderCoordinator?.screenCache?.dispose();
				} catch {}
				try {
					const ext = ctx.gl.getExtension?.('WEBGL_lose_context') as WebGLLoseContext | null;
					ext?.loseContext();
					this._glReleased = true;
				} catch {}
			}
			return;
		}

		// -- Resume --
		if (this._glReleased) {
			try {
				const ext = ctx.gl?.getExtension?.('WEBGL_lose_context') as WebGLLoseContext | null;
				ext?.restoreContext();
			} catch (e) {
				ctx.debug.warn('GL restore context', e);
			}
			try {
				const bg = ctx.bgUI?.getBackground() ?? { r: 0, g: 0, b: 0, a: 0 };
				this._gfx.init(true, [bg.r, bg.g, bg.b, bg.a]);
				ctx.gl = this._host.gl;
			} catch (e) {
				ctx.debug.warn('GL reinit graphics', e);
			}
			try {
				this._gfx.initPrograms();
				ctx.glResources = this._host.toResources();
			} catch (e) {
				ctx.debug.warn('GL reinit programs', e);
			}
			try {
				ctx.renderCoordinator?.rebuildScreenCache();
			} catch (e) {
				ctx.debug.warn('GL reinit screen cache', e);
			}
			try {
				ctx.contentManager?.rebuild();
			} catch (e) {
				ctx.debug.warn('GL reinit content', e);
			}
			try {
				ctx.tileManager?.rebuild();
			} catch (e) {
				ctx.debug.warn('GL reload tiles', e);
			}
			this._glReleased = false;
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

		// Tiles
		try {
			ctx.tileManager?.destroy();
			ctx.tileManager = null;
		} catch {}

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

		// Content (icons, vectors)
		try {
			ctx.contentManager?.dispose();
			ctx.contentManager = null;
		} catch {}

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
