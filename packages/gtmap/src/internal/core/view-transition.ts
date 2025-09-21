/**
 * ViewTransition - Extracted from Map.ts to reduce class complexity
 * Handles view transitions with animation support
 */

import type { Point, ApplyOptions, ApplyResult } from '../../api/types';

export interface ViewTransitionHost {
	getCenter(): Point;
	getZoom(): number;
	_fitBounds(bounds: { minX: number; minY: number; maxX: number; maxY: number }, padding: { top: number; right: number; bottom: number; left: number }): { center: Point; zoom: number };
	_setView(center: Point, zoom: number, opts?: { animate?: { durationMs: number; delayMs?: number; easing?: (t: number) => number } }): Promise<ApplyResult>;
	events: {
		once(event: 'moveend'): Promise<import('../../api/types').MoveEventData>;
		once(event: 'zoomend'): Promise<import('../../api/types').ZoomEventData>;
	};
}

export interface ViewTransition {
	/**
	 * Set the target center position in world pixels.
	 *
	 * @param p - Target center point
	 * @returns The builder for chaining
	 */
	center(p: Point): this;

	/**
	 * Set the target zoom level.
	 *
	 * @param z - Target zoom (fractional allowed)
	 * @returns The builder for chaining
	 */
	zoom(z: number): this;

	/**
	 * Add an offset to the final center position.
	 *
	 * @param dx - Horizontal offset in world pixels
	 * @param dy - Vertical offset in world pixels
	 * @returns The builder for chaining
	 */
	offset(dx: number, dy: number): this;

	/**
	 * Fit the view to the specified bounds with optional padding.
	 *
	 * @param b - Bounding box in world pixels
	 * @param padding - Uniform number or `{ top, right, bottom, left }`
	 * @returns The builder for chaining
	 */
	bounds(b: { minX: number; minY: number; maxX: number; maxY: number }, padding?: number | { top: number; right: number; bottom: number; left: number }): this;

	/**
	 * Fit the view to a set of points with optional padding.
	 *
	 * @param list - Points in world pixels
	 * @param padding - Uniform number or `{ top, right, bottom, left }`
	 * @returns The builder for chaining
	 */
	points(list: Array<Point>, padding?: number | { top: number; right: number; bottom: number; left: number }): this;

	/**
	 * Commit the transition.
	 *
	 * When `opts.animate` is omitted, the change is applied instantly. With animation,
	 * the returned promise resolves when relevant end events are observed.
	 * @param opts - Apply/animation options
	 * @returns A promise resolving with the {@link ApplyResult | result}
	 */
	apply(opts?: ApplyOptions): Promise<ApplyResult>;

	/**
	 * Cancel a pending or running transition.
	 *
	 * If already settled, this is a no‑op.
	 */
	cancel(): void;
}

export class ViewTransitionImpl implements ViewTransition {
	// Track at most one active transition per map instance
	private static _active: WeakMap<ViewTransitionHost, ViewTransitionImpl> = new WeakMap();

	static _activeFor(map: ViewTransitionHost): ViewTransitionImpl | undefined {
		return this._active.get(map);
	}

	static _setActive(map: ViewTransitionHost, tx: ViewTransitionImpl): void {
		this._active.set(map, tx);
	}

	static _clearActive(map: ViewTransitionHost): void {
		this._active.delete(map);
	}

	private map: ViewTransitionHost;
	private targetCenter?: Point;
	private targetZoom?: number;
	private offsetDx = 0;
	private offsetDy = 0;
	private targetBounds?: { minX: number; minY: number; maxX: number; maxY: number };
	private boundsPadding?: { top: number; right: number; bottom: number; left: number };
	private settled = false;
	private cancelled = false;
	private resolveFn?: (r: ApplyResult) => void;
	private promise?: Promise<ApplyResult>;
	private unsubscribeMoveEnd?: () => void;
	private unsubscribeZoomEnd?: () => void;

	constructor(map: ViewTransitionHost) {
		this.map = map;
	}

	center(p: Point): this {
		this.targetCenter = p;
		return this;
	}

	zoom(z: number): this {
		this.targetZoom = z;
		return this;
	}

	offset(dx: number, dy: number): this {
		this.offsetDx += dx;
		this.offsetDy += dy;
		return this;
	}

	bounds(b: { minX: number; minY: number; maxX: number; maxY: number }, padding?: number | { top: number; right: number; bottom: number; left: number }): this {
		this.targetBounds = b;
		if (typeof padding === 'number') {
			const p = Math.max(0, padding);
			this.boundsPadding = { top: p, right: p, bottom: p, left: p };
		} else if (padding) {
			const pad = padding as { top: number; right: number; bottom: number; left: number };
			this.boundsPadding = {
				top: Math.max(0, pad.top),
				right: Math.max(0, pad.right),
				bottom: Math.max(0, pad.bottom),
				left: Math.max(0, pad.left),
			};
		} else {
			this.boundsPadding = { top: 0, right: 0, bottom: 0, left: 0 };
		}
		return this;
	}

	points(list: Array<Point>, padding?: number | { top: number; right: number; bottom: number; left: number }): this {
		if (!list || list.length === 0) return this;
		let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
		for (const p of list) {
			if (p.x < minX) minX = p.x;
			if (p.y < minY) minY = p.y;
			if (p.x > maxX) maxX = p.x;
			if (p.y > maxY) maxY = p.y;
		}
		return this.bounds({ minX, minY, maxX, maxY }, padding);
	}

	cancel(): void {
		if (this.settled) return;
		this.cancelled = true;
		this._resolve({ status: 'canceled' });
	}

	async apply(opts?: ApplyOptions): Promise<ApplyResult> {
		if (this.promise) return this.promise;

		// Compute final targets
		const currentCenter = this.map.getCenter();
		const currentZoom = this.map.getZoom();
		let finalCenter: Point | undefined;
		let finalZoom: number | undefined;

		if (this.targetBounds) {
			const fit = this.map._fitBounds(this.targetBounds, this.boundsPadding || { top: 0, right: 0, bottom: 0, left: 0 });
			finalCenter = fit.center;
			finalZoom = fit.zoom;
		}

		if (!finalCenter && this.targetCenter) {
			finalCenter = { x: this.targetCenter.x + this.offsetDx, y: this.targetCenter.y + this.offsetDy };
		} else if (!finalCenter && (this.offsetDx !== 0 || this.offsetDy !== 0)) {
			finalCenter = { x: currentCenter.x + this.offsetDx, y: currentCenter.y + this.offsetDy };
		}

		if (this.targetZoom !== undefined) {
			finalZoom = this.targetZoom;
		}

		// Default to current values if not specified
		if (!finalCenter) finalCenter = currentCenter;
		if (finalZoom === undefined) finalZoom = currentZoom;

		// Check if this is a no-op
		const centerEpsilon = 0.1;
		const zoomEpsilon = 0.001;
		const centerChanged = Math.abs(finalCenter.x - currentCenter.x) > centerEpsilon || Math.abs(finalCenter.y - currentCenter.y) > centerEpsilon;
		const zoomChanged = Math.abs(finalZoom - currentZoom) > zoomEpsilon;

		if (!centerChanged && !zoomChanged) {
			return { status: 'complete' };
		}

		// Set up transition tracking
		ViewTransitionImpl._setActive(this.map, this);

		this.promise = new Promise<ApplyResult>((resolve) => {
			this.resolveFn = resolve;
			this._executeTransition(finalCenter!, finalZoom!, opts);
		});

		return this.promise;
	}

	private async _executeTransition(center: Point, zoom: number, opts?: ApplyOptions): Promise<void> {
		try {
			// Handle optional delay
			if (opts?.animate?.delayMs && opts.animate.delayMs > 0) {
				await new Promise<void>((res) => setTimeout(res, opts.animate!.delayMs));
			}

			// If cancelled during delay, exit early
			if (this.cancelled) {
				this._resolve({ status: 'canceled' });
				return;
			}

			// Apply the transition
			const result = await this.map._setView(center, zoom, opts);

			if (!this.cancelled) {
				this._resolve(result);
			}
		} catch (error) {
			if (!this.cancelled) {
				this._resolve({ status: 'error', error });
			}
		}
	}

	private _resolve(result: ApplyResult): void {
		if (this.settled) return;
		this.settled = true;

		// Cleanup
		this._cleanup();
		ViewTransitionImpl._clearActive(this.map);

		// Resolve promise
		if (this.resolveFn) {
			this.resolveFn(result);
		}
	}

	private _cleanup(): void {
		if (this.unsubscribeMoveEnd) {
			this.unsubscribeMoveEnd();
			this.unsubscribeMoveEnd = undefined;
		}
		if (this.unsubscribeZoomEnd) {
			this.unsubscribeZoomEnd();
			this.unsubscribeZoomEnd = undefined;
		}
	}
}
