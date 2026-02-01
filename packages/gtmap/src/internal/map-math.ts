/**
 * map-math.ts -- shared, cycle-free tile and map geometry utilities.
 *
 * All functions are pure and stateless. They depend only on coords.ts
 * and tiles/source.ts (both leaf modules with no upward imports).
 */
import * as Coords from './coords';
import { tileKey as tileKeyOf, wrapX as wrapXTile } from './tiles/source';

/** Default tile size used when none is provided. */
export const DEFAULT_TILE_SIZE = 256;

/**
 * Compute the maximum zoom level for a given image/map size.
 *
 * Formula: ceil(log2(max(width, height) / tileSize))
 * At this zoom, one tile covers roughly one tile-size chunk of the source image.
 */
export function computeImageMaxZoom(width: number, height: number, tileSize: number = DEFAULT_TILE_SIZE): number {
	const maxDim = Math.max(width, height);
	return Math.max(0, Math.ceil(Math.log2(maxDim / tileSize)));
}

/**
 * Compute the tile grid dimensions for a zoom level.
 *
 * Returns the number of tiles along each axis, or Infinity when the
 * map has unbounded extent (no mapSize / no sourceMaxZoom).
 */
export function computeTileBounds(
	mapSize: { width: number; height: number } | undefined,
	tileSize: number,
	zLevel: number,
	sourceMaxZoom: number | undefined,
	zMax: number | undefined,
): { tilesX: number; tilesY: number } {
	const imgMax = (typeof sourceMaxZoom === 'number' ? sourceMaxZoom : zMax) as number | undefined;
	if (mapSize && typeof imgMax === 'number') {
		const s = Coords.sFor(imgMax, zLevel);
		const levelW = Math.ceil(mapSize.width / s);
		const levelH = Math.ceil(mapSize.height / s);
		return {
			tilesX: Math.ceil(levelW / tileSize),
			tilesY: Math.ceil(levelH / tileSize),
		};
	}
	return { tilesX: Infinity, tilesY: Infinity };
}

/** Parameters for forEachVisibleTile iteration. */
export interface VisibleTileParams {
	tlWorld: { x: number; y: number };
	scale: number;
	widthCSS: number;
	heightCSS: number;
	tileSize: number;
	zLevel: number;
	wrapX: boolean;
	tilesX: number;
	tilesY: number;
}

/**
 * Iterate over every tile position visible in the current viewport.
 *
 * Handles Y/X bounds clamping and X wrapping. The callback receives:
 * - `tileX`: the canonical (potentially wrapped) tile X coordinate
 * - `ty`: the tile Y coordinate
 * - `tx`: the raw grid X (may be negative or >= tilesX when wrapping)
 * - `key`: the cache key for (zLevel, tileX, ty)
 */
export function forEachVisibleTile(params: VisibleTileParams, callback: (tileX: number, ty: number, tx: number, key: string) => void): void {
	const { tlWorld, scale, widthCSS, heightCSS, tileSize: TS, zLevel, wrapX, tilesX, tilesY } = params;

	const startX = Math.floor(tlWorld.x / TS);
	const startY = Math.floor(tlWorld.y / TS);
	const endX = Math.floor((tlWorld.x + widthCSS / scale) / TS) + 1;
	const endY = Math.floor((tlWorld.y + heightCSS / scale) / TS) + 1;

	for (let ty = startY; ty <= endY; ty++) {
		if (!Number.isFinite(tilesY)) {
			if (ty < 0 || ty >= 1 << zLevel) continue;
		} else {
			if (ty < 0 || ty >= tilesY) continue;
		}
		for (let tx = startX; tx <= endX; tx++) {
			let tileX = tx;
			if (!Number.isFinite(tilesX)) {
				if (wrapX) tileX = wrapXTile(tx, zLevel);
				else if (tx < 0 || tx >= 1 << zLevel) continue;
			} else {
				if (tx < 0 || tx >= tilesX) continue;
			}
			const key = tileKeyOf(zLevel, tileX, ty);
			callback(tileX, ty, tx, key);
		}
	}
}
