/**
 * InputManager -- owns InputController wiring, EventBridge setup,
 * and the InputDeps assembly.
 */
import type { EventMap } from '../../api/types';
import type { InputDeps } from '../types';
import type { MapContext } from '../context/map-context';
import EventBridge from '../events/event-bridge';
import { clampCenterWorld as clampCenterWorldCore } from '../core/bounds';
import * as Coords from '../coords';

import InputController from './input-controller';

export class InputManager {
	private ctx: MapContext;
	private _input: InputController | null = null;
	private _bridge: EventBridge | null = null;
	private _attached = false;

	constructor(ctx: MapContext) {
		this.ctx = ctx;
	}

	init(): void {
		const ctx = this.ctx;
		const vs = ctx.viewState;
		const coord = ctx.renderCoordinator!;
		const cm = ctx.contentManager!;
		const hitTestDebounceMs = 75;

		const inputDeps: InputDeps = {
			getContainer: () => ctx.container,
			getCanvas: () => ctx.canvas,
			getMaxZoom: () => vs.maxZoom,
			getImageMaxZoom: () => vs.imageMaxZoom,
			getView: () => vs.toPublic(),
			setCenter: (lng: number, lat: number) => {
				// Bounds clamping
				if (vs.maxBoundsPx) {
					const { zInt, scale } = Coords.zParts(vs.zoom);
					const rect = ctx.container.getBoundingClientRect();
					const wCSS = rect.width;
					const hCSS = rect.height;
					const s0 = Coords.sFor(vs.imageMaxZoom, zInt);
					const cw = { x: lng / s0, y: lat / s0 };
					const clamped = clampCenterWorldCore(cw, zInt, scale, wCSS, hCSS, vs.wrapX, vs.freePan, vs.mapSize, vs.maxZoom, vs.maxBoundsPx, vs.maxBoundsViscosity, false);
					vs.setCenter(clamped.x * s0, clamped.y * s0);
				} else {
					vs.setCenter(lng, lat);
				}
				ctx.requestRender();
			},
			setZoom: (z: number) => {
				vs.setZoom(z);
				ctx.requestRender();
			},
			clampCenterWorld: (cw, zInt, scale, w, h, viscous?: boolean) =>
				clampCenterWorldCore(cw, zInt, scale, w, h, vs.wrapX, vs.freePan, vs.mapSize, vs.maxZoom, vs.maxBoundsPx, vs.maxBoundsViscosity, !!viscous),
			updatePointerAbs: (x: number | null, y: number | null) => {
				if (Number.isFinite(x as number) && Number.isFinite(y as number)) ctx.pointerAbs = { x: x as number, y: y as number };
				else ctx.pointerAbs = null;
			},
			emit: <K extends keyof EventMap>(name: K, payload: EventMap[K]) => ctx.events.emit(name, payload),
			setLastInteractAt: (t: number) => {
				ctx.lastInteractAt = t;
			},
			getAnchorMode: () => coord.anchorMode,
			getWheelStep: (ctrl: boolean) => ctx.options.getWheelStep(ctrl),
			startEase: (dz, px, py, anchor) => coord.zoomController.startEase(dz, px, py, anchor),
			cancelZoomAnim: () => coord.zoomController.cancel(),
			applyAnchoredZoom: (targetZoom, px, py, anchor) => coord.zoomController.applyAnchoredZoom(targetZoom, px, py, anchor),
			getInertia: () => ctx.options.inertia,
			getInertiaDecel: () => ctx.options.inertiaDeceleration,
			getInertiaMaxSpeed: () => ctx.options.inertiaMaxSpeed,
			getEaseLinearity: () => ctx.options.easeLinearity,
			startPanBy: (dxPx: number, dyPx: number, durSec: number) => coord.startPanBy(dxPx, dyPx, durSec),
			cancelPanAnim: () => coord.panController.cancel(),
		};

		this._input = new InputController(inputDeps);
		this._input.attach();
		this._attached = true;

		// Wire event bridge for marker hover/click and mouse derivations
		try {
			this._bridge = new EventBridge({
				events: ctx.events,
				getView: () => vs.toPublic(),
				now: () => ctx.now(),
				isMoving: () => coord.isAnimating(),
				getLastInteractAt: () => ctx.lastInteractAt,
				getHitTestDebounceMs: () => hitTestDebounceMs,
				hitTest: (x, y, alpha) => cm.hitTestMarker(x, y, alpha),
				computeHits: (x, y) => cm.computeMarkerHits(x, y),
				emitMarker: (name, payload) => cm.emitMarker(name, payload),
				getLastHover: () => cm.lastHover,
				setLastHover: (h) => {
					cm.lastHover = h;
				},
				getMarkerDataById: (id: string) => cm.getMarkerDataById(id),
			});
			this._bridge.attach();
		} catch (e) {
			ctx.debug.warn('Event bridge attach', e);
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
		this._input = null;
	}
}
