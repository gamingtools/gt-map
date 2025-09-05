// Leaflet 2.0-like Icon (TypeScript stub)
import type { Point } from '../../geometry/Point';

export type IconOptions = {
  iconUrl?: string;
  iconRetinaUrl?: string;
  iconSize?: [number, number] | Point;
  iconAnchor?: [number, number] | Point;
  shadowUrl?: string;
  shadowRetinaUrl?: string;
  shadowSize?: [number, number] | Point;
  shadowAnchor?: [number, number] | Point;
  className?: string;
};

export class Icon {
  options: IconOptions;
  constructor(options?: IconOptions) { this.options = { ...(options || {}) }; }
}
