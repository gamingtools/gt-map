// Leaflet compatibility layer is the public API surface.
// Export the GT namespace (with L facade) as both named and default.
export { GT } from './api/L';
export { GT as default } from './api/L';
export type { EventBus, EventStream } from './events/stream';
export type { default as LeafletMapFacade } from './api/map';
export type { LeafletGridLayerFacade } from './api/grid';
