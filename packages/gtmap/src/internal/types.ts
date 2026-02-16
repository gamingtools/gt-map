import type { EventMap, ViewState as PublicViewState, VectorStyle as VectorStyleAPI, VectorPrimitiveInternal } from '../api/types';

import type { PixelPoint } from './context/view-state';
import type { ProgramLocs } from './render/screen-cache';
import type { ScreenCache } from './render/screen-cache';

export type ViewState = {
	center: PixelPoint;
	zoom: number;
	minZoom: number;
	maxZoom: number;
	wrapX: boolean;
};

export interface InputDeps {
	getContainer(): HTMLElement;
	getCanvas(): HTMLCanvasElement;
	getMaxZoom(): number;
	getImageMaxZoom(): number;
	getMaxBoundsViscosity(): number;
	getView(): PublicViewState;
	setCenter(x: number, y: number, opts?: { skipClamp?: boolean }): void;
	setZoom(zoom: number): void;
	clampCenterWorld(centerWorld: { x: number; y: number }, zInt: number, scale: number, widthCSS: number, heightCSS: number, viscous?: boolean): { x: number; y: number };
	updatePointerAbs(x: number | null, y: number | null): void;
	emit<K extends keyof EventMap>(name: K, payload: EventMap[K]): void;
	setLastInteractAt(t: number): void;
	getAnchorMode(): 'pointer' | 'center';
	getWheelStep(ctrl: boolean): number;
	startEase(dz: number, px: number, py: number, anchor: 'pointer' | 'center'): void;
	cancelZoomAnim(): void;
	applyAnchoredZoom(targetZoom: number, px: number, py: number, anchor: 'pointer' | 'center'): void;
	// Leaflet-like inertia controls
	getInertia(): boolean;
	getInertiaDecel(): number; // px/s^2
	getInertiaMaxSpeed(): number; // px/s
	getEaseLinearity(): number;
	startPanBy(offsetXPx: number, offsetYPx: number, durationSec: number, ease?: number): void;
	cancelPanAnim(): void;
}

export interface ControllerDepsBase {
	getZoom(): number;
	getMaxZoom(): number;
	getImageMaxZoom(): number;
	getContainer(): HTMLElement;
	getMaxBoundsPx(): { minX: number; minY: number; maxX: number; maxY: number } | null;
	setCenter(x: number, y: number): void;
	requestRender(): void;
	emit<K extends keyof EventMap>(name: K, payload: EventMap[K]): void;
	now(): number;
	getPublicView(): PublicViewState;
}

export interface ZoomDeps extends ControllerDepsBase {
	getMinZoom(): number;
	getBounceAtZoomLimits(): boolean;
	setZoom(z: number): void;
	getOutCenterBias(): number;
	clampCenterWorld(centerWorld: { x: number; y: number }, zInt: number, scale: number, widthCSS: number, heightCSS: number): { x: number; y: number };
}

export interface PanDeps extends ControllerDepsBase {
	getWrapX(): boolean;
	getFreePan(): boolean;
	getMapSize(): { width: number; height: number };
	getMaxBoundsViscosity(): number;
	getCenter(): { x: number; y: number };
}

/**
 * SharedRenderCtx -- per-frame render context shared across all layer renderers.
 *
 * Contains GL state, view transform, and pre-computed view parameters.
 * Each layer renderer receives this via render(ctx, opacity).
 */
export interface SharedRenderCtx {
	gl: WebGLRenderingContext;
	prog: WebGLProgram;
	loc: ProgramLocs;
	quad: WebGLBuffer;
	canvas: HTMLCanvasElement;
	dpr: number;
	container: HTMLElement;
	zoom: number;
	center: PixelPoint;
	minZoom: number;
	maxZoom: number;
	imageMaxZoom: number;
	mapSize: { width: number; height: number };
	wrapX: boolean;
	zoomSnapThreshold: number;
	/** Pre-computed snapped zoom level integer. */
	baseZ: number;
	/** Pre-computed level scale factor. */
	levelScale: number;
	/** Pre-computed top-left in level-space coordinates. */
	tlWorld: { x: number; y: number };
	/** Container width in CSS pixels. */
	widthCSS: number;
	/** Container height in CSS pixels. */
	heightCSS: number;
	/** Project world coordinates to level-space at a given zoom integer. */
	project(x: number, y: number, z: number): { x: number; y: number };
	/** Screen cache for ghost draws (tile layers). */
	useScreenCache: boolean;
	screenCache: ScreenCache | null;
}

export type VectorStyle = VectorStyleAPI;
export type VectorPrimitive = VectorPrimitiveInternal;
