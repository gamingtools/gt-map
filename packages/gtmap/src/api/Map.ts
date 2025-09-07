import Impl, { type MapOptions as ImplMapOptions } from '../internal/mapgl';
import type { MapImpl } from '../internal/types';
import { Layer } from '../entities/Layer';
import { Marker } from '../entities/Marker';
import { Vector, type VectorGeometry as VectorGeom } from '../entities/Vector';

import type { PublicEvents } from './events/public';
import type {
	Point,
	TileSourceOptions,
	MapOptions,
	IconDef,
	IconHandle,
	Circle,
	Vector as VectorLegacy,
	ActiveOptions,
	IconDefInternal,
	MarkerInternal,
	VectorPrimitiveInternal,
	IconScaleFunction,
	EventMap as MapEventMap,
  ApplyOptions,
  ApplyResult,
} from './types';

// Re-export types from centralized types file
export type { Point, TileSourceOptions, MapOptions, IconDef, IconHandle, VectorStyle, Polyline, Polygon, Circle, Vector as VectorLegacy, ActiveOptions } from './types';
export { Marker } from '../entities/Marker';
export { Vector } from '../entities/Vector';
export { Layer } from '../entities/Layer';

/**
 * GTMap - A high-performance WebGL map renderer with pixel-based coordinate system.
 *
 * @example
 * ```typescript
 * const map = new GTMap(document.getElementById('map'), {
 *   tileUrl: 'https://example.com/tiles/{z}/{x}_{y}.webp',
 *   center: { x: 4096, y: 4096 },
 *   zoom: 3,
 *   maxZoom: 5
 * });
 * ```
 */
export class GTMap {
	private _impl: MapImpl;
	/**
	 * Marker layer for this map. Use to add/remove markers and subscribe to layer events.
	 *
	 * @example
	 * const m = map.addMarker(100, 200);
	 * map.markers.events.on('entityadd').each(({ entity }) => console.log('added', entity.id));
	 */
	readonly markers: Layer<Marker>;
	/**
	 * Vector layer for this map. Use to add/remove vectors and subscribe to layer events.
	 */
	readonly vectors: Layer<Vector>;
	private _defaultIconReady = false;
	private _icons: Map<string, IconDef> = new Map<string, IconDef>();
	private _markersDirty = false;
	private _markersFlushScheduled = false;

    // (active view transition tracking handled via module-level WeakMap in builder)

	/**
	 * Creates a new GTMap instance.
	 *
	 * @param container - The HTML element to render the map into
	 * @param options - Configuration options for the map
	 * @param options.tileUrl - URL template for tile loading (use {z}, {x}, {y} placeholders)
	 * @param options.tileSize - Size of tiles in pixels (default: 256)
	 * @param options.minZoom - Minimum zoom level (default: 0)
	 * @param options.maxZoom - Maximum zoom level (default: 19)
	 * @param options.mapSize - Total map dimensions in pixels at native resolution
	 * @param options.wrapX - Enable horizontal wrapping for infinite pan (default: false)
	 * @param options.center - Initial center position in pixel coordinates
	 * @param options.zoom - Initial zoom level
	 * @param options.prefetch - Tile prefetching configuration
	 * @param options.screenCache - Enable screen-space caching for better performance (default: true)
	 * @param options.fpsCap - Maximum frames per second (default: 60)
	 */
	constructor(container: HTMLElement, options: MapOptions = {}) {
		const implOpts: Partial<ImplMapOptions> = {
			tileUrl: options.tileUrl,
			tileSize: options.tileSize,
			minZoom: options.minZoom,
			maxZoom: options.maxZoom,
			mapSize: options.mapSize,
			wrapX: options.wrapX,
			center: options.center ? { lng: options.center.x, lat: options.center.y } : undefined,
			zoom: options.zoom,
			autoResize: options.autoResize,
			backgroundColor: options.backgroundColor as any,
			prefetch: options.prefetch,
			screenCache: options.screenCache,
			fpsCap: options.fpsCap,
		};
		this._impl = new Impl(container as HTMLDivElement, implOpts);
		this._ensureDefaultIcon();

		// Layers
		const onMarkersChanged = () => this._markMarkersDirtyAndSchedule();
		const onVectorsChanged = () => this._flushVectors();
		this.markers = new Layer<Marker>({ id: 'markers', onChange: onMarkersChanged });
		this.vectors = new Layer<Vector>({ id: 'vectors', onChange: onVectorsChanged });

		// Wire internal marker events to per-marker entity events
		const toPointerMeta = (ev: any) => {
			try {
				const oe = ev?.originalEvent as PointerEvent | MouseEvent | undefined;
				const device: 'mouse' | 'touch' | 'pen' = oe && (oe as any).pointerType ? (String((oe as any).pointerType) as any) : 'mouse';
				const isPrimary = (oe as any)?.isPrimary ?? true;
				const buttons = (oe as any)?.buttons ?? 0;
				const pointerId = (oe as any)?.pointerId ?? 0;
				const pressure = (oe as any)?.pressure;
				const width = (oe as any)?.width;
				const height = (oe as any)?.height;
				const tiltX = (oe as any)?.tiltX;
				const tiltY = (oe as any)?.tiltY;
				const twist = (oe as any)?.twist;
				const mods = {
					alt: !!(oe && (oe as any).altKey),
					ctrl: !!(oe && (oe as any).ctrlKey),
					meta: !!(oe && (oe as any).metaKey),
					shift: !!(oe && (oe as any).shiftKey),
				};
				return { device, isPrimary, buttons, pointerId, pressure, width, height, tiltX, tiltY, twist, modifiers: mods };
			} catch {
				return undefined;
			}
		};

		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('enter', (e: any) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (mk) mk.emitFromMap('pointerenter', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: toPointerMeta(e) as any });
			});
		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('leave', (e: any) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (mk) mk.emitFromMap('pointerleave', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: toPointerMeta(e) as any });
			});
		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('click', (e: any) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (mk) mk.emitFromMap('click', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: toPointerMeta(e) as any });
			});
		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('down', (e: any) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (mk) mk.emitFromMap('pointerdown', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: toPointerMeta(e) as any });
			});
		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('up', (e: any) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (mk) mk.emitFromMap('pointerup', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: toPointerMeta(e) as any });
			});
		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('longpress', (e: any) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (mk) mk.emitFromMap('longpress', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: toPointerMeta(e) as any });
			});
		// Synthesize 'tap' alias from 'click' for touch input
		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('click', (e: any) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				const pm = toPointerMeta(e) as any;
				if (mk && pm && pm.device === 'touch') mk.emitFromMap('tap', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: pm });
			});

		// Facade-level safety: emit pointerleave when markers are removed or hidden
		this.markers.events.on('entityremove').each(({ entity }) => {
			try {
				entity.emitFromMap('pointerleave', { x: -1, y: -1, marker: entity.toData(), pointer: undefined as any });
			} catch {}
		});
		this.markers.events.on('visibilitychange').each(({ visible }) => {
			if (!visible) {
				for (const mk of this.markers.getAll()) {
					try { mk.emitFromMap('pointerleave', { x: -1, y: -1, marker: mk.toData(), pointer: undefined as any }); } catch {}
				}
			}
		});
	}

    // View control helpers (internal use by transition builder)
    _applyInstant(center?: Point, zoom?: number): void {
        if (center) this._impl.setCenter(center.x, center.y);
        if (typeof zoom === 'number') this._impl.setZoom(zoom);
    }

	// Tile source
	/**
	 * Configures the tile source for the map.
	 *
	 * @param opts - Tile source configuration
	 * @param opts.url - URL template with {z}, {x}, {y} placeholders
	 * @param opts.tileSize - Size of tiles in pixels
	 * @param opts.sourceMaxZoom - Maximum zoom level available from tile source
	 * @param opts.mapSize - Total map dimensions at native resolution
	 * @param opts.wrapX - Enable horizontal wrapping
	 * @param opts.clearCache - Clear existing tile cache
	 * @returns This map instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * map.setTileSource({
	 *   url: 'https://tiles.example.com/{z}/{x}_{y}.webp',
	 *   sourceMaxZoom: 5,
	 *   clearCache: true
	 * });
	 * ```
	 */
	setTileSource(opts: TileSourceOptions): this {
		const o: TileSourceOptions = { ...opts };
		if (opts.mapSize) o.mapSize = { width: opts.mapSize.width, height: opts.mapSize.height };
		this._impl.setTileSource(o);
		return this;
	}

	// Grid + filtering
	/**
	 * Shows or hides the tile grid overlay.
	 *
	 * @param on - True to show grid, false to hide
	 * @returns This map instance for method chaining
	 */
	setGridVisible(on: boolean): this {
		this._impl.setGridVisible?.(on);
		return this;
	}
	/**
	 * Sets the upscale filtering mode for low-resolution tiles.
	 *
	 * @param mode - Filtering mode: 'auto', 'linear', or 'bicubic'
	 * @returns This map instance for method chaining
	 */
	setUpscaleFilter(mode: 'auto' | 'linear' | 'bicubic'): this {
		this._impl.setUpscaleFilter?.(mode);
		return this;
	}

	/**
	 * Sets a custom function to control icon scaling based on zoom level.
	 *
	 * @param fn - Function that returns a scale multiplier (1.0 = original size)
	 * @returns This map instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * // Icons scale with zoom (like real-world objects)
	 * map.setIconScaleFunction((zoom) => Math.pow(2, zoom - 3));
	 *
	 * // Icons stay fixed size on screen (default behavior)
	 * map.setIconScaleFunction(() => 1);
	 *
	 * // Step-based scaling
	 * map.setIconScaleFunction((zoom) => {
	 *   if (zoom < 2) return 0.5;
	 *   if (zoom < 4) return 1;
	 *   return 1.5;
	 * });
	 *
	 * // Scale proportionally within zoom range
	 * map.setIconScaleFunction((zoom, minZoom, maxZoom) => {
	 *   const t = (zoom - minZoom) / (maxZoom - minZoom);
	 *   return 0.5 + t * 1.5; // Scale from 0.5x to 2x
	 * });
	 * ```
	 */
	setIconScaleFunction(fn: IconScaleFunction | null): this {
		this._impl.setIconScaleFunction?.(fn);
		return this;
	}

	// Lifecycle
	/**
	 * Suspends or resumes the map rendering.
	 *
	 * @param on - True to activate, false to suspend
	 * @param opts - Optional settings
	 * @param opts.releaseGL - Release WebGL context when suspending (frees GPU memory)
	 * @returns This map instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * // Suspend map when hidden
	 * map.setActive(false, { releaseGL: true });
	 * // Resume when visible again
	 * map.setActive(true);
	 * ```
	 */
	setActive(on: boolean, opts?: ActiveOptions): this {
		this._impl.setActive?.(on, opts);
		return this;
	}
	/**
	 * Destroys the map instance and releases all resources.
	 * Call this before removing the map from the DOM.
	 */
	destroy(): void {
		this._impl.destroy?.();
	}

	// Add content (batched internally)
	/**
	 * Registers an icon definition for use with markers.
	 *
	 * @param def - Icon definition with image path and dimensions
	 * @param id - Optional identifier for the icon (auto-generated if not provided)
	 * @returns IconHandle to use when adding markers
	 *
	 * @example
	 * ```typescript
	 * const icon = map.addIcon({
	 *   iconPath: '/images/marker.png',
	 *   width: 24,
	 *   height: 24
	 * });
	 * map.addMarker(100, 200, { icon });
	 * ```
	 */
	addIcon(def: IconDef, id?: string): IconHandle {
		const iconId = id || `icon_${Math.random().toString(36).slice(2, 10)}`;
		this._icons.set(iconId, def);
		// Push to impl immediately
		const iconDefInternal: IconDefInternal = {
			iconPath: def.iconPath,
			x2IconPath: def.x2IconPath,
			width: def.width,
			height: def.height,
			anchorX: def.anchorX,
			anchorY: def.anchorY,
		};
		this._impl.setIconDefs(Object.fromEntries([[iconId, iconDefInternal]]));
		return { id: iconId };
	}
	/**
	 * Create and add a marker to the `markers` layer.
	 *
	 * @param x - X pixel coordinate
	 * @param y - Y pixel coordinate
	 * @param opts.icon - Icon from `addIcon` (defaults to built-in circle)
	 * @param opts.size - Scale multiplier
	 * @param opts.rotation - Degrees clockwise
	 * @param opts.data - Arbitrary user data attached to the marker
	 * @returns The created `Marker`
	 *
	 * @example
	 * const m = map.addMarker(1024, 1024, { size: 1.25 });
	 * m.events.on('click').each(({ x, y }) => console.log('marker click', x, y));
	 */
	addMarker(x: number, y: number, opts?: { icon?: IconHandle; size?: number; rotation?: number; data?: unknown }): Marker {
		const mk = new Marker(x, y, { iconType: opts?.icon?.id, size: opts?.size, rotation: opts?.rotation, data: opts?.data }, () => this._markMarkersDirtyAndSchedule());
		this.markers.add(mk);
		return mk;
	}
	// addMarkers removed in favor of per-entity API
	/**
	 * Adds vector shapes (polylines, polygons, circles) to the map.
	 *
	 * @param vectors - Array of vector shape definitions
	 * @returns This map instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * map.addVectors([
	 *   {
	 *     type: 'polyline',
	 *     points: [{x: 0, y: 0}, {x: 100, y: 100}],
	 *     style: { color: '#ff0000', weight: 2 }
	 *   },
	 *   {
	 *     type: 'circle',
	 *     center: {x: 500, y: 500},
	 *     radius: 50,
	 *     style: { color: '#0000ff', fill: true }
	 *   }
	 * ]);
	 * ```
	 */
	/**
	 * Add legacy vector primitives in a single batch (temporary helper).
	 * Prefer `addVector(geometry)` for the entity-based API.
	 */
	addVectors(_vectors: VectorLegacy[]): this {
		// Legacy pass-through remains for now
		const internalVectors: VectorPrimitiveInternal[] = _vectors.map((v) => {
			if (v.type === 'polyline' || v.type === 'polygon') {
				return { type: v.type, points: v.points.map((p) => ({ lng: p.x, lat: p.y })), style: v.style };
			}
			const circle = v as Circle;
			return { type: 'circle', center: { lng: circle.center.x, lat: circle.center.y }, radius: circle.radius, style: circle.style };
		});
		this._impl.setVectors?.(internalVectors);
		return this;
	}

	/**
	 * Create and add a `Vector` entity to the `vectors` layer.
	 *
	 * @param geometry - Vector geometry (polyline, polygon, circle)
	 * @returns The created `Vector`
	 */
	addVector(geometry: VectorGeom): Vector {
		const v = new Vector(geometry, {}, () => this._flushVectors());
		this.vectors.add(v);
		return v;
	}

	/**
	 * Removes all markers from the map.
	 *
	 * @returns This map instance for method chaining
	 */
	/** Remove all markers from the map. */
	clearMarkers(): this {
		this.markers.clear();
		return this;
	}
	/**
	 * Removes all vector shapes from the map.
	 *
	 * @returns This map instance for method chaining
	 */
	/** Remove all vectors from the map. */
	clearVectors(): this {
		this.vectors.clear();
		this._impl.setVectors?.([]);
		return this;
	}

	// Compatibility getters used by HUD
	/**
	 * Gets the current center position of the map.
	 *
	 * @returns The center position in pixel coordinates
	 */
	getCenter(): Point {
		const c = this._impl.center as { lng: number; lat: number };
		return { x: c.lng, y: c.lat };
	}
	/**
	 * Gets the current zoom level.
	 *
	 * @returns The current zoom level
	 */
	getZoom(): number {
		return this._impl.zoom;
	}
	/**
	 * Gets the current pointer position in world coordinates.
	 *
	 * @returns The pointer position or null if pointer is outside map
	 */
	get pointerAbs(): { x: number; y: number } | null {
		return this._impl.pointerAbs ?? null;
	}
	/**
	 * Sets the mouse wheel zoom speed.
	 *
	 * @param v - Speed multiplier (0.01 to 2.0)
	 * @returns This map instance for method chaining
	 */
	setWheelSpeed(v: number): this {
		this._impl.setWheelSpeed?.(v);
		return this;
	}
	/**
	 * Sets the maximum frames per second.
	 *
	 * @param v - FPS limit (15 to 240)
	 * @returns This map instance for method chaining
	 */
	setFpsCap(v: number): this {
		this._impl.setFpsCap(v);
		return this;
	}

    /**
     * Set the viewport background.
     * Policy: either 'transparent' (fully transparent) or a solid color; alpha on colors is ignored.
     */
	setBackgroundColor(color: string | { r: number; g: number; b: number; a?: number }): this {
		this._impl.setBackgroundColor?.(color as any);
		return this;
	}
	/**
	 * Enable or disable automatic resize handling.
	 * When enabled, a ResizeObserver watches the container and resizes
	 * the canvases (debounced via rAF). A window resize listener is
	 * also attached for DPR changes.
	 *
	 * @example
	 * map.setAutoResize(false); // manage size manually via invalidateSize()
	 * map.setAutoResize(true);  // re-enable automatic handling
	 */
	setAutoResize(on: boolean): this {
		this._impl.setAutoResize?.(on);
		return this;
	}
    _animateView(opts: { center?: Point; zoom?: number; durationMs: number }): void {
        const { center, zoom, durationMs } = opts;
        const lng = center?.x;
        const lat = center?.y;
        this._impl.flyTo?.({ lng, lat, zoom, durationMs });
    }

    _cancelPanZoom(): void {
        try { this._impl.cancelPanAnim?.(); } catch {}
        try { this._impl.cancelZoomAnim?.(); } catch {}
    }

    _fitBounds(b: { minX: number; minY: number; maxX: number; maxY: number }, padding: { top: number; right: number; bottom: number; left: number }): { center: Point; zoom: number } {
        const rect = this._impl.container.getBoundingClientRect();
        const pad = padding || { top: 0, right: 0, bottom: 0, left: 0 };
        const availW = Math.max(1, rect.width - (pad.left + pad.right));
        const availH = Math.max(1, rect.height - (pad.top + pad.bottom));
        const bw = Math.max(1, b.maxX - b.minX);
        const bh = Math.max(1, b.maxY - b.minY);
        const k = Math.min(availW / bw, availH / bh);
        // CSS px per world px is 2^(z - imageMaxZ) => z = imageMaxZ + log2(k)
        const imageMaxZ = (this._impl as any)._sourceMaxZoom ?? this._impl.maxZoom;
        let z = imageMaxZ + Math.log2(Math.max(1e-6, k));
        // clamp
        z = Math.max(this._impl.minZoom, Math.min(this._impl.maxZoom, z));
        const center: Point = { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
        return { center, zoom: z };
    }
	/**
	 * Updates the map size after container resize.
	 * Call this if the container size changes.
	 *
	 * @returns This map instance for method chaining
	 */
	invalidateSize(): this {
		this._impl.resize?.();
		return this;
	}

	// Events proxy
	/**
	 * Read-only map events surface (`on/once`).
	 *
	 * @example
	 * map.events.on('move').each(({ view }) => console.log(view.center, view.zoom));
	 * await map.events.once('zoomend');
	 */
	get events(): PublicEvents<MapEventMap> {
		return {
			on: (name) => this._impl.events.on(name),
			once: (name) => this._impl.events.when(name),
		};
	}

	/**
	 * Start a chainable view transition. No side-effects until apply().
	 */
	transition(): ViewTransition {
		return new ViewTransitionImpl(this);
	}

	// Ensure a default icon is available so markers are visible without explicit icon defs
	private _ensureDefaultIcon() {
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
				ctx.fillStyle = '#2563eb'; // blue
				ctx.beginPath();
				ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
				ctx.fill();
				ctx.strokeStyle = 'rgba(0,0,0,0.6)';
				ctx.lineWidth = 1;
				ctx.stroke();
			}
			const dataUrl = cnv.toDataURL('image/png');
			const defaultIcon: IconDefInternal = { iconPath: dataUrl, width: size, height: size };
			this._impl.setIconDefs?.({ default: defaultIcon });
			this._defaultIconReady = true;
		} catch {}
	}

	private _markMarkersDirtyAndSchedule() {
		this._markersDirty = true;
		if (this._markersFlushScheduled) return;
		this._markersFlushScheduled = true;
		const flush = () => {
			this._markersFlushScheduled = false;
			if (!this._markersDirty) return;
			this._markersDirty = false;
			const list = this.markers.getAll();
			const internalMarkers: MarkerInternal[] = list.map((m) => ({
				lng: m.x,
				lat: m.y,
				type: m.iconType ?? 'default',
				size: m.size,
				rotation: m.rotation,
				id: m.id,
			}));
			this._impl.setMarkers(internalMarkers);
			try {
				const payloads: Record<string, unknown | null | undefined> = {};
				for (const mk of list) payloads[mk.id] = mk.data;
				this._impl.setMarkerData?.(payloads);
			} catch {}
		};
		if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush);
		else setTimeout(flush, 0);
	}

	private _flushVectors() {
		const list = this.vectors.getAll();
		const internalVectors: VectorPrimitiveInternal[] = list.map((v) => {
			const g = v.geometry;
			if (g.type === 'polyline' || g.type === 'polygon') {
				return { type: g.type, points: g.points.map((p) => ({ lng: p.x, lat: p.y })) };
			}
			return { type: 'circle', center: { lng: g.center.x, lat: g.center.y }, radius: g.radius };
		});
		this._impl.setVectors?.(internalVectors);
	}
}

// Transition builder implementation (internal)
export interface ViewTransition {
  center(p: Point): this;
  zoom(z: number): this;
  offset(dx: number, dy: number): this;
  bounds(b: { minX: number; minY: number; maxX: number; maxY: number }, padding?: number | { top: number; right: number; bottom: number; left: number }): this;
  apply(opts?: ApplyOptions): Promise<ApplyResult>;
  cancel(): void;
}

class ViewTransitionImpl implements ViewTransition {
  // Track at most one active transition per map instance
  private static _active: WeakMap<GTMap, ViewTransitionImpl> = new WeakMap();
  static _activeFor(map: GTMap): ViewTransitionImpl | undefined { return this._active.get(map); }
  static _setActive(map: GTMap, tx: ViewTransitionImpl): void { this._active.set(map, tx); }
  static _clearActive(map: GTMap): void { this._active.delete(map); }
  private map: GTMap;
  private targetCenter?: Point;
  private targetZoom?: number;
  private offsetDx = 0;
  private offsetDy = 0;
  private targetBounds?: { minX: number; minY: number; maxX: number; maxY: number };
  private boundsPadding?: { top: number; right: number; bottom: number; left: number };
  private started = false;
  private settled = false;
  private cancelled = false;
  private resolveFn?: (r: ApplyResult) => void;
  private promise?: Promise<ApplyResult>;
  private unsubscribeMoveEnd?: () => void;
  private unsubscribeZoomEnd?: () => void;

  constructor(map: GTMap) {
    this.map = map;
  }

  center(p: Point): this {
    this.targetCenter = p;
    return this;
  }

  zoom(z: number): this {
    this.targetZoom = z;
    return this;
  }

  offset(dx: number, dy: number): this {
    this.offsetDx += dx;
    this.offsetDy += dy;
    return this;
  }

  bounds(b: { minX: number; minY: number; maxX: number; maxY: number }, padding?: number | { top: number; right: number; bottom: number; left: number }): this {
    this.targetBounds = b;
    if (typeof padding === 'number') {
      const p = Math.max(0, padding);
      this.boundsPadding = { top: p, right: p, bottom: p, left: p };
    } else if (padding) {
      const pad = padding as { top: number; right: number; bottom: number; left: number };
      this.boundsPadding = {
        top: Math.max(0, pad.top),
        right: Math.max(0, pad.right),
        bottom: Math.max(0, pad.bottom),
        left: Math.max(0, pad.left),
      };
    } else {
      this.boundsPadding = { top: 0, right: 0, bottom: 0, left: 0 };
    }
    return this;
  }

  cancel(): void {
    if (this.settled) return;
    this.cancelled = true;
    this._resolve({ status: 'canceled' });
  }

  async apply(opts?: ApplyOptions): Promise<ApplyResult> {
    if (this.promise) return this.promise;
    this.started = true;
    // Compute final targets
    const currentCenter = this.map.getCenter();
    const currentZoom = this.map.getZoom();
    let finalCenter: Point | undefined;
    let finalZoom: number | undefined;

    if (this.targetBounds) {
      const fit = this.map._fitBounds(this.targetBounds, this.boundsPadding || { top: 0, right: 0, bottom: 0, left: 0 });
      finalCenter = fit.center;
      finalZoom = fit.zoom;
    }

    if (!finalCenter && this.targetCenter) {
      finalCenter = { x: this.targetCenter.x + this.offsetDx, y: this.targetCenter.y + this.offsetDy };
    } else if (!finalCenter && (this.offsetDx !== 0 || this.offsetDy !== 0)) {
      finalCenter = { x: currentCenter.x + this.offsetDx, y: currentCenter.y + this.offsetDy };
    }
    if (typeof finalZoom !== 'number' && typeof this.targetZoom === 'number') {
      finalZoom = this.targetZoom;
    }

    const needsCenter = !!finalCenter && (finalCenter.x !== currentCenter.x || finalCenter.y !== currentCenter.y);
    const needsZoom = typeof finalZoom === 'number' && finalZoom !== currentZoom;

    const noChange = !needsCenter && !needsZoom;
    if (noChange) {
      return this._finalizeImmediate({ status: 'instant' });
    }

    const animate = opts?.animate;
    if (!animate) {
      // Stop any ongoing pan/zoom animations to avoid inertia overriding instant set
      try { this.map._cancelPanZoom(); } catch {}
      this.map._applyInstant(needsCenter ? (finalCenter as Point) : undefined, needsZoom ? (finalZoom as number) : undefined);
      return this._finalizeImmediate({ status: 'instant' });
    }

    // Interrupt policy handling (phase 1: treat join/enqueue as cancel)
    const policy = animate.interrupt ?? 'cancel';
    const prev = ViewTransitionImpl._activeFor(this.map);
    if (policy === 'enqueue' && prev && prev !== this && !prev.settled) {
      // Wait for the previous transition to finish before starting
      if (prev.promise) await prev.promise;
    }
    if (policy === 'cancel' && prev && prev !== this && !prev.settled) {
      prev.cancel();
    }
    // For 'join' we do not cancel the previous; both will resolve when the new animation ends
    ViewTransitionImpl._setActive(this.map, this);

    // Optional delay
    if (animate.delayMs && animate.delayMs > 0) {
      await new Promise<void>((res) => setTimeout(res, animate.delayMs));
      if (this.cancelled) return { status: 'canceled' };
    }

    // Subscribe to end events according to what changes
    const needsMoveEnd = needsCenter;
    const needsZoomEnd = needsZoom;
    let moveEnded = !needsMoveEnd;
    let zoomEnded = !needsZoomEnd;

    this.promise = new Promise<ApplyResult>((resolve) => {
      this.resolveFn = resolve;
      if (needsMoveEnd) {
        this.unsubscribeMoveEnd = this.map.events.on('moveend').each(() => {
          moveEnded = true;
          this._maybeResolveAnimated(moveEnded, zoomEnded);
        });
      }
      if (needsZoomEnd) {
        this.unsubscribeZoomEnd = this.map.events.on('zoomend').each(() => {
          zoomEnded = true;
          this._maybeResolveAnimated(moveEnded, zoomEnded);
        });
      }
    });

    // For 'cancel', ensure underlying animations are stopped before starting new
    if (policy === 'cancel') {
      try { this.map._cancelPanZoom(); } catch {}
    }

    // Kick off the animation via existing API
    const durationMs = animate.durationMs;
    // Easing is not currently plumbed through; reserved for future internal support
    this.map._animateView({ center: finalCenter, zoom: finalZoom, durationMs });

    return this.promise;
  }

  private _maybeResolveAnimated(moveEnded: boolean, zoomEnded: boolean) {
    if (this.settled) return;
    if (this.cancelled) {
      this._resolve({ status: 'canceled' });
      return;
    }
    if (moveEnded && zoomEnded) {
      this._resolve({ status: 'animated' });
    }
  }

  private _finalizeImmediate(result: ApplyResult): Promise<ApplyResult> {
    this.promise = Promise.resolve(result);
    this.settled = true;
    return this.promise;
  }

  private _resolve(result: ApplyResult) {
    if (this.settled) return;
    this.settled = true;
    try { this.unsubscribeMoveEnd?.(); } catch {}
    try { this.unsubscribeZoomEnd?.(); } catch {}
    // Clear active if it is me
    if (ViewTransitionImpl._activeFor(this.map) === this) ViewTransitionImpl._clearActive(this.map);
    if (this.resolveFn) this.resolveFn(result);
  }
}
