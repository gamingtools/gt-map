/**
 * TileManager -- owns the tile pipeline lifecycle.
 *
 * Manages TileCache, TileLoader, TilePipeline, URL templating, pending/inflight
 * tracking. Extracted from mapgl.ts _initTilePipeline + tile state fields.
 */
import type { TileDeps } from '../types';
import type { MapContext } from '../context/map-context';

import { TileCache } from './cache';
import { TileLoader, type TileLoaderDeps } from './loader';
import TilePipeline from './tile-pipeline';
import { GtpkReader } from './gtpk-reader';

export class TileManager {
	private ctx: MapContext;
	private _cache: TileCache | null = null;
	private _loader: TileLoader | null = null;
	private _pipeline: TilePipeline | null = null;

	private _pendingTiles = new Set<string>();
	private _inflightCount = 0;
	private _wantedKeys = new Set<string>();

	private _tileUrl: string;
	private _packUrl: string | undefined;
	private _packReader: GtpkReader | null = null;
	private _tileSize: number;
	private _sourceMaxZoom: number;
	private _maxInflightLoads = 6;
	private _maxTiles = 256;
	useImageBitmap = typeof createImageBitmap === 'function';

	// Frame counter (shared with render coordinator)
	frame = 0;

	constructor(ctx: MapContext) {
		this.ctx = ctx;
		this._tileUrl = ctx.config.tiles.url;
		this._packUrl = ctx.config.tiles.packUrl;
		this._tileSize = ctx.config.tiles.tileSize;
		this._sourceMaxZoom = ctx.config.tiles.sourceMaxZoom;
	}

	init(): void {
		const ctx = this.ctx;
		const gl = ctx.gl!;
		this._cache = new TileCache(gl, this._maxTiles);

		const tileDeps: TileDeps = {
			hasTile: (key: string) => {
				const rec = this._cache?.get(key);
				return !!rec && (rec.status === 'ready' || rec.status === 'error');
			},
			isPending: (key: string) => this._pendingTiles.has(key),
			urlFor: (z: number, x: number, y: number) => this.urlFor(z, x, y),
			hasCapacity: () => {
				// Block tile dispatch while the GTPK pack is still loading
				if (this._packReader && !this._packReader.ready && !this._packReader.error) return false;
				const max = this.isMoving() ? Math.max(1, this._maxInflightLoads >> 1) : this._maxInflightLoads;
				return this._inflightCount < max;
			},
			isMoving: () => this.isMoving(),
			now: () => ctx.now(),
			getInteractionIdleMs: () => ctx.options.interactionIdleMs,
			getLastInteractAt: () => ctx.lastInteractAt,
			getZoom: () => ctx.viewState.zoom,
			getMaxZoom: () => ctx.viewState.maxZoom,
			getImageMaxZoom: () => ctx.viewState.imageMaxZoom,
			getCenter: () => ctx.viewState.center,
			getTileSize: () => this._tileSize,
			getMapSize: () => ctx.viewState.mapSize,
			getWrapX: () => ctx.viewState.wrapX,
			getViewportSizeCSS: () => {
				const rect = ctx.container.getBoundingClientRect();
				return { width: rect.width, height: rect.height };
			},
			startImageLoad: (task) => this._loader?.start({ key: task.key, url: task.url }),
			addPinned: (key: string) => this._cache?.pin(key),
		};
		this._pipeline = new TilePipeline(tileDeps);

		const loaderDeps: TileLoaderDeps = {
			addPending: (key: string) => this._pendingTiles.add(key),
			removePending: (key: string) => this._pendingTiles.delete(key),
			incInflight: () => {
				this._inflightCount++;
			},
			decInflight: () => {
				this._inflightCount = Math.max(0, this._inflightCount - 1);
			},
			setLoading: (key: string) => this._cache?.setLoading(key),
			setError: (key: string) => this._cache?.setError(key),
			setReady: (key: string, tex: WebGLTexture, w: number, h: number, frame: number) => {
				this._cache?.setReady(key, tex, w, h, frame);
			},
			getGL: () => ctx.gl!,
			getFrame: () => this.frame,
			requestRender: () => ctx.requestRender(),
			getUseImageBitmap: () => this.useImageBitmap,
			setUseImageBitmap: (v: boolean) => {
				this.useImageBitmap = v;
			},
			acquireTexture: () => this._cache?.acquireTexture() ?? null,
			isTileReady: (key: string, tex: WebGLTexture) => this._cache?.isTileReady(key, tex) ?? false,
			isMoving: () => this.isMoving(),
			isIdle: () => this.isIdle(),
			log: (msg: string) => ctx.debug.log(msg),
			getPackReader: () => this._packReader,
		};
		this._loader = new TileLoader(loaderDeps);

		// Start loading GTPK pack if configured
		if (this._packUrl) {
			this._packReader = new GtpkReader();
			const packUrl = this._packUrl;
			this._packReader.load(packUrl).then(() => {
				ctx.debug.log(`gtpk: loaded ${this._packReader!.tileCount} tiles from ${packUrl}`);
				ctx.requestRender();
			}).catch((err) => {
				ctx.debug.log(`gtpk: failed to load ${packUrl}: ${(err as Error).message}`);
			});
		}

		ctx.debug.log(`tile-pipeline: initialized tileSize=${this._tileSize} sourceMaxZoom=${this._sourceMaxZoom}`);
	}

	isIdle(): boolean {
		try {
			const ctx = this.ctx;
			const now = ctx.now();
			const idleByTime = now - ctx.lastInteractAt > ctx.options.interactionIdleMs;
			const coord = ctx.renderCoordinator;
			const anim = coord ? coord.isAnimating() : false;
			return idleByTime && !anim;
		} catch {
			return true;
		}
	}

	/** Short-debounce movement check for concurrency throttling (50ms + animation). */
	isMoving(): boolean {
		try {
			const ctx = this.ctx;
			const recentInteraction = ctx.now() - ctx.lastInteractAt < 50;
			const anim = ctx.renderCoordinator ? ctx.renderCoordinator.isAnimating() : false;
			return recentInteraction || anim;
		} catch {
			return false;
		}
	}

	urlFor(z: number, x: number, y: number): string {
		return this._tileUrl.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
	}

	enqueue(z: number, x: number, y: number, priority: number): void {
		this._pipeline?.enqueue(z, x, y, priority);
	}

	wantKey(key: string): void {
		this._wantedKeys.add(key);
		this._cache?.touch(key, this.frame);
	}

	clearWanted(): void {
		this._wantedKeys.clear();
	}

	cancelUnwanted(): void {
		if (!this._loader) return;
		this._loader.cancelUnwanted(this._wantedKeys);
		this._pipeline?.cancelUnwanted(this._wantedKeys);
	}

	private _prefetchedWhileIdle = false;

	prefetchNeighbors(z: number): void {
		if (!this.isIdle()) {
			this._prefetchedWhileIdle = false;
			return;
		}
		if (this._prefetchedWhileIdle) return;
		this._prefetchedWhileIdle = true;
		this._pipeline?.scheduleBaselinePrefetch(z);
	}

	setSource(opts: { url: string; packUrl?: string; tileSize: number; mapSize: { width: number; height: number }; sourceMinZoom: number; sourceMaxZoom: number }): void {
		// Tear down existing pipeline
		this._loader?.cancelAll('source-change');
		this._cache?.destroy();
		this._packReader?.destroy();
		this._packReader = null;
		this._cache = null;
		this._loader = null;
		this._pipeline = null;
		this._pendingTiles.clear();
		this._inflightCount = 0;
		this._wantedKeys.clear();

		this._tileUrl = opts.url;
		this._packUrl = opts.packUrl;
		this._tileSize = opts.tileSize;
		this._sourceMaxZoom = opts.sourceMaxZoom;

		const vs = this.ctx.viewState;
		vs.minZoom = opts.sourceMinZoom;
		vs.mapSize = { width: Math.max(1, opts.mapSize.width), height: Math.max(1, opts.mapSize.height) };
		vs.imageMaxZoom = ViewStateStoreCompute(vs.mapSize.width, vs.mapSize.height);
		vs.maxZoom = Math.max(vs.minZoom, this._sourceMaxZoom);

		this.init();
	}

	get cache(): TileCache {
		return this._cache!;
	}

	get tileSize(): number {
		return this._tileSize;
	}

	get sourceMaxZoom(): number {
		return this._sourceMaxZoom;
	}

	rebuild(): void {
		this._loader?.cancelAll('rebuild');
		this._cache?.destroy();
		this._cache = null;
		this._loader = null;
		this._pipeline = null;
		this._pendingTiles.clear();
		this._inflightCount = 0;
		this._wantedKeys.clear();
		this.init();
	}

	destroy(): void {
		try {
			this._loader?.cancelAll('destroy');
			this._cache?.destroy();
			this._packReader?.destroy();
			this._packReader = null;
			this._cache = null;
			this._loader = null;
			this._pipeline = null;
		} catch {}
	}
}

// Inline helper to avoid circular import
function ViewStateStoreCompute(width: number, height: number): number {
	const maxDim = Math.max(width, height);
	return Math.max(0, Math.ceil(Math.log2(maxDim / 256)));
}
