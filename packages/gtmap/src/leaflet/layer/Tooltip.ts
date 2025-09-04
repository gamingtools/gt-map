import { notImplemented } from '../util';

import { DivOverlay } from './DivOverlay';

export class Tooltip extends DivOverlay {
	setLatLng(): this {
		notImplemented('Tooltip.setLatLng');
	}
}

export function tooltip(): Tooltip {
	return new Tooltip();
}
