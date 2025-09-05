// New simplified API (pixel CRS only)
export * as api from './api';
export { GTMap } from './api/Map';

// Export all public types
export type {
	Point,
	TileSourceOptions,
	MapOptions,
	Marker,
	IconDef,
	IconHandle,
	VectorStyle,
	Polyline,
	Polygon,
	Circle,
	Vector,
	ActiveOptions,
} from './api/types';

// Export type guard functions (not types)
export { isPolyline, isPolygon, isCircle } from './api/types';

// Export event system types
export type { EventBus, EventStream } from './internal/events/stream';
export type { TypedEventBus } from './internal/events/typed-stream';
