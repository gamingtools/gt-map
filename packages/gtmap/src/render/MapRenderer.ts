import type { ViewState } from '../types';

import { renderFrame } from './frame';

export default class MapRenderer {
  render(map: any, _view?: ViewState, stepAnimation?: () => boolean) {
    const zoomVelocityTick = () => {
      if (Math.abs(map._zoomVel) <= 1e-4) return;
      const dt = Math.max(0.0005, Math.min(0.1, map._dt || 1 / 60));
      const maxStep = Math.max(0.0001, map.maxZoomRate * dt);
      let step = map._zoomVel * dt; step = Math.max(-maxStep, Math.min(maxStep, step));
      const anchor = map._wheelAnchor?.mode || map.anchorMode; const px = map._wheelAnchor?.px ?? 0; const py = map._wheelAnchor?.py ?? 0;
      map._zoomToAnchored(map.zoom + step, px, py, anchor);
      const k = Math.exp(-dt / map.zoomDamping); map._zoomVel *= k; if (Math.abs(map._zoomVel) < 1e-3) map._zoomVel = 0;
    };
    renderFrame(map, {
      stepAnimation,
      zoomVelocityTick,
      prefetchNeighbors: (z, tl, scale, w, h) => map._prefetchNeighbors(z, tl, scale, w, h),
      cancelUnwanted: () => map._cancelUnwantedLoads(),
      clearWanted: () => map._wantedKeys.clear(),
    });
  }
  dispose() {}
}
