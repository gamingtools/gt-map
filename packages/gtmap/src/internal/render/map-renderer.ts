import type { SharedRenderCtx } from '../types';
import type { LayerRegistry } from '../layers/layer-registry';
import type { ScreenCache } from './screen-cache';
import type { ProgramLocs } from './screen-cache';
import type { PixelPoint } from '../context/view-state';
import * as Coords from '../coords';

/** Minimal context that MapRenderer needs from the coordinator each frame. */
export interface FrameCtx {
	gl: WebGLRenderingContext;
	prog: WebGLProgram;
	loc: ProgramLocs;
	quad: WebGLBuffer;
	canvas: HTMLCanvasElement;
	dpr: number;
	container: HTMLElement;
	zoom: number;
	center: PixelPoint;
	minZoom: number;
	maxZoom: number;
	imageMaxZoom: number;
	mapSize: { width: number; height: number };
	wrapX: boolean;
	zoomSnapThreshold: number;
	useScreenCache: boolean;
	screenCache: ScreenCache | null;
	project(x: number, y: number, z: number): { x: number; y: number };
}

export default class MapRenderer {
	private getCtx: () => FrameCtx;
	private hooks: {
		stepAnimation?: () => boolean;
		panVelocityTick?: () => void;
	};
	private _layerRegistry: LayerRegistry | null = null;

	constructor(
		getCtx: () => FrameCtx,
		hooks?: {
			stepAnimation?: () => boolean;
			panVelocityTick?: () => void;
		},
	) {
		this.getCtx = getCtx;
		this.hooks = hooks || {};
	}

	/** Set the layer registry for user-created layers. */
	setLayerRegistry(registry: LayerRegistry | null): void {
		this._layerRegistry = registry;
	}

	render() {
		const ctx = this.getCtx();
		const gl = ctx.gl;
		gl.clear(gl.COLOR_BUFFER_BIT);
		if (!(ctx.prog && ctx.loc && ctx.quad)) return;

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
			maxZoom: ctx.imageMaxZoom,
		});
		const baseZ = view.baseZ;
		const levelScale = view.scale;
		const tlLevel = view.tlLevel;

		// Render all layers in z-order
		const layerReg = this._layerRegistry;
		if (layerReg && layerReg.size > 0) {
			const sharedCtx: SharedRenderCtx = {
				gl, prog: ctx.prog, loc: ctx.loc, quad: ctx.quad,
				canvas: ctx.canvas, dpr: ctx.dpr, container: ctx.container,
				zoom: ctx.zoom, center: ctx.center,
				minZoom: ctx.minZoom, maxZoom: ctx.maxZoom,
				imageMaxZoom: ctx.imageMaxZoom, mapSize: ctx.mapSize,
				wrapX: ctx.wrapX, zoomSnapThreshold: ctx.zoomSnapThreshold,
				baseZ, levelScale, tlWorld: tlLevel,
				widthCSS, heightCSS,
				project: (x: number, y: number, z: number) => ctx.project(x, y, z),
				useScreenCache: ctx.useScreenCache,
				screenCache: ctx.screenCache,
			};

			for (const entry of layerReg.getSorted()) {
				if (!entry.state.visible || !entry.renderer) continue;
				entry.renderer.render(sharedCtx, entry.state.opacity);
				// Restore main shader state after each layer
				gl.useProgram(ctx.prog);
				gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
				gl.enableVertexAttribArray(ctx.loc.a_pos);
				gl.vertexAttribPointer(ctx.loc.a_pos, 2, gl.FLOAT, false, 0, 0);
				gl.uniform2f(ctx.loc.u_resolution!, ctx.canvas.width, ctx.canvas.height);
				gl.uniform1i(ctx.loc.u_tex!, 0);
				gl.uniform1f(ctx.loc.u_alpha!, 1.0);
			}
		}

		if (ctx.useScreenCache && ctx.screenCache) {
			ctx.screenCache.update({ zInt: baseZ, scale: levelScale, tlWorld: tlLevel, widthCSS, heightCSS, dpr: ctx.dpr }, ctx.canvas);
		}
	}
}
