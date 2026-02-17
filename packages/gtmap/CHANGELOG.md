# Changelog

## Unreleased (since v0.2.7)

### Layer System (2026-02-16)
- Add multi-layer architecture: `TileLayer`, `InteractiveLayer`, `StaticLayer`, `ClusteredLayer`
- Extract `LayersFacade` (`map.layers`) for creating, attaching, and managing layers
- Per-layer renderers with independent z-order, visibility, and opacity
- Update noframework demo to use the new layer system

### Clustered Layers (2026-02-17)
- `ClusteredLayer` with spatial clustering and cluster icon rendering
- `clusterIconSize()` factory with `linear`, `logarithmic`, `stepped`, `exponentialLog` modes
- Dynamic per-layer ceiling via `maxClusterSize` parameter
- `showOnHover` boundary mode for lazy convex hull rendering
- `ClusterBoundaryOptions` for optional boundary polygon styling
- `getClusters()` for external stats and `ClusterEventData` in marker events
- Cluster performance optimizations (worker-based clustering)

### Visual System (2026-01-20 -- 2026-01-21)
- Add `Visual` base class with typed subclasses: `ImageVisual`, `TextVisual`, `CircleVisual`, `RectVisual`, `SvgVisual`, `HtmlVisual`, `SpriteVisual`
- SVG rendering with fill/stroke overrides and drop shadow
- Text rendering with stroke/outline and font weight/style
- Per-instance `iconScaleFunction` on Visual and Marker
- Anchor presets (`bottom-center`, `top-left`, etc.) and explicit `AnchorPoint`

### Sprite Atlas (2026-02-04)
- `loadSpriteAtlas()` for batch icon loading from atlas images
- `SpriteVisual` for referencing sub-regions of loaded atlases
- Sprite generator demo page
- Canvas-based atlas routing for iOS Safari compatibility

### Tile Pyramid (2026-01-29 -- 2026-02-01)
- GTPK binary tile pack support (single-file tile source)
- Remove HTTP tile URL templates and single-image source
- GTPK-only pipeline with in-memory serving
- Configurable zoom snap threshold for sharper tile selection
- Offscreen FBO to prevent tile flash at reduced opacity
- MapLibre-style dual throttling during interaction
- Time-budgeted mipmap generation

### API Redesign (2026-01-20 -- 2026-02-01)
- Replace `map.transition()` builder with `map.view.setView()` (instant and animated)
- `setView` supports `center`, `zoom`, `bounds`, `points`, `padding`, `offset`, `animate`
- `cancelView()` for in-flight animation cancellation
- Rename `Layer` to `EntityCollection` with typed events
- Add `setFilter<TData>()`, `find<TData>()`, `count<TData>()` with generic data access
- `EntityCollection` events: `entityadd`, `entityremove`, `clear`, `visibilitychange`
- Remove `Decal` entity; simplify Marker/Vector generics
- Facade pattern: `map.view`, `map.layers`, `map.display`, `map.input`

### Fixes
- Fix icon jitter on zoom from double quantization
- Fix resource leaks and hit-testing scale issues
- Fix `display.setUpscaleFilter` not routing to tile renderers
- Fix `createImageBitmap` options breaking Safari iOS
- Fix icon scale not applied during marker transitions
- Fix ImageVisual markers not rendering due to async init race
- Resolve tile pipeline race conditions, memory leaks, and lifecycle bugs
- Fix infinite decode-evict loop causing tile flicker

### Docs & Tooling
- Full JSDoc coverage on public API surface
- TypeDoc markdown generation (`npx typedoc`)
- Rewrite README and CLAUDE.md for current API

---

## v0.2.7 - 2025-09-23

- Progressive preview loading with seamless swap and zero-jank uploads
- Default to linear upscale filtering
- Minor fixes

## v0.2.6 - 2025-09-22

- Spinner-only loading mode (remove progressive preview as default)
- Customizable spinner options (color, size, thickness, speed)
- Block all input until full image ready
- Include marker data in map-level marker events
- Handle NPOT and oversize textures gracefully
- Viewport-prioritized adaptive chunked texture uploads (iOS-safe)
- Coordinate transform API (`setCoordBounds`, `translate`)

## v0.2.5 - 2025-09-21

- Comprehensive type system cleanup (remove `any`/`unknown`, typed events)
- Entity-based events (Marker, Vector, Layer with typed `PublicEvents`)
- Transition builder API (`map.transition().center().zoom().apply()`)
- Alpha-aware marker hit-testing with CORS-safe CPU masks
- Mouse events derived from pointer events with hover marker hits
- Bicubic GPU upscaling for zoomed-in tiles
- Device-pixel snapping for tiles and icons
- Pan inertia with Leaflet-like throw behavior
- Touch pinch-zoom with center anchoring
- Bounds constraints and viscosity
- FPS cap and auto-resize
- WebGL2 instanced marker rendering with ANGLE fallback
- Spatial grid for marker event hit-testing
- Icon deduplication and coalesced fetches
- Keyboard zoom (+/-) and arrow panning
- Easing functions namespace (`easings`)
- Background color (transparent or solid)

## v0.2.0 - 2025-09-06

- Initial public API (`GTMap` class with facade pattern)
- WebGL tile rendering with GTPK tile pyramids
- Pixel CRS only (no Web Mercator)
- Marker and vector overlay rendering
- Typed event system
- Grid overlay
- SvelteKit demo application

## v0.1.0 - 2025-09-02

- Initial scaffold: WebGL tile renderer, pan/zoom, grid overlay
