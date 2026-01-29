import { levelFactor } from '../coords';

export type TileTask = {
  key: string;
  url: string;
  z: number;
  x: number;
  y: number;
  priority: number;
};

export class TileQueue {
  private queue: TileTask[] = [];
  private set = new Set<string>();

  enqueue(task: TileTask) {
    if (this.set.has(task.key)) return;
    this.queue.push(task);
    this.set.add(task.key);
  }

  prune(wantedKeys: Set<string>) {
    if (!this.queue.length) return;
    const keep: TileTask[] = [];
    for (const t of this.queue) {
      if (wantedKeys.has(t.key)) keep.push(t);
      else this.set.delete(t.key);
    }
    this.queue = keep;
  }

  next(baseZ: number, centerWorld: { x: number; y: number }, idle: boolean, tileSize: number): TileTask | null {
    if (!this.queue.length) return null;
    let bestIdx = -1;
    let bestScore = Infinity;
    for (let i = 0; i < this.queue.length; i++) {
      const t = this.queue[i]!;
      if (!idle && t.z > baseZ) continue;
      const factor = levelFactor(baseZ, t.z);
      const centerTileX = Math.floor(centerWorld.x / factor / tileSize);
      const centerTileY = Math.floor(centerWorld.y / factor / tileSize);
      const dx = t.x - centerTileX;
      const dy = t.y - centerTileY;
      const dist = Math.hypot(dx, dy);
      const zBias = Math.abs(t.z - baseZ);
      const distWeight = idle ? 1.0 : 2.0;
      const score = t.priority * 100 + zBias * 12 + dist * distWeight;
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
        if (score === 0) break;
      }
    }
    if (bestIdx === -1) return null;
    const task = this.queue.splice(bestIdx, 1)[0]!;
    this.set.delete(task.key);
    return task;
  }

  has(key: string) {
    return this.set.has(key);
  }
  get length() {
    return this.queue.length;
  }
}
