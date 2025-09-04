import type { TileDeps } from '../types';
import * as Coords from '../coords';

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
		if (!url) return; // no source wired yet

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

	scheduleBaselinePrefetch(level: number, ring?: number) {
		// Prefetch a small ring around the current center at the given level
		const z = level;
		const c = this.deps.getCenter();
		const zMax = this.deps.getImageMaxZoom?.() ?? this.deps.getMaxZoom();
		const TS = this.deps.getTileSize();
		const s = Coords.sFor(zMax, z);
		const centerLevel = { x: c.lng / s, y: c.lat / s };
		const cx = Math.floor(centerLevel.x / TS);
		const cy = Math.floor(centerLevel.y / TS);
		const R = Number.isFinite(ring as number) ? Math.max(0, Math.min(8, (ring as number) | 0)) : 2; // default 5x5
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
		while (this.deps.hasCapacity()) {
			const now = this.deps.now();
			const idle = now - this.deps.getLastInteractAt() > this.deps.getInteractionIdleMs();
			const baseZ = Math.floor(this.deps.getZoom());
			const c = this.deps.getCenter();
			const zMax = this.deps.getImageMaxZoom?.() ?? this.deps.getMaxZoom();
			const s0 = Coords.sFor(zMax, baseZ);
			const centerWorld = { x: c.lng / s0, y: c.lat / s0 } as any;
			const task = this.queue.next(baseZ, centerWorld, idle, this.deps.getTileSize());
			if (!task) break;
			this.deps.startImageLoad(task);
		}
	}
}
