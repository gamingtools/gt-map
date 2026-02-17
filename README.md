# gt-map

Minimal, zero-dependency WebGL map renderer for tiled raster imagery. Pixel CRS only (image pixel coordinates, no Web Mercator).

## Quick Start

```bash
npm install
npm run dev        # SvelteKit app at http://localhost:5173
npm run build      # Build library + apps
```

## Public API

Import `GTMap` from `@gaming.tools/gtmap` (or `@gtmap` alias in demos).

```ts
import { GTMap } from '@gaming.tools/gtmap';

const map = new GTMap(container, {
  mapSize: { width: 8192, height: 8192 },
  zoom: 2,
  center: { x: 4096, y: 4096 },
  backgroundColor: '#0a0a0a',
});
```

### Facades

All functionality is accessed through facades on the map instance:

| Facade | Access | Purpose |
|--------|--------|---------|
| **view** | `map.view` | Center, zoom, setView, bounds, coordinate transforms, icon scaling |
| **layers** | `map.layers` | Layer creation, attachment, removal, per-layer display |
| **display** | `map.display` | Grid overlay, upscale filter, FPS cap, background color, zoom snap |
| **input** | `map.input` | Wheel speed, inertia options |

```ts
// Animated view change
await map.view.setView({
  center: { x: 1000, y: 2000 },
  zoom: 4,
  animate: { durationMs: 800 },
});

// Events (typed payloads)
map.events.on('click', (e) => console.log(e.world));
```

### Layer System

Content lives in typed layers created via `map.layers`:

```ts
// Tile layer (GTPK tile pyramid)
const tiles = map.layers.createTileLayer({
  packUrl: 'https://example.com/tiles/map.gtpk',
  tileSize: 256,
  sourceMinZoom: 0,
  sourceMaxZoom: 5,
});
map.layers.addLayer(tiles, { z: 0 });

// Interactive layer (markers with hit-testing)
const markers = map.layers.createInteractiveLayer();
map.layers.addLayer(markers, { z: 1 });

const icon = markers.addIcon({ iconPath: 'pin.png', width: 32, height: 32 });
const mk = markers.addMarker(500, 500, { visual: new ImageVisual('pin.png', 32) });
mk.events.on('click', (e) => console.log(e.marker));

// Static layer (vector shapes)
const vectors = map.layers.createStaticLayer();
map.layers.addLayer(vectors, { z: 2 });
vectors.addPolygon([{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }]);

// Clustered layer (auto-clustering markers)
const clusters = map.layers.createClusteredLayer({
  clusterRadius: 80,
  boundary: { fill: true, showOnHover: true },
});
map.layers.addLayer(clusters, { z: 3 });
```

### Visual System

Markers use Visual templates for rendering:

```ts
import { ImageVisual, CircleVisual, SvgVisual, TextVisual } from '@gaming.tools/gtmap';

const pin = new ImageVisual('/icons/pin.png', 32);
const dot = new CircleVisual(6, { fill: '#ff0000' });
const label = new TextVisual('Town', { fontSize: 12, color: '#fff' });
```

### Lifecycle

```ts
map.suspend();                       // pause rendering + input
map.suspend({ releaseGL: true });    // also free VRAM
map.resume();                        // resume
map.destroy();                       // full teardown
```

## Project Structure

```
packages/gtmap/          Core WebGL library (zero external deps)
apps/svelte-gtmap-test/  SvelteKit demo app (Tailwind, Vite)
apps/noframework-gtmap-test/  Plain HTML+TS demo
docs/api/                Generated API reference (TypeDoc markdown)
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (SvelteKit) |
| `npm run build` | Build all |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | Playwright E2E tests |
| `npm run check` | svelte-check type checking |

## API Reference

Generated docs: `docs/api/README.md`

Regenerate: `npx typedoc`
