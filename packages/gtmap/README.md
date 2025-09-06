# GTMap

High‑performance, pixel‑CRS WebGL map renderer with a small, typed API. Optimized for image/scan maps (no geodetic lat‑lng). Ships a thin facade (`GTMap`) over a fast WebGL core: tiles, input, rendering, and caches.

Status: early 0.x — public API may evolve. No heavy runtime deps; pure TypeScript and Web APIs.

## Install

```bash
npm install "@gaming.tools/gtmap"
```

## Quick Start (no framework)

HTML:

```html
<div id="map"></div>
<style>
  #map { width: 100%; height: 480px; }
</style>
```

TypeScript:

```ts
import { GTMap, type MapOptions, type TileSourceOptions } from '@gaming.tools/gtmap';

const container = document.getElementById('map') as HTMLDivElement;

const map = new GTMap(container, {
  tileUrl: 'https://example.com/tiles/{z}/{x}_{y}.webp',
  tileSize: 256,
  minZoom: 0,
  maxZoom: 6,
  mapSize: { width: 8192, height: 8192 },
  center: { x: 4096, y: 4096 },
  zoom: 3,
  backgroundColor: '#000000'
} satisfies MapOptions);

map.setGridVisible(false);
map.setUpscaleFilter('auto');

const src: TileSourceOptions = {
  url: 'https://example.com/tiles/{z}/{x}_{y}.webp',
  tileSize: 256,
  sourceMaxZoom: 6,
  mapSize: { width: 8192, height: 8192 },
  wrapX: false,
  clearCache: true
};
map.setTileSource(src);
```

## Markers and Icons

```ts
import { GTMap, type IconDef } from '@gaming.tools/gtmap';

const iconDef: IconDef = {
  iconPath: 'https://gtcdn.info/gt/logo.png', // 512×512; use small logical size
  width: 24,
  height: 24,
  anchorX: 12,
  anchorY: 12
};

const icon = map.addIcon(iconDef);
const m = map.addMarker(1024, 1024, { icon, size: 1 });

m.events.on('click').each(({ x, y, marker }) => {
  console.log('clicked', marker.id, marker.x, marker.y);
});
```

## Vectors

```ts
import { Vector, type Polyline } from '@gaming.tools/gtmap';

const poly: Polyline = {
  type: 'polyline',
  points: [ { x: 0, y: 0 }, { x: 512, y: 256 } ],
  style: { color: '#ff5500', weight: 2 }
};
map.addVector(poly);
```

## Svelte (v5) Hint

- Use `onclick={...}` style event attributes in runes mode (no `on:` directive).
- Use `onMount`/`onDestroy` for lifecycle.

## Types

- ESM bundle: `dist/index.js`
- Declarations: `dist/index.d.ts` plus `dist/api/**`, `dist/entities/**`
- Import from `@gaming.tools/gtmap` (deep imports are not part of the public API)

## License

MIT © gaming.tools

