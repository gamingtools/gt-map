import Layer from '../../adapters/layer';
import { notImplemented } from '../util';

export class SVGOverlay extends Layer {
	constructor(_el: SVGElement, _bounds: any, _options?: any) {
		super();
	}
	onAdd(): void {
		notImplemented('SVGOverlay.onAdd');
	}
}

export function svgOverlay(el: SVGElement, bounds: any, options?: any): SVGOverlay {
	return new SVGOverlay(el, bounds, options);
}
