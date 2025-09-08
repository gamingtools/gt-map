import type { VectorEvents } from '../api/events/public';
import type { VectorEventMap, VectorGeometry } from '../api/events/maps';

import { EventedEntity } from './base';

/**
 * Vector shape type discriminator.
 * @public
 */
export type VectorType = 'polyline' | 'polygon' | 'circle';

// Use public VectorGeometry (polyline/polygon/circle without style)

/**
 * Options for creating a {@link Vector}.
 *
 * @public
 * @remarks
 * Currently reserved for future styling options.
 * Vector styles are defined in the geometry itself.
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
 * Vector - a geometric shape overlay (polyline, polygon, or circle).
 *
 * @public
 * 
 * @remarks
 * Vectors are created via {@link GTMap.addVector} and managed through
 * the {@link Layer} collection. Each vector has a unique ID and geometry
 * definition that includes both shape and style properties.
 * 
 * Supported shapes:
 * - `polyline` - Connected line segments
 * - `polygon` - Closed shape with optional fill
 * - `circle` - Circle with center and radius
 * 
 * Events emitted via {@link Vector.events | vector.events}:
 * - `remove` - Vector was removed from the map
 * 
 * @example
 * ```ts
 * // Add a polyline
 * const line = map.addVector({
 *   type: 'polyline',
 *   points: [
 *     { x: 1000, y: 1000 },
 *     { x: 2000, y: 1500 },
 *     { x: 3000, y: 1200 }
 *   ],
 *   style: { color: '#1e90ff', weight: 2, opacity: 0.9 }
 * });
 * 
 * // Add a filled polygon
 * const poly = map.addVector({
 *   type: 'polygon',
 *   points: [
 *     { x: 2000, y: 2000 },
 *     { x: 2500, y: 2000 },
 *     { x: 2500, y: 2500 },
 *     { x: 2000, y: 2500 }
 *   ],
 *   style: {
 *     color: '#10b981',
 *     weight: 2,
 *     fill: true,
 *     fillColor: '#10b981',
 *     fillOpacity: 0.3
 *   }
 * });
 * 
 * // Add a circle
 * const circle = map.addVector({
 *   type: 'circle',
 *   center: { x: 4096, y: 4096 },
 *   radius: 200,
 *   style: {
 *     color: '#f59e0b',
 *     weight: 2,
 *     fill: true,
 *     fillColor: '#f59e0b',
 *     fillOpacity: 0.2
 *   }
 * });
 * ```
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

	/** 
	 * Get the current geometry definition.
	 * @readonly
	 * 
	 * @remarks
	 * The geometry includes both shape data (points/center/radius)
	 * and style properties (color, weight, fill).
	 * 
	 * @example
	 * ```ts
	 * const geo = vector.geometry;
	 * if (geo.type === 'circle') {
	 *   console.log('Circle at', geo.center, 'radius', geo.radius);
	 * }
	 * ```
	 */
	get geometry(): VectorGeometry {
		return this._geometry;
	}

	/**
	 * Replace the vector's geometry definition.
	 *
	 * @param geometry - New geometry with shape and style
	 * 
	 * @remarks
	 * Completely replaces the geometry, including shape type.
	 * Triggers a renderer sync to update the display.
	 * 
	 * @example
	 * ```ts
	 * // Change a polygon to a polyline
	 * vector.setGeometry({
	 *   type: 'polyline',
	 *   points: [
	 *     { x: 0, y: 0 },
	 *     { x: 100, y: 50 },
	 *     { x: 200, y: 25 }
	 *   ],
	 *   style: { color: '#ff0000', weight: 3 }
	 * });
	 * 
	 * // Update circle radius and style
	 * vector.setGeometry({
	 *   type: 'circle',
	 *   center: { x: 2000, y: 2000 },
	 *   radius: 300,
	 *   style: {
	 *     color: '#00ff00',
	 *     weight: 2,
	 *     fill: true,
	 *     fillColor: '#00ff00',
	 *     fillOpacity: 0.2
	 *   }
	 * });
	 * ```
	 */
	setGeometry(geometry: VectorGeometry): void {
		this._geometry = geometry;
		this._onChange?.();
	}

	/**
	 * Remove this vector from the map.
	 *
	 * @remarks
	 * Emits a `remove` event. The owning {@link Layer} will clear it
	 * from the collection and trigger a renderer sync.
	 * 
	 * @example
	 * ```ts
	 * // Remove vector directly
	 * vector.remove();
	 * 
	 * // Remove all circles
	 * map.vectors.getAll()
	 *   .filter(v => v.geometry.type === 'circle')
	 *   .forEach(v => v.remove());
	 * ```
	 */
	remove(): void {
		this.emit('remove', { vector: { id: this.id, geometry: this._geometry } });
	}

	/** 
	 * Public events surface for this vector.
	 * @readonly
	 * 
	 * @remarks
	 * Currently only emits `remove` events. Future versions may
	 * add interaction events like `click`, `pointerenter`, etc.
	 * 
	 * @example
	 * ```ts
	 * // Listen for removal
	 * vector.events.on('remove').each(({ vector }) => {
	 *   console.log('Vector removed:', vector.id);
	 * });
	 * ```
	 */
	declare readonly events: VectorEvents;
}
