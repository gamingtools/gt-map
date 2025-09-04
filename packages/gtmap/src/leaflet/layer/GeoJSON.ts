import { notImplemented } from '../util';
import Layer from '../../adapters/layer';

export class GeoJSON extends Layer {
	constructor(_data?: any, _options?: any) {
		super();
	}
	addData(): this {
		notImplemented('GeoJSON.addData');
	}
}

export function geoJSON(data?: any, options?: any): GeoJSON {
	return new GeoJSON(data, options);
}
export function geoJson(data?: any, options?: any): GeoJSON {
	return new GeoJSON(data, options);
}
