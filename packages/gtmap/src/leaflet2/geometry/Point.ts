// Leaflet-like Point class (minimal)

export class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; }
  clone(): Point { return new Point(this.x, this.y); }
  add(p: Point): Point { return new Point(this.x + p.x, this.y + p.y); }
  subtract(p: Point): Point { return new Point(this.x - p.x, this.y - p.y); }
  scaleBy(k: number): Point { return new Point(this.x * k, this.y * k); }
  equals(p: Point): boolean { return this.x === p.x && this.y === p.y; }
}

export function point(x: number, y: number): Point { return new Point(x, y); }

