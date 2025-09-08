import type { MarkerEvents } from '../api/events/public';
import type { MarkerEventMap, MarkerData } from '../api/events/maps';

import { EventedEntity } from './base';
import type { ApplyOptions, ApplyResult, Easing } from '../api/types';
import { normalizeAngle } from '../internal/utils/angles';

/**
 * Options for creating or styling a {@link Marker}.
 *
 * @public
 * @typeParam T - Type of custom data attached to the marker
 */
export interface MarkerOptions<T = unknown> {
	/** 
	 * Icon type identifier from registered icons.
	 * @defaultValue `'default'`
	 */
	iconType?: string;
	
	/** 
	 * Scale multiplier for the icon.
	 * @defaultValue `1`
	 */
	size?: number;
	
	/** 
	 * Rotation angle in degrees (clockwise).
	 * @defaultValue `0`
	 */
	rotation?: number;
	
	/** 
	 * Custom user data attached to the marker.
	 */
	data?: T;
}

/**
 * Builder for animating a single marker's properties (position/rotation/size).
 * 
 * @public
 * @remarks
 * Create via {@link Marker.transition}. Changes are buffered until
 * {@link MarkerTransition.apply | apply()} is called.
 * 
 * @example
 * ```ts
 * // Animate marker to new position over 600ms
 * await marker.transition()
 *   .moveTo(2000, 1500)
 *   .apply({ animate: { durationMs: 600 } });
 * 
 * // Combine movement with rotation
 * await marker.transition()
 *   .moveTo(3000, 2000)
 *   .setStyle({ rotation: 45, size: 1.5 })
 *   .apply({ animate: { durationMs: 800, easing: easeInOut } });
 * ```
 */
export interface MarkerTransition {
  /** 
   * Target a new position in world pixels.
   * 
   * @param x - Target X coordinate in world pixels
   * @param y - Target Y coordinate in world pixels
   * @returns This transition builder for chaining
   */
  moveTo(x: number, y: number): this;
  
  /** 
   * Target style properties (size, rotation).
   * 
   * @param opts - Style properties to animate
   * @param opts.size - Target scale multiplier
   * @param opts.rotation - Target rotation in degrees
   * @returns This transition builder for chaining
   */
  setStyle(opts: { size?: number; rotation?: number }): this;
  
  /** 
   * Commit the transition (instant or animated).
   * 
   * @param opts - Optional animation settings
   * @returns Promise resolving when transition completes
   */
  apply(opts?: ApplyOptions): Promise<ApplyResult>;
  
  /** 
   * Cancel a pending or running transition.
   */
  cancel(): void;
}

let _idSeq = 0;
function genId(): string {
	_idSeq = (_idSeq + 1) % Number.MAX_SAFE_INTEGER;
	return `m_${_idSeq.toString(36)}`;
}

/**
 * Marker - an icon anchored at a world pixel coordinate.
 *
 * @public
 * @typeParam T - Type of custom data attached to the marker
 * 
 * @remarks
 * Markers are created via {@link GTMap.addMarker} and managed through
 * the {@link Layer} collection. Each marker has a unique ID, position,
 * icon type, and optional style properties.
 * 
 * Events are emitted via {@link Marker.events | marker.events}:
 * - `click` - User clicked the marker
 * - `pointerenter` - Pointer entered marker bounds
 * - `pointerleave` - Pointer left marker bounds
 * - `positionchange` - Marker moved to new position
 * - `remove` - Marker was removed
 * 
 * @example
 * ```ts
 * // Create marker with custom data
 * const marker = map.addMarker(1000, 1000, {
 *   iconType: 'poi',
 *   size: 1.2,
 *   rotation: 45,
 *   data: { id: 'location-1', name: 'Town Center' }
 * });
 * 
 * // Listen for events
 * marker.events.on('click').each(e => {
 *   console.log('Clicked:', e.marker.data);
 * });
 * 
 * // Animate to new position
 * await marker.transition()
 *   .moveTo(2000, 1500)
 *   .apply({ animate: { durationMs: 600 } });
 * ```
 */
export class Marker<T = unknown> extends EventedEntity<MarkerEventMap<T>> {
	readonly id: string;
	private _x: number;
	private _y: number;
	private _iconType: string;
	private _size?: number;
	private _rotation?: number;
	private _data?: T;
	private _onChange?: () => void;
  private _activeTx?: MarkerTransitionImpl<T>;

	/**
	 * Create a marker at the given world pixel coordinate.
	 *
	 * @public
	 * @param x - World X (pixels)
	 * @param y - World Y (pixels)
	 * @param opts - Optional style and user data
	 * @param onChange - Internal callback to notify the map facade of changes
	 * @internal
	 */
	constructor(x: number, y: number, opts: MarkerOptions<T> = {}, onChange?: () => void) {
		super();
		this.id = genId();
		this._x = x;
		this._y = y;
		this._iconType = opts.iconType ?? 'default';
		this._size = opts.size;
		this._rotation = opts.rotation;
		this._data = opts.data;
		this._onChange = onChange;
	}

	/** 
	 * Get the current world X coordinate in pixels.
	 * @readonly
	 */
	get x(): number {
		return this._x;
	}
	
	/** 
	 * Get the current world Y coordinate in pixels.
	 * @readonly
	 */
	get y(): number {
		return this._y;
	}
	
	/** 
	 * Icon type identifier for this marker.
	 * @readonly
	 * @defaultValue `'default'`
	 */
	get iconType(): string {
		return this._iconType;
	}
	
	/** 
	 * Scale multiplier for the icon.
	 * @readonly
	 * @remarks
	 * Renderer treats `undefined` as `1`.
	 */
	get size(): number | undefined {
		return this._size;
	}
	
	/** 
	 * Clockwise rotation in degrees.
	 * @readonly
	 */
	get rotation(): number | undefined {
		return this._rotation;
	}
	
	/** 
	 * Custom user data attached to the marker.
	 * @readonly
	 * @remarks
	 * Use {@link Marker.setData} to update.
	 */
	get data(): T | undefined {
		return this._data;
	}

	/**
	 * Attach custom user data to this marker.
	 *
	 * @param data - Custom data to attach
	 * @remarks
	 * Triggers a renderer sync to update marker data references.
	 * 
	 * @example
	 * ```ts
	 * // Tag marker with POI information
	 * marker.setData({ 
	 *   id: 'poi-1', 
	 *   category: 'shop',
	 *   name: 'Coffee House'
	 * });
	 * 
	 * // Update data later
	 * marker.setData({ 
	 *   ...marker.data,
	 *   visited: true 
	 * });
	 * ```
	 */
	setData(data: T): void {
		this._data = data;
		this._onChange?.();
	}

	/**
	 * Update the marker's visual style properties.
	 *
	 * @param opts - Style properties to update
	 * @param opts.iconType - New icon type identifier
	 * @param opts.size - New scale multiplier
	 * @param opts.rotation - New rotation in degrees
	 * 
	 * @remarks
	 * Only provided properties are updated. Triggers a renderer sync.
	 * 
	 * @example
	 * ```ts
	 * // Change icon type
	 * marker.setStyle({ iconType: 'selected' });
	 * 
	 * // Update size and rotation
	 * marker.setStyle({ size: 1.5, rotation: 90 });
	 * ```
	 */
	setStyle(opts: { iconType?: string; size?: number; rotation?: number }): void {
		if (opts.iconType !== undefined) this._iconType = opts.iconType;
		if (opts.size !== undefined) this._size = opts.size;
		if (opts.rotation !== undefined) this._rotation = opts.rotation;
		this._onChange?.();
	}

	/**
	 * Move the marker to a new world pixel coordinate.
	 *
	 * @param x - New X coordinate in world pixels
	 * @param y - New Y coordinate in world pixels
	 * 
	 * @remarks
	 * This is an instant move. For animated movement, use {@link Marker.transition}.
	 * Emits a `positionchange` event with position delta and triggers renderer sync.
	 * 
	 * @example
	 * ```ts
	 * // Move to absolute position
	 * marker.moveTo(2000, 1500);
	 * 
	 * // Nudge marker 10px to the right
	 * marker.moveTo(marker.x + 10, marker.y);
	 * 
	 * // Follow mouse position (world coords)
	 * map.events.on('pointermove').each(e => {
	 *   if (e.world) marker.moveTo(e.world.x, e.world.y);
	 * });
	 * ```
	 */
	moveTo(x: number, y: number): void {
		const dx = x - this._x;
		const dy = y - this._y;
		this._x = x;
		this._y = y;
		this.emit('positionchange', { x, y, dx, dy, marker: this.toData() });
		this._onChange?.();
	}

	/**
	 * Remove this marker from the map.
	 *
	 * @remarks
	 * Emits a `remove` event. The owning {@link Layer} will clear it
	 * from the collection and trigger a renderer sync.
	 * 
	 * @example
	 * ```ts
	 * // Remove marker on click
	 * marker.events.on('click').each(() => {
	 *   marker.remove();
	 * });
	 * 
	 * // Remove all markers matching criteria
	 * map.markers.getAll()
	 *   .filter(m => m.data?.category === 'temp')
	 *   .forEach(m => m.remove());
	 * ```
	 */
	remove(): void {
		this.emit('remove', { marker: this.toData() });
	}

	/**
	 * Get a snapshot of marker data for events and serialization.
	 *
	 * @returns Marker data including ID, position, and custom data
	 * 
	 * @remarks
	 * Used internally for event payloads and renderer sync.
	 * 
	 * @example
	 * ```ts
	 * // Serialize marker state
	 * const snapshot = marker.toData();
	 * console.log(snapshot); // { id: 'm_abc', x: 1000, y: 1500, data: {...} }
	 * ```
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

  /** 
   * Public events surface for this marker.
   * @readonly
   * 
   * @remarks
   * Provides typed event subscriptions for marker interactions.
   * 
   * @example
   * ```ts
   * // Subscribe to click events
   * marker.events.on('click').each(e => {
   *   console.log('Clicked at:', e.screen);
   * });
   * 
   * // Wait for pointer enter
   * await marker.events.once('pointerenter');
   * ```
   */
  declare readonly events: MarkerEvents<T>;

  /** 
   * Start a chainable marker transition builder.
   * 
   * @returns A new transition builder for this marker
   * 
   * @remarks
   * Multiple transitions can be created but only one runs at a time.
   * Starting a new transition cancels any active transition.
   * 
   * @example
   * ```ts
   * // Animate to new position
   * await marker.transition()
   *   .moveTo(2000, 1500)
   *   .apply({ animate: { durationMs: 600 } });
   * ```
   */
  transition(): MarkerTransition { return new MarkerTransitionImpl<T>(this); }
  
  /** 
   * Alias for {@link Marker.transition}.
   * @deprecated Use `transition()` instead
   */
  transitions(): MarkerTransition { return this.transition(); }

  /** @internal Cancel any active transition for this marker. */
  _cancelActiveTransition(): void { try { this._activeTx?.cancel(); } catch {} this._activeTx = undefined; }
  /** @internal Set the active transition for this marker. */
  _setActiveTransition(tx: MarkerTransitionImpl<T>): void { this._activeTx = tx; }
}

class MarkerTransitionImpl<T = unknown> implements MarkerTransition {
  private marker: Marker<T>;
  private targetX?: number;
  private targetY?: number;
  private targetSize?: number;
  private targetRotation?: number;
  private rafId: number | null = null;
  private resolve?: (r: ApplyResult) => void;
  private promise?: Promise<ApplyResult>;
  private cancelled = false;

  constructor(marker: Marker<T>) { this.marker = marker; }

  moveTo(x: number, y: number): this { this.targetX = x; this.targetY = y; return this; }
  setStyle(opts: { size?: number; rotation?: number }): this {
    if (opts.size !== undefined) this.targetSize = opts.size;
    if (opts.rotation !== undefined) this.targetRotation = opts.rotation;
    return this;
  }

  cancel(): void {
    this.cancelled = true;
    if (this.rafId != null) { try { cancelAnimationFrame(this.rafId); } catch {} this.rafId = null; }
    if (this.resolve) this.resolve({ status: 'canceled' });
  }

  async apply(opts?: ApplyOptions): Promise<ApplyResult> {
    if (this.promise) return this.promise;

    const needsPos = typeof this.targetX === 'number' && typeof this.targetY === 'number';
    const needsStyle = typeof this.targetSize === 'number' || typeof this.targetRotation === 'number';
    if (!needsPos && !needsStyle) {
      return Promise.resolve({ status: 'instant' });
    }

    const animate = opts?.animate;
    if (!animate) {
      if (needsPos) this.marker.moveTo(this.targetX as number, this.targetY as number);
      if (needsStyle) this.marker.setStyle({ size: this.targetSize, rotation: this.targetRotation });
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
    const ss = this.marker.size;
    const sr = (typeof this.marker.rotation === 'number' ? this.marker.rotation : 0);
    const tx = needsPos ? (this.targetX as number) : sx;
    const ty = needsPos ? (this.targetY as number) : sy;
    const ts = typeof this.targetSize === 'number' ? this.targetSize as number : (ss as number | undefined);
    const tr = typeof this.targetRotation === 'number' ? (this.targetRotation as number) : sr;

    // Normalize rotation to shortest path
    const srN = normalizeAngle(sr);
    const trN = normalizeAngle(tr);
    let dR = trN - srN;
    if (dR > 180) dR -= 360; else if (dR < -180) dR += 360;

    const startMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const delay = Math.max(0, animate.delayMs ?? 0);
    let delayed = delay === 0;

    this.promise = new Promise<ApplyResult>((resolve) => {
      this.resolve = resolve;
      const tick = () => {
        if (this.cancelled) { this.rafId = null; resolve({ status: 'canceled' }); return; }
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const t0 = now - startMs;
        if (!delayed) {
          if (t0 < delay) { this.rafId = requestAnimationFrame(tick); return; }
          delayed = true;
        }
        const t = Math.min(1, (t0 - (delay)) / duration);
        const k = easing(t);
        const cx = sx + (tx - sx) * k;
        const cy = sy + (ty - sy) * k;
        if (needsPos) this.marker.moveTo(cx, cy);
        if (needsStyle) {
          const rot = normalizeAngle(srN + dR * k);
          this.marker.setStyle({ size: ts, rotation: rot });
        }
        if (t >= 1) { this.rafId = null; resolve({ status: 'animated' }); return; }
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    });

    return this.promise;
  }
}
