import type { RenderCtx } from '../types';
import * as Coords from '../coords';

export default class MapRenderer {
	private getCtx: () => RenderCtx;
	private hooks: {
		stepAnimation?: () => boolean;
		zoomVelocityTick?: () => void;
		panVelocityTick?: () => void;
	};
	private iconsUnlocked = false;

	constructor(getCtx: () => RenderCtx, hooks?: { stepAnimation?: () => boolean; zoomVelocityTick?: () => void; panVelocityTick?: () => void }) {
		this.getCtx = getCtx;
		this.hooks = hooks || {};
	}

	render() {
		const ctx = this.getCtx();
		const gl = ctx.gl;
		gl.clear(gl.COLOR_BUFFER_BIT);
		if (!(ctx.prog && ctx.loc && ctx.quad)) return;

		this.hooks.stepAnimation?.();
		this.hooks.zoomVelocityTick?.();
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
		const { zInt: baseZ, scale: levelScale } = Coords.zParts(ctx.zoom);
		const centerLevel = ctx.project(ctx.center.lng, ctx.center.lat, baseZ);
		let tlLevel = Coords.tlLevelFor(centerLevel, ctx.zoom, { x: widthCSS, y: heightCSS });
		const snap = (v: number) => Coords.snapLevelToDevice(v, levelScale, ctx.dpr);
		tlLevel = { x: snap(tlLevel.x), y: snap(tlLevel.y) };

		if (ctx.useScreenCache && ctx.screenCache) {
			ctx.screenCache.draw({ zInt: baseZ, scale: levelScale, tlWorld: tlLevel, widthCSS, heightCSS, dpr: ctx.dpr }, ctx.loc, ctx.prog, ctx.quad, ctx.canvas);
		}

		const imageReady = ctx.image.ready && !!ctx.image.texture;
		if (imageReady) {
			const tlWorld = Coords.levelToWorld(tlLevel, ctx.imageMaxZoom, baseZ);
			const scaleWorldToCss = Math.pow(2, ctx.zoom - ctx.imageMaxZoom);
			const translateCssBase = {
				x: -tlWorld.x * scaleWorldToCss,
				y: -tlWorld.y * scaleWorldToCss,
			};
			const sizeCss = {
				width: ctx.mapSize.width * scaleWorldToCss,
				height: ctx.mapSize.height * scaleWorldToCss,
			};
			const alpha = Math.max(0, Math.min(1, ctx.rasterOpacity ?? 1));
			gl.uniform1f(ctx.loc.u_alpha!, alpha);
			const draw = (offsetX: number) => {
				ctx.raster.drawImage(ctx.loc, {
					texture: ctx.image.texture!,
					translateCss: { x: translateCssBase.x + offsetX, y: translateCssBase.y },
					sizeCss,
					dpr: ctx.dpr,
					imageWidth: ctx.image.width,
					imageHeight: ctx.image.height,
					filterMode: ctx.upscaleFilter,
				});
			};
			if (ctx.wrapX) {
				const worldWidthCss = ctx.mapSize.width * scaleWorldToCss;
				const viewportWorldWidth = widthCSS / Math.max(1e-6, scaleWorldToCss);
				const start = Math.floor(tlWorld.x / ctx.mapSize.width) - 1;
				const end = Math.floor((tlWorld.x + viewportWorldWidth) / ctx.mapSize.width) + 1;
				for (let i = start; i <= end; i++) {
					draw(i * worldWidthCss);
				}
			} else {
				draw(0);
			}
			this.iconsUnlocked = true;
		}

		if (ctx.icons && this.iconsUnlocked) {
			gl.uniform1f(ctx.loc.u_alpha!, 1.0);
			if (ctx.loc.u_filterMode) gl.uniform1i(ctx.loc.u_filterMode, 0);
			ctx.icons.draw({
				gl: ctx.gl,
				prog: ctx.prog,
				loc: ctx.loc,
				quad: ctx.quad,
				canvas: ctx.canvas,
				dpr: ctx.dpr,
				zoom: ctx.zoom,
				center: ctx.center,
				minZoom: ctx.minZoom,
				maxZoom: ctx.maxZoom,
				container: ctx.container,
				project: (x: number, y: number, z: number) => ctx.project(x, y, z),
				wrapX: ctx.wrapX,
				iconScaleFunction: ctx.iconScaleFunction ?? undefined,
			});
		}

		if (ctx.useScreenCache && ctx.screenCache) {
			ctx.screenCache.update({ zInt: baseZ, scale: levelScale, tlWorld: tlLevel, widthCSS, heightCSS, dpr: ctx.dpr }, ctx.canvas);
		}
	}

	dispose() {}
}
