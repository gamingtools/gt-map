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
export interface VectorOptions {
	// Placeholder for future styling options
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
export class Vector extends EventedEntity<VectorEventMap> {
	readonly id: string;
	private _geometry: VectorGeometry;
	private _onChange?: () => void;

	/**
	 * Create a vector with a geometry.
	 *
	 * @public
	 * @param geometry - Discriminated union of vector shapes
	 * @param _opts - Reserved for future styling options
	 * @param onChange - Internal callback for renderer sync
	 * @internal
	 */
	constructor(geometry: VectorGeometry, _opts: VectorOptions = {}, onChange?: () => void) {
		super();
		this.id = genVectorId();
		this._geometry = geometry;
		this._onChange = onChange;
	}

	/** Get current geometry. */
	get geometry(): VectorGeometry {
		return this._geometry;
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
	 * Get a snapshot used in event payloads.
	 *
	 * @public
	 */
	toData(): VectorData {
		return { id: this.id, geometry: this._geometry };
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
