WebGL Map (Leaflet-like Minimal)

This is a minimal, dependency-free WebGL map that renders raster tiles (e.g., OpenStreetMap) with smooth pan and continuous zoom, similar to Leaflet’s core interactions.

Features

- WebGL tile rendering (256px tiles)
- Smooth pan and wheel/pinch zoom
- Pixel CRS: image pixel coordinates (no Web Mercator)
- Antimeridian/wrapX support (disabled for Hagga Basin demo)
- Basic tile texture caching with LRU eviction

Getting Started
Run locally

1. Install deps: `pnpm install`
2. Start dev server: `pnpm dev` (Vite/SvelteKit at `http://localhost:5173`)
3. Pan with mouse drag, zoom with wheel or pinch (touch).

Files

- `apps/gtmap-svelte-test/src/routes/map/+page.svelte`: Minimal GT.L usage in Svelte.
- `packages/gtmap/src/mapgl.ts`: GTMap class (GL setup, input, tiles, rendering).
- `packages/gtmap/src/mapgl.ts`: GTMap class (GL setup, input, tiles, rendering).
- Pixel CRS only: coordinates are image pixels (x=lng, y=lat) at native resolution. No Web Mercator.

Public API

- Primary (and default): Leaflet‑compatible facade `GT.L` (see docs/public-api.md). Use factories like `GT.L.map`, `GT.L.tileLayer`, `GT.L.marker`, `GT.L.icon`.
  - The previous native facades (`GTMap`, `createMap`, `MapApi`) are no longer exported. Internals remain, but apps should use `GT.L`.

Demo app

- Default demo app (SvelteKit): `apps/gtmap-svelte-test` → open `/map`
- Legacy no-framework demo: `apps/gtmap-noframework-test/index.html`

See `docs/public-api.md` for the `GT.L` facade and how to use it. Native facades are considered internal.

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

- Center/zoom: Set in `apps/gtmap-svelte-test/src/routes/map/+page.svelte` when creating the map via `GT.L`.
- Zoom bounds: `minZoom`/`maxZoom` options.
- Tile URL: Pass a different `{z}/{x}/{y}` template to `tileUrl`.

Notes and Next Steps

- Retains up to 512 tile textures by default. Tweak via `maxTiles` in the constructor.
- Currently renders raster tiles only. Vector data, markers, and overlays can be layered with additional draw passes.
- Keyboard shortcuts, inertia, and animated fly-to can be added if desired.
- For production, host via a static server. Opening from filesystem works for quick tests in most browsers.

Monorepo & Package Manager

- This repository uses a pnpm workspace. Packages are defined in `pnpm-workspace.yaml`.
- Common commands:
  - Install: `pnpm install`
  - Dev server: `pnpm dev`
  - Build: `pnpm build` (also builds `packages/gtmap`)
  - Lint/format: `pnpm lint`, `pnpm format`
