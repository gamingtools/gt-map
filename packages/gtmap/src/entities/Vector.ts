import type { PublicEvents } from '../api/events/public';
import type { VectorEventMap } from '../api/events/maps';
import type { Point } from '../api/types';

import { EventedEntity } from './base';

export type VectorType = 'polyline' | 'polygon' | 'circle';

export type VectorGeometry = { type: 'polyline'; points: Point[] } | { type: 'polygon'; points: Point[] } | { type: 'circle'; center: Point; radius: number };

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
 * Events are minimal for now (remove); interaction events can be added later.
 */
export class Vector extends EventedEntity<VectorEventMap> {
	readonly id: string;
	private _geometry: VectorGeometry;
	private _onChange?: () => void;

	/**
	 * Create a vector with a geometry.
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

	get geometry(): VectorGeometry {
		return this._geometry;
	}

	/**
	 * Replace the vector geometry and trigger a renderer sync.
	 */
	setGeometry(geometry: VectorGeometry): void {
		this._geometry = geometry;
		this._onChange?.();
	}

	/**
	 * Emit a `remove` event. The owning layer clears it from the collection.
	 */
	remove(): void {
		this.emit('remove', { vector: { id: this.id, geometry: this._geometry } });
	}

	declare readonly events: PublicEvents<VectorEventMap>;
}
