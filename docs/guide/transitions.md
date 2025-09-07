# Transitions (Builder API)

Design and usage guide for a chainable, single‑commit transition builder. This document is both a developer guide and the implementation plan for the camera/view transitions, with extensibility to markers and layers.

## Goals

- Compose view changes declaratively (center, zoom, offset, etc.)
- Single commit point with optional animation options
- No throws; always resolve a Promise with a clear status
- Interrupt policy for overlapping transitions on the same target
- Type‑safe, minimal public surface; future‑proof for bounds/anchor/padding

## Quick Start

```ts
// Instant change (no animation)
await map.transition()
  .center({ x: 4096, y: 4096 })
  .zoom(4)
  .apply(); // { status: 'instant' }

// Animated change
await map.transition()
  .center({ x: 5000, y: 3000 })
  .zoom(5)
  .apply({ animate: { durationMs: 600 } }); // { status: 'animated' }

// Offset from the current center (animated)
await map.transition()
  .offset(200, -100)
  .apply({ animate: { durationMs: 400 } });
```

## Public Surface

Entry

- `map.transition(): ViewTransition` — returns a single‑use builder. No side effects until `apply`.

Types

```ts
export type Easing = (t: number) => number; // t in [0,1] -> [0,1]

export interface AnimateOptions {
  durationMs: number;
  easing?: Easing;       // default: easeInOut
  delayMs?: number;      // default: 0
  interrupt?: 'cancel' | 'join' | 'enqueue'; // default: 'cancel'
}

export interface ApplyOptions {
  animate?: AnimateOptions; // omit for instant apply
}

export type ApplyStatus = 'instant' | 'animated' | 'canceled';

export interface ApplyResult {
  status: ApplyStatus;
}

export interface ViewTransition {
  center(p: { x: number; y: number }): this;
  zoom(z: number): this; // fractional allowed
  offset(dx: number, dy: number): this; // applied at commit time
  bounds(b: { minX: number; minY: number; maxX: number; maxY: number }, padding?: number | { top: number; right: number; bottom: number; left: number }): this;
  points(list: Array<{ x: number; y: number }>, padding?: number | { top: number; right: number; bottom: number; left: number }): this;
  markers(list?: Array<Marker | string>, padding?: number | { top: number; right: number; bottom: number; left: number }): this; // fit current or provided markers
  // Future‑ready (optional next): anchor(a: 'center' | { x: number; y: number }): this;

  apply(opts?: ApplyOptions): Promise<ApplyResult>; // never throws; resolves with status
  cancel(): void; // idempotent; resolves in‑flight apply with { status: 'canceled' }
}
```

Behavior

- Side‑effect free until `apply`.
- Last setter wins: the last `center/zoom/offset` in the chain is used.
- `offset(dx,dy)` is applied at commit time to the chosen center:
  - If `center(...)` was provided in the chain → offset is added to that center.
  - Otherwise → offset is added to the current center at commit.
- Clamping at commit:
  - `zoom` is clamped to `[minZoom, maxZoom]`.
  - `center` is clamped to the finite world when `wrapX=false`; shortest wrap when `wrapX=true`.
- No‑op: if neither center nor zoom changes, apply resolves `{ status: 'instant' }` immediately.

Animation & Interrupts

- Instant path (no `animate`):
  - Applies immediately. Emits `move`/`zoom` once with final state.
  - Resolves `{ status: 'instant' }`.
- Animated path (`apply({ animate })`):
  - Emits `move`/`zoom` during, then `moveend`/`zoomend` at the end.
  - Resolves `{ status: 'animated' }` upon completion.
  - Interrupt policy when another animated apply starts for the same target:
    - `'cancel'` (default): stop current animation immediately; its in‑flight Promise resolves `{ status: 'canceled' }`; new animation starts.
    - `'join'`: retarget current animation to the new end state, keeping elapsed easing phase; existing Promise resolves `{ status: 'animated' }` when the retargeted motion finishes.
    - `'enqueue'`: start new animation after current completes; both Promises resolve `{ status: 'animated' }` in sequence.
- External interruptions (e.g., user pan/zoom) are treated as a new transition with `'cancel'` policy for the view: in‑flight Promise resolves `{ status: 'canceled' }`.

Events & Promise Resolution

- If both center and zoom changed: resolve after both `moveend` and `zoomend` fire.
- If only center changed: resolve after `moveend`.
- If only zoom changed: resolve after `zoomend`.
- If `cancel()` was called or a newer transition interrupted with `'cancel'`: resolve `{ status: 'canceled' }` without waiting for end events.

Examples

Instant set

```ts
await map.transition().center({ x: 2048, y: 2048 }).zoom(3).apply();
```

Animated zoom only

```ts
await map.transition().zoom(5).apply({ animate: { durationMs: 500 } });
```

Animated recenter with offset

```ts
await map.transition()
  .center({ x: 3000, y: 3000 })
  .offset(-200, 120)
  .apply({ animate: { durationMs: 400, easing: t => t*t*(3-2*t) } });
```

Fit bounds (with padding)

```ts
await map.transition()
  .bounds({ minX: 1000, minY: 1200, maxX: 2400, maxY: 2200 }, 24)
  .apply({ animate: { durationMs: 500 } });
```

Fit a set of points

```ts
const points = [ { x: 1200, y: 900 }, { x: 2200, y: 1800 }, { x: 1800, y: 1400 } ];
await map.transition()
  .points(points, { top: 16, right: 16, bottom: 24, left: 16 })
  .apply({ animate: { durationMs: 500 } });
```

Fit markers

```ts
// All markers on the layer
await map.transition().markers(undefined, 16).apply({ animate: { durationMs: 500 } });

// Specific markers by instance or id
const list = [ markerA, markerB, 'm_abcd123' ];
await map.transition().markers(list, { top: 16, right: 24, bottom: 16, left: 24 }).apply({ animate: { durationMs: 600 } });
```

Easing helpers

```ts
import { easings } from '@gtmap'; // or '@gaming.tools/gtmap'

await map.transition()
  .center({ x: 4096, y: 4096 })
  .zoom(4)
  .apply({ animate: { durationMs: 700, easing: easings.easeInOutCubic } });
```

Cancellation

```ts
const tx = map.transition().center({ x: 5000, y: 3000 }).zoom(5);
const done = tx.apply({ animate: { durationMs: 800 } });
// later (user navigates elsewhere)
tx.cancel();
const { status } = await done; // 'canceled'
```

## Extensibility (Future Builders)

Marker transitions (example shape)

```ts
interface MarkerTransitionBase {
  apply(opts?: ApplyOptions): Promise<ApplyResult>;
  cancel(): void;
}

interface MarkerTransition extends MarkerTransitionBase {
  to(p: { x: number; y: number }): this;
  by(dx: number, dy: number): this;
  size(s: number): this;
  rotation(deg: number): this;
}

// Usage
await marker.transition().to({ x: 1200, y: 900 }).apply({ animate: { durationMs: 250 } });
```

Layer transitions (example; depends on renderer capabilities)

```ts
interface LayerTransition extends MarkerTransitionBase {
  visible(on: boolean): this;   // instant by default; can animate if supported
  opacity(a: number): this;     // requires renderer support
}
```

## Implementation Plan

Phase 1 (View only)

- Facade: add `transition(): ViewTransition` to `GTMap`.
- Implement builder as a lightweight object capturing targets and options.
- Instant path: translate to one call to internal setters (current `setView` logic) in a single commit.
- Animated path: translate to one call to internal `flyTo({ center?, zoom?, durationMs })`.
- Wire Promise resolution to map events:
  - Subscribe to `moveend`/`zoomend` as needed; unsubscribe on resolve.
  - On `cancel()` or interrupt `'cancel'`, resolve `{ status: 'canceled' }` and unsubscribe.
- Interrupt coordination:
  - Maintain per‑target transition registry (for map view, a single slot) storing current in‑flight controller with policy.
  - Apply `'cancel'` by invoking internal cancel on zoom/pan controllers (existing impl has pan/zoom anims) and resolving `{ status: 'canceled' }` for the previous Promise.
  - `'join'` can retarget internal controllers to new end values while preserving elapsed time; optional for phase 1 (fallback to `'cancel'` if not feasible initially, but keep the type and document behavior).
  - `'enqueue'` can chain via a simple queue; optional for phase 1.

Phase 2+

- Add optional `anchor`, `bounds`, `padding` when the underlying impl supports it.
- Add `marker.transition()` using rAF interpolation over `marker.moveTo` / `marker.setStyle`.
- Add `layer.transition()` once opacity/time‑based visibility changes are supported by the renderer.

Type Safety & Docs

- No `any`/`unknown` in public surfaces.
- Promise never rejects; resolve with `{ status }` only.
- Document single‑use builder semantics; calling `apply` twice returns the same Promise (or resolves immediately) and `cancel` is idempotent.

## Migration Notes (Breaking Change Option)

If you choose to remove legacy methods (`setCenter`, `setZoom`, `setView`, `panTo`, `flyTo`) in a major release:

- Replace:
  - `setView({ center, zoom })` → `await map.transition().center(center).zoom(zoom).apply()`
  - `panTo(center, ms)` → `await map.transition().center(center).apply({ animate: { durationMs: ms } })`
  - `flyTo({ center, zoom, durationMs })` → `await map.transition().center(center).zoom(zoom).apply({ animate: { durationMs } })`
- Keep event semantics identical; only the entry point changes.
