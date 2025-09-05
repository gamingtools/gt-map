import Impl, { type MapOptions as ImplMapOptions } from '../internal/mapgl';
import type { MapImpl } from '../internal/types';

import type { Point, TileSourceOptions, MapOptions, IconDef, IconHandle, Circle, Vector as VectorLegacy, ActiveOptions, IconDefInternal, MarkerInternal, VectorPrimitiveInternal, IconScaleFunction, EventMap as MapEventMap } from './types';
import type { PublicEvents } from './events/public';
import { Layer } from '../entities/Layer';
import { Marker } from '../entities/Marker';
import { Vector, type VectorGeometry as VectorGeom } from '../entities/Vector';

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
        this._impl.events.on('markerenter').each((e) => {
            const id = e?.marker?.id;
            const mk = id ? this.markers.get(id) : undefined;
            if (mk) mk.emitFromMap('enter', { x: e.screen.x, y: e.screen.y, marker: mk.toData() });
        });
        this._impl.events.on('markerleave').each((e) => {
            const id = e?.marker?.id;
            const mk = id ? this.markers.get(id) : undefined;
            if (mk) mk.emitFromMap('leave', { x: e.screen.x, y: e.screen.y, marker: mk.toData() });
        });
        this._impl.events.on('markerclick').each((e) => {
            const id = e?.marker?.id;
            const mk = id ? this.markers.get(id) : undefined;
            if (mk) mk.emitFromMap('click', { x: e.screen.x, y: e.screen.y, marker: mk.toData() });
        });
    }

	// View controls
	/**
	 * Sets the map center position.
	 *
	 * @param p - The new center position in pixel coordinates
	 * @returns This map instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * map.setCenter({ x: 2048, y: 2048 });
	 * ```
	 */
	setCenter(p: Point): this {
		this._impl.setCenter(p.x, p.y);
		return this;
	}
	/**
	 * Sets the map zoom level.
	 *
	 * @param z - The zoom level (will be clamped to minZoom/maxZoom)
	 * @returns This map instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * map.setZoom(4.5);
	 * ```
	 */
	setZoom(z: number): this {
		this._impl.setZoom(z);
		return this;
	}
	/**
	 * Sets both center and zoom in a single call.
	 *
	 * @param view - Object containing center and zoom
	 * @param view.center - The new center position in pixel coordinates
	 * @param view.zoom - The zoom level
	 * @returns This map instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * map.setView({ center: { x: 1024, y: 1024 }, zoom: 3 });
	 * ```
	 */
	setView(view: { center: Point; zoom: number }): this {
		this._impl.setCenter(view.center.x, view.center.y);
		this._impl.setZoom(view.zoom);
		return this;
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
	 * Smoothly pan to a new center.
	 */
	panTo(center: Point, durationMs = 500): this {
		this._impl.panTo?.(center.x, center.y, durationMs);
		return this;
	}
	/**
	 * Smoothly change center and/or zoom.
	 */
	flyTo(opts: { center?: Point; zoom?: number; durationMs?: number }): this {
		const lng = opts.center?.x;
		const lat = opts.center?.y;
		this._impl.flyTo?.({ lng, lat, zoom: opts.zoom, durationMs: opts.durationMs });
		return this;
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
