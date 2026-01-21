import type { MarkerEventMap, MarkerData } from '../api/events/maps';
import type { ApplyOptions, ApplyResult, Easing, IconScaleFunction } from '../api/types';
import type { Visual } from '../api/visual';

import { EventedEntity } from './base';

/**
 * Options for creating or styling a {@link Marker}.
 *
 * @public
 */
export interface MarkerOptions<T = unknown> {
	/** Visual template for rendering. */
	visual: Visual;
	/** Scale multiplier (1 = visual's native size). */
	scale?: number;
	/** Clockwise rotation in degrees. */
	rotation?: number;
	/** Opacity (0-1). */
	opacity?: number;
	/**
	 * Z-index for stacking order (higher values render on top).
	 * @defaultValue 1
	 * @remarks Vectors always render at z=0. Use negative zIndex to place markers behind vectors.
	 */
	zIndex?: number;
	/**
	 * Override the map-level icon scale function for this marker.
	 * Set to `null` to disable scaling (always use scale=1).
	 * If undefined, falls back to visual's iconScaleFunction, then map's.
	 */
	iconScaleFunction?: IconScaleFunction | null;
	/** Arbitrary user data attached to the marker. */
	data?: T;
}

/** Builder for animating a single Marker (position/rotation/scale). */
export interface MarkerTransition {
	/** Target a new position in world pixels. */
	moveTo(x: number, y: number): this;
	/** Target style properties (scale, rotation, opacity). */
	setStyle(opts: { scale?: number; rotation?: number; opacity?: number }): this;
	/** Commit the transition (instant or animated). */
	apply(opts?: ApplyOptions): Promise<ApplyResult>;
	/** Cancel a pending or running transition. */
	cancel(): void;
}

let _markerIdSeq = 0;
function genMarkerId(): string {
	_markerIdSeq = (_markerIdSeq + 1) % Number.MAX_SAFE_INTEGER;
	return `m_${_markerIdSeq.toString(36)}`;
}

/**
 * Marker - an interactive visual anchored at a world pixel coordinate.
 *
 * @public
 * @remarks
 * Emits typed events via {@link Marker.events | marker.events} (`click`,
 * `pointerenter`, `pointerleave`, `positionchange`, `remove`, ...).
 */
export class Marker<T = unknown> extends EventedEntity<MarkerEventMap<T>> {
	readonly id: string;
	private _x: number;
	private _y: number;
	private _visual: Visual;
	private _scale: number;
	private _rotation: number;
	private _opacity: number;
	private _zIndex: number;
	private _iconScaleFunction?: IconScaleFunction | null;
	private _data?: T;
	private _onChange?: () => void;
	private _activeTx?: MarkerTransitionImpl<T>;

	/**
	 * Create a marker at the given world pixel coordinate.
	 *
	 * @public
	 * @param x - World X (pixels)
	 * @param y - World Y (pixels)
	 * @param opts - Visual, style, and user data options
	 * @param onChange - Internal callback to notify the map facade of changes
	 * @internal
	 */
	constructor(x: number, y: number, opts: MarkerOptions<T>, onChange?: () => void) {
		super();
		this.id = genMarkerId();
		this._x = x;
		this._y = y;
		this._visual = opts.visual;
		this._scale = opts.scale ?? 1;
		this._rotation = opts.rotation ?? 0;
		this._opacity = opts.opacity ?? 1;
		this._zIndex = opts.zIndex ?? 1;
		this._iconScaleFunction = opts.iconScaleFunction;
		this._data = opts.data;
		this._onChange = onChange;
	}

	/** Get the current world X (pixels). */
	get x(): number {
		return this._x;
	}
	/** Get the current world Y (pixels). */
	get y(): number {
		return this._y;
	}
	/** The visual template for this marker. */
	get visual(): Visual {
		return this._visual;
	}
	/** Scale multiplier (1 = visual's native size). */
	get scale(): number {
		return this._scale;
	}
	/** Clockwise rotation in degrees. */
	get rotation(): number {
		return this._rotation;
	}
	/** Opacity (0-1). */
	get opacity(): number {
		return this._opacity;
	}
	/** Z-index for stacking order (higher values render on top). */
	get zIndex(): number {
		return this._zIndex;
	}
	/** Icon scale function override for this marker (undefined = use visual's or map's). */
	get iconScaleFunction(): IconScaleFunction | null | undefined {
		return this._iconScaleFunction;
	}
	/** Arbitrary user data attached to the marker. */
	get data(): T | undefined {
		return this._data;
	}

	/**
	 * Attach arbitrary user data to this marker and trigger a renderer sync.
	 *
	 * @public
	 * @returns This marker for chaining
	 * @example
	 * ```ts
	 * // Tag this marker with a POI payload used elsewhere in the app
	 * marker.setData({ id: 'poi-1', category: 'shop' });
	 * ```
	 */
	setData(data: T): this {
		this._data = data;
		this._onChange?.();
		return this;
	}

	/**
	 * Update the marker style properties and trigger a renderer sync.
	 *
	 * @public
	 * @param opts - Partial style options
	 * @returns This marker for chaining
	 */
	setStyle(opts: { visual?: Visual; scale?: number; rotation?: number; opacity?: number; zIndex?: number }): this {
		if (opts.visual !== undefined) this._visual = opts.visual;
		if (opts.scale !== undefined) this._scale = opts.scale;
		if (opts.rotation !== undefined) this._rotation = opts.rotation;
		if (opts.opacity !== undefined) this._opacity = opts.opacity;
		if (opts.zIndex !== undefined) this._zIndex = opts.zIndex;
		this._onChange?.();
		return this;
	}

	/**
	 * Move the marker to a new position and emit a `positionchange` event.
	 *
	 * @public
	 * @remarks
	 * Emits a `positionchange` event and re-syncs to the renderer.
	 * @returns This marker for chaining
	 * @example
	 * ```ts
	 * // Nudge marker 10px to the right
	 * marker.moveTo(marker.x + 10, marker.y);
	 * ```
	 */
	moveTo(x: number, y: number): this {
		const dx = x - this._x;
		const dy = y - this._y;
		this._x = x;
		this._y = y;
		this.emit('positionchange', { x, y, dx, dy, marker: this.toData() });
		this._onChange?.();
		return this;
	}

	/**
	 * Emit a `remove` event (called by the owning collection after deletion).
	 * @internal
	 */
	_emitRemove(): void {
		this.emit('remove', { marker: this.toData() });
	}

	/**
	 * Get a snapshot used in event payloads and renderer sync.
	 *
	 * @public
	 */
	toData(): MarkerData<T> {
		return { id: this.id, x: this._x, y: this._y, data: this._data };
	}

	// Internal: allow map facade to forward underlying impl events
	/**
	 * Forward an event from the renderer to this marker's event bus.
	 * @internal
	 */
	emitFromMap<K extends keyof MarkerEventMap<T> & string>(event: K, payload: MarkerEventMap<T>[K]): void {
		this.emit(event, payload);
	}

	/** Start a marker transition (position/rotation/scale/opacity). */
	transition(): MarkerTransition {
		return new MarkerTransitionImpl<T>(this);
	}

	/** @internal Cancel any active transition for this marker. */
	_cancelActiveTransition(): void {
		try {
			this._activeTx?.cancel();
		} catch {}
		this._activeTx = undefined;
	}
	/** @internal Set the active transition for this marker. */
	_setActiveTransition(tx: MarkerTransitionImpl<T>): void {
		this._activeTx = tx;
	}
}

class MarkerTransitionImpl<T> implements MarkerTransition {
	private marker: Marker<T>;
	private targetX?: number;
	private targetY?: number;
	private targetScale?: number;
	private targetRotation?: number;
	private targetOpacity?: number;
	private rafId: number | null = null;
	private resolve?: (r: ApplyResult) => void;
	private promise?: Promise<ApplyResult>;
	private cancelled = false;

	constructor(marker: Marker<T>) {
		this.marker = marker;
	}

	moveTo(x: number, y: number): this {
		this.targetX = x;
		this.targetY = y;
		return this;
	}
	setStyle(opts: { scale?: number; rotation?: number; opacity?: number }): this {
		if (opts.scale !== undefined) this.targetScale = opts.scale;
		if (opts.rotation !== undefined) this.targetRotation = opts.rotation;
		if (opts.opacity !== undefined) this.targetOpacity = opts.opacity;
		return this;
	}

	cancel(): void {
		this.cancelled = true;
		if (this.rafId != null) {
			try {
				cancelAnimationFrame(this.rafId);
			} catch {}
			this.rafId = null;
		}
		if (this.resolve) this.resolve({ status: 'canceled' });
	}

	async apply(opts?: ApplyOptions): Promise<ApplyResult> {
		if (this.promise) return this.promise;

		const needsPos = typeof this.targetX === 'number' && typeof this.targetY === 'number';
		const needsStyle = typeof this.targetScale === 'number' || typeof this.targetRotation === 'number' || typeof this.targetOpacity === 'number';
		if (!needsPos && !needsStyle) {
			return Promise.resolve({ status: 'instant' });
		}

		const animate = opts?.animate;
		if (!animate) {
			if (needsPos) this.marker.moveTo(this.targetX as number, this.targetY as number);
			if (needsStyle) this.marker.setStyle({ scale: this.targetScale, rotation: this.targetRotation, opacity: this.targetOpacity });
			return Promise.resolve({ status: 'instant' });
		}

		// Interrupt policy: cancel prior marker transition
		this.marker._cancelActiveTransition();
		this.marker._setActiveTransition(this);

		const duration = Math.max(0, animate.durationMs);
		const easing: Easing = animate.easing ?? ((t) => t);

		// Capture starts
		const sx = this.marker.x;
		const sy = this.marker.y;
		const ss = this.marker.scale;
		const sr = this.marker.rotation;
		const so = this.marker.opacity;
		const tx = needsPos ? (this.targetX as number) : sx;
		const ty = needsPos ? (this.targetY as number) : sy;
		const ts = typeof this.targetScale === 'number' ? this.targetScale : ss;
		const tr = typeof this.targetRotation === 'number' ? this.targetRotation : sr;
		const to = typeof this.targetOpacity === 'number' ? this.targetOpacity : so;

		// Normalize rotation to shortest path
		const norm = (a: number) => ((a % 360) + 360) % 360;
		const srN = norm(sr);
		const trN = norm(tr);
		let dR = trN - srN;
		if (dR > 180) dR -= 360;
		else if (dR < -180) dR += 360;

		const startMs = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
		const delay = Math.max(0, animate.delayMs ?? 0);
		let delayed = delay === 0;

		this.promise = new Promise<ApplyResult>((resolve) => {
			this.resolve = resolve;
			const tick = () => {
				if (this.cancelled) {
					this.rafId = null;
					resolve({ status: 'canceled' });
					return;
				}
				const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
				const t0 = now - startMs;
				if (!delayed) {
					if (t0 < delay) {
						this.rafId = requestAnimationFrame(tick);
						return;
					}
					delayed = true;
				}
				const t = Math.min(1, (t0 - delay) / duration);
				const k = easing(t);
				const cx = sx + (tx - sx) * k;
				const cy = sy + (ty - sy) * k;
				if (needsPos) this.marker.moveTo(cx, cy);
				if (needsStyle) {
					const rot = norm(srN + dR * k);
					const sca = ss + (ts - ss) * k;
					const opa = so + (to - so) * k;
					this.marker.setStyle({ scale: sca, rotation: rot, opacity: opa });
				}
				if (t >= 1) {
					this.rafId = null;
					resolve({ status: 'animated' });
					return;
				}
				this.rafId = requestAnimationFrame(tick);
			};
			this.rafId = requestAnimationFrame(tick);
		});

		return this.promise;
	}
}
