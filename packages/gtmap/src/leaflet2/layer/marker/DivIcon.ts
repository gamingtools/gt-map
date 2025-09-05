// Leaflet 2.0-like DivIcon (TypeScript stub)
import { Icon, type IconOptions } from './Icon';
import type { Point } from '../../geometry/Point';

export type DivIconOptions = IconOptions & {
  html?: string | false;
  bgPos?: Point;
};

export class DivIcon extends Icon {
  options: DivIconOptions;
  constructor(options?: DivIconOptions) { super(options); this.options = { ...(options || {}) }; }
}
