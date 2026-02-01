/**
 * InputManager -- owns InputController wiring, EventBridge setup,
 * and the InputDeps assembly.
 */
import type { EventMap, MarkerEventData } from '../../api/types';
import type { InputDeps } from '../types';
import type { TypedEventBus } from '../events/typed-stream';
import type { HitResult, AllHitsResult } from '../events/marker-hit-testing';
import EventBridge from '../events/event-bridge';
import { clampCenterWorld as clampCenterWorldCore } from '../core/bounds';
import * as Coords from '../coords';

import InputController from './input-controller';

export interface InputManagerDeps {
	getContainer(): HTMLDivElement;
	getCanvas(): HTMLCanvasElement;
	events: TypedEventBus<EventMap>;
	// View state
	getZoom(): number;
	getMaxZoom(): number;
	getImageMaxZoom(): number;
	getMapSize(): { width: number; height: number };
	getWrapX(): boolean;
	getFreePan(): boolean;
	getMaxBoundsPx(): { minX: number; minY: number; maxX: number; maxY: number } | null;
	getMaxBoundsViscosity(): number;
	getView(): { center: { x: number; y: number }; zoom: number; minZoom: number; maxZoom: number; wrapX: boolean };
	setCenter(x: number, y: number): void;
	setZoom(z: number): void;
	requestRender(): void;
	now(): number;
	debugWarn(msg: string, err?: unknown): void;
	// Pointer / interaction state
	updatePointerAbs(x: number | null, y: number | null): void;
	setLastInteractAt(t: number): void;
	getLastInteractAt(): number;
	// Zoom controller
	getAnchorMode(): 'pointer' | 'center';
	getWheelStep(ctrl: boolean): number;
	startEase(dz: number, px: number, py: number, anchor: 'pointer' | 'center'): void;
	cancelZoomAnim(): void;
	applyAnchoredZoom(targetZoom: number, px: number, py: number, anchor: 'pointer' | 'center'): void;
	// Pan controller
	getInertia(): boolean;
	getInertiaDecel(): number;
	getInertiaMaxSpeed(): number;
	getEaseLinearity(): number;
	startPanBy(dxPx: number, dyPx: number, durSec: number): void;
	cancelPanAnim(): void;
	// Animation state
	isAnimating(): boolean;
	// Marker hit testing (EventBridge deps)
	hitTestMarker(px: number, py: number, requireAlpha: boolean): HitResult | null;
	computeMarkerHits(px: number, py: number): AllHitsResult[];
	emitMarker(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', payload: MarkerEventData): void;
	getLastHover(): { type: string; idx: number; id?: string } | null;
	setLastHover(h: { type: string; idx: number; id?: string } | null): void;
	getMarkerDataById(id: string): unknown | undefined;
}

export class InputManager {
	private deps: InputManagerDeps;
	private _input: InputController | null = null;
	private _bridge: EventBridge | null = null;
	private _attached = false;

	constructor(deps: InputManagerDeps) {
		this.deps = deps;
	}

	init(): void {
		const d = this.deps;
		const hitTestDebounceMs = 75;

		const inputDeps: InputDeps = {
			getContainer: d.getContainer,
			getCanvas: d.getCanvas,
			getMaxZoom: d.getMaxZoom,
			getImageMaxZoom: d.getImageMaxZoom,
			getMaxBoundsViscosity: d.getMaxBoundsViscosity,
			getView: d.getView,
			setCenter: (x: number, y: number, opts?: { skipClamp?: boolean }) => {
				const maxBoundsPx = d.getMaxBoundsPx();
				if (maxBoundsPx && !opts?.skipClamp) {
					const zoom = d.getZoom();
					const { zInt, scale } = Coords.zParts(zoom);
					const rect = d.getContainer().getBoundingClientRect();
					const wCSS = rect.width;
					const hCSS = rect.height;
					const s0 = Coords.sFor(d.getImageMaxZoom(), zInt);
					const cw = { x: x / s0, y: y / s0 };
					const clamped = clampCenterWorldCore(cw, zInt, scale, wCSS, hCSS, d.getWrapX(), d.getFreePan(), d.getMapSize(), d.getMaxZoom(), maxBoundsPx, d.getMaxBoundsViscosity(), false);
					d.setCenter(clamped.x * s0, clamped.y * s0);
				} else {
					d.setCenter(x, y);
				}
				d.requestRender();
			},
			setZoom: (z: number) => {
				d.setZoom(z);
				d.requestRender();
			},
			clampCenterWorld: (cw, zInt, scale, w, h, viscous?: boolean) =>
				clampCenterWorldCore(cw, zInt, scale, w, h, d.getWrapX(), d.getFreePan(), d.getMapSize(), d.getMaxZoom(), d.getMaxBoundsPx(), d.getMaxBoundsViscosity(), !!viscous),
			updatePointerAbs: d.updatePointerAbs,
			emit: <K extends keyof EventMap>(name: K, payload: EventMap[K]) => d.events.emit(name, payload),
			setLastInteractAt: d.setLastInteractAt,
			getAnchorMode: d.getAnchorMode,
			getWheelStep: d.getWheelStep,
			startEase: d.startEase,
			cancelZoomAnim: d.cancelZoomAnim,
			applyAnchoredZoom: d.applyAnchoredZoom,
			getInertia: d.getInertia,
			getInertiaDecel: d.getInertiaDecel,
			getInertiaMaxSpeed: d.getInertiaMaxSpeed,
			getEaseLinearity: d.getEaseLinearity,
			startPanBy: d.startPanBy,
			cancelPanAnim: d.cancelPanAnim,
		};

		this._input = new InputController(inputDeps);
		this._input.attach();
		this._attached = true;

		// Wire event bridge for marker hover/click and mouse derivations
		try {
			this._bridge = new EventBridge({
				events: d.events,
				getView: d.getView,
				now: d.now,
				isMoving: d.isAnimating,
				getLastInteractAt: d.getLastInteractAt,
				getHitTestDebounceMs: () => hitTestDebounceMs,
				hitTest: (x, y, alpha) => d.hitTestMarker(x, y, alpha),
				computeHits: (x, y) => d.computeMarkerHits(x, y),
				emitMarker: (name, payload) => d.emitMarker(name, payload),
				getLastHover: d.getLastHover,
				setLastHover: d.setLastHover,
				getMarkerDataById: d.getMarkerDataById,
			});
			this._bridge.attach();
		} catch (e) {
			d.debugWarn('Event bridge attach', e);
		}
	}

	attach(): void {
		if (!this._attached) {
			try {
				this._input?.attach?.();
				this._attached = true;
			} catch {}
		}
	}

	detach(): void {
		try {
			this._input?.dispose();
		} catch {}
		this._attached = false;
	}

	dispose(): void {
		this.detach();
		try {
			this._bridge?.dispose();
		} catch {}
		this._bridge = null;
		this._input = null;
	}
}
