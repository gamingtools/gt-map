/**
 * ViewFacade -- map.view sub-object.
 *
 * Center/zoom getters, setView, bounds control, coord transforms,
 * icon scale, resize, wrapX, freePan, clipToBounds.
 */
import type { Point, IconScaleFunction, MaxBoundsPx, ApplyResult, EventMap, SetViewOptions, PaddingInput } from '../types';
import { CoordTransformer, type Bounds as SourceBounds, type TransformType } from '../coord-transformer';

export interface ViewFacadeDeps {
	getCenter(): { x: number; y: number };
	getZoom(): number;
	getPointerAbs(): { x: number; y: number } | null;
	getMapSize(): { width: number; height: number };
	getMinZoom(): number;
	getMaxZoom(): number;
	getImageMaxZoom(): number;
	getContainer(): HTMLElement;
	events: { when<K extends keyof EventMap>(event: K): Promise<EventMap[K]> };
	setCenter(x: number, y: number): void;
	setZoom(z: number): void;
	setWrapX(on: boolean): void;
	setMaxBoundsPx(bounds: MaxBoundsPx | null): void;
	setMaxBoundsViscosity(v: number): void;
	setClipToBounds(on: boolean): void;
	setIconScaleFunction(fn: IconScaleFunction | null): void;
	setAutoResize(on: boolean): void;
	resize(): void;
	flyTo(opts: { x?: number; y?: number; zoom?: number; durationMs?: number; easing?: (t: number) => number }): void;
	cancelPanAnim(): void;
	cancelZoomAnim(): void;
}

export class ViewFacade {
	private _deps: ViewFacadeDeps;
	private _coordTransformer: CoordTransformer | null = null;
	private _activeCancel: (() => void) | null = null;

	/** @internal */
	constructor(deps: ViewFacadeDeps) {
		this._deps = deps;
	}

	/**
	 * Get the current center position in world pixels.
	 */
	getCenter(): Point {
		const c = this._deps.getCenter();
		return { x: c.x, y: c.y };
	}

	/**
	 * Get the current zoom level.
	 */
	getZoom(): number {
		return this._deps.getZoom();
	}

	/**
	 * Get the last pointer position in world pixels.
	 */
	getPointerAbs(): { x: number; y: number } | null {
		return this._deps.getPointerAbs();
	}

	/**
	 * Set the map view (center, zoom, bounds) instantly or with animation.
	 *
	 * Calling `setView` while a previous call is still in-flight automatically
	 * cancels the earlier one (its promise resolves with `{ status: 'canceled' }`).
	 * Use {@link cancelView} to cancel without starting a new transition.
	 *
	 * @param opts - Describes the target view state and optional animation.
	 * @returns A promise that resolves with an {@link ApplyResult}:
	 *
	 * | `status`      | Meaning |
	 * |---------------|---------|
	 * | `'instant'`   | View was applied without animation. |
	 * | `'animated'`  | Animation completed normally. |
	 * | `'canceled'`  | Transition was superseded or explicitly cancelled. |
	 * | `'complete'`  | No-op -- the view was already at the target. |
	 * | `'error'`     | An unexpected error occurred (see `result.error`). |
	 *
	 * @example
	 * ```ts
	 * // Instant jump
	 * await map.view.setView({ center: { x: 4096, y: 4096 }, zoom: 3 });
	 *
	 * // Animated fly-to with easing
	 * await map.view.setView({
	 *   center: HOME,
	 *   zoom: 5,
	 *   animate: { durationMs: 800, easing: easings.easeInOutCubic },
	 * });
	 *
	 * // Fit to bounds with padding
	 * await map.view.setView({
	 *   bounds: { minX: 100, minY: 100, maxX: 7000, maxY: 7000 },
	 *   padding: 40,
	 *   animate: { durationMs: 600 },
	 * });
	 * ```
	 *
	 * @see {@link SetViewOptions} for full option reference.
	 */
	async setView(opts: SetViewOptions): Promise<ApplyResult> {
		// Cancel any active transition
		this._activeCancel?.();
		this._activeCancel = null;

		let cancelled = false;
		this._activeCancel = () => { cancelled = true; };

		try {
			// Handle optional delay
			if (opts.animate?.delayMs && opts.animate.delayMs > 0) {
				await new Promise<void>((res) => setTimeout(res, opts.animate!.delayMs));
				if (cancelled) return { status: 'canceled' };
			}

			// Resolve padding
			const pad = this._resolvePadding(opts.padding);

			// Compute final targets
			const currentCenter = this.getCenter();
			const currentZoom = this.getZoom();
			let finalCenter: Point | undefined;
			let finalZoom: number | undefined;

			// Bounds/points -> center+zoom
			if (opts.bounds) {
				const fit = this._fitBounds(opts.bounds, pad);
				finalCenter = fit.center;
				finalZoom = fit.zoom;
			} else if (opts.points && opts.points.length > 0) {
				const b = this._pointsToBounds(opts.points);
				const fit = this._fitBounds(b, pad);
				finalCenter = fit.center;
				finalZoom = fit.zoom;
			}

			// Explicit center (overrides bounds-derived center)
			if (opts.center) {
				finalCenter = { x: opts.center.x, y: opts.center.y };
			}

			// Explicit zoom (overrides bounds-derived zoom)
			if (opts.zoom !== undefined) {
				finalZoom = opts.zoom;
			}

			// Apply offset
			if (opts.offset) {
				const base = finalCenter ?? currentCenter;
				finalCenter = { x: base.x + opts.offset.dx, y: base.y + opts.offset.dy };
			}

			// Default to current values if not specified
			if (!finalCenter) finalCenter = currentCenter;
			if (finalZoom === undefined) finalZoom = currentZoom;

			// No-op detection
			const centerEpsilon = 0.1;
			const zoomEpsilon = 0.001;
			const centerChanged = Math.abs(finalCenter.x - currentCenter.x) > centerEpsilon || Math.abs(finalCenter.y - currentCenter.y) > centerEpsilon;
			const zoomChanged = Math.abs(finalZoom - currentZoom) > zoomEpsilon;

			if (!centerChanged && !zoomChanged) {
				return { status: 'complete' };
			}

			if (cancelled) return { status: 'canceled' };

			// Delegate to instant or animated
			if (opts.animate) {
				this._animateView({
					center: finalCenter,
					zoom: finalZoom,
					durationMs: opts.animate.durationMs,
					...(opts.animate.easing != null ? { easing: opts.animate.easing } : {}),
				});
				const result = await this._deps.events.when('moveend' as keyof EventMap).then(() => ({ status: 'animated' as const }));
				if (cancelled) return { status: 'canceled' };
				return result;
			} else {
				this._applyInstant(finalCenter, finalZoom);
				return { status: 'instant' };
			}
		} catch (error) {
			if (cancelled) return { status: 'canceled' };
			return { status: 'error', error };
		} finally {
			// Clear active cancel if it's still ours
			if (!cancelled) this._activeCancel = null;
		}
	}

	/**
	 * Cancel an active {@link setView} transition without starting a new one.
	 *
	 * If no transition is in-flight this is a no-op.
	 * The cancelled `setView` promise resolves with `{ status: 'canceled' }`.
	 *
	 * @example
	 * ```ts
	 * const p = map.view.setView({ center: FAR_AWAY, animate: { durationMs: 2000 } });
	 * // ...user presses Escape
	 * map.view.cancelView();
	 * const result = await p; // { status: 'canceled' }
	 * ```
	 */
	cancelView(): void {
		this._activeCancel?.();
		this._activeCancel = null;
	}

	/**
	 * Enable or disable horizontal world wrap.
	 */
	setWrapX(on: boolean): void {
		this._deps.setWrapX(on);
	}

	/**
	 * Constrain panning to pixel bounds. Pass null to clear.
	 */
	setMaxBoundsPx(bounds: MaxBoundsPx | null): void {
		this._deps.setMaxBoundsPx(bounds);
	}

	/**
	 * Set bounds viscosity (0..1).
	 */
	setMaxBoundsViscosity(v: number): void {
		this._deps.setMaxBoundsViscosity(v);
	}

	/**
	 * Enable or disable clipping to map image bounds.
	 */
	setClipToBounds(on: boolean): void {
		this._deps.setClipToBounds(on);
	}

	/**
	 * Set a custom icon scale function.
	 */
	setIconScaleFunction(fn: IconScaleFunction | null): void {
		this._deps.setIconScaleFunction(fn);
	}

	/**
	 * Reset icon scaling to default.
	 */
	resetIconScale(): void {
		this._deps.setIconScaleFunction(null);
	}

	/**
	 * Enable or disable automatic resize handling.
	 */
	setAutoResize(on: boolean): void {
		this._deps.setAutoResize(on);
	}

	/**
	 * Recompute canvas sizes after external container changes.
	 */
	invalidateSize(): void {
		this._deps.resize();
	}

	/**
	 * Set source coordinate bounds for external-to-pixel mapping.
	 */
	setCoordBounds(bounds: SourceBounds): void {
		const ms = this._deps.getMapSize();
		if (!this._coordTransformer) this._coordTransformer = new CoordTransformer(ms.width, ms.height, bounds, 'fit');
		else this._coordTransformer.setSourceBounds(bounds);
	}

	/**
	 * Translate from source coordinates to map pixel coordinates.
	 */
	translate(x: number, y: number, type: TransformType = 'original'): { x: number; y: number } {
		if (!this._coordTransformer) return { x, y };
		return this._coordTransformer.translate(x, y, type);
	}

	/** @internal Apply instant center/zoom change. */
	private _applyInstant(center?: Point, zoom?: number): void {
		if (center) this._deps.setCenter(center.x, center.y);
		if (typeof zoom === 'number') this._deps.setZoom(zoom);
	}

	/** @internal Animate to a view. */
	private _animateView(opts: { center?: Point; zoom?: number; durationMs: number; easing?: (t: number) => number }): void {
		const { center, zoom, durationMs, easing } = opts;
		this._deps.flyTo({
			...(center != null ? { x: center.x, y: center.y } : {}),
			...(zoom != null ? { zoom } : {}),
			durationMs,
			...(easing != null ? { easing } : {}),
		});
	}

	/** @internal Fit bounds calculation. */
	private _fitBounds(b: { minX: number; minY: number; maxX: number; maxY: number }, padding: { top: number; right: number; bottom: number; left: number }): { center: Point; zoom: number } {
		const rect = this._deps.getContainer().getBoundingClientRect();
		const pad = padding || { top: 0, right: 0, bottom: 0, left: 0 };
		const availW = Math.max(1, rect.width - (pad.left + pad.right));
		const availH = Math.max(1, rect.height - (pad.top + pad.bottom));
		const bw = Math.max(1, b.maxX - b.minX);
		const bh = Math.max(1, b.maxY - b.minY);
		const k = Math.min(availW / bw, availH / bh);
		const imageMaxZ = this._deps.getImageMaxZoom();
		let z = imageMaxZ + Math.log2(Math.max(1e-6, k));
		z = Math.max(this._deps.getMinZoom(), Math.min(this._deps.getMaxZoom(), z));
		const center: Point = { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
		return { center, zoom: z };
	}

	/** @internal Convert a list of points to a bounding box. */
	private _pointsToBounds(list: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
		let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
		for (const p of list) {
			if (p.x < minX) minX = p.x;
			if (p.y < minY) minY = p.y;
			if (p.x > maxX) maxX = p.x;
			if (p.y > maxY) maxY = p.y;
		}
		return { minX, minY, maxX, maxY };
	}

	/** @internal Resolve PaddingInput to uniform object. */
	private _resolvePadding(padding?: PaddingInput): { top: number; right: number; bottom: number; left: number } {
		if (padding === undefined || padding === null) return { top: 0, right: 0, bottom: 0, left: 0 };
		if (typeof padding === 'number') {
			const p = Math.max(0, padding);
			return { top: p, right: p, bottom: p, left: p };
		}
		return {
			top: Math.max(0, padding.top),
			right: Math.max(0, padding.right),
			bottom: Math.max(0, padding.bottom),
			left: Math.max(0, padding.left),
		};
	}
}
