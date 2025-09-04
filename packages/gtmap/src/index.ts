// Public surface: expose Leaflet-compatible APIs
export * from './leaflet/index';
import { L } from './leaflet/L';
export { L };

// Default export and `GT` namespace for compatibility
// `GT.L` mirrors the `L` namespace; prefer importing `L` directly.
export const GT = { L } as const;
export default GT;

// Types
export type { EventBus, EventStream } from './internal/events/stream';
// Compatibility type aliases (prefer using types from leaflet exports)
export type { LeafletMapFacade } from './leaflet/map/Map';
export type { LeafletGridLayerFacade } from './leaflet/layer/tile/GridLayer';
