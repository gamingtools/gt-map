# Markers

Markers are entities anchored at pixel coordinates (the map uses a pixel CRS). Each marker has an ID, position, style, optional user data, and a typed event stream.

Use the map’s `markers` layer to add/remove markers and to observe layer-level events.

## Creating markers

```ts
// Minimal
const m = map.addMarker(1024, 1024);

// With style and user data
const icon = map.addIcon({ iconPath: '/assets/pin.png', width: 24, height: 24 });
const poi = map.addMarker(2048, 2048, {
  icon,             // Icon handle from addIcon() (optional; default built-in dot)
  size: 1.25,       // Scale multiplier (1 = source icon size)
  rotation: 0,      // Degrees clockwise
  data: { name: 'POI A', category: 'shop' } // Arbitrary user data
});
```

Creation options

- icon: `IconHandle` (from `addIcon`). Defaults to a built-in circle dot.
- size: `number` scale multiplier. Defaults to 1.
- rotation: `number` degrees clockwise. Defaults to 0.
- data: `unknown`. Attached to the marker and included in event payloads.

Icon tips

- Define anchors on icons when registering them so the visual point matches the world position:

```ts
const pin = map.addIcon({ iconPath: '/assets/pin.png', width: 24, height: 24, anchorX: 12, anchorY: 24 });
map.addMarker(2048, 2048, { icon: pin });
```

Notes

- Marker IDs are auto-generated (e.g. `m_...`). Retrieve an existing marker with `map.markers.get(id)`.
- The default icon is provided so markers are visible without any icon setup.
- The `iconType` property reflects the icon id assigned when calling `addIcon` (or `'default'`).

## Properties

- `id: string` — stable identifier.
- `x: number`, `y: number` — current world pixel position (getters).
- `iconType: string` — icon key (matches `IconHandle.id` or `'default'`).
- `size?: number` — scale multiplier (if unset, renderer treats as 1).
- `rotation?: number` — rotation in degrees clockwise.
- `data?: unknown` — opaque user data attached to the marker.

## Methods

```ts
// Move in world pixels; emits `positionchange`
m.moveTo(1100, 980);

// Update style in place (any subset)
m.setStyle({ iconType: icon.id, size: 1.5, rotation: 30 });

// Attach or replace user data (included in event payloads)
m.setData({ name: 'POI B', category: 'viewpoint' });

// Snapshot data used in event payloads
const snapshot = m.toData(); // { id, x, y, data }

// Remove via the layer (recommended)
map.markers.remove(m);
// or clear all
map.markers.clear();
```

Behavior

- `moveTo(x, y)`: updates position and emits `positionchange` with `{ x, y, dx, dy, marker }`.
- `setStyle(...)`: updates visual style and schedules a re-render.
- `setData(data)`: stores arbitrary data and makes it available via events and hit payloads.
- `remove()`: emits `remove` on the marker; `Layer.remove(...)` will also call this internally.

## Events

Subscribe via `m.events.on(name).each(handler)`. Handlers are synchronous; unsubscribe using the function returned by `each`.

Event names and payloads

- `click`: `{ x, y, marker, pointer? }` (device-agnostic activate)
- `tap`: `{ x, y, marker, pointer? }` (touch alias for click)
- `longpress`: `{ x, y, marker, pointer? }` (touch hold, ~500ms)
- `pointerdown`: `{ x, y, marker, pointer? }`
- `pointerup`: `{ x, y, marker, pointer? }`
- `pointerenter`: `{ x, y, marker, pointer? }`
- `pointerleave`: `{ x, y, marker, pointer? }`
- `positionchange`: `{ x, y, dx, dy, marker }`
- `remove`: `{ marker }`

`pointer` metadata (when available):

```ts
{
  device: 'mouse' | 'touch' | 'pen',
  isPrimary: boolean,
  buttons: number,
  pointerId: number,
  pressure?: number,
  width?: number,
  height?: number,
  tiltX?: number,
  tiltY?: number,
  twist?: number,
  modifiers: { alt: boolean; ctrl: boolean; meta: boolean; shift: boolean }
}
```

Coordinates

- `x`, `y` in event payloads for `click`/`pointerenter`/`pointerleave` are screen (CSS‑pixel) coordinates relative to the map container.
- `marker.x`, `marker.y` are world pixel coordinates (the same coordinate space used by `moveTo`).

Examples

```ts
// Basic interactions with device distinction
m.events.on('click').each(({ x, y, marker, pointer }) => {
  if (pointer?.device === 'touch') {
    // tap on touch
  } else if (pointer?.device === 'mouse') {
    // mouse click
  }
});

// Touch actions
m.events.on('tap').each(({ marker }) => openDetails(marker.id));
m.events.on('longpress').each(({ marker }) => showContextMenu(marker.id));

// Drag start/end tracking
m.events.on('pointerdown').each(({ pointer }) => {
  if (pointer?.device === 'mouse' && (pointer.buttons & 1)) {
    // start drag selection
  }
});

m.events.on('positionchange').each(({ dx, dy }) => {
  console.log('moved by', dx, dy);
});

// Filtered subscription (unsubscribe when hidden)
const off = m.events.on('pointerenter').each(() => highlight(m));
// later
off();
```

## Layer interactions

- Add: `map.markers.add(m)` is called internally when you use `map.addMarker(...)`.
- Remove: `map.markers.remove(mOrId)` removes and emits `entityremove` on the layer.
- Visibility: `map.markers.setVisible(false)` hides all markers; `map.markers.visible` reflects state.
- Layer events: `entityadd`, `entityremove`, `clear`, `visibilitychange` (see the Events guide).

## Tips & best practices

- Prefer `map.addMarker(...)` to construct and add in one step.
- Use `setData(...)` for application metadata; it is propagated into event payloads.
- For high-frequency moves, throttle in your handlers with `requestAnimationFrame` if you update UI.
- Remove markers you no longer need via the layer to keep memory tidy.
