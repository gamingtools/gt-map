import { map } from './map/index';
import { tileLayer, tileLayerWMS } from './layer/tile/TileLayer';
import { gridLayer } from './layer/tile/GridLayer';
import { marker } from './layer/marker/Marker';
import { icon } from './layer/marker/Icon';
import { divIcon } from './layer/marker/DivIcon';
import { layerGroup, featureGroup } from './layer/LayerGroup';
import { popup } from './layer/Popup';
import { tooltip } from './layer/Tooltip';
import { imageOverlay } from './layer/ImageOverlay';
import { videoOverlay } from './layer/VideoOverlay';
import { svgOverlay } from './layer/SVGOverlay';
import { GeoJSON, geoJSON, geoJson } from './layer/GeoJSON';
import { control } from './control/Control';

export const L = {
  map,
  tileLayer,
  marker,
  icon,
  divIcon,
  layerGroup,
  featureGroup,
  gridLayer,
  popup,
  tooltip,
  imageOverlay,
  videoOverlay,
  svgOverlay,
  control,
  // extended helpers
  geoJSON,
  geoJson,
  // nested classes typically available under L
  TileLayer: { WMS: tileLayerWMS } as any,
  GeoJSON,
} as const;

export default L;

