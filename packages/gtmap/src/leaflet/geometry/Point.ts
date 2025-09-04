export class Point { constructor(public x: number, public y: number) {} }
export function toPoint(x: number | { x: number; y: number }, y?: number): Point {
  return typeof x === 'number' ? new Point(x, y || 0) : new Point(x.x, x.y);
}

