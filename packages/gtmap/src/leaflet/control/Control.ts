import type { Map as LeafletMap } from '../map/Map';
import { notImplemented } from '../util';

export type ControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

function positionToStyle(pos: ControlPosition): Partial<CSSStyleDeclaration> {
  const common: Partial<CSSStyleDeclaration> = { position: 'absolute', zIndex: '11' };
  switch (pos) {
    case 'top-left':
      return { ...common, left: '8px', top: '8px' };
    case 'top-right':
      return { ...common, right: '8px', top: '8px' };
    case 'bottom-left':
      return { ...common, left: '8px', bottom: '8px' };
    case 'bottom-right':
    default:
      return { ...common, right: '8px', bottom: '8px' };
  }
}

export abstract class Control {
  protected _map: LeafletMap | null = null;
  protected _el: HTMLDivElement | null = null;
  protected _position: ControlPosition;

  constructor(position: ControlPosition = 'top-right') {
    this._position = position;
  }

  addTo(map: LeafletMap): this {
    this._map = map;
    const container = (map as any).__impl?.container as HTMLElement | undefined;
    if (!container) return this;
    const el = document.createElement('div');
    this._el = el;
    const style = positionToStyle(this._position);
    Object.assign(el.style, style);
    this.onAdd(el);
    container.appendChild(el);
    return this;
  }

  remove(): this {
    if (this._el && this._el.parentElement) {
      try {
        this._el.parentElement.removeChild(this._el);
      } catch {}
    }
    this.onRemove();
    this._el = null;
    this._map = null;
    return this;
  }

  protected abstract onAdd(el: HTMLDivElement): void;
  protected abstract onRemove(): void;
}

// Zoom control
export type ZoomControlOptions = { position?: ControlPosition; step?: number };

export class ZoomControl extends Control {
  private _step: number;
  private _onZoomIn?: () => void;
  private _onZoomOut?: () => void;

  constructor(options?: ZoomControlOptions) {
    super(options?.position ?? 'top-left');
    this._step = typeof options?.step === 'number' ? options.step : 1;
  }

  protected onAdd(el: HTMLDivElement): void {
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.gap = '6px';
    el.style.background = 'rgba(255,255,255,0.9)';
    el.style.border = '1px solid #bbb';
    el.style.borderRadius = '4px';
    el.style.padding = '6px';
    el.style.color = '#222';
    el.style.font = '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif';

    const mkBtn = (label: string) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.padding = '4px 8px';
      b.style.cursor = 'pointer';
      b.style.border = '1px solid #bbb';
      b.style.borderRadius = '3px';
      b.style.background = '#fff';
      b.style.color = '#222';
      return b;
    };

    const inBtn = mkBtn('+');
    const outBtn = mkBtn('−');
    el.appendChild(inBtn);
    el.appendChild(outBtn);

    const map = this._map!;
    const onIn = () => map.zoomIn(this._step);
    const onOut = () => map.zoomOut(this._step);
    inBtn.addEventListener('click', onIn);
    outBtn.addEventListener('click', onOut);
    this._onZoomIn = onIn;
    this._onZoomOut = onOut;
  }

  protected onRemove(): void {
    // Listeners are GC'ed with element removal
    this._onZoomIn = undefined;
    this._onZoomOut = undefined;
  }
}

// Attribution control
export type AttributionControlOptions = { position?: ControlPosition; text?: string };

export class AttributionControl extends Control {
  private _text: string;
  constructor(options?: AttributionControlOptions) {
    super(options?.position ?? 'bottom-right');
    this._text = options?.text ?? '';
  }
  protected onAdd(el: HTMLDivElement): void {
    el.style.background = 'rgba(255,255,255,0.85)';
    el.style.border = '1px solid #bbb';
    el.style.borderRadius = '4px';
    el.style.padding = '4px 8px';
    el.style.color = '#222';
    el.style.font = '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif';
    el.textContent = this._text;
  }
  protected onRemove(): void {}
}

// Factory
export function control() {
  return {
    zoom(options?: ZoomControlOptions) {
      return new ZoomControl(options);
    },
    attribution(options?: AttributionControlOptions) {
      return new AttributionControl(options);
    },
    scale(_options?: any) {
      notImplemented('control.scale');
    },
    layers(_base?: any, _over?: any, _options?: any) {
      notImplemented('control.layers');
    },
  } as const;
}

export type { ZoomControlOptions, AttributionControlOptions };
