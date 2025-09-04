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
import { Polyline, Polygon, Rectangle, Circle, CircleMarker } from './layer/vector';

function polyline(latlngs: any, options?: any) { return new Polyline(latlngs, options); }
function polygon(latlngs: any, options?: any) { return new Polygon(latlngs, options); }
function rectangle(bounds: [[number, number],[number, number]] | any, options?: any) {
  // Accept Leaflet-style bounds and convert to latlngs (pixel CRS)
  let latlngs = bounds as any;
  if (Array.isArray(bounds) && Array.isArray(bounds[0]) && Array.isArray(bounds[1])) {
    const sw = bounds[0];
    const ne = bounds[1];
    const nw: [number, number] = [ne[0], sw[1]];
    const se: [number, number] = [sw[0], ne[1]];
    latlngs = [sw, se, ne, nw];
  }
  return new Rectangle(latlngs, options);
}
function circle(latlng: any, options?: any) { return new Circle(latlng, options); }
function circleMarker(latlng: any, options?: any) { return new CircleMarker(latlng, options); }

export const L = {
  map,
  tileLayer,
  marker,
  icon,
  divIcon,
  layerGroup,
  featureGroup,
  // compatibility alias for legacy `GT.L.grid()`
  grid: gridLayer,
  gridLayer,
  popup,
  tooltip,
  imageOverlay,
  videoOverlay,
  svgOverlay,
  control,
  // vectors
  polyline,
  polygon,
  rectangle,
  circle,
  circleMarker,
  // extended helpers
  geoJSON,
  geoJson,
  // nested classes typically available under L
  TileLayer: { WMS: tileLayerWMS } as any,
  GeoJSON,
} as const;

export default L;
