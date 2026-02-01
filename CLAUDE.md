# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install all (monorepo workspaces)
npm run build        # Build gtmap library + apps
npm run dev          # SvelteKit dev server at localhost:5173
npm run lint         # ESLint
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier
npm run format:check # Check formatting
npm run test         # Playwright E2E tests
npm run check        # svelte-check
```

## Architecture

Monorepo WebGL map renderer. Pixel CRS (image pixel coordinates, no Web Mercator).

### Packages

- **packages/gtmap** -- Core WebGL library (zero external deps)
- **apps/svelte-gtmap-test** -- SvelteKit demo (Tailwind, Vite)
- **apps/noframework-gtmap-test** -- Plain HTML+TS demo

### Public API Surface

Entry point: `packages/gtmap/src/index.ts`

`GTMap` class exposes four facades:

- `map.view` (ViewFacade) -- center, zoom, transitions, bounds, coord transforms, icon scaling
- `map.content` (ContentFacade) -- addIcon, addMarker, addDecal, addVector, entity collections
- `map.display` (DisplayFacade) -- grid overlay, upscale filter, FPS cap, background, raster opacity
- `map.input` (InputFacade) -- wheel speed, inertia

Lifecycle: `map.suspend()`, `map.resume()`, `map.destroy()`

Events: `map.events.on(name).each(handler)`, `map.events.once(name)`

View transitions: `map.view.transition().center(...).zoom(...).apply({ animate? })`

### Internal Architecture

```
src/api/              Public API layer (GTMap, facades, types, events)
src/api/facades/      Facade classes (view, content, display, input)
src/internal/         Implementation
  context/            MapContext (DI root), ViewStateStore, TileConfig
  core/               ZoomController, PanController, bounds logic
  render/             RenderCoordinator, TileRenderer, GridOverlay, VectorLayer
  tiles/              TileManager, TileCache, GTPK pack loader
  input/              InputManager, InputController
  events/             TypedEventBus, EventBridge, marker hit testing
  content/            VisualIconService (visual-to-icon rendering)
  markers/            MarkerLayer, atlas management
```

Key patterns:
- **Narrow DI interfaces** -- each module declares its own deps interface (e.g., ZoomDeps, PanDeps extend ControllerDepsBase)
- **MapContext** as composition root wiring all modules
- **TypedEventBus** for type-safe events with `.on()/.each()/.once()` API
- **Tile pyramid only** -- no single-image source; tiles via URL template `{z}/{x}/{y}` or `.gtpk` pack

### Tile Source

Constructor option: `tiles: { url, packUrl?, tileSize, mapSize, sourceMinZoom, sourceMaxZoom }`

Default demo: Hagga Basin tiles at `https://gtcdn.info/dune/tiles/hb_8k/{z}/{x}_{y}.webp`

## Code Style

- TypeScript strict mode
- 2-space indentation, single quotes, trailing commas, semicolons
- ~200 char max line width
- ESLint + Prettier
- In demo apps, `@gtmap` is a Vite alias to `packages/gtmap/src`
