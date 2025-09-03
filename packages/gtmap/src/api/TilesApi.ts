import type Impl from '../mapgl';

export interface TilesApi {
  setOptions(opts: { maxTiles?: number; maxInflightLoads?: number; interactionIdleMs?: number }): void;
  setPrefetch(opts: { enabled?: boolean; baselineLevel?: number }): void;
  setScreenCache(enabled: boolean): void;
  clear(): void;
}

export function createTilesApi(impl: Impl): TilesApi {
  const api: TilesApi = {
    setOptions(opts) { (impl as any).setLoaderOptions(opts); },
    setPrefetch(opts) { (impl as any).setPrefetchOptions(opts); },
    setScreenCache(enabled) { (impl as any).setScreenCacheEnabled(enabled); },
    clear() { (impl as any).clearCache?.(); },
  };
  return Object.freeze(api);
}

