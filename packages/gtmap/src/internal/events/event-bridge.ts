import type { EventMap, MarkerEventData } from '../../api/types';
import { TypedEventBus } from './typed-stream';

type HoverKey = { type: string; idx: number; id?: string };

type Hit = {
  id: string;
  idx: number;
  type: string;
  world: { x: number; y: number };
  screen: { x: number; y: number };
  size: { w: number; h: number };
  rotation?: number;
  icon: { iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
};

export interface EventBridgeDeps {
  events: TypedEventBus<EventMap>;
  getView(): import('../../api/types').ViewState;
  now(): number;
  isMoving(): boolean;
  getLastInteractAt(): number;
  getHitTestDebounceMs(): number;
  // marker helpers
  hitTest(px: number, py: number, requireAlpha: boolean): Hit | null;
  computeHits(px: number, py: number): Array<{ id: string; idx: number; world: { x: number; y: number }; size: { w: number; h: number }; rotation?: number; icon: { id: string; iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number } }>;
  emitMarker(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', payload: MarkerEventData): void;
  // hover state bridge for removal handling elsewhere
  getLastHover(): HoverKey | null;
  setLastHover(h: HoverKey | null): void;
}

export default class EventBridge {
  private d: EventBridgeDeps;
  private downAt: { x: number; y: number; t: number; tol: number } | null = null;
  private movedSinceDown = false;
  private longPressTimer: number | null = null;
  private longPressed = false;
  private pressTarget: { id: string; idx: number } | null = null;

  constructor(deps: EventBridgeDeps) {
    this.d = deps;
  }

  attach(): void {
    const bus = this.d.events;
    // pointerdown
    bus.on('pointerdown').each((e) => {
      if (!e || e.x == null || e.y == null) return;
      const now = this.d.now();
      const ptrType = (e.originalEvent?.pointerType || '').toString();
      const tol = ptrType === 'touch' ? 18 : 8;
      this.downAt = { x: e.x, y: e.y, t: now, tol };
      this.movedSinceDown = false;
      const hit = this.d.hitTest(e.x, e.y, false);
      if (hit) {
        const payload: MarkerEventData = {
          now,
          view: this.d.getView(),
          screen: { x: e.x, y: e.y },
          marker: { id: hit.id, index: hit.idx, world: { x: hit.world.x, y: hit.world.y }, size: hit.size, rotation: hit.rotation },
          icon: { id: hit.type, iconPath: hit.icon.iconPath, x2IconPath: hit.icon.x2IconPath, width: hit.icon.width, height: hit.icon.height, anchorX: hit.icon.anchorX, anchorY: hit.icon.anchorY },
          originalEvent: e.originalEvent,
        };
        this.d.emitMarker('down', payload);
        this.pressTarget = { id: hit.id, idx: hit.idx };
        this.longPressed = false;
        if (ptrType === 'touch') {
          if (this.longPressTimer != null) clearTimeout(this.longPressTimer);
          this.longPressTimer = window.setTimeout(() => {
            this.longPressTimer = null;
            this.longPressed = true;
            const lpHit = this.d.hitTest(e.x, e.y, false);
            if (lpHit && this.pressTarget && lpHit.id === this.pressTarget.id) {
              const pl: MarkerEventData = {
                now: this.d.now(),
                view: this.d.getView(),
                screen: { x: e.x, y: e.y },
                marker: { id: lpHit.id, index: lpHit.idx, world: { x: lpHit.world.x, y: lpHit.world.y }, size: lpHit.size, rotation: lpHit.rotation },
                icon: { id: lpHit.type, iconPath: lpHit.icon.iconPath, x2IconPath: lpHit.icon.x2IconPath, width: lpHit.icon.width, height: lpHit.icon.height, anchorX: lpHit.icon.anchorX, anchorY: lpHit.icon.anchorY },
                originalEvent: e.originalEvent,
              };
              this.d.emitMarker('longpress', pl);
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
          const leavePayload: MarkerEventData = {
            now,
            view: this.d.getView(),
            screen: { x: e.x, y: e.y },
            marker: { id: prev.id || '', index: prev.idx ?? -1, world: { x: 0, y: 0 }, size: { w: 0, h: 0 } },
            icon: { id: prev.type, iconPath: '', width: 0, height: 0, anchorX: 0, anchorY: 0 },
            originalEvent: e.originalEvent,
          } as MarkerEventData;
          this.d.emitMarker('leave', leavePayload);
          this.d.setLastHover(null);
        }
        return;
      }
      const hit = this.d.hitTest(e.x, e.y, false);
      const prev = this.d.getLastHover();
      if (hit) {
        if (!prev || prev.id !== hit.id) {
          if (prev) {
            const leavePayload: MarkerEventData = {
              now,
              view: this.d.getView(),
              screen: { x: e.x, y: e.y },
              marker: { id: prev.id || '', index: prev.idx ?? -1, world: { x: 0, y: 0 }, size: { w: 0, h: 0 } },
              icon: { id: prev.type, iconPath: '', width: 0, height: 0, anchorX: 0, anchorY: 0 },
              originalEvent: e.originalEvent,
            } as MarkerEventData;
            this.d.emitMarker('leave', leavePayload);
          }
          const enterPayload: MarkerEventData = {
            now,
            view: this.d.getView(),
            screen: { x: e.x, y: e.y },
            marker: { id: hit.id, index: hit.idx, world: { x: hit.world.x, y: hit.world.y }, size: hit.size, rotation: hit.rotation },
            icon: { id: hit.type, iconPath: hit.icon.iconPath, x2IconPath: hit.icon.x2IconPath, width: hit.icon.width, height: hit.icon.height, anchorX: hit.icon.anchorX, anchorY: hit.icon.anchorY },
            originalEvent: e.originalEvent,
          };
          this.d.emitMarker('enter', enterPayload);
          this.d.setLastHover({ idx: hit.idx, type: hit.type, id: hit.id });
        }
      } else if (prev) {
        const leavePayload: MarkerEventData = {
          now,
          view: this.d.getView(),
          screen: { x: e.x, y: e.y },
          marker: { id: prev.id || '', index: prev.idx ?? -1, world: { x: 0, y: 0 }, size: { w: 0, h: 0 } },
          icon: { id: prev.type, iconPath: '', width: 0, height: 0, anchorX: 0, anchorY: 0 },
          originalEvent: e.originalEvent,
        } as MarkerEventData;
        this.d.emitMarker('leave', leavePayload);
        this.d.setLastHover(null);
      }
    });

    // pointerup: emit up and click if qualifies
    bus.on('pointerup').each((e) => {
      if (!e || e.x == null || e.y == null) return;
      const now = this.d.now();
      const moving = this.d.isMoving();
      const isClick = !!this.downAt && !this.movedSinceDown && !moving && now - this.downAt.t < 400;
      this.downAt = null;
      const upHit = this.d.hitTest(e.x, e.y, true);
      if (upHit) {
        const payload: MarkerEventData = {
          now,
          view: this.d.getView(),
          screen: { x: e.x, y: e.y },
          marker: { id: upHit.id, index: upHit.idx, world: { x: upHit.world.x, y: upHit.world.y }, size: upHit.size, rotation: upHit.rotation },
          icon: { id: upHit.type, iconPath: upHit.icon.iconPath, x2IconPath: upHit.icon.x2IconPath, width: upHit.icon.width, height: upHit.icon.height, anchorX: upHit.icon.anchorX, anchorY: upHit.icon.anchorY },
          originalEvent: e.originalEvent,
        };
        this.d.emitMarker('up', payload);
      }
      if (this.longPressTimer != null) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      if (!isClick) return;
      const hit = this.d.hitTest(e.x, e.y, true);
      if (hit) {
        const payload: MarkerEventData = {
          now,
          view: this.d.getView(),
          screen: { x: e.x, y: e.y },
          marker: { id: hit.id, index: hit.idx, world: { x: hit.world.x, y: hit.world.y }, size: hit.size, rotation: hit.rotation },
          icon: { id: hit.type, iconPath: hit.icon.iconPath, x2IconPath: hit.icon.x2IconPath, width: hit.icon.width, height: hit.icon.height, anchorX: hit.icon.anchorX, anchorY: hit.icon.anchorY },
          originalEvent: e.originalEvent,
        };
        this.d.emitMarker('click', payload);
      }
      this.pressTarget = null;
      if (this.longPressed) this.longPressed = false;
    });

    // Derive mouse events from pointer events; enrich with marker hits when idle
    const emitMouseOnce = (name: keyof EventMap, e: EventMap['pointermove'] | EventMap['pointerdown'] | EventMap['pointerup']) => {
      if (!('x' in e) || e.x == null || e.y == null) {
        this.d.events.emit(name as any, e as any);
        return;
      }
      const now = this.d.now();
      const moving = this.d.isMoving();
      const idle = !moving && now - this.d.getLastInteractAt() >= this.d.getHitTestDebounceMs();
      let payload: any = e;
      if (idle && name === 'mousemove') {
        try {
          const hits = this.d.computeHits(e.x, e.y);
          if (hits.length) {
            const mapped = hits.map((h) => ({
              marker: { id: h.id, index: h.idx, world: { x: h.world.x, y: h.world.y }, size: h.size, rotation: h.rotation },
              icon: { id: h.icon.id, iconPath: h.icon.iconPath, x2IconPath: h.icon.x2IconPath, width: h.icon.width, height: h.icon.height, anchorX: h.icon.anchorX, anchorY: h.icon.anchorY },
            }));
            payload = { ...(e as any), markers: mapped };
          }
        } catch {}
      }
      this.d.events.emit(name as any, payload);
    };

    bus.on('pointerdown').each((e) => {
      if ((e.originalEvent?.pointerType || '') === 'mouse') emitMouseOnce('mousedown', e);
    });
    bus.on('pointermove').each((e) => {
      if ((e.originalEvent?.pointerType || '') === 'mouse') emitMouseOnce('mousemove', e);
    });
    bus.on('pointerup').each((e) => {
      if ((e.originalEvent?.pointerType || '') === 'mouse') emitMouseOnce('mouseup', e);
    });
    bus.on('pointerup').each((e) => {
      if ((e.originalEvent?.pointerType || '') !== 'mouse') return;
      const now = this.d.now();
      const moving = this.d.isMoving();
      const isClick = !!this.downAt && !this.movedSinceDown && !moving && now - (this.downAt?.t || 0) < 400;
      if (!isClick) return;
      emitMouseOnce('click', e);
    });
  }
}
