// New simplified API (pixel CRS only)
export { GTMap } from './api/map';
export { Marker, Vector, EntityCollection } from './api/map';
export * as easings from './api/easings';

// Export Visual classes and types
export { Visual, ImageVisual, TextVisual, CircleVisual, RectVisual, SvgVisual, HtmlVisual, SpriteVisual } from './api/map';
export { isImageVisual, isTextVisual, isCircleVisual, isRectVisual, isSvgVisual, isHtmlVisual, isSpriteVisual } from './api/map';
export type { VisualType, AnchorPreset, AnchorPoint, Anchor, VisualSize, SvgShadow, SpriteAtlasHandleVisualOptions } from './api/map';

// Export all public types
export type {
	Point,
	TileSourceOptions,
	MapOptions,
	SpinnerOptions,
	MaxBoundsPx,
	IconDef,
	IconHandle,
	VectorStyle,
	Polyline,
	Polygon,
	Circle,
	SuspendOptions,
	UpscaleFilterMode,
	InertiaOptions,
	IconScaleFunction,
	Easing,
	AnimateOptions,
	ApplyOptions,
	ApplyResult,
	ApplyStatus,
	SetViewOptions,
	PaddingInput,
	EventMap,
	PointerEventData,
	MouseEventData,
	MoveEventData,
	ZoomEventData,
	FrameEventData,
	LoadEventData,
	ResizeEventData,
	MarkerHit,
	MarkerEventData,
	RenderStats,
	ViewState,
	SpriteAtlasEntry,
	SpriteAtlasMeta,
	SpriteAtlasDescriptor,
} from './api/types';

// Export classes from types
export { SpriteAtlasHandle } from './api/types';

// Export type guard functions (not types)
export { isPolyline, isPolygon, isCircle } from './api/types';

// Export public event surface types
export type { PublicEvents, EventSubscription, MarkerEvents, VectorEvents, EntityCollectionEvents, MapEvents, Unsubscribe } from './api/events/public';

export type { MarkerData, VectorData, VectorGeometry, MarkerEventMap, VectorEventMap, EntityCollectionEventMap, PointerMeta, PointerModifiers, InputDevice } from './api/events/maps';

// Export facade classes (accessed via map.view, map.layers, map.display, map.input)
export { ViewFacade } from './api/facades/view-facade';
export { LayersFacade } from './api/facades/layers-facade';
export { DisplayFacade } from './api/facades/display-facade';
export { InputFacade } from './api/facades/input-facade';

// Export layer classes and types
export { TileLayer, InteractiveLayer, StaticLayer, ClusteredLayer } from './api/layers/index';
export { clusterIconSize, clusterIconSizeDefaults } from './api/layers/index';
export type { TileLayerOptions, AddLayerOptions, ClusteredLayerOptions, ClusterBoundaryOptions, ClusterIconSizeFunction, ClusterIconSizeMode, ClusterIconSizeOptions, ClusterSnapshot, ClusterEventData } from './api/layers/types';

// Export entity option types
export type { MarkerOptions, MarkerTransition } from './entities/marker';
export type { VectorOptions } from './entities/vector';
export { CoordTransformer } from './api/coord-transformer';
export type { Bounds as SourceBounds, TransformType } from './api/coord-transformer';
