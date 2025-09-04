import { notImplemented } from '../../../leaflet/util';

export class DivIcon {
	constructor(_options?: any) {}
	// Creating a DOM-based icon is not implemented in GPU-only renderer
	// Keeping class for parity; usage should throw if actual icon elements are requested
	createIcon(): HTMLElement {
		notImplemented('DivIcon.createIcon');
	}
}

export function divIcon(options?: any): DivIcon {
	return new DivIcon(options);
}
