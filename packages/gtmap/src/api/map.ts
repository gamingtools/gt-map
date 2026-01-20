import Impl, { type MapOptions as ImplMapOptions } from '../internal/mapgl';
import type { MapImpl } from '../internal/types';
import { EntityCollection } from '../entities/entity-collection';
import { Marker } from '../entities/marker';
import { Vector } from '../entities/vector';
import { ViewTransitionImpl, type ViewTransition } from '../internal/core/view-transition';
import { getVectorTypeSymbol, isPolylineSymbol, isPolygonSymbol } from '../internal/core/vector-types';

import type { VectorGeometry as VectorGeom } from './events/maps';
import type { MapEvents } from './events/public';
import { CoordTransformer, type Bounds as SourceBounds, type TransformType } from './coord-transformer';
import type { Point, MapOptions, IconDef, IconHandle, SuspendOptions, IconDefInternal, MarkerInternal, VectorPrimitiveInternal, IconScaleFunction, ApplyResult, MaxBoundsPx } from './types';

// Re-export types from centralized types file
export type { Point, MapOptions, IconDef, IconHandle, VectorStyle, Polyline, Polygon, Circle, SuspendOptions } from './types';
export { Marker } from '../entities/marker';
export { Vector } from '../entities/vector';
export { EntityCollection } from '../entities/entity-collection';

// Re-export ViewTransition interface from extracted module for public API
export type { ViewTransition };

/**
 * GTMap - A high‑performance WebGL map renderer with a pixel‑based coordinate system.
 *
 * @public
 * @remarks
 * Use this facade to configure the image, control the view, add content and subscribe to events.
 *
 * @example
 * ```ts
 * // Create a map with an 8192x8192 raster and initial view
 * const map = new GTMap(document.getElementById('map')!, {
 *   image: {
 *     url: 'https://example.com/large-map.webp',
 *     width: 8192,
 *     height: 8192,
 *   },
 *   wrapX: false,
 *   center: { x: 4096, y: 4096 },
 *   zoom: 3,
 *   maxZoom: 5
 * });
 * ```
 */
/**
 * @group Overview
 */
export class GTMap<TMarkerData = unknown> {
	private _impl: MapImpl;
	/**
	 * Marker layer for this map. Use to add/remove markers and subscribe to layer events.
	 *
	 * @group Content
	 * @example
	 * const m = map.addMarker(100, 200);
	 * map.markers.events.on('entityadd').each(({ entity }) => console.log('added', entity.id));
	 */
	readonly markers: EntityCollection<Marker<TMarkerData>>;
	/**
	 * Vector collection for this map. Use to add/remove vectors and subscribe to collection events.
	 * @group Content
	 */
	readonly vectors: EntityCollection<Vector>;
	private _defaultIconReady = false;
	private _icons: Map<string, IconDef> = new Map<string, IconDef>();
	private _markersDirty = false;
	private _markersFlushScheduled = false;
	private _coordTransformer: CoordTransformer | null = null;

	// (active view transition tracking handled via module-level WeakMap in builder)

	/**
	 * Creates a new GTMap instance.
	 *
	 * @group Lifecycle
	 * @param container - The HTML element to render the map into
	 * @param options - Configuration options for the map
	 * @param options.image - Single large raster image metadata
	 * @param options.minZoom - Minimum zoom level (default: 0)
	 * @param options.maxZoom - Maximum zoom level (default: 19)
	 * @param options.center - Initial center position in pixel coordinates
	 * @param options.zoom - Initial zoom level
	 * @param options.screenCache - Enable screen-space caching for better performance (default: true)
	 * @param options.fpsCap - Maximum frames per second (default: 60)
	 */
	constructor(container: HTMLElement, options: MapOptions) {
		// Validate required image configuration up-front
		const img = options?.image;
		if (!img) throw new Error('GTMap: image is required in MapOptions');
		if (!img.url || typeof img.url !== 'string') throw new Error('GTMap: image.url must be a non-empty string');
		if (!Number.isFinite(img.width) || img.width <= 0) throw new Error('GTMap: image.width must be a positive number');
		if (!Number.isFinite(img.height) || img.height <= 0) throw new Error('GTMap: image.height must be a positive number');

		if (Number.isFinite(options.minZoom as number) && Number.isFinite(options.maxZoom as number) && (options.minZoom as number) > (options.maxZoom as number)) {
			throw new Error('GTMap: minZoom must be <= maxZoom');
		}
		const implOpts: Partial<ImplMapOptions> = {
			image: { url: img.url, width: img.width, height: img.height },
			preview: options.preview ? { url: options.preview.url, width: options.preview.width, height: options.preview.height } : undefined,
			minZoom: options.minZoom,
			maxZoom: options.maxZoom,
			center: options.center ? { lng: options.center.x, lat: options.center.y } : undefined,
			zoom: options.zoom,
			autoResize: options.autoResize,
			backgroundColor: options.backgroundColor,
			screenCache: options.screenCache,
			fpsCap: options.fpsCap,
			wrapX: options.wrapX,
			freePan: options.freePan,
			maxBoundsPx: options.maxBoundsPx ?? undefined,
			maxBoundsViscosity: options.maxBoundsViscosity,
			bounceAtZoomLimits: options.bounceAtZoomLimits,
			spinner: options.spinner,
		};
		this._impl = new Impl(container as HTMLDivElement, implOpts);
		this._ensureDefaultIcon();
		// Impl constructor already kicks off initial image loading.

		// Entity collections
		const onMarkersChanged = () => this._markMarkersDirtyAndSchedule();
		const onVectorsChanged = () => this._flushVectors();
		this.markers = new EntityCollection<Marker<TMarkerData>>({ id: 'markers', onChange: onMarkersChanged });
		this.vectors = new EntityCollection<Vector>({ id: 'vectors', onChange: onVectorsChanged });

		// Wire internal marker events to per-marker entity events
		const toPointerMeta = (ev: { originalEvent?: PointerEvent | MouseEvent } | undefined) => {
			const oe = ev?.originalEvent;
			if (!oe) return undefined;
			// Safe field presence check on a PointerEvent/MouseEvent union
			const has = <K extends keyof (PointerEvent & MouseEvent)>(k: K): boolean => k in (oe as PointerEvent | MouseEvent);
			const ptrType = has('pointerType') ? String((oe as PointerEvent).pointerType) : 'mouse';
			const device: import('./events/maps').InputDevice = ptrType === 'mouse' || ptrType === 'touch' || ptrType === 'pen' ? (ptrType as import('./events/maps').InputDevice) : 'mouse';
			const isPrimary = has('isPrimary') ? !!(oe as PointerEvent).isPrimary : true;
			const buttons = has('buttons') ? (oe as PointerEvent).buttons : 0;
			const pointerId = has('pointerId') ? (oe as PointerEvent).pointerId : 0;
			const pressure = has('pressure') ? (oe as PointerEvent).pressure : undefined;
			const width = has('width') ? (oe as PointerEvent).width : undefined;
			const height = has('height') ? (oe as PointerEvent).height : undefined;
			const tiltX = has('tiltX') ? (oe as PointerEvent).tiltX : undefined;
			const tiltY = has('tiltY') ? (oe as PointerEvent).tiltY : undefined;
			// twist is not in standard PointerEvent in all browsers; probe safely via optional field
			const twist = (oe as PointerEvent & { twist?: number }).twist;
			const mods = {
				alt: 'altKey' in oe ? !!(oe as MouseEvent).altKey : false,
				ctrl: 'ctrlKey' in oe ? !!(oe as MouseEvent).ctrlKey : false,
				meta: 'metaKey' in oe ? !!(oe as MouseEvent).metaKey : false,
				shift: 'shiftKey' in oe ? !!(oe as MouseEvent).shiftKey : false,
			};
			return { device, isPrimary, buttons, pointerId, pressure, width, height, tiltX, tiltY, twist, modifiers: mods };
		};

		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('enter', (e: import('./types').MarkerEventData<unknown>) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (mk) mk.emitFromMap('pointerenter', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: toPointerMeta(e) });
			});
		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('leave', (e: import('./types').MarkerEventData<unknown>) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (mk) mk.emitFromMap('pointerleave', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: toPointerMeta(e) });
			});
		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('click', (e: import('./types').MarkerEventData<unknown>) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (mk) mk.emitFromMap('click', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: toPointerMeta(e) });
			});
		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('down', (e: import('./types').MarkerEventData<unknown>) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (mk) mk.emitFromMap('pointerdown', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: toPointerMeta(e) });
			});
		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('up', (e: import('./types').MarkerEventData<unknown>) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (mk) mk.emitFromMap('pointerup', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: toPointerMeta(e) });
			});
		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('longpress', (e: import('./types').MarkerEventData<unknown>) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				if (mk) mk.emitFromMap('longpress', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: toPointerMeta(e) });
			});
		// Synthesize 'tap' alias from 'click' for touch input
		if (this._impl.onMarkerEvent)
			this._impl.onMarkerEvent('click', (e: import('./types').MarkerEventData<unknown>) => {
				const id = e?.marker?.id;
				const mk = id ? this.markers.get(id) : undefined;
				const pm = toPointerMeta(e);
				if (mk && pm && pm.device === 'touch') mk.emitFromMap('tap', { x: e.screen.x, y: e.screen.y, marker: mk.toData(), pointer: pm });
			});

		// Facade-level safety: emit pointerleave when markers are removed or hidden
		this.markers.events.on('entityremove').each(({ entity }) => {
			try {
				entity.emitFromMap('pointerleave', { x: -1, y: -1, marker: entity.toData(), pointer: undefined });
			} catch {}
		});
		this.markers.events.on('visibilitychange').each(({ visible }) => {
			if (!visible) {
				for (const mk of this.markers.getAll()) {
					try {
						mk.emitFromMap('pointerleave', { x: -1, y: -1, marker: mk.toData(), pointer: undefined });
					} catch {}
				}
			}
		});
	}

	/**
	 * Initialize or update the source coordinate bounds used for translating external coordinates
	 * (e.g., Unreal/world coords) into map pixel coordinates.
	 *
	 * @public
	 * @param bounds - Source coordinate rectangle: `{ minX, minY, maxX, maxY }`
	 * @returns This map instance for chaining
	 *
	 * @remarks
	 * The mapping fits the source rectangle into the image pixel space while preserving aspect ratio
	 * (uniform scale) and centering letter/pillarboxing as needed.
	 */
	setCoordBounds(bounds: SourceBounds): this {
		const w = this._impl.mapSize.width;
		const h = this._impl.mapSize.height;
		if (!this._coordTransformer) this._coordTransformer = new CoordTransformer(w, h, bounds, 'fit');
		else this._coordTransformer.setSourceBounds(bounds);
		return this;
	}

	/**
	 * Translate a point from the configured source coordinate space to map pixel coordinates.
	 *
	 * @public
	 * @param x - Source X
	 * @param y - Source Y
	 * @param type - Optional transform to apply ('original' by default)
	 * @returns Pixel coordinates `{ x, y }` in the image space
	 *
	 * @example
	 * ```ts
	 * map.setCoordBounds({ minX: -500_000, minY: -500_000, maxX: 500_000, maxY: 500_000 });
	 * const p = map.translate(wx, wy, 'flipVertical');
	 * map.addMarker(p.x, p.y);
	 * ```
	 */
	translate(x: number, y: number, type: TransformType = 'original'): { x: number; y: number } {
		if (!this._coordTransformer) return { x, y };
		return this._coordTransformer.translate(x, y, type);
	}

	// View control helpers (internal use by transition builder)
	/** @internal */
	_applyInstant(center?: Point, zoom?: number): void {
		if (center) this._impl.setCenter(center.x, center.y);
		if (typeof zoom === 'number') this._impl.setZoom(zoom);
	}

	/**
	 * Show or hide the pixel grid overlay.
	 *
	 * @public
	 * @group Tiles & Styling
	 * @param on - `true` to show, `false` to hide
	 * @returns This map instance for chaining
	 */
	setGridVisible(on: boolean): this {
		this._impl.setGridVisible?.(on);
		return this;
	}
	/**
	 * Set the upscale filtering mode for the base image when zoomed in.
	 *
	 * @public
	 * @group Tiles & Styling
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
	 * @param fn - Returns a scale multiplier, where `1` means screen‑fixed size. Pass `null` to reset to default (`1`).
	 * @returns This map instance for chaining
	 *
	 * @remarks
	 * The function receives `(zoom, minZoom, maxZoom)` and is evaluated per frame. The resulting multiplier
	 * scales the icon's intrinsic width/height and anchor in screen space. For smoother visuals, use a
	 * continuous curve and clamp extremes.
	 *
	 * @example
	 * ```ts
	 * // Make icons grow/shrink with zoom around Z=3
	 * map.setIconScaleFunction((z) => Math.pow(2, z - 3));
	 *
	 * // Keep icons screen‑fixed regardless of zoom (default)
	 * map.setIconScaleFunction(() => 1);
	 *
	 * // Step-based behavior: small at low zooms, larger at high zooms
	 * map.setIconScaleFunction((z) => z < 2 ? 0.75 : z < 4 ? 1 : 1.25);
	 *
	 * // Reset to default policy
	 * map.setIconScaleFunction(null);
	 * ```
	 */
	setIconScaleFunction(fn: IconScaleFunction | null): this {
		this._impl.setIconScaleFunction?.(fn);
		return this;
	}

	/**
	 * Reset icon scaling to default (screen-fixed, scale = 1).
	 *
	 * @public
	 * @group View
	 * @returns This map instance for chaining
	 * @example
	 * ```ts
	 * map.resetIconScale();
	 * ```
	 */
	resetIconScale(): this {
		this._impl.setIconScaleFunction?.(null);
		return this;
	}

	// Lifecycle
	/**
	 * Suspend the map, pausing rendering and optionally releasing GPU resources.
	 *
	 * @public
	 * @group Lifecycle
	 * @param opts - Optional behavior
	 * @param opts.releaseGL - If true, release WebGL context and textures to free VRAM
	 * @returns This map instance for chaining
	 * @example
	 * ```ts
	 * // Pause rendering and release VRAM
	 * map.suspend({ releaseGL: true });
	 * // Later, resume
	 * map.resume();
	 * ```
	 */
	suspend(opts?: SuspendOptions): this {
		this._impl.setActive?.(false, opts);
		return this;
	}

	/**
	 * Resume a suspended map, restoring rendering.
	 *
	 * @public
	 * @group Lifecycle
	 * @returns This map instance for chaining
	 * @example
	 * ```ts
	 * map.resume();
	 * ```
	 */
	resume(): this {
		this._impl.setActive?.(true);
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

	/**
	 * Register an icon definition for use with markers.
	 *
	 * @public
	 * @group Content
	 * @param def - Icon bitmap metadata and source paths
	 * @param def.iconPath - URL or data URL for the 1x icon bitmap
	 * @param def.x2IconPath - Optional URL or data URL for a 2x (retina) bitmap
	 * @param def.width - Intrinsic width of the icon (pixels, 1x)
	 * @param def.height - Intrinsic height of the icon (pixels, 1x)
	 * @param def.anchorX - Optional anchor X in pixels from the left (defaults to width/2)
	 * @param def.anchorY - Optional anchor Y in pixels from the top (defaults to height/2)
	 * @param id - Optional stable id (auto-generated when omitted)
	 * @returns Handle used by {@link GTMap.addMarker}
	 *
	 * @example
	 * ```ts
	 * // Register a 24x24 pin with a 2x asset and bottom-center anchor
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
	 * @group Content
	 * @param x - World X (pixels)
	 * @param y - World Y (pixels)
	 * @param opts - Optional style and user data
	 * @param opts.icon - Handle from {@link GTMap.addIcon} (defaults to built-in dot)
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
	addMarker(x: number, y: number, opts?: { icon?: IconHandle; size?: number; rotation?: number; data?: TMarkerData }): Marker<TMarkerData> {
		const mk = new Marker<TMarkerData>(x, y, { iconType: opts?.icon?.id, size: opts?.size, rotation: opts?.rotation, data: opts?.data }, () => this._markMarkersDirtyAndSchedule());
		this.markers.add(mk);
		return mk;
	}

	/**
	 * Create and add a {@link Vector} to the `vectors` layer.
	 *
	 * @public
	 * @group Content
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
	 * Remove all markers from the map.
	 *
	 * @public
	 * @group Content
	 * @returns This map instance for method chaining
	 */
	clearMarkers(): this {
		this.markers.clear();
		return this;
	}
	/**
	 * Remove all vector shapes from the map.
	 *
	 * @public
	 * @group Content
	 * @returns This map instance for method chaining
	 */
	clearVectors(): this {
		this.vectors.clear();
		this._impl.setVectors?.([]);
		return this;
	}

	/**
	 * Get the current center position in world pixels.
	 *
	 * @public
	 * @group View
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
	 * @group View
	 * @returns The zoom value (fractional allowed)
	 */
	getZoom(): number {
		return this._impl.zoom;
	}
	/**
	 * Get the last pointer position in world pixels.
	 *
	 * @public
	 * @group View
	 * @returns Position or `null` if outside the map
	 */
	getPointerAbs(): { x: number; y: number } | null {
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
	 * Enable or disable horizontal world wrap.
	 *
	 * @public
	 * @group Tiles & Styling
	 * @param on - `true` to allow infinite panning across X (wrap), `false` to clamp at image edges
	 * @returns This map instance for chaining
	 * @remarks
	 * Pixel CRS only: when wrapping is enabled, the world repeats seamlessly along X; Y is never wrapped.
	 */
	setWrapX(on: boolean): this {
		this._impl.setWrapX(on);
		return this;
	}

	/**
	 * Constrain panning to pixel bounds (Leaflet‑like). Pass `null` to clear.
	 *
	 * @public
	 * @group Tiles & Styling
	 * @param bounds - `{ minX, minY, maxX, maxY }` in world pixels, or `null` to remove constraints
	 * @returns This map instance for chaining
	 * @remarks
	 * When set, zoom‑out is also clamped so the given bounds always cover the viewport.
	 */
	setMaxBoundsPx(bounds: MaxBoundsPx | null): this {
		this._impl.setMaxBoundsPx(bounds);
		return this;
	}

	/**
	 * Set bounds viscosity (0..1) for a resistive effect near the edges.
	 *
	 * @public
	 * @group Tiles & Styling
	 * @param v - Viscosity factor in [0..1]; `0` = hard clamp, `1` = very soft
	 * @returns This map instance for chaining
	 */
	setMaxBoundsViscosity(v: number): this {
		this._impl.setMaxBoundsViscosity(v);
		return this;
	}
	/**
	 * Set the maximum frames per second.
	 *
	 * @public
	 * @group View
	 * @param v - FPS limit (15-240)
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
	 * @group Tiles & Styling
	 * @param color - Color string or RGB object; `'transparent'` for fully transparent
	 * @returns This map instance for chaining
	 * @remarks
	 * Policy: either `'transparent'` (fully transparent) or a solid color; alpha on colors is ignored.
	 * @example
	 * ```ts
	 * // Transparent viewport (useful over custom app backgrounds)
	 * map.setBackgroundColor('transparent');
	 * // Switch to a solid dark background
	 * map.setBackgroundColor('#0a0a0a');
	 * ```
	 */
	setBackgroundColor(color: string | { r: number; g: number; b: number; a?: number }): this {
		this._impl.setBackgroundColor?.(color);
		return this;
	}
	/**
	 * Enable or disable automatic resize handling.
	 *
	 * @public
	 * @group View
	 * @param on - `true` to enable, `false` to disable
	 * @returns This map instance for chaining
	 * @remarks
	 * When enabled, a ResizeObserver watches the container (debounced via rAF) and a window
	 * resize listener tracks DPR changes.
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
	/** @internal */
	_animateView(opts: { center?: Point; zoom?: number; durationMs: number; easing?: (t: number) => number }): void {
		const { center, zoom, durationMs, easing } = opts;
		const lng = center?.x;
		const lat = center?.y;
		this._impl.flyTo?.({ lng, lat, zoom, durationMs, easing });
	}

	/** @internal */
	_cancelPanZoom(): void {
		try {
			this._impl.cancelPanAnim?.();
		} catch {}
		try {
			this._impl.cancelZoomAnim?.();
		} catch {}
	}

	/** @internal */
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

	/** @internal */
	_setView(center: Point, zoom: number, opts?: { animate?: { durationMs: number; delayMs?: number; easing?: (t: number) => number } }): Promise<ApplyResult> {
		if (opts?.animate) {
			this._animateView({ center, zoom, durationMs: opts.animate.durationMs, easing: opts.animate.easing });
			return this.events.once('moveend').then(() => ({ status: 'animated' }));
		} else {
			this._applyInstant(center, zoom);
			return Promise.resolve({ status: 'instant' });
		}
	}

	/**
	 * Recompute canvas sizes after external container changes.
	 *
	 * @public
	 * @group View
	 * @returns This map instance for chaining
	 */
	invalidateSize(): this {
		this._impl.resize?.();
		return this;
	}

	/**
	 * Read-only map events surface (`on`/`once`).
	 *
	 * @public
	 * @group Events
	 * @example
	 * ```ts
	 * map.events.on('move').each(({ view }) => console.log(view.center, view.zoom));
	 * await map.events.once('zoomend');
	 * ```
	 */
	get events(): MapEvents<TMarkerData> {
		return {
			on: (name: string, handler?: (value: unknown) => void) => {
				// Bridge overloads: return the stream or subscribe inline. The cast is localized
				// to preserve precise generic types for callers across the two forms.
				const stream = this._impl.events.on(name as keyof import('./types').EventMap);
				return handler ? stream.each(handler) : stream;
			},
			once: (name: string) => this._impl.events.when(name as keyof import('./types').EventMap),
		} as MapEvents<TMarkerData>;
	}

	/**
	 * Start a chainable view transition.
	 *
	 * @public
	 * @group View
	 * @remarks
	 * The builder is side-effect free until {@link ViewTransition.apply | apply()} is called.
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
			const typeSymbol = getVectorTypeSymbol(g.type);
			if (typeSymbol && (isPolylineSymbol(typeSymbol) || isPolygonSymbol(typeSymbol))) {
				// TypeScript narrowing: we know it's polyline or polygon
				const polyGeom = g as VectorGeom & { type: 'polyline' | 'polygon'; points: Point[] };
				return {
					type: polyGeom.type,
					points: polyGeom.points.map((p) => ({ lng: p.x, lat: p.y })),
					style: polyGeom.style,
				};
			}
			// TypeScript narrowing: we know it's a circle
			const circleGeom = g as VectorGeom & { type: 'circle'; center: Point; radius: number };
			return { type: 'circle', center: { lng: circleGeom.center.x, lat: circleGeom.center.y }, radius: circleGeom.radius, style: circleGeom.style };
		});
		this._impl.setVectors?.(internalVectors);
	}
}
