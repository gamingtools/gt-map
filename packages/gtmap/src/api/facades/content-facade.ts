/**
 * ContentFacade -- map.content sub-object.
 *
 * Entity collections (markers, decals, vectors), icon registration,
 * dirty batching, and marker event wiring.
 */
import type { Point, IconDef, IconHandle, IconDefInternal, MarkerInternal, VectorPrimitiveInternal, MarkerEventData } from '../types';
import type { VectorGeometry as VectorGeom } from '../events/maps';
import { EntityCollection } from '../../entities/entity-collection';
import { Marker } from '../../entities/marker';
import type { MarkerOptions } from '../../entities/marker';
import { Decal } from '../../entities/decal';
import type { DecalOptions } from '../../entities/decal';
import { Vector } from '../../entities/vector';
import { getVectorTypeSymbol, isPolylineSymbol, isPolygonSymbol } from '../../internal/core/vector-types';
import { extractPointerMeta } from '../../internal/events/pointer-meta';
import { VisualIconService } from '../../internal/content/visual-icon-service';

export interface ContentFacadeDeps {
	setIconDefs(defs: Record<string, IconDefInternal>): Promise<void>;
	setMarkers(markers: MarkerInternal[]): void;
	setDecals(markers: MarkerInternal[]): void;
	setVectors(vectors: VectorPrimitiveInternal[]): void;
	setMarkerData(payloads: Record<string, unknown | null | undefined>): void;
	onMarkerEvent(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', handler: (e: MarkerEventData) => void): () => void;
}

export class ContentFacade<TMarkerData = unknown, TVectorData = unknown> {
	private _deps: ContentFacadeDeps;
	private _vis: VisualIconService;

	/** Marker collection for this map. */
	readonly markers: EntityCollection<Marker<TMarkerData>>;
	/** Decal collection for this map. */
	readonly decals: EntityCollection<Decal>;
	/** Vector collection for this map. */
	readonly vectors: EntityCollection<Vector<TVectorData>>;

	private _icons: Map<string, IconDef> = new Map();
	private _iconIdSeq = 0;
	private _markersDirty = false;
	private _markersFlushScheduled = false;
	private _decalsDirty = false;
	private _decalsFlushScheduled = false;

	/** @internal */
	constructor(deps: ContentFacadeDeps) {
		this._deps = deps;
		this._vis = new VisualIconService({
			setIconDefs: (defs) => deps.setIconDefs(defs),
			onVisualUpdated: () => {
				this._markMarkersDirtyAndSchedule();
				this._markDecalsDirtyAndSchedule();
			},
		});
		this._vis.ensureDefaultIcon();

		// Entity collections
		const onMarkersChanged = () => this._markMarkersDirtyAndSchedule();
		const onDecalsChanged = () => this._markDecalsDirtyAndSchedule();
		const onVectorsChanged = () => this._flushVectors();
		this.markers = new EntityCollection<Marker<TMarkerData>>({ id: 'markers', onChange: onMarkersChanged });
		this.decals = new EntityCollection<Decal>({ id: 'decals', onChange: onDecalsChanged });
		this.vectors = new EntityCollection<Vector<TVectorData>>({ id: 'vectors', onChange: onVectorsChanged });

		this._wireMarkerEvents();
	}

	// -- Icon management --

	/**
	 * Register an icon definition for use with markers.
	 */
	addIcon(def: IconDef, id?: string): IconHandle {
		this._iconIdSeq = (this._iconIdSeq + 1) % Number.MAX_SAFE_INTEGER;
		const iconId = id || `icon_${this._iconIdSeq.toString(36)}`;
		this._icons.set(iconId, def);
		const iconDefInternal: IconDefInternal = {
			iconPath: def.iconPath,
			...(def.x2IconPath != null ? { x2IconPath: def.x2IconPath } : {}),
			width: def.width,
			height: def.height,
			...(def.anchorX != null ? { anchorX: def.anchorX } : {}),
			...(def.anchorY != null ? { anchorY: def.anchorY } : {}),
		};
		this._deps.setIconDefs(Object.fromEntries([[iconId, iconDefInternal]]));
		return { id: iconId };
	}

	// -- Marker management --

	/**
	 * Create and add a marker.
	 */
	addMarker(x: number, y: number, opts: MarkerOptions<TMarkerData>): Marker<TMarkerData> {
		this._vis.ensureRegistered(opts.visual);
		const mk = new Marker<TMarkerData>(x, y, opts, () => this._markMarkersDirtyAndSchedule());
		this.markers.add(mk);
		return mk;
	}

	/**
	 * Remove all markers.
	 */
	clearMarkers(): void {
		this.markers.clear();
	}

	// -- Decal management --

	/**
	 * Create and add a decal (non-interactive visual).
	 */
	addDecal(x: number, y: number, opts: DecalOptions): Decal {
		this._vis.ensureRegistered(opts.visual);
		const d = new Decal(x, y, opts, () => this._markDecalsDirtyAndSchedule());
		this.decals.add(d);
		return d;
	}

	/**
	 * Remove all decals.
	 */
	clearDecals(): void {
		this.decals.clear();
		this._deps.setDecals([]);
	}

	// -- Vector management --

	/**
	 * Create and add a vector shape.
	 */
	addVector(geometry: VectorGeom, opts?: { data?: TVectorData }): Vector<TVectorData> {
		const vecOpts = opts?.data !== undefined ? { data: opts.data } : {};
		const v = new Vector<TVectorData>(geometry, vecOpts as import('../../entities/vector').VectorOptions<TVectorData>, () => this._flushVectors());
		this.vectors.add(v);
		return v;
	}

	/**
	 * Remove all vectors.
	 */
	clearVectors(): void {
		this.vectors.clear();
		this._deps.setVectors([]);
	}

	// -- Private helpers --

	private _markMarkersDirtyAndSchedule(): void {
		this._markersDirty = true;
		if (this._markersFlushScheduled) return;
		this._markersFlushScheduled = true;
		const flush = () => {
			this._markersFlushScheduled = false;
			if (!this._markersDirty) return;
			this._markersDirty = false;
			const list = this.markers.getFiltered();
			const internalMarkers: MarkerInternal[] = list.map((m) => {
				const scaledSize = this._vis.getScaledSize(m.visual, m.scale);
				const iconScaleFn = m.iconScaleFunction !== undefined ? m.iconScaleFunction : m.visual.iconScaleFunction;
				return {
					x: m.x,
					y: m.y,
					type: this._vis.getIconId(m.visual),
					...(scaledSize !== undefined ? { size: scaledSize } : {}),
					rotation: m.rotation,
					zIndex: m.zIndex,
					id: m.id,
					...(iconScaleFn !== undefined ? { iconScaleFunction: iconScaleFn } : {}),
				};
			});
			this._deps.setMarkers(internalMarkers);
			try {
				const payloads: Record<string, unknown | null | undefined> = {};
				for (const mk of list) payloads[mk.id] = mk.data;
				this._deps.setMarkerData(payloads);
			} catch {
				/* expected: marker data serialization may fail */
			}
		};
		if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush);
		else setTimeout(flush, 0);
	}

	private _markDecalsDirtyAndSchedule(): void {
		this._decalsDirty = true;
		if (this._decalsFlushScheduled) return;
		this._decalsFlushScheduled = true;
		const flush = () => {
			this._decalsFlushScheduled = false;
			if (!this._decalsDirty) return;
			this._decalsDirty = false;
			const list = this.decals.getFiltered();
			const internalDecals: MarkerInternal[] = list.map((d) => {
				const scaledSize = this._vis.getScaledSize(d.visual, d.scale);
				const iconScaleFn = d.iconScaleFunction !== undefined ? d.iconScaleFunction : d.visual.iconScaleFunction;
				return {
					x: d.x,
					y: d.y,
					type: this._vis.getIconId(d.visual),
					...(scaledSize !== undefined ? { size: scaledSize } : {}),
					rotation: d.rotation,
					zIndex: d.zIndex,
					id: d.id,
					...(iconScaleFn !== undefined ? { iconScaleFunction: iconScaleFn } : {}),
				};
			});
			this._deps.setDecals(internalDecals);
		};
		if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush);
		else setTimeout(flush, 0);
	}

	private _flushVectors(): void {
		const list = this.vectors.getFiltered();
		const internalVectors: VectorPrimitiveInternal[] = list.map((v) => {
			const g = v.geometry;
			const typeSymbol = getVectorTypeSymbol(g.type);
			if (typeSymbol && (isPolylineSymbol(typeSymbol) || isPolygonSymbol(typeSymbol))) {
				const polyGeom = g as VectorGeom & { type: 'polyline' | 'polygon'; points: Point[] };
				return {
					type: polyGeom.type,
					points: polyGeom.points.map((p) => ({ x: p.x, y: p.y })),
					...(polyGeom.style != null ? { style: polyGeom.style } : {}),
				};
			}
			const circleGeom = g as VectorGeom & { type: 'circle'; center: Point; radius: number };
			return {
				type: 'circle' as const,
				center: { x: circleGeom.center.x, y: circleGeom.center.y },
				radius: circleGeom.radius,
				...(circleGeom.style != null ? { style: circleGeom.style } : {}),
			};
		});
		this._deps.setVectors(internalVectors);
	}

	private _wireMarkerEvents(): void {
		const deps = this._deps;

		type MarkerEventKey = 'pointerenter' | 'pointerleave' | 'click' | 'pointerdown' | 'pointerup' | 'longpress' | 'tap';

		const wireEvent = (name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', entityEvent: MarkerEventKey) => {
			deps.onMarkerEvent(name, (e: MarkerEventData) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (!mk) return;
				const pm = extractPointerMeta(e);
				mk.emitFromMap(entityEvent, { x: e.screen.x, y: e.screen.y, marker: mk.toData(), ...(pm != null ? { pointer: pm } : {}) });
			});
		};

		wireEvent('enter', 'pointerenter');
		wireEvent('leave', 'pointerleave');
		wireEvent('click', 'click');
		wireEvent('down', 'pointerdown');
		wireEvent('up', 'pointerup');
		wireEvent('longpress', 'longpress');

		// Synthesize 'tap' from 'click' for touch input
		deps.onMarkerEvent('click', (e: MarkerEventData) => {
			const id = e?.marker?.id;
			const mk = id ? this.markers.get(id) : undefined;
			const pm = extractPointerMeta(e);
			if (mk && pm && pm.device === 'touch') mk.emitFromMap('tap', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: pm });
		});

		// Safety: emit pointerleave on marker removal
		this.markers.events.on('entityremove').each(({ entity }) => {
			try {
				entity.emitFromMap('pointerleave', { x: -1, y: -1, marker: entity.toData() });
			} catch {
				/* expected: entity may already be disposed */
			}
		});
		this.markers.events.on('visibilitychange').each(({ visible }) => {
			if (!visible) {
				for (const mk of this.markers.getAll()) {
					try {
						mk.emitFromMap('pointerleave', { x: -1, y: -1, marker: mk.toData() });
					} catch {
						/* expected: entity may already be disposed */
					}
				}
			}
		});
	}
}
