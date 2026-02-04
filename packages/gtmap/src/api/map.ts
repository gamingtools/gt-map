/**
 * GTMap - A high-performance WebGL map renderer with a pixel-based coordinate system.
 *
 * Public API is organized into four facades:
 *   map.view    -- center, zoom, transitions, bounds, coordinates
 *   map.input   -- wheel speed, inertia
 *   map.content -- markers, vectors, icons
 *   map.display -- background, grid, upscale filter, FPS
 */
import type { MapEvents } from './events/public';
import type { MapOptions, SuspendOptions, EventMap } from './types';
import { MapConfig } from '../internal/context/map-config';
import { MapContext } from '../internal/context/map-context';
import { ContentManager } from '../internal/content/content-manager';
import { LifecycleManager } from '../internal/lifecycle/lifecycle-manager';
import { ViewFacade } from './facades/view-facade';
import { InputFacade } from './facades/input-facade';
import { ContentFacade } from './facades/content-facade';
import { DisplayFacade } from './facades/display-facade';

// Re-export types from centralized types file
export type { Point, MapOptions, IconDef, IconHandle, VectorStyle, Polyline, Polygon, Circle, SuspendOptions } from './types';
export { Marker } from '../entities/marker';
export { Vector } from '../entities/vector';
export { EntityCollection } from '../entities/entity-collection';

// Re-export Visual classes and types
export { Visual, ImageVisual, TextVisual, CircleVisual, RectVisual, SvgVisual, HtmlVisual, SpriteVisual } from './visual';
export { isImageVisual, isTextVisual, isCircleVisual, isRectVisual, isSvgVisual, isHtmlVisual, isSpriteVisual } from './visual';
export type { VisualType, AnchorPreset, AnchorPoint, Anchor, VisualSize, SvgShadow } from './visual';

/**
 * @group Overview
 */
export class GTMap {
	private _ctx: MapContext;
	private _lifecycle: LifecycleManager;

	/** View control: center, zoom, transitions, bounds, coordinates. */
	readonly view: ViewFacade;
	/** Input settings: wheel speed, inertia. */
	readonly input: InputFacade;
	/** Content management: markers, vectors, icons. */
	readonly content: ContentFacade;
	/** Display settings: background, grid, upscale filter, FPS. */
	readonly display: DisplayFacade;

	constructor(container: HTMLElement, options: MapOptions) {
		const tiles = options?.tiles;
		if (!tiles) throw new Error('GTMap: tiles is required in MapOptions');
		if (!tiles.packUrl || typeof tiles.packUrl !== 'string') throw new Error('GTMap: tiles.packUrl must be a non-empty string');
		if (!Number.isFinite(tiles.tileSize) || tiles.tileSize <= 0) throw new Error('GTMap: tiles.tileSize must be a positive number');
		if (!tiles.mapSize || !Number.isFinite(tiles.mapSize.width) || !Number.isFinite(tiles.mapSize.height)) throw new Error('GTMap: tiles.mapSize must have width and height');
		if (Number.isFinite(options.minZoom as number) && Number.isFinite(options.maxZoom as number) && (options.minZoom as number) > (options.maxZoom as number)) {
			throw new Error('GTMap: minZoom must be <= maxZoom');
		}

		const config = new MapConfig(options);
		const ctx = new MapContext(container as HTMLDivElement, config);
		this._ctx = ctx;

		// Create ContentManager eagerly so icon defs and markers can be buffered
		// before async init completes (prevents silent drops).
		ctx.contentManager = new ContentManager({
			getGL: () => ctx.gl!,
			getContainer: () => ctx.container,
			getZoom: () => ctx.viewState.zoom,
			getMinZoom: () => ctx.viewState.minZoom,
			getMaxZoom: () => ctx.viewState.maxZoom,
			getDpr: () => ctx.viewState.dpr,
			getZoomSnapThreshold: () => ctx.viewState.zoomSnapThreshold,
			getCenter: () => ctx.viewState.center,
			getImageMaxZoom: () => ctx.viewState.imageMaxZoom,
			getView: () => ctx.viewState.toPublic(),
			debugWarn: (msg, err) => ctx.debug.warn(msg, err),
			debugLog: (msg) => ctx.debug.log(msg),
			requestRender: () => ctx.requestRender(),
			clearScreenCache: () => {
				try {
					ctx.renderCoordinator?.screenCache?.clear?.();
				} catch {
					/* expected: render coordinator may be disposed */
				}
			},
			now: () => ctx.now(),
		});

		this._lifecycle = new LifecycleManager(ctx);
		this._lifecycle.init();

		const vs = ctx.viewState;
		const lm = this._lifecycle;
		const cm = ctx.contentManager!;

		// Wire ViewFacade deps
		this.view = new ViewFacade({
			getCenter: () => vs.center,
			getZoom: () => vs.zoom,
			getPointerAbs: () => ctx.pointerAbs,
			getMapSize: () => vs.mapSize,
			getMinZoom: () => vs.minZoom,
			getMaxZoom: () => vs.maxZoom,
			getImageMaxZoom: () => vs.imageMaxZoom,
			getContainer: () => ctx.container,
			events: { when: <K extends keyof EventMap>(event: K) => ctx.events.when(event) },
			setCenter: (x, y) => {
				vs.setCenter(x, y);
				ctx.requestRender();
			},
			setZoom: (z) => {
				vs.setZoom(z);
				ctx.requestRender();
			},
			setWrapX: (on) => {
				if (!!on !== vs.wrapX) {
					vs.wrapX = !!on;
					ctx.requestRender();
				}
			},
			setMaxBoundsPx: (bounds) => {
				vs.maxBoundsPx = bounds ? { ...bounds } : null;
				ctx.requestRender();
			},
			setMaxBoundsViscosity: (v) => {
				vs.maxBoundsViscosity = Math.max(0, Math.min(1, v));
				ctx.requestRender();
			},
			setClipToBounds: (on) => {
				if (!!on !== vs.clipToBounds) {
					vs.clipToBounds = !!on;
					ctx.requestRender();
				}
			},
			setIconScaleFunction: (fn) => cm.setIconScaleFunction(fn),
			setAutoResize: (on) => lm.setAutoResize(on),
			resize: () => ctx.renderCoordinator?.resize(),
			flyTo: (opts) => ctx.renderCoordinator?.flyTo(opts),
			cancelPanAnim: () => ctx.renderCoordinator?.panController.cancel(),
			cancelZoomAnim: () => ctx.renderCoordinator?.zoomController.cancel(),
		});

		// Wire InputFacade deps
		this.input = new InputFacade({
			setWheelSpeed: (v) => ctx.options.setWheelSpeed(v),
			setInertiaOptions: (opts) => ctx.options.setInertiaOptions(opts),
		});

		// Wire ContentFacade deps
		this.content = new ContentFacade({
			setIconDefs: (defs) => cm.setIconDefs(defs),
			setMarkers: (markers) => cm.setMarkers(markers),
			setVectors: (vectors) => cm.setVectors(vectors),
			setMarkerData: (payloads) => cm.setMarkerData(payloads),
			onMarkerEvent: (name, handler) => cm.onMarkerEvent(name, handler),
			loadSpriteAtlas: (url, desc, id) => cm.loadSpriteAtlas(url, desc, id),
		});

		// Wire DisplayFacade deps
		this.display = new DisplayFacade({
			setGridVisible: (on) => ctx.renderCoordinator?.setGridVisible(on),
			setUpscaleFilter: (mode) => cm.setUpscaleFilter(mode),
			setFpsCap: (v) => ctx.renderCoordinator?.setFpsCap(v),
			setBackgroundColor: (color) => lm.setBackgroundColor(color),
			setRasterOpacity: (v) => cm.setRasterOpacity(v),
			setZoomSnapThreshold: (v) => {
				const c = Math.max(0, Math.min(1, v));
				if (c !== vs.zoomSnapThreshold) {
					vs.zoomSnapThreshold = c;
					ctx.requestRender();
				}
			},
		});
	}

	// -- Lifecycle --

	suspend(opts?: SuspendOptions): this {
		this._lifecycle.setActive(false, opts);
		return this;
	}

	resume(): this {
		this._lifecycle.setActive(true);
		return this;
	}

	destroy(): void {
		this._lifecycle.destroy();
	}

	// -- Events --

	get events(): MapEvents {
		const bus = this._ctx.events;
		return {
			on: <K extends keyof EventMap & string>(name: K, handler?: (value: EventMap[K]) => void) => {
				const stream = bus.on(name);
				return handler ? stream.each(handler) : stream;
			},
			once: <K extends keyof EventMap & string>(name: K) => bus.when(name),
		} as MapEvents;
	}
}
