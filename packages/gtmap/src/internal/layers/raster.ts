import type { ProgramLocs } from '../render/screen-cache';
// per-level tile size provided via params
import { tileKey as tileKeyOf, wrapX as wrapXTile } from '../tiles/source';
import * as Coords from '../coords';

type TileCacheLike = {
	get(key: string): { status: 'ready' | 'loading' | 'error'; tex?: WebGLTexture; width?: number; height?: number } | undefined;
	has(key: string): boolean;
};

export class RasterRenderer {
	private gl: WebGLRenderingContext;
	constructor(gl: WebGLRenderingContext) {
		this.gl = gl;
	}

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
            quantizePixels?: boolean; // when false, avoid integer rounding for rotated views
            coverTlWorld?: { x: number; y: number }; // optional: expand coverage from a wider top-left for rotation
        },
    ) {
		const gl = this.gl;
		const { zLevel, tlWorld, scale, dpr, widthCSS, heightCSS, wrapX, tileSize, mapSize: imageSize, zMax, sourceMaxZoom, filterMode } = params;
        const TS = tileSize;
        const baseTl = params.coverTlWorld ?? tlWorld;
        const startX = Math.floor(baseTl.x / TS);
        const startY = Math.floor(baseTl.y / TS);
        const endX = Math.floor((baseTl.x + widthCSS / scale) / TS) + 1;
        const endY = Math.floor((baseTl.y + heightCSS / scale) / TS) + 1;
		// const tilePixelSizeCSS = TS * scale; // reserved for future heuristics

		// Limit tile ranges for finite, possibly non-square images
		let tilesX = Infinity;
		let tilesY = Infinity;
		// Prefer the image pyramid max (sourceMaxZoom) over viewer max (zMax)
		const imgMax = (typeof sourceMaxZoom === 'number' ? sourceMaxZoom : zMax) as number | undefined;
		if (imageSize && typeof imgMax === 'number') {
			const s = Coords.sFor(imgMax, zLevel);
			const levelW = Math.ceil(imageSize.width / s);
			const levelH = Math.ceil(imageSize.height / s);
			tilesX = Math.ceil(levelW / TS);
			tilesY = Math.ceil(levelH / TS);
		}

		for (let ty = startY; ty <= endY; ty++) {
			if (!Number.isFinite(tilesY)) {
				if (ty < 0 || ty >= 1 << zLevel) continue;
			} else {
				if (ty < 0 || ty >= tilesY) continue;
			}
			for (let tx = startX; tx <= endX; tx++) {
				if (!Number.isFinite(tilesX)) {
					if (!wrapX && (tx < 0 || tx >= 1 << zLevel)) continue;
				} else {
					if (tx < 0 || tx >= tilesX) continue;
				}
				const tileX = wrapX && !Number.isFinite(tilesX) ? wrapXTile(tx, zLevel) : tx;
                const wx = tx * TS;
                const wy = ty * TS;
                // Position tiles relative to the original view top-left (not the coverage top-left)
                let sxCSS = (wx - tlWorld.x) * scale;
                const syCSS = (wy - tlWorld.y) * scale;
                if (wrapX && !Number.isFinite(tilesX) && tileX !== tx) {
                    const dxTiles = tx - tileX;
                    sxCSS -= dxTiles * TS * scale;
                }
				if (typeof sourceMaxZoom === 'number' && zLevel > sourceMaxZoom) continue;
				const key = tileKeyOf(zLevel, tileX, ty);
				// mark tile as wanted this frame to protect it in queue pruning
				try {
					params.wantTileKey?.(key);
				} catch {}
				const rec = tileCache.get(key);
				if (!rec) enqueueTile(zLevel, tileX, ty, 0);
				if (rec?.status === 'ready' && rec.tex) {
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_2D, rec.tex);
					// Compute edges in device pixels, then derive integer-aligned width/height.
					// This prevents 1px gaps during zoom from per-tile rounding error.
                const quant = params.quantizePixels !== false; // default true
                const leftPxF = sxCSS * dpr;
                const topPxF = syCSS * dpr;
                const rightPxF = (sxCSS + TS * scale) * dpr;
                const bottomPxF = (syCSS + TS * scale) * dpr;
                const leftPx = quant ? Math.round(leftPxF) : leftPxF;
                const topPx = quant ? Math.round(topPxF) : topPxF;
                const rightPx = quant ? Math.round(rightPxF) : rightPxF;
                const bottomPx = quant ? Math.round(bottomPxF) : bottomPxF;
                const wPx = Math.max(1, rightPx - leftPx);
                const hPx = Math.max(1, bottomPx - topPx);
                gl.uniform2f(loc.u_translate!, leftPx, topPx);
                gl.uniform2f(loc.u_size!, wPx, hPx);
					// Provide texel size and upscale hint to the shader for improved filtering
					const texW = Math.max(1, rec.width || TS);
					const texH = Math.max(1, rec.height || TS);
					const upscaleX = wPx / dpr / texW;
					const upscaleY = hPx / dpr / texH;
					let modeInt = 0; // linear
					if (filterMode === 'bicubic') modeInt = 1;
					else if (filterMode === 'auto') {
						const isUpscale = upscaleX > 1.01 || upscaleY > 1.01;
						modeInt = isUpscale ? 1 : 0;
					} else {
						modeInt = 0;
					}
					if (loc.u_texel) gl.uniform2f(loc.u_texel, 1.0 / texW, 1.0 / texH);
					if (loc.u_filterMode) gl.uniform1i(loc.u_filterMode, modeInt);
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				}
			}
		}
	}

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
		const TS = tileSize;
		const startX = Math.floor(tlWorld.x / TS);
		const startY = Math.floor(tlWorld.y / TS);
		const endX = Math.floor((tlWorld.x + widthCSS / scale) / TS) + 1;
		const endY = Math.floor((tlWorld.y + heightCSS / scale) / TS) + 1;
		let total = 0;
		let ready = 0;
		let tilesX = Infinity;
		let tilesY = Infinity;
		const imageSize = mapSize;
		const imgMax = (typeof sourceMaxZoom === 'number' ? sourceMaxZoom : zMax) as number | undefined;
		if (imageSize && typeof imgMax === 'number') {
			const s = Coords.sFor(imgMax, zLevel);
			const levelW = Math.ceil(imageSize.width / s);
			const levelH = Math.ceil(imageSize.height / s);
			tilesX = Math.ceil(levelW / TS);
			tilesY = Math.ceil(levelH / TS);
		}
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
				total++;
				const key = tileKeyOf(zLevel, tileX, ty);
				const rec = tileCache.get(key);
				if (rec?.status === 'ready') ready++;
			}
		}
		if (total === 0) return 1;
		return ready / total;
	}
}
