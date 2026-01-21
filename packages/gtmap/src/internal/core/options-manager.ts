/**
 * OptionsManager handles wheel, inertia, and other map options.
 */

export interface OptionsManagerDeps {
	requestRender(): void;
}

export interface InertiaOptions {
	inertia?: boolean;
	inertiaDeceleration?: number;
	inertiaMaxSpeed?: number;
	easeLinearity?: number;
}

export interface WheelOptions {
	base?: number;
	ctrl?: number;
}

export interface LoaderOptions {
	maxTiles?: number;
	maxInflightLoads?: number;
	interactionIdleMs?: number;
}

export class OptionsManager {
	// Wheel options
	wheelSpeed = 1.0;
	wheelImmediate = 0.9;
	wheelSpeedCtrl = 0.4;
	wheelImmediateCtrl = 0.24;

	// Inertia options (Leaflet-like)
	inertia = true;
	inertiaDeceleration = 3400; // px/s^2
	inertiaMaxSpeed = 2000; // px/s (cap to prevent excessive throw)
	easeLinearity = 0.2;

	// Zoom-out center bias
	outCenterBias = 0.15;

	// Loader options
	interactionIdleMs = 160;

	constructor(private _deps: OptionsManagerDeps) {}

	/**
	 * Set mouse wheel zoom speed.
	 * @param speed - Speed multiplier (0.01-2.0)
	 */
	setWheelSpeed(speed: number): void {
		if (Number.isFinite(speed)) {
			this.wheelSpeed = Math.max(0.01, Math.min(2, speed));
			const t = Math.max(0, Math.min(1, this.wheelSpeed / 2));
			// Map speed to immediate step size; velocity gain removed in DI path
			this.wheelImmediate = 0.05 + t * (1.75 - 0.05);
			this._deps.requestRender();
		}
		// Keep ctrl-step in sync if desired
		const t2 = Math.max(0, Math.min(1, (this.wheelSpeedCtrl || 0.4) / 2));
		this.wheelImmediateCtrl = 0.1 + t2 * (1.9 - 0.1);
	}

	/**
	 * Set Ctrl+wheel zoom speed.
	 * @param speed - Speed multiplier (0.01-2.0)
	 */
	setWheelCtrlSpeed(speed: number): void {
		if (Number.isFinite(speed)) {
			this.wheelSpeedCtrl = Math.max(0.01, Math.min(2, speed));
			const t2 = Math.max(0, Math.min(1, (this.wheelSpeedCtrl || 0.4) / 2));
			this.wheelImmediateCtrl = 0.1 + t2 * (1.9 - 0.1);
		}
	}

	/**
	 * Set wheel options (both base and ctrl speeds).
	 */
	setWheelOptions(opts: WheelOptions): void {
		if (Number.isFinite(opts.base as number)) this.setWheelSpeed(opts.base as number);
		if (Number.isFinite(opts.ctrl as number)) this.setWheelCtrlSpeed(opts.ctrl as number);
	}

	/**
	 * Get the wheel step size based on whether ctrl is pressed.
	 */
	getWheelStep(ctrl: boolean): number {
		return ctrl ? this.wheelImmediateCtrl || this.wheelImmediate || 0.16 : this.wheelImmediate || 0.16;
	}

	/**
	 * Set inertia options (Leaflet-like).
	 */
	setInertiaOptions(opts: InertiaOptions): void {
		if (typeof opts.inertia === 'boolean') this.inertia = opts.inertia;
		if (Number.isFinite(opts.inertiaDeceleration as number)) {
			// clamp to sensible range (px/s^2)
			const v = Math.max(100, Math.min(20000, opts.inertiaDeceleration as number));
			this.inertiaDeceleration = v;
		}
		if (Number.isFinite(opts.inertiaMaxSpeed as number)) {
			const v = Math.max(10, Math.min(1e6, opts.inertiaMaxSpeed as number));
			this.inertiaMaxSpeed = v;
		}
		if (Number.isFinite(opts.easeLinearity as number)) {
			const v = Math.max(0.01, Math.min(1.0, opts.easeLinearity as number));
			this.easeLinearity = v;
		}
	}

	/**
	 * Set zoom-out center bias.
	 * When zooming out, bias the center toward previous visual center.
	 * @param v - Per-unit-zoom bias (0..1), or boolean (true=0.15, false=0)
	 */
	setZoomOutCenterBias(v: number | boolean): void {
		if (typeof v === 'boolean') {
			this.outCenterBias = v ? 0.15 : 0.0;
			return;
		}
		if (Number.isFinite(v)) this.outCenterBias = Math.max(0, Math.min(1, v as number));
	}

	/**
	 * Set loader options.
	 */
	setLoaderOptions(opts: LoaderOptions): void {
		if (Number.isFinite(opts.interactionIdleMs as number)) {
			this.interactionIdleMs = Math.max(0, (opts.interactionIdleMs as number) | 0);
		}
	}

	/**
	 * Initialize options from constructor options.
	 */
	initFromOptions(opts: {
		zoomOutCenterBias?: number | boolean;
		wheelSpeedCtrl?: number;
	}): void {
		if (typeof opts.zoomOutCenterBias === 'boolean') {
			this.outCenterBias = opts.zoomOutCenterBias ? 0.15 : 0.0;
		} else if (Number.isFinite(opts.zoomOutCenterBias as number)) {
			const v = Math.max(0, Math.min(1, opts.zoomOutCenterBias as number));
			this.outCenterBias = v;
		}
		if (Number.isFinite(opts.wheelSpeedCtrl as number)) {
			this.wheelSpeedCtrl = Math.max(0.01, Math.min(2, opts.wheelSpeedCtrl as number));
		}
	}
}
