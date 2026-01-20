import type { VectorEventMap, VectorGeometry, VectorData } from '../api/events/maps';

import { EventedEntity } from './base';

/** Vector type discriminator. */
export type VectorType = 'polyline' | 'polygon' | 'circle';

// Use public VectorGeometry (polyline/polygon/circle without style)

/**
 * Options for creating a {@link Vector}.
 *
 * @public
 */
export interface VectorOptions<T = unknown> {
	/** User data attached to the vector. */
	data?: T;
}

let _vidSeq = 0;
function genVectorId(): string {
	_vidSeq = (_vidSeq + 1) % Number.MAX_SAFE_INTEGER;
	return `v_${_vidSeq.toString(36)}`;
}

/**
 * Vector - a simple geometric overlay (polyline, polygon, or circle).
 *
 * @public
 * @remarks
 * Events are minimal for now (`remove`); interaction events can be added later.
 */
export class Vector<T = unknown> extends EventedEntity<VectorEventMap<T>> {
	readonly id: string;
	private _geometry: VectorGeometry;
	private _data?: T;
	private _zIndex: number;
	private _onChange?: () => void;

	/**
	 * Create a vector with a geometry.
	 *
	 * @public
	 * @param geometry - Discriminated union of vector shapes
	 * @param opts - Options including user data and zIndex
	 * @param onChange - Internal callback for renderer sync
	 * @internal
	 */
	constructor(geometry: VectorGeometry, opts: VectorOptions<T> = {}, onChange?: () => void) {
		super();
		this.id = genVectorId();
		this._geometry = geometry;
		this._data = opts.data;
		this._zIndex = 0; // Vectors always render at z=0
		this._onChange = onChange;
	}

	/**
	 * Get z-index for rendering order.
	 * @remarks Vectors always render at z=0. Markers/decals default to z=1.
	 * Use negative zIndex on markers to place them behind vectors.
	 */
	get zIndex(): number {
		return this._zIndex;
	}

	/** Get current geometry. */
	get geometry(): VectorGeometry {
		return this._geometry;
	}

	/** Get user data attached to this vector. */
	get data(): T | undefined {
		return this._data;
	}

	/**
	 * Replace the vector geometry and trigger a renderer sync.
	 *
	 * @public
	 * @returns This vector for chaining
	 * @example
	 * ```ts
	 * // Turn a polygon into a polyline with two points
	 * v.setGeometry({ type: 'polyline', points: [ { x: 0, y: 0 }, { x: 100, y: 50 } ] });
	 * ```
	 */
	setGeometry(geometry: VectorGeometry): this {
		this._geometry = geometry;
		this._onChange?.();
		return this;
	}

	/**
	 * Update user data attached to this vector.
	 *
	 * @public
	 * @param data - Arbitrary user data
	 * @returns This vector for chaining
	 * @example
	 * ```ts
	 * vector.setData({ region: 'north', level: 5 });
	 * ```
	 */
	setData(data: T): this {
		this._data = data;
		return this;
	}

	/**
	 * Get a snapshot used in event payloads.
	 *
	 * @public
	 */
	toData(): VectorData<T> {
		return { id: this.id, geometry: this._geometry, data: this._data };
	}

	/**
	 * Emit a `remove` event (called by the owning layer after deletion).
	 * @internal
	 */
	_emitRemove(): void {
		this.emit('remove', { vector: this.toData() });
	}

	/** Public events surface for this vector. */
}
