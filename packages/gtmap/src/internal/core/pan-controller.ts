import * as Coords from '../coords';
import type { PanDeps } from '../types';

import { clampCenterWorld as clampCenterWorldCore } from './bounds';

export default class PanController {
	private deps: PanDeps;
	private anim: null | {
		start: number;
		dur: number; // seconds
		fromWorld: { x: number; y: number };
		offsetWorld: { x: number; y: number };
		easing?: (t: number) => number;
	} = null;

	constructor(deps: PanDeps) {
		this.deps = deps;
	}

	isAnimating(): boolean {
		return !!this.anim;
	}

	cancel(): void {
		this.anim = null;
	}

	// Start a pan by screen-pixel offset over duration in seconds
	startBy(dxPx: number, dyPx: number, durationSec: number, easing?: (t: number) => number): void {
		const { zInt, scale } = Coords.zParts(this.deps.getZoom());
		const zImg = this.deps.getImageMaxZoom();
		const s0 = Coords.sFor(zImg, zInt);
		const center = this.deps.getCenter(); // map center in native pixels
		const fromWorld = { x: center.x / s0, y: center.y / s0 };
		const offsetWorld = { x: dxPx / scale, y: dyPx / scale };
		this.anim = {
			start: this.deps.now(),
			dur: Math.max(0.05, durationSec),
			fromWorld,
			offsetWorld,
			easing,
		};
		this.deps.requestRender();
	}

	step(): boolean {
		if (!this.anim) return false;
		const a = this.anim;
		const now = this.deps.now();
		const t = Math.min(1, (now - a.start) / (a.dur * 1000));
		let p = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
		try {
			if (typeof a.easing === 'function') p = a.easing(t);
		} catch {}

		const { zInt, scale } = Coords.zParts(this.deps.getZoom());
		const rect = this.deps.getContainer().getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;

		const target = { x: a.fromWorld.x + a.offsetWorld.x * p, y: a.fromWorld.y + a.offsetWorld.y * p };

		const clamped = clampCenterWorldCore(
			target,
			zInt,
			scale,
			widthCSS,
			heightCSS,
			this.deps.getWrapX(),
			this.deps.getFreePan(),
			this.deps.getMapSize(),
			this.deps.getMaxZoom(),
			this.deps.getMaxBoundsPx(),
			this.deps.getMaxBoundsViscosity(),
			false,
		);

		const zImg = this.deps.getImageMaxZoom();
		const s0 = Coords.sFor(zImg, zInt);
		this.deps.setCenter(clamped.x * s0, clamped.y * s0);
		this.deps.requestRender();

		if (t >= 1) {
			this.anim = null;
			this.deps.emit('moveend', { view: this.deps.getPublicView() });
		}
		return true;
	}
}
