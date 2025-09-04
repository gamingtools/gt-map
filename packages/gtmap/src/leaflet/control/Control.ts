import { notImplemented } from '../util';

export class Control {
  addTo(): this { notImplemented('Control.addTo'); }
  remove(): this { notImplemented('Control.remove'); }
}

export function control() {
  return {
    zoom(_options?: any) { notImplemented('control.zoom'); },
    attribution(_options?: any) { notImplemented('control.attribution'); },
    scale(_options?: any) { notImplemented('control.scale'); },
    layers(_base?: any, _over?: any, _options?: any) { notImplemented('control.layers'); },
  } as const;
}

