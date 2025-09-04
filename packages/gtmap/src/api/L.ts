/**
 * @deprecated Use the `L` namespace from `leaflet/L` (re-exported at package root).
 * This file remains for backwards compatibility and proxies to the latest facade.
 */
import { L } from '../leaflet/L';
export { L };
export const GT = { L } as const;
export default GT;

// Re-export public types from latest facade for compatibility
export type { LeafletMapOptions } from '../leaflet/map/Map';
export type { TileLayerOptions } from '../api/tileLayer';
export type { IconOptions, LeafletIcon, MarkerOptions } from '../api/marker';
export type { LeafletLatLng } from '../api/util';
export type { GridLayerOptions } from '../api/grid';
