# Architecture Overview (Early Stage)

This document captures the current internal class/module structure after the class‑migration split. Public API is still evolving.

Modules & Classes

- GTMap (shell)
  - Composes internal classes and delegates behavior
  - Owns public options, ViewState, lifecycle, and high‑level glue
- Graphics
  - Initializes WebGL context and program/buffer setup; disposes GL resources
- MapRenderer
  - Orchestrates per‑frame rendering (render loop logic now in class) via DI hooks/ctx provider
- ScreenCache
  - Manages the screen‑space texture; update/draw
- RasterRenderer
  - Draws tiles for a level; computes coverage
- TilePipeline
  - Queues, schedules, loads, and prefetches tiles; manages inflight
  - Uses `TileLoaderDeps` to upload textures and manage inflight/pending counters
- InputController
  - Handles pointer/touch/wheel/resize; emits via EventBus
- ZoomController
  - Owns zoom easing animation/stepping; keeps easing options internally; uses `ZoomDeps` to mutate map state
- EventBus
  - Chainable event streams (`on`, `when`, operators)

Stateless Helpers (kept as functions)

- Projection: `mercator.ts`
- Templating & wrap: `tiles/source.ts` (wrapX, tileKey)
  - Note: URL templating, grid drawing, wheel normalization, and resize/canvas are now class methods.

High‑Level Flow

1. GTMap creates canvas, Graphics, programs, ScreenCache, RasterRenderer, EventBus
2. Instantiates TilePipeline, ZoomController, InputController, MapRenderer
3. RAF loop calls MapRenderer.render(map, view)
4. InputController updates center/zoom and emits events; ZoomController animates
5. TilePipeline schedules loads and prefetches based on ViewState and interaction

ASCII Diagram

```
GTMap (shell, ViewState)
  |-- Graphics (GL init, programs, buffers)
  |-- ScreenCache
  |-- RasterRenderer
  |-- MapRenderer (render loop)
  |-- TilePipeline -> tiles/{queue,cache}
  |-- ZoomController (anchored zoom math)
  |-- InputController (wheel normalization in-class), EventBus
  |-- EventBus

Helpers: mercator, tiles/source
```

Notes

- Controllers accept dependencies via constructors (DI); no singletons.
- Pure helpers remain functions for readability and testability.
- Dispose path: InputController → Renderer → TilePipeline → Graphics → caches/buffers.
- Zoom math: anchoring and easing is handled inside ZoomController; no separate `core/zoom.zoomToAnchored` export.
