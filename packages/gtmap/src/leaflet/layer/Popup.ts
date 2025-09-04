import { notImplemented } from '../util';

import { DivOverlay } from './DivOverlay';

export class Popup extends DivOverlay {
	openOn(): this {
		notImplemented('Popup.openOn');
	}
	setLatLng(): this {
		notImplemented('Popup.setLatLng');
	}
}

export function popup(): Popup {
	return new Popup();
}
