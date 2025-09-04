// Leaflet compatibility layer remains available via GT namespace.
export { GT } from './api/L';
export { GT as default } from './api/L';

// Also expose a Leaflet-compatible surface: named exports and `L` alias
export * from './leaflet/index';
export { GT as L } from './api/L';

// Types
export type { EventBus, EventStream } from './events/stream';
export type { default as LeafletMapFacade } from './api/map';
export type { LeafletGridLayerFacade } from './api/grid';
