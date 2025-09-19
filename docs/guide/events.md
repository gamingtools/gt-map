# Events

GTMap exposes a small, typed event system. You subscribe with `events.on(name).each(handler)` or await one occurrence with `events.once(name)`.

## Map events

Common events (see full list in API docs):

```ts
map.events.on('move').each(({ view }) => {
  console.log('center', view.center, 'zoom', view.zoom);
});

map.events.on('zoomend').each(({ view }) => {
  console.log('zoomend', view.zoom);
});

map.events.on('click').each((e) => {
  console.log('screen', e.x, e.y, 'world', e.world);
});

// Pointer events with device-agnostic coordinates and world hit
map.events.on('pointerdown').each((e) => {
  // e: { x, y, world, view, originalEvent }
});
map.events.on('pointermove').each((e) => {/* ... */});
map.events.on('pointerup').each((e) => {/* ... */});

// Mouse events include optional marker hits when hover is enabled
map.events.on('mousemove').each((e) => {
  // e.markers?: Array<{ marker: { id, index, world, size, rotation?, data? }, icon: { id, iconPath, width, height, anchorX, anchorY } }>
  if (e.markers?.length) {
    // Hovering over one or more markers
  }
});

// Map-level marker events (device-agnostic)
map.events.on('markerenter').each((e) => {/* top-most hover enter */});
map.events.on('markerleave').each((e) => {/* hover leave */});
map.events.on('markerclick').each((e) => {/* click on marker */});
map.events.on('markerdown').each((e) => {/* pointer down on marker */});
map.events.on('markerup').each((e) => {/* pointer up on marker */});
map.events.on('markerlongpress').each((e) => {/* ~500ms hold */});
```

### Lifecycle

Two lifecycle events are available:

- `load`: fired once after the first frame is scheduled (map is initialized)
- `resize`: fired after a debounced resize completes (final size + DPR)

```ts
map.events.on('load').each(({ size, view }) => {
  console.log('map ready', size.width, size.height, size.dpr, view);
});

map.events.on('resize').each(({ size }) => {
  console.log('resized to', size.width, size.height, 'dpr', size.dpr);
});

// Frame loop hook (stats reported by renderer when available)
map.events.on('frame').each(({ now, stats }) => {
	// stats?.fps, stats?.frame, etc.
});
```

## Event Reference

Map events

| Event        | Payload keys                                  | Notes |
|--------------|-----------------------------------------------|-------|
| `load`       | `size{width,height,dpr}`, `view`               | Fired once after first frame is scheduled |
| `resize`     | `size{width,height,dpr}`, `view`               | Debounced final size + DPR |
| `move`       | `view`                                         | During panning/zooming when center changes |
| `moveend`    | `view`                                         | After movement settles |
| `zoom`       | `view`                                         | During zoom changes |
| `zoomend`    | `view`                                         | After zoom settles |
| `pointerdown`| `x`, `y`, `world`, `view`, `originalEvent`     | Device‑agnostic pointer |
| `pointermove`| `x`, `y`, `world`, `view`, `originalEvent`     | Device‑agnostic pointer |
| `pointerup`  | `x`, `y`, `world`, `view`, `originalEvent`     | Device‑agnostic pointer |
| `mousedown`  | `x`, `y`, `world`, `view`, `originalEvent`     | Mouse only |
| `mousemove`  | `x`, `y`, `world`, `view`, `originalEvent`, `markers?` | `markers?` present only when idle hover is enabled |
| `mouseup`    | `x`, `y`, `world`, `view`, `originalEvent`     | Mouse only |
| `click`      | `x`, `y`, `world`, `view`, `originalEvent`     | Emitted on mouse click (derived from pointer) |
| `frame`      | `now`, `stats?`                                | Per‑frame hook for HUD/diagnostics |
| `markerenter`| marker event payload                           | Top‑most hover enter (map-level) |
| `markerleave`| marker event payload                           | Hover leave (map-level) |
| `markerclick`| marker event payload                           | Click on marker (map-level) |
| `markerdown` | marker event payload                           | Pointer down on marker (map-level) |
| `markerup`   | marker event payload                           | Pointer up on marker (map-level) |
| `markerlongpress` | marker event payload                      | ~500ms hold (map-level) |

Marker events (per marker via `m.events`)

| Event            | Payload keys                               | Notes |
|------------------|--------------------------------------------|-------|
| `click`          | `x`, `y`, `marker`, `pointer?`             | Device‑agnostic activate |
| `tap`            | `x`, `y`, `marker`, `pointer?`             | Touch alias for click |
| `longpress`      | `x`, `y`, `marker`, `pointer?`             | ~500ms touch hold |
| `pointerdown`    | `x`, `y`, `marker`, `pointer?`             | |
| `pointerup`      | `x`, `y`, `marker`, `pointer?`             | |
| `pointerenter`   | `x`, `y`, `marker`, `pointer?`             | Top‑most hover enter |
| `pointerleave`   | `x`, `y`, `marker`, `pointer?`             | Hover leave or hide/remove |
| `positionchange` | `x`, `y`, `dx`, `dy`, `marker`             | Emitted by `moveTo` |
| `remove`         | `marker`                                   | Emitted on removal |

Layer events (via `map.markers.events` or `map.vectors.events`)

| Event             | Payload keys              |
|-------------------|---------------------------|
| `entityadd`       | `entity`                  |
| `entityremove`    | `entity`                  |
| `clear`           | `{}`                      |
| `visibilitychange`| `visible: boolean`        |

## Marker events

Each Marker instance exposes its own typed event map via `m.events`:

- `click`: `{ x, y, marker, pointer? }`
- `tap`: `{ x, y, marker, pointer? }` (touch alias for click)
- `longpress`: `{ x, y, marker, pointer? }` (~500ms touch hold)
- `pointerdown`: `{ x, y, marker, pointer? }`
- `pointerup`: `{ x, y, marker, pointer? }`
- `pointerenter`: `{ x, y, marker, pointer? }`
- `pointerleave`: `{ x, y, marker, pointer? }`
- `positionchange`: `{ x, y, dx, dy, marker }`
- `remove`: `{ marker }`

```ts
const m = map.addMarker(100, 200);
m.events.on('click').each(({ x, y }) => console.log('clicked', x, y));
m.events.on('positionchange').each(({ dx, dy }) => console.log('moved', dx, dy));
```

## Layer events

Layers emit lifecycle and visibility changes:

- `entityadd`: `{ entity }`
- `entityremove`: `{ entity }`
- `clear`: `{}`
- `visibilitychange`: `{ visible }`

```ts
map.markers.events.on('entityadd').each(({ entity }) => console.log('added', entity.id));
map.markers.setVisible(false);
```
