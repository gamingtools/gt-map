/**
 * TileManager -- owns the tile cache, GTPK reader, and decode pipeline.
 *
 * All tiles are served from an in-memory GTPK binary pack.
 * Decode path: getBlob() -> createImageBitmap() -> GL upload -> cache.
 */
import { computeImageMaxZoom, computeTileBounds } from '../map-math';
import { TileCache } from './cache';
import { GtpkReader } from './gtpk-reader';
import { tileKey as tileKeyOf } from './source';

export interface TileManagerDeps {
	getGL(): WebGLRenderingContext;
	getMapSize(): { width: number; height: number };
	getImageMaxZoom(): number;
	debugLog(msg: string): void;
	requestRender(): void;
	now(): number;
	getLastInteractAt(): number;
	getInteractionIdleMs(): number;
	isAnimating(): boolean;
	/** Called when setSource changes view-affecting state. */
	updateViewForSource(opts: { minZoom: number; maxZoom: number; mapSize: { width: number; height: number }; imageMaxZoom: number }): void;
}

export class TileManager {
	private deps: TileManagerDeps;
	private _cache: TileCache | null = null;
	private _packReader: GtpkReader | null = null;
	private _decoding = new Set<string>();
	private _missing = new Set<string>();
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

	constructor(deps: TileManagerDeps, tileConfig: { packUrl: string; tileSize: number; sourceMaxZoom: number }) {
		this.deps = deps;
		this._packUrl = tileConfig.packUrl;
		this._tileSize = tileConfig.tileSize;
		this._sourceMaxZoom = tileConfig.sourceMaxZoom;
		const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
		this._maxConcurrentDecodes = Math.max(2, Math.min(Math.floor(cores / 2), 8));
	}

	init(): void {
		const d = this.deps;
		this._destroyed = false;
		this._cache = new TileCache(d.getGL());

		// Load GTPK tile pack
		this._packReader = new GtpkReader();
		const packUrl = this._packUrl;
		this._packReader
			.load(packUrl)
			.then(() => {
				d.debugLog(`gtpk: loaded ${this._packReader!.tileCount} tiles from ${packUrl}`);
				d.requestRender();
			})
			.catch((err) => {
				d.debugLog(`gtpk: failed to load ${packUrl}: ${(err as Error).message}`);
			});

		d.debugLog(`tile-manager: initialized tileSize=${this._tileSize} sourceMaxZoom=${this._sourceMaxZoom}`);
	}

	// -- Decode pipeline --

	enqueue(z: number, x: number, y: number, _priority?: number): void {
		const key = tileKeyOf(z, x, y);
		if (this._cache?.has(key)) return;
		if (this._decoding.has(key)) return;
		if (this._missing.has(key)) return;
		if (!this._packReader?.ready) return;
		if (!this.inBounds(z, x, y)) return;
		if (this._decoding.size >= this._maxConcurrentDecodes) return;
		this._decoding.add(key);
		this.decode(key);
	}

	private decode(key: string): void {
		if (this._destroyed) return;
		const blob = this._packReader!.getBlob(key);
		if (!blob) {
			this._decoding.delete(key);
			this._missing.add(key);
			return;
		}

		createImageBitmap(blob, {
			premultiplyAlpha: 'none',
			colorSpaceConversion: 'none',
		})
			.then((bmp: ImageBitmap) => {
				try {
					if (this._destroyed) return;
					const gl = this.deps.getGL();
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
					this.deps.requestRender();
				} finally {
					try {
						bmp.close?.();
					} catch {}
				}
			})
			.catch((err) => {
				this.deps.debugLog(`tile decode failed ${key}: ${err}`);
			})
			.finally(() => {
				if (!this._destroyed) this._decoding.delete(key);
			});
	}

	// -- Bounds check (from tile-pipeline) --

	private inBounds(z: number, x: number, y: number): boolean {
		if (x < 0 || y < 0) return false;
		const { tilesX, tilesY } = computeTileBounds(this.deps.getMapSize(), this._tileSize, z, this.deps.getImageMaxZoom(), undefined);
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
			const gl = this.deps.getGL();
			const MIP_BUDGET_MS = 2;
			const start = performance.now();
			let processed = 0;
			while (performance.now() - start < MIP_BUDGET_MS && this._pendingMips.length > 0) {
				const it = this._pendingMips.shift()!;
				if (!this._cache?.isTileReady(it.key, it.tex)) continue;
				gl.bindTexture(gl.TEXTURE_2D, it.tex);
				gl.generateMipmap(gl.TEXTURE_2D);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
				processed++;
			}
			if (this._pendingMips.length > 0) requestAnimationFrame(() => this.scheduleMips());
			if (processed > 0) this.deps.requestRender();
		};
		requestAnimationFrame(process);
	}

	// -- State queries --

	isIdle(): boolean {
		try {
			const d = this.deps;
			const now = d.now();
			const idleByTime = now - d.getLastInteractAt() > d.getInteractionIdleMs();
			return idleByTime && !d.isAnimating();
		} catch {
			return true;
		}
	}

	isMoving(): boolean {
		try {
			const d = this.deps;
			const recentInteraction = d.now() - d.getLastInteractAt() < 50;
			return recentInteraction || d.isAnimating();
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

	/** Run deferred LRU eviction after render has touched all visible tiles. */
	cancelUnwanted(): void {
		this._cache?.evictIfNeeded();
	}

	// -- Source change --

	setSource(opts: { packUrl: string; tileSize: number; mapSize: { width: number; height: number }; sourceMinZoom: number; sourceMaxZoom: number }): void {
		this._teardown();

		this._packUrl = opts.packUrl;
		this._tileSize = opts.tileSize;
		this._sourceMaxZoom = opts.sourceMaxZoom;

		const mapSize = { width: Math.max(1, opts.mapSize.width), height: Math.max(1, opts.mapSize.height) };
		const imageMaxZoom = computeImageMaxZoom(mapSize.width, mapSize.height, opts.tileSize);
		this.deps.updateViewForSource({
			minZoom: opts.sourceMinZoom,
			maxZoom: Math.max(opts.sourceMinZoom, this._sourceMaxZoom),
			mapSize,
			imageMaxZoom,
		});

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
		this._missing.clear();
		this._pendingMips = [];
		this._mipsScheduled = false;
	}

	destroy(): void {
		try {
			this._teardown();
		} catch {}
	}
}
