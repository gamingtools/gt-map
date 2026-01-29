/**
 * ContentFacade -- map.content sub-object.
 *
 * Entity collections (markers, decals, vectors), icon registration,
 * visual registration, dirty batching, and marker event wiring.
 */
import type { Point, IconDef, IconHandle, IconDefInternal, MarkerInternal, VectorPrimitiveInternal, MarkerEventData } from '../types';
import type { VectorGeometry as VectorGeom } from '../events/maps';
import type { MapEngine } from '../../internal/map-engine';
import { EntityCollection } from '../../entities/entity-collection';
import { Marker } from '../../entities/marker';
import type { MarkerOptions } from '../../entities/marker';
import { Decal } from '../../entities/decal';
import type { DecalOptions } from '../../entities/decal';
import { Vector } from '../../entities/vector';
import { getVectorTypeSymbol, isPolylineSymbol, isPolygonSymbol } from '../../internal/core/vector-types';
import { renderTextToCanvas } from '../../internal/layers/text-renderer';
import { renderSvgToDataUrlSync, renderSvgToCanvasAsync } from '../../internal/layers/svg-renderer';
import { Visual, isImageVisual, isTextVisual, isSvgVisual, resolveAnchor } from '../visual';

export class ContentFacade<TMarkerData = unknown, TVectorData = unknown> {
	private _engine: MapEngine;

	/** Marker collection for this map. */
	readonly markers: EntityCollection<Marker<TMarkerData>>;
	/** Decal collection for this map. */
	readonly decals: EntityCollection<Decal>;
	/** Vector collection for this map. */
	readonly vectors: EntityCollection<Vector<TVectorData>>;

	private _defaultIconReady = false;
	private _icons: Map<string, IconDef> = new Map();
	private _visualToIconId: WeakMap<Visual, string> = new WeakMap();
	private _visualToSize: WeakMap<Visual, { width: number; height: number }> = new WeakMap();
	private _visualIdSeq = 0;
	private _iconIdSeq = 0;
	private _markersDirty = false;
	private _markersFlushScheduled = false;
	private _decalsDirty = false;
	private _decalsFlushScheduled = false;

	/** @internal */
	constructor(engine: MapEngine) {
		this._engine = engine;
		this._ensureDefaultIcon();

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
		this._engine.setIconDefs(Object.fromEntries([[iconId, iconDefInternal]]));
		return { id: iconId };
	}

	// -- Marker management --

	/**
	 * Create and add a marker.
	 */
	addMarker(x: number, y: number, opts: MarkerOptions<TMarkerData>): Marker<TMarkerData> {
		this._ensureVisualRegistered(opts.visual);
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
		this._ensureVisualRegistered(opts.visual);
		const d = new Decal(x, y, opts, () => this._markDecalsDirtyAndSchedule());
		this.decals.add(d);
		return d;
	}

	/**
	 * Remove all decals.
	 */
	clearDecals(): void {
		this.decals.clear();
		this._engine.setDecals([]);
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
		this._engine.setVectors([]);
	}

	// -- Visual registration --

	/** @internal */
	_ensureVisualRegistered(visual: Visual): string {
		const cached = this._visualToIconId.get(visual);
		if (cached) return cached;

		this._visualIdSeq = (this._visualIdSeq + 1) % Number.MAX_SAFE_INTEGER;
		const iconId = `v_${this._visualIdSeq.toString(36)}`;
		let iconDef: IconDefInternal | null = null;

		if (isImageVisual(visual)) {
			const size = visual.getSize();
			const anchor = resolveAnchor(visual.anchor);
			iconDef = {
				iconPath: visual.icon,
				...(visual.icon2x != null ? { x2IconPath: visual.icon2x } : {}),
				width: size.width,
				height: size.height,
				anchorX: anchor.x * size.width,
				anchorY: anchor.y * size.height,
			};
		} else if (isTextVisual(visual)) {
			const result = renderTextToCanvas({
				text: visual.text,
				fontSize: visual.fontSize,
				fontFamily: visual.fontFamily,
				color: visual.color,
				...(visual.backgroundColor != null ? { backgroundColor: visual.backgroundColor } : {}),
				...(visual.padding != null ? { padding: visual.padding } : {}),
				...(visual.strokeColor != null ? { strokeColor: visual.strokeColor } : {}),
				...(visual.strokeWidth != null ? { strokeWidth: visual.strokeWidth } : {}),
				...(visual.fontWeight != null ? { fontWeight: visual.fontWeight } : {}),
				...(visual.fontStyle != null ? { fontStyle: visual.fontStyle } : {}),
			});
			const anchor = resolveAnchor(visual.anchor);
			const displayW = result.width / 2;
			const displayH = result.height / 2;
			iconDef = {
				iconPath: result.dataUrl,
				width: displayW,
				height: displayH,
				anchorX: anchor.x * displayW,
				anchorY: anchor.y * displayH,
			};
		} else if (isSvgVisual(visual)) {
			const size = visual.getSize();
			const anchor = resolveAnchor(visual.anchor);
			const needsAsync = visual.shadow || visual.svg.trim().startsWith('http');

			if (!needsAsync) {
				const dataUrl = renderSvgToDataUrlSync({
					svg: visual.svg,
					width: size.width,
					height: size.height,
					...(visual.fill != null ? { fill: visual.fill } : {}),
					...(visual.stroke != null ? { stroke: visual.stroke } : {}),
					...(visual.strokeWidth != null ? { strokeWidth: visual.strokeWidth } : {}),
				});
				if (dataUrl) {
					iconDef = {
						iconPath: dataUrl,
						width: size.width,
						height: size.height,
						anchorX: anchor.x * size.width,
						anchorY: anchor.y * size.height,
					};
				}
			} else {
				this._visualToIconId.set(visual, iconId);
				renderSvgToCanvasAsync(
					{
						svg: visual.svg,
						width: size.width,
						height: size.height,
						...(visual.fill != null ? { fill: visual.fill } : {}),
						...(visual.stroke != null ? { stroke: visual.stroke } : {}),
						...(visual.strokeWidth != null ? { strokeWidth: visual.strokeWidth } : {}),
						...(visual.shadow != null ? { shadow: visual.shadow } : {}),
					},
					(result) => {
						const displayW = result.width / 2;
						const displayH = result.height / 2;
						const updatedDef: IconDefInternal = {
							iconPath: result.dataUrl,
							width: displayW,
							height: displayH,
							anchorX: anchor.x * displayW,
							anchorY: anchor.y * displayH,
						};
						this._engine.setIconDefs(Object.fromEntries([[iconId, updatedDef]]));
						this._visualToSize.set(visual, { width: displayW, height: displayH });
						this._markMarkersDirtyAndSchedule();
						this._markDecalsDirtyAndSchedule();
					},
				);
				return iconId;
			}
		} else {
			console.warn(`GTMap: Visual type '${visual.type}' is not yet supported for rendering. Using default icon.`);
			return 'default';
		}

		if (iconDef) {
			this._engine.setIconDefs(Object.fromEntries([[iconId, iconDef]]));
			this._visualToSize.set(visual, { width: iconDef.width, height: iconDef.height });
		}

		this._visualToIconId.set(visual, iconId);
		return iconId;
	}

	// -- Private helpers --

	private _getVisualIconId(visual: Visual): string {
		return this._visualToIconId.get(visual) ?? 'default';
	}

	private _getScaledSize(visual: Visual, scale: number): number | undefined {
		if (scale === 1) return undefined;
		const cachedSize = this._visualToSize.get(visual);
		if (cachedSize) return Math.max(cachedSize.width, cachedSize.height) * scale;
		if (isImageVisual(visual)) {
			const sz = visual.getSize();
			return Math.max(sz.width, sz.height) * scale;
		}
		return undefined;
	}

	private _ensureDefaultIcon(): void {
		if (this._defaultIconReady) return;
		try {
			const size = 16;
			const r = 7;
			const cnv = document.createElement('canvas');
			cnv.width = size;
			cnv.height = size;
			const ctx = cnv.getContext('2d');
			if (ctx) {
				ctx.clearRect(0, 0, size, size);
				ctx.fillStyle = '#2563eb';
				ctx.beginPath();
				ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
				ctx.fill();
				ctx.strokeStyle = 'rgba(0,0,0,0.6)';
				ctx.lineWidth = 1;
				ctx.stroke();
			}
			const dataUrl = cnv.toDataURL('image/png');
			const defaultIcon: IconDefInternal = { iconPath: dataUrl, width: size, height: size };
			this._engine.setIconDefs({ default: defaultIcon });
			this._defaultIconReady = true;
		} catch {}
	}

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
				const scaledSize = this._getScaledSize(m.visual, m.scale);
				const iconScaleFn = m.iconScaleFunction !== undefined ? m.iconScaleFunction : m.visual.iconScaleFunction;
				return {
					lng: m.x,
					lat: m.y,
					type: this._getVisualIconId(m.visual),
					...(scaledSize !== undefined ? { size: scaledSize } : {}),
					rotation: m.rotation,
					zIndex: m.zIndex,
					id: m.id,
					...(iconScaleFn !== undefined ? { iconScaleFunction: iconScaleFn } : {}),
				};
			});
			this._engine.setMarkers(internalMarkers);
			try {
				const payloads: Record<string, unknown | null | undefined> = {};
				for (const mk of list) payloads[mk.id] = mk.data;
				this._engine.setMarkerData(payloads);
			} catch {}
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
				const scaledSize = this._getScaledSize(d.visual, d.scale);
				const iconScaleFn = d.iconScaleFunction !== undefined ? d.iconScaleFunction : d.visual.iconScaleFunction;
				return {
					lng: d.x,
					lat: d.y,
					type: this._getVisualIconId(d.visual),
					...(scaledSize !== undefined ? { size: scaledSize } : {}),
					rotation: d.rotation,
					zIndex: d.zIndex,
					id: d.id,
					...(iconScaleFn !== undefined ? { iconScaleFunction: iconScaleFn } : {}),
				};
			});
			this._engine.setDecals(internalDecals);
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
					points: polyGeom.points.map((p) => ({ lng: p.x, lat: p.y })),
					...(polyGeom.style != null ? { style: polyGeom.style } : {}),
				};
			}
			const circleGeom = g as VectorGeom & { type: 'circle'; center: Point; radius: number };
			return {
				type: 'circle' as const,
				center: { lng: circleGeom.center.x, lat: circleGeom.center.y },
				radius: circleGeom.radius,
				...(circleGeom.style != null ? { style: circleGeom.style } : {}),
			};
		});
		this._engine.setVectors(internalVectors);
	}

	private _wireMarkerEvents(): void {
		const engine = this._engine;

		type MarkerEventKey = 'pointerenter' | 'pointerleave' | 'click' | 'pointerdown' | 'pointerup' | 'longpress' | 'tap';

		const toPointerMeta = (ev: { originalEvent?: PointerEvent | MouseEvent } | undefined): import('../events/maps').PointerMeta | undefined => {
			const oe = ev?.originalEvent;
			if (!oe) return undefined;
			const has = <K extends keyof (PointerEvent & MouseEvent)>(k: K): boolean => k in (oe as PointerEvent | MouseEvent);
			const ptrType = has('pointerType') ? String((oe as PointerEvent).pointerType) : 'mouse';
			const device: import('../events/maps').InputDevice = ptrType === 'mouse' || ptrType === 'touch' || ptrType === 'pen' ? (ptrType as import('../events/maps').InputDevice) : 'mouse';
			const isPrimary = has('isPrimary') ? !!(oe as PointerEvent).isPrimary : true;
			const buttons = has('buttons') ? (oe as PointerEvent).buttons : 0;
			const pointerId = has('pointerId') ? (oe as PointerEvent).pointerId : 0;
			const mods = {
				alt: 'altKey' in oe ? !!(oe as MouseEvent).altKey : false,
				ctrl: 'ctrlKey' in oe ? !!(oe as MouseEvent).ctrlKey : false,
				meta: 'metaKey' in oe ? !!(oe as MouseEvent).metaKey : false,
				shift: 'shiftKey' in oe ? !!(oe as MouseEvent).shiftKey : false,
			};
			return {
				device,
				isPrimary,
				buttons,
				pointerId,
				...(has('pressure') ? { pressure: (oe as PointerEvent).pressure } : {}),
				...(has('width') ? { width: (oe as PointerEvent).width } : {}),
				...(has('height') ? { height: (oe as PointerEvent).height } : {}),
				...(has('tiltX') ? { tiltX: (oe as PointerEvent).tiltX } : {}),
				...(has('tiltY') ? { tiltY: (oe as PointerEvent).tiltY } : {}),
				...((oe as PointerEvent & { twist?: number }).twist != null ? { twist: (oe as PointerEvent & { twist?: number }).twist } : {}),
				modifiers: mods,
			};
		};

		const wireEvent = (name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', entityEvent: MarkerEventKey) => {
			engine.onMarkerEvent(name, (e: MarkerEventData) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (!mk) return;
				const pm = toPointerMeta(e);
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
		engine.onMarkerEvent('click', (e: MarkerEventData) => {
			const id = e?.marker?.id;
			const mk = id ? this.markers.get(id) : undefined;
			const pm = toPointerMeta(e);
			if (mk && pm && pm.device === 'touch') mk.emitFromMap('tap', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: pm });
		});

		// Safety: emit pointerleave on marker removal
		this.markers.events.on('entityremove').each(({ entity }) => {
			try {
				entity.emitFromMap('pointerleave', { x: -1, y: -1, marker: entity.toData() });
			} catch {}
		});
		this.markers.events.on('visibilitychange').each(({ visible }) => {
			if (!visible) {
				for (const mk of this.markers.getAll()) {
					try {
						mk.emitFromMap('pointerleave', { x: -1, y: -1, marker: mk.toData() });
					} catch {}
				}
			}
		});
	}
}
