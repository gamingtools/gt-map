import BaseMap, { type LeafletMapOptions } from '../../api/map';

// Re-export Leaflet-compatible options type
export type { LeafletMapOptions };

// Map facade: extend the existing implementation to match Leaflet naming
export class Map extends BaseMap {}

// Leaflet-style factory
export function createMap(container: string | HTMLElement, options?: LeafletMapOptions): Map {
	return new Map(container, options);
}
