/**
 * Shared utility for extracting PointerMeta from DOM pointer/mouse events.
 */
import type { PointerMeta, InputDevice } from '../../api/events/maps';

/**
 * Extract the input device type from a raw DOM event.
 * Returns 'mouse' if the event lacks pointerType.
 */
export function getInputDevice(ev: PointerEvent | MouseEvent | undefined | null): InputDevice {
	if (!ev) return 'mouse';
	const ptrType = 'pointerType' in ev ? String((ev as PointerEvent).pointerType) : 'mouse';
	if (ptrType === 'mouse' || ptrType === 'touch' || ptrType === 'pen') return ptrType as InputDevice;
	return 'mouse';
}

/**
 * Build a full PointerMeta snapshot from an event wrapper that carries an
 * `originalEvent` (the raw DOM event produced by InputController).
 *
 * Returns `undefined` when no original event is available.
 */
export function extractPointerMeta(ev: { originalEvent?: PointerEvent | MouseEvent } | undefined): PointerMeta | undefined {
	const oe = ev?.originalEvent;
	if (!oe) return undefined;
	const has = <K extends keyof (PointerEvent & MouseEvent)>(k: K): boolean => k in (oe as PointerEvent | MouseEvent);
	const device = getInputDevice(oe);
	const isPrimary = has('isPrimary') ? !!(oe as PointerEvent).isPrimary : true;
	const buttons = has('buttons') ? (oe as PointerEvent).buttons : 0;
	const pointerId = has('pointerId') ? (oe as PointerEvent).pointerId : 0;
	const mods = {
		alt: 'altKey' in oe ? !!(oe as MouseEvent).altKey : false,
		ctrl: 'ctrlKey' in oe ? !!(oe as MouseEvent).ctrlKey : false,
		meta: 'metaKey' in oe ? !!(oe as MouseEvent).metaKey : false,
		shift: 'shiftKey' in oe ? !!(oe as MouseEvent).shiftKey : false,
	};
	return {
		device,
		isPrimary,
		buttons,
		pointerId,
		...(has('pressure') ? { pressure: (oe as PointerEvent).pressure } : {}),
		...(has('width') ? { width: (oe as PointerEvent).width } : {}),
		...(has('height') ? { height: (oe as PointerEvent).height } : {}),
		...(has('tiltX') ? { tiltX: (oe as PointerEvent).tiltX } : {}),
		...(has('tiltY') ? { tiltY: (oe as PointerEvent).tiltY } : {}),
		...((oe as PointerEvent & { twist?: number }).twist != null ? { twist: (oe as PointerEvent & { twist?: number }).twist } : {}),
		modifiers: mods,
	};
}
