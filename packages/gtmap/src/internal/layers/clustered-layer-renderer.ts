/**
 * ClusteredLayerRenderer -- per-layer renderer for clustered marker layers.
 *
 * Composes:
 * - IconManager (renders cluster icons + individual unclustered markers)
 * - MarkerEventManager (hit-testing for clusters and singles)
 * - VectorLayer (optional cluster boundary polygons via Canvas2D)
 * - ClusterEngine (spatial clustering algorithm)
 * - LayerFBO (opacity compositing)
 *
 * Implements LayerRendererHandle for integration with LayerRegistry.
 */
import type { MarkerInternal, MarkerEventData, SpriteAtlasDescriptor, VectorPrimitiveInternal } from '../../api/types';
import type { ClusteredLayerOptions, ClusterBoundaryOptions, ClusterIconSizeFunction, ClusterSnapshot, ClusterEventData } from '../../api/layers/types';
import { clusterIconSize } from '../../api/layers/types';
import type { SharedRenderCtx } from '../types';
import type { LayerRendererHandle } from './layer-registry';

import { IconManager, type IconDefInput } from '../markers/icon-manager';
import { MarkerEventManager } from '../markers/marker-event-manager';
import { VectorLayer } from './vector-layer';
import { ClusterEngine, type ClusterData, type ClusterResult } from './cluster-engine';
import { ClusterWorkerClient } from './cluster-worker-client';
import { convexHull } from './convex-hull';
import { LayerFBO } from '../render/layer-fbo';

/** Coverage threshold: how much tile coverage before we unlock icon rendering. */
const ICON_UNLOCK_COVERAGE = 0.5;

export interface ClusteredLayerRendererDeps {
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
	/** Optional: get map-level sprite atlases for automatic loading. */
	getMapAtlases?: () => Array<{ url: string; descriptor: SpriteAtlasDescriptor; atlasId: string }>;
}

export class ClusteredLayerRenderer implements LayerRendererHandle {
	private _deps: ClusteredLayerRendererDeps;
	private _iconMgr: IconManager;
	private _markerEvents: MarkerEventManager;
	private _vectorLayer: VectorLayer | null = null;
	private _clusterEngine = new ClusterEngine();
	private _clusterWorker: ClusterWorkerClient;
	private _fbo = new LayerFBO();
	private _iconsUnlocked = false;
	private _latestWorkerToken = 0;

	// Cluster config (set from layer options)
	private _clusterRadius = 80;
	private _minClusterSize = 2;
	private _clusterIconSizeFunction: ClusterIconSizeFunction = clusterIconSize('logarithmic');
	private _boundary: ClusterBoundaryOptions | undefined;

	// State tracking
	private _rawMarkers: MarkerInternal[] = [];
	private _markerData: Record<string, unknown | null | undefined> = {};
	private _lastClusters: ClusterData[] = [];
	private _lastZoomFloor = -1;
	private _markersDirty = true;
	private _optionsDirty = false;
	private _boundaryEnabled = false;

	// Hover-boundary state
	private _showOnHover = false;
	private _hoveredClusterId: string | null = null;

	// Map from synthetic cluster marker id -> ClusterData
	private _clusterIdMap = new Map<string, ClusterData>();

	constructor(deps: ClusteredLayerRendererDeps, opts?: ClusteredLayerOptions) {
		this._deps = deps;

		if (opts) {
			this._clusterRadius = opts.clusterRadius ?? 80;
			this._minClusterSize = opts.minClusterSize ?? 2;
			this._clusterIconSizeFunction = opts.clusterIconSizeFunction ?? clusterIconSize('logarithmic');
			this._boundary = opts.boundary;
		}
		this._boundaryEnabled = !!this._boundary;
		this._showOnHover = !!this._boundary?.showOnHover;

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
			getIconScaleFunction: () => this._iconMgr.iconScaleFunction,
			debugWarn: deps.debugWarn,
			now: deps.now,
			getView: deps.getView,
		});
		this._clusterWorker = new ClusterWorkerClient({
			debugWarn: deps.debugWarn,
		});
	}

	// -- Initialization --

	init(): void {
		this._iconMgr.init();
		this._markerEvents.initHitTesting();

		// Initialize VectorLayer for boundary polygons if enabled
		if (this._boundaryEnabled) {
			this._initVectorLayer();
		}

		// Wire internal hover events for showOnHover boundary mode
		this._wireHoverBoundary();
	}

	private _initVectorLayer(): void {
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
	}

	// -- Icon/Marker API (delegates to IconManager) --

	async setIconDefs(defs: Record<string, IconDefInput>): Promise<void> {
		return this._iconMgr.setIconDefs(defs);
	}

	async loadSpriteAtlas(url: string, descriptor: SpriteAtlasDescriptor, atlasId: string): Promise<Record<string, string>> {
		return this._iconMgr.loadSpriteAtlas(url, descriptor, atlasId);
	}

	setMarkers(markers: MarkerInternal[]): void {
		this._rawMarkers = markers;
		this._markersDirty = true;
		this._deps.requestRender();
	}

	// -- Marker events --

	setMarkerData(payloads: Record<string, unknown | null | undefined>): void {
		this._markerData = payloads;
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
		return this._iconMgr.iconScaleFunction;
	}

	get lastMarkers() {
		return this._iconMgr.lastMarkers;
	}

	// -- Cluster options --

	onOptionsChanged(opts: ClusteredLayerOptions): void {
		this._clusterRadius = opts.clusterRadius ?? this._clusterRadius;
		this._minClusterSize = opts.minClusterSize ?? this._minClusterSize;
		this._clusterIconSizeFunction = opts.clusterIconSizeFunction ?? this._clusterIconSizeFunction;
		this._boundary = opts.boundary;

		const needBoundary = !!this._boundary;
		if (needBoundary && !this._vectorLayer) {
			this._initVectorLayer();
		} else if (!needBoundary && this._vectorLayer) {
			this._vectorLayer.dispose();
			this._vectorLayer = null;
		}
		this._boundaryEnabled = needBoundary;
		this._showOnHover = !!this._boundary?.showOnHover;

		this._clusterEngine.invalidate();
		this._optionsDirty = true;
		this._markersDirty = true;
		this._deps.requestRender();
	}

	getClusters(): ClusterSnapshot[] {
		return this._lastClusters.map((c) => ({
			id: c.id,
			x: c.x,
			y: c.y,
			size: c.size,
			markerIds: this._getClusterMarkerIds(c),
		}));
	}

	getClusterForMarkerId(markerId: string): ClusterEventData | undefined {
		const cluster = this._clusterIdMap.get(markerId);
		if (!cluster) return undefined;
		return {
			clusterId: cluster.id,
			size: cluster.size,
			center: { x: cluster.x, y: cluster.y },
			markerIds: this._getClusterMarkerIds(cluster),
		};
	}

	private _getClusterMarkerIds(cluster: ClusterData): string[] {
		const indices = cluster.markerIndices.length > 0 ? cluster.markerIndices : this._clusterEngine.resolveMarkerIndices(cluster);
		return indices.map((idx) => this._rawMarkers[idx]).filter((m): m is MarkerInternal => !!m).map((m) => m.id);
	}

	private _applyClusterResult(result: ClusterResult): void {
		this._lastClusters = result.clusters;
		this._clusterIdMap.clear();

		// Build the combined marker list for IconManager:
		// - Clusters become synthetic markers at centroid, scaled by clusterIconSizeFunction
		// - Singles pass through as-is
		// maxClusterSize is computed lazily in the first pass and used for adaptive scaling.
		const allMarkers: MarkerInternal[] = [];
		const visibleData: Record<string, unknown | null | undefined> = {};
		const clusters = result.clusters;

		let maxClusterSize = 1;
		for (const c of clusters) {
			if (c.size > maxClusterSize) maxClusterSize = c.size;
		}

		for (const cluster of clusters) {
			// Use the first cluster member as representative for icon style.
			const representative = this._rawMarkers[cluster.representativeIndex];
			if (!representative) continue;
			const scale = this._clusterIconSizeFunction(cluster.size, maxClusterSize);
			const syntheticId = `__cl_${cluster.id}`;

			allMarkers.push({
				x: cluster.x,
				y: cluster.y,
				type: representative.type,
				size: representative.size !== undefined ? representative.size * scale : scale,
				rotation: 0,
				id: syntheticId,
			});

			// Map synthetic id -> cluster for event resolution
			this._clusterIdMap.set(syntheticId, cluster);
			visibleData[syntheticId] = this._markerData[representative.id];
		}

		for (const singleIdx of result.singlesIndices) {
			const single = this._rawMarkers[singleIdx];
			if (!single) continue;
			allMarkers.push(single);
			visibleData[single.id] = this._markerData[single.id];
		}

		// Push to IconManager
		const nextIds = new Set<string>(allMarkers.map((m) => m.id));
		this._markerEvents.handleMarkersChanged(nextIds);
		this._iconMgr.setMarkers(allMarkers);
		this._markerEvents.setMarkerData(visibleData);

		// Update boundary polygons if enabled
		if (this._boundaryEnabled && this._vectorLayer) {
			if (this._showOnHover) {
				// In hover mode, only render the hovered cluster's boundary (lazy).
				this._updateHoverBoundary();
			} else {
				const boundaryStyle = this._boundary ?? {};
				const vectors: VectorPrimitiveInternal[] = result.clusters
					.filter((c) => c.bounds.length >= 3)
					.map((c) => ({
						type: 'polygon' as const,
						points: c.bounds.map((p) => ({ x: p.x, y: p.y })),
						style: {
							color: boundaryStyle.color ?? 'rgba(0,100,255,0.4)',
							weight: boundaryStyle.weight ?? 1.5,
							opacity: boundaryStyle.opacity ?? 1,
							fill: boundaryStyle.fill !== false,
							fillColor: boundaryStyle.fillColor ?? 'rgba(0,100,255,0.1)',
							fillOpacity: boundaryStyle.fillOpacity ?? 0.15,
						},
					}));
				this._vectorLayer.setVectors(vectors);
			}
		}
	}

	// -- Clustering logic --

	private _recompute(): void {
		const zoom = this._deps.getZoom();
		const zoomFloor = Math.floor(zoom);
		const needsRecompute = this._markersDirty || this._optionsDirty || zoomFloor !== this._lastZoomFloor;

		if (!needsRecompute) return;

		const markersChanged = this._markersDirty || this._optionsDirty;
		this._lastZoomFloor = zoomFloor;
		this._markersDirty = false;
		this._optionsDirty = false;

		const imageMaxZoom = this._deps.getImageMaxZoom();
		// When showOnHover is active, skip pre-computing bounds for all clusters;
		// the hull is lazily computed only for the hovered cluster.
		const includeBounds = this._boundaryEnabled && !this._showOnHover;
		if (this._clusterWorker.enabled) {
			const token = ++this._latestWorkerToken;
			this._clusterWorker.request(
				{
					markers: this._rawMarkers,
					markersChanged,
					zoom,
					radius: this._clusterRadius,
					minSize: this._minClusterSize,
					imageMaxZoom,
					includeBounds,
					includeMembers: true,
				},
				(result) => {
					if (token !== this._latestWorkerToken) return;
					this._applyClusterResult(result);
					this._deps.requestRender();
				},
			);
			return;
		}

		const result = this._clusterEngine.compute(this._rawMarkers, zoom, this._clusterRadius, this._minClusterSize, imageMaxZoom, includeBounds, false);
		this._applyClusterResult(result);
	}

	// -- Hover boundary --

	/** Subscribe to internal marker enter/leave to drive showOnHover boundaries. */
	private _wireHoverBoundary(): void {
		this._markerEvents.onMarkerEvent('enter', (e) => {
			if (!this._showOnHover || !this._boundaryEnabled) return;
			const id = e?.marker?.id;
			if (!id || !id.startsWith('__cl_')) return;
			const clusterId = id.slice('__cl_'.length);
			if (this._hoveredClusterId === clusterId) return;
			this._hoveredClusterId = clusterId;
			this._updateHoverBoundary();
		});
		this._markerEvents.onMarkerEvent('leave', () => {
			if (!this._showOnHover || !this._boundaryEnabled) return;
			if (this._hoveredClusterId === null) return;
			this._hoveredClusterId = null;
			this._updateHoverBoundary();
		});
	}

	/** Compute and render the boundary polygon for the currently hovered cluster. */
	private _updateHoverBoundary(): void {
		if (!this._vectorLayer) return;
		const boundaryStyle = this._boundary ?? {};

		if (this._hoveredClusterId === null) {
			this._vectorLayer.setVectors([]);
			this._vectorLayer.draw();
			this._deps.requestRender();
			return;
		}

		// Find the cluster data for the hovered id
		const cluster = this._lastClusters.find((c) => c.id === this._hoveredClusterId);
		if (!cluster) {
			this._vectorLayer.setVectors([]);
			this._vectorLayer.draw();
			this._deps.requestRender();
			return;
		}

		// Lazily compute convex hull from member marker positions
		const indices = cluster.markerIndices.length > 0 ? cluster.markerIndices : this._clusterEngine.resolveMarkerIndices(cluster);
		const points = indices
			.map((idx) => this._rawMarkers[idx])
			.filter((m): m is MarkerInternal => !!m)
			.map((m) => ({ x: m.x, y: m.y }));

		if (points.length < 3) {
			this._vectorLayer.setVectors([]);
			this._vectorLayer.draw();
			this._deps.requestRender();
			return;
		}

		const hull = convexHull(points);
		const vectors: VectorPrimitiveInternal[] = [{
			type: 'polygon' as const,
			points: hull.map((p) => ({ x: p.x, y: p.y })),
			style: {
				color: boundaryStyle.color ?? 'rgba(0,100,255,0.4)',
				weight: boundaryStyle.weight ?? 1.5,
				opacity: boundaryStyle.opacity ?? 1,
				fill: boundaryStyle.fill !== false,
				fillColor: boundaryStyle.fillColor ?? 'rgba(0,100,255,0.1)',
				fillOpacity: boundaryStyle.fillOpacity ?? 0.15,
			},
		}];
		this._vectorLayer.setVectors(vectors);
		this._vectorLayer.draw();
		this._deps.requestRender();
	}

	// -- LayerRendererHandle --

	prepareFrame(): void {
		this._recompute();
		// Rasterize boundary polygons to canvas
		this._vectorLayer?.draw();
	}

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
				this._iconsUnlocked = true;
			}
		}
		if (!this._iconsUnlocked) return;

		const layerAlpha = Math.max(0, Math.min(1, opacity));
		const useFbo = layerAlpha < 1.0 && this._fbo.ensure(gl, ctx.canvas.width, ctx.canvas.height);
		if (useFbo) {
			this._fbo.bind(gl);
		}

		// Draw boundary polygons first (behind icons)
		if (this._boundaryEnabled && this._vectorLayer?.hasVectors()) {
			this._vectorLayer.drawOverlay();
		}

		// Restore shared program state for icon draw
		gl.useProgram(ctx.prog);
		gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
		gl.enableVertexAttribArray(ctx.loc.a_pos);
		gl.vertexAttribPointer(ctx.loc.a_pos, 2, gl.FLOAT, false, 0, 0);
		gl.uniform2f(ctx.loc.u_resolution!, ctx.canvas.width, ctx.canvas.height);
		gl.uniform1i(ctx.loc.u_tex!, 0);
		gl.uniform1f(ctx.loc.u_alpha!, 1.0);
		if (ctx.loc.u_filterMode) gl.uniform1i(ctx.loc.u_filterMode, 0);

		// Clustered layers never apply iconScaleFunction -- icon sizing is handled
		// exclusively by ClusterIconSizeFunction (baked into marker size).
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
		});

		if (useFbo) {
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
		this._clusterWorker.dispose();
		this._vectorLayer?.dispose();
		this._vectorLayer = null;
		this._fbo.dispose();
		this._clusterIdMap.clear();
		this._lastClusters = [];
		this._hoveredClusterId = null;
	}

	rebuild(_gl: WebGLRenderingContext): void {
		this._iconMgr.rebuild();
		if (this._boundaryEnabled && this._vectorLayer) {
			const d = this._deps;
			try {
				const currentVectors = this._vectorLayer.getVectors();
				this._vectorLayer.dispose();
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
				d.debugWarn('GL reinit clustered vectors', e);
			}
		}
	}

	resize(w: number, h: number): void {
		this._vectorLayer?.resize(w, h);
	}

	requestMaskBuild(): void {
		this._iconMgr.requestMaskBuild();
	}
}
