/**
 * GTMap - A high-performance WebGL map renderer with a pixel-based coordinate system.
 *
 * Public API is organized into four facades:
 *   map.view    -- center, zoom, transitions, bounds, coordinates
 *   map.input   -- wheel speed, inertia
 *   map.content -- markers, vectors, icons (legacy, use layers API for new code)
 *   map.display -- background, grid, upscale filter, FPS
 *
 * Layer API:
 *   map.createTileLayer(opts) -> TileLayer
 *   map.createInteractiveLayer() -> InteractiveLayer
 *   map.createStaticLayer() -> StaticLayer
 *   map.addLayer(layer, opts)
 *   map.removeLayer(layer)
 */
import type { MapEvents } from './events/public';
import type { MapOptions, SuspendOptions, EventMap } from './types';
import { MapConfig } from '../internal/context/map-config';
import { MapContext } from '../internal/context/map-context';
import { LifecycleManager } from '../internal/lifecycle/lifecycle-manager';
import { ViewFacade } from './facades/view-facade';
import { InputFacade } from './facades/input-facade';
import { DisplayFacade } from './facades/display-facade';

// Layer system imports
import { TileLayer } from './layers/tile-layer';
import { InteractiveLayer } from './layers/interactive-layer';
import { StaticLayer } from './layers/static-layer';
import type { TileLayerOptions, AddLayerOptions } from './layers/types';
import { LayerRegistry } from '../internal/layers/layer-registry';
import type { AnyLayer } from '../internal/layers/layer-registry';
import { VisualIconService } from '../internal/markers/visual-icon-service';
import { TileLayerRenderer } from '../internal/layers/tile-layer-renderer';
import { InteractiveLayerRenderer } from '../internal/layers/interactive-layer-renderer';
import { StaticLayerRenderer } from '../internal/layers/static-layer-renderer';

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
	/** Display settings: background, grid, upscale filter, FPS. */
	readonly display: DisplayFacade;

	// Layer system
	private _layerRegistry: LayerRegistry;
	private _createdLayers: AnyLayer[] = [];
	private _sharedVis: VisualIconService | null = null;

	constructor(container: HTMLElement, options: MapOptions) {
		if (!options.mapSize || !Number.isFinite(options.mapSize.width) || !Number.isFinite(options.mapSize.height)) throw new Error('GTMap: mapSize must have finite width and height');
		if (Number.isFinite(options.minZoom as number) && Number.isFinite(options.maxZoom as number) && (options.minZoom as number) > (options.maxZoom as number)) {
			throw new Error('GTMap: minZoom must be <= maxZoom');
		}

		const config = new MapConfig(options);
		const ctx = new MapContext(container as HTMLDivElement, config);
		this._ctx = ctx;

		// Layer registry
		this._layerRegistry = new LayerRegistry();
		ctx.layerRegistry = this._layerRegistry;

		this._lifecycle = new LifecycleManager(ctx);
		this._lifecycle.init();

		const vs = ctx.viewState;
		const lm = this._lifecycle;
		const reg = this._layerRegistry;

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
			setIconScaleFunction: (fn) => {
				for (const entry of reg.entries()) {
					if (entry.layer.type === 'interactive' && entry.renderer) {
						(entry.renderer as unknown as InteractiveLayerRenderer).setIconScaleFunction(fn);
					}
				}
			},
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

		// Wire DisplayFacade deps
		this.display = new DisplayFacade({
			setGridVisible: (on) => ctx.renderCoordinator?.setGridVisible(on),
			setUpscaleFilter: (mode) => {
				for (const entry of reg.entries()) {
					if (entry.layer.type === 'tile' && entry.renderer) {
						(entry.renderer as unknown as TileLayerRenderer).setUpscaleFilter(mode);
					}
				}
			},
			setFpsCap: (v) => ctx.renderCoordinator?.setFpsCap(v),
			setBackgroundColor: (color) => lm.setBackgroundColor(color),
			setZoomSnapThreshold: (v) => {
				const c = Math.max(0, Math.min(1, v));
				if (c !== vs.zoomSnapThreshold) {
					vs.zoomSnapThreshold = c;
					ctx.requestRender();
				}
			},
		});
	}

	// -- Layer API --

	/** Create a tile layer (not yet added to the map). */
	createTileLayer(opts: TileLayerOptions): TileLayer {
		const layer = new TileLayer(opts);
		this._createdLayers.push(layer);
		return layer;
	}

	/** Create an interactive layer for markers (not yet added to the map). */
	createInteractiveLayer(): InteractiveLayer {
		const ctx = this._ctx;
		const vs = ctx.viewState;
		const layer = new InteractiveLayer();

		// Share VisualIconService across interactive layers
		if (!this._sharedVis) {
			this._sharedVis = new VisualIconService({
				setIconDefs: (defs) => layer._renderer!.setIconDefs(defs),
				onVisualUpdated: () => ctx.requestRender(),
			});
			this._sharedVis.ensureDefaultIcon();
		}

		// Create own InteractiveLayerRenderer (buffers state before GL init)
		const renderer = new InteractiveLayerRenderer({
			getGL: () => ctx.gl!,
			getContainer: () => ctx.container,
			getDpr: () => vs.dpr,
			getZoom: () => vs.zoom,
			getMinZoom: () => vs.minZoom,
			getMaxZoom: () => vs.maxZoom,
			getCenter: () => vs.center,
			getImageMaxZoom: () => vs.imageMaxZoom,
			getZoomSnapThreshold: () => vs.zoomSnapThreshold,
			debugWarn: (msg, err) => ctx.debug.warn(msg, err),
			debugLog: (msg) => ctx.debug.log(msg),
			requestRender: () => ctx.requestRender(),
			clearScreenCache: () => {
				try { ctx.renderCoordinator?.screenCache?.clear?.(); } catch { /* noop */ }
			},
			now: () => ctx.now(),
			getView: () => vs.toPublic(),
		});
		layer._renderer = renderer;

		layer._wire(this._sharedVis, {
			setIconDefs: (defs) => renderer.setIconDefs(defs),
			setMarkers: (markers) => renderer.setMarkers(markers),
			setMarkerData: (payloads) => renderer.setMarkerData(payloads),
			onMarkerEvent: (name, handler) => renderer.onMarkerEvent(name, handler),
			loadSpriteAtlas: (url, desc, id) => renderer.loadSpriteAtlas(url, desc, id),
		});
		this._createdLayers.push(layer);
		return layer;
	}

	/** Create a static layer for vector shapes (not yet added to the map). */
	createStaticLayer(): StaticLayer {
		const ctx = this._ctx;
		const vs = ctx.viewState;
		const layer = new StaticLayer();

		const renderer = new StaticLayerRenderer({
			getContainer: () => ctx.container,
			getGL: () => ctx.gl!,
			getDpr: () => vs.dpr,
			getZoom: () => vs.zoom,
			getCenter: () => vs.center,
			getImageMaxZoom: () => vs.imageMaxZoom,
			requestRender: () => ctx.requestRender(),
			debugWarn: (msg, err) => ctx.debug.warn(msg, err),
		});
		layer._renderer = renderer;

		layer._wire({
			setVectors: (vectors) => renderer.setVectors(vectors),
		});
		this._createdLayers.push(layer);
		return layer;
	}

	/** Add a layer to the map at a given z-order. */
	addLayer(layer: AnyLayer, opts: AddLayerOptions): void {
		if (layer._destroyed) throw new Error('GTMap: cannot add a destroyed layer');
		if (layer._attached) throw new Error('GTMap: layer is already attached');

		const ctx = this._ctx;
		const vs = ctx.viewState;
		const state = {
			z: opts.z,
			visible: opts.visible !== false,
			opacity: Math.max(0, Math.min(1, opts.opacity ?? 1)),
		};
		layer._attached = true;
		this._layerRegistry.add(layer, state);

		// Create per-layer renderer
		if (layer.type === 'tile') {
			const tl = layer as TileLayer;
			const renderer = new TileLayerRenderer(
				{
					getGL: () => ctx.gl!,
					getMapSize: () => vs.mapSize,
					getImageMaxZoom: () => vs.imageMaxZoom,
					debugLog: (msg) => ctx.debug.log(msg),
					debugWarn: (msg, err) => ctx.debug.warn(msg, err),
					requestRender: () => ctx.requestRender(),
					clearScreenCache: () => {
						try { ctx.renderCoordinator?.screenCache?.clear?.(); } catch { /* noop */ }
					},
					now: () => ctx.now(),
					getLastInteractAt: () => ctx.lastInteractAt,
					getInteractionIdleMs: () => ctx.options.interactionIdleMs,
					isAnimating: () => ctx.renderCoordinator?.isAnimating() ?? false,
					updateViewForSource: () => {
						/* Map owns mapSize/zoom -- tile source does not override. */
					},
				},
				tl.options,
			);
			this._layerRegistry.setRenderer(layer.id, renderer);
			// Init immediately if GL is ready, otherwise defer
			if (ctx.gl) renderer.init();
		} else if (layer.type === 'interactive') {
			const il = layer as InteractiveLayer;
			if (il._renderer) {
				this._layerRegistry.setRenderer(layer.id, il._renderer);
				if (ctx.gl) il._renderer.init();
			}
		} else if (layer.type === 'static') {
			const sl = layer as StaticLayer;
			if (sl._renderer) {
				this._layerRegistry.setRenderer(layer.id, sl._renderer);
				if (ctx.gl) sl._renderer.init();
			}
		}

		ctx.requestRender();
	}

	/** Remove a layer from the map (data is preserved). */
	removeLayer(layer: AnyLayer): void {
		if (!layer._attached) return;
		const entry = this._layerRegistry.remove(layer.id);
		layer._attached = false;
		if (entry?.renderer) {
			try {
				entry.renderer.dispose();
			} catch {
				/* expected */
			}
		}
		this._ctx.requestRender();
	}

	/** Set opacity for an attached layer (0 to 1). */
	setLayerOpacity(layer: AnyLayer, opacity: number): void {
		this._layerRegistry.setOpacity(layer.id, opacity);
		this._ctx.requestRender();
	}

	/** Set visibility for an attached layer. */
	setLayerVisible(layer: AnyLayer, visible: boolean): void {
		this._layerRegistry.setVisible(layer.id, visible);
		this._ctx.requestRender();
	}

	/** Set z-order for an attached layer. */
	setLayerZ(layer: AnyLayer, z: number): void {
		this._layerRegistry.setZ(layer.id, z);
		this._ctx.requestRender();
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
		// Mark all created layers as destroyed
		for (const layer of this._createdLayers) {
			layer._destroyed = true;
			layer._attached = false;
		}
		this._layerRegistry.destroyAll();
		this._createdLayers = [];
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
