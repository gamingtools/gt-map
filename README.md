WebGL Map (Leaflet-like Minimal)

This is a minimal, dependency-free WebGL map that renders raster tiles (e.g., OpenStreetMap) with smooth pan and continuous zoom, similar to Leaflet’s core interactions.

Features

- WebGL tile rendering (256px tiles)
- Smooth pan and wheel/pinch zoom
- Web Mercator (EPSG:3857) projection
- Antimeridian (x-wrap) handling (disabled for Hagga Basin)
- Basic tile texture caching with LRU eviction

Getting Started
Run locally

1. Install deps: `npm install`
2. Start dev server: `npm start` (Vite at `http://localhost:5173`)
3. Pan with mouse drag, zoom with wheel or pinch (touch).

Files

- `index.html`: Fullscreen container, attribution, and script entry.
- `src/main.ts`: Bootstraps the map and HUD.
- `packages/gtmap/src/mapgl.ts`: GTMap class (GL setup, input, tiles, rendering).
- `packages/gtmap/src/mercator.ts`: Web Mercator helpers and URL templating.

Public API

- Primary: Leaflet‑compatible facade `GT.L` (see docs/public-api.md). Use factories like `GT.L.map`, `GT.L.tileLayer`, `GT.L.marker`, `GT.L.icon`.
- Native: `GTMap` class or `createMap()` for direct access to performance tunables and modern features.

Demo pages

- Default demo: `index.html`
- Leaflet‑style demo: `leaflet.html` (uses `GT.L`)

Public API

See `docs/public-api.md` for the recommended, stable facade APIs (`GTMap` class, `createMap()` factory) and grouped sub-APIs (`map.icons`, `map.tiles`).

Visibility Control (suspend/resume)

If you render multiple maps on a page, you can suspend ones that are offscreen to save CPU, network, and VRAM:

```ts
// Suspend a map (stop RAF, input, and tile processing)
map.setActive(false);

// Suspend and also release the WebGL context and VRAM
map.setActive(false, { releaseGL: true });

// Resume (recreates GL state if it was released)
map.setActive(true);
```

This pairs well with IntersectionObserver or the Page Visibility API. Keep examples in your app code; this repo does not wire it by default.

Tile Source
Hagga Basin (survival_1)

- URL: `https://gtcdn.info/dune/tiles/hb_8k/{z}/{x}_{y}.webp` (from sibling `dune-map` repo)
- Min/Max Zoom: 0–5 (8k base image => max zoom 5)
- Wrap: disabled (finite image pyramid, no world wrap)
- Note: These are game map tiles, not geo-referenced; they render as a finite image pyramid within the viewer.

Customization

- Center/zoom: Set in `src/main.ts` when creating `GTMap`.
- Zoom bounds: `minZoom`/`maxZoom` options.
- Tile URL: Pass a different `{z}/{x}/{y}` template to `tileUrl`.

Notes and Next Steps

- Retains up to 512 tile textures by default. Tweak via `maxTiles` in the constructor.
- Currently renders raster tiles only. Vector data, markers, and overlays can be layered with additional draw passes.
- Keyboard shortcuts, inertia, and animated fly-to can be added if desired.
- For production, host via a static server. Opening from filesystem works for quick tests in most browsers.
