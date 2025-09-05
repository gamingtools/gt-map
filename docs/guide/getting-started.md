# Getting Started

## Create a map

```ts
import { GTMap } from '@gtmap';

const container = document.getElementById('map') as HTMLDivElement;
const map = new GTMap(container, {
  tileUrl: 'https://example.com/tiles/{z}/{x}_{y}.webp',
  mapSize: { width: 8192, height: 8192 },
  minZoom: 0,
  maxZoom: 5,
  center: { x: 4096, y: 4096 },
  zoom: 2
});
```

## View controls

```ts
map.setCenter({ x: 4200, y: 4100 });
map.setZoom(3);
map.setView({ center: { x: 2048, y: 2048 }, zoom: 2 });
map.panTo({ x: 5000, y: 3000 }, 600);
map.flyTo({ center: { x: 4096, y: 4096 }, zoom: 4, durationMs: 800 });
```

## Tile source

```ts
map.setTileSource({
  url: 'https://tiles.example.com/{z}/{x}_{y}.webp',
  tileSize: 256,
  sourceMaxZoom: 5,
  wrapX: false
});
```

## Rendering options

```ts
map.setGridVisible(false);
map.setUpscaleFilter('auto');
map.setIconScaleFunction((zoom, min, max) => 1);
map.setFpsCap(60);
```

## Lifecycle

```ts
map.setActive(false, { releaseGL: true });
map.setActive(true);
// When done
map.destroy();
```
