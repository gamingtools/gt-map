import LeafletMapFacade from './map';
import { LeafletTileLayerFacade } from './tileLayer';
import { LeafletMarkerFacade, createIcon } from './marker';
import type { LeafletLatLng } from './util';

export const GT = {
  L: {
    map: (container: string | HTMLElement, options?: any) => new LeafletMapFacade(container as any, options),
    tileLayer: (url: string, options?: any) => new LeafletTileLayerFacade(url, options),
    marker: (latlng: LeafletLatLng, options?: any) => new LeafletMarkerFacade(latlng, options),
    icon: (options: any) => createIcon(options),
    control: {}, // placeholder for Phase 2
  },
};

