/**
 * TileManager -- owns the tile cache, GTPK reader, and decode pipeline.
 *
 * All tiles are served from an in-memory GTPK binary pack.
 * Decode path: getBlob() -> createImageBitmap() -> GL upload -> cache.
 */
import type { MapContext } from '../context/map-context';
import * as Coords from '../coords';

import { TileCache } from './cache';
import { GtpkReader } from './gtpk-reader';
import { tileKey as tileKeyOf } from './source';

export class TileManager {
	private ctx: MapContext;
	private _cache: TileCache | null = null;
	private _packReader: GtpkReader | null = null;
	private _decoding = new Set<string>();
	private _destroyed = false;

	private _packUrl: string;
	private _tileSize: number;
	private _sourceMaxZoom: number;
	private _maxConcurrentDecodes: number;

	// Mipmap scheduling
	private _pendingMips: Array<{ key: string; tex: WebGLTexture }> = [];
	private _mipsScheduled = false;

	// Frame counter (shared with render coordinator)
	frame = 0;

	constructor(ctx: MapContext) {
		this.ctx = ctx;
		this._packUrl = ctx.config.tiles.packUrl!;
		this._tileSize = ctx.config.tiles.tileSize;
		this._sourceMaxZoom = ctx.config.tiles.sourceMaxZoom;
		const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
		this._maxConcurrentDecodes = Math.max(2, Math.min(Math.floor(cores / 2), 8));
	}

	init(): void {
		const ctx = this.ctx;
		this._destroyed = false;
		this._cache = new TileCache(ctx.gl!);

		// Load GTPK tile pack
		this._packReader = new GtpkReader();
		const packUrl = this._packUrl;
		this._packReader.load(packUrl).then(() => {
			ctx.debug.log(`gtpk: loaded ${this._packReader!.tileCount} tiles from ${packUrl}`);
			ctx.requestRender();
		}).catch((err) => {
			ctx.debug.log(`gtpk: failed to load ${packUrl}: ${(err as Error).message}`);
		});

		ctx.debug.log(`tile-manager: initialized tileSize=${this._tileSize} sourceMaxZoom=${this._sourceMaxZoom}`);
	}

	// -- Decode pipeline --

	enqueue(z: number, x: number, y: number, _priority?: number): void {
		const key = tileKeyOf(z, x, y);
		if (this._cache?.has(key)) return;
		if (this._decoding.has(key)) return;
		if (!this._packReader?.ready) return;
		if (!this.inBounds(z, x, y)) return;
		if (this._decoding.size >= this._maxConcurrentDecodes) return;
		this._decoding.add(key);
		this.decode(key);
	}

	private decode(key: string): void {
		const blob = this._packReader!.getBlob(key);
		if (!blob) {
			this._decoding.delete(key);
			return;
		}

		createImageBitmap(blob, {
			premultiplyAlpha: 'none',
			colorSpaceConversion: 'none',
		})
			.then((bmp: ImageBitmap) => {
				try {
					if (this._destroyed) return;
					const gl = this.ctx.gl!;
					const tex = this._cache?.acquireTexture();
					if (!tex) return;
					gl.bindTexture(gl.TEXTURE_2D, tex);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
					gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
					this._cache!.setReady(key, tex, bmp.width, bmp.height, this.frame);
					this._pendingMips.push({ key, tex });
					this.scheduleMips();
					this.ctx.requestRender();
				} finally {
					try { bmp.close?.(); } catch {}
				}
			})
			.catch(() => {})
			.finally(() => {
				this._decoding.delete(key);
			});
	}

	// -- Bounds check (from tile-pipeline) --

	private inBounds(z: number, x: number, y: number): boolean {
		if (x < 0 || y < 0) return false;
		const zMax = this.ctx.viewState.imageMaxZoom;
		const TS = this._tileSize;
		const mapSize = this.ctx.viewState.mapSize;
		const s = Coords.sFor(zMax, z);
		const tilesX = Math.ceil(Math.ceil(mapSize.width / s) / TS);
		const tilesY = Math.ceil(Math.ceil(mapSize.height / s) / TS);
		return x < tilesX && y < tilesY;
	}

	// -- Mipmap scheduling (from loader) --

	private scheduleMips(): void {
		if (this._mipsScheduled) return;
		this._mipsScheduled = true;
		const process = () => {
			this._mipsScheduled = false;
			if (!this.isIdle()) {
				requestAnimationFrame(() => this.scheduleMips());
				return;
			}
			const gl = this.ctx.gl!;
			const MIP_BUDGET_MS = 2;
			const start = performance.now();
			while (performance.now() - start < MIP_BUDGET_MS && this._pendingMips.length > 0) {
				const it = this._pendingMips.shift()!;
				if (!this._cache?.isTileReady(it.key, it.tex)) continue;
				gl.bindTexture(gl.TEXTURE_2D, it.tex);
				gl.generateMipmap(gl.TEXTURE_2D);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			}
			if (this._pendingMips.length > 0) requestAnimationFrame(() => this.scheduleMips());
			this.ctx.requestRender();
		};
		requestAnimationFrame(process);
	}

	// -- State queries --

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

	// -- LRU touch (called by RasterRenderer via RenderCtx) --

	wantKey(key: string): void {
		this._cache?.touch(key, this.frame);
	}

	/** No-op: with ~2ms in-memory decode, cancellation has no benefit. */
	clearWanted(): void {}

	/** No-op: with ~2ms in-memory decode, cancellation has no benefit. */
	cancelUnwanted(): void {}

	// -- Prefetch --

	private _prefetchedWhileIdle = false;

	prefetchNeighbors(z: number): void {
		if (!this.isIdle()) {
			this._prefetchedWhileIdle = false;
			return;
		}
		if (this._prefetchedWhileIdle) return;
		this._prefetchedWhileIdle = true;

		const c = this.ctx.viewState.center;
		const zMax = this.ctx.viewState.imageMaxZoom;
		const TS = this._tileSize;
		const s = Coords.sFor(zMax, z);
		const cx = Math.floor(c.lng / s / TS);
		const cy = Math.floor(c.lat / s / TS);
		const R = 2;
		for (let dy = -R; dy <= R; dy++) {
			for (let dx = -R; dx <= R; dx++) {
				const tx = cx + dx;
				const ty = cy + dy;
				if (tx < 0 || ty < 0) continue;
				const key = tileKeyOf(z, tx, ty);
				this._cache?.pin(key);
				this.enqueue(z, tx, ty);
			}
		}
	}

	// -- Source change --

	setSource(opts: { packUrl: string; tileSize: number; mapSize: { width: number; height: number }; sourceMinZoom: number; sourceMaxZoom: number }): void {
		this._teardown();

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

	// -- Accessors --

	get cache(): TileCache {
		return this._cache!;
	}

	get tileSize(): number {
		return this._tileSize;
	}

	get sourceMaxZoom(): number {
		return this._sourceMaxZoom;
	}

	// -- Lifecycle --

	rebuild(): void {
		this._teardown();
		this.init();
	}

	private _teardown(): void {
		this._destroyed = true;
		this._cache?.destroy();
		this._packReader?.destroy();
		this._packReader = null;
		this._cache = null;
		this._decoding.clear();
		this._pendingMips = [];
		this._mipsScheduled = false;
	}

	destroy(): void {
		try {
			this._teardown();
		} catch {}
	}
}

// Inline helper to avoid circular import
function ViewStateStoreCompute(width: number, height: number): number {
	const maxDim = Math.max(width, height);
	return Math.max(0, Math.ceil(Math.log2(maxDim / 256)));
}
