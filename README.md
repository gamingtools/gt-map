WebGL Map (Minimal)

Minimal, dependency-light WebGL map that renders a single large raster with smooth pan and continuous zoom. Pixel CRS only (image pixel coordinates; no Web Mercator).

Status

- Early-stage, pre-release. Everything is subject to change before the initial release. Expect breaking changes as APIs and internals evolve.

Features

- WebGL single-image rendering
- Smooth pan and wheel/pinch zoom
- Pixel CRS: image pixel coordinates (no geodetic projection)
- WrapX support (disabled in Hagga Basin demo)
- Typed events for input, lifecycle, and per‑frame HUD (frame counter)

Documentation

- Guide: `docs/guide/README.md` (concepts and how-tos)
- API Reference: `docs/api/README.md` (generated)
- Quick index: `docs/API_OVERVIEW.md`

Getting Started
Run locally

1. Install deps: `npm install`
2. Start dev server: `npm run dev` (SvelteKit app at `http://localhost:5173`)
3. Open `/map`. Pan with mouse drag; zoom with wheel or pinch (touch).

Files

- `apps/svelte-gtmap-test/src/routes/map/+page.svelte`: Minimal usage in SvelteKit (`/map`).
- `apps/noframework-gtmap-test/index.html`: No‑framework demo (HTML + TS).
- `apps/noframework-gtmap-test/src/main.ts`: Plain TS usage and HUD wiring.
- `packages/gtmap/src/api/map.ts`: Public `GTMap` facade (typed API surface).
- `packages/gtmap/src/internal/mapgl.ts`: Core WebGL implementation (single-image renderer, input, cache).
- Pixel CRS only: coordinates are image pixels (x, y) at native resolution.

Public API

- Import `GTMap` via `@gaming.tools/gtmap` (published) or `@gtmap` (Vite alias in demos).
  - Raster via `image` in `MapOptions`: `{ url, width, height }` plus optional `wrapX` and view limits.
  - View with Transition Builder: `map.transition().center(...).zoom(...).apply({ animate? })`.
  - Content: `addIcon`, `addMarker`, `addVector` (or `addVectors` legacy batch).
  - Events: `map.events.on(name).each(h)` and `map.events.once(name)` (typed payloads). Includes pointer/mouse, lifecycle, frame, and map-level marker events (`markerenter/leave/click/down/up/longpress`).
  - In demos, `@gtmap` is aliased to the local source for fast iteration.

See the full API reference in `docs/api/README.md`.

Demo apps

- SvelteKit: `apps/svelte-gtmap-test` → open `/map`
- No‑framework: `apps/noframework-gtmap-test/index.html`

Svelte Docs
- Svelte v5 docs are mirrored under `docs/svelte/`. Use them as the source of truth (runes, `onclick={...}`, etc.).

Progressive Imagery

You can supply a smaller `image.preview` to render immediately while the full image decodes and uploads.
The engine displays the preview first, then upgrades to the full‑res texture in a single swap.

```ts
const map = new GTMap(container, {
  image: {
    url: 'https://example.com/maps/hagga-8k.webp', width: 8192, height: 8192,
    preview: { url: 'https://example.com/maps/hagga-1k.webp', width: 1024, height: 1024 },
  },
  center: { x: 4096, y: 4096 }, zoom: 2,
});
```

Visibility Control (suspend/resume)

If you render multiple maps, suspend offscreen ones to save CPU/network/VRAM:

```ts
// Suspend a map (stop RAF, input, and rendering)
map.setActive(false);

// Suspend and also release the WebGL context and VRAM
map.setActive(false, { releaseGL: true });

// Resume (recreates GL state if it was released)
map.setActive(true);
```

This pairs well with IntersectionObserver or the Page Visibility API.

Image Source
Hagga Basin (survival_1)

- URL: `https://gtcdn.info/dune/tiles/hb_8k.webp`
- Base resolution: 8192 × 8192 (set `minZoom`/`maxZoom` to control view constraints)
- Wrap: disabled (finite image; no world wrap)
- Note: Game map (not geo-referenced); renders as a finite raster.

Customization

- Center/zoom: Set when constructing `GTMap` in the demos.
- Zoom bounds: `minZoom`/`maxZoom`.
- Grid overlay: `setGridVisible(true|false)`.
- Wheel speed: `setWheelSpeed(number)`.

Notes and Next Steps

- Single raster currently; markers and vectors are simple overlays.
- Frame/HUD via `map.events.on('frame')` (frame counter available).

Performance

- With `image.preview`, the engine shows the preview first, then upgrades to the full texture.
- On large images, full texture upload is done incrementally across animation frames to minimize UI stalls; the map remains interactive until the swap.
- Host via a static server for production; dev server is preferred.

Monorepo & Package Manager

- npm workspaces; see root `package.json`.
- Common commands:
  - Install: `npm install`
  - Dev server: `npm run dev`
  - Build: `npm run build` (builds Svelte app and `packages/gtmap`)
  - Lint/format: `npm run lint`, `npm run format`
