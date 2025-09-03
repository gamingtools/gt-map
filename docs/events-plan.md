# Events API Plan (Milestone)

Goals

- Chainable, promise-like streams for map interactions and view changes.
- Lightweight, zero-dep, O(1) unsubscribe; pooled objects later for perf.
- Additive API under `GTMap.events` without breaking existing public surface.

Initial Surface (scaffolded)

- `map.events.on(name)` → stream
  - Operators: `filter`, `map`, `tap`, `throttle`, `debounce`, `once`, `take`, `takeUntil`, `each`
  - Helpers: `first()`, `toAsyncIterator()`, `EventStream.merge([...])`
- `map.events.when(name)` → Promise of first event payload

Event Names (initial)

- `pointerdown`, `pointerup`, `click`
- `move`, `moveend`
- `zoom`, `zoomend`

Payload Shape (tentative)

- `{ center: {lng, lat}, zoom }` for view events
- `{ x, y, center, zoom }` for pointer/click events (x,y in CSS pixels)

Examples

```ts
// Wait for move end
map.events.when('moveend').then(() => console.log('move ended'));

// Log clicks, throttled
map.events
  .on('click')
  .throttle(200)
  .each(({ x, y }) => console.log(x, y));

// Async iterator for zoom events
for await (const z of map.events
  .on('zoom')
  .map((e) => e.zoom)
  .toAsyncIterator()) {
  console.log('zoom', z);
}
```

Next Steps

- Pool payload objects; integrate per-layer event picking in renderer.
- Add `merge`, `once`, `takeUntil` patterns to examples.
- Document performance notes and unsub best practices.
