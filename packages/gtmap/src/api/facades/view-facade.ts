/**
 * ViewFacade -- map.view sub-object.
 *
 * Center/zoom getters, transition builder, bounds control, coord transforms,
 * icon scale, resize, wrapX, freePan, clipToBounds.
 */
import type { Point, IconScaleFunction, MaxBoundsPx, ApplyResult } from '../types';
import type { MapEngine } from '../../internal/map-engine';
import { ViewTransitionImpl, type ViewTransition, type ViewTransitionHost } from '../../internal/core/view-transition';
import { CoordTransformer, type Bounds as SourceBounds, type TransformType } from '../coord-transformer';

export class ViewFacade implements ViewTransitionHost {
	private _engine: MapEngine;
	private _coordTransformer: CoordTransformer | null = null;

	/** @internal */
	constructor(engine: MapEngine) {
		this._engine = engine;
	}

	/**
	 * Events surface (needed by ViewTransitionHost).
	 */
	get events(): ViewTransitionHost['events'] {
		return {
			once: (event: string) => this._engine.events.when(event as keyof import('../types').EventMap),
		} as ViewTransitionHost['events'];
	}

	/**
	 * Get the current center position in world pixels.
	 */
	getCenter(): Point {
		const c = this._engine.center;
		return { x: c.lng, y: c.lat };
	}

	/**
	 * Get the current zoom level.
	 */
	getZoom(): number {
		return this._engine.zoom;
	}

	/**
	 * Get the last pointer position in world pixels.
	 */
	getPointerAbs(): { x: number; y: number } | null {
		return this._engine.pointerAbs ?? null;
	}

	/**
	 * Start a chainable view transition.
	 */
	transition(): ViewTransition {
		return new ViewTransitionImpl(this);
	}

	/**
	 * Enable or disable horizontal world wrap.
	 */
	setWrapX(on: boolean): void {
		this._engine.setWrapX(on);
	}

	/**
	 * Constrain panning to pixel bounds. Pass null to clear.
	 */
	setMaxBoundsPx(bounds: MaxBoundsPx | null): void {
		this._engine.setMaxBoundsPx(bounds);
	}

	/**
	 * Set bounds viscosity (0..1).
	 */
	setMaxBoundsViscosity(v: number): void {
		this._engine.setMaxBoundsViscosity(v);
	}

	/**
	 * Enable or disable clipping to map image bounds.
	 */
	setClipToBounds(on: boolean): void {
		this._engine.setClipToBounds(on);
	}

	/**
	 * Set a custom icon scale function.
	 */
	setIconScaleFunction(fn: IconScaleFunction | null): void {
		this._engine.setIconScaleFunction(fn);
	}

	/**
	 * Reset icon scaling to default.
	 */
	resetIconScale(): void {
		this._engine.setIconScaleFunction(null);
	}

	/**
	 * Enable or disable automatic resize handling.
	 */
	setAutoResize(on: boolean): void {
		this._engine.setAutoResize(on);
	}

	/**
	 * Recompute canvas sizes after external container changes.
	 */
	invalidateSize(): void {
		this._engine.resize();
	}

	/**
	 * Set source coordinate bounds for external-to-pixel mapping.
	 */
	setCoordBounds(bounds: SourceBounds): void {
		const ms = this._engine.mapSize;
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
	_applyInstant(center?: Point, zoom?: number): void {
		if (center) this._engine.setCenter(center.x, center.y);
		if (typeof zoom === 'number') this._engine.setZoom(zoom);
	}

	/** @internal Animate to a view. */
	_animateView(opts: { center?: Point; zoom?: number; durationMs: number; easing?: (t: number) => number }): void {
		const { center, zoom, durationMs, easing } = opts;
		this._engine.flyTo({
			...(center != null ? { lng: center.x, lat: center.y } : {}),
			...(zoom != null ? { zoom } : {}),
			durationMs,
			...(easing != null ? { easing } : {}),
		});
	}

	/** @internal Cancel ongoing pan+zoom animations. */
	_cancelPanZoom(): void {
		try {
			this._engine.cancelPanAnim();
		} catch {}
		try {
			this._engine.cancelZoomAnim();
		} catch {}
	}

	/** @internal Fit bounds calculation. */
	_fitBounds(b: { minX: number; minY: number; maxX: number; maxY: number }, padding: { top: number; right: number; bottom: number; left: number }): { center: Point; zoom: number } {
		const rect = this._engine.container.getBoundingClientRect();
		const pad = padding || { top: 0, right: 0, bottom: 0, left: 0 };
		const availW = Math.max(1, rect.width - (pad.left + pad.right));
		const availH = Math.max(1, rect.height - (pad.top + pad.bottom));
		const bw = Math.max(1, b.maxX - b.minX);
		const bh = Math.max(1, b.maxY - b.minY);
		const k = Math.min(availW / bw, availH / bh);
		const imageMaxZ = this._engine.getImageMaxZoom();
		let z = imageMaxZ + Math.log2(Math.max(1e-6, k));
		z = Math.max(this._engine.getMinZoom(), Math.min(this._engine.getMaxZoom(), z));
		const center: Point = { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
		return { center, zoom: z };
	}

	/** @internal Set view (instant or animated). */
	_setView(center: Point, zoom: number, opts?: { animate?: { durationMs: number; delayMs?: number; easing?: (t: number) => number } }): Promise<ApplyResult> {
		if (opts?.animate) {
			this._animateView({
				center,
				zoom,
				durationMs: opts.animate.durationMs,
				...(opts.animate.easing != null ? { easing: opts.animate.easing } : {}),
			});
			return this._engine.events.when('moveend' as keyof import('../types').EventMap).then(() => ({ status: 'animated' }));
		} else {
			this._applyInstant(center, zoom);
			return Promise.resolve({ status: 'instant' });
		}
	}
}
