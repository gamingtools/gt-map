// Minimal Leaflet-like utilities used by plugins and classes

export function extend<T extends object, S extends object>(dest: T, src: S): T & S {
  for (const k in src) {
    // @ts-expect-error index
    (dest as any)[k] = (src as any)[k];
  }
  return dest as T & S;
}

export function setOptions<T extends object, O extends object>(obj: T & { options?: any }, options?: O, defaults?: Partial<O>): T & { options: O } {
  const base = (obj.options || {}) as any;
  if (defaults) extend(base, defaults as any);
  if (options) extend(base, options as any);
  (obj as any).options = base;
  return obj as any;
}

let _lastId = 0;
const _stampKey = Symbol('leaflet:stamp');
export function stamp(obj: object): number {
  // @ts-expect-error symbol attach
  if ((obj as any)[_stampKey] != null) return (obj as any)[_stampKey];
  // @ts-expect-error symbol attach
  (obj as any)[_stampKey] = ++_lastId;
  // @ts-expect-error symbol attach
  return (obj as any)[_stampKey];
}

export function bind<F extends (...args: any[]) => any>(fn: F, ctx: any, ...args: any[]): (...a: Parameters<F>) => ReturnType<F> {
  return function bound(this: any, ...rest: any[]) {
    return fn.apply(ctx, args.length ? args.concat(rest) : rest);
  } as any;
}

