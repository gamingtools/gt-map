// New simplified API (pixel CRS only)
export { GTMap } from './api/map';
export { Marker, Vector, EntityCollection } from './api/map';
export type { ViewTransition } from './api/map';
export * as easings from './api/easings';

// Export all public types
export type {
	Point,
	ImageSourceOptions,
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
	IconScaleFunction,
	Easing,
	AnimateOptions,
	ApplyOptions,
	ApplyResult,
	ApplyStatus,
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
} from './api/types';

// Export type guard functions (not types)
export { isPolyline, isPolygon, isCircle } from './api/types';

// Export public event surface types
export type { PublicEvents, EventSubscription, MarkerEvents, VectorEvents, EntityCollectionEvents, MapEvents, Unsubscribe } from './api/events/public';

export type { MarkerData, VectorData, VectorGeometry, MarkerEventMap, VectorEventMap, EntityCollectionEventMap, PointerMeta, PointerModifiers, InputDevice } from './api/events/maps';

// Export entity option types
export type { MarkerOptions, MarkerTransition } from './entities/marker';
export type { VectorOptions } from './entities/vector';
export type { Bounds as SourceBounds, TransformType } from './api/coord-transformer';
