import type { GTMap } from './Map';
import type { MarkerEventData } from './types';

export type MarkerEventName = 'markerenter' | 'markerleave' | 'markerclick';

export function onMarker(
  map: GTMap,
  markerId: string,
  event: MarkerEventName,
  handler: (e: MarkerEventData) => void
): () => void {
  const off = map.events.on(event).each((e) => {
    if (e?.marker?.id === markerId) handler(e);
  });
  return off;
}

export function onMarkerData(
  map: GTMap,
  event: MarkerEventName,
  predicate: (data: any | null | undefined) => boolean,
  handler: (e: MarkerEventData) => void
): () => void {
  const off = map.events.on(event).each((e) => {
    if (predicate(e?.marker?.data)) handler(e);
  });
  return off;
}

export function createMarkerEventProxy(map: GTMap, markerId: string) {
  return {
    on(event: MarkerEventName, handler: (e: MarkerEventData) => void) {
      return onMarker(map, markerId, event, handler);
    },
  };
}

