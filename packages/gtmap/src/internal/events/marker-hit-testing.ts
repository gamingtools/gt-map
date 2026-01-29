/**
 * MarkerHitTesting handles hit detection for markers at screen positions.
 *
 * ## Algorithm Overview
 *
 * 1. **Iterate top-to-bottom**: Markers are rendered in array order, so later
 *    markers appear on top. We iterate in reverse to find the topmost hit first.
 *
 * 2. **AABB test**: First check if point is within the marker's axis-aligned
 *    bounding box (fast rejection for most markers).
 *
 * 3. **Alpha mask test** (optional): For pixel-accurate hits on non-rectangular
 *    icons, sample the icon's alpha channel. This handles irregular shapes,
 *    transparency, and rotation.
 *
 * ## Rotation Handling
 *
 * When a marker is rotated, we need to "unrotate" the hit point before sampling
 * the alpha mask. The rotation is around the anchor point:
 *
 * ```
 * 1. Translate point to anchor-relative coords: (lx - ax, ly - ay)
 * 2. Apply inverse rotation: rotate by -theta
 * 3. Translate back: add anchor offset
 * 4. Sample mask at the unrotated position
 * ```
 */

import * as Coords from '../coords';
import type { IconRenderer } from '../layers/icons';

export type HoverKey = { type: string; idx: number; id?: string };

export type HitResult = {
	idx: number;
	id: string;
	type: string;
	world: { x: number; y: number };
	screen: { x: number; y: number };
	size: { width: number; height: number };
	rotation?: number;
	icon: {
		iconPath: string;
		x2IconPath?: string;
		width: number;
		height: number;
		anchorX: number;
		anchorY: number;
	};
};

export type AllHitsResult = {
	id: string;
	idx: number;
	world: { x: number; y: number };
	size: { width: number; height: number };
	rotation?: number;
	icon: {
		id: string;
		iconPath: string;
		x2IconPath?: string;
		width: number;
		height: number;
		anchorX: number;
		anchorY: number;
	};
};

export interface MarkerHitTestingDeps {
	getContainer(): HTMLDivElement;
	getZoom(): number;
	getMinZoom(): number;
	getMaxZoom(): number;
	getCenter(): { lng: number; lat: number };
	getImageMaxZoom(): number;
	getIcons(): IconRenderer | null;
	getIconScaleFunction(): ((zoom: number, min: number, max: number) => number) | null;
}

export class MarkerHitTesting {
	private _lastHover: HoverKey | null = null;

	constructor(private deps: MarkerHitTestingDeps) {}

	/**
	 * Get the last hover state.
	 */
	getLastHover(): HoverKey | null {
		return this._lastHover;
	}

	/**
	 * Set the last hover state.
	 */
	setLastHover(h: HoverKey | null): void {
		this._lastHover = h;
	}

	/**
	 * Hit test markers at a screen position, returning the topmost hit.
	 *
	 * @param px - Screen X in CSS pixels (relative to container)
	 * @param py - Screen Y in CSS pixels (relative to container)
	 * @param _requireAlpha - Reserved for future use (currently ignored)
	 * @returns Hit info for the topmost marker, or null if no hit
	 */
	hitTest(px: number, py: number, _requireAlpha = false): HitResult | null {
		const icons = this.deps.getIcons();
		if (!icons) return null;

		const container = this.deps.getContainer();
		const rect = container.getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
		const zoom = this.deps.getZoom();
		const center = this.deps.getCenter();
		const imageMaxZ = this.deps.getImageMaxZoom();

		const iconScaleFn = this.deps.getIconScaleFunction();
		const iconScale = iconScaleFn ? iconScaleFn(zoom, this.deps.getMinZoom(), this.deps.getMaxZoom()) : 1.0;
		const info = icons.getMarkerInfo(iconScale);

		// Iterate in reverse: last marker rendered is on top, so check it first
		for (let i = info.length - 1; i >= 0; i--) {
			const it = info[i]!;

			// Convert marker world position to screen position
			const css = Coords.worldToCSS({ x: it.lng, y: it.lat }, zoom, { x: center.lng, y: center.lat }, { x: widthCSS, y: heightCSS }, imageMaxZ);

			// Compute AABB bounds (anchor offsets from the marker's screen position)
			const left = css.x - it.anchor.ax;
			const top = css.y - it.anchor.ay;

			// Fast AABB rejection test
			if (px >= left && px <= left + it.w && py >= top && py <= top + it.h) {
				// Point is within bounding box - now check alpha mask for pixel-accuracy
				const mask = icons.getMaskInfo?.(it.type) || null;
				if (mask) {
					// Transform hit point to icon's local coordinate space
					const ax = it.anchor.ax; // Anchor X (rotation pivot)
					const ay = it.anchor.ay; // Anchor Y (rotation pivot)
					const lx = px - left; // Local X (0 to width)
					const ly = py - top; // Local Y (0 to height)

					// Translate to anchor-relative coords for rotation
					const cx = lx - ax;
					const cy = ly - ay;

					// Apply INVERSE rotation to get the unrotated position
					// (We're undoing the marker's rotation to find the original texel)
					const theta = ((it.rotation || 0) * Math.PI) / 180;
					const c = Math.cos(-theta),
						s = Math.sin(-theta);
					const rx = cx * c - cy * s + ax; // Rotated X + translate back
					const ry = cx * s + cy * c + ay; // Rotated Y + translate back

					// Bounds check after rotation (point might rotate outside icon)
					if (rx < 0 || ry < 0 || rx >= it.w || ry >= it.h) continue;

					// Map local coords to mask texel coords
					const mx = Math.max(0, Math.min(mask.w - 1, Math.floor((rx / it.w) * mask.w)));
					const my = Math.max(0, Math.min(mask.h - 1, Math.floor((ry / it.h) * mask.h)));

					// Sample alpha value (0-255)
					const alpha = mask.data[my * mask.w + mx]! | 0;
					const THRESH = 32; // ~12.5% opacity threshold
					if (alpha < THRESH) continue; // Transparent pixel - no hit
				}

				// Hit confirmed - return marker info
				return {
					idx: it.index,
					id: it.id,
					type: it.type,
					world: { x: it.lng, y: it.lat },
					screen: { x: css.x, y: css.y },
					size: { width: it.w, height: it.h },
					...(it.rotation !== undefined ? { rotation: it.rotation } : {}),
					icon: it.icon,
				};
			}
		}
		return null;
	}

	/**
	 * Compute all markers that hit a screen position, ordered top-to-bottom.
	 *
	 * Unlike `hitTest` which returns only the topmost hit, this method
	 * returns ALL markers under the cursor. Useful for:
	 * - Click-through: showing a menu of overlapping markers
	 * - Analytics: counting markers at a point
	 * - Debugging: visualizing marker stacking
	 *
	 * ## Return Order
	 *
	 * Results are ordered from topmost (first) to bottommost (last),
	 * matching visual stacking order.
	 *
	 * @param px - Screen X in CSS pixels (relative to container)
	 * @param py - Screen Y in CSS pixels (relative to container)
	 * @returns Array of hit markers with position, size, rotation, and icon info
	 */
	computeAllHits(px: number, py: number): AllHitsResult[] {
		const out: AllHitsResult[] = [];
		const icons = this.deps.getIcons();
		if (!icons) return out;

		const container = this.deps.getContainer();
		const rect = container.getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
		const zoom = this.deps.getZoom();
		const center = this.deps.getCenter();
		const imageMaxZ = this.deps.getImageMaxZoom();

		const iconScaleFn = this.deps.getIconScaleFunction();
		const iconScale = iconScaleFn ? iconScaleFn(zoom, this.deps.getMinZoom(), this.deps.getMaxZoom()) : 1.0;
		const info = icons.getMarkerInfo(iconScale);

		// Iterate in reverse: top-to-bottom in visual stacking order
		for (let i = info.length - 1; i >= 0; i--) {
			const it = info[i]!;

			// Convert marker world position to screen position
			const css = Coords.worldToCSS({ x: it.lng, y: it.lat }, zoom, { x: center.lng, y: center.lat }, { x: widthCSS, y: heightCSS }, imageMaxZ);

			// Compute AABB bounds
			const left = css.x - it.anchor.ax;
			const top = css.y - it.anchor.ay;

			// Fast AABB rejection
			if (px < left || px > left + it.w || py < top || py > top + it.h) continue;

			// Alpha mask test for pixel-accurate hit detection
			const mask = icons.getMaskInfo?.(it.type) || null;
			if (mask) {
				// Transform to local coords and apply inverse rotation (same as hitTest)
				const ax = it.anchor.ax;
				const ay = it.anchor.ay;
				const lx = px - left;
				const ly = py - top;
				const cx = lx - ax;
				const cy = ly - ay;
				const theta = ((it.rotation || 0) * Math.PI) / 180;
				const c = Math.cos(-theta),
					s = Math.sin(-theta);
				const rx = cx * c - cy * s + ax;
				const ry = cx * s + cy * c + ay;

				// Bounds check after rotation
				if (rx < 0 || ry < 0 || rx >= it.w || ry >= it.h) continue;

				// Sample alpha mask
				const mx = Math.max(0, Math.min(mask.w - 1, Math.floor((rx / it.w) * mask.w)));
				const my = Math.max(0, Math.min(mask.h - 1, Math.floor((ry / it.h) * mask.h)));
				const alpha = mask.data[my * mask.w + mx]! | 0;
				const THRESH = 32; // ~12.5% opacity threshold
				if (alpha < THRESH) continue;
			}

			// Hit confirmed - add to results (unlike hitTest, we collect all)
			out.push({
				id: it.id,
				idx: it.index,
				world: { x: it.lng, y: it.lat },
				size: { width: it.w, height: it.h },
				...(it.rotation !== undefined ? { rotation: it.rotation } : {}),
				icon: {
					id: it.type,
					iconPath: it.icon.iconPath,
					...(it.icon.x2IconPath !== undefined ? { x2IconPath: it.icon.x2IconPath } : {}),
					width: it.icon.width,
					height: it.icon.height,
					anchorX: it.icon.anchorX,
					anchorY: it.icon.anchorY,
				},
			});
		}
		return out;
	}
}
