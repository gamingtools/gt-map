# GTMap Internal Split — Detailed Checklist (Living Doc)

Status: WIP (keep this document up to date as we proceed)

## Goals & Guardrails

- [ ] Preserve public API: `GTMap` remains the main class with identical options/behavior.
- [ ] No visual regressions: Pan/zoom/ease feel, screen cache, seams, wrapX, pacing remain unchanged.
- [ ] WebGL posture: Keep current WebGL1 code paths; no shader or GL feature changes in this split.
- [ ] Dev flow: Vite dev server; TypeScript in `packages/gtmap`; minimal diffs, consistent style.

## Milestone 0 — Baseline Snapshot

- [ ] Record current behavior: wheel/pinch, inertia/ease, recenter, grid toggle.
- [ ] Visual checks: no tile seams at integer zooms; stable screen cache during quick zoom drags.
- [ ] Performance note: FPS reading in the demo (rough baseline).
- [ ] Code anchor: Note current `packages/gtmap/src/mapgl.ts` commit hash here.

## Split Plan Overview (no public changes)

- [ ] Extract small, focused internal modules; wire them back into `GTMap`.
- [ ] Keep names/types internal; do not export new public APIs.
- [ ] Move logic, not behavior: copy algorithms verbatim before any improvements.

## Task A — GL Helpers (minimal)

- [x] `gl/program.ts`: compile/link helpers, error logs, safe deletion.
- [x] `gl/quad.ts`: create/bind unit quad VBO; expose draw parameters.
- [x] Wire into `GTMap._initPrograms()` with no shader source changes.
- Acceptance
  - [ ] Tiles render identically; no FPS drop; no GL errors in console.

## Task B — Screen Cache Module

- [x] `render/screenCache.ts`: encapsulate
  - [x] ensureScreenTex (format, DPR sizing)
  - [x] updateScreenCache (copyTexSubImage2D)
  - [x] drawScreenCache (scale/translate; alpha handling; same thresholds)
- [x] Preserve base-zoom lock (`_renderBaseLockZInt`) and DPR equality checks.
- [x] Integrate with `GTMap` render loop at the same call sites.
- Acceptance
  - [ ] No flicker; same sharpness/alpha during zoom; behaves the same under fast wheel/pinch.

## Task C — Tile Pipeline Modules

- [x] `tiles/cache.ts` (LRU)
  - [x] Map of key → {status, tex, w, h, lastUsed, pinned}
  - [x] Eviction logic identical to current `_evictIfNeeded()`
  - [x] Safe deletion of GPU textures on clear/dispose.
- [x] `tiles/queue.ts` (loading + priority)
  - [ ] Inflight limits; `_lastInteractAt` idle gating; `interactionIdleMs`
  - [x] Priority scoring that matches current heuristic (z bias + distance + explicit priority)
  - [x] Cancel/prune of unwanted queued tasks only; keep inflight.
- [x] `tiles/source.ts` (templating + addressing)
  - [x] URL templating `{z}/{x}/{y}`; wrapX handling via `_wrapX`
  - [x] Key generation consistent with `${z}/${x}/${y}`
- [ ] Wire these into `GTMap` without altering timing or fetch paths (ImageBitmap/Image fallback unchanged).
- Acceptance
  - [ ] Prefetch baseline works; LRU bound respected; no load thrash under interaction.

## Task D — Raster Draw Extraction (internal layer)

- [ ] `layers/raster.ts`: draw logic that receives transform + tile set to render
  - [ ] Bind program, uniforms (`u_translate`, `u_size`, `u_resolution`, `u_tex`, `u_alpha`, `u_uv0`, `u_uv1`)
  - [ ] Iterate visible tiles (respect wrapX, bounds) and draw quads
  - [ ] Maintain coverage/ready ratio logic used by screen cache gating
- [ ] `GTMap` constructs and calls raster draw module internally (single instance).
- Acceptance
  - [ ] Visual parity for tiles across all zoom levels; no change in order or blending.

## Task E — Wiring & Parity Pass

- [ ] Replace in-place logic in `GTMap` with calls to the new modules.
- [ ] Keep fields/state that are user-visible (e.g., `center`, `zoom`, pointers) inside `GTMap`.
- [ ] Ensure `requestRender()` still coalesces frames as before.
- [ ] Validate pointer math and world/screen conversions unchanged.
- Acceptance
  - [ ] Full smoke run passes: pan, wheel zoom, pinch zoom, grid toggle, zoom speed slider, recenter, HUD/FPS updates.
  - [ ] No new warnings/errors in console; memory usage stable during pan/zoom cycles.

## Task F — Documentation & Notes

- [ ] Update this checklist with file paths added and any deviations.
- [ ] Add short module headers/comments explaining purpose and constraints.
- [ ] Note any observed edge cases to revisit after the split (but do not change behavior now).

## Validation Checklist (Manual)

- [ ] Tile seams: none at integer zoom boundaries; no bleeding at edges.
- [ ] Screen cache: reuses previous frame during moderate zoom deltas; fades as before.
- [ ] WrapX=false: finite world clamping behaves the same at min zoom.
- [ ] Load pacing: interaction does not block base-level loads; idle prioritizes high-need tiles.
- [ ] Performance: FPS within margin of baseline; no extra GC spikes.

## Out of Scope (for this split)

- [ ] WebGL2 migration (VAOs, instancing, GLSL 300 ES)
- [ ] New layers or public APIs
- [ ] Event system redesign

## Next (After Split)

- [ ] Chainable events API (promise-like operators) under `GTMap.events`.
- [ ] WebGL2 uplift (keeping WebGL1 fallback minimal).
- [ ] Sprite marker layer (instanced), then vector shapes, then HTML overlay.
