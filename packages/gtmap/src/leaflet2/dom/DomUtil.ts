// Minimal DOM utilities used by controls/overlays
import type { Point } from '../geometry/Point';

export function create(tagName: string, className?: string, container?: HTMLElement): HTMLElement {
  const el = document.createElement(tagName);
  if (className) el.className = className;
  if (container) container.appendChild(el);
  return el;
}

export function addClass(el: Element, cls: string): void {
  (el as HTMLElement).classList.add(cls);
}
export function removeClass(el: Element, cls: string): void {
  (el as HTMLElement).classList.remove(cls);
}

export function setPosition(el: HTMLElement, pos: Point): void {
  (el.style as any).transform = `translate(${pos.x}px, ${pos.y}px)`;
}

