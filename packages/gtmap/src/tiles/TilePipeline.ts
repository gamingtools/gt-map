import { lngLatToWorld } from '../mercator';
import { TileQueue } from './queue';
import { tileKey as tileKeyOf } from './source';

export default class TilePipeline {
  private map: any;
  private queue: TileQueue;

  constructor(map: any) {
    this.map = map;
    this.queue = new TileQueue();
  }

  enqueue(z: number, x: number, y: number, priority = 1) {
    const key = tileKeyOf(z, x, y);
    if (this.map._tileCache.has(key) || this.map._pendingKeys.has(key) || this.queue.has(key)) return;
    const url = this.map._tileUrl(z, x, y);
    this.queue.enqueue({ key, url, z, x, y, priority });
    this.process();
  }

  cancelUnwanted(wantedKeys: Set<string>) {
    this.queue.prune(wantedKeys);
    this.process();
  }

  clear() {
    this.queue = new TileQueue();
    this.map._inflightLoads = 0;
  }

  scheduleBaselinePrefetch(level: number) {
    const z = level; const n = 1 << z;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const key = `${z}/${x}/${y}`; this.map._pinnedKeys.add(key);
        if (!this.map._tileCache.has(key)) this.enqueue(z, x, y, 2);
      }
    }
  }

  process() {
    while (this.map._inflightLoads < this.map._maxInflightLoads) {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const idle = (now - this.map._lastInteractAt) > this.map.interactionIdleMs;
      const baseZ = Math.floor(this.map.zoom);
      const centerWorld = lngLatToWorld(this.map.center.lng, this.map.center.lat, baseZ);
      const task = this.queue.next(baseZ, centerWorld, idle);
      if (!task) break;
      this.map._startImageLoad(task);
    }
  }
}
