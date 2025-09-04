import {
	LeafletMarkerFacade,
	type MarkerOptions,
	type MarkerMouseEvent,
	type MarkerEventName,
} from '../../../internal/adapters/marker';
import type { LeafletLatLng } from '../../../internal/adapters/util';
import { registerPublic, unregister } from '../../../internal/publicBridge';

export class Marker {
	private _impl: LeafletMarkerFacade;
	private _options?: MarkerOptions;
	private _map: any | null = null;

	constructor(latlng: LeafletLatLng, options?: MarkerOptions) {
		this._impl = new (LeafletMarkerFacade as any)(latlng, options);
		this._options = options ? { ...options } : undefined;
		try { registerPublic(this._impl as any, this as any); } catch {}
	}

	addTo(map: any): this {
		this._map = map;
		(map as any).__addLayer?.(this);
		return this;
	}
	remove(): this {
		if (this._map) {
			const m = this._map;
			this._map = null;
			(m as any).__removeLayer?.(this);
		}
		return this;
	}

	onAdd(map: any): void {
		this._impl.onAdd(map);
	}
	onRemove(map: any): void {
		this._impl.onRemove(map);
		try { unregister(this._impl as any, this as any); } catch {}
	}

	on(name: MarkerEventName, fn: (e: MarkerMouseEvent) => void): this {
		this._impl.on(name as any, fn as any);
		return this;
	}
	off(name: MarkerEventName, fn?: (e: MarkerMouseEvent) => void): this {
		this._impl.off(name as any, fn as any);
		return this;
	}

	setLatLng(latlng: LeafletLatLng): this {
		this._impl.setLatLng(latlng as any);
		return this;
	}
	getLatLng(): [number, number] {
		return this._impl.getLatLng();
	}
	setIcon(icon: any): this {
		this._impl.setIcon(icon as any);
		this._options = { ...(this._options || {}), icon } as any;
		return this;
	}
	getOptions(): MarkerOptions | undefined { return this._options ? { ...(this._options as any) } : undefined; }
}

export function marker(latlng: LeafletLatLng, options?: MarkerOptions): Marker {
	return new Marker(latlng, options);
}

// Public types
export type { MarkerOptions };
export type { LeafletLatLng };
export type { MarkerMouseEvent, MarkerEventName };
