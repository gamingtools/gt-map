# Getting Started

## Create a map

```ts
import { GTMap } from '@gtmap';

const container = document.getElementById('map') as HTMLDivElement;
const map = new GTMap(container, {
  image: {
    url: 'https://example.com/maps/hagga-basin.webp',
    width: 8192,
    height: 8192,
  },
  wrapX: false,
  minZoom: 0,
  maxZoom: 5,
  center: { x: 4096, y: 4096 },
  zoom: 2
});
```

## View controls

Use the transition builder for instant or animated changes:

```ts
// Instant
await map.transition().center({ x: 4200, y: 4100 }).zoom(3).apply();

// Animated recenter
await map.transition().center({ x: 5000, y: 3000 }).apply({ animate: { durationMs: 600 } });

// Animated zoom + center
await map.transition().center({ x: 4096, y: 4096 }).zoom(4).apply({ animate: { durationMs: 800 } });
```

## Image source

Provide raster configuration in the constructor via `MapOptions.image`:

```ts
const map = new GTMap(container, {
  image: {
    url: 'https://cdn.example.com/maps/hagga-basin.webp',
    width: 8192,
    height: 8192,
  },
  wrapX: false,
  minZoom: 0,
  maxZoom: 5,
  center: { x: 4096, y: 4096 },
  zoom: 2,
});
```

## Rendering options

```ts
map.setGridVisible(false);
map.setUpscaleFilter('linear'); // default
map.setIconScaleFunction((zoom, min, max) => 1);
map.setFpsCap(60);
// Control auto-resize behavior (enabled by default)
map.setAutoResize(true);

// Background (binary policy): either 'transparent' or solid
// Prefer setting at construction; alpha on colors is ignored
const map2 = new GTMap(container, { backgroundColor: '#0a0a0a' });
// Update at runtime as needed
map.setBackgroundColor('transparent');            // fully transparent viewport
map.setBackgroundColor('#101010');                // solid
map.setBackgroundColor({ r: 16, g: 16, b: 16 });  // solid
```

## Lifecycle

```ts
// One-time load event (after first frame scheduled)
map.events.on('load').each(({ size }) => console.log('loaded', size));

// Debounced resize event with final size and DPR
map.events.on('resize').each(({ size }) => console.log('resized', size));

map.setActive(false, { releaseGL: true });
map.setActive(true);
// When done
map.destroy();

// If you disable auto-resize, call this when container size changes
map.setAutoResize(false);
// ... update container size ...
map.invalidateSize();
```
