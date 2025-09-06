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
```

## Marker events

Each Marker has its own event map:

- `click`: `{ x, y, marker }`
- `enter`: `{ x, y, marker }`
- `leave`: `{ x, y, marker }`
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
