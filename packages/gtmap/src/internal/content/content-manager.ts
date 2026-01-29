/**
 * ContentManager -- manages icons, markers, decals, vectors, and hit testing.
 *
 * Owns IconRenderer, VectorLayer, MarkerHitTesting, marker event sinks,
 * and pending queues for pre-init buffering.
 */
import type { MarkerEventData, MarkerInternal, UpscaleFilterMode, IconScaleFunction } from '../../api/types';
import type { VectorPrimitive } from '../types';
import type { MapContext } from '../context/map-context';
import { IconRenderer } from '../layers/icons';
import { VectorLayer } from '../layers/vector-layer';
import { MarkerHitTesting } from '../events/marker-hit-testing';

export type IconDefInput = { iconPath: string; x2IconPath?: string; width: number; height: number };
export type MarkerEventName = 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress';

export class ContentManager {
	private ctx: MapContext;

	// Icon renderer
	private _icons: IconRenderer | null = null;
	private _pendingIconDefs: Record<string, IconDefInput> | null = null;
	private _allIconDefs: Record<string, IconDefInput> = {};
	private _pendingMarkers: MarkerInternal[] | null = null;
	private _pendingDecals: MarkerInternal[] | null = null;
	private _lastMarkers: MarkerInternal[] = [];
	private _lastDecals: MarkerInternal[] = [];

	// Vector layer
	private _vectorLayer: VectorLayer | null = null;
	private _pendingVectors: VectorPrimitive[] | null = null;

	// Rendering options
	rasterOpacity = 1.0;
	upscaleFilter: UpscaleFilterMode = 'linear';
	iconScaleFunction: IconScaleFunction | null = null;

	// Marker hit testing
	private _hitTesting: MarkerHitTesting | null = null;
	private _lastHover: { type: string; idx: number; id?: string } | null = null;
	private _markerSinks: Record<MarkerEventName, Set<(e: MarkerEventData) => void>> = {
		enter: new Set(),
		leave: new Set(),
		click: new Set(),
		down: new Set(),
		up: new Set(),
		longpress: new Set(),
	};
	private _markerData = new Map<string, unknown | null | undefined>();

	// Mask build
	private _maskBuildRequested = false;

	constructor(ctx: MapContext) {
		this.ctx = ctx;
	}

	// -- Init phases --

	initRenderers(): void {
		const gl = this.ctx.gl!;
		this._icons = new IconRenderer(gl);

		// Apply pending icon defs from before renderer was ready
		if (this._pendingIconDefs) {
			const defs = this._pendingIconDefs;
			this._pendingIconDefs = null;
			void this.setIconDefs(defs);
		}
		// Apply pending markers
		if (this._pendingMarkers && this._pendingMarkers.length) {
			const m = this._pendingMarkers.slice();
			this._pendingMarkers = null;
			this.setMarkers(m);
		}
		// Apply pending decals
		if (this._pendingDecals && this._pendingDecals.length) {
			const d = this._pendingDecals.slice();
			this._pendingDecals = null;
			this.setDecals(d);
		}
	}

	initVectorLayer(): void {
		const ctx = this.ctx;
		this._vectorLayer = new VectorLayer({
			getContainer: () => ctx.container,
			getGL: () => ctx.gl!,
			getDpr: () => ctx.viewState.dpr,
			getZoom: () => ctx.viewState.zoom,
			getCenter: () => ctx.viewState.center,
			getImageMaxZoom: () => ctx.viewState.imageMaxZoom,
		});
		this._vectorLayer.init();
		// Apply pending vectors
		if (this._pendingVectors && this._pendingVectors.length) {
			const v = this._pendingVectors.slice();
			this._pendingVectors = null;
			this._vectorLayer.setVectors(v);
		}
	}

	initHitTesting(): void {
		const ctx = this.ctx;
		this._hitTesting = new MarkerHitTesting({
			getContainer: () => ctx.container,
			getZoom: () => ctx.viewState.zoom,
			getMinZoom: () => ctx.viewState.minZoom,
			getMaxZoom: () => ctx.viewState.maxZoom,
			getCenter: () => ctx.viewState.center,
			getImageMaxZoom: () => ctx.viewState.imageMaxZoom,
			getIcons: () => this._icons,
			getIconScaleFunction: () => this.iconScaleFunction,
		});
	}

	// -- Icon management --

	async setIconDefs(defs: Record<string, IconDefInput>): Promise<void> {
		for (const k of Object.keys(defs)) this._allIconDefs[k] = defs[k]!;
		if (!this._icons) {
			if (!this._pendingIconDefs) this._pendingIconDefs = {};
			for (const k of Object.keys(defs)) this._pendingIconDefs[k] = defs[k]!;
			return;
		}
		try {
			await this._icons.loadIcons(defs);
		} catch (err) {
			if (typeof console !== 'undefined' && console.warn) {
				console.warn('[GTMap] Icon loading failed:', err);
			}
		}
		this.clearScreenCache();
		this.ctx.requestRender();
	}

	setMarkers(markers: MarkerInternal[]): void {
		try {
			this._lastMarkers = markers.slice();
		} catch {
			this._lastMarkers = markers;
		}
		if (!this._icons) {
			this._pendingMarkers = markers.slice();
			return;
		}
		try {
			const nextIds = new Set<string>(markers.map((m) => m.id).filter((id): id is string => typeof id === 'string' && id.length > 0));
			if (this._lastHover && this._lastHover.id && !nextIds.has(this._lastHover.id)) {
				const prev = this._lastHover;
				const now = this.ctx.now();
				this.emitMarker('leave', {
					now,
					view: this.ctx.viewState.toPublic(),
					screen: { x: -1, y: -1 },
					marker: { id: prev.id || '', index: prev.idx ?? -1, world: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
					icon: { id: prev.type, iconPath: '', width: 0, height: 0, anchorX: 0, anchorY: 0 },
				});
				this._lastHover = null;
			}
		} catch {}
		this._icons.setMarkers(markers);
		this.ctx.debug.log(`setMarkers count=${markers.length}`);
		this.clearScreenCache();
		this.ctx.requestRender();
	}

	setDecals(decals: MarkerInternal[]): void {
		try {
			this._lastDecals = decals.slice();
		} catch {
			this._lastDecals = decals;
		}
		if (!this._icons) {
			this._pendingDecals = decals.slice();
			return;
		}
		this._icons.setDecals?.(decals);
		this.ctx.debug.log(`setDecals count=${decals.length}`);
		this.clearScreenCache();
		this.ctx.requestRender();
	}

	setVectors(vectors: VectorPrimitive[]): void {
		if (!this._vectorLayer) {
			this._pendingVectors = vectors.slice();
			return;
		}
		this._vectorLayer.setVectors(vectors);
		this.ctx.requestRender();
	}

	setUpscaleFilter(mode: UpscaleFilterMode): void {
		const next = mode === 'linear' || mode === 'bicubic' ? mode : 'auto';
		if (next !== this.upscaleFilter) {
			this.upscaleFilter = next;
			this.clearScreenCache();
			this.ctx.requestRender();
		}
	}

	setRasterOpacity(opacity: number): void {
		const v = Math.max(0, Math.min(1, opacity));
		if (v !== this.rasterOpacity) {
			this.rasterOpacity = v;
			this.ctx.requestRender();
		}
	}

	setIconScaleFunction(fn: IconScaleFunction | null): void {
		this.iconScaleFunction = fn;
		this.clearScreenCache();
		this.ctx.requestRender();
	}

	setMarkerData(payloads: Record<string, unknown | null | undefined>): void {
		try {
			for (const k of Object.keys(payloads)) this._markerData.set(k, payloads[k]);
		} catch {}
	}

	// -- Marker events --

	onMarkerEvent(name: MarkerEventName, handler: (e: MarkerEventData) => void): () => void {
		const set = this._markerSinks[name];
		set.add(handler);
		return () => set.delete(handler);
	}

	emitMarker(name: MarkerEventName, payload: MarkerEventData): void {
		const set = this._markerSinks[name];
		if (!set || set.size === 0) return;
		for (const fn of Array.from(set)) {
			try {
				fn(payload);
			} catch {}
		}
	}

	hitTestMarker(px: number, py: number, requireAlpha = false) {
		return this._hitTesting?.hitTest(px, py, requireAlpha) ?? null;
	}

	computeMarkerHits(px: number, py: number) {
		return this._hitTesting?.computeAllHits(px, py) ?? [];
	}

	getMarkerDataById(id: string): unknown | undefined {
		return this._markerData.get(id);
	}

	get lastHover() {
		return this._lastHover;
	}
	set lastHover(v: { type: string; idx: number; id?: string } | null) {
		this._lastHover = v;
	}

	// -- Render helpers (called during frame) --

	get icons(): IconRenderer | null {
		return this._icons;
	}

	getVectorZIndices(): number[] {
		if (!this._vectorLayer) return [];
		return this._vectorLayer.hasVectors() ? [0] : [];
	}

	drawVectors(): void {
		this._vectorLayer?.draw();
	}

	drawVectorOverlay(): void {
		this._vectorLayer?.drawOverlay();
	}

	resizeVectorLayer(w: number, h: number): void {
		this._vectorLayer?.resize(w, h);
	}

	requestMaskBuild(): void {
		if (this._maskBuildRequested) return;
		this._maskBuildRequested = true;
		const start = () => {
			try {
				this._icons?.startMaskBuild?.();
			} catch {}
		};
		const w = window as { requestIdleCallback?: (cb: () => void) => number };
		if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(start);
		else setTimeout(start, 0);
	}

	// -- Screen cache helpers --

	private clearScreenCache(): void {
		try {
			this.ctx.renderCoordinator?.screenCache?.clear?.();
		} catch {}
	}

	// -- GL resume --

	rebuild(): void {
		const ctx = this.ctx;
		const gl = ctx.gl!;
		try {
			this._icons = new IconRenderer(gl);
			const defs = this._allIconDefs;
			if (defs && Object.keys(defs).length) {
				void this._icons.loadIcons(defs);
			}
			if (this._lastMarkers && this._lastMarkers.length) {
				this._icons.setMarkers(this._lastMarkers);
			}
			if (this._lastDecals && this._lastDecals.length) {
				this._icons.setDecals?.(this._lastDecals);
			}
		} catch (e) {
			ctx.debug.warn('GL reinit icons', e);
		}
		try {
			const currentVectors = this._vectorLayer?.getVectors() ?? [];
			this._vectorLayer?.dispose();
			this._vectorLayer = new VectorLayer({
				getContainer: () => ctx.container,
				getGL: () => ctx.gl!,
				getDpr: () => ctx.viewState.dpr,
				getZoom: () => ctx.viewState.zoom,
				getCenter: () => ctx.viewState.center,
				getImageMaxZoom: () => ctx.viewState.imageMaxZoom,
			});
			this._vectorLayer.init();
			if (currentVectors.length) {
				this._vectorLayer.setVectors(currentVectors);
			}
		} catch (e) {
			ctx.debug.warn('GL reinit vectors', e);
		}
	}

	// -- Lifecycle --

	dispose(): void {
		try {
			this._icons?.dispose?.();
		} catch {}
		this._icons = null;
		this._vectorLayer?.dispose();
		this._vectorLayer = null;
	}
}
