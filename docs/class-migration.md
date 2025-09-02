# Hybrid → Class Migration Plan (Internal)

Status: WIP — track progress with the checkboxes below

Goals

- Encapsulate stateful subsystems and lifecycles in focused classes.
- Keep pure helpers as functions to stay readable and tree‑shakable.
- Improve testability and dependency injection without behavior changes per phase.
- Public API may evolve (early development) — prioritize internal clarity.

Principles

- Classes only when there is owned state, resources, or lifecycle (attach/dispose).
- Pure, stateless helpers stay as functions.
- Explicit dependencies via constructors (no hidden singletons).
- One responsibility per class; each class supports `dispose()`.

SOLID Notes (pragmatic)

- SRP: each class should have a single reason to change (e.g., input, tiles, render, zoom).
- DIP: depend on abstractions via constructor injection; avoid hard wiring globals.
- ISP: keep interfaces small and specific (minimal methods between modules).
- OCP/LSP: don’t force inheritance or artificial extension points; prefer composition and pure functions where simpler.

Keep as Functions

- `mercator.ts`: `lngLatToWorld`, `worldToLngLat`, `clampLat`.
- `tiles/source.ts`: `urlFromTemplate`, `wrapX`, `tileKey`.
- `core/wheel.ts`: `normalizeWheel`.
- `render/grid.ts`: `drawGrid`.
- `core/canvas.ts`, `core/resize.ts`: may remain functional (stateless UI helpers).

Target Classes

- InputController
  - Owns pointer/touch/wheel listeners; emits via `EventBus`.
  - API: `attach()`, `dispose()`.
- TilePipeline
  - Composes queue + cache + loader + prefetch; manages inflight and idle gating.
  - API: `enqueue()`, `process()`, `cancelUnwanted()`, `clear()`, `dispose()`; optional `pin()/unpin()`.
- MapRenderer
  - Orchestrates per‑frame rendering (screen cache, raster draws, blending).
  - API: `render(view, tiles)`, `dispose()`.
- ZoomController
  - Owns easing options and animation; anchored zoom math.
  - API: `startEase(...)`, `step(now)`, `applyAnchoredZoom(...)`, `reset()`.
- Graphics
  - Wraps GL context and programs (init/teardown), shared buffers.
  - API: `init()`, `dispose()`, getters for `gl`, `programs`, `quad`.
- (Keep) ScreenCache, RasterRenderer
  - Already classes; continue to use/integrate.

Phases & Checklists

Phase 0 — Baseline

- [x] Working branch for milestone (events/scaffolding split)
- [x] Visual parity baseline noted; manual smoke process established

Phase 1 — Input → InputController

- [ ] Create `input/InputController.ts` class from `input/handlers.ts`
- [ ] Constructor DI: container, canvas, hooks (`setCenter`, `zoomController`), `EventBus`
- [ ] Methods: `attach()`, `dispose()`
- [ ] Wire into `GTMap` (replace `_initEvents()`)
- Acceptance
  - [ ] Mouse drag, wheel, pinch behaviors identical
  - [ ] `pointerdown/up`, `click`, `move`, `moveend`, `zoom` events fire identically

Phase 2 — Tiles → TilePipeline

- [ ] Create `tiles/TilePipeline.ts` (class)
- [ ] Integrate: combine `tiles/{queue, cache, loader, prefetch}`
- [ ] Constructor DI: `gl`, limits, idle gating, templating (`tiles/source`)
- [ ] Methods: `enqueue`, `process`, `cancelUnwanted`, `clear`, `dispose`, optional `pin/unpin`
- [ ] Replace direct calls in `GTMap` with pipeline methods
- Acceptance
  - [ ] Load pacing and idle gating match baseline
  - [ ] Prefetch behaves the same; no thrash; LRU bound respected

Phase 3 — Render → MapRenderer + Graphics

- [ ] Create `gl/Graphics.ts` (class) to own GL context + programs
- [ ] Create `render/MapRenderer.ts` (class) from `render/frame.ts`
- [ ] Constructor DI: `Graphics`, `ScreenCache`, `RasterRenderer`
- [ ] Method: `render(viewState, tilePipeline)` with same ordering/alpha
- [ ] Replace `_render()` with renderer call
- Acceptance
  - [ ] Visual parity (tiles, alpha fades, seams) across zoom levels
  - [ ] No new GL warnings; FPS stable

Phase 4 — Zoom → ZoomController

- [ ] Create `core/ZoomController.ts` (class) from `core/zoom.ts`
- [ ] Methods: `startEase`, `step`, `applyAnchoredZoom`, `reset`
- [ ] Own `_zoomAnim` and easing params; expose necessary hooks
- [ ] Wire controller into InputController + MapRenderer (anchor math)
- Acceptance
  - [ ] Ease durations/curves unchanged; anchor feel identical

Phase 5 — State & Wiring

- [ ] Introduce `ViewState` (center, zoom, bounds, flags) shared by subsystems
- [ ] `GTMap` constructs and composes: `Graphics`, `ScreenCache`, `RasterRenderer`, `ZoomController`, `TilePipeline`, `InputController`, `MapRenderer`, `EventBus`
- [ ] Ensure `dispose()` cascades cleanup (GL, listeners, textures)
- Acceptance
  - [ ] Full smoke run passes; memory stable across cycles

Phase 6 — Cleanup & Docs

- [ ] Remove obsolete wrappers left in `GTMap`
- [ ] Update docs with class diagram and module map
- [ ] Tighten lint (consider import/order as error) and run final pass

Notes & Risks

- Avoid circular dependencies; move shared types to `types.ts` where helpful.
- Prefer constructor DI over importing `map` to keep classes testable.
- Keep stateless helpers as functions; don’t force classes for math.

Validation per Phase (Manual)

- [ ] Pan/zoom/pinch smoothness; anchor consistency
- [ ] Screen cache fade/sharpness matches baseline
- [ ] Tile seams: none at integer zooms
- [ ] Idle gating: interaction doesn’t starve baseline loads
- [ ] Console: no GL or runtime warnings

Strategy & Recommendations (Adopted)

- Dependency Injection: inject time/clock, loaders/fetch, GL handles, and schedulers into classes for testability and flexibility.
- Side‑effects at edges: keep IO (GL, DOM, network, timers) in thin adapters; keep core logic pure/synchronous where practical.
- Small interfaces: prefer minimal method surfaces (e.g., `enqueue/process`, `render(view)`, `step(now)`) — avoid God objects.
- Deterministic updates: avoid hidden mutations; either return results or update an explicit `ViewState` passed by reference.
- Replaceable clocks/schedulers: `ZoomController` and `TilePipeline` accept a `now()` provider (and optional scheduler) for reproducible behavior.
- No singletons/statics: allow multiple instances (multiple maps) and straightforward mocking.
- Clear lifecycle: all classes expose `attach()`/`dispose()` (or `init()`/`dispose()`) that are idempotent and deterministic.
- Pure helpers stay pure: math/transforms (projection, anchors, scoring) remain functions for trivial unit testing later.

Expected Impact

- Helps: clearer boundaries, easier refactors, future unit tests without rewrites, safer DI/mocking, predictable lifecycles.
- Risks if overdone: boilerplate, cognitive load, slower iteration, premature abstraction.
- Net: positive — proceed incrementally with pragmatic class boundaries (state/lifecycle in classes; pure helpers as functions).
