/**
 * InteractiveLayer -- a layer that owns markers with hit-testing support.
 */
import type { IconDef, IconHandle, IconDefInternal, MarkerInternal, MarkerEventData, SpriteAtlasDescriptor, SpriteAtlasHandle } from '../types';
import { EntityCollection } from '../../entities/entity-collection';
import { Marker } from '../../entities/marker';
import type { MarkerOptions } from '../../entities/marker';
import type { VisualIconService } from '../../internal/markers/visual-icon-service';
import { extractPointerMeta } from '../../internal/events/pointer-meta';

let _interactiveLayerIdSeq = 0;

export class InteractiveLayer {
	readonly type = 'interactive' as const;
	readonly id: string;

	/** Marker collection for this layer. */
	readonly markers: EntityCollection<Marker>;

	/** @internal */
	_attached = false;
	/** @internal */
	_destroyed = false;
	/** @internal */
	_vis: VisualIconService | null = null;

	// Icon management
	private _icons: Map<string, IconDef> = new Map();
	private _atlasIdSeq = 0;
	private _iconIdSeq = 0;
	private _markersDirty = false;
	private _markersFlushScheduled = false;

	// Deps set by the map when attached
	/** @internal */
	_deps: InteractiveLayerDeps | null = null;
	/** @internal */
	_onMarkersChanged: (() => void) | null = null;
	/** @internal Per-layer renderer (created by GTMap) */
	_renderer: import('../../internal/layers/interactive-layer-renderer').InteractiveLayerRenderer | null = null;

	constructor() {
		_interactiveLayerIdSeq = (_interactiveLayerIdSeq + 1) % Number.MAX_SAFE_INTEGER;
		this.id = `il_${_interactiveLayerIdSeq.toString(36)}`;

		const onMarkersChanged = () => this._markMarkersDirtyAndSchedule();
		this.markers = new EntityCollection<Marker>({ id: `markers_${this.id}`, onChange: onMarkersChanged });
	}

	/** @internal Wire dependencies from the map. */
	_wire(vis: VisualIconService, deps: InteractiveLayerDeps): void {
		this._vis = vis;
		this._deps = deps;
		this._wireMarkerEvents();
	}

	// -- Icon management --

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
		this._deps?.setIconDefs(Object.fromEntries([[iconId, iconDefInternal]]));
		return { id: iconId };
	}

	async loadSpriteAtlas(atlasImageUrl: string, descriptor: SpriteAtlasDescriptor, atlasId?: string): Promise<SpriteAtlasHandle> {
		this._atlasIdSeq = (this._atlasIdSeq + 1) % Number.MAX_SAFE_INTEGER;
		const id = atlasId || `atlas_${this._atlasIdSeq.toString(36)}`;
		const spriteIds = await (this._deps?.loadSpriteAtlas(atlasImageUrl, descriptor, id) ?? Promise.resolve({}));
		return { atlasId: id, spriteIds };
	}

	// -- Marker management --

	addMarker(x: number, y: number, opts: MarkerOptions): Marker {
		if (opts.visual) this._vis?.ensureRegistered(opts.visual);
		const mk = new Marker(x, y, opts, () => this._markMarkersDirtyAndSchedule());
		this.markers.add(mk);
		return mk;
	}

	clearMarkers(): void {
		this.markers.clear();
	}

	// -- Private helpers --

	/** @internal */
	_markMarkersDirtyAndSchedule(): void {
		this._markersDirty = true;
		if (this._markersFlushScheduled) return;
		this._markersFlushScheduled = true;
		const flush = () => {
			this._markersFlushScheduled = false;
			if (!this._markersDirty) return;
			this._markersDirty = false;
			this._flushMarkers();
		};
		if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush);
		else setTimeout(flush, 0);
	}

	/** @internal */
	_flushMarkers(): void {
		if (!this._vis || !this._deps) return;
		const list = this.markers.getFiltered();
		const internalMarkers: MarkerInternal[] = list.map((m) => {
			const scaledSize = this._vis!.getScaledSize(m.visual, m.scale);
			const iconScaleFn = m.iconScaleFunction !== undefined ? m.iconScaleFunction : m.visual.iconScaleFunction;
			return {
				x: m.x,
				y: m.y,
				type: this._vis!.getIconId(m.visual),
				...(scaledSize !== undefined ? { size: scaledSize } : {}),
				rotation: m.rotation,
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
	}

	private _wireMarkerEvents(): void {
		const deps = this._deps;
		if (!deps) return;

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

/** @internal */
export interface InteractiveLayerDeps {
	setIconDefs(defs: Record<string, IconDefInternal>): Promise<void>;
	setMarkers(markers: MarkerInternal[]): void;
	setMarkerData(payloads: Record<string, unknown | null | undefined>): void;
	onMarkerEvent(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', handler: (e: MarkerEventData) => void): () => void;
	loadSpriteAtlas(url: string, descriptor: SpriteAtlasDescriptor, atlasId: string): Promise<Record<string, string>>;
}
