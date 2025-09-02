// Chainable event streams with basic operators. Internal scaffolding.

export type Unsubscribe = () => void;

export type Listener<T> = (value: T) => void;

export class EventStream<T> {
  private _subscribe: (next: Listener<T>) => Unsubscribe;

  constructor(subscribe: (next: Listener<T>) => Unsubscribe) {
    this._subscribe = subscribe;
  }

  each(fn: (value: T) => void): Unsubscribe {
    return this._subscribe(fn);
  }

  map<U>(fn: (value: T) => U): EventStream<U> {
    return new EventStream<U>((next) => this.each((v) => next(fn(v))));
  }

  tap(fn: (value: T) => void): EventStream<T> {
    return new EventStream<T>((next) => this.each((v) => { fn(v); next(v); }));
  }

  filter(fn: (value: T) => boolean): EventStream<T> {
    return new EventStream<T>((next) => this.each((v) => { if (fn(v)) next(v); }));
  }

  throttle(ms: number): EventStream<T> {
    let last = 0;
    return new EventStream<T>((next) => this.each((v) => {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      if (now - last >= ms) { last = now; next(v); }
    }));
  }

  debounce(ms: number): EventStream<T> {
    let timer: number | null = null;
    let lastVal: T | undefined;
    return new EventStream<T>((next) => this.each((v) => {
      lastVal = v;
      if (timer != null) clearTimeout(timer as any);
      timer = setTimeout(() => { timer = null; if (lastVal !== undefined) next(lastVal as T); }, ms) as any;
    }));
  }

  once(): EventStream<T> {
    return new EventStream<T>((next) => {
      let unsub: Unsubscribe | null = null;
      unsub = this.each((v) => { if (unsub) { unsub(); unsub = null; } next(v); });
      return () => { if (unsub) { unsub(); unsub = null; } };
    });
  }

  take(n: number): EventStream<T> {
    return new EventStream<T>((next) => {
      let count = 0;
      const unsub = this.each((v) => {
        if (count++ < n) next(v);
        if (count >= n) unsub();
      });
      return unsub;
    });
  }

  takeUntil<U>(_other: EventStream<U>): EventStream<T> {
    const other = _other.once();
    return new EventStream<T>((next) => {
      let stop = false;
      const offStop = other.each(() => { stop = true; off(); });
      const off = this.each((v) => { if (!stop) next(v); });
      return () => { off(); offStop(); };
    });
  }

  first(): Promise<T> { return new Promise((resolve) => this.once().each(resolve)); }

  toAsyncIterator(): AsyncIterableIterator<T> {
    const queue: T[] = [];
    const resolvers: Array<(v: IteratorResult<T>) => void> = [];
    const push = (v: T) => {
      if (resolvers.length) resolvers.shift()!({ value: v, done: false });
      else queue.push(v);
    };
    const off = this.each(push);
    const iter: AsyncIterableIterator<T> = {
      [Symbol.asyncIterator]() { return this; },
      next: () => new Promise<IteratorResult<T>>((resolve) => {
        if (queue.length) resolve({ value: queue.shift() as T, done: false });
        else resolvers.push(resolve);
      }),
      return: () => { off(); return Promise.resolve({ value: undefined as any, done: true }); },
      throw: (e?: any) => { off(); return Promise.reject(e); },
    } as any;
    return iter;
  }

  static merge<T>(streams: Array<EventStream<T>>): EventStream<T> {
    return new EventStream<T>((next) => {
      const unsubs = streams.map((s) => s.each(next));
      return () => { for (const u of unsubs) u(); };
    });
  }
}

export type EventName = string;

export class EventBus {
  private listeners = new Map<EventName, Set<Listener<any>>>();

  on<T = any>(name: EventName): EventStream<T> {
    return new EventStream<T>((next) => {
      let set = this.listeners.get(name);
      if (!set) { set = new Set(); this.listeners.set(name, set); }
      set.add(next as Listener<any>);
      return () => { set!.delete(next as Listener<any>); };
    });
  }

  emit<T = any>(name: EventName, payload: T): void {
    const set = this.listeners.get(name);
    if (!set || set.size === 0) return;
    for (const fn of Array.from(set)) { try { (fn as Listener<T>)(payload); } catch {} }
  }

  when<T = any>(name: EventName): Promise<T> { return this.on<T>(name).first(); }
}

