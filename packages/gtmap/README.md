# GTMap

[![npm](https://img.shields.io/npm/v/@gaming.tools/gtmap)](https://www.npmjs.com/package/@gaming.tools/gtmap)
[![license](https://img.shields.io/npm/l/@gaming.tools/gtmap)](https://github.com/gamingtools/gt-map/blob/main/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@gaming.tools/gtmap)](https://bundlephobia.com/package/@gaming.tools/gtmap)

High-performance, pixel-CRS WebGL map renderer with a small, typed API. Optimized for image/scan maps (no geodetic lat-lng). Ships a thin facade (`GTMap`) over a fast WebGL core: input, rendering, and caches.

Status: early-stage, pre-release -- everything is subject to change before the initial release (including public APIs and behavior). No heavy runtime deps; pure TypeScript and Web APIs.

## Install

```bash
npm install @gaming.tools/gtmap
```

## Quick Start

HTML

```html
<div id="map"></div>
<style>
  #map {
    width: 100%;
    height: 480px;
  }
  /* Ensure the container has a concrete size */
</style>
```

TypeScript

```ts
import { GTMap, ImageVisual, type MapOptions } from '@gaming.tools/gtmap';

const container = document.getElementById('map') as HTMLDivElement;

const map = new GTMap(container, {
  mapSize: { width: 8192, height: 8192 },
  wrapX: false,
  minZoom: 0,
  maxZoom: 5,
  center: { x: 4096, y: 4096 },
  zoom: 3,
  backgroundColor: '#0a0a0a',
} satisfies MapOptions);
```

## Architecture

GTMap uses a facade pattern. The root `GTMap` class exposes four sub-objects:

| Facade | Access | Purpose |
|--------|--------|---------|
| **view** | `map.view` | Center, zoom, setView, bounds, coordinate transforms, icon scaling |
| **layers** | `map.layers` | Layer creation, attachment, removal, per-layer display |
| **display** | `map.display` | Grid overlay, upscale filter, FPS cap, background color, zoom snap |
| **input** | `map.input` | Wheel speed, inertia options |

Events are accessed via `map.events`.

## Layers

Content is organized into typed layers. Layers must be created via `map.layers`, then attached with a z-order:

### Tile Layer

Backed by a `.gtpk` tile pyramid (binary pack containing the full tile set).

```ts
const tiles = map.layers.createTileLayer({
  packUrl: 'https://cdn.example.com/tiles/map.gtpk',
  tileSize: 256,
  sourceMinZoom: 0,
  sourceMaxZoom: 5,
});
map.layers.addLayer(tiles, { z: 0 });
```

### Interactive Layer

Owns markers with WebGL hit-testing (click, hover, drag).

```ts
const layer = map.layers.createInteractiveLayer();
map.layers.addLayer(layer, { z: 1 });

// Add markers using Visual templates
const mk = layer.addMarker(2048, 2048, {
  visual: new ImageVisual('/icons/pin.png', 32),
  scale: 1.25,
  data: { name: 'POI A', category: 'shop' },
});
```

### Static Layer

Owns vector shapes (polylines, polygons, circles).

```ts
const vectors = map.layers.createStaticLayer();
map.layers.addLayer(vectors, { z: 2 });

vectors.addPolygon(
  [{ x: 100, y: 100 }, { x: 200, y: 100 }, { x: 150, y: 200 }],
  { color: '#00ff00', fill: true, fillColor: 'rgba(0,255,0,0.2)' },
);
vectors.addPolyline(
  [{ x: 0, y: 0 }, { x: 300, y: 150 }],
  { color: '#ff0000', weight: 2 },
);
vectors.addCircle({ x: 500, y: 500 }, 80, { color: '#0000ff' });
```

### Clustered Layer

Groups nearby markers into clusters with optional boundary polygons.

```ts
import { clusterIconSize } from '@gaming.tools/gtmap';

const clusters = map.layers.createClusteredLayer({
  clusterRadius: 80,
  minClusterSize: 2,
  clusterIconSizeFunction: clusterIconSize('exponentialLog', { max: 1.8 }),
  boundary: { fill: true, fillColor: 'rgba(0,100,255,0.1)', showOnHover: true },
});
map.layers.addLayer(clusters, { z: 3 });

// Add markers the same way as interactive layers
clusters.addMarker(1000, 1000, { visual: myVisual, data: { type: 'ore' } });
```

### Layer Display

```ts
map.layers.setLayerVisible(layer, false);
map.layers.setLayerOpacity(layer, 0.5);
map.layers.setLayerZ(layer, 10);
map.layers.removeLayer(layer);
```

## Visual System

Visuals are rendering templates that define appearance. They are separate from entities (Marker) which define position and interactivity.

```ts
import {
  ImageVisual, CircleVisual, RectVisual,
  TextVisual, SvgVisual, HtmlVisual, SpriteVisual,
} from '@gaming.tools/gtmap';

// Bitmap icon
const pin = new ImageVisual('/icons/pin.png', 32);
pin.anchor = 'bottom-center';

// Colored dot
const dot = new CircleVisual(6, { fill: '#ff0000', stroke: '#000' });

// Text label
const label = new TextVisual('Town', { fontSize: 12, color: '#fff', strokeColor: '#000', strokeWidth: 2 });

// SVG with color override
const icon = new SvgVisual('<svg>...</svg>', 24, { fill: '#ff0000', shadow: { blur: 4 } });

// Sprite atlas sub-region
const atlas = await layer.loadSpriteAtlas(atlasUrl, descriptor);
const sword = new SpriteVisual(atlas, 'sword', 32);
```

## View Controls

```ts
// Instant jump
await map.view.setView({ center: { x: 4096, y: 4096 }, zoom: 3 });

// Animated fly-to
await map.view.setView({
  center: { x: 5000, y: 3000 },
  zoom: 4,
  animate: { durationMs: 800, easing: easings.easeInOutCubic },
});

// Fit bounds with padding
await map.view.setView({
  bounds: { minX: 1000, minY: 1000, maxX: 7000, maxY: 7000 },
  padding: 40,
  animate: { durationMs: 600 },
});

// Fit a set of points
await map.view.setView({
  points: [{ x: 500, y: 500 }, { x: 6000, y: 6000 }],
  padding: { top: 20, right: 20, bottom: 20, left: 200 },
});

// Cancel an in-flight animation
map.view.cancelView();
```

### Coordinate Transforms (world -> pixels)

When your data lives in an external coordinate space (e.g., Unreal units), map it into image pixel coordinates:

```ts
// Initialize with world bounds
map.view.setCoordBounds({
  minX: -457200, minY: -457200,
  maxX: 355600, maxY: 355600,
});

// Convert world -> pixel
const p = map.view.translate(wx, wy);
layer.addMarker(p.x, p.y, { visual: myVisual });

// Optional orientation transforms
const q = map.view.translate(wx, wy, 'flipVertical');
```

## Events

GTMap exposes a typed event surface. Subscribe with `events.on(name, handler)` or await a one-shot with `events.once(name)`.

### Map Events

```ts
map.events.on('move', ({ view }) => {
  console.log('center', view.center, 'zoom', view.zoom);
});

map.events.on('click', (e) => {
  console.log('screen', e.x, e.y, 'world', e.world);
});

map.events.on('load', ({ size, view }) => {
  console.log('ready', size.width, size.height, size.dpr);
});
```

Full event list: `load`, `resize`, `move`, `moveend`, `zoom`, `zoomend`, `pointerdown`, `pointermove`, `pointerup`, `mousedown`, `mousemove`, `mouseup`, `click`, `dblclick`, `contextmenu`, `frame`, `markerenter`, `markerleave`, `markerclick`, `markerdown`, `markerup`, `markerlongpress`.

### Marker Events

```ts
mk.events.on('click', (e) => {
  console.log('clicked marker', e.marker.id, 'at', e.x, e.y);
});
mk.events.on('pointerenter', (e) => { /* hover in */ });
mk.events.on('pointerleave', (e) => { /* hover out */ });
```

Supported: `click`, `tap`, `longpress`, `pointerdown`, `pointerup`, `pointerenter`, `pointerleave`, `positionchange`, `remove`.

Pointer metadata (when available):

```ts
{
  device: 'mouse' | 'touch' | 'pen',
  isPrimary: boolean,
  buttons: number,
  modifiers: { alt, ctrl, meta, shift },
}
```

## Markers

Markers are entities anchored at pixel coordinates with position, style, data, and typed events.

```ts
// Move (emits positionchange)
mk.moveTo(1100, 980);

// Update style
mk.setStyle({ scale: 1.5, rotation: 30, opacity: 0.8 });

// Attach user data
mk.setData({ name: 'POI B', category: 'viewpoint' });

// Animated transition
await mk.transition()
  .moveTo(2000, 1500)
  .setStyle({ scale: 2.0, rotation: 90 })
  .apply({ animate: { durationMs: 400 } });

// Snapshot
const data = mk.toData(); // { id, x, y, data }

// Remove via collection
layer.markers.remove(mk);
// or clear all
layer.clearMarkers();
```

### EntityCollection

Layers expose typed collections (`layer.markers`, `layer.vectors`) with add/remove/filter/find:

```ts
layer.markers.setFilter<MyPOI>((m) => m.data.category === 'resource');
layer.markers.setFilter(null); // clear
layer.markers.setVisible(false);

const rares = layer.markers.find<MyPOI>((m) => m.data.tier === 'rare');
const count = layer.markers.count();

layer.markers.events.on('entityadd', ({ entity }) => console.log('added', entity.id));
```

## Display & Rendering

```ts
// Grid overlay
map.display.setGridVisible(true);

// Upscale filtering for zoomed-in tiles
map.display.setUpscaleFilter('bicubic'); // 'auto' | 'linear' | 'bicubic'

// FPS cap
map.display.setFpsCap(60);

// Background color
map.display.setBackgroundColor('#0a0a0a');
map.display.setBackgroundColor({ r: 16, g: 16, b: 16 });

// Zoom snap threshold (0-1, default 0.4)
map.display.setZoomSnapThreshold(0.4);
```

### Icon Scaling

Control marker icon size relative to zoom:

```ts
// World-like scaling around Z=3
map.view.setIconScaleFunction((z) => Math.pow(2, z - 3));

// Step behavior
map.view.setIconScaleFunction((z) => (z < 2 ? 0.75 : z < 4 ? 1.0 : 1.25));

// Reset to default (screen-fixed)
map.view.resetIconScale();
```

### Bounds & Pan Constraints

```ts
map.view.setMaxBoundsPx({ minX: 0, minY: 0, maxX: 8192, maxY: 8192 });
map.view.setMaxBoundsViscosity(0.15); // 0-1
map.view.setClipToBounds(true);
map.view.setWrapX(false);
```

### Input

```ts
map.input.setWheelSpeed(0.5);
map.input.setInertiaOptions({
  inertia: true,
  inertiaDeceleration: 3000,
  inertiaMaxSpeed: 1500,
});
```

## Lifecycle

```ts
// Suspend/resume rendering
map.suspend({ releaseGL: true });
map.resume();

// Full teardown
map.destroy();

// Manual resize
map.view.invalidateSize();
map.view.setAutoResize(true); // enabled by default
```

## Easings

```ts
import { easings } from '@gaming.tools/gtmap';

await map.view.setView({
  center: { x: 4096, y: 4096 },
  zoom: 4,
  animate: { durationMs: 700, easing: easings.easeInOutCubic },
});
```

Available: `linear`, `easeInQuad`, `easeOutQuad`, `easeInOutQuad`, `easeInCubic`, `easeOutCubic`, `easeInOutCubic`, `easeOutExpo`.

## Types & Bundles

- ESM bundle: `dist/index.js`
- Type declarations: `dist/index.d.ts` plus `dist/api/**`, `dist/entities/**`
- Import from `@gaming.tools/gtmap` (deep imports are not part of the public API)

## License

MIT (c) gaming.tools
