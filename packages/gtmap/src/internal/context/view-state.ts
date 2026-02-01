/**
 * ViewStateStore -- single source of truth for all mutable view state.
 *
 * Replaces the scattered center/zoom/wrapX/freePan/mapSize/bounds fields
 * on mapgl.ts with a cohesive, observable state object.
 */
import type { ViewState as PublicViewState, MaxBoundsPx } from '../../api/types';

export type LngLat = { lng: number; lat: number };

export class ViewStateStore {
	// Core view
	center: LngLat;
	zoom: number;
	minZoom: number;
	maxZoom: number;

	// Map geometry
	mapSize: { width: number; height: number };
	imageMaxZoom: number;

	// Navigation flags
	wrapX: boolean;
	freePan: boolean;

	// Bounds
	maxBoundsPx: MaxBoundsPx | null;
	maxBoundsViscosity: number;
	clipToBounds: boolean;
	bounceAtZoomLimits: boolean;

	// Tile zoom snap threshold
	zoomSnapThreshold: number;

	// Canvas / viewport
	dpr: number;

	constructor(opts: {
		center: { x: number; y: number };
		zoom: number;
		minZoom: number;
		maxZoom: number;
		mapSize: { width: number; height: number };
		wrapX: boolean;
		freePan: boolean;
		maxBoundsPx: MaxBoundsPx | null;
		maxBoundsViscosity: number;
		clipToBounds: boolean;
		bounceAtZoomLimits: boolean;
		zoomSnapThreshold: number;
	}) {
		this.center = { lng: opts.center.x, lat: opts.center.y };
		this.zoom = Math.max(opts.minZoom, Math.min(opts.maxZoom, opts.zoom));
		this.minZoom = opts.minZoom;
		this.maxZoom = opts.maxZoom;
		this.mapSize = { width: opts.mapSize.width, height: opts.mapSize.height };
		this.imageMaxZoom = ViewStateStore.computeImageMaxZoom(opts.mapSize.width, opts.mapSize.height);
		this.wrapX = opts.wrapX;
		this.freePan = opts.freePan;
		this.maxBoundsPx = opts.maxBoundsPx;
		this.maxBoundsViscosity = opts.maxBoundsViscosity;
		this.clipToBounds = opts.clipToBounds;
		this.bounceAtZoomLimits = opts.bounceAtZoomLimits;
		this.zoomSnapThreshold = opts.zoomSnapThreshold;
		this.dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
	}

	static computeImageMaxZoom(width: number, height: number): number {
		const maxDim = Math.max(width, height);
		return Math.max(0, Math.ceil(Math.log2(maxDim / 256)));
	}

	setCenter(lng: number, lat: number): void {
		this.center = { lng, lat };
	}

	setZoom(z: number): void {
		this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, z));
	}

	toPublic(): PublicViewState {
		return {
			center: { x: this.center.lng, y: this.center.lat },
			zoom: this.zoom,
			minZoom: this.minZoom,
			maxZoom: this.maxZoom,
			wrapX: this.wrapX,
		};
	}
}
