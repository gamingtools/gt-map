import type { UpscaleFilterMode } from '../../api/types';
import type { RenderCtx } from '../types';
import * as Coords from '../coords';

/** Coverage thresholds for tile pyramid rendering */
const COVERAGE = {
	/** Minimum coverage before backfill from lower LODs stops */
	backfill: 0.995,
	/** Minimum coverage to unlock icon/marker rendering */
	iconUnlock: 0.5,
} as const;

export default class MapRenderer {
	private getCtx: () => RenderCtx;
	private hooks: {
		stepAnimation?: () => boolean;
		panVelocityTick?: () => void;
		cancelUnwanted?: () => void;
		clearWanted?: () => void;
	};
	private iconsUnlocked = false;
	// Hysteresis for level-wide filter decisions to prevent flicker near scale ~= 1
	private static readonly FILTER_ENTER = 1.02;
	private static readonly FILTER_EXIT = 0.99;
	private _lastFilterMode: 'linear' | 'bicubic' = 'linear';
	// FBO for opacity compositing (avoids double-alpha when backfill + base tiles overlap)
	private _gl: WebGLRenderingContext | null = null;
	private _fbo: WebGLFramebuffer | null = null;
	private _fboTex: WebGLTexture | null = null;
	private _fboW = 0;
	private _fboH = 0;

	constructor(
		getCtx: () => RenderCtx,
		hooks?: {
			stepAnimation?: () => boolean;
			panVelocityTick?: () => void;
			cancelUnwanted?: () => void;
			clearWanted?: () => void;
		},
	) {
		this.getCtx = getCtx;
		this.hooks = hooks || {};
	}

	/** Lazily create / resize the offscreen FBO used when rasterOpacity < 1. */
	private ensureFbo(gl: WebGLRenderingContext, w: number, h: number): boolean {
		// Reset FBO state if the GL context changed (e.g. after context loss/restore)
		if (this._gl && this._gl !== gl) {
			this._fbo = null;
			this._fboTex = null;
			this._fboW = 0;
			this._fboH = 0;
		}
		this._gl = gl;

		// Clamp to MAX_TEXTURE_SIZE to avoid incomplete FBO on large canvases
		const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
		if (w > maxSize || h > maxSize) return false;

		if (!this._fbo) {
			const fbo = gl.createFramebuffer();
			const tex = gl.createTexture();
			if (!fbo || !tex) {
				// Clean up partial allocation
				if (fbo) try { gl.deleteFramebuffer(fbo); } catch { /* noop */ }
				if (tex) try { gl.deleteTexture(tex); } catch { /* noop */ }
				return false;
			}
			this._fbo = fbo;
			this._fboTex = tex;
			gl.bindTexture(gl.TEXTURE_2D, this._fboTex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			this._fboW = 0;
		}
		if (this._fboW !== w || this._fboH !== h) {
			gl.bindTexture(gl.TEXTURE_2D, this._fboTex!);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._fboTex, 0);
			const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			if (status !== gl.FRAMEBUFFER_COMPLETE) {
				// FBO incomplete -- fall back to direct rendering
				return false;
			}
			this._fboW = w;
			this._fboH = h;
		}
		return true;
	}

	render() {
		const ctx = this.getCtx();
		const gl = ctx.gl;
		gl.clear(gl.COLOR_BUFFER_BIT);
		if (!(ctx.prog && ctx.loc && ctx.quad)) return;

		if (this.hooks.clearWanted) this.hooks.clearWanted();
		this.hooks.stepAnimation?.();
		this.hooks.panVelocityTick?.();

		gl.useProgram(ctx.prog);
		gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
		gl.enableVertexAttribArray(ctx.loc.a_pos);
		gl.vertexAttribPointer(ctx.loc.a_pos, 2, gl.FLOAT, false, 0, 0);
		gl.uniform2f(ctx.loc.u_resolution!, ctx.canvas.width, ctx.canvas.height);
		gl.uniform1i(ctx.loc.u_tex!, 0);
		gl.uniform1f(ctx.loc.u_alpha!, 1.0);

		const rect = ctx.container.getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
		const view = Coords.computeSnappedLevelTransform({
			centerWorld: ctx.center,
			zoom: ctx.zoom,
			viewportCSS: { x: widthCSS, y: heightCSS },
			imageMaxZ: ctx.imageMaxZoom,
			dpr: ctx.dpr,
			zoomSnapThreshold: ctx.zoomSnapThreshold,
			minZoom: ctx.minZoom,
			maxZoom: ctx.sourceMaxZoom,
		});
		const baseZ = view.baseZ;
		const levelScale = view.scale;
		const tlLevel = view.tlLevel;

		this.renderTiles(ctx, gl, baseZ, levelScale, widthCSS, heightCSS, tlLevel);

		// Draw vectors and markers with z-ordering
		const hasVectors = ctx.vectorZIndices && ctx.vectorZIndices.length > 0 && ctx.drawVectorOverlay;
		const hasIcons = ctx.icons && this.iconsUnlocked;

		if (hasIcons) {
			gl.uniform1f(ctx.loc.u_alpha!, 1.0);
			if (ctx.loc.u_filterMode) gl.uniform1i(ctx.loc.u_filterMode, 0);
			ctx.icons!.draw({
				gl: ctx.gl,
				prog: ctx.prog,
				loc: ctx.loc,
				quad: ctx.quad,
				canvas: ctx.canvas,
				dpr: ctx.dpr,
				zoom: ctx.zoom,
				center: ctx.center,
				baseZ,
				levelScale,
				tlWorld: tlLevel,
				minZoom: ctx.minZoom,
				maxZoom: ctx.maxZoom,
				container: ctx.container,
				viewport: { width: widthCSS, height: heightCSS },
				project: (x: number, y: number, z: number) => ctx.project(x, y, z),
				wrapX: ctx.wrapX,
				...(ctx.iconScaleFunction !== undefined ? { iconScaleFunction: ctx.iconScaleFunction } : {}),
				...(ctx.drawVectorOverlay ? { drawOverlayAtZ: () => ctx.drawVectorOverlay!() } : {}),
				...(ctx.vectorZIndices !== undefined ? { overlayZIndices: ctx.vectorZIndices } : {}),
			});
		} else if (hasVectors) {
			ctx.drawVectorOverlay!();
		}

		if (ctx.useScreenCache && ctx.screenCache) {
			ctx.screenCache.update({ zInt: baseZ, scale: levelScale, tlWorld: tlLevel, widthCSS, heightCSS, dpr: ctx.dpr }, ctx.canvas);
		}
		if (this.hooks.cancelUnwanted) this.hooks.cancelUnwanted();
	}

	/** Tile pyramid rendering path. */
	private renderTiles(ctx: RenderCtx, gl: WebGLRenderingContext, baseZ: number, scale: number, widthCSS: number, heightCSS: number, tlWorld: { x: number; y: number }) {
		const loc = ctx.loc;
		const tileCache = ctx.tileCache!;
		const tileSize = ctx.tileSize!;
		const sourceMaxZoom = ctx.sourceMaxZoom!;
		const enqueueTile = ctx.enqueueTile!;
		// idle state is handled by the tile pipeline's process() method

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

		// Render tiles into an offscreen FBO when opacity < 1 to prevent
		// double-alpha artifacts from backfill + base tile overlap.
		const layerAlpha = Math.max(0, Math.min(1, ctx.rasterOpacity ?? 1.0));
		const useFbo = layerAlpha < 1.0 && this.ensureFbo(gl, ctx.canvas.width, ctx.canvas.height);
		if (useFbo) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo!);
			const pc = gl.getParameter(gl.COLOR_CLEAR_VALUE) as Float32Array;
			const pcR = pc[0] ?? 0, pcG = pc[1] ?? 0, pcB = pc[2] ?? 0, pcA = pc[3] ?? 0;
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.clearColor(pcR, pcG, pcB, pcA);
		}
		const tileAlpha = useFbo ? 1.0 : layerAlpha;

		const coverage = ctx.raster.coverage(tileCache, baseZ, tlWorld, scale, widthCSS, heightCSS, ctx.wrapX, tileSize, ctx.mapSize, ctx.maxZoom, sourceMaxZoom);
		if (!this.iconsUnlocked && coverage >= COVERAGE.iconUnlock) this.iconsUnlocked = true;

		const zIntPrev = Math.max(ctx.minZoom, baseZ - 1);

		// Backfill lower LODs if coverage is insufficient
		if (coverage < COVERAGE.backfill && zIntPrev >= ctx.minZoom) {
			for (let lvl = zIntPrev; lvl >= ctx.minZoom; lvl--) {
				const centerL = ctx.project(ctx.center.x, ctx.center.y, lvl);
				const scaleL = Coords.scaleAtLevel(ctx.zoom, lvl);
				let tlL = Coords.tlLevelForWithScale(centerL, scaleL, { x: widthCSS, y: heightCSS });
				const snapL = (v: number) => Coords.snapLevelToDevice(v, scaleL, ctx.dpr);
				tlL = { x: snapL(tlL.x), y: snapL(tlL.y) };
				const covL = ctx.raster.coverage(tileCache, lvl, tlL, scaleL, widthCSS, heightCSS, ctx.wrapX, tileSize, ctx.mapSize, ctx.maxZoom, sourceMaxZoom);
				gl.uniform1f(loc.u_alpha!, tileAlpha);
				ctx.raster.drawTilesForLevel(loc, tileCache, enqueueTile, {
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
					filterMode: this.resolveFilterMode(scaleL, ctx.upscaleFilter),
					wantTileKey: ctx.wantTileKey,
				});
				if (covL >= COVERAGE.backfill) break;
			}
		}

		// Draw base level
		gl.uniform1f(loc.u_alpha!, tileAlpha);
		ctx.raster.drawTilesForLevel(loc, tileCache, enqueueTile, {
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
			filterMode: this.resolveFilterMode(scale, ctx.upscaleFilter),
			wantTileKey: ctx.wantTileKey,
		});

		// Composite FBO onto the canvas at the desired raster opacity
		if (useFbo) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this._fboTex!);
			gl.uniform1f(loc.u_alpha!, layerAlpha);
			gl.uniform2f(loc.u_translate!, 0, 0);
			gl.uniform2f(loc.u_size!, ctx.canvas.width, ctx.canvas.height);
			gl.uniform2f(loc.u_uv0!, 0.0, 1.0);
			gl.uniform2f(loc.u_uv1!, 1.0, 0.0);
			if (loc.u_filterMode) gl.uniform1i(loc.u_filterMode, 0);
			if (loc.u_texel) gl.uniform2f(loc.u_texel, 1.0, 1.0);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			// Restore UVs for subsequent draws
			gl.uniform2f(loc.u_uv0!, 0.0, 0.0);
			gl.uniform2f(loc.u_uv1!, 1.0, 1.0);
		}
	}

	private resolveFilterMode(scale: number, mode?: UpscaleFilterMode): 'auto' | 'linear' | 'bicubic' {
		if (mode === 'linear' || mode === 'bicubic') {
			this._lastFilterMode = mode;
			return mode;
		}
		if (mode === 'auto') {
			const hysteresis = this.levelFilter(scale);
			return hysteresis === 'bicubic' ? 'auto' : 'linear';
		}
		return this.levelFilter(scale);
	}

	private levelFilter(scale: number): 'linear' | 'bicubic' {
		const enter = MapRenderer.FILTER_ENTER;
		const exit = MapRenderer.FILTER_EXIT;
		if (scale > enter) this._lastFilterMode = 'bicubic';
		else if (scale < exit) this._lastFilterMode = 'linear';
		// Inside the dead zone [exit, enter]: retain previous mode (true hysteresis)
		return this._lastFilterMode;
	}

	dispose() {
		const gl = this._gl;
		if (gl) {
			if (this._fboTex) try { gl.deleteTexture(this._fboTex); } catch { /* GL context may be lost */ }
			if (this._fbo) try { gl.deleteFramebuffer(this._fbo); } catch { /* GL context may be lost */ }
		}
		this._fbo = null;
		this._fboTex = null;
		this._fboW = 0;
		this._fboH = 0;
	}
}
