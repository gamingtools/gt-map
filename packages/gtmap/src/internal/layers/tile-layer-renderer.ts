/**
 * TileLayerRenderer -- per-layer renderer for tile layers.
 *
 * Wraps its own TileManager, RasterRenderer, and LayerFBO.
 * Implements LayerRendererHandle for integration with LayerRegistry.
 */
import type { SharedRenderCtx } from '../types';
import type { LayerRendererHandle } from './layer-registry';
import type { TileLayerOptions } from '../../api/layers/types';
import type { UpscaleFilterMode } from '../../api/types';

import { TileManager } from '../tiles/tile-manager';
import { RasterRenderer } from './raster';
import { LayerFBO } from '../render/layer-fbo';
import * as Coords from '../coords';

/** Coverage thresholds for tile pyramid rendering */
const COVERAGE = {
	backfill: 0.995,
} as const;

export interface TileLayerRendererDeps {
	getGL(): WebGLRenderingContext;
	getMapSize(): { width: number; height: number };
	getImageMaxZoom(): number;
	debugLog(msg: string): void;
	debugWarn(msg: string, err?: unknown): void;
	requestRender(): void;
	clearScreenCache(): void;
	now(): number;
	getLastInteractAt(): number;
	getInteractionIdleMs(): number;
	isAnimating(): boolean;
	updateViewForSource(opts: { minZoom: number; maxZoom: number; mapSize: { width: number; height: number }; imageMaxZoom: number }): void;
}

export class TileLayerRenderer implements LayerRendererHandle {
	private _deps: TileLayerRendererDeps;
	private _tileMgr: TileManager;
	private _raster: RasterRenderer | null = null;
	private _fbo = new LayerFBO();
	private _upscaleFilter: UpscaleFilterMode = 'linear';

	// Hysteresis for level-wide filter decisions
	private static readonly FILTER_ENTER = 1.02;
	private static readonly FILTER_EXIT = 0.99;
	private _lastFilterMode: 'linear' | 'bicubic' = 'linear';

	constructor(deps: TileLayerRendererDeps, options: TileLayerOptions) {
		this._deps = deps;
		this._tileMgr = new TileManager(
			{
				getGL: deps.getGL,
				getMapSize: deps.getMapSize,
				getImageMaxZoom: deps.getImageMaxZoom,
				debugLog: deps.debugLog,
				requestRender: deps.requestRender,
				now: deps.now,
				getLastInteractAt: deps.getLastInteractAt,
				getInteractionIdleMs: deps.getInteractionIdleMs,
				isAnimating: deps.isAnimating,
				updateViewForSource: deps.updateViewForSource,
			},
			{
				packUrl: options.packUrl,
				tileSize: options.tileSize,
				sourceMaxZoom: options.sourceMaxZoom,
			},
		);
	}

	/** Initialize GL resources and start loading tiles. */
	init(): void {
		this._raster = new RasterRenderer(this._deps.getGL());
		this._tileMgr.init();
	}

	// -- LayerRendererHandle --

	render(sharedCtx: unknown, opacity: number): void {
		const ctx = sharedCtx as SharedRenderCtx;
		const gl = ctx.gl;
		if (!this._raster) return;

		const tileCache = this._tileMgr.cache;
		if (!tileCache) return;

		const loc = ctx.loc;
		const tileSize = this._tileMgr.tileSize;
		const sourceMaxZoom = this._tileMgr.sourceMaxZoom;
		const baseZ = ctx.baseZ;
		const scale = ctx.levelScale;
		const tlWorld = ctx.tlWorld;
		const widthCSS = ctx.widthCSS;
		const heightCSS = ctx.heightCSS;
		const enqueueTile = (z: number, x: number, y: number, priority?: number) => this._tileMgr.enqueue(z, x, y, priority);
		const wantTileKey = (key: string) => this._tileMgr.wantKey(key);

		// Screen cache with scissor clipping to map extent
		if (ctx.useScreenCache && ctx.screenCache) {
			const imgMax = sourceMaxZoom;
			const sLvl = Coords.sFor(imgMax, baseZ);
			const levelW = ctx.mapSize.width / sLvl;
			const levelH = ctx.mapSize.height / sLvl;
			const mapLeftCSS = -tlWorld.x * scale;
			const mapTopCSS = -tlWorld.y * scale;
			const mapRightCSS = (levelW - tlWorld.x) * scale;
			const mapBottomCSS = (levelH - tlWorld.y) * scale;
			const cutLeft = Math.max(0, mapLeftCSS);
			const cutTop = Math.max(0, mapTopCSS);
			const cutRight = Math.min(widthCSS, mapRightCSS);
			const cutBottom = Math.min(heightCSS, mapBottomCSS);
			if (cutRight > cutLeft && cutBottom > cutTop) {
				const scX = Math.max(0, Math.round(cutLeft * ctx.dpr));
				const scY = Math.max(0, Math.round((heightCSS - cutBottom) * ctx.dpr));
				const scW = Math.max(0, Math.round((cutRight - cutLeft) * ctx.dpr));
				const scH = Math.max(0, Math.round((cutBottom - cutTop) * ctx.dpr));
				const prevScissor = gl.isEnabled ? gl.isEnabled(gl.SCISSOR_TEST) : false;
				gl.enable(gl.SCISSOR_TEST);
				gl.scissor(scX, scY, scW, scH);
				ctx.screenCache.draw({ zInt: baseZ, scale, widthCSS, heightCSS, dpr: ctx.dpr, tlWorld }, loc, ctx.prog, ctx.quad, ctx.canvas);
				if (!prevScissor) gl.disable(gl.SCISSOR_TEST);
			}
		}

		// Render tiles into an offscreen FBO when opacity < 1
		const layerAlpha = Math.max(0, Math.min(1, opacity));
		const useFbo = layerAlpha < 1.0 && this._fbo.ensure(gl, ctx.canvas.width, ctx.canvas.height);
		if (useFbo) {
			this._fbo.bind(gl);
		}
		const tileAlpha = useFbo ? 1.0 : layerAlpha;

		const coverage = this._raster.coverage(tileCache, baseZ, tlWorld, scale, widthCSS, heightCSS, ctx.wrapX, tileSize, ctx.mapSize, ctx.maxZoom, sourceMaxZoom);

		const zIntPrev = Math.max(ctx.minZoom, baseZ - 1);

		// Backfill lower LODs if coverage is insufficient
		if (coverage < COVERAGE.backfill && zIntPrev >= ctx.minZoom) {
			for (let lvl = zIntPrev; lvl >= ctx.minZoom; lvl--) {
				const centerL = ctx.project(ctx.center.x, ctx.center.y, lvl);
				const scaleL = Coords.scaleAtLevel(ctx.zoom, lvl);
				let tlL = Coords.tlLevelForWithScale(centerL, scaleL, { x: widthCSS, y: heightCSS });
				const snapL = (v: number) => Coords.snapLevelToDevice(v, scaleL, ctx.dpr);
				tlL = { x: snapL(tlL.x), y: snapL(tlL.y) };
				const covL = this._raster.coverage(tileCache, lvl, tlL, scaleL, widthCSS, heightCSS, ctx.wrapX, tileSize, ctx.mapSize, ctx.maxZoom, sourceMaxZoom);
				gl.uniform1f(loc.u_alpha!, tileAlpha);
				this._raster.drawTilesForLevel(loc, tileCache, enqueueTile, {
					zLevel: lvl,
					tlWorld: tlL,
					scale: scaleL,
					dpr: ctx.dpr,
					widthCSS,
					heightCSS,
					wrapX: ctx.wrapX,
					tileSize,
					mapSize: ctx.mapSize,
					zMax: ctx.maxZoom,
					sourceMaxZoom,
					filterMode: this._resolveFilterMode(scaleL),
					wantTileKey,
				});
				if (covL >= COVERAGE.backfill) break;
			}
		}

		// Draw base level
		gl.uniform1f(loc.u_alpha!, tileAlpha);
		this._raster.drawTilesForLevel(loc, tileCache, enqueueTile, {
			zLevel: baseZ,
			tlWorld,
			scale,
			dpr: ctx.dpr,
			widthCSS,
			heightCSS,
			wrapX: ctx.wrapX,
			tileSize,
			mapSize: ctx.mapSize,
			zMax: ctx.maxZoom,
			sourceMaxZoom,
			filterMode: this._resolveFilterMode(scale),
			wantTileKey,
		});

		// Composite FBO
		if (useFbo) {
			this._fbo.unbindAndComposite(gl, loc, layerAlpha, ctx.canvas.width, ctx.canvas.height);
		}
	}

	dispose(): void {
		this._tileMgr.destroy();
		this._fbo.dispose();
		this._raster = null;
	}

	rebuild(gl: WebGLRenderingContext): void {
		this._raster = new RasterRenderer(gl);
		this._tileMgr.rebuild();
	}

	clearWanted(): void {
		this._tileMgr.clearWanted();
	}

	cancelUnwanted(): void {
		this._tileMgr.cancelUnwanted();
	}

	isIdle(): boolean {
		return this._tileMgr.isIdle();
	}

	setFrame(f: number): void {
		this._tileMgr.frame = f;
	}

	// -- Accessors --

	get tileManager(): TileManager {
		return this._tileMgr;
	}

	get tileSize(): number {
		return this._tileMgr.tileSize;
	}

	get sourceMaxZoom(): number {
		return this._tileMgr.sourceMaxZoom;
	}

	setUpscaleFilter(mode: UpscaleFilterMode): void {
		this._upscaleFilter = mode;
	}

	/** Compute tile coverage for icon unlock decisions. */
	coverage(ctx: SharedRenderCtx): number {
		if (!this._raster) return 0;
		const tileCache = this._tileMgr.cache;
		if (!tileCache) return 0;
		return this._raster.coverage(
			tileCache,
			ctx.baseZ,
			ctx.tlWorld,
			ctx.levelScale,
			ctx.widthCSS,
			ctx.heightCSS,
			ctx.wrapX,
			this._tileMgr.tileSize,
			ctx.mapSize,
			ctx.maxZoom,
			this._tileMgr.sourceMaxZoom,
		);
	}

	// -- Filter mode resolution --

	private _resolveFilterMode(scale: number): 'auto' | 'linear' | 'bicubic' {
		const mode = this._upscaleFilter;
		if (mode === 'linear' || mode === 'bicubic') {
			this._lastFilterMode = mode;
			return mode;
		}
		if (mode === 'auto') {
			const hysteresis = this._levelFilter(scale);
			return hysteresis === 'bicubic' ? 'auto' : 'linear';
		}
		return this._levelFilter(scale);
	}

	private _levelFilter(scale: number): 'linear' | 'bicubic' {
		const enter = TileLayerRenderer.FILTER_ENTER;
		const exit = TileLayerRenderer.FILTER_EXIT;
		if (scale > enter) this._lastFilterMode = 'bicubic';
		else if (scale < exit) this._lastFilterMode = 'linear';
		return this._lastFilterMode;
	}
}
