# Architecture Overview (Early Stage)

This document captures the current internal class/module structure after the class‑migration split. Public API is still evolving.

Modules & Classes

- GTMap (shell)
  - Composes internal classes and delegates behavior
  - Owns public options, ViewState, lifecycle, and high‑level glue
- Graphics
  - Initializes WebGL context and program/buffer setup; disposes GL resources
- MapRenderer
  - Orchestrates per‑frame rendering (delegates to render/frame)
- ScreenCache
  - Manages the screen‑space texture; update/draw
- RasterRenderer
  - Draws tiles for a level; computes coverage
- TilePipeline
  - Queues, schedules, loads, and prefetches tiles; manages inflight
- InputController
  - Handles pointer/touch/wheel/resize; emits via EventBus
- ZoomController
  - Owns zoom easing animation and stepping
- EventBus
  - Chainable event streams (`on`, `when`, operators)

Stateless Helpers (kept as functions)

- Projection: `mercator.ts`
- Templating & wrap: `tiles/source.ts`
- Grid overlay: `render/grid.ts`
- Wheel normalization: `core/wheel.ts`
- Resize & canvas helpers: `core/resize.ts`, `core/canvas.ts`
- Frame glue: `render/frame.ts` (pure orchestrator used by MapRenderer)

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
  |-- MapRenderer -> render/frame (pure)
  |-- TilePipeline -> tiles/{queue,loader,cache,prefetch}
  |-- ZoomController -> core/zoom
  |-- InputController -> core/wheel, EventBus
  |-- EventBus

Helpers: mercator, tiles/source, render/grid, core/{resize,canvas}
```

Notes

- Controllers accept dependencies via constructors (DI); no singletons.
- Pure helpers remain functions for readability and testability.
- Dispose path: InputController → Renderer → TilePipeline → Graphics → caches/buffers.
