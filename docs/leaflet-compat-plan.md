# Leaflet Compatibility Facade — Implementation Plan

This plan outlines a phased, pragmatic Leaflet API compatibility layer (facade) over the existing GTMap implementation. The goal is to provide an easy migration path by exposing familiar Leaflet-style calls while delegating to GTMap’s facades (map.icons, map.tiles, core methods, events).

Namespace
- Instead of the global `L` namespace, the facade will be exposed as `GT.L`.
- Anywhere this document shows `L.map(...)`, `L.marker(...)`, etc., the actual usage will be `GT.L.map(...)`, `GT.L.marker(...)`, etc.

Target audience: app developers migrating off Leaflet without immediate large rewrites.

Notes
- Scope prioritizes the most-used runtime APIs (Map, TileLayer, Marker, Icon, events) first.
- Where GTMap differs in rendering model (GPU tiles/icons vs DOM/SVG), the facade provides equivalent behavior (not identical DOM semantics).
- Version baseline: Leaflet 1.x (current main). If you prefer a specific tag (e.g., v1.9.4), confirm and we’ll pin exactly.

## Phases (High-Level)

Phase 1 — Core (MVP)
- GT.L.map, map options (dragging, inertia, zoom, min/maxZoom, center)
- map.setView, map.getCenter/getZoom
- map.on/off event adapter (move/moveend/zoom/zoomend/click/pointer events)
- GT.L.tileLayer(url, options).addTo(map)
- GT.L.icon, GT.L.marker([lat,lng], { icon }).addTo(map)
- Layer API shell (addTo/remove) for these types

Phase 2 — Common Layers + Controls
- GT.L.layerGroup, GT.L.featureGroup
- GT.L.imageOverlay
- GT.L.popup, GT.L.tooltip (DOM overlay anchored to world pos)
- Basic controls: GT.L.control.zoom, GT.L.control.attribution, GT.L.control.scale (minimal styling)
- map.fitBounds, map.panTo, map.flyTo (easing wrappers)

Phase 3 — Vectors & Advanced
- GT.L.polyline, GT.L.polygon, GT.L.circle, GT.L.rectangle (CPU tessellation + GPU draw or DOM overlay, TBD)
- GT.L.geoJSON (subset: points → markers, lines/polys → vectors)
- Keyboard, box zoom, double-click zoom handlers (optional)
- CRS customization (custom projections) — out of scope short term

Non-Goals (initially)
- Full SVG/Canvas Path API parity (style transitions, dashes, clipping) — deliver reasonable subset later
- WMS/TileLayer.WMS specifics — optional follow-up

## Type & Options Mapping (Selected)

LatLng/LatLngBounds/Point
- Leaflet LatLng = [lat:number, lng:number] | { lat, lng }
- Internal uses { lng, lat }. Facade converts to/from Leaflet ordering.
- Bounds: [[south, west], [north, east]] → project to our {x,y} world via mercator utils when needed.

Map Options (subset)
- center, zoom, minZoom, maxZoom → pass through
- dragging (bool) → enable/disable input attach; if disabled, cancel inertia
- inertia (bool), inertiaDeceleration, inertiaMaxSpeed, easeLinearity → map.setInertiaOptions
- scrollWheelZoom (bool) → gate wheel handler or set wheel speeds to 0
- doubleClickZoom (bool) → optional (Phase 2)
- boxZoom (bool) → optional (Phase 3)
- attributionControl/zoomControl (bool) → create/destroy controls (Phase 2)

TileLayer Options (subset)
- urlTemplate: '{z}/{x}/{y}' → map.setTileSource
- minZoom, maxZoom, tileSize, tms (flipY — optional) → map.setTileSource
- opacity (later), zIndex (N/A initial; draw order is tiles → icons)

Icon/Marker Options
- icon: L.icon({ iconUrl, iconRetinaUrl, iconSize, iconAnchor }) → icons.setDefs types and per-marker size/anchor handling (Phase 1: center anchor; Phase 2: iconAnchor)
- draggable (optional Phase 2): pointer drag to update marker position (CPU, no GPU hit-test)
- popup/tooltip (Phase 2): map overlay DOM

Events (Map)
- move, moveend, zoom, zoomend: map.events → adapter emits callback signature familiar to Leaflet handlers
- click: synthesize from pointerdown/up with small move threshold (e.g., 5 px)
- dragstart, drag, dragend: reuse move/moveend; mark start via onDown

## Detailed API Plan (Object-by-Object)

GT.L (namespace)
- map(container, options) → returns LeafletMap facade
- tileLayer(url, options)
- icon(options)
- marker(latlng, options)
- layerGroup(layers) (Phase 2)
- featureGroup(layers) (Phase 2)
- popup(options) (Phase 2)
- tooltip(options) (Phase 2)
- control.zoom/attribution/scale (Phase 2)
- latLng/latLngBounds/point helpers (simple converters)

LeafletMap (facade over GTMap/MapApi)
- setView(latlng, zoom?, options?) → map.setCenter + map.setZoom (optional easing)
- getCenter() → Leaflet LatLng
- getZoom() → number
- on(name, fn)/off(name, fn) → adapt to map.events (store listeners)
- addLayer(layer)/removeLayer(layer) → layer.addTo(this)/layer.remove()
- dragging.enable()/disable() → attach/detach InputController; cancel inertia on disable
- scrollWheelZoom.enable()/disable() → gate wheel
- options (exposed subset) — read-only snapshot

TileLayer
- new L.tileLayer(url, options)
- addTo(map) → map.setTileSource({ url, minZoom, maxZoom, tileSize, wrapX })
- remove() → (optional) clear cache or revert url
- setUrl(url) → map.setTileSource({ url, clearCache: true })

Icon
- L.icon({ iconUrl, iconRetinaUrl, iconSize, iconAnchor }) → returns handle used by Marker
- Internally, the facade collects icon defs per type and invokes icons.setDefs once (Phase 1: simple type name)

Marker
- new L.marker(latlng, { icon })
- addTo(map) / remove()
- setLatLng(latlng) / getLatLng()
- setIcon(icon)
- openPopup()/bindPopup()/unbindPopup() (Phase 2)

LayerGroup/FeatureGroup (Phase 2)
- new L.layerGroup(layers) — bulk add/remove by forwarding to each child
- new L.featureGroup(layers) — same + shared styling for vectors (when vectors land)

Popup/Tooltip (Phase 2)
- Simple DOM overlays anchored at projected world → screen position; update on move/zoom

Vector Layers (Phase 3)
- Polyline/Polygon/Rectangle/Circle: Project to world and draw via GPU or DOM; begin with CPU culling + stroke/fill; tolerate a subset of style options initially
- GeoJSON: map features to Marker or vector

Controls (Phase 2)
- Zoom control: two buttons; call setZoom +/- 1 with easing
- Attribution: configurable DOM block bottom-right
- Scale: compute meters/pixel at center zoom; simple scale bar

Handlers (opt-in later)
- DoubleClickZoom: dblclick → zoom +1 toward pointer
- BoxZoom: drag with modifier to set bounds → fitBounds (min implementation)
- Keyboard: arrow keys pan, +/- zoom

## Implementation Skeleton

Folder: `packages/gtmap/src/api/leaflet/`
- L.ts (namespace export)
- map.ts (LeafletMap facade class)
- tileLayer.ts, icon.ts, marker.ts
- events.ts (adapter to map.events)
- util.ts (latLng/point converters, threshold click synth)

Wiring
- Export `GT.L` from @gtmap if app opts into compatibility facade.
- `GT.L.map` constructs an internal GTMap facade (MapApi) and returns LeafletMap wrapper.

## Risk & Parity Notes
- DOM vs GPU: Popups/tooltips rely on DOM; markers are GPU. That’s acceptable for most apps; document the difference.
- zIndex/layer ordering: initial ordering is tiles → icons. If needed, add internal ordering keys for icons.
- Performance: The facade should batch marker updates; avoid setting icons.setMarkers per add/remove — maintain a collection and flush once per frame.
- Options parsing: Leaflet has many option aliases; support the common ones initially and warn on ignored keys.

## Testing Plan
- Integration demos mirroring classic Leaflet examples: basic map, markers with custom icons, tile source switch, setView fitBounds, popups.
- Manual checks: drag (screen-locked), inertia, zoom anchor bias, event emissions.
- Stress: thousands of markers; ensure facade batching doesn’t regress perf.

## Next Steps / Inputs Needed
- Confirm Leaflet version to target (e.g., 1.9.4). If you’d like, provide the source you mentioned so we can align names and defaults exactly.
- I can scaffold Phase 1 files and a minimal L.map/L.tileLayer/L.marker working example next.
