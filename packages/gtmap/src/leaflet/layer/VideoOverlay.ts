import Layer from '../../adapters/layer';
import { notImplemented } from '../util';

export class VideoOverlay extends Layer {
	constructor(_urls: string | string[], _bounds: any, _options?: any) {
		super();
	}
	onAdd(): void {
		notImplemented('VideoOverlay.onAdd');
	}
}

export function videoOverlay(urls: string | string[], bounds: any, options?: any): VideoOverlay {
	return new VideoOverlay(urls, bounds, options);
}
