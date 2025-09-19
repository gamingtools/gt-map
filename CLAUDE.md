# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Install and Run
- `npm install` - Install all dependencies (monorepo with workspaces)
- `npm run dev` - Start Svelte app dev server at http://localhost:5173
- `npm run build` - Build both gtmap library and Svelte app

### Code Quality
- `npm run lint` - Run ESLint on packages
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without changes

### Testing
- `npm run test` - Run Playwright E2E tests (in svelte-gtmap-test)
- `npm run check` - Type-check Svelte app with svelte-check

## Architecture Overview

This is a monorepo WebGL map renderer with a pixel-based coordinate system (not Web Mercator).

### Package Structure
- **packages/gtmap**: Core WebGL map library
  - Public API: `GTMap` class in `src/api/map.ts`
  - Internal implementation: `src/internal/mapgl.ts` and supporting modules
  - Exports via `src/index.ts`: GTMap, easing helpers, and typed event/option payloads
  
- **apps/svelte-gtmap-test**: Main demo app using SvelteKit
  - Map demo at `/map` route (`src/routes/map/+page.svelte`)
  - Uses Tailwind CSS and Vite

### Core Concepts

1. **Coordinate System**: Pixel CRS where x=lng, y=lat in image pixel coordinates at native resolution. No Web Mercator projections.

2. **GTMap API**: Main public interface with methods:
   - View control: Transition Builder `map.transition().center(...).zoom(...).apply({ animate? })`
   - Raster image: via constructor `image: { url, width, height }` plus optional `wrapX` and view bounds
   - Content: `addIcon()`, `addMarker()`, `addVectors()`
   - Lifecycle: `setActive()` for suspend/resume with optional GL release

3. **Rendering Pipeline**:
   - WebGL-based single-image renderer with texture caching
   - Frame loop with FPS capping and RAF batching
   - Screen cache for optimization
   - Support for raster imagery, markers/icons, and vector shapes

4. **Input Handling**: Mouse/touch pan and wheel/pinch zoom via `InputController`

5. **Imagery**:
   - Default: Hagga Basin raster at `https://gtcdn.info/dune/tiles/hb_8k.webp`
   - 8192×8192 native resolution (set `minZoom`/`maxZoom` as needed)
   - Configurable via constructor `image` (see above)

## Code Style

- TypeScript with strict mode
- Indentation: 2 spaces
- Single quotes, trailing commas, semicolons
- Max line width: ~200 characters
- ESLint + Prettier for formatting

## Key Implementation Details

- The library avoids external dependencies (WebGL from scratch)
- Leaflet compatibility layers have been removed - use GTMap API directly
- Markers and vectors are batched via requestAnimationFrame for performance
- GL context can be released when maps are hidden (`setActive(false, {releaseGL: true})`)
 - In demo apps, `@gtmap` is a Vite alias pointing to `packages/gtmap/src`
