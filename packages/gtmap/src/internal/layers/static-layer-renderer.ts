/**
 * StaticLayerRenderer -- per-layer renderer for vector overlay layers.
 *
 * Owns a VectorLayer (Canvas2D rasterization + WebGL overlay compositing).
 * Implements LayerRendererHandle for integration with LayerRegistry.
 */
import type { VectorPrimitive, SharedRenderCtx } from '../types';
import type { LayerRendererHandle } from './layer-registry';

import { VectorLayer } from './vector-layer';
import { LayerFBO } from '../render/layer-fbo';

export interface StaticLayerRendererDeps {
	getContainer(): HTMLDivElement;
	getGL(): WebGLRenderingContext;
	getDpr(): number;
	getZoom(): number;
	getCenter(): { x: number; y: number };
	getImageMaxZoom(): number;
	requestRender(): void;
	debugWarn(msg: string, err?: unknown): void;
}

export class StaticLayerRenderer implements LayerRendererHandle {
	private _deps: StaticLayerRendererDeps;
	private _vectorLayer: VectorLayer | null = null;
	private _pendingVectors: VectorPrimitive[] | null = null;
	private _fbo = new LayerFBO();

	constructor(deps: StaticLayerRendererDeps) {
		this._deps = deps;
	}

	// -- Initialization --

	init(): void {
		const d = this._deps;
		this._vectorLayer = new VectorLayer({
			getContainer: d.getContainer,
			getGL: d.getGL,
			getDpr: d.getDpr,
			getZoom: d.getZoom,
			getCenter: d.getCenter,
			getImageMaxZoom: d.getImageMaxZoom,
		});
		this._vectorLayer.init();
		if (this._pendingVectors && this._pendingVectors.length) {
			this._vectorLayer.setVectors(this._pendingVectors);
			this._pendingVectors = null;
		}
	}

	// -- Vector API --

	setVectors(vectors: VectorPrimitive[]): void {
		if (!this._vectorLayer) {
			this._pendingVectors = vectors.slice();
			return;
		}
		this._vectorLayer.setVectors(vectors);
		this._deps.requestRender();
	}

	// -- LayerRendererHandle --

	prepareFrame(): void {
		this._vectorLayer?.draw();
	}

	render(sharedCtx: unknown, opacity: number): void {
		const ctx = sharedCtx as SharedRenderCtx;
		const gl = ctx.gl;

		if (!this._vectorLayer?.hasVectors()) return;

		const layerAlpha = Math.max(0, Math.min(1, opacity));
		const useFbo = layerAlpha < 1.0 && this._fbo.ensure(gl, ctx.canvas.width, ctx.canvas.height);
		if (useFbo) {
			this._fbo.bind(gl);
		}

		gl.useProgram(ctx.prog);
		gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
		gl.enableVertexAttribArray(ctx.loc.a_pos);
		gl.vertexAttribPointer(ctx.loc.a_pos, 2, gl.FLOAT, false, 0, 0);
		gl.uniform2f(ctx.loc.u_resolution!, ctx.canvas.width, ctx.canvas.height);
		gl.uniform1i(ctx.loc.u_tex!, 0);
		gl.uniform1f(ctx.loc.u_alpha!, 1.0);

		this._vectorLayer.drawOverlay();

		if (useFbo) {
			this._fbo.unbindAndComposite(gl, ctx.loc, layerAlpha, ctx.canvas.width, ctx.canvas.height);
		}
	}

	dispose(): void {
		this._vectorLayer?.dispose();
		this._vectorLayer = null;
		this._fbo.dispose();
	}

	rebuild(_gl: WebGLRenderingContext): void {
		const d = this._deps;
		try {
			const currentVectors = this._vectorLayer?.getVectors() ?? [];
			this._vectorLayer?.dispose();
			this._vectorLayer = new VectorLayer({
				getContainer: d.getContainer,
				getGL: d.getGL,
				getDpr: d.getDpr,
				getZoom: d.getZoom,
				getCenter: d.getCenter,
				getImageMaxZoom: d.getImageMaxZoom,
			});
			this._vectorLayer.init();
			if (currentVectors.length) {
				this._vectorLayer.setVectors(currentVectors);
			}
		} catch (e) {
			d.debugWarn('GL reinit vectors', e);
		}
	}

	resize(w: number, h: number): void {
		this._vectorLayer?.resize(w, h);
	}
}
