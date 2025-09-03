import LeafletMapFacade, { type LeafletMapOptions } from './map';
import { LeafletTileLayerFacade } from './tileLayer';
import { LeafletMarkerFacade, createIcon } from './marker';
import type { TileLayerOptions } from './tileLayer';
import type { IconOptions, LeafletIcon, MarkerOptions } from './marker';
import { createGridLayer, type GridLayerOptions } from './grid';
import { createLayerGroup, createFeatureGroup } from './layerGroup';
import Layer from './layer';
import type { LeafletLatLng } from './util';

export const GT = {
  L: {
    map: (container: string | HTMLElement, options?: LeafletMapOptions): LeafletMapFacade => new LeafletMapFacade(container as any, options),
    tileLayer: (url: string, options?: TileLayerOptions): LeafletTileLayerFacade => new LeafletTileLayerFacade(url, options),
    marker: (latlng: LeafletLatLng, options?: MarkerOptions): LeafletMarkerFacade => new LeafletMarkerFacade(latlng, options),
    icon: (options: IconOptions): LeafletIcon => createIcon(options),
    grid: (options?: GridLayerOptions) => createGridLayer(options),
    layerGroup: (layers?: Layer[]) => createLayerGroup(layers),
    featureGroup: (layers?: Layer[]) => createFeatureGroup(layers),
    control: {}, // placeholder for Phase 2
  },
};

export type { LeafletMapOptions, TileLayerOptions, IconOptions, LeafletIcon, MarkerOptions, LeafletLatLng, GridLayerOptions };
