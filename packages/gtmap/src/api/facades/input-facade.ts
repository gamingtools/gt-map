/**
 * InputFacade -- map.input sub-object.
 *
 * Wheel speed and inertia options.
 */
import type { InertiaOptions } from '../types';

export interface InputFacadeDeps {
	setWheelSpeed(v: number): void;
	setInertiaOptions(opts: InertiaOptions): void;
}

export class InputFacade {
	private _deps: InputFacadeDeps;

	/** @internal */
	constructor(deps: InputFacadeDeps) {
		this._deps = deps;
	}

	/**
	 * Set mouse-wheel zoom speed.
	 * @param v Speed multiplier (0.01-2.0)
	 */
	setWheelSpeed(v: number): void {
		this._deps.setWheelSpeed(v);
	}

	/**
	 * Configure inertia behavior for pan gestures.
	 */
	setInertiaOptions(opts: InertiaOptions): void {
		this._deps.setInertiaOptions(opts);
	}
}
