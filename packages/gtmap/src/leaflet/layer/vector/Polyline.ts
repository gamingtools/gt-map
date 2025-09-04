import { notImplemented } from '../../util';

import { Path } from './Path';

export class Polyline extends Path {
	constructor(_latlngs: any, _options?: any) {
		super();
	}
	onAdd(): void {
		notImplemented('Polyline.onAdd');
	}
}
