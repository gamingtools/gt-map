# Migration Cheatsheet — Leaflet 1.9.4 → GT.L

This cheatsheet shows common Leaflet patterns and their equivalents using the GT.L facade.

## Map

Leaflet:
```js
const map = L.map('map', { dragging: true, inertia: true }).setView([0, 0], 2);
```

GT.L:
```js
const map = GT.L.map('map', { dragging: true, inertia: true });
map.setView([0, 0], 2);
```

## Tile Layer

Leaflet:
```js
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
```

GT.L:
```js
GT.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
```

## Marker + Icon

Leaflet:
```js
const icon = L.icon({ iconUrl: '/marker.png', iconRetinaUrl: '/marker@2x.png', iconSize: [25, 41] });
L.marker([0, 0], { icon }).addTo(map);
```

GT.L:
```js
const icon = GT.L.icon({ iconUrl: '/marker.png', iconRetinaUrl: '/marker@2x.png', iconSize: [25, 41] });
GT.L.marker([0, 0], { icon }).addTo(map);
```

## Events

Leaflet:
```js
map.on('moveend', () => console.log('moved'));
```

GT.L:
```js
map.on('moveend', () => console.log('moved'));
```

Advanced (optional): use the native stream API for chains/throttling:
```ts
// (Native) mapFacade.__impl.events.on('move').throttle(200).each(...)
```

## Dragging / Scroll wheel

Leaflet:
```js
map.dragging.disable();
map.scrollWheelZoom.disable();
```

GT.L:
```js
map.dragging.disable();
map.scrollWheelZoom.disable();
```

## Zooming helpers

Leaflet:
```js
map.setView([lat, lng], z, { animate: true });
```

GT.L:
```js
map.setView([lat, lng], z, { animate: true });
```

## Performance Tunables (native)

Use the native facades for performance and modern features:
```ts
const native = (map as any).__impl; // GTMap facade under the hood
native.tiles.setOptions({ maxTiles: 768, maxInflightLoads: 12 });
native.tiles.setPrefetch({ enabled: true, baselineLevel: 1 });
native.setInertiaOptions({ inertia: true, inertiaDeceleration: 3200 });
```

Notes
- GT.L markers are GPU icons (not DOM elements). Popups/tooltips are provided as DOM overlays in Phase 2.
- Some Leaflet APIs (vectors, geoJSON, controls) are planned per the Leaflet compatibility plan and may be partial in early versions.
