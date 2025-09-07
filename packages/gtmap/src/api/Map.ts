import Impl, { type MapOptions as ImplMapOptions } from '../internal/mapgl';
import type { MapImpl } from '../internal/types';
import { Layer } from '../entities/Layer';
import { Marker } from '../entities/Marker';
import { Vector, type VectorGeometry as VectorGeom } from '../entities/Vector';

import type { MapEvents } from './events/public';
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
  ApplyOptions,
  ApplyResult,
} from './types';

// Re-export types from centralized types file
export type { Point, TileSourceOptions, MapOptions, IconDef, IconHandle, VectorStyle, Polyline, Polygon, Circle, Vector as VectorLegacy, ActiveOptions } from './types';
export { Marker } from '../entities/Marker';
export { Vector } from '../entities/Vector';
export { Layer } from '../entities/Layer';

/**
 * GTMap - A high‑performance WebGL map renderer with a pixel‑based coordinate system.
 *
 * @public
 * @remarks
 * Use this facade to configure tiles, control the view, add content and subscribe to events.
 *
 * @example
 * ```ts
 * // Create a map with an initial tile source and view
 * const map = new GTMap(document.getElementById('map')!, {
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
	 * Configure or replace the tile source.
	 *
	 * @public
	 * @param opts - Tile source configuration
	 * @returns This map instance for chaining
	 *
	 * @example
 	 * ```ts
 	 * // Replace the tile source with a finite 8k image pyramid (no wrap)
 	 * map.setTileSource({
 	 *   url: 'https://tiles.example.com/{z}/{x}_{y}.webp',
 	 *   tileSize: 256,
 	 *   sourceMaxZoom: 5,
 	 *   mapSize: { width: 8192, height: 8192 },
 	 *   wrapX: false,
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
	 * Show or hide the tile grid overlay.
	 *
	 * @public
	 * @param on - `true` to show, `false` to hide
	 * @returns This map instance for chaining
	 */
	setGridVisible(on: boolean): this {
		this._impl.setGridVisible?.(on);
		return this;
	}
	/**
	 * Set the upscale filtering mode for low‑resolution tiles.
	 *
	 * @public
	 * @param mode - `'auto'` | `'linear'` | `'bicubic'`
	 * @returns This map instance for chaining
	 */
	setUpscaleFilter(mode: 'auto' | 'linear' | 'bicubic'): this {
		this._impl.setUpscaleFilter?.(mode);
		return this;
	}

	/**
	 * Set a custom function to control icon scaling vs. zoom.
	 *
	 * @public
	 * @param fn - Returns a scale multiplier, where `1` means screen‑fixed size
	 * @returns This map instance for chaining
	 *
	 * @example
 	 * ```ts
 	 * // Make icons grow/shrink with zoom around Z=3
 	 * map.setIconScaleFunction((z) => Math.pow(2, z - 3));
 	 * ```
	 */
	setIconScaleFunction(fn: IconScaleFunction | null): this {
		this._impl.setIconScaleFunction?.(fn);
		return this;
	}

	// Lifecycle
	/**
	 * Suspend or resume the map.
	 *
	 * @public
	 * @param on - `true` to activate, `false` to suspend
	 * @param opts - Optional behavior
	 * @returns This map instance for chaining
	 * @example
 	 * ```ts
 	 * // Pause rendering and release VRAM, then resume later
 	 * map.setActive(false, { releaseGL: true });
 	 * map.setActive(true);
 	 * ```
	 */
	setActive(on: boolean, opts?: ActiveOptions): this {
		this._impl.setActive?.(on, opts);
		return this;
	}
	/**
	 * Destroy the map instance and release all resources.
	 *
	 * @public
	 */
	destroy(): void {
		this._impl.destroy?.();
	}

	// Add content (batched internally)
	/**
	 * Register an icon definition for use with markers.
	 *
	 * @public
	 * @param def - Icon bitmap metadata and source paths
	 * @param def.iconPath - URL or data URL for the 1x icon bitmap
	 * @param def.x2IconPath - Optional URL or data URL for a 2x (retina) bitmap
	 * @param def.width - Intrinsic width of the icon (pixels, 1x)
	 * @param def.height - Intrinsic height of the icon (pixels, 1x)
	 * @param def.anchorX - Optional anchor X in pixels from the left (defaults to width/2)
	 * @param def.anchorY - Optional anchor Y in pixels from the top (defaults to height/2)
	 * @param id - Optional stable id (auto‑generated when omitted)
	 * @returns Handle used by {@link GTMap.addMarker}
	 *
	 * @example
	 * ```ts
	 * // Register a 24x24 pin with a 2x asset and bottom‑center anchor
	 * const pin = map.addIcon({
	 *   iconPath: '/icons/pin-24.png',
	 *   x2IconPath: '/icons/pin-48.png',
	 *   width: 24,
	 *   height: 24,
	 *   anchorX: 12,
	 *   anchorY: 24,
	 * });
	 * // Use the icon when adding a marker
	 * const m = map.addMarker(2048, 2048, { icon: pin, size: 1.0 });
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
	 * @public
	 * @param x - World X (pixels)
	 * @param y - World Y (pixels)
	 * @param opts - Optional style and user data
	 * @param opts.icon - Handle from {@link GTMap.addIcon} (defaults to built‑in dot)
	 * @param opts.size - Scale multiplier (default 1)
	 * @param opts.rotation - Rotation in degrees clockwise
	 * @param opts.data - Arbitrary app data stored on the marker
	 * @returns The created {@link Marker}
	 *
	 * @example
	 * ```ts
	 * // Add a POI marker using a registered icon
	 * const poi = map.addMarker(1200, 900, { icon: pin, size: 1.25, rotation: 0, data: { id: 'poi-7' } });
	 * poi.events.on('click', (e) => console.log('clicked', e.marker.id));
	 * ```
	 */
	addMarker(x: number, y: number, opts?: { icon?: IconHandle; size?: number; rotation?: number; data?: unknown }): Marker {
		const mk = new Marker(x, y, { iconType: opts?.icon?.id, size: opts?.size, rotation: opts?.rotation, data: opts?.data }, () => this._markMarkersDirtyAndSchedule());
		this.markers.add(mk);
		return mk;
	}
	// addMarkers removed in favor of per-entity API
	/**
	 * Add legacy vector shapes in a single batch.
	 *
	 * @public
	 * @param vectors - Array of vector definitions
	 * @returns This map instance for chaining
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
	 * Create and add a {@link Vector} to the `vectors` layer.
	 *
	 * @public
	 * @param geometry - Vector geometry (polyline, polygon, circle)
	 * @returns The created {@link Vector}
 	 *
 	 * @example
 	 * ```ts
 	 * // Add a polyline
 	 * const v = map.addVector({ type: 'polyline', points: [ { x: 0, y: 0 }, { x: 100, y: 50 } ] });
 	 * // Later, update its geometry
 	 * v.setGeometry({ type: 'circle', center: { x: 200, y: 200 }, radius: 40 });
 	 * ```
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
	/** @public Remove all markers from the map. */
	clearMarkers(): this {
		this.markers.clear();
		return this;
	}
	/**
	 * Removes all vector shapes from the map.
	 *
	 * @returns This map instance for method chaining
	 */
	/** @public Remove all vectors from the map. */
	clearVectors(): this {
		this.vectors.clear();
		this._impl.setVectors?.([]);
		return this;
	}

	// Compatibility getters used by HUD
	/**
	 * Get the current center position in world pixels.
	 *
	 * @public
	 * @returns The center position
	 */
	getCenter(): Point {
		const c = this._impl.center as { lng: number; lat: number };
		return { x: c.lng, y: c.lat };
	}
	/**
	 * Get the current zoom level.
	 *
	 * @public
	 * @returns The zoom value (fractional allowed)
	 */
	getZoom(): number {
		return this._impl.zoom;
	}
	/**
	 * Get the last pointer position in world pixels.
	 *
	 * @public
	 * @returns Position or `null` if outside the map
	 */
	get pointerAbs(): { x: number; y: number } | null {
		return this._impl.pointerAbs ?? null;
	}
	/**
	 * Set mouse‑wheel zoom speed.
	 *
	 * @public
	 * @param v - Speed multiplier (0.01–2.0)
	 * @returns This map instance for chaining
 	 *
 	 * @example
 	 * ```ts
 	 * // Wire to a range input for user control
 	 * const input = document.querySelector('#wheelSpeed') as HTMLInputElement;
 	 * input.oninput = () => map.setWheelSpeed(Number(input.value));
 	 * ```
	 */
	setWheelSpeed(v: number): this {
		this._impl.setWheelSpeed?.(v);
		return this;
	}
	/**
	 * Set the maximum frames per second.
	 *
	 * @public
	 * @param v - FPS limit (15–240)
	 * @returns This map instance for chaining
 	 *
 	 * @example
 	 * ```ts
 	 * // Lower FPS cap to save battery
 	 * map.setFpsCap(30);
 	 * ```
	 */
	setFpsCap(v: number): this {
		this._impl.setFpsCap(v);
		return this;
	}

    /**
     * Set the viewport background.
     *
     * @public
     * @remarks
     * Policy: either `'transparent'` (fully transparent) or a solid color; alpha on colors is ignored.
     *
     * @example
     * ```ts
     * // Transparent viewport (useful over custom app backgrounds)
     * map.setBackgroundColor('transparent');
     * // Switch to a solid dark background
     * map.setBackgroundColor('#0a0a0a');
     * ```
     */
	setBackgroundColor(color: string | { r: number; g: number; b: number; a?: number }): this {
		this._impl.setBackgroundColor?.(color as any);
		return this;
	}
	/**
	 * Enable or disable automatic resize handling.
	 *
	 * @public
	 * @remarks
	 * When enabled, a ResizeObserver watches the container (debounced via rAF) and a window
	 * resize listener tracks DPR changes.
	 *
	 * @example
 	 * ```ts
 	 * // Manage size manually: disable auto and call invalidate on layout changes
 	 * map.setAutoResize(false);
 	 * map.invalidateSize();
 	 * ```
	 */
	setAutoResize(on: boolean): this {
		this._impl.setAutoResize?.(on);
		return this;
	}
    _animateView(opts: { center?: Point; zoom?: number; durationMs: number; easing?: (t: number) => number }): void {
        const { center, zoom, durationMs, easing } = opts;
        const lng = center?.x;
        const lat = center?.y;
        this._impl.flyTo?.({ lng, lat, zoom, durationMs, easing });
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
        const imageMaxZ = this._impl.getImageMaxZoom();
        let z = imageMaxZ + Math.log2(Math.max(1e-6, k));
        // clamp
        z = Math.max(this._impl.getMinZoom(), Math.min(this._impl.getMaxZoom(), z));
        const center: Point = { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
        return { center, zoom: z };
    }
	/**
	 * Recompute canvas sizes after external container changes.
	 *
	 * @public
	 * @returns This map instance for chaining
	 */
	invalidateSize(): this {
		this._impl.resize?.();
		return this;
	}

	// Events proxy
	/**
	 * Read‑only map events surface (`on`/`once`).
	 *
	 * @public
	 * @example
	 * ```ts
	 * map.events.on('move').each(({ view }) => console.log(view.center, view.zoom));
	 * await map.events.once('zoomend');
	 * ```
	 */
	get events(): MapEvents {
		return {
			on: (name: any, handler?: any) => {
				const stream = this._impl.events.on(name as any);
				return handler ? stream.each(handler) : stream;
			},
			once: (name: any) => this._impl.events.when(name as any),
		} as MapEvents;
	}

	/**
	 * Start a chainable view transition.
	 *
	 * @public
	 * @remarks
	 * The builder is side‑effect free until {@link ViewTransition.apply | apply()} is called.
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
  points(list: Array<Point>, padding?: number | { top: number; right: number; bottom: number; left: number }): this;
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
  // private started flag removed
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

  points(list: Array<Point>, padding?: number | { top: number; right: number; bottom: number; left: number }): this {
    if (!list || list.length === 0) return this;
    let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
    for (const p of list) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return this.bounds({ minX, minY, maxX, maxY }, padding);
  }

  // markers(...) removed for now; use points(...) with marker positions if needed

  cancel(): void {
    if (this.settled) return;
    this.cancelled = true;
    this._resolve({ status: 'canceled' });
  }

  async apply(opts?: ApplyOptions): Promise<ApplyResult> {
    if (this.promise) return this.promise;
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
    const easing = animate.easing;
    this.map._animateView({ center: finalCenter, zoom: finalZoom, durationMs, easing });

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
