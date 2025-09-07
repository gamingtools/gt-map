import { DEBUG } from '../../debug';

export function safe<T>(fn: () => T, tag?: string): T | undefined {
  try {
    return fn();
  } catch (error) {
    if (DEBUG) {
      try { console.warn(tag ? `[safe:${tag}]` : '[safe]', error); } catch { /* noop */ }
    }
    return undefined;
  }
}

export async function safeAsync<T>(promise: Promise<T>, tag?: string): Promise<T | undefined> {
  try {
    return await promise;
  } catch (error) {
    if (DEBUG) {
      try { console.warn(tag ? `[safeAsync:${tag}]` : '[safeAsync]', error); } catch { /* noop */ }
    }
    return undefined;
  }
}

