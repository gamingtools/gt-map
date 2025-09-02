import type { ViewState, RenderCtx } from '../types';

import { renderFrame } from './frame';

export default class MapRenderer {
  render(map: any, _view?: ViewState, stepAnimation?: () => boolean) {
    const ctx: RenderCtx = map.getRenderCtx();
    renderFrame(ctx, {
      stepAnimation,
      zoomVelocityTick: () => map.zoomVelocityTick(),
      prefetchNeighbors: (z, tl, scale, w, h) => map.prefetchNeighbors(z, tl, scale, w, h),
      cancelUnwanted: () => map.cancelUnwantedLoads(),
      clearWanted: () => map.clearWantedKeys(),
    });
  }
  dispose() {}
}
