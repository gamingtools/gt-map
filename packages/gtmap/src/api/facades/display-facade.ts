/**
 * DisplayFacade -- map.display sub-object.
 *
 * Background color, grid visibility, upscale filter, FPS cap.
 */
import type { UpscaleFilterMode } from '../types';
import type { MapEngine } from '../../internal/map-engine';

export class DisplayFacade {
	private _engine: MapEngine;

	/** @internal */
	constructor(engine: MapEngine) {
		this._engine = engine;
	}

	/**
	 * Show or hide the pixel grid overlay.
	 */
	setGridVisible(on: boolean): void {
		this._engine.setGridVisible(on);
	}

	/**
	 * Set the upscale filtering mode for the base image when zoomed in.
	 */
	setUpscaleFilter(mode: UpscaleFilterMode): void {
		this._engine.setUpscaleFilter(mode);
	}

	/**
	 * Set the maximum frames per second.
	 */
	setFpsCap(v: number): void {
		this._engine.setFpsCap(v);
	}

	/**
	 * Set the viewport background color.
	 */
	setBackgroundColor(color: string | { r: number; g: number; b: number; a?: number }): void {
		this._engine.setBackgroundColor(color);
	}

	/**
	 * Set the raster tile opacity.
	 */
	setRasterOpacity(v: number): void {
		this._engine.setRasterOpacity(v);
	}
}
