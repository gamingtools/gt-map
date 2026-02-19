/**
 * GTMap - A high-performance WebGL map renderer with a pixel-based coordinate system.
 *
 * Public API is organized into five facades:
 *   map.view    -- center, zoom, transitions, bounds, coordinates
 *   map.layers  -- layer creation, attachment, removal, per-layer display
 *   map.display -- background, grid, upscale filter, FPS
 *   map.input   -- wheel speed, inertia
 *   map.events  -- typed event subscriptions
 */
import type { MapEvents } from './events/public';
import type { MapOptions, SuspendOptions, EventMap } from './types';
import { SpriteAtlasHandle } from './types';
import { MapConfig } from '../internal/context/map-config';
import { MapContext } from '../internal/context/map-context';
import { LifecycleManager } from '../internal/lifecycle/lifecycle-manager';
import { ViewFacade } from './facades/view-facade';
import { InputFacade } from './facades/input-facade';
import { DisplayFacade } from './facades/display-facade';
import { LayersFacade } from './facades/layers-facade';

// Layer system imports
import { TileLayer } from './layers/tile-layer';
import { InteractiveLayer } from './layers/interactive-layer';
import { StaticLayer } from './layers/static-layer';
import { ClusteredLayer } from './layers/clustered-layer';
import { LayerRegistry } from '../internal/layers/layer-registry';
import type { AnyLayer } from '../internal/layers/layer-registry';
import { VisualIconService } from '../internal/markers/visual-icon-service';
import { TileLayerRenderer } from '../internal/layers/tile-layer-renderer';
import { InteractiveLayerRenderer } from '../internal/layers/interactive-layer-renderer';
import { StaticLayerRenderer } from '../internal/layers/static-layer-renderer';
import { ClusteredLayerRenderer } from '../internal/layers/clustered-layer-renderer';

// Re-export types from centralized types file
export type { Point, MapOptions, IconDef, IconHandle, VectorStyle, Polyline, Polygon, Circle, SuspendOptions } from './types';
export { Marker } from '../entities/marker';
export { Vector } from '../entities/vector';
export { EntityCollection } from '../entities/entity-collection';

// Re-export Visual classes and types
export { Visual, ImageVisual, TextVisual, CircleVisual, RectVisual, SvgVisual, HtmlVisual, SpriteVisual } from './visual';
export { isImageVisual, isTextVisual, isCircleVisual, isRectVisual, isSvgVisual, isHtmlVisual, isSpriteVisual } from './visual';
export type { VisualType, AnchorPreset, AnchorPoint, Anchor, VisualSize, SvgShadow, SpriteAtlasHandleVisualOptions } from './visual';

/**
 * GTMap -- the root class for creating and managing a WebGL map instance.
 *
 * @public
 * @remarks
 * Construct with a container element and {@link MapOptions}. Access functionality
 * through the four facades: {@link GTMap.view | view}, {@link GTMap.layers | layers},
 * {@link GTMap.display | display}, and {@link GTMap.input | input}.
 * Subscribe to events via {@link GTMap.events | events}.
 */
export class GTMap {
	private _ctx: MapContext;
	private _lifecycle: LifecycleManager;

	/** View control: center, zoom, transitions, bounds, coordinates. */
	readonly view: ViewFacade;
	/** Layer management: creation, attachment, removal, per-layer display. */
	readonly layers: LayersFacade;
	/** Input settings: wheel speed, inertia. */
	readonly input: InputFacade;
	/** Display settings: background, grid, upscale filter, FPS. */
	readonly display: DisplayFacade;

	// Layer system
	private _layerRegistry: LayerRegistry;
	private _createdLayers: AnyLayer[] = [];
	private _sharedVis: VisualIconService | null = null;
	private _mapIconScaleFn: ((zoom: number, minZoom: number, maxZoom: number) => number) | null = null;
	private _mapAtlases: Array<{ url: string; descriptor: import('./types').SpriteAtlasDescriptor; atlasId: string }> = [];
	private _atlasIdSeq = 0;

	/**
	 * Create a new GTMap instance inside the given container.
	 *
	 * @param container - DOM element that will host the map canvas
	 * @param options - Map configuration (size, zoom range, background, etc.)
	 */
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
				this._mapIconScaleFn = fn;
				ctx.requestRender();
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

		// Wire LayersFacade deps
		this.layers = new LayersFacade({
			createTileLayer: (opts) => {
				const layer = new TileLayer(opts);
				this._createdLayers.push(layer);
				return layer;
			},
			createInteractiveLayer: () => {
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
						try {
							ctx.renderCoordinator?.screenCache?.clear?.();
						} catch {
							/* noop */
						}
					},
					now: () => ctx.now(),
					getView: () => vs.toPublic(),
					getMapIconScaleFunction: () => this._mapIconScaleFn,
					getMapAtlases: () => this._mapAtlases,
				});
				layer._renderer = renderer;

				layer._wire(this._sharedVis, {
					setIconDefs: (defs) => renderer.setIconDefs(defs),
					setMarkers: (markers) => renderer.setMarkers(markers),
					setMarkerData: (payloads) => renderer.setMarkerData(payloads),
					onMarkerEvent: (name, handler) => renderer.onMarkerEvent(name, handler),
				});

				this._createdLayers.push(layer);
				return layer;
			},
			createStaticLayer: () => {
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
			},
			createClusteredLayer: (opts) => {
				const layer = new ClusteredLayer(opts);

				// Share VisualIconService across interactive/clustered layers
				if (!this._sharedVis) {
					this._sharedVis = new VisualIconService({
						setIconDefs: (defs) => layer._renderer!.setIconDefs(defs),
						onVisualUpdated: () => ctx.requestRender(),
					});
					this._sharedVis.ensureDefaultIcon();
				}

				const renderer = new ClusteredLayerRenderer(
					{
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
							try {
								ctx.renderCoordinator?.screenCache?.clear?.();
							} catch {
								/* noop */
							}
						},
						now: () => ctx.now(),
						getView: () => vs.toPublic(),
						getMapAtlases: () => this._mapAtlases,
					},
					opts,
				);
				layer._renderer = renderer;

				layer._wire(this._sharedVis, {
					setIconDefs: (defs) => renderer.setIconDefs(defs),
					setMarkers: (markers) => renderer.setMarkers(markers),
					setMarkerData: (payloads) => renderer.setMarkerData(payloads),
					onMarkerEvent: (name, handler) => renderer.onMarkerEvent(name, handler),
					onOptionsChanged: (o) => renderer.onOptionsChanged(o),
					getClusters: () => renderer.getClusters(),
					getClusterForMarkerId: (id) => renderer.getClusterForMarkerId(id),
				});

				this._createdLayers.push(layer);
				return layer;
			},
			addLayer: (layer, opts) => {
				if (layer._destroyed) throw new Error('GTMap: cannot add a destroyed layer');
				if (layer._attached) throw new Error('GTMap: layer is already attached');

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
								try {
									ctx.renderCoordinator?.screenCache?.clear?.();
								} catch {
									/* noop */
								}
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
				} else if (layer.type === 'clustered') {
					const cl = layer as ClusteredLayer;
					if (cl._renderer) {
						this._layerRegistry.setRenderer(layer.id, cl._renderer);
						if (ctx.gl) cl._renderer.init();
					}
				}

				ctx.requestRender();
			},
			removeLayer: (layer) => {
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
				ctx.requestRender();
			},
			setLayerOpacity: (layer, opacity) => {
				this._layerRegistry.setOpacity(layer.id, opacity);
				ctx.requestRender();
			},
			setLayerVisible: (layer, visible) => {
				this._layerRegistry.setVisible(layer.id, visible);
				ctx.requestRender();
			},
			setLayerZ: (layer, z) => {
				this._layerRegistry.setZ(layer.id, z);
				ctx.requestRender();
			},
			loadSpriteAtlas: async (url, descriptor, atlasId?) => {
				this._atlasIdSeq = (this._atlasIdSeq + 1) % Number.MAX_SAFE_INTEGER;
				const id = atlasId || `atlas_${this._atlasIdSeq.toString(36)}`;
				this._mapAtlases.push({ url, descriptor, atlasId: id });

				// Build spriteIds from descriptor (maps sprite name -> internal icon id)
				const spriteIds: Record<string, string> = {};
				for (const name of Object.keys(descriptor.sprites)) {
					spriteIds[name] = `${id}/${name}`;
				}

				// Load into all existing interactive/clustered layer renderers
				for (const layer of this._createdLayers) {
					if (layer.type === 'interactive' && layer._renderer) {
						layer._renderer.loadSpriteAtlas(url, descriptor, id).catch(() => {});
					} else if (layer.type === 'clustered' && layer._renderer) {
						layer._renderer.loadSpriteAtlas(url, descriptor, id).catch(() => {});
					}
				}

				return new SpriteAtlasHandle(id, spriteIds, descriptor);
			},
		});
	}

	// -- Lifecycle --

	/**
	 * Suspend rendering and optionally release WebGL resources.
	 * Call {@link resume} to restart.
	 */
	suspend(opts?: SuspendOptions): this {
		this._lifecycle.setActive(false, opts);
		return this;
	}

	/** Resume rendering after a {@link suspend} call. */
	resume(): this {
		this._lifecycle.setActive(true);
		return this;
	}

	/** Destroy the map instance, releasing all resources and detaching from the DOM. */
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

	/** Typed event surface for subscribing to map, pointer, and marker events. */
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
