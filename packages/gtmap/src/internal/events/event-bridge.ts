import type { EventMap, MarkerEventData, PointerEventData, MouseEventData } from '../../api/types';

import { TypedEventBus } from './typed-stream';
import { getInputDevice } from './pointer-meta';

type HoverKey = { type: string; idx: number; id?: string };

type Hit = {
	id: string;
	idx: number;
	type: string;
	world: { x: number; y: number };
	screen: { x: number; y: number };
	size: { width: number; height: number };
	rotation?: number;
	icon: { iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
};

/** Build a MarkerEventData payload from a hit-test result. */
function buildMarkerPayload(
	hit: Hit,
	screen: { x: number; y: number },
	now: number,
	view: import('../../api/types').ViewState,
	originalEvent: PointerEvent | undefined,
	data?: unknown | null,
): MarkerEventData {
	return {
		now,
		view,
		screen: { x: screen.x, y: screen.y },
		marker: {
			id: hit.id,
			index: hit.idx,
			world: { x: hit.world.x, y: hit.world.y },
			size: hit.size,
			...(hit.rotation !== undefined ? { rotation: hit.rotation } : {}),
			data: data ?? null,
		},
		icon: {
			id: hit.type,
			iconPath: hit.icon.iconPath,
			...(hit.icon.x2IconPath !== undefined ? { x2IconPath: hit.icon.x2IconPath } : {}),
			width: hit.icon.width,
			height: hit.icon.height,
			anchorX: hit.icon.anchorX,
			anchorY: hit.icon.anchorY,
		},
		...(originalEvent ? { originalEvent } : {}),
	};
}

/** Build a MarkerEventData payload for a leave event (no full hit data available). */
function buildLeavePayload(
	prev: HoverKey,
	screen: { x: number; y: number },
	now: number,
	view: import('../../api/types').ViewState,
	originalEvent: PointerEvent | undefined,
	data?: unknown | null,
): MarkerEventData {
	return {
		now,
		view,
		screen: { x: screen.x, y: screen.y },
		marker: {
			id: prev.id || '',
			index: prev.idx ?? -1,
			world: { x: 0, y: 0 },
			size: { width: 0, height: 0 },
			data: data ?? null,
		},
		icon: { id: prev.type, iconPath: '', width: 0, height: 0, anchorX: 0, anchorY: 0 },
		...(originalEvent ? { originalEvent } : {}),
	} as MarkerEventData;
}

export interface EventBridgeDeps {
	events: TypedEventBus<EventMap>;
	getView(): import('../../api/types').ViewState;
	now(): number;
	isMoving(): boolean;
	getLastInteractAt(): number;
	getHitTestDebounceMs(): number;
	// marker helpers
	hitTest(px: number, py: number, requireAlpha: boolean): Hit | null;
	computeHits(
		px: number,
		py: number,
	): Array<{
		id: string;
		idx: number;
		world: { x: number; y: number };
		size: { width: number; height: number };
		rotation?: number;
		icon: { id: string; iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
	}>;
	emitMarker(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', payload: MarkerEventData): void;
	// hover state bridge for removal handling elsewhere
	getLastHover(): HoverKey | null;
	setLastHover(h: HoverKey | null): void;
	// marker data lookup (optional)
	getMarkerDataById?: (id: string) => unknown | null | undefined;
}

export default class EventBridge {
	private d: EventBridgeDeps;
	private downAt: { x: number; y: number; t: number; tol: number } | null = null;
	private movedSinceDown = false;
	private longPressTimer: number | null = null;
	private longPressed = false;
	private pressTarget: { id: string; idx: number } | null = null;
	// Cache isClick result for mouse click derivation (downAt is cleared before second handler runs)
	private lastPointerUpWasClick = false;

	constructor(deps: EventBridgeDeps) {
		this.d = deps;
	}

	attach(): void {
		const bus = this.d.events;
		// pointerdown
		bus.on('pointerdown').each((e) => {
			if (!e || e.x == null || e.y == null) return;
			const now = this.d.now();
			const device = getInputDevice(e.originalEvent);
			const tol = device === 'touch' ? 18 : 8;
			this.downAt = { x: e.x, y: e.y, t: now, tol };
			this.movedSinceDown = false;
			const hit = this.d.hitTest(e.x, e.y, false);
			if (hit) {
				const markerData = this.d.getMarkerDataById ? this.d.getMarkerDataById(hit.id) : null;
				const payload = buildMarkerPayload(hit, { x: e.x, y: e.y }, now, this.d.getView(), e.originalEvent, markerData);
				this.d.emitMarker('down', payload);
				try {
					this.d.events.emit('markerdown', payload);
				} catch { /* expected: user event handler may throw */ }
				this.pressTarget = { id: hit.id, idx: hit.idx };
				this.longPressed = false;
				if (device === 'touch') {
					if (this.longPressTimer != null) clearTimeout(this.longPressTimer);
					this.longPressTimer = window.setTimeout(() => {
						this.longPressTimer = null;
						this.longPressed = true;
						const lpHit = this.d.hitTest(e.x, e.y, false);
						if (lpHit && this.pressTarget && lpHit.id === this.pressTarget.id) {
							const pl = buildMarkerPayload(lpHit, { x: e.x, y: e.y }, this.d.now(), this.d.getView(), e.originalEvent);
							this.d.emitMarker('longpress', pl);
							try {
								this.d.events.emit('markerlongpress', pl);
							} catch { /* expected: user event handler may throw */ }
						}
					}, 500);
				}
			} else {
				this.pressTarget = null;
			}
		});

		// pointermove: hover + cancel long-press if moved
		bus.on('pointermove').each((e) => {
			if (!e || e.x == null || e.y == null) return;
			if (this.downAt) {
				const dx = e.x - this.downAt.x;
				const dy = e.y - this.downAt.y;
				if (Math.hypot(dx, dy) > this.downAt.tol) this.movedSinceDown = true;
				if (this.movedSinceDown && this.longPressTimer != null) {
					clearTimeout(this.longPressTimer);
					this.longPressTimer = null;
				}
			}
			const now = this.d.now();
			const moving = this.d.isMoving();
			const idle = !moving && now - this.d.getLastInteractAt() >= this.d.getHitTestDebounceMs();
			if (!idle) {
				const prev = this.d.getLastHover();
				if (prev) {
					const leavePayload = buildLeavePayload(prev, { x: e.x, y: e.y }, now, this.d.getView(), e.originalEvent, prev.id ? (this.d.getMarkerDataById?.(prev.id) ?? null) : null);
					this.d.emitMarker('leave', leavePayload);
					try {
						this.d.events.emit('markerleave', leavePayload);
					} catch { /* expected: user event handler may throw */ }
					this.d.setLastHover(null);
				}
				return;
			}
			const hit = this.d.hitTest(e.x, e.y, false);
			const prev = this.d.getLastHover();
			if (hit) {
				if (!prev || prev.id !== hit.id) {
					if (prev) {
						const leavePayload = buildLeavePayload(prev, { x: e.x, y: e.y }, now, this.d.getView(), e.originalEvent, prev.id ? (this.d.getMarkerDataById?.(prev.id) ?? null) : null);
						this.d.emitMarker('leave', leavePayload);
					}
					const enterPayload = buildMarkerPayload(hit, { x: e.x, y: e.y }, now, this.d.getView(), e.originalEvent, this.d.getMarkerDataById?.(hit.id) ?? null);
					this.d.emitMarker('enter', enterPayload);
					try {
						this.d.events.emit('markerenter', enterPayload);
					} catch { /* expected: user event handler may throw */ }
					this.d.setLastHover({ idx: hit.idx, type: hit.type, id: hit.id });
				}
			} else if (prev) {
				const leavePayload = buildLeavePayload(prev, { x: e.x, y: e.y }, now, this.d.getView(), e.originalEvent);
				this.d.emitMarker('leave', leavePayload);
				try {
					this.d.events.emit('markerleave', leavePayload);
				} catch { /* expected: user event handler may throw */ }
				this.d.setLastHover(null);
			}
		});

		// pointerup: emit up and click if qualifies
		bus.on('pointerup').each((e) => {
			if (!e || e.x == null || e.y == null) return;
			const now = this.d.now();
			const moving = this.d.isMoving();
			const isClick = !!this.downAt && !this.movedSinceDown && !moving && now - this.downAt.t < 400;
			// Save for mouse click derivation (downAt is cleared below before second handler runs)
			this.lastPointerUpWasClick = isClick;
			this.downAt = null;
			const upHit = this.d.hitTest(e.x, e.y, true);
			if (upHit) {
				const dataUp = this.d.getMarkerDataById ? this.d.getMarkerDataById(upHit.id) : null;
				const payload = buildMarkerPayload(upHit, { x: e.x, y: e.y }, now, this.d.getView(), e.originalEvent, dataUp);
				this.d.emitMarker('up', payload);
				try {
					this.d.events.emit('markerup', payload);
				} catch { /* expected: user event handler may throw */ }
			}
			if (this.longPressTimer != null) {
				clearTimeout(this.longPressTimer);
				this.longPressTimer = null;
			}
			if (!isClick) return;
			const hit = this.d.hitTest(e.x, e.y, true);
			if (hit) {
				const data = this.d.getMarkerDataById ? this.d.getMarkerDataById(hit.id) : null;
				const payload = buildMarkerPayload(hit, { x: e.x, y: e.y }, now, this.d.getView(), e.originalEvent, data);
				this.d.emitMarker('click', payload);
				try {
					this.d.events.emit('markerclick', payload);
				} catch { /* expected: user event handler may throw */ }
			}
			this.pressTarget = null;
			if (this.longPressed) this.longPressed = false;
		});

		// Derive mouse events from pointer events; enrich with marker hits when idle
		const emitMouseOnce = (name: 'mousedown' | 'mousemove' | 'mouseup' | 'click', e: PointerEventData) => {
			if (e.x == null || e.y == null) return;
			const now = this.d.now();
			const moving = this.d.isMoving();
			const idle = !moving && now - this.d.getLastInteractAt() >= this.d.getHitTestDebounceMs();
			let payload: MouseEventData = {
				x: e.x,
				y: e.y,
				world: e.world,
				view: e.view,
				originalEvent: e.originalEvent,
			};
			if (idle && name === 'mousemove') {
				try {
					const hits = this.d.computeHits(e.x, e.y);
					if (hits.length) {
						const mapped = hits.map((h) => ({
							marker: { id: h.id, index: h.idx, world: { x: h.world.x, y: h.world.y }, size: h.size, ...(h.rotation !== undefined ? { rotation: h.rotation } : {}) },
							icon: {
								id: h.icon.id,
								iconPath: h.icon.iconPath,
								...(h.icon.x2IconPath !== undefined ? { x2IconPath: h.icon.x2IconPath } : {}),
								width: h.icon.width,
								height: h.icon.height,
								anchorX: h.icon.anchorX,
								anchorY: h.icon.anchorY,
							},
						}));
						payload = { ...payload, markers: mapped } as MouseEventData;
					}
				} catch { /* expected: hit test may fail during transitions */ }
			}
			this.d.events.emit(name, payload);
		};

		bus.on('pointerdown').each((e) => {
			if (getInputDevice(e.originalEvent) === 'mouse') emitMouseOnce('mousedown', e);
		});
		bus.on('pointermove').each((e) => {
			if (getInputDevice(e.originalEvent) === 'mouse') emitMouseOnce('mousemove', e);
		});
		bus.on('pointerup').each((e) => {
			if (getInputDevice(e.originalEvent) === 'mouse') emitMouseOnce('mouseup', e);
		});
		bus.on('pointerup').each((e) => {
			if (getInputDevice(e.originalEvent) !== 'mouse') return;
			// Use cached isClick result since downAt was cleared by the earlier pointerup handler
			if (!this.lastPointerUpWasClick) return;
			emitMouseOnce('click', e);
		});
	}
}
