import type Impl from '../mapgl';
import * as Coords from '../coords';
import { DEBUG } from '../../debug';

import { toLngLat, toLeafletLatLng, type LeafletLatLng } from './util';
import Layer from './layer';

export type LeafletIcon = { __type: string; __def?: any };
export type IconOptions = { iconUrl: string; iconRetinaUrl?: string; iconSize?: [number, number]; iconAnchor?: [number, number] };
export type MarkerOptions = {
	icon?: LeafletIcon;
	title?: string;
	alt?: string;
	zIndexOffset?: number;
	draggable?: boolean;
	opacity?: number;
};

export function createIcon(opts: IconOptions): LeafletIcon {
	const type = `icon_${Math.random().toString(36).slice(2, 10)}`;
	const width = (opts.iconSize && opts.iconSize[0]) || 32;
	const height = (opts.iconSize && opts.iconSize[1]) || 32;
	const def = { iconPath: opts.iconUrl, x2IconPath: opts.iconRetinaUrl, width, height };
	return { __type: type, __def: def };
}

export class LeafletMarkerFacade extends Layer {
	private _latlng: { lng: number; lat: number };
	private _icon: LeafletIcon | null;
	private _impl: Impl | null = null;
	private _hitW = 32;
	private _hitH = 32;
	private _listeners = new Map<MarkerEventName, Set<(e: MarkerMouseEvent) => void>>();

	constructor(latlng: LeafletLatLng, options?: MarkerOptions) {
		super();
		this._latlng = toLngLat(latlng);
		this._icon = options?.icon || null;
		// Seed hit size from icon if available
		const def = (this._icon as any)?.__def as any | undefined;
		if (def && Number.isFinite(def.width) && Number.isFinite(def.height)) {
			this._hitW = def.width | 0;
			this._hitH = def.height | 0;
		}
	}

	onAdd(map: any): void {
		this._impl = (map as any).__impl ?? map;
		ensureIconDefs(this._impl as Impl, this._icon);
		scheduleFlush(this._impl as Impl, this);
	}
	onRemove(_map: any): void {
		if (this._impl) {
			removeMarker(this._impl, this);
			this._impl = null;
		}
	}
	setLatLng(latlng: LeafletLatLng): this {
		this._latlng = toLngLat(latlng);
		if (this._impl) scheduleFlush(this._impl, this);
		return this;
	}
	getLatLng(): [number, number] {
		return toLeafletLatLng(this._latlng.lng, this._latlng.lat);
	}
	setIcon(icon: LeafletIcon): this {
		this._icon = icon;
		if (this._impl) {
			ensureIconDefs(this._impl, this._icon);
			scheduleFlush(this._impl, this);
		}
		const def = (icon as any)?.__def as any | undefined;
		if (def && Number.isFinite(def.width) && Number.isFinite(def.height)) {
			this._hitW = def.width | 0;
			this._hitH = def.height | 0;
		}
		return this;
	}
	// internal getters
	__getLngLat(): { lng: number; lat: number } {
		return this._latlng;
	}
	__getType(): string {
		return (this._icon && this._icon.__type) || 'default';
	}
	__getSize(): { w: number; h: number } {
		return { w: this._hitW, h: this._hitH };
	}

	// Leaflet-like events API (typed)
	on(name: MarkerEventName, fn: (e: MarkerMouseEvent) => void): this {
		if (!this._listeners.has(name)) this._listeners.set(name, new Set());
		this._listeners.get(name)!.add(fn);
		return this;
	}
	off(name: MarkerEventName, fn?: (e: MarkerMouseEvent) => void): this {
		const s = this._listeners.get(name);
		if (!s) return this;
		if (!fn) {
			this._listeners.delete(name);
			return this;
		}
		s.delete(fn);
		return this;
	}
	__fire(name: MarkerEventName, payload: MarkerMouseEvent): void {
		const s = this._listeners.get(name);
		if (!s || s.size === 0) return;
		for (const cb of Array.from(s)) {
			try {
				cb(payload);
			} catch {}
		}
	}
}

// Simple global registry per map instance
const markersByMap = new WeakMap<Impl, Set<LeafletMarkerFacade>>();
type GridIndex = { cell: number; grid: Map<string, LeafletMarkerFacade[]> };
const gridByMap = new WeakMap<Impl, GridIndex>();
const pendingFlushByMap = new WeakMap<Impl, any>();
const eventsHooked = new WeakSet<Impl>();
const hoverByMap = new WeakMap<Impl, LeafletMarkerFacade | null>();
const lastClickByMap = new WeakMap<Impl, { t: number; m: LeafletMarkerFacade | null; x: number; y: number }>();

function getSet(map: Impl): Set<LeafletMarkerFacade> {
	let s = markersByMap.get(map);
	if (!s) {
		s = new Set();
		markersByMap.set(map, s);
	}
	return s;
}

function ensureIconDefs(map: Impl, icon: LeafletIcon | null) {
	if (icon && icon.__def) {
		const defs: any = {};
		defs[icon.__type] = icon.__def;
		(map as any).setIconDefs(defs);
		// mark as loaded
		(icon as any).__def = null;
	}
}

function scheduleFlush(map: Impl, recent?: LeafletMarkerFacade) {
    const set = getSet(map);
    if (recent) set.add(recent);
    hookMapPointerEvents(map);
    if (pendingFlushByMap.get(map)) return;
    const timer = setTimeout(() => {
        pendingFlushByMap.delete(map);
        if (DEBUG) {
            try { console.debug('[marker.flush.schedule]', { count: getSet(map).size }); } catch {}
        }
        flushNow(map);
    }, 0);
    pendingFlushByMap.set(map, timer);
}

function removeMarker(map: Impl, marker: LeafletMarkerFacade) {
	const set = getSet(map);
	set.delete(marker);
	scheduleFlush(map);
}

function flushNow(map: Impl) {
    const set = getSet(map);
    const arr: any[] = [];
    for (const m of set) arr.push({ lng: m.__getLngLat().lng, lat: m.__getLngLat().lat, type: m.__getType() });
    if (DEBUG) { try { console.debug('[marker.flush.now]', { count: arr.length }); } catch {} }
    (map as any).setMarkers(arr);
    rebuildIndex(map);
}

function hookMapPointerEvents(map: Impl) {
	if (eventsHooked.has(map)) return;
	eventsHooked.add(map);
	try {
		(map as any).events.on('pointermove').each((e: any) => handlePointerMove(map, e));
		(map as any).events.on('pointerdown').each((e: any) => handlePointerDown(map, e));
		(map as any).events.on('pointerup').each((e: any) => handlePointerUp(map, e));
		// Context menu from DOM (right click / long press)
		const container: HTMLElement | null = (map as any).container as HTMLElement;
		if (container && container.addEventListener) {
			const onCtx = (ev: MouseEvent) => {
				try {
					ev.preventDefault();
				} catch {}
				const rect = container.getBoundingClientRect();
				const x = ev.clientX - rect.left;
				const y = ev.clientY - rect.top;
				handleContextMenu(map, { x, y, view: (map as any)._view?.() || {}, originalEvent: ev } as any);
			};
			container.addEventListener('contextmenu', onCtx as any);
		}
	} catch {}
}

type MapPointerEvent = { x: number; y: number; view: any; originalEvent?: PointerEvent | MouseEvent };

export type MarkerEventName = 'click' | 'dblclick' | 'mousedown' | 'mouseup' | 'mouseover' | 'mouseout' | 'mousemove' | 'contextmenu';

export type MarkerMouseEvent = {
	// Event meta
	type: MarkerEventName;
	// Targets
	target: LeafletMarkerFacade;
	sourceTarget: LeafletMarkerFacade;
	propagatedFrom?: undefined;
	layer?: undefined;
	// Positions (Leaflet-like names; Pixel-CRS lat=Y, lng=X)
	latlng: { lat: number; lng: number };
	layerPoint: { x: number; y: number };
	containerPoint: { x: number; y: number };
	// Original DOM event when available
	originalEvent?: PointerEvent | MouseEvent;
};

function buildMouseEvent(m: LeafletMarkerFacade, type: MarkerEventName, e: MapPointerEvent): MarkerMouseEvent {
	const latlngObj = { lat: m.__getLngLat().lat, lng: m.__getLngLat().lng };
	const containerPoint = { x: e.x, y: e.y };
	const layerPoint = { x: e.x, y: e.y };
	return {
		type,
		target: m,
		sourceTarget: m,
		propagatedFrom: undefined,
		layer: undefined,
		latlng: latlngObj,
		layerPoint,
		containerPoint,
		originalEvent: e.originalEvent,
	};
}

function handlePointerMove(map: Impl, e: MapPointerEvent) {
	const over = hitTest(map, e.x, e.y);
	const prev = hoverByMap.get(map) || null;
	if (over !== prev) {
		if (prev) prev.__fire('mouseout', buildMouseEvent(prev, 'mouseout', e));
		if (over) over.__fire('mouseover', buildMouseEvent(over, 'mouseover', e));
		hoverByMap.set(map, over || null);
	}
	if (over) over.__fire('mousemove', buildMouseEvent(over, 'mousemove', e));
}

function handlePointerDown(map: Impl, e: MapPointerEvent) {
	const over = hitTest(map, e.x, e.y, true);
	if (DEBUG) {
		try { console.debug('[marker.pointerdown]', { x: e.x, y: e.y, over: over ? summarizeMarker(over) : null }); } catch {}
	}
	if (over) over.__fire('mousedown', buildMouseEvent(over, 'mousedown', e));
}
function handlePointerUp(map: Impl, e: MapPointerEvent) {
	const over = hitTest(map, e.x, e.y, true);
	if (over) {
		if (DEBUG) { try { console.debug('[marker.pointerup]', { x: e.x, y: e.y, over: summarizeMarker(over) }); } catch {} }
		over.__fire('mouseup', buildMouseEvent(over, 'mouseup', e));
		over.__fire('click', buildMouseEvent(over, 'click', e));
		// dblclick detection
		const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
		const last = lastClickByMap.get(map);
		if (last && last.m === over && now - last.t <= 320) {
			// within time window; also ensure within small radius (6px)
			const dx = e.x - last.x;
			const dy = e.y - last.y;
			if (dx * dx + dy * dy <= 36) {
				if (DEBUG) { try { console.debug('[marker.dblclick]', { last, now, dx, dy }); } catch {} }
				over.__fire('dblclick', buildMouseEvent(over, 'dblclick', e));
			}
		}
		lastClickByMap.set(map, { t: now, m: over, x: e.x, y: e.y });
	}
}

function handleContextMenu(map: Impl, e: MapPointerEvent) {
	const over = hitTest(map, e.x, e.y, true);
	if (DEBUG) { try { console.debug('[marker.contextmenu]', { x: e.x, y: e.y, over: over ? summarizeMarker(over) : null }); } catch {} }
	if (over) over.__fire('contextmenu', buildMouseEvent(over, 'contextmenu', e));
}

function rebuildIndex(map: Impl) {
    const set = markersByMap.get(map);
    if (!set || set.size === 0) {
        gridByMap.delete(map);
        return;
    }
    const cell = 256; // native px
    const grid = new Map<string, LeafletMarkerFacade[]>();
    for (const m of Array.from(set)) {
        const p = m.__getLngLat();
        const cx = Math.floor((p.lng as number) / cell);
        const cy = Math.floor((p.lat as number) / cell);
        const key = `${cx},${cy}`;
        let arr = grid.get(key);
        if (!arr) {
            arr = [];
            grid.set(key, arr);
        }
        arr.push(m);
    }
    gridByMap.set(map, { cell, grid });
    if (DEBUG) {
        try {
            const keys = Array.from(grid.keys());
            console.debug('[marker.index.rebuild]', { markers: set.size, cells: keys.length, sample: keys.slice(0, 8) });
        } catch {}
    }
}

function summarizeMarker(m: LeafletMarkerFacade) {
	try {
		return { type: m.__getType(), lng: m.__getLngLat().lng, lat: m.__getLngLat().lat, size: m.__getSize() };
	} catch {
		return { type: 'unknown' } as any;
	}
}

function hitTest(map: Impl, xCSS: number, yCSS: number, log?: boolean): LeafletMarkerFacade | null {
	const idx = gridByMap.get(map);
	const rect = (map as any).container.getBoundingClientRect();
	const widthCSS = rect.width;
	const heightCSS = rect.height;
	const z = (map as any).zoom as number;
	const imageMaxZ = (map as any)._sourceMaxZoom || (map as any).maxZoom;
	const center = (map as any).center as { lng: number; lat: number };
	let candidates: LeafletMarkerFacade[] = [];
	if (idx) {
		const cell = idx.cell;
		// Convert pointer CSS to world to locate nearby cells
		const pw = Coords.cssToWorld({ x: xCSS, y: yCSS }, z, center as any, { x: widthCSS, y: heightCSS }, imageMaxZ as number);
		const cx = Math.floor(pw.x / cell);
		const cy = Math.floor(pw.y / cell);
		if (DEBUG && log) {
			try { console.debug('[marker.hitTest.index]', { xCSS, yCSS, z, imageMaxZ, center, viewport: { widthCSS, heightCSS }, world: pw, gridCell: { cx, cy } }); } catch {}
		}
    const R = 2; // search a slightly larger neighborhood to be robust
    for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
            const key = `${cx + dx},${cy + dy}`;
            const arr = idx.grid.get(key);
            if (arr && arr.length) candidates = candidates.concat(arr);
        }
    }
	} else {
		// Fallback: linear scan if no index
		const set = getSet(map);
		candidates = Array.from(set);
	}
    if (DEBUG && log) { try { console.debug('[marker.hitTest.candidates]', { count: candidates.length }); } catch {} }
    if (candidates.length === 0) {
        // Fallback: try linear scan to avoid grid mismatch issues
        try {
            const set = getSet(map);
            candidates = Array.from(set);
            if (DEBUG && log) console.debug('[marker.hitTest.fallbackLinear]', { count: candidates.length });
        } catch {}
    }
    // Compute TL in level space with the same rounding as the renderer/icons to minimize subpixel drift
    const { zInt, scale } = Coords.zParts(z);
    const s0 = Coords.sFor(imageMaxZ as number, zInt);
    const centerLevel = { x: center.lng / s0, y: center.lat / s0 };
    let tlLevel = Coords.tlLevelFor(centerLevel, z, { x: widthCSS, y: heightCSS });
    try {
        const canvas: HTMLCanvasElement | null = (map as any).canvas || null;
        const dpr = canvas ? Math.max(1, (canvas as any).width / Math.max(1, widthCSS)) : (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1);
        tlLevel = { x: Coords.snapLevelToDevice(tlLevel.x, scale, dpr), y: Coords.snapLevelToDevice(tlLevel.y, scale, dpr) };
    } catch {}
    let hit: LeafletMarkerFacade | null = null;
    for (const m of candidates) {
        const p = m.__getLngLat();
        const w = m.__getSize().w || 32;
        const h = m.__getSize().h || 32;
        const lvl = { x: (p.lng as number) / s0, y: (p.lat as number) / s0 };
        const css = { x: (lvl.x - tlLevel.x) * scale, y: (lvl.y - tlLevel.y) * scale };
        const left = css.x - w / 2;
        const top = css.y - h / 2;
		const contains = xCSS >= left && xCSS <= left + w && yCSS >= top && yCSS <= top + h;
		if (DEBUG && log) {
			try {
				console.debug('[marker.hitTest.test]', {
					marker: { type: m.__getType(), lng: p.lng, lat: p.lat, w, h },
					css,
					rect: { left, top, w, h },
					pointer: { xCSS, yCSS },
					contains,
				});
			} catch {}
		}
		if (contains) hit = m;
	}
	if (DEBUG && log) { try { console.debug('[marker.hitTest.result]', { hit: hit ? summarizeMarker(hit) : null }); } catch {} }
	return hit;
}
