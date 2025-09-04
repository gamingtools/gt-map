import { notImplemented } from '../../util';

import { Path } from './Path';

export class Circle extends Path {
	constructor(_latlng: any, _options?: any) {
		super();
	}
	onAdd(): void {
		notImplemented('Circle.onAdd');
	}
}

export class CircleMarker extends Circle {}
