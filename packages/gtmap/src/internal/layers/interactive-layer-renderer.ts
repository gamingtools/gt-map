/**
 * InteractiveLayerRenderer -- per-layer renderer for interactive marker layers.
 *
 * Wraps its own IconManager (which owns an IconRenderer, IconAtlasManager,
 * IconInstanceBuffers). Shares VisualIconService at the map level.
 * Implements LayerRendererHandle for integration with LayerRegistry.
 */
import type { MarkerInternal, MarkerEventData, IconScaleFunction, SpriteAtlasDescriptor } from '../../api/types';
import type { SharedRenderCtx } from '../types';
import type { LayerRendererHandle } from './layer-registry';

import { IconManager, type IconDefInput } from '../markers/icon-manager';
import { MarkerEventManager } from '../markers/marker-event-manager';
import { LayerFBO } from '../render/layer-fbo';

/** Coverage threshold: how much tile coverage before we unlock icon rendering. */
const ICON_UNLOCK_COVERAGE = 0.5;

export interface InteractiveLayerRendererDeps {
	getGL(): WebGLRenderingContext;
	getContainer(): HTMLDivElement;
	getDpr(): number;
	getZoom(): number;
	getMinZoom(): number;
	getMaxZoom(): number;
	getCenter(): { x: number; y: number };
	getImageMaxZoom(): number;
	getZoomSnapThreshold(): number;
	debugWarn(msg: string, err?: unknown): void;
	debugLog(msg: string): void;
	requestRender(): void;
	clearScreenCache(): void;
	now(): number;
	getView(): { center: { x: number; y: number }; zoom: number; minZoom: number; maxZoom: number; wrapX: boolean };
	/** Optional: get tile coverage to determine icon unlock. */
	getTileCoverage?: (ctx: SharedRenderCtx) => number;
	/** Optional: get the map-level iconScaleFunction (fallback when per-layer is null). */
	getMapIconScaleFunction?: () => IconScaleFunction | null;
	/** Optional: get map-level sprite atlases for automatic loading. */
	getMapAtlases?: () => Array<{ url: string; descriptor: import('../../api/types').SpriteAtlasDescriptor; atlasId: string }>;
}

export class InteractiveLayerRenderer implements LayerRendererHandle {
	private _deps: InteractiveLayerRendererDeps;
	private _iconMgr: IconManager;
	private _markerEvents: MarkerEventManager;
	private _fbo = new LayerFBO();
	private _iconsUnlocked = false;

	constructor(deps: InteractiveLayerRendererDeps) {
		this._deps = deps;

		this._iconMgr = new IconManager({
			getGL: deps.getGL,
			debugWarn: deps.debugWarn,
			debugLog: deps.debugLog,
			requestRender: deps.requestRender,
			clearScreenCache: deps.clearScreenCache,
			...(deps.getMapAtlases ? { getMapAtlases: deps.getMapAtlases } : {}),
		});

		this._markerEvents = new MarkerEventManager({
			getContainer: deps.getContainer,
			getZoom: deps.getZoom,
			getMinZoom: deps.getMinZoom,
			getMaxZoom: deps.getMaxZoom,
			getDpr: deps.getDpr,
			getCenter: deps.getCenter,
			getImageMaxZoom: deps.getImageMaxZoom,
			getZoomSnapThreshold: deps.getZoomSnapThreshold,
			getIcons: () => this._iconMgr.icons,
			getIconScaleFunction: () => this._iconMgr.iconScaleFunction ?? this._deps.getMapIconScaleFunction?.() ?? null,
			debugWarn: deps.debugWarn,
			now: deps.now,
			getView: deps.getView,
		});
	}

	// -- Initialization --

	init(): void {
		this._iconMgr.init();
		this._markerEvents.initHitTesting();
	}

	// -- Icon/Marker API (delegates to IconManager) --

	async setIconDefs(defs: Record<string, IconDefInput>): Promise<void> {
		return this._iconMgr.setIconDefs(defs);
	}

	async loadSpriteAtlas(url: string, descriptor: SpriteAtlasDescriptor, atlasId: string): Promise<Record<string, string>> {
		return this._iconMgr.loadSpriteAtlas(url, descriptor, atlasId);
	}

	setMarkers(markers: MarkerInternal[]): void {
		const nextIds = new Set<string>(markers.map((m) => m.id).filter((id): id is string => typeof id === 'string' && id.length > 0));
		this._markerEvents.handleMarkersChanged(nextIds);
		this._iconMgr.setMarkers(markers);
	}

	setDecals(decals: MarkerInternal[]): void {
		this._iconMgr.setDecals(decals);
	}

	setIconScaleFunction(fn: IconScaleFunction | null): void {
		this._iconMgr.setIconScaleFunction(fn);
	}

	// -- Marker events --

	setMarkerData(payloads: Record<string, unknown | null | undefined>): void {
		this._markerEvents.setMarkerData(payloads);
	}

	onMarkerEvent(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', handler: (e: MarkerEventData) => void): () => void {
		return this._markerEvents.onMarkerEvent(name, handler);
	}

	emitMarker(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', payload: MarkerEventData): void {
		this._markerEvents.emitMarker(name, payload);
	}

	hitTest(px: number, py: number, requireAlpha = false) {
		return this._markerEvents.hitTest(px, py, requireAlpha);
	}

	computeHits(px: number, py: number) {
		return this._markerEvents.computeHits(px, py);
	}

	getMarkerDataById(id: string): unknown | undefined {
		return this._markerEvents.getMarkerDataById(id);
	}

	get lastHover() {
		return this._markerEvents.lastHover;
	}
	set lastHover(v: { type: string; idx: number; id?: string } | null) {
		this._markerEvents.lastHover = v;
	}

	get icons() {
		return this._iconMgr.icons;
	}

	get iconScaleFunction() {
		return this._iconMgr.iconScaleFunction ?? this._deps.getMapIconScaleFunction?.() ?? null;
	}

	get lastMarkers() {
		return this._iconMgr.lastMarkers;
	}

	// -- LayerRendererHandle --

	render(sharedCtx: unknown, opacity: number): void {
		const ctx = sharedCtx as SharedRenderCtx;
		const gl = ctx.gl;
		const icons = this._iconMgr.icons;
		if (!icons) return;

		// Check icon unlock: need at least 50% tile coverage before showing markers
		if (!this._iconsUnlocked) {
			const getCoverage = this._deps.getTileCoverage;
			if (getCoverage) {
				const cov = getCoverage(ctx);
				if (cov >= ICON_UNLOCK_COVERAGE) this._iconsUnlocked = true;
			} else {
				// No tile layers to wait for -- unlock immediately
				this._iconsUnlocked = true;
			}
		}
		if (!this._iconsUnlocked) return;

		const layerAlpha = Math.max(0, Math.min(1, opacity));
		const useFbo = layerAlpha < 1.0 && this._fbo.ensure(gl, ctx.canvas.width, ctx.canvas.height);
		if (useFbo) {
			this._fbo.bind(gl);
		}

		gl.uniform1f(ctx.loc.u_alpha!, 1.0);
		if (ctx.loc.u_filterMode) gl.uniform1i(ctx.loc.u_filterMode, 0);

		const iconScaleFunction = this._iconMgr.iconScaleFunction ?? this._deps.getMapIconScaleFunction?.() ?? null;
		icons.draw({
			gl: ctx.gl,
			prog: ctx.prog,
			loc: ctx.loc,
			quad: ctx.quad,
			canvas: ctx.canvas,
			dpr: ctx.dpr,
			zoom: ctx.zoom,
			center: ctx.center,
			baseZ: ctx.baseZ,
			levelScale: ctx.levelScale,
			tlWorld: ctx.tlWorld,
			minZoom: ctx.minZoom,
			maxZoom: ctx.maxZoom,
			container: ctx.container,
			viewport: { width: ctx.widthCSS, height: ctx.heightCSS },
			project: (x: number, y: number, z: number) => ctx.project(x, y, z),
			wrapX: ctx.wrapX,
			...(iconScaleFunction !== undefined ? { iconScaleFunction } : {}),
		});

		if (useFbo) {
			// Restore main shader state before composite
			gl.useProgram(ctx.prog);
			gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
			gl.enableVertexAttribArray(ctx.loc.a_pos);
			gl.vertexAttribPointer(ctx.loc.a_pos, 2, gl.FLOAT, false, 0, 0);
			gl.uniform2f(ctx.loc.u_resolution!, ctx.canvas.width, ctx.canvas.height);
			gl.uniform1i(ctx.loc.u_tex!, 0);
			this._fbo.unbindAndComposite(gl, ctx.loc, layerAlpha, ctx.canvas.width, ctx.canvas.height);
		}
	}

	dispose(): void {
		this._iconMgr.dispose();
		this._fbo.dispose();
	}

	rebuild(_gl: WebGLRenderingContext): void {
		this._iconMgr.rebuild();
	}

	requestMaskBuild(): void {
		this._iconMgr.requestMaskBuild();
	}
}
