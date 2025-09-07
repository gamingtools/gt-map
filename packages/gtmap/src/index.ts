// New simplified API (pixel CRS only)
export * as api from './api';
export { GTMap } from './api/Map';
export { Marker, Vector, Layer } from './api/Map';
export type { ViewTransition } from './api/Map';
export * as easings from './api/easings';

// Export all public types
export type { Point, TileSourceOptions, MapOptions, IconDef, IconHandle, VectorStyle, Polyline, Polygon, Circle, ActiveOptions, IconScaleFunction, Easing, AnimateOptions, ApplyOptions, ApplyResult, ApplyStatus } from './api/types';

// Export type guard functions (not types)
export { isPolyline, isPolygon, isCircle } from './api/types';

// Export public event surface types
export type { PublicEvents, EventSubscription, MarkerEvents, VectorEvents, LayerEvents, MapEvents } from './api/events/public';
