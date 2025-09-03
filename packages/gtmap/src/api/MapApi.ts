import Impl, { type MapOptions, type LngLat } from '../mapgl';
import { createIconsApi, type IconsApi } from './IconsApi';
import { createTilesApi, type TilesApi } from './TilesApi';

export interface MapApi {
  readonly icons: IconsApi;
  readonly tiles: TilesApi;
  readonly center: LngLat;
  readonly zoom: number;
  readonly events: any;
  setCenter(lng: number, lat: number): void;
  setZoom(z: number): void;
  setTileSource(opts: Parameters<Impl['setTileSource']>[0]): void;
  setEaseOptions(opts: any): void;
  setInertiaOptions(opts: any): void;
  setZoomOutCenterBias(v: number | boolean): void;
  setWheelSpeed(v: number): void;
  setWheelCtrlSpeed(v: number): void;
  setAnchorMode(m: 'pointer' | 'center'): void;
  setActive(active: boolean, opts?: { releaseGL?: boolean }): void;
  destroy(): void;
}

export function createMap(container: HTMLDivElement, options: MapOptions = {}): MapApi {
  const impl = new Impl(container, options);
  const api: MapApi = {
    get icons() { return createIconsApi(impl); },
    get tiles() { return createTilesApi(impl); },
    get center() { return impl.center; },
    get zoom() { return impl.zoom; },
    get events() { return (impl as any).events; },
    setCenter(lng, lat) { impl.setCenter(lng, lat); },
    setZoom(z) { impl.setZoom(z); },
    setTileSource(opts) { impl.setTileSource(opts); },
    setEaseOptions(opts) { (impl as any).setEaseOptions(opts); },
    setInertiaOptions(opts) { (impl as any).setInertiaOptions(opts); },
    setZoomOutCenterBias(v) { (impl as any).setZoomOutCenterBias(v); },
    setWheelSpeed(v) { (impl as any).setWheelSpeed(v); },
    setWheelCtrlSpeed(v) { (impl as any).setWheelCtrlSpeed(v); },
    setAnchorMode(m) { (impl as any).setAnchorMode(m); },
    setActive(active, opts) { (impl as any).setActive(active, opts); },
    destroy() { (impl as any).destroy(); },
  };
  return api;
}

