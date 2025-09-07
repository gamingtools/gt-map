import type { MarkerEvents } from '../api/events/public';
import type { MarkerEventMap, MarkerData } from '../api/events/maps';

import { EventedEntity } from './base';

/**
 * Options for creating or styling a {@link Marker}.
 *
 * @public
 */
export interface MarkerOptions<T = unknown> {
	iconType?: string; // id of IconHandle, defaults to 'default'
	size?: number;
	rotation?: number; // degrees clockwise
	data?: T;
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
 * @remarks
 * Emits typed events via {@link Marker.events | marker.events} (`click`,
 * `pointerenter`, `pointerleave`, `positionchange`, `remove`, …).
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

	/** Get the current world X (pixels). */
	get x(): number {
		return this._x;
	}
	/** Get the current world Y (pixels). */
	get y(): number {
		return this._y;
	}
	/** Icon id for this marker (or `'default'`). */
	get iconType(): string {
		return this._iconType;
	}
	/** Optional scale multiplier (renderer treats `undefined` as 1). */
	get size(): number | undefined {
		return this._size;
	}
	/** Optional clockwise rotation in degrees. */
	get rotation(): number | undefined {
		return this._rotation;
	}
	/** Arbitrary user data attached to the marker. */
	get data(): T | undefined {
		return this._data;
	}

	/**
	 * Attach arbitrary user data to this marker and trigger a renderer sync.
	 *
	 * @public
	 * @example
	 * ```ts
	 * // Tag this marker with a POI payload used elsewhere in the app
	 * marker.setData({ id: 'poi-1', category: 'shop' });
	 * ```
	 */
	setData(data: T): void {
		this._data = data;
		this._onChange?.();
	}

	/**
	 * Update the marker style properties and trigger a renderer sync.
	 *
	 * @public
	 * @param opts - Partial style ({@link MarkerOptions})
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
	 * @public
	 * @remarks
	 * Emits a `positionchange` event and re‑syncs to the renderer.
	 * @example
	 * ```ts
	 * // Nudge marker 10px to the right
	 * marker.moveTo(marker.x + 10, marker.y);
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
	 * Emit a `remove` event.
	 *
	 * @public
	 * @remarks
	 * The owning layer will clear it from the collection.
	 */
	remove(): void {
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

	/** Public events surface for this marker (typed event names/payloads). */
	declare readonly events: MarkerEvents<T>;
}
