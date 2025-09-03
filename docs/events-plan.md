# Events API (Current)

Overview

- Chainable, promise-like streams for map interactions and view changes.
- Zero-dependency, O(1) unsubscribe. Exposed under `GTMap.events`.

API Surface

- `map.events.on(name)` → EventStream
  - Operators: `filter`, `map`, `tap`, `throttle`, `debounce`, `once`, `take`, `takeUntil`, `each`
  - Helpers: `first()`, `toAsyncIterator()`, `EventStream.merge([...])`
- `map.events.when(name)` → Promise of first event payload

Event Names (implemented)

- `pointerdown`, `pointerup`
- `move`, `moveend`
- `zoom`, `zoomend`

Payload Shape (implemented)

- View events (`move`, `moveend`, `zoom`, `zoomend`): `{ view }`
  - `view` contains `{ center: { lng, lat }, zoom, minZoom, maxZoom, wrapX }`
- Pointer events (`pointerdown`, `pointerup`): `{ x, y, view }` (x/y in CSS pixels relative to the map container)

Examples

```ts
// Wait for move end
map.events.when('moveend').then(({ view }) => console.log('move ended at', view));

// Track zoom values with throttling
map.events
  .on('zoom')
  .throttle(200)
  .map((e) => e.view.zoom)
  .each((z) => console.log('zoom', z));
```

Notes

- The `click` event is not emitted yet.
- Payloads intentionally carry a `view` object instead of flattening fields.
