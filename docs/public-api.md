# Public API (Facades)

This document describes the stable, public-facing API you should use when embedding the map. Internal classes (renderers, pipelines, etc.) are not part of the public surface and may change.

Recommended usage
- Prefer the Leaflet‑compatible facade `GT.L` for most apps — it offers the familiar Map/TileLayer/Marker APIs and is our primary public surface.
- Use the native facades (`GTMap` class or `createMap()` → `MapApi`) when you want direct access to performance tunables and modern features.

## Overview

There are two entry points:

- Leaflet‑compatible: `GT.L` (primary)
- Native: `GTMap` class facade or `createMap()` → `MapApi`

Internally both build the implementation and attach small, focused facades (e.g., `icons`, `tiles`) to keep the surface minimal and stable.

## Imports

```ts
import GTMap, { createMap, type MapApi, GT } from '@gtmap';

## Quick Start (Leaflet‑compatible, recommended)

```ts
const map = GT.L.map(containerEl, {
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  minZoom: 1,
  maxZoom: 19,
  wrapX: true,
  zoomOutCenterBias: true,
});

GT.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

const icon = GT.L.icon({ iconUrl: '/marker.png', iconRetinaUrl: '/marker@2x.png', iconSize: [25, 41] });
GT.L.marker([0, 0], { icon }).addTo(map);

map.setView([0, 0], 2);
```
```

## Quick Start (native facade class)

```ts
const map = new GTMap(containerEl, {
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  minZoom: 1,
  maxZoom: 19,
  wrapX: true,
  // Finite-world zoom bias (true=default 0.15, false=off, or a number 0..1)
  zoomOutCenterBias: true,
  // Recommended tunables (optional)
  maxTiles: 512,
  maxInflightLoads: 8,
  interactionIdleMs: 160,
  prefetch: { enabled: true, baselineLevel: 2 },
  screenCache: true,
  wheelSpeedCtrl: 0.4,
});

// Icons
await map.icons.setDefs(iconDefs);
map.icons.setMarkers(markers);

// Tiles/loader/prefetch controls
map.tiles.setOptions({ maxTiles: 768, maxInflightLoads: 12 });
map.tiles.setPrefetch({ enabled: true, baselineLevel: 1 });
map.tiles.setScreenCache(true);

// Inertia + zoom behavior
map.setInertiaOptions({ inertia: true, inertiaDeceleration: 3200, easeLinearity: 0.2 });
map.setZoomOutCenterBias(0.25); // or true/false

// Core interactions
map.setCenter(0, 0);
map.setZoom(3);
map.setWheelSpeed(1.0);
map.setWheelCtrlSpeed(0.4);
map.setAnchorMode('pointer'); // or 'center'

// Lifecycle
map.setActive(false, { releaseGL: true }); // suspend + free GPU
map.setActive(true);
// map.destroy();
```

## Quick Start (native factory + interface)

Prefer this for the smallest stable interface:

```ts
const map: MapApi = createMap(containerEl, { /* same options as above */ });
await map.icons.setDefs(iconDefs);
map.icons.setMarkers(markers);
map.tiles.setPrefetch({ enabled: false });
```

## Facades (native)

### `icons: IconsApi`
- `setDefs(defs: IconDefs): Promise<void>` — load icon textures; picks x2 variant on HiDPI.
- `setMarkers(markers: MarkerInput[])` — set marker array.
- `clear()` — remove all markers.

Types:
- `IconDefs`: `{ [type: string]: { iconPath: string; x2IconPath?: string; width: number; height: number } }`
- `MarkerInput`: `{ lng: number; lat: number; type: string; size?: number }`

Notes:
- Rendering batches per icon type to minimize texture binds.
- For very large marker sets, consider future instancing/atlas features.

### `tiles: TilesApi`
- `setOptions({ maxTiles?, maxInflightLoads?, interactionIdleMs? })`
- `setPrefetch({ enabled?, baselineLevel? })`
- `setScreenCache(enabled: boolean)` — toggle screen-space cache.
- `clear()` — clear GPU cache and queues.

## Core methods (selected)
- `setCenter(lng, lat)`
- `setZoom(z)`
- `setTileSource({ url?, tileSize?, minZoom?, maxZoom?, wrapX?, clearCache? })`
- `setEaseOptions({ easeBaseMs?, easePerUnitMs? })` — zoom easing timing.
- `setInertiaOptions({ inertia?, inertiaDeceleration?, inertiaMaxSpeed?, easeLinearity? })`
- `setZoomOutCenterBias(v: number | boolean)` — when zooming out, bias to prior visual center. `true` = default (0.15), `false` = off, or a number 0..1.
- `setWheelSpeed(v)` and `setWheelCtrlSpeed(v)`
- `setAnchorMode('pointer' | 'center')`
- `setActive(active, { releaseGL? })` — suspend/resume; optional GL release.
- `events` — chainable event streams (`on/when`, `filter/map/throttle/debounce/once/take/takeUntil/each`, `toAsyncIterator`) with payloads `{ view }` or `{ x,y,view }`.

## Options (MapOptions)
- `tileUrl`, `tileSize`, `minZoom`, `maxZoom`, `wrapX`, `freePan`, `center`, `zoom`
- `zoomOutCenterBias?: number | boolean` — `false` disables, `true` uses default, or supply 0..1
- Recommended tunables:
  - `maxTiles?: number`
  - `maxInflightLoads?: number`
  - `interactionIdleMs?: number`
  - `prefetch?: { enabled?: boolean; baselineLevel?: number }`
  - `screenCache?: boolean`
  - `wheelSpeedCtrl?: number`

## Migration notes
- Old: `map.setIconDefs(...)`, `map.setMarkers(...)`
- New: `map.icons.setDefs(...)`, `map.icons.setMarkers(...)`
  - The old methods still work (forward to the facade) but should be considered deprecated in new code.

## Contract & stability
- Facades (`GTMap`, `MapApi`, `IconsApi`, `TilesApi`) are the supported public surface.
- Internal implementation classes/modules (e.g., `mapgl.ts`, `tiles/*`, `layers/*`) are private and may change without notice.
