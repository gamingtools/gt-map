import type { ZoomDeps } from '../types';
import { DEBUG } from '../../debug';
import * as Coords from '../coords';

/**
 * ZoomController manages zoom animations with anchor-point stability.
 *
 * ## Core Concept: Anchored Zoom
 *
 * When zooming with a mouse wheel, the point under the cursor should remain
 * stationary on screen. This is called "anchored zoom" and requires adjusting
 * the map center as zoom changes.
 *
 * ## The Math
 *
 * Given:
 * - Current center in level space: `centerNow`
 * - Pointer position in CSS pixels: `(px, py)`
 * - Old zoom `zOld`, new zoom `zNew`
 *
 * The world point under the pointer before zoom:
 * ```
 * worldBefore = tlWorld + (px, py) / scaleOld
 * ```
 *
 * After zoom, the same world point should be at the same screen position.
 * So we need a new center such that:
 * ```
 * tlWorld_new + (px, py) / scaleNew = worldBefore_new
 * ```
 *
 * Where `worldBefore_new = worldBefore * factor` (scaled to new zoom level).
 * Solving for the new center gives us the anchored position.
 *
 * ## Zoom-Out Center Bias
 *
 * When zooming out, purely anchored zoom can feel "wrong" because the
 * viewport pulls toward the pointer. We add a configurable bias that
 * blends between pointer-anchored and center-anchored positions,
 * proportional to how much we're zooming out.
 *
 * ## Bounds Enforcement
 *
 * The controller respects maxBounds by clamping the zoom to prevent
 * showing areas outside the bounds. It can optionally "bounce" with
 * an easeOutBack effect when hitting zoom limits.
 */
export default class ZoomController {
	private deps: ZoomDeps;
	private easeBaseMs = 150;
	private easePerUnitMs = 240;
	private easeMinMs = 120;
	private easeMaxMs = 420;
	private zoomAnim: null | {
		from: number;
		to: number;
		px: number;
		py: number;
		start: number;
		dur: number;
		anchor: 'pointer' | 'center';
		bounce?: boolean;
		easing?: (t: number) => number;
	} = null;

	constructor(deps: ZoomDeps) {
		this.deps = deps;
	}
	isAnimating(): boolean {
		return !!this.zoomAnim;
	}
	cancel() {
		this.zoomAnim = null;
	}
	/**
	 * Start an eased zoom animation by a delta amount.
	 *
	 * @param dz - Zoom delta (positive = zoom in, negative = zoom out)
	 * @param px - Anchor X position in CSS pixels
	 * @param py - Anchor Y position in CSS pixels
	 * @param anchor - 'pointer' keeps the point under cursor stable; 'center' zooms around viewport center
	 * @param easing - Optional easing function (default: easeOutCubic)
	 *
	 * ## Animation Duration
	 *
	 * Duration scales with zoom distance:
	 * ```
	 * duration = base + perUnit * |dz|
	 * ```
	 * Clamped to [easeMinMs, easeMaxMs] for consistent feel.
	 *
	 * ## Continuing Animations
	 *
	 * If called during an existing animation, we calculate the current
	 * interpolated position and start the new animation from there.
	 * This provides smooth momentum when rapidly scrolling.
	 */
	startEase(dz: number, px: number, py: number, anchor: 'pointer' | 'center', easing?: (t: number) => number) {
		const now = this.deps.now();
		let current = this.deps.getZoom();
		if (this.zoomAnim) {
			const a = this.zoomAnim;
			const t = Math.min(1, (now - a.start) / a.dur);
			const ef = a.easing || ((tt: number) => 1 - Math.pow(1 - tt, 3));
			const eased = ef(t);
			current = a.from + (a.to - a.from) * eased;
		}
		let to = Math.max(this.deps.getMinZoom(), Math.min(this.deps.getMaxZoom(), current + dz));
		// Bounds-based min zoom + optional bounce at zoom limits
		let bounce = false;
		try {
			const rect = this.deps.getContainer()?.getBoundingClientRect?.();
			const mb = this.deps.getBoundsPx?.();
			if (mb && rect) {
				const widthCSS = rect.width;
				const heightCSS = rect.height;
				const boundsW = Math.max(1, mb.maxX - mb.minX);
				const boundsH = Math.max(1, mb.maxY - mb.minY);
				const zMaxImg = this.deps.getImageMaxZoom();
				const minZByW = zMaxImg + Math.log2(widthCSS / boundsW);
				const minZByH = zMaxImg + Math.log2(heightCSS / boundsH);
				const minZByBounds = Math.max(minZByW, minZByH);
				if (isFinite(minZByBounds) && to < minZByBounds) {
					bounce = !!this.deps.getBounceAtZoomLimits?.();
					to = minZByBounds;
				}
			}
		} catch {}
		const dist = Math.abs(to - current);
		const raw = this.easeBaseMs + this.easePerUnitMs * dist;
		const dur = Math.max(this.easeMinMs, Math.min(this.easeMaxMs, raw));
		this.zoomAnim = { from: current, to, px, py, start: now, dur, anchor, bounce, ...(easing !== undefined ? { easing } : {}) };
		this.deps.requestRender();
	}
	/**
	 * Advance the zoom animation by one frame.
	 *
	 * Called each frame by the main render loop. Computes the interpolated
	 * zoom value and applies it via `applyAnchoredZoom`.
	 *
	 * ## Easing
	 *
	 * Default easing is `easeOutCubic: t => 1 - (1-t)^3`
	 * This provides smooth deceleration toward the target.
	 *
	 * ## Bounce Effect
	 *
	 * When `bounce` is set (hitting zoom limits), uses `easeOutBack`:
	 * ```
	 * outBack(t) = 1 + c3*(t-1)^3 + c1*(t-1)^2
	 * ```
	 * Creates a slight overshoot then return, giving tactile feedback.
	 *
	 * @returns true if animation is still active, false if complete
	 */
	step(): boolean {
		if (!this.zoomAnim) return false;
		const now = this.deps.now();
		const a = this.zoomAnim;
		const t = Math.min(1, (now - a.start) / a.dur);
		const ef = a.easing || ((tt: number) => 1 - Math.pow(1 - tt, 3));
		let z = a.from + (a.to - a.from) * ef(t);
		if (a.bounce) {
			// easeOutBack to create a slight overshoot and return
			const c1 = 1.70158,
				c3 = c1 + 1;
			const tb = t - 1;
			const outBack = 1 + c3 * (tb * tb * tb) + c1 * (tb * tb);
			z = a.from + (a.to - a.from) * outBack;
		}
		this.applyAnchoredZoom(z, a.px, a.py, a.anchor);
		if (t >= 1) {
			this.zoomAnim = null;
			this.deps.emit('zoomend', { view: this.deps.getPublicView() });
		}
		return true;
	}

	/**
	 * Apply a zoom change while keeping the anchor point stable on screen.
	 *
	 * This is the core zoom algorithm. It transforms coordinates between
	 * zoom levels while ensuring visual continuity.
	 *
	 * @param targetZoom - The target zoom level (will be clamped)
	 * @param px - Anchor X in CSS pixels (mouse position for pointer anchor)
	 * @param py - Anchor Y in CSS pixels (mouse position for pointer anchor)
	 * @param anchor - 'pointer' or 'center'
	 *
	 * ## Algorithm (Pointer Anchor)
	 *
	 * 1. Find the world point under the pointer at current zoom:
	 *    ```
	 *    worldBefore = tlWorld + (px, py) / scale
	 *    ```
	 *
	 * 2. Scale that point to the new zoom level:
	 *    ```
	 *    factor = 2^(zInt_new - zInt_old)
	 *    worldBefore2 = worldBefore * factor
	 *    ```
	 *
	 * 3. Compute new top-left such that worldBefore2 is at (px, py):
	 *    ```
	 *    tl2 = worldBefore2 - (px, py) / scale2
	 *    ```
	 *
	 * 4. Derive center from new top-left:
	 *    ```
	 *    center2 = tl2 + viewport / (2 * scale2)
	 *    ```
	 *
	 * 5. For zoom-out, blend with center-anchored position using bias.
	 *
	 * 6. Clamp center to bounds and apply.
	 */
	applyAnchoredZoom(targetZoom: number, px: number, py: number, anchor: 'pointer' | 'center') {
		// Respect the requested anchor; default is 'pointer'.
		const anchorEff: 'pointer' | 'center' = anchor;
		const { zInt, scale } = Coords.zParts(this.deps.getZoom());
		const rect = this.deps.getContainer().getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
		const zImg = this.deps.getImageMaxZoom();
		const s0 = Coords.sFor(zImg, zInt);
		// Derive current center from public view
		const view = this.deps.getPublicView();
		const centerNow = { x: view.center.x / s0, y: view.center.y / s0 };
		const tlWorld = Coords.tlLevelFor(centerNow, view.zoom, { x: widthCSS, y: heightCSS });
		let zClamped = Math.max(this.deps.getMinZoom(), Math.min(this.deps.getMaxZoom(), targetZoom));
		// If maxBounds are set, prevent zooming out beyond bounds (Leaflet-like)
		try {
			const mb = this.deps.getBoundsPx?.();
			if (mb) {
				const rect = this.deps.getContainer().getBoundingClientRect();
				const widthCSS = rect.width;
				const heightCSS = rect.height;
				const boundsW = Math.max(1, mb.maxX - mb.minX);
				const boundsH = Math.max(1, mb.maxY - mb.minY);
				const zMaxImg = this.deps.getImageMaxZoom();
				const minZByW = zMaxImg + Math.log2(widthCSS / boundsW);
				const minZByH = zMaxImg + Math.log2(heightCSS / boundsH);
				const minZByBounds = Math.max(minZByW, minZByH);
				if (isFinite(minZByBounds)) zClamped = Math.max(zClamped, minZByBounds);
			}
		} catch {}
		const { zInt: zInt2, scale: s2 } = Coords.zParts(zClamped);
		let center2: { x: number; y: number };
		if (anchorEff === 'center') {
			const factor = Math.pow(2, zInt2 - zInt);
			center2 = { x: centerNow.x * factor, y: centerNow.y * factor };
		} else {
			const worldBefore = { x: tlWorld.x + px / scale, y: tlWorld.y + py / scale };
			const factor = Math.pow(2, zInt2 - zInt);
			const worldBefore2 = { x: worldBefore.x * factor, y: worldBefore.y * factor };
			const tl2 = { x: worldBefore2.x - px / s2, y: worldBefore2.y - py / s2 };
			const pointerCenter = { x: tl2.x + widthCSS / (2 * s2), y: tl2.y + heightCSS / (2 * s2) };
			if (zClamped < this.deps.getZoom()) {
				const centerScaled = { x: centerNow.x * factor, y: centerNow.y * factor };
				const dz = Math.max(0, this.deps.getZoom() - zClamped);
				const bias = Math.max(0, Math.min(0.6, (this.deps.getOutCenterBias() ?? 0.15) * dz));
				center2 = {
					x: pointerCenter.x * (1 - bias) + centerScaled.x * bias,
					y: pointerCenter.y * (1 - bias) + centerScaled.y * bias,
				};
			} else {
				center2 = pointerCenter;
			}
		}
		center2 = this.deps.clampCenterWorld(center2, zInt2, s2, widthCSS, heightCSS);
		const s2f = Coords.sFor(zImg, zInt2);
		this.deps.setCenterLngLat(center2.x * s2f, center2.y * s2f);
		this.deps.setZoom(zClamped);
		if (DEBUG)
			try {
				console.debug('[center] zoom', { lng: center2.x * s2f, lat: center2.y * s2f, z: zClamped });
			} catch {}
		this.deps.requestRender();
	}
	setOptions(opts: { easeBaseMs?: number; easePerUnitMs?: number; easeMinMs?: number; easeMaxMs?: number }) {
		if (Number.isFinite(opts.easeBaseMs as number)) this.easeBaseMs = Math.max(40, Math.min(600, opts.easeBaseMs as number));
		if (Number.isFinite(opts.easePerUnitMs as number)) this.easePerUnitMs = Math.max(0, Math.min(600, opts.easePerUnitMs as number));
		if (Number.isFinite(opts.easeMinMs as number)) this.easeMinMs = Math.max(20, Math.min(600, opts.easeMinMs as number));
		if (Number.isFinite(opts.easeMaxMs as number)) this.easeMaxMs = Math.max(40, Math.min(1200, opts.easeMaxMs as number));
	}
}
