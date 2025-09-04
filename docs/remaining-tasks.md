# Remaining Tasks (Post-Consolidation)

Status: Phase 1–4 complete; core consolidation done. The items below are deferred and tracked for future polish.

Checklist (Not Implemented)

- Controls:
  - [ ] Scale: display pixel-CRS scale bar.
  - [ ] Layers: toggle base/overlay groups via UI.
- Overlays:
  - [ ] Popup: open/setLatLng + lifecycle.
  - [ ] Tooltip: setLatLng + lifecycle.
  - [ ] ImageOverlay: place image by bounds.
  - [ ] VideoOverlay: place video by bounds.
  - [ ] SVGOverlay: place SVG element by bounds.
- Vectors:
  - [ ] Path API: setStyle/bringToFront/Back/getBounds.
  - [ ] Shapes: Polyline/Polygon/Rectangle/Circle draw and options.
- Handlers:
  - [ ] BoxZoom: drag-to-zoom rectangle.
  - [ ] DoubleClickZoom: zoom toward pointer.
  - [ ] Drag (Map.Drag): Leaflet-style handler parity.
  - [ ] Keyboard: arrow pan, +/- zoom.
  - [ ] TapHold: long-press interactions.
  - [ ] TouchZoom: formal handler (pinch exists but not via L handler).
- Markers:
  - [ ] Dragging: interactive marker move.
  - [ ] Popup/Tooltip bindings: bind/open/close on marker.
  - [ ] zIndexOffset: proper stacking when panes land.
- Panes & Ordering:
  - [ ] Panes: create/get panes, z-index controls.
  - [ ] Layer ordering: deterministic across types.

Housekeeping

- README: add a short Controls section with `L.control().zoom()` and `.attribution()` usage.
- Type surface: verify control option types exported at root (`ControlPosition`, `ZoomControlOptions`, `AttributionControlOptions`) are discoverable in editors.
- Optional typing: tighten event payload types (markers/map streams) and refine `LeafletMapOptions` as needed.

Notes
- WMS and GeoJSON are intentionally out of scope for pixel-CRS maps.
- `docs/svelte/` is for agents only; no public docs changes needed there.
- Keep using `import { L } from '@gtmap'`; `GT.L` remains a legacy alias.
