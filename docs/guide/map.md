# Map Object

The `GTMap` instance is the main interface to control the view, configure tiles, add content, and subscribe to events. This page summarizes its properties, methods, and common options.

## Create

```ts
import { GTMap } from '@gtmap';

const el = document.getElementById('map') as HTMLDivElement;
const map = new GTMap(el, {
  tileUrl: 'https://example.com/tiles/{z}/{x}_{y}.webp',
  tileSize: 256,
  mapSize: { width: 8192, height: 8192 },
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

- `markers: Layer<Marker>` — collection for marker entities; add/remove/clear and observe layer events.
- `vectors: Layer<Vector>` — collection for simple geometry overlays.
- `events` — read‑only event surface: `events.on(name).each(h)` and `events.once(name)`; see the Events guide for payloads.
- `getCenter(): { x: number; y: number }` — current center in world pixels.
- `getZoom(): number` — current zoom level (can be fractional).
- `pointerAbs: { x: number; y: number } | null` — last pointer world position or `null` if outside.

## View Controls

Use the Transition Builder:

```ts
// Instant apply
await map.transition().center({ x: 2048, y: 2048 }).zoom(4.25).apply();

// Animated apply
await map.transition().center({ x: 4096, y: 4096 }).zoom(4).apply({ animate: { durationMs: 800 } });
```

## Tile Source

```ts
map.setTileSource({
  url: 'https://tiles.example.com/{z}/{x}_{y}.webp',
  tileSize: 256,
  sourceMinZoom: 0,           // optional server minimum
  sourceMaxZoom: 5,           // maximum server level
  mapSize: { width: 8192, height: 8192 },
  wrapX: false,               // enable for infinite horizontal panning
  clearCache: true            // flush textures when switching sources
});
```

## Rendering & Behavior

```ts
// Grid overlay and tile upscaling
map.setGridVisible(false);
map.setUpscaleFilter('auto'); // 'auto' | 'linear' | 'bicubic'

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
  - `apply(opts?: { animate?: { durationMs: number; easing?: Easing; delayMs?: number; interrupt?: 'cancel' | 'join' | 'enqueue' } }): Promise<{ status: 'instant' | 'animated' | 'canceled' }>`
  - `cancel(): void` — cancel in‑flight transition (promise resolves `{ status: 'canceled' }`)

Tiles

- `setTileSource(opts: TileSourceOptions): this`
  - `opts.url?: string` — template: `.../{z}/{x}_{y}.ext`
  - `opts.tileSize?: number` — tile size in pixels (default `256`)
  - `opts.sourceMinZoom?: number` — minimum server level (optional)
  - `opts.sourceMaxZoom?: number` — maximum server level
  - `opts.mapSize?: { width: number; height: number }` — base image size at native resolution
  - `opts.wrapX?: boolean` — horizontal world wrap
  - `opts.clearCache?: boolean` — clear existing tile textures on change

Rendering & Behavior

- `setGridVisible(on: boolean): this`
  - `on: boolean` — show/hide the grid overlay
- `setUpscaleFilter(mode: 'auto' | 'linear' | 'bicubic'): this`
  - `mode` — upscaling policy for tiles above source resolution
- `setIconScaleFunction(fn: IconScaleFunction | null): this`
  - `fn: (zoom: number, minZoom: number, maxZoom: number) => number | null` — returns scale multiplier (`1` = screen‑fixed size). Pass `null` to restore default behavior (fixed‑size icons).
- `setFpsCap(v: number): this`
  - `v: number` — max frames per second (typical range 15–240)
- `setWheelSpeed(v: number): this`
  - `v: number` — wheel zoom speed multiplier (e.g., `0.1` slow to `1.0` fast)
- `setBackgroundColor(color: string | { r: number; g: number; b: number; a?: number }): this`
  - `color` — `'transparent'` or a solid color (hex string or RGB components). Alpha on colors is ignored.

Lifecycle & Sizing

- `setActive(on: boolean, opts?: ActiveOptions): this`
  - `on: boolean` — `true` to run, `false` to suspend
  - `opts.releaseGL?: boolean` — when suspending, release WebGL context (frees GPU memory)
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
- `addVectors(vectors: Vector[]) : this` (legacy batch helper)
  - Accepts the same geometries as `addVector` in an array; prefer entity‑based API
- `clearMarkers(): this` — remove all markers
- `clearVectors(): this` — remove all vectors

Queries & Properties

- `getCenter(): Point` — current center in world pixels
- `getZoom(): number` — current zoom
- `pointerAbs: { x: number; y: number } | null` — last pointer world position, or `null` when outside
- `events: PublicEvents<EventMap>` — `on(name)` and `once(name)` accessors for map events

## Lifecycle

```ts
// Activate/suspend (optionally release GL/VRAM)
map.setActive(false, { releaseGL: true });
map.setActive(true);

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

- Tiles: `tileUrl`, `tileSize`, `mapSize`, `minZoom`, `maxZoom`, `wrapX`
- View: `center`, `zoom`
- Sizing & perf: `autoResize`, `fpsCap`, `screenCache` (internal cache control)
- Background: `backgroundColor` — either `'transparent'` or a solid color; alpha ignored
- Prefetch: `{ enabled?, baselineLevel?, ring? }`

Notes

- Pixel CRS only: coordinates are world pixels relative to the base image at native resolution.
- Wrapping: `wrapX` provides infinite horizontal panning for periodic tile sources; keep `false` for finite images.
- Background policy: either fully transparent or solid color; colors ignore alpha.
