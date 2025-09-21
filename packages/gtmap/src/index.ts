// New simplified API (pixel CRS only)
export { GTMap } from './api/map';
export { Marker, Vector as VectorEntity, Layer } from './api/map';
export type { ViewTransition } from './api/map';
export * as easings from './api/easings';

// Export all public types
export type {
	Point,
	ImageSourceOptions,
	MapOptions,
	IconDef,
	IconHandle,
	VectorStyle,
	Vector,
	Polyline,
	Polygon,
	Circle,
	ActiveOptions,
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
export type { PublicEvents, EventSubscription, MarkerEvents, VectorEvents, LayerEvents, MapEvents, Unsubscribe } from './api/events/public';

export type { MarkerData, VectorData, VectorGeometry, MarkerEventMap, VectorEventMap, LayerEventMap, PointerMeta, PointerModifiers, InputDevice } from './api/events/maps';

// Export entity option types
export type { MarkerOptions, MarkerTransition } from './entities/marker';
