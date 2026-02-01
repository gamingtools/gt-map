import type { ProgramLocs } from '../render/screen-cache';
import { computeTileBounds, forEachVisibleTile } from '../map-math';

type TileCacheLike = {
	get(key: string): { status: 'ready' | 'loading' | 'error'; tex?: WebGLTexture; width?: number; height?: number } | undefined;
	has(key: string): boolean;
};

export class RasterRenderer {
	private gl: WebGLRenderingContext;

	constructor(gl: WebGLRenderingContext) {
		this.gl = gl;
	}

	/** Draw tiles for a single zoom level. */
	drawTilesForLevel(
		loc: ProgramLocs,
		tileCache: TileCacheLike,
		enqueueTile: (z: number, x: number, y: number, priority?: number) => void,
		params: {
			zLevel: number;
			tlWorld: { x: number; y: number };
			scale: number;
			dpr: number;
			widthCSS: number;
			heightCSS: number;
			wrapX: boolean;
			tileSize: number;
			mapSize?: { width: number; height: number };
			zMax?: number;
			sourceMaxZoom?: number;
			filterMode?: 'auto' | 'linear' | 'bicubic';
			wantTileKey?: (key: string) => void;
		},
	) {
		const gl = this.gl;
		const { zLevel, tlWorld, scale, dpr, widthCSS, heightCSS, wrapX, tileSize, mapSize, zMax, sourceMaxZoom, filterMode } = params;
		const TS = tileSize;
		const { tilesX, tilesY } = computeTileBounds(mapSize, tileSize, zLevel, sourceMaxZoom, zMax);

		forEachVisibleTile({ tlWorld, scale, widthCSS, heightCSS, tileSize, zLevel, wrapX, tilesX, tilesY }, (tileX, ty, tx, key) => {
			const wx = tx * TS;
			const wy = ty * TS;
			const sxCSS = (wx - tlWorld.x) * scale;
			const syCSS = (wy - tlWorld.y) * scale;
			if (typeof sourceMaxZoom === 'number' && zLevel > sourceMaxZoom) return;
			try {
				params.wantTileKey?.(key);
			} catch {}
			const rec = tileCache.get(key);
			if (!rec) enqueueTile(zLevel, tileX, ty, 0);
			if (rec?.status === 'ready' && rec.tex) {
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, rec.tex);
				const leftPx = Math.round(sxCSS * dpr);
				const topPx = Math.round(syCSS * dpr);
				const rightPx = Math.round((sxCSS + TS * scale) * dpr);
				const bottomPx = Math.round((syCSS + TS * scale) * dpr);
				const wPx = Math.max(1, rightPx - leftPx);
				const hPx = Math.max(1, bottomPx - topPx);
				gl.uniform2f(loc.u_translate!, leftPx, topPx);
				gl.uniform2f(loc.u_size!, wPx, hPx);
				const texW = Math.max(1, rec.width || TS);
				const texH = Math.max(1, rec.height || TS);
				const upscaleX = wPx / dpr / texW;
				const upscaleY = hPx / dpr / texH;
				let modeInt = 0;
				if (filterMode === 'bicubic') modeInt = 1;
				else if (filterMode === 'auto') {
					const isUpscale = upscaleX > 1.01 || upscaleY > 1.01;
					modeInt = isUpscale ? 1 : 0;
				} else {
					modeInt = 0;
				}
				if (loc.u_texel) gl.uniform2f(loc.u_texel, 1.0 / texW, 1.0 / texH);
				if (loc.u_filterMode) gl.uniform1i(loc.u_filterMode, modeInt);
				gl.uniform2f(loc.u_uv0!, 0.0, 0.0);
				gl.uniform2f(loc.u_uv1!, 1.0, 1.0);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			}
		});
	}

	/** Compute tile coverage ratio for a zoom level in the current viewport. */
	coverage(
		tileCache: TileCacheLike,
		zLevel: number,
		tlWorld: { x: number; y: number },
		scale: number,
		widthCSS: number,
		heightCSS: number,
		wrapX: boolean,
		tileSize: number,
		mapSize?: { width: number; height: number },
		zMax?: number,
		sourceMaxZoom?: number,
	): number {
		const { tilesX, tilesY } = computeTileBounds(mapSize, tileSize, zLevel, sourceMaxZoom, zMax);
		let total = 0;
		let ready = 0;

		forEachVisibleTile({ tlWorld, scale, widthCSS, heightCSS, tileSize, zLevel, wrapX, tilesX, tilesY }, (_tileX, _ty, _tx, key) => {
			total++;
			const rec = tileCache.get(key);
			if (rec?.status === 'ready') ready++;
		});

		if (total === 0) return 1;
		return ready / total;
	}
}
