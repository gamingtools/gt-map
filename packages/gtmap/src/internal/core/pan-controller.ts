import * as Coords from '../coords';
import type { PanDeps } from '../types';

import { clampCenterWorld as clampCenterWorldCore } from './bounds';

/**
 * PanController manages smooth pan animations (inertia, flyTo).
 *
 * ## Coordinate Space Handling
 *
 * Pan animations work in "level space" (tile-aligned coordinates) rather
 * than world space to ensure smooth animation across zoom levels.
 *
 * The conversion:
 * ```
 * levelCoord = worldCoord / sFor(imageMaxZ, zInt)
 * ```
 *
 * ## Inertia Animation
 *
 * When the user releases a drag with velocity, `InputController` computes
 * the projected distance and calls `startBy(dx, dy, duration)`.
 *
 * The pan offset is specified in CSS pixels and converted to level space:
 * ```
 * offsetLevel = offsetCSS / scale
 * ```
 *
 * ## Easing
 *
 * Default easing is exponential ease-out:
 * ```
 * p = 1 - 2^(-10 * t)
 * ```
 * This provides fast initial movement that smoothly decelerates.
 *
 * ## Bounds Clamping
 *
 * Each animation step clamps the interpolated position against maxBounds,
 * preventing the animation from overshooting into forbidden areas.
 */
export default class PanController {
	private static readonly MIN_REMAINING_PX = 0.25;
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

	/**
	 * Start a pan animation by a screen-pixel offset.
	 *
	 * @param dxPx - Horizontal offset in CSS pixels (positive = pan right/east)
	 * @param dyPx - Vertical offset in CSS pixels (positive = pan down/south)
	 * @param durationSec - Animation duration in seconds
	 * @param easing - Optional easing function (default: exponential ease-out)
	 *
	 * ## Coordinate Conversion
	 *
	 * CSS pixel offsets are converted to level space for animation:
	 * ```
	 * offsetLevel = offsetCSS / scale
	 * ```
	 *
	 * The animation stores the starting position and total offset,
	 * then interpolates between them each frame.
	 */
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
			...(easing !== undefined ? { easing } : {}),
		};
		this.deps.requestRender();
	}

	/**
	 * Advance the pan animation by one frame.
	 *
	 * ## Interpolation
	 *
	 * ```
	 * target = fromWorld + offsetWorld * easing(t)
	 * ```
	 *
	 * Where `t = elapsed / duration` and easing defaults to:
	 * ```
	 * p = 1 - 2^(-10 * t)  // exponential ease-out
	 * ```
	 *
	 * ## Bounds Handling
	 *
	 * The interpolated position is clamped via `clampCenterWorld` before
	 * being applied. This respects maxBounds and viscosity settings.
	 *
	 * @returns true if animation is still active, false if complete
	 */
	step(): boolean {
		if (!this.anim) return false;
		const a = this.anim;
		const now = this.deps.now();
		const t = Math.min(1, (now - a.start) / (a.dur * 1000));
		// Exponential ease-out: fast start, smooth deceleration
		let p = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
		try {
			if (typeof a.easing === 'function') p = a.easing(t);
		} catch {}

		const { zInt, scale } = Coords.zParts(this.deps.getZoom());
		const rect = this.deps.getContainer().getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;

		const target = { x: a.fromWorld.x + a.offsetWorld.x * p, y: a.fromWorld.y + a.offsetWorld.y * p };
		const remainingPx = Math.hypot(a.offsetWorld.x * (1 - p) * scale, a.offsetWorld.y * (1 - p) * scale);

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
		const shouldFinish = t >= 1 || remainingPx <= PanController.MIN_REMAINING_PX;
		if (shouldFinish) {
			const finalTarget = { x: a.fromWorld.x + a.offsetWorld.x, y: a.fromWorld.y + a.offsetWorld.y };
			const finalClamped = clampCenterWorldCore(
				finalTarget,
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
			this.deps.setCenter(finalClamped.x * s0, finalClamped.y * s0);
			this.deps.requestRender();
			this.anim = null;
			this.deps.emit('moveend', { view: this.deps.getPublicView() });
			return false;
		}

		this.deps.setCenter(clamped.x * s0, clamped.y * s0);
		this.deps.requestRender();
		return true;
	}
}
