import Layer from '../../adapters/layer';
import { notImplemented } from '../util';

export class ImageOverlay extends Layer {
	constructor(_url: string, _bounds: any, _options?: any) {
		super();
	}
	onAdd(): void {
		notImplemented('ImageOverlay.onAdd');
	}
}

export function imageOverlay(url: string, bounds: any, options?: any): ImageOverlay {
	return new ImageOverlay(url, bounds, options);
}
