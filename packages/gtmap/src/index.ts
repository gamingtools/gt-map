// New simplified API (pixel CRS only)
export * as api from './api';
export { GTMap } from './api/Map';
export { Marker, Vector, Layer } from './api/Map';

// Export all public types
export type { Point, TileSourceOptions, MapOptions, IconDef, IconHandle, VectorStyle, Polyline, Polygon, Circle, ActiveOptions, IconScaleFunction } from './api/types';

// Export type guard functions (not types)
export { isPolyline, isPolygon, isCircle } from './api/types';

// Export event system types (typed EventBus for public API)
export type { TypedEventBus } from './internal/events/typed-stream';
