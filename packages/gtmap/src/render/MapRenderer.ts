import type { RenderCtx } from '../types';

import { renderFrame } from './frame';

export default class MapRenderer {
  private getCtx: () => RenderCtx;
  private hooks: {
    stepAnimation?: () => boolean;
    zoomVelocityTick?: () => void;
    prefetchNeighbors?: (z: number, tl: { x: number; y: number }, scale: number, w: number, h: number) => void;
    cancelUnwanted?: () => void;
    clearWanted?: () => void;
  };

  constructor(getCtx: () => RenderCtx, hooks?: MapRenderer['hooks']) {
    this.getCtx = getCtx;
    this.hooks = hooks || {};
  }

  render() {
    const ctx: RenderCtx = this.getCtx();
    renderFrame(ctx, this.hooks);
  }
  dispose() {}
}
