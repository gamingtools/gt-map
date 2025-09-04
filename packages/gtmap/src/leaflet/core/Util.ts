export function extend<T extends object, U extends object>(dest: T, src: U): T & U {
  return Object.assign(dest as any, src) as any;
}

export function bind<F extends (...args: any[]) => any>(fn: F, ctx: any, ...args: any[]): (...callArgs: any[]) => ReturnType<F> {
  return fn.bind(ctx, ...args);
}

let _stamp = 0;
export function stamp(obj: any): number { if (!obj.__stamp) obj.__stamp = ++_stamp; return obj.__stamp; }

export function setOptions<T extends object>(obj: T, options: Partial<T>): T { return Object.assign(obj, options); }

export const Util = { extend, bind, stamp, setOptions } as const;

export default Util;

