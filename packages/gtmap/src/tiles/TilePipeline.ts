import { lngLatToWorld } from '../mercator';
import type { TileDeps } from '../types';

import { TileQueue } from './queue';
import { tileKey as tileKeyOf } from './source';

export default class TilePipeline {
  private deps: TileDeps;
  private queue: TileQueue;

  constructor(deps: TileDeps) {
    this.deps = deps;
    this.queue = new TileQueue();
  }

  enqueue(z: number, x: number, y: number, priority = 1) {
    const key = tileKeyOf(z, x, y);
    if (this.deps.hasTile(key) || this.deps.isPending(key) || this.queue.has(key)) return;
    const url = this.deps.urlFor(z, x, y);
    this.queue.enqueue({ key, url, z, x, y, priority });
    this.process();
  }

  cancelUnwanted(wantedKeys: Set<string>) {
    this.queue.prune(wantedKeys);
    this.process();
  }

  clear() {
    this.queue = new TileQueue();
  }

  scheduleBaselinePrefetch(level: number) {
    const z = level;
    const n = 1 << z;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const key = `${z}/${x}/${y}`;
        this.deps.addPinned(key);
        if (!this.deps.hasTile(key)) this.enqueue(z, x, y, 2);
      }
    }
  }

  process() {
    while (this.deps.hasCapacity()) {
      const now = this.deps.now();
      const idle = now - this.deps.getLastInteractAt() > this.deps.getInteractionIdleMs();
      const baseZ = Math.floor(this.deps.getZoom());
      const c = this.deps.getCenter();
      const centerWorld = lngLatToWorld(c.lng, c.lat, baseZ);
      const task = this.queue.next(baseZ, centerWorld, idle, this.deps.getTileSize());
      if (!task) break;
      this.deps.startImageLoad(task);
    }
  }
}
