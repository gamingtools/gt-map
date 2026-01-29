import type { DecalEventMap, DecalData } from '../api/events/maps';
import type { IconScaleFunction } from '../api/types';
import type { Visual } from '../api/visual';

import { EventedEntity } from './base';

/**
 * Options for creating a {@link Decal}.
 *
 * @public
 */
export interface DecalOptions {
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
	 * @remarks Vectors always render at z=0. Use negative zIndex to place decals behind vectors.
	 */
	zIndex?: number;
	/**
	 * Override the map-level icon scale function for this decal.
	 * Set to `null` to disable scaling (always use scale=1).
	 * If undefined, falls back to visual's iconScaleFunction, then map's.
	 */
	iconScaleFunction?: IconScaleFunction | null;
}

let _decalIdSeq = 0;
function genDecalId(): string {
	_decalIdSeq = (_decalIdSeq + 1) % Number.MAX_SAFE_INTEGER;
	return `d_${_decalIdSeq.toString(36)}`;
}

/**
 * Decal - a non-interactive visual anchored at a world pixel coordinate.
 *
 * @public
 * @remarks
 * Decals are like markers but without interactivity (no click/hover events).
 * Use for decorations, labels, effects, or other non-clickable visuals.
 * Emits `positionchange` and `remove` events.
 */
export class Decal extends EventedEntity<DecalEventMap> {
	readonly id: string;
	private _x: number;
	private _y: number;
	private _visual: Visual;
	private _scale: number;
	private _rotation: number;
	private _opacity: number;
	private _zIndex: number;
	private _iconScaleFunction?: IconScaleFunction | null;
	private _onChange?: () => void;

	/**
	 * Create a decal at the given world pixel coordinate.
	 *
	 * @param x - World X (pixels)
	 * @param y - World Y (pixels)
	 * @param opts - Visual and style options
	 * @param onChange - Internal callback to notify the map of changes
	 * @internal
	 */
	constructor(x: number, y: number, opts: DecalOptions, onChange?: () => void) {
		super();
		this.id = genDecalId();
		this._x = x;
		this._y = y;
		this._visual = opts.visual;
		this._scale = opts.scale ?? 1;
		this._rotation = opts.rotation ?? 0;
		this._opacity = opts.opacity ?? 1;
		this._zIndex = opts.zIndex ?? 1;
		if (opts.iconScaleFunction !== undefined) this._iconScaleFunction = opts.iconScaleFunction;
		if (onChange !== undefined) this._onChange = onChange;
	}

	/** Get the current world X (pixels). */
	get x(): number {
		return this._x;
	}

	/** Get the current world Y (pixels). */
	get y(): number {
		return this._y;
	}

	/** The visual template for this decal. */
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

	/** Icon scale function override for this decal (undefined = use visual's or map's). */
	get iconScaleFunction(): IconScaleFunction | null | undefined {
		return this._iconScaleFunction;
	}

	/**
	 * Update the decal style properties.
	 *
	 * @public
	 * @param opts - Partial style options
	 * @returns This decal for chaining
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
	 * Move the decal to a new position.
	 *
	 * @public
	 * @param x - New world X
	 * @param y - New world Y
	 * @returns This decal for chaining
	 */
	moveTo(x: number, y: number): this {
		const dx = x - this._x;
		const dy = y - this._y;
		this._x = x;
		this._y = y;
		this.emit('positionchange', { x, y, dx, dy, decal: this.toData() });
		this._onChange?.();
		return this;
	}

	/**
	 * Emit a `remove` event (called by the owning collection after deletion).
	 * @internal
	 */
	_emitRemove(): void {
		this.emit('remove', { decal: this.toData() });
	}

	/**
	 * Get a snapshot for event payloads.
	 *
	 * @public
	 */
	toData(): DecalData {
		return { id: this.id, x: this._x, y: this._y };
	}
}
