export class Evented {
  on(): this { return this; }
  off(): this { return this; }
  fire(): this { return this; }
}

export const Events = {} as const;

