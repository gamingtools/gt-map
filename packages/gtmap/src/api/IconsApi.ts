import type Impl from '../mapgl';

export type MarkerInput = { lng: number; lat: number; type: string; size?: number };
export type IconDefs = Record<string, { iconPath: string; x2IconPath?: string; width: number; height: number }>;

export interface IconsApi {
  setDefs(defs: IconDefs): Promise<void>;
  setMarkers(markers: MarkerInput[]): void;
  clear(): void;
}

export function createIconsApi(impl: Impl): IconsApi {
  const api: IconsApi = {
    async setDefs(defs: IconDefs) { await (impl as any).setIconDefs(defs); },
    setMarkers(markers: MarkerInput[]) { (impl as any).setMarkers(markers); },
    clear() { (impl as any).setMarkers([]); },
  };
  return Object.freeze(api);
}

