import type { TileDeps } from '../types';
import * as Coords from '../coords';

import { TileQueue } from './queue';
import { tileKey as tileKeyOf } from './source';

export default class TilePipeline {
  private deps: TileDeps;
  private queue: TileQueue;
  private _retryScheduled = false;

  constructor(deps: TileDeps) {
    this.deps = deps;
    this.queue = new TileQueue();
  }

  enqueue(z: number, x: number, y: number, priority = 1) {
    const key = tileKeyOf(z, x, y);
    if (this.deps.hasTile(key) || this.deps.isPending(key)) return;
    // Bounds check: reject tile coordinates outside the map extent
    if (!this.inBounds(z, x, y)) return;
    if (!this.queue.has(key)) {
      const url = this.deps.urlFor(z, x, y);
      if (!url) return;
      this.queue.enqueue({ key, url, z, x, y, priority });
    }
    // Always try to drain the queue, even if this tile was already queued.
    this.process();
  }

  /** Check whether tile (z, x, y) falls within the map's tile grid. */
  private inBounds(z: number, x: number, y: number): boolean {
    if (x < 0 || y < 0) return false;
    const zMax = this.deps.getImageMaxZoom?.() ?? this.deps.getMaxZoom();
    const TS = this.deps.getTileSize();
    const mapSize = this.deps.getMapSize();
    const s = Coords.sFor(zMax, z);
    const tilesX = Math.ceil(Math.ceil(mapSize.width / s) / TS);
    const tilesY = Math.ceil(Math.ceil(mapSize.height / s) / TS);
    return x < tilesX && y < tilesY;
  }

  cancelUnwanted(wantedKeys: Set<string>) {
    this.queue.prune(wantedKeys);
    this.process();
  }

  clear() {
    this.queue = new TileQueue();
    this._retryScheduled = false;
  }

  scheduleBaselinePrefetch(level: number, ring?: number) {
    const z = level;
    const c = this.deps.getCenter();
    const zMax = this.deps.getImageMaxZoom?.() ?? this.deps.getMaxZoom();
    const TS = this.deps.getTileSize();
    const s = Coords.sFor(zMax, z);
    const centerLevel = { x: c.lng / s, y: c.lat / s };
    const cx = Math.floor(centerLevel.x / TS);
    const cy = Math.floor(centerLevel.y / TS);
    const R = Number.isFinite(ring as number) ? Math.max(0, Math.min(8, (ring as number) | 0)) : 2;
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx < 0 || ty < 0) continue;
        const key = `${z}/${tx}/${ty}`;
        this.deps.addPinned(key);
        if (!this.deps.hasTile(key)) this.enqueue(z, tx, ty, 2);
      }
    }
  }

  process() {
    const now = this.deps.now();
    const idle = now - this.deps.getLastInteractAt() > this.deps.getInteractionIdleMs();

    while (this.deps.hasCapacity()) {
      const baseZ = Math.floor(this.deps.getZoom());
      const c = this.deps.getCenter();
      const zMax = this.deps.getImageMaxZoom?.() ?? this.deps.getMaxZoom();
      const s0 = Coords.sFor(zMax, baseZ);
      const centerWorld = { x: c.lng / s0, y: c.lat / s0 };
      const task = this.queue.next(baseZ, centerWorld, idle, this.deps.getTileSize());
      if (!task) break;
      this.deps.startImageLoad(task);
    }
    // If throttled (moving) and queue still has items, retry next frame
    if (this.queue.length > 0 && !this.deps.hasCapacity() && this.deps.isMoving() && !this._retryScheduled) {
      this._retryScheduled = true;
      requestAnimationFrame(() => {
        this._retryScheduled = false;
        this.process();
      });
    }
  }
}
