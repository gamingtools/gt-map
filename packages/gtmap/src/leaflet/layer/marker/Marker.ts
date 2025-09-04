import { LeafletMarkerFacade as BaseMarker, type MarkerOptions } from '../../../internal/adapters/marker';
import type { LeafletLatLng } from '../../../internal/adapters/util';

export class Marker extends BaseMarker {
	constructor(latlng: LeafletLatLng, options?: MarkerOptions) {
		super(latlng, options);
	}
}

export function marker(latlng: LeafletLatLng, options?: MarkerOptions): Marker {
	return new Marker(latlng, options);
}

// Public types
export type { MarkerOptions };
export type { LeafletLatLng };
