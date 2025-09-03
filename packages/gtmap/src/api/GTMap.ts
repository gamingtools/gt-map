import Impl, { type MapOptions, type LngLat } from '../mapgl';
import { createIconsApi, type IconsApi } from './IconsApi';

export default class GTMap {
  private _impl: Impl;
  public readonly icons: IconsApi;

  constructor(container: HTMLDivElement, options: MapOptions = {}) {
    this._impl = new Impl(container, options);
    this.icons = createIconsApi(this._impl);
  }

  // Properties (readonly views)
  get center(): LngLat { return this._impl.center; }
  get zoom(): number { return this._impl.zoom; }
  get pointerAbs(): { x: number; y: number } | null { return (this._impl as any).pointerAbs; }
  get events() { return (this._impl as any).events; }

  // Backwards-compat (deprecated) — prefer map.icons.*
  async setIconDefs(defs: any) { return (this.icons as any).setDefs(defs); }
  setMarkers(markers: any) { return this.icons.setMarkers(markers); }

  // Public methods forwarded
  setCenter(lng: number, lat: number) { this._impl.setCenter(lng, lat); }
  setZoom(z: number) { this._impl.setZoom(z); }
  setTileSource(opts: Parameters<Impl['setTileSource']>[0]) { this._impl.setTileSource(opts); }
  setEaseOptions(opts: any) { (this._impl as any).setEaseOptions(opts); }
  setInertiaOptions(opts: any) { (this._impl as any).setInertiaOptions(opts); }
  setZoomOutCenterBias(v: number | boolean) { (this._impl as any).setZoomOutCenterBias(v); }
  setLoaderOptions(opts: any) { (this._impl as any).setLoaderOptions(opts); }
  setPrefetchOptions(opts: any) { (this._impl as any).setPrefetchOptions(opts); }
  setScreenCacheEnabled(on: boolean) { (this._impl as any).setScreenCacheEnabled(on); }
  setWheelSpeed(v: number) { (this._impl as any).setWheelSpeed(v); }
  setWheelCtrlSpeed(v: number) { (this._impl as any).setWheelCtrlSpeed(v); }
  setAnchorMode(m: 'pointer' | 'center') { (this._impl as any).setAnchorMode(m); }
  setActive(active: boolean, opts?: { releaseGL?: boolean }) { (this._impl as any).setActive(active, opts); }
  recenter() { (this._impl as any).recenter(); }
  destroy() { (this._impl as any).destroy(); }
}

