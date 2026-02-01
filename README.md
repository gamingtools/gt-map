# gt-map

Minimal, zero-dependency WebGL map renderer for tiled raster imagery. Pixel CRS only (image pixel coordinates, no Web Mercator).

## Quick Start

```bash
npm install
npm run dev        # SvelteKit app at http://localhost:5173/map
npm run build      # Build library + apps
```

## Public API

Import `GTMap` from `@gaming.tools/gtmap` (or `@gtmap` alias in demos).

```ts
import { GTMap } from '@gaming.tools/gtmap';

const map = new GTMap(container, {
  tiles: {
    url: 'https://example.com/tiles/{z}/{x}_{y}.webp',
    tileSize: 256,
    mapSize: { width: 8192, height: 8192 },
    sourceMinZoom: 0,
    sourceMaxZoom: 5,
  },
  zoom: 2,
  center: { x: 4096, y: 4096 },
});
```

### Facades

All functionality is accessed through four facades:

| Facade | Access | Purpose |
|--------|--------|---------|
| **view** | `map.view` | Center, zoom, transitions, bounds, coordinate transforms |
| **content** | `map.content` | Icons, markers, decals, vectors |
| **display** | `map.display` | Grid overlay, upscale filter, FPS cap, background color |
| **input** | `map.input` | Wheel speed, inertia options |

```ts
// Animated view transition
map.view.transition().center({ x: 1000, y: 2000 }).zoom(4).apply({ animate: { durationMs: 800 } });

// Add a marker
const icon = map.content.addIcon({ iconPath: 'pin.png', width: 32, height: 32 });
map.content.addMarker(500, 500, { icon });

// Events (typed payloads)
map.events.on('markerclick').each((e) => console.log(e.marker.id));
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
packages/gtmap/          Core WebGL library
apps/svelte-gtmap-test/  SvelteKit demo app
apps/noframework-gtmap-test/  Plain HTML+TS demo
docs/api/                Generated API reference (TypeDoc)
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
