// New simplified API (pixel CRS only)
export { GTMap } from './api/Map';
export { Marker, Vector as VectorEntity, Layer } from './api/Map';
export type { ViewTransition } from './api/Map';
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

export type {
  MarkerData,
  VectorData,
  VectorGeometry,
  MarkerEventMap,
  VectorEventMap,
  LayerEventMap,
  PointerMeta,
  PointerModifiers,
  InputDevice,
} from './api/events/maps';

// Export entity option types
export type { MarkerOptions, MarkerTransition } from './entities/Marker';

// Leaflet compatibility helpers (pixel CRS only)
export { LeafletCompat, leafletCompat } from './compat/leaflet-compat';
export { latLng, latLngBounds } from './compat/leaflet-compat';
export type { LatLngLike, LeafletPadding, LeafletIconOptions } from './compat/leaflet-compat';
