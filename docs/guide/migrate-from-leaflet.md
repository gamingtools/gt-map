**Leaflet → GTMap Migration**

- Audience: teams moving from Leaflet 1.9.x to GTMap.
- Scope: pixel CRS maps (game/world images), raster tiles, markers, and basic vectors.
- Assumption: you previously used Leaflet with `L.CRS.Simple` or image-like coordinates.

**Key Differences**
- Coordinate system: GTMap is pixel CRS only — positions are `{ x, y }` in image pixels with origin at the top‑left. No geodetic CRS.
- Continuous zoom: GTMap supports fractional zoom; tiles are filtered/resampled smoothly.
- Typed API: strongly typed events and entities; no implicit `any` usage.
- Content model: entity-based layers (`map.markers`, `map.vectors`) with typed events per entity and per layer.
- Built-ins vs ecosystem: GTMap is minimal — no built-in controls, popups/tooltips, clustering, or plugins. Compose in your app.

---

**Leaflet Compat Helper (Optional)**

To ease migration, import a small wrapper that exposes Leaflet-like methods over a GTMap instance (pixel CRS semantics):

```ts
import { GTMap, leafletCompat } from '@gtmap';

const map = new GTMap(el, { /* tileSource, center, zoom, ... */ });
const Lx = leafletCompat(map);

await Lx.setView([y, x], z);
await Lx.flyTo([y, x], z, { duration: 0.5 });
await Lx.fitBounds([[y0, x0], [y1, x1]], 16);

const icon = Lx.addIcon({ iconUrl: '/pin.png', iconSize: [24, 24], iconAnchor: [12, 12] });
const m = Lx.addMarker([y, x], { icon });

Lx.on('move', ({ view }) => console.log(view.center, view.zoom));
```

The compat layer maps common Leaflet calls (setView, panTo, flyTo, fitBounds, addIcon/Marker/Polyline/Polygon/Circle) to typed GTMap APIs without introducing `any`.

---

**Map & Tiles**

Leaflet

```ts
// HTML: <div id="map"></div>
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: 0,
  maxZoom: 5,
});

// Image pyramid/tiles
const tiles = L.tileLayer('https://example.com/tiles/{z}/{x}_{y}.webp', {
  tileSize: 256,
  noWrap: true,
});
tiles.addTo(map);

// Initial view (lat, lng) — often pixel-like with CRS.Simple
map.setView([4096, 4096], 3);
```

GTMap

```ts
import { GTMap } from '@gtmap';

const el = document.getElementById('map')!; // container element

const map = new GTMap(el, {
  tileSource: {
    url: 'https://example.com/tiles/{z}/{x}_{y}.webp',
    tileSize: 256,
    sourceMinZoom: 0,
    sourceMaxZoom: 5,
    mapSize: { width: 8192, height: 8192 },
    wrapX: false,
  },
  minZoom: 0,
  maxZoom: 5,
  center: { x: 4096, y: 4096 },
  zoom: 3,
});
```

Notes

- Leaflet’s `L.tileLayer` options map to `tileSource` in `GTMap`.
- `mapSize` is the base image size (at native resolution). It is required by GTMap to compute zooms precisely.
- Horizontal world wrap: Leaflet uses `noWrap`; GTMap uses `wrapX` (default `false` for finite images).

---

**Coordinates: Leaflet CRS.Simple → GTMap**

- GTMap uses `{ x, y }` pixel coordinates with origin at top‑left and `y` increasing downward.
- In many Leaflet CRS.Simple setups, code uses `[y, x]` pairs (sometimes with negative `y` depending on projection usage). The practical migration:
  - If you used markers at Leaflet positions like `L.marker([y, x])` with `y` measured from the top, use `map.addMarker(x, y, ...)` in GTMap.
  - If your Leaflet coordinates used negative y (e.g., `[ -y, x ]`), drop the minus in GTMap and pass `{ x, y }` as‑is.
- Quick sanity checks:
  - Top‑left: Leaflet `[0, 0]` → GTMap `{ x: 0, y: 0 }`.
  - Bottom‑right: Leaflet `[H, W]` (or `[-H, W]` depending on your setup) → GTMap `{ x: W, y: H }`.

---

**View Controls**

Leaflet

```ts
map.setView([y, x], z);
map.panTo([y, x]);
map.flyTo([y, x], z, { duration: 0.5 });
map.fitBounds([[y0, x0], [y1, x1]], { padding: [16, 16] });
```

GTMap

```ts
// Instant set (single commit)
await map.transition().center({ x, y }).zoom(z).apply();

// Animate with easing/duration
await map.transition()
  .center({ x, y })
  .zoom(z)
  .apply({ animate: { durationMs: 500 } });

// Fit bounds in pixels with padding
await map.transition()
  .bounds({ minX, minY, maxX, maxY }, { top: 16, right: 16, bottom: 16, left: 16 })
  .apply();
```

Additional utilities

- `setWrapX(on: boolean)`: horizontal infinite panning.
- `setMaxBoundsPx(bounds | null)`: constrain panning to pixel bounds.
- `setMaxBoundsViscosity(0..1)`: resistive edges like Leaflet’s viscosity.
- `setWheelSpeed(number)`: zoom sensitivity.
- `invalidateSize()`: recompute after container layout changes.

---

**Markers & Icons**

Leaflet

```ts
const icon = L.icon({
  iconUrl: '/pin.png',
  iconRetinaUrl: '/pin@2x.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});
L.marker([y, x], { icon }).addTo(map);
```

GTMap

```ts
// Register an icon definition once
const pin = map.addIcon({
  iconPath: '/pin.png',
  x2IconPath: '/pin@2x.png',
  width: 24,
  height: 24,
  anchorX: 12,
  anchorY: 12,
});

// Add a marker (typed, entity-based)
const m = map.addMarker(1200, 900, { icon: pin, size: 1.0, rotation: 0, data: { id: 'poi-7' } });

// Per-marker events
m.events.on('click').each((e) => {
  console.log('clicked', e.marker.id, e.marker.world);
});
```

Notes

- `size` scales the icon; use `setIconScaleFunction((z) => ...)` for zoom-responsive scaling.
- Rotation is clockwise degrees.
- Markers live in the `map.markers` layer; use `map.markers.clear()`, `map.markers.getAll()`, and layer events.

---

**Vectors**

Leaflet

```ts
L.polyline([[y0, x0], [y1, x1]], { color: 'red', weight: 2 }).addTo(map);
L.polygon([[y0, x0], [y1, x1], [y2, x2]], { fill: true }).addTo(map);
L.circle([yc, xc], { radius: 40, color: '#0ff' }).addTo(map);
```

GTMap

```ts
import type { VectorStyle } from '@gtmap';

const style: VectorStyle = { color: 'red', weight: 2 };

// Add a vector entity (polyline/polygon/circle)
const v = map.addVector({ type: 'polyline', points: [ { x: x0, y: y0 }, { x: x1, y: y1 } ], style });

// Update geometry later
v.setGeometry({ type: 'circle', center: { x: xc, y: yc }, radius: 40, style: { color: '#0ff' } });
```

Notes

- Vectors live in `map.vectors` with the same layer/event model as markers.
- Styles map closely to Leaflet’s: `color`, `weight`, `opacity`, `fill`, `fillColor`, `fillOpacity`.

---

**Events**

Leaflet

```ts
map.on('move', (e) => {/* ... */});
map.on('zoomend', (e) => {/* ... */});
map.on('click', (e) => {
  const { latlng, originalEvent } = e;
});
```

GTMap (typed streams)

```ts
// Subscribe
map.events.on('move').each(({ view }) => {
  console.log(view.center, view.zoom);
});

map.events.on('click').each(({ x, y, world, view, originalEvent }) => {
  console.log('screen', x, y, 'world', world);
});

// One-shot
await map.events.once('zoomend');
```

Marker-level events

```ts
const mk = map.addMarker(100, 100);
mk.events.on('pointerenter').each((e) => {/* hover */});
mk.events.on('click').each((e) => {/* activate */});
```

Map-level marker events also exist: `'markerenter' | 'markerleave' | 'markerclick' | 'markerdown' | 'markerup' | 'markerlongpress'`.

---

**Bounds & Wrap**

- Leaflet `noWrap` ↔ GTMap `wrapX: false` (default).
- Leaflet `setMaxBounds(bounds)` ↔ GTMap `setMaxBoundsPx({ minX, minY, maxX, maxY })`.
- Leaflet viscosity ↔ GTMap `setMaxBoundsViscosity(0..1)`.

---

**Notable Differences / Gaps**

- Popups/Tooltips: Not built-in. Compose your own DOM overlays and position them using marker events (payload contains `screen: { x, y }` for hovered/clicked markers) or your own world→screen mapping.
- Controls: None included. Add your own UI around the map.
- Dragging markers: No built-in drag; implement with marker `pointerdown/move/up` events and update marker positions.
- Clustering/Heatmaps: Not included.
- CRS: No Web Mercator/geo projection — pixel CRS only.

---

**Full Example: Minimal Migration**

Leaflet (before)

```ts
const map = L.map('map', { crs: L.CRS.Simple, minZoom: 0, maxZoom: 5 });
L.tileLayer('https://cdn.example.com/tiles/{z}/{x}_{y}.webp', { tileSize: 256, noWrap: true }).addTo(map);
map.setView([2048, 2048], 3);

const icon = L.icon({ iconUrl: '/pin.png', iconSize: [24, 24], iconAnchor: [12, 12] });
L.marker([2200, 2100], { icon }).addTo(map).on('click', () => console.log('clicked'));

L.polyline([[2000, 2000], [2300, 2200]], { color: 'red', weight: 2 }).addTo(map);
```

GTMap (after)

```ts
import { GTMap } from '@gtmap';

const map = new GTMap(document.getElementById('map')!, {
  tileSource: {
    url: 'https://cdn.example.com/tiles/{z}/{x}_{y}.webp',
    tileSize: 256,
    sourceMinZoom: 0,
    sourceMaxZoom: 5,
    mapSize: { width: 8192, height: 8192 },
    wrapX: false,
  },
  minZoom: 0,
  maxZoom: 5,
  center: { x: 2048, y: 2048 },
  zoom: 3,
});

const pin = map.addIcon({ iconPath: '/pin.png', width: 24, height: 24, anchorX: 12, anchorY: 12 });
const mk = map.addMarker(2100, 2200, { icon: pin });
mk.events.on('click').each(() => console.log('clicked'));

map.addVector({ type: 'polyline', points: [ { x: 2000, y: 2000 }, { x: 2300, y: 2200 } ], style: { color: 'red', weight: 2 } });
```

---

**Troubleshooting**

- Tiles don’t match zoom levels → Verify `sourceMinZoom`, `sourceMaxZoom`, and `mapSize` match your pyramid.
- Marker positions are flipped vertically → If you used negative `lat` in Leaflet CRS.Simple, remove the minus and pass `{ x, y }` in GTMap.
- Bounds feel rigid or bouncy → Adjust `setMaxBoundsViscosity(0..1)`.
- Wheel zoom too fast/slow → Tweak `setWheelSpeed(number)`.

---

**Cheat Sheet**

| Task | Leaflet (1.9.x) | GTMap |
|---|---|---|
| Create map | `L.map(el, { crs: L.CRS.Simple, minZoom, maxZoom })` + `L.tileLayer(url, { tileSize, noWrap }).addTo(map)` | `new GTMap(el, { tileSource: { url, tileSize, sourceMinZoom, sourceMaxZoom, mapSize, wrapX }, minZoom, maxZoom, center, zoom })` |
| Set view | `map.setView([y, x], z)` | `await map.transition().center({ x, y }).zoom(z).apply()` |
| Pan | `map.panTo([y, x])` | `await map.transition().center({ x, y }).apply()` |
| Fly | `map.flyTo([y, x], z, { duration })` | `await map.transition().center({ x, y }).zoom(z).apply({ animate: { durationMs: duration*1000 } })` |
| Fit bounds | `map.fitBounds([[y0, x0], [y1, x1]], { padding })` | `await map.transition().bounds({ minX, minY, maxX, maxY }, { top, right, bottom, left }).apply()` |
| Wrap control | `noWrap: true/false` | `setWrapX(false/true)` or via `tileSource.wrapX` |
| Max bounds | `map.setMaxBounds(bounds)` | `map.setMaxBoundsPx({ minX, minY, maxX, maxY })` + `setMaxBoundsViscosity(0..1)` |
| Wheel zoom speed | `scrollWheelZoom.disable()/enable()` (or options) | `setWheelSpeed(number)` (no hard disable; see notes) |
| Resize | `map.invalidateSize()` | `map.invalidateSize()` |
| Events | `map.on('move', h)` / `map.once('zoomend', h)` | `map.events.on('move').each(h)` / `await map.events.once('zoomend')` |
| Icon | `L.icon({ iconUrl, iconRetinaUrl, iconSize, iconAnchor })` | `map.addIcon({ iconPath, x2IconPath, width, height, anchorX, anchorY })` |
| Marker add | `L.marker([y, x], { icon }).addTo(map)` | `map.addMarker(x, y, { icon })` |
| Marker events | `marker.on('click', h)` | `marker.events.on('click').each(h)` |
| Vectors | `L.polyline([...])`, `L.polygon([...])`, `L.circle(...)` | `map.addVector({ type, ... })` |
| Clear content | `layerGroup.clearLayers()` | `map.clearMarkers()`, `map.clearVectors()` |

Notes

- Wheel disable: GTMap does not provide a built-in wheel-zoom disable. Workarounds: intercept the `wheel` event on the container and `preventDefault`, or temporarily `map.setActive(false)` to suspend input entirely.
- Double-click zoom: GTMap does not implement double-click zoom; there’s nothing to disable.

---

**DOM Overlays (Popups/Tooltips)**

GTMap does not ship popups/tooltips. Compose your own positioned DOM overlay and drive it with typed events.

Example: place a tooltip near a marker on click and keep it anchored on move/zoom

```ts
const container = document.getElementById('map')!;
const tip = document.createElement('div');
tip.className = 'tip';
tip.style.position = 'absolute';
tip.style.pointerEvents = 'auto';
tip.style.display = 'none';
container.appendChild(tip);

const mk = map.addMarker(2100, 2200);

function showAt(screen: { x: number; y: number }, text: string) {
  tip.textContent = text;
  tip.style.left = `${Math.round(screen.x)}px`;
  tip.style.top = `${Math.round(screen.y)}px`;
  tip.style.display = 'block';
}

let visibleForId: string | null = null;

mk.events.on('click').each((e) => {
  visibleForId = e.marker.id;
  showAt(e.screen, `Marker ${e.marker.id}`);
});

// Reposition on map movement if visible
map.events.on('move').each(() => {
  if (!visibleForId) return;
  const m = map.markers.get(visibleForId);
  if (!m) { tip.style.display = 'none'; visibleForId = null; return; }
  // Quick projection: use the map’s internal world→screen via markerenter payloads,
  // or store last known screen in your own state (simplest approach shown here: hide on move)
  tip.style.display = 'none';
  visibleForId = null;
});
```

CSS stub

```css
.tip {
  transform: translate(-50%, -100%);
  background: #111;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font: 12px/1.3 system-ui, sans-serif;
}
```

Notes

- For persistent anchoring, compute screen coordinates from world positions. A simple approach is to listen to map-level marker hover payloads (which include `screen`) or extend the renderer with a `worldToScreen(x, y)` helper if needed.
- Keep overlay inside the container; clamp or offset as desired.

---

**World→Screen Helper**

GTMap does not currently expose a public projection helper, but the math is straightforward for pixel CRS. If your tile pyramid’s top level is `sourceMaxZoom` (aka `imageMaxZ`), then CSS pixels per world pixel is `2^(zoom - imageMaxZ)`.

Typed helpers

```ts
type Point = { x: number; y: number };

function worldToScreen(
  world: Point,
  view: { center: Point; zoom: number },
  viewport: { width: number; height: number },
  imageMaxZ: number,
  wrap?: { enabled: boolean; periodX: number }
): Point {
  const s = Math.pow(2, view.zoom - imageMaxZ);
  let dx = world.x - view.center.x;
  if (wrap?.enabled) {
    const p = wrap.periodX;
    // choose nearest wrapped copy along X
    dx = ((dx + p / 2) % p + p) % p - p / 2;
  }
  const dy = world.y - view.center.y;
  return {
    x: viewport.width / 2 + dx * s,
    y: viewport.height / 2 + dy * s,
  };
}

function screenToWorld(
  screen: Point,
  view: { center: Point; zoom: number },
  viewport: { width: number; height: number },
  imageMaxZ: number
): Point {
  const s = Math.pow(2, view.zoom - imageMaxZ);
  return {
    x: view.center.x + (screen.x - viewport.width / 2) / s,
    y: view.center.y + (screen.y - viewport.height / 2) / s,
  };
}
```

Usage to keep a DOM element anchored to a world point

```ts
const container = document.getElementById('map')!;
const overlay = document.createElement('div');
overlay.className = 'overlay';
overlay.style.position = 'absolute';
container.appendChild(overlay);

const anchor: Point = { x: 2100, y: 2200 };
const imageMaxZ = 5; // equals your tileSource.sourceMaxZoom
const wrap = { enabled: false, periodX: 8192 }; // periodX equals mapSize.width if wrapX is enabled

function updatePosition() {
  const rect = container.getBoundingClientRect();
  const view = { center: map.getCenter(), zoom: map.getZoom() };
  const screen = worldToScreen(anchor, view, { width: rect.width, height: rect.height }, imageMaxZ, wrap);
  overlay.style.left = `${Math.round(screen.x)}px`;
  overlay.style.top = `${Math.round(screen.y)}px`;
}

// Initial position and keep in sync on movement/zoom/resize
updatePosition();
map.events.on('move').each(updatePosition);
map.events.on('zoom').each(updatePosition);
map.events.on('resize').each(updatePosition);
```

CSS stub

```css
.overlay { transform: translate(-50%, -100%); }
```

Notes

- `imageMaxZ` is your `tileSource.sourceMaxZoom`. At that zoom, 1 world pixel equals 1 CSS pixel.
- For `wrapX: true`, pass `wrap = { enabled: true, periodX: mapSize.width }` to place the overlay near the current center.
- This uses CSS pixels and container size; it naturally handles DPR differences.

---

**Further Reading**

- GTMap API Reference: `docs/api/README.md` (open locally in this repo)
- Quick Index: `docs/API_OVERVIEW.md`
- Guides: `docs/guide/map.md`, `docs/guide/markers.md`, `docs/guide/events.md`, `docs/guide/transitions.md`
