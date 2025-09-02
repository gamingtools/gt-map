import { startZoomEase as coreStartZoomEase } from './zoom';

export default class ZoomController {
  private map: any;
  constructor(map: any) { this.map = map; }
  isAnimating(): boolean { return !!this.map._zoomAnim; }
  cancel() { this.map._zoomAnim = null; }
  startEase(dz: number, px: number, py: number, anchor: 'pointer' | 'center') {
    coreStartZoomEase(this.map, dz, px, py, anchor);
  }
  step(): boolean {
    const map = this.map;
    if (!map._zoomAnim) return false;
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const a = map._zoomAnim;
    const t = Math.min(1, (now - a.start) / a.dur);
    const ease = 1 - Math.pow(1 - t, 3);
    const z = a.from + (a.to - a.from) * ease;
    map._zoomToAnchored(z, a.px, a.py, a.anchor);
    if (t >= 1) { map._zoomAnim = null; map._renderBaseLockZInt = null; map._events.emit('zoomend', { center: map.center, zoom: map.zoom }); }
    return true;
  }
}

