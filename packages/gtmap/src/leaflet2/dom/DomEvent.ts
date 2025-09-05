// Minimal DOM event helpers

export function on(el: EventTarget, type: string, fn: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
  el.addEventListener(type, fn as any, options as any);
}
export function off(el: EventTarget, type: string, fn: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
  el.removeEventListener(type, fn as any, options as any);
}
export function stopPropagation(e: Event): void { e.stopPropagation(); }
export function preventDefault(e: Event): void { e.preventDefault(); }

