# Map Object

The `GTMap` instance is the main interface to control the view, configure the raster image, add content, and subscribe to events. This page summarizes its properties, methods, and common options.

## Create

```ts
import { GTMap } from '@gtmap';

const el = document.getElementById('map') as HTMLDivElement;
const map = new GTMap(el, {
  image: {
    url: 'https://example.com/maps/hagga-basin.webp',
    width: 8192,
    height: 8192,
  },
  wrapX: false,
  minZoom: 0,
  maxZoom: 5,
  center: { x: 4096, y: 4096 },
  zoom: 3,
  autoResize: true,
  backgroundColor: 'transparent',
  fpsCap: 60
});
```

## Properties

- `markers: EntityCollection<Marker>` — collection for marker entities; add/remove/clear and observe collection events.
- `vectors: EntityCollection<Vector>` — collection for simple geometry overlays.
- `events` — read‑only event surface: `events.on(name).each(h)` and `events.once(name)`; see the Events guide for payloads.
- `getCenter(): { x: number; y: number }` — current center in world pixels.
- `getZoom(): number` — current zoom level (can be fractional).
- `getPointerAbs(): { x: number; y: number } | null` — last pointer world position or `null` if outside.

## View Controls

Use the Transition Builder:

```ts
// Instant apply
await map.transition().center({ x: 2048, y: 2048 }).zoom(4.25).apply();

// Animated apply
await map.transition().center({ x: 4096, y: 4096 }).zoom(4).apply({ animate: { durationMs: 800 } });
```

## Image Source

Pass image configuration in the constructor via `MapOptions`:

```ts
const map = new GTMap(el, {
  image: {
    url: 'https://cdn.example.com/maps/hagga-basin.webp',
    width: 8192,
    height: 8192,
  },
  wrapX: false,
  minZoom: 0,
  maxZoom: 5,
});
```

## Rendering & Behavior

```ts
// Grid overlay and image upscaling
// Note: grid is disabled by default; enable when needed
map.setGridVisible(true);
map.setUpscaleFilter('linear'); // 'auto' | 'linear' | 'bicubic' (default: 'linear')

// Control icon scale vs. zoom (1 = screen‑fixed size)
map.setIconScaleFunction((zoom, min, max) => 1);

// Performance & sizing
map.setFpsCap(60);
map.setAutoResize(true);
map.setBackgroundColor('transparent');       // or hex string or { r,g,b }
map.invalidateSize(); // call if autoResize is off and container size changed

// Input tuning
map.setWheelSpeed(0.2);
```

### Loading behavior (spinner)

On initialization, the map shows a small spinner and blocks rendering and input until the full image is decoded and uploaded. You can customize the spinner in the constructor via `spinner`:

```ts
const map = new GTMap(el, {
  image: { url: '...', width: 8192, height: 8192 },
  spinner: {
    size: 40,            // px, default 32
    thickness: 4,        // px, default 3
    color: '#2563eb',    // active arc, default rgba(0,0,0,0.6)
    trackColor: 'rgba(0,0,0,0.15)', // default rgba(0,0,0,0.2)
    speedMs: 800         // rotation period, default 1000
  }
});
```

## Content

```ts
// Icons
const pin = map.addIcon({ iconPath: '/assets/pin.png', width: 24, height: 24, anchorX: 12, anchorY: 24 });

// Markers (pixel CRS)
const m = map.addMarker(2048, 2048, { icon: pin, size: 1.25, rotation: 0, data: { name: 'POI' } });
m.events.on('click').each(({ marker }) => console.log('clicked', marker.id));

// Vectors
const v = map.addVector({ type: 'polyline', points: [ { x: 0, y: 0 }, { x: 200, y: 100 } ] });

// Clear
map.clearMarkers();
map.clearVectors();
```

## Method Parameters

View (Transition Builder)

- `transition(): ViewTransition`
  - `center(p: Point): this` — set target center in world pixels
  - `zoom(z: number): this` — set target zoom (fractional allowed; clamped on apply)
  - `offset(dx: number, dy: number): this` — offset applied at commit
  - `bounds(b: { minX; minY; maxX; maxY }, padding?: number | { top; right; bottom; left }): this` — fit a world-rect with optional CSS padding
  - `apply(opts?: { animate?: { durationMs: number; easing?: Easing; delayMs?: number; interrupt?: 'cancel' | 'join' | 'enqueue' } }): Promise<{ status: 'instant' | 'animated' | 'canceled' }>`
  - `cancel(): void` — cancel in‑flight transition (promise resolves `{ status: 'canceled' }`)

Rendering & Behavior

- `setGridVisible(on: boolean): this`
  - `on: boolean` — show/hide the grid overlay
- `setUpscaleFilter(mode: 'auto' | 'linear' | 'bicubic'): this`
  - `mode` — upscaling policy when the image is shown above native resolution
- `setIconScaleFunction(fn: IconScaleFunction | null): this`
  - `fn: (zoom: number, minZoom: number, maxZoom: number) => number | null` — returns scale multiplier (`1` = screen‑fixed size). Pass `null` to restore default behavior (fixed‑size icons).
- `setFpsCap(v: number): this`
  - `v: number` — max frames per second (typical range 15–240)
- `setWheelSpeed(v: number): this`
  - `v: number` — wheel zoom speed multiplier (e.g., `0.1` slow to `1.0` fast)
- `setBackgroundColor(color: string | { r: number; g: number; b: number; a?: number }): this`
  - `color` — `'transparent'` or a solid color (hex string or RGB components). Alpha on colors is ignored.

Lifecycle & Sizing

- `suspend(opts?: SuspendOptions): this`
  - `opts.releaseGL?: boolean` — when suspending, release WebGL context (frees GPU memory)
- `resume(): this`
  - Resume a suspended map, restoring rendering
- `setAutoResize(on: boolean): this`
  - `on: boolean` — enable/disable automatic ResizeObserver + DPR handling
- `invalidateSize(): this`
  - No parameters — remeasure container and resize canvases (use when `autoResize` is off or after programmatic size changes)
- `destroy(): void`
  - No parameters — release all resources and observers

Content

- `addIcon(def: IconDef, id?: string): IconHandle`
  - `def.iconPath: string` — image URL or data URL
  - `def.x2IconPath?: string` — 2x density image URL (optional)
  - `def.width: number` — intrinsic width in pixels
  - `def.height: number` — intrinsic height in pixels
  - `def.anchorX?: number` — anchor X in pixels from left (default `width/2` if omitted by renderer)
  - `def.anchorY?: number` — anchor Y in pixels from top (default depends on renderer)
  - `id?: string` — optional stable id; auto‑generated when omitted
  - Returns: `IconHandle` with `{ id: string }`
- `addMarker(x: number, y: number, opts?: { icon?: IconHandle; size?: number; rotation?: number; data?: unknown }): Marker`
  - `x: number` — world X in pixels
  - `y: number` — world Y in pixels
  - `opts.icon?: IconHandle` — icon handle returned by `addIcon` (defaults to built‑in dot)
  - `opts.size?: number` — scale multiplier (default `1`)
  - `opts.rotation?: number` — clockwise degrees
  - `opts.data?: unknown` — user data attached to marker (forwarded in event payloads)
  - Returns: `Marker` entity with `m.events` and `moveTo/setStyle/setData/toData/remove`
- `addVector(geometry: VectorGeometry): Vector`
  - `geometry.type: 'polyline'|'polygon'|'circle'`
  - `geometry.points: Point[]` (polyline/polygon) or `geometry.center: Point`, `geometry.radius: number` (circle)
  - Returns: `Vector` entity (`setGeometry/remove`)
- `clearMarkers(): this` — remove all markers
- `clearVectors(): this` — remove all vectors

Queries & Properties

- `getCenter(): Point` — current center in world pixels
- `getZoom(): number` — current zoom
- `getPointerAbs(): { x: number; y: number } | null` — last pointer world position, or `null` when outside
- `events: PublicEvents<EventMap>` — `on(name)` and `once(name)` accessors for map events

## Lifecycle

```ts
// Suspend/resume (optionally release GL/VRAM)
map.suspend({ releaseGL: true });
map.resume();

// Cleanup when removing the map
map.destroy();
```

## Events

Subscribe with `map.events.on(name).each(handler)` or await a single occurrence with `map.events.once(name)`.

Common names and highlights:

- Movement: `move`, `moveend`, `zoom`, `zoomend`
- Pointer/mouse: `pointerdown`, `pointermove`, `pointerup`, `mousedown`, `mousemove`, `mouseup`, `click`
- Lifecycle: `load`, `resize`
- Frame hook: `frame` (includes optional `stats`)
- Marker‑derived: hover/click are forwarded to per‑marker event streams; mouse events can include `e.markers?` with hover hits when idle

See the Events guide for payload shapes and examples.

## Options Reference (constructor)

- Image: `image: { url, width, height }` (required)
- View: `center`, `zoom`, `minZoom`, `maxZoom`
- Interaction: `wrapX`, `freePan`, `wheelSpeed`
- Sizing & perf: `autoResize`, `fpsCap`, `screenCache` (internal cache control)
- Background: `backgroundColor` — either `'transparent'` or a solid color; alpha ignored
- Loading: `spinner: { size, thickness, color, trackColor, speedMs }`

Notes

- Pixel CRS only: coordinates are world pixels relative to the base image at native resolution.
- Wrapping: `wrapX` provides infinite horizontal panning when the image seamlessly repeats; keep `false` for finite rasters.
- Background policy: either fully transparent or solid color; colors ignore alpha.
