/**
 * DisplayFacade -- map.display sub-object.
 *
 * Background color, grid visibility, upscale filter, FPS cap.
 */
import type { UpscaleFilterMode } from '../types';

export interface DisplayFacadeDeps {
	setGridVisible(on: boolean): void;
	setUpscaleFilter(mode: UpscaleFilterMode): void;
	setFpsCap(v: number): void;
	setBackgroundColor(color: string | { r: number; g: number; b: number; a?: number }): void;
	setRasterOpacity(v: number): void;
	setZoomSnapThreshold(v: number): void;
}

export class DisplayFacade {
	private _deps: DisplayFacadeDeps;

	/** @internal */
	constructor(deps: DisplayFacadeDeps) {
		this._deps = deps;
	}

	/**
	 * Show or hide the pixel grid overlay.
	 */
	setGridVisible(on: boolean): void {
		this._deps.setGridVisible(on);
	}

	/**
	 * Set the upscale filtering mode for the base image when zoomed in.
	 */
	setUpscaleFilter(mode: UpscaleFilterMode): void {
		this._deps.setUpscaleFilter(mode);
	}

	/**
	 * Set the maximum frames per second.
	 */
	setFpsCap(v: number): void {
		this._deps.setFpsCap(v);
	}

	/**
	 * Set the viewport background color.
	 */
	setBackgroundColor(color: string | { r: number; g: number; b: number; a?: number }): void {
		this._deps.setBackgroundColor(color);
	}

	/**
	 * Set the raster tile opacity.
	 */
	setRasterOpacity(v: number): void {
		this._deps.setRasterOpacity(v);
	}

	/**
	 * Set the fractional zoom threshold at which the renderer snaps to the next tile zoom level.
	 * Range: 0 to 1. Default: 0.4.
	 */
	setZoomSnapThreshold(v: number): void {
		this._deps.setZoomSnapThreshold(v);
	}
}
