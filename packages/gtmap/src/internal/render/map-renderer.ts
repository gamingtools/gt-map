import type { RenderCtx } from '../types';
import * as Coords from '../coords';
import { degToRad } from '../utils/angles';

export default class MapRenderer {
	private getCtx: () => RenderCtx;
	private hooks: {
		stepAnimation?: () => boolean;
		zoomVelocityTick?: () => void;
		panVelocityTick?: () => void;
		prefetchNeighbors?: (z: number, tl: { x: number; y: number }, scale: number, w: number, h: number) => void;
		cancelUnwanted?: () => void;
		clearWanted?: () => void;
	};
	private iconsUnlocked = false;
  // Hysteresis for level-wide filter decisions to prevent flicker near scale ~= 1
  // private filterState = new Map<number, boolean>(); // level -> useBicubic // Currently unused
  private static readonly FILTER_ENTER = 1.02;
  private static readonly FILTER_EXIT = 0.99;

	constructor(getCtx: () => RenderCtx, hooks?: MapRenderer['hooks']) {
		this.getCtx = getCtx;
		this.hooks = hooks || {};
	}

	render() {
		const ctx: RenderCtx = this.getCtx();
		const opts = this.hooks;
		const gl: WebGLRenderingContext = ctx.gl;
		gl.clear(gl.COLOR_BUFFER_BIT);
		if (!(ctx.prog && ctx.loc && ctx.quad)) return;
		if (opts?.clearWanted) opts.clearWanted();
		if (opts?.stepAnimation) opts.stepAnimation();
		const { zInt: baseZ, scale } = Coords.zParts(ctx.zoom);
		const idle = typeof ctx.isIdle === 'function' ? !!ctx.isIdle() : false;
		const rect = ctx.container.getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
        const centerLevel = ctx.project(ctx.center.lng, ctx.center.lat, baseZ);
        let tlWorld = Coords.tlLevelFor(centerLevel, ctx.zoom, { x: widthCSS, y: heightCSS });
        // Only snap to device pixels when not rotating to avoid rotation jitter
        const snap = (v: number) => Coords.snapLevelToDevice(v, scale, ctx.dpr);
        const ang0 = degToRad(ctx.viewRotationDeg);
        if (ang0 === 0) tlWorld = { x: snap(tlWorld.x), y: snap(tlWorld.y) };
		gl.useProgram(ctx.prog);
		gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
		const loc = ctx.loc;
		gl.enableVertexAttribArray(loc.a_pos);
		gl.vertexAttribPointer(loc.a_pos, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(loc.u_resolution!, ctx.canvas.width, ctx.canvas.height);
        // Map rotation uniforms
        const ang = degToRad(ctx.viewRotationDeg);
        const s = Math.sin(ang); const c = Math.cos(ang);
        if (loc.u_centerPx) gl.uniform2f(loc.u_centerPx, ctx.canvas.width * 0.5, ctx.canvas.height * 0.5);
        if (loc.u_rotSinCos) gl.uniform2f(loc.u_rotSinCos, s, c);
		gl.uniform1i(loc.u_tex!, 0);
		gl.uniform1f(loc.u_alpha!, 1.0);
		gl.uniform2f(loc.u_uv0!, 0.0, 0.0);
		gl.uniform2f(loc.u_uv1!, 1.0, 1.0);
		if (opts?.zoomVelocityTick) opts.zoomVelocityTick();
		if (opts?.panVelocityTick) opts.panVelocityTick();
        // Disable screen cache when rotating to avoid ghosting artifacts
        if ((ang === 0) && ctx.useScreenCache && ctx.screenCache) {
			// Clip cached frame to the finite map extent to avoid overlay ghosts outside tiles
			const imgMax = ctx.sourceMaxZoom || ctx.maxZoom;
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
				ctx.screenCache.draw({ zInt: baseZ, scale, widthCSS, heightCSS, dpr: ctx.dpr, tlWorld }, ctx.loc!, ctx.prog!, ctx.quad!, ctx.canvas);
				if (!prevScissor) gl.disable(gl.SCISSOR_TEST);
			}
		}
        // Inflate viewport to cover rotated corners, centered on viewport
        const absS = Math.abs(s), absC = Math.abs(c);
        let effW = widthCSS * absC + heightCSS * absS;
        let effH = widthCSS * absS + heightCSS * absC;
        if (ang !== 0) {
            // Add a conservative margin to cover tile boundaries while panning at a bearing
            const margin = ctx.tileSize * scale * 1.5;
            effW += margin;
            effH += margin;
        }
        const coverage = ctx.raster.coverage(
            ctx.tileCache,
            baseZ,
            (ang === 0) ? tlWorld : { x: centerLevel.x - (effW / scale) * 0.5, y: centerLevel.y - (effH / scale) * 0.5 },
            scale,
            effW,
            effH,
            ctx.wrapX,
            ctx.tileSize,
            ctx.mapSize,
            ctx.maxZoom,
            ctx.sourceMaxZoom,
            (ang !== 0) ? 2 : 0,
        );
		if (!this.iconsUnlocked && coverage >= 0.5) this.iconsUnlocked = true;

		// Determine target LOD for idle resolution logic
		const zIntNext = Math.min(ctx.maxZoom, baseZ + 1);
		const frac = ctx.zoom - baseZ;
		const targetZ = frac >= 0.5 && zIntNext > baseZ ? zIntNext : baseZ;
		let targetCoverage = 0;
        if (idle) {
            // Compute coverage at targetZ
            const centerT = ctx.project(ctx.center.lng, ctx.center.lat, targetZ);
            const scaleT = Coords.scaleAtLevel(ctx.zoom, targetZ);
            let tlT = Coords.tlLevelForWithScale(centerT, scaleT, { x: widthCSS, y: heightCSS });
            if (ang !== 0) {
                // avoid snapping during rotation
            } else {
                const snapT = (v: number) => Coords.snapLevelToDevice(v, scaleT, ctx.dpr);
                tlT = { x: snapT(tlT.x), y: snapT(tlT.y) };
            }
            targetCoverage = ctx.raster.coverage(
                ctx.tileCache,
                targetZ,
                (ang === 0) ? tlT : { x: centerT.x - (effW / scaleT) * 0.5, y: centerT.y - (effH / scaleT) * 0.5 },
                scaleT,
                effW,
                effH,
                ctx.wrapX,
                ctx.tileSize,
                ctx.mapSize,
                ctx.maxZoom,
                ctx.sourceMaxZoom,
                (ang !== 0) ? 2 : 0,
            );
            // Do not perform alpha=0 draws here; we will enqueue through visible draws below.
        }
		const zIntPrev = Math.max(ctx.minZoom, baseZ - 1);
		if (coverage < 0.995 && zIntPrev >= ctx.minZoom) {
			for (let lvl = zIntPrev; lvl >= ctx.minZoom; lvl--) {
				const centerL = ctx.project(ctx.center.lng, ctx.center.lat, lvl);
				const scaleL = Coords.scaleAtLevel(ctx.zoom, lvl);
            let tlL = Coords.tlLevelForWithScale(centerL, scaleL, { x: widthCSS, y: heightCSS });
            if (ang !== 0) {
                // skip snapping when rotating
            } else {
                const snapL = (v: number) => Coords.snapLevelToDevice(v, scaleL, ctx.dpr);
                tlL = { x: snapL(tlL.x), y: snapL(tlL.y) };
            }
                const covL = ctx.raster.coverage(
                    ctx.tileCache,
                    lvl,
                    (ang === 0) ? tlL : { x: centerL.x - (effW / scaleL) * 0.5, y: centerL.y - (effH / scaleL) * 0.5 },
                    scaleL,
                    effW,
                    effH,
                    ctx.wrapX,
                    ctx.tileSize,
                    ctx.mapSize,
                    ctx.maxZoom,
                    ctx.sourceMaxZoom,
                    (ang !== 0) ? 2 : 0,
                );
				// Backfill lower levels at full raster opacity
				gl.uniform1f(loc.u_alpha!, Math.max(0, Math.min(1, ctx.rasterOpacity ?? 1.0)));
                ctx.raster.drawTilesForLevel(ctx.loc!, ctx.tileCache, ctx.enqueueTile, {
                    zLevel: lvl,
                    tlWorld: tlL,
                    scale: scaleL,
                    dpr: ctx.dpr,
                    widthCSS: effW,
                    heightCSS: effH,
                    wrapX: ctx.wrapX,
                    tileSize: ctx.tileSize,
                    mapSize: ctx.mapSize,
                    zMax: ctx.maxZoom,
                    sourceMaxZoom: ctx.sourceMaxZoom,
                    filterMode: this.levelFilter(scaleL),
                    wantTileKey: ctx.wantTileKey,
                    quantizePixels: (ang === 0),
                    coverTlWorld: (ang === 0) ? tlL : { x: centerL.x - (effW / scaleL) * 0.5, y: centerL.y - (effH / scaleL) * 0.5 },
                    padTiles: (ang !== 0) ? 2 : 0,
                });
				if (covL >= 0.995) break;
			}
		}

		// Decide how to render based on idle/target coverage
		const layerAlpha = Math.max(0, Math.min(1, ctx.rasterOpacity ?? 1.0));
		if (idle) {
			if (targetCoverage >= 0.98) {
				// Render only the resolved target level
				const centerR = ctx.project(ctx.center.lng, ctx.center.lat, targetZ);
				const scaleR = Coords.scaleAtLevel(ctx.zoom, targetZ);
				let tlR = Coords.tlLevelForWithScale(centerR, scaleR, { x: widthCSS, y: heightCSS });
				const snapR = (v: number) => Coords.snapLevelToDevice(v, scaleR, ctx.dpr);
				tlR = { x: snapR(tlR.x), y: snapR(tlR.y) };
				gl.uniform1f(loc.u_alpha!, layerAlpha);
                ctx.raster.drawTilesForLevel(ctx.loc!, ctx.tileCache, ctx.enqueueTile, {
                    zLevel: targetZ,
                    tlWorld: tlR,
                    scale: scaleR,
                    dpr: ctx.dpr,
                    widthCSS: effW,
                    heightCSS: effH,
                    wrapX: ctx.wrapX,
                    tileSize: ctx.tileSize,
                    mapSize: ctx.mapSize,
                    zMax: ctx.maxZoom,
                    sourceMaxZoom: ctx.sourceMaxZoom,
                    filterMode: this.levelFilter(scaleR),
                    wantTileKey: ctx.wantTileKey,
                    quantizePixels: (ang === 0),
                    coverTlWorld: (ang === 0) ? tlR : { x: centerR.x - (effW / scaleR) * 0.5, y: centerR.y - (effH / scaleR) * 0.5 },
                    padTiles: (ang !== 0) ? 2 : 0,
                });
			} else {
				// Not enough target coverage yet: render base + backfill, but suppress z+1 overlay blending
				gl.uniform1f(loc.u_alpha!, layerAlpha);
            ctx.raster.drawTilesForLevel(ctx.loc!, ctx.tileCache, ctx.enqueueTile, {
                zLevel: baseZ,
                tlWorld: tlWorld,
                scale,
                dpr: ctx.dpr,
                widthCSS: effW,
                heightCSS: effH,
                wrapX: ctx.wrapX,
                tileSize: ctx.tileSize,
                mapSize: ctx.mapSize,
                zMax: ctx.maxZoom,
                sourceMaxZoom: ctx.sourceMaxZoom,
                filterMode: this.levelFilter(scale),
                wantTileKey: ctx.wantTileKey,
                quantizePixels: (ang === 0),
                coverTlWorld: (ang === 0) ? tlWorld : { x: centerLevel.x - (effW / scale) * 0.5, y: centerLevel.y - (effH / scale) * 0.5 },
                padTiles: (ang !== 0) ? 2 : 0,
            });
			}
		} else {
			// Original behavior during interaction
			gl.uniform1f(loc.u_alpha!, layerAlpha);
			ctx.raster.drawTilesForLevel(ctx.loc!, ctx.tileCache, ctx.enqueueTile, {
				zLevel: baseZ,
				tlWorld,
				scale,
				dpr: ctx.dpr,
				widthCSS: effW,
				heightCSS: effH,
				wrapX: ctx.wrapX,
				tileSize: ctx.tileSize,
				mapSize: ctx.mapSize,
				zMax: ctx.maxZoom,
				sourceMaxZoom: ctx.sourceMaxZoom,
				filterMode: this.levelFilter(scale),
				wantTileKey: ctx.wantTileKey,
				quantizePixels: (ang === 0),
				coverTlWorld: (ang === 0) ? tlWorld : { x: centerLevel.x - (effW / scale) * 0.5, y: centerLevel.y - (effH / scale) * 0.5 },
				padTiles: (ang !== 0) ? 2 : 0,
			});
			if (opts?.prefetchNeighbors) opts.prefetchNeighbors(baseZ, tlWorld, scale, widthCSS, heightCSS);
			if (zIntNext > baseZ && frac > 0) {
				const centerN = ctx.project(ctx.center.lng, ctx.center.lat, zIntNext);
				const scaleN = Coords.scaleAtLevel(ctx.zoom, zIntNext);
            let tlN = Coords.tlLevelForWithScale(centerN, scaleN, { x: widthCSS, y: heightCSS });
            if (ang !== 0) {
                // skip snapping when rotating
            } else {
                const snapN = (v: number) => Coords.snapLevelToDevice(v, scaleN, ctx.dpr);
                tlN = { x: snapN(tlN.x), y: snapN(tlN.y) };
            }
				// Only draw z+1 overlay if its coverage exceeds a small threshold to avoid per-tile popping
                const nextCoverage = ctx.raster.coverage(
                    ctx.tileCache,
                    zIntNext,
                    (ang === 0) ? tlN : { x: centerN.x - (effW / scaleN) * 0.5, y: centerN.y - (effH / scaleN) * 0.5 },
                    scaleN,
                    effW,
                    effH,
                    ctx.wrapX,
                    ctx.tileSize,
                    ctx.mapSize,
                    ctx.maxZoom,
                    ctx.sourceMaxZoom,
                    (ang !== 0) ? 2 : 0,
                );
				if (nextCoverage > 0.35) {
					// Draw next-level tiles fully opaque where available to avoid gamma-darkening from blend
					gl.uniform1f(loc.u_alpha!, layerAlpha);
                ctx.raster.drawTilesForLevel(ctx.loc!, ctx.tileCache, ctx.enqueueTile, {
                    zLevel: zIntNext,
                    tlWorld: tlN,
                    scale: scaleN,
                    dpr: ctx.dpr,
                    widthCSS: effW,
                    heightCSS: effH,
                    wrapX: ctx.wrapX,
                    tileSize: ctx.tileSize,
                    mapSize: ctx.mapSize,
                    zMax: ctx.maxZoom,
                    sourceMaxZoom: ctx.sourceMaxZoom,
                    filterMode: this.levelFilter(scaleN),
                    wantTileKey: ctx.wantTileKey,
                    quantizePixels: (ang === 0),
                    coverTlWorld: (ang === 0) ? tlN : { x: centerN.x - (effW / scaleN) * 0.5, y: centerN.y - (effH / scaleN) * 0.5 },
                    padTiles: (ang !== 0) ? 2 : 0,
                });
					gl.uniform1f(loc.u_alpha!, 1.0);
				}
			}
		}
		
		// Draw icon markers after all tile layers so they are not faded by blended tiles.
		// Optionally defer icons until initial tile coverage reaches a threshold to avoid icons painting before tiles.
		if (ctx.icons && this.iconsUnlocked) {
			// Ensure alpha is 1 for icons
			gl.uniform1f(loc.u_alpha!, 1.0);
			// Icons use native texture filtering
			if (loc.u_filterMode) gl.uniform1i(loc.u_filterMode!, 0);
            ctx.icons.draw({
                gl: ctx.gl,
                prog: ctx.prog,
                loc: ctx.loc,
                quad: ctx.quad,
                canvas: ctx.canvas,
                dpr: ctx.dpr,
                tileSize: ctx.tileSize,
                zoom: ctx.zoom,
                center: ctx.center,
                minZoom: ctx.minZoom,
                maxZoom: ctx.maxZoom,
                container: ctx.container,
                project: (x: number, y: number, z: number) => ctx.project(x, y, z),
                wrapX: ctx.wrapX,
                iconScaleFunction: ctx.iconScaleFunction,
                // pass map rotation to icon renderer
                viewRotationDeg: ctx.viewRotationDeg,
                markerRotationMode: ctx.markerRotationMode,
            });
		}
		// Update screen cache after full draw so it matches the frame
		if (ctx.useScreenCache && ctx.screenCache) ctx.screenCache.update({ zInt: baseZ, scale, widthCSS, heightCSS, dpr: ctx.dpr, tlWorld }, ctx.canvas);
		if (opts?.cancelUnwanted) opts.cancelUnwanted();
	}

  private levelFilter(scale: number): 'linear' | 'bicubic' {
    // Decide once per-frame with hysteresis remembered per level value of scale is tied per level call site.
    // We don't have the level value here, so use thresholds only on scale.
    // Since this is called right before a level draw, it stabilizes per level usage because scale is level-specific.
    // Apply hysteresis to scale around 1.0 using static thresholds.
    // If scale > enter => bicubic; if scale < exit => linear; else keep previous decision via a simple latch on comparison to 1.0.
    const enter = MapRenderer.FILTER_ENTER;
    const exit = MapRenderer.FILTER_EXIT;
    if (scale > enter) return 'bicubic';
    if (scale < exit) return 'linear';
    // In the narrow band [exit, enter], prefer bicubic to avoid visible softening toggles.
    return 'bicubic';
  }
	dispose() {}
}
