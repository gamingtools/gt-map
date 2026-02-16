/**
 * MapConfig -- immutable configuration snapshot from constructor options.
 * Holds the initial values that don't change after construction.
 */
import type { MapOptions, SpinnerOptions } from '../../api/types';

export class MapConfig {
	readonly mapSize: { width: number; height: number };
	readonly initialCenter: { x: number; y: number };
	readonly initialZoom: number;
	readonly minZoom: number;
	readonly maxZoom: number;
	readonly autoResize: boolean;
	readonly backgroundColor: string | { r: number; g: number; b: number; a?: number } | undefined;
	readonly screenCache: boolean;
	readonly fpsCap: number;
	readonly wrapX: boolean;
	readonly freePan: boolean;
	readonly maxBoundsPx: { minX: number; minY: number; maxX: number; maxY: number } | null;
	readonly maxBoundsViscosity: number;
	readonly clipToBounds: boolean;
	readonly bounceAtZoomLimits: boolean;
	readonly spinner: SpinnerOptions | undefined;
	readonly zoomSnapThreshold: number;
	readonly debug: boolean;

	constructor(opts: MapOptions) {
		this.mapSize = { width: opts.mapSize.width, height: opts.mapSize.height };
		this.initialCenter = opts.center ?? { x: this.mapSize.width / 2, y: this.mapSize.height / 2 };
		this.initialZoom = opts.zoom ?? 0;
		this.minZoom = opts.minZoom ?? 0;
		this.maxZoom = opts.maxZoom ?? 0;
		this.autoResize = opts.autoResize !== false;
		this.backgroundColor = opts.backgroundColor;
		this.screenCache = opts.screenCache !== false;
		this.fpsCap = opts.fpsCap ?? 60;
		this.wrapX = opts.wrapX ?? false;
		this.freePan = opts.freePan ?? false;
		this.maxBoundsPx = opts.maxBoundsPx ?? null;
		this.maxBoundsViscosity = opts.maxBoundsViscosity ?? 0;
		this.clipToBounds = opts.clipToBounds ?? false;
		this.bounceAtZoomLimits = opts.bounceAtZoomLimits ?? false;
		this.spinner = opts.spinner;
		this.zoomSnapThreshold = Math.max(0, Math.min(1, opts.zoomSnapThreshold ?? 0.4));
		this.debug = opts.debug ?? false;
	}
}
