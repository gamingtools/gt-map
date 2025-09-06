# GTMap

High‑performance, pixel‑CRS WebGL map renderer with a small, typed API. Optimized for image/scan maps (no geodetic lat‑lng). Ships a thin facade (`GTMap`) over a fast WebGL core: tiles, input, rendering, and caches.

Status: early 0.x — public API may evolve. No heavy runtime deps; pure TypeScript and Web APIs.

## Install

```bash
npm install @gaming.tools/gtmap
```

## Quick Start (no framework)

HTML

```html
<div id="map"></div>
<style>
  #map { width: 100%; height: 480px; }
  /* Ensure the container has a concrete size */
</style>
```

TypeScript

```ts
import { GTMap, type MapOptions, type TileSourceOptions } from '@gaming.tools/gtmap';

const container = document.getElementById('map') as HTMLDivElement;

const map = new GTMap(container, {
  tileUrl: 'https://example.com/tiles/{z}/{x}_{y}.webp',
  tileSize: 256,
  minZoom: 0,
  maxZoom: 5,
  mapSize: { width: 8192, height: 8192 },
  center: { x: 4096, y: 4096 },
  zoom: 3,
  backgroundColor: '#0a0a0a'
} satisfies MapOptions);

// Optional: grid + filtering
map.setGridVisible(false);
map.setUpscaleFilter('auto'); // 'auto' | 'linear' | 'bicubic'

// Configure/replace tile source (can be called later)
const src: TileSourceOptions = {
  url: 'https://example.com/tiles/{z}/{x}_{y}.webp',
  tileSize: 256,
  sourceMaxZoom: 5,
  mapSize: { width: 8192, height: 8192 },
  wrapX: false,
  clearCache: true
};
map.setTileSource(src);
```

### View Controls

```ts
map.setCenter({ x: 4200, y: 4100 });
map.setZoom(3);
map.setView({ center: { x: 2048, y: 2048 }, zoom: 2 });
map.panTo({ x: 5000, y: 3000 }, 600);
map.flyTo({ center: { x: 4096, y: 4096 }, zoom: 4, durationMs: 800 });
```

### Rendering & Behavior

```ts
// Grid overlay and filtering
map.setGridVisible(false);
map.setUpscaleFilter('auto');

// Control icon scale vs. zoom (1 = screen‑fixed size)
map.setIconScaleFunction((zoom, min, max) => 1);

// Performance knobs
map.setFpsCap(60);
map.setAutoResize(true); // enabled by default

// Background: either 'transparent' or solid (alpha ignored)
map.setBackgroundColor('transparent');
map.setBackgroundColor('#000000');
map.setBackgroundColor({ r: 16, g: 16, b: 16 });
```

### Lifecycle

```ts
// One‑time map initialization
map.events.on('load').each(({ size, view }) => {
  console.log('ready', size.width, size.height, size.dpr, view);
});

// Debounced resize with final size + DPR
map.events.on('resize').each(({ size }) => {
  console.log('resized', size.width, size.height, size.dpr);
});

// Suspend/resume rendering
map.setActive(false, { releaseGL: true });
map.setActive(true);

// Cleanup when removing the map
map.destroy();
```

## Events

GTMap exposes a typed event surface. Subscribe with `events.on(name).each(handler)` or await one occurrence with `events.once(name)`.

Map examples

```ts
map.events.on('move').each(({ view }) => {
  console.log('center', view.center, 'zoom', view.zoom);
});

map.events.on('zoomend').each(({ view }) => {
  console.log('zoomend', view.zoom);
});

map.events.on('click').each((e) => {
  console.log('screen', e.x, e.y, 'world', e.world);
});
```

Lifecycle

- `load`: fired once after the first frame is scheduled (map initialized)
- `resize`: fired after a debounced resize completes (final size + DPR)

```ts
map.events.on('load').each(({ size, view }) => {
  console.log('map ready', size.width, size.height, size.dpr, view);
});

map.events.on('resize').each(({ size }) => {
  console.log('resized to', size.width, size.height, 'dpr', size.dpr);
});
```

## Markers

Markers are entities anchored at pixel coordinates. Each marker has an ID, position, style, optional user data, and a typed event stream. Use the map’s `markers` layer to add/remove markers and observe layer‑level events.

Create markers

```ts
// Minimal
const m = map.addMarker(1024, 1024);

// With style and user data
const icon = map.addIcon({ iconPath: '/assets/pin.png', width: 24, height: 24 });
const poi = map.addMarker(2048, 2048, {
  icon,             // Icon handle from addIcon()
  size: 1.25,       // Scale multiplier (1 = source icon size)
  rotation: 0,      // Degrees clockwise
  data: { name: 'POI A', category: 'shop' }
});
```

Properties

- `id: string` — stable identifier
- `x: number`, `y: number` — world pixel position
- `iconType: string` — icon key (matches `IconHandle.id` or `'default'`)
- `size?: number` — scale multiplier (default 1)
- `rotation?: number` — degrees clockwise
- `data?: unknown` — user data included in event payloads

Methods

```ts
// Move in world pixels; emits `positionchange`
m.moveTo(1100, 980);

// Update style in place
m.setStyle({ iconType: icon.id, size: 1.5, rotation: 30 });

// Attach/replace user data
m.setData({ name: 'POI B', category: 'viewpoint' });

// Snapshot used in event payloads
const snapshot = m.toData(); // { id, x, y, data }

// Remove via the layer (recommended)
map.markers.remove(m);
// or clear all
map.markers.clear();
```

Marker events (subscribe via `m.events.on(name).each(handler)`)

- `click`: `{ x, y, marker, pointer? }`
- `tap`: `{ x, y, marker, pointer? }` (touch alias)
- `longpress`: `{ x, y, marker, pointer? }`
- `pointerdown` / `pointerup` / `pointerenter` / `pointerleave`
- `positionchange`: `{ x, y, dx, dy, marker }`
- `remove`: `{ marker }`

Pointer metadata (when available)

```ts
{
  device: 'mouse' | 'touch' | 'pen',
  isPrimary: boolean,
  buttons: number,
  pointerId: number,
  pressure?: number,
  width?: number,
  height?: number,
  tiltX?: number,
  tiltY?: number,
  twist?: number,
  modifiers: { alt: boolean; ctrl: boolean; meta: boolean; shift: boolean }
}
```

Coordinate note: `x`, `y` in click/enter/leave payloads are screen coordinates relative to the container; `marker.x`, `marker.y` are world pixels.

## Layers

Layers group entities and expose lifecycle + visibility events.

```ts
// Built‑in layers
const { markers, vectors } = map;

// Observe adds/removes
markers.events.on('entityadd').each(({ entity }) => console.log('marker added', entity.id));
markers.events.on('entityremove').each(({ entity }) => console.log('marker removed', entity.id));

// Visibility
markers.setVisible(false);
console.log('visible?', markers.visible);
```

API

- `add(entity)` / `remove(entityOrId)` / `clear()`
- `get(id)` / `getAll()`
- `setVisible(boolean)` / `visible`
- Events: `entityadd`, `entityremove`, `clear`, `visibilitychange`

## Vectors

Vectors are simple geometry overlays (polyline, polygon, circle). They live in the `vectors` layer and can be added individually.

```ts
// Polyline
map.addVector({ type: 'polyline', points: [ { x: 0, y: 0 }, { x: 200, y: 100 } ] });

// Polygon
map.addVector({ type: 'polygon', points: [ { x: 100, y: 100 }, { x: 150, y: 160 }, { x: 80, y: 190 } ] });

// Circle
map.addVector({ type: 'circle', center: { x: 300, y: 300 }, radius: 60 });

// Clear all vectors
map.vectors.clear();
```

Note: vector interaction events are minimal for now and will expand over time.

## Cookbook

Recenter on marker click

```ts
const m = map.addMarker(1200, 900);
m.events.on('click').each(() => map.panTo({ x: m.x, y: m.y }, 400));
```

Wheel speed slider

```ts
const slider = document.querySelector('#wheelSpeed') as HTMLInputElement;
slider.oninput = () => map.setWheelSpeed(Number(slider.value));
```

Frame loop hook (stats or overlays)

```ts
map.events.on('frame').each(({ now, stats }) => {
  // stats?.fps, stats?.tilesLoaded, etc.
});
```

Throttle high‑frequency events in your handlers

```ts
let scheduled = false;
let lastPos = { x: 0, y: 0 };
map.events.on('pointermove').each(({ x, y }) => {
  lastPos = { x, y };
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      // do work with lastPos
    });
  }
});
```

## Types & Bundles

- ESM bundle: `dist/index.js`
- Type declarations: `dist/index.d.ts` plus `dist/api/**`, `dist/entities/**`
- Import from `@gaming.tools/gtmap` (deep imports are not part of the public API)

## License

MIT © gaming.tools
