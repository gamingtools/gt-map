/**
 * ViewStateStore -- single source of truth for all mutable view state.
 *
 * Replaces the scattered center/zoom/wrapX/freePan/mapSize/bounds fields
 * on mapgl.ts with a cohesive, observable state object.
 */
import type { ViewState as PublicViewState, MaxBoundsPx } from '../../api/types';
import { computeImageMaxZoom } from '../map-math';

export type PixelPoint = { x: number; y: number };

export class ViewStateStore {
	// Core view
	center: PixelPoint;
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
		this.center = { x: opts.center.x, y: opts.center.y };
		this.zoom = Math.max(opts.minZoom, Math.min(opts.maxZoom, opts.zoom));
		this.minZoom = opts.minZoom;
		this.maxZoom = opts.maxZoom;
		this.mapSize = { width: opts.mapSize.width, height: opts.mapSize.height };
		this.imageMaxZoom = computeImageMaxZoom(opts.mapSize.width, opts.mapSize.height);
		this.wrapX = opts.wrapX;
		this.freePan = opts.freePan;
		this.maxBoundsPx = opts.maxBoundsPx;
		this.maxBoundsViscosity = opts.maxBoundsViscosity;
		this.clipToBounds = opts.clipToBounds;
		this.bounceAtZoomLimits = opts.bounceAtZoomLimits;
		this.zoomSnapThreshold = opts.zoomSnapThreshold;
		this.dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
	}

	setCenter(x: number, y: number): void {
		this.center = { x, y };
	}

	setZoom(z: number): void {
		this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, z));
	}

	toPublic(): PublicViewState {
		return {
			center: { x: this.center.x, y: this.center.y },
			zoom: this.zoom,
			minZoom: this.minZoom,
			maxZoom: this.maxZoom,
			wrapX: this.wrapX,
		};
	}
}
