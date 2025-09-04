export class Bounds { constructor(public min: any, public max: any) {} }
export function toBounds(min: any, max: any): Bounds { return new Bounds(min, max); }

