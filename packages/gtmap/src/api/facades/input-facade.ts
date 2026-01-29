/**
 * InputFacade -- map.input sub-object.
 *
 * Wheel speed and inertia options.
 */
import type { InertiaOptions } from '../types';
import type { MapEngine } from '../../internal/map-engine';

export class InputFacade {
	private _engine: MapEngine;

	/** @internal */
	constructor(engine: MapEngine) {
		this._engine = engine;
	}

	/**
	 * Set mouse-wheel zoom speed.
	 * @param v Speed multiplier (0.01-2.0)
	 */
	setWheelSpeed(v: number): void {
		this._engine.setWheelSpeed(v);
	}

	/**
	 * Configure inertia behavior for pan gestures.
	 */
	setInertiaOptions(opts: InertiaOptions): void {
		this._engine.setInertiaOptions(opts);
	}
}
