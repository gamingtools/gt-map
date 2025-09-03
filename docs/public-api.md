# Public API (GT.L)

This document describes the stable, public-facing API. The library exposes a Leaflet‑compatible facade under `GT.L`, which is the default and only supported public surface. Internal classes (renderers, pipelines, etc.) are private and may change.

Recommended usage
- Use the Leaflet‑compatible facade `GT.L` — it offers familiar Map/TileLayer/Marker APIs.

## Overview

- Entry point: `GT.L`
- Internals: Built on the same implementation, but native facades are no longer exported.

## Imports

```ts
import GT from '@gtmap';

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

## Advanced (tuning)

Performance tunables (tiles, prefetch, screen cache, inertia, zoom bias) are exposed internally. Until they are fully surfaced via `GT.L` options and controls, you may rely on app-specific helpers or limited passthroughs as documented in examples.

## Facades (native)

### Markers & Icons
- `GT.L.icon(options)` creates an icon definition.
- `GT.L.marker(latlng, { icon })` creates a marker facade with `addTo/remove`, `setLatLng/getLatLng`, `setIcon`.
Notes:
- The facade batches markers behind the scenes for performance.

### Tiles
- `GT.L.tileLayer(url, options).addTo(map)` sets the tile source.
- `setUrl(url)` updates the source (clears cache and reloads).
- `setOpacity(opacity)` controls raster alpha for tiles (0..1).
- `setZIndex(z)` is a no-op for now (single-canvas renderer).

## Map methods (selected)
- View: `setView(latlng, zoom?)` → this, `getCenter()` → `[lat, lng]`, `getZoom()` → `number`
- Movement: `panTo(latlng)` → this, `flyTo(latlng, zoom?)` → this, `panBy({x,y}|[x,y])` → this
- Bounds: `fitBounds(bounds, { padding?, paddingTopLeft?, paddingBottomRight?, maxZoom? })` → this, `getBounds()` → `[[south, west],[north, east]]`
- Zoom helpers: `zoomIn(delta?)` → this, `zoomOut(delta?)` → this
- Resize: `invalidateSize(options?)` → this, `getSize()` → `{ x, y }`, `getPixelBounds()` → `{ min:{x,y}, max:{x,y} }`, `getPixelOrigin()` → `{ x, y }`
- Events: `on/off('move'|'moveend'|'zoom'|'zoomend', fn)` (returns this)

## Options
- `center`, `zoom`, `minZoom`, `maxZoom`
- `tileUrl`, `tileSize`, `wrapX`, `freePan`
- Accepted (reserved/not fully wired yet): `zoomAnimation`, `zoomAnimationThreshold`, `fadeAnimation`, `markerZoomAnimation`

## Migration notes
- Use `GT.L` exclusively. Previous native facades are no longer exported.

## Contract & stability
- Facade (`GT.L`) is the supported public surface.
- Internal implementation classes/modules (e.g., `mapgl.ts`, `tiles/*`, `layers/*`) are private and may change without notice.

## TypeScript
- Import typed options and helpers from `@gtmap`:
  - `LeafletMapOptions`, `TileLayerOptions`, `IconOptions`, `LeafletIcon`, `MarkerOptions`, `LeafletLatLng`.
