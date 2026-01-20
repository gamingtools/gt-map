# Changelog

## v0.2.7 - 2025-09-23

- Loading: progressive preview path with seamless swap; zero-jank uploads; fix preview centering (f0189cc)
- Upscale: default to linear filtering; update docs/examples (
  e03ca9)
- fixes (
  96ce4a)

## v0.2.6 - 2025-09-22

- Docs: update for spinner-only loading + grid default (b9f6048)
- Grid: disable by default (start with grid hidden) (

363118.

- Spinner options: customizable color/size/thickness/speed via MapOptions.spinner (
  62c8db)
- Remove progressive preview path: spinner-only loading is now default (
  2ab129)
- Input gating: block all interactions until full image ready when progressive=false (
  3df80c)
- Loading UX: gate all rendering until full image ready when progressive=false (
  0db74c)
- Events: include marker data in map-level marker events (
  7355f9)
- Loading UX: optional spinner overlay and non-progressive mode (

90049.

- Raster upgrade: handle NPOT + oversize textures gracefully (
  1e1fdc)
- Raster upgrade: viewport-prioritized, adaptive chunked uploads, idle gating (iOS-safe) (
  1c32e0)
- docs: document coordinate transforms (setCoordBounds/translate) with examples; update overview and guide (
  310c54)

## v0.2.5 - 2025-09-21

- docs(API): document icon scaling function semantics and examples; expand TSDocs for IconScaleFunction and setIconScaleFunction (97256e2)
- docs: add Performance notes about preview→full upgrade and incremental texture upload; align examples and expectations (
  b8342c)
- chore: format repository with Prettier and run ESLint (no functional changes) (
  d7ce9a)
- Type hygiene & API cleanup: remove any/unknown, typed events bridge, kebab-case filenames; drop legacy EventBus & deprecated RAF; tighten vector types; safer requestIdleCallback guard; fix imports; typecheck passes (
  a32b3c)
- fix markers (
  c79a4d)
- refactor part-2 (
  a6b4de)
- refactoring part-1 (
  ab7cde)
- initial image (
  7a72c5)
- optimizations (
  82f874)
- Remove remaining tile pipeline references (

329593.

- API: add setTileLoadDebounce and setPrefetchOptions on GTMap; Demo HUD: controls for debounce and prefetch (
  97e63a)
- Dev: debounce zoomend measurement and ignore <50ms duplicates in tile-load trace (
  e9550a)
- Dev: add console trace for first tile load after zoomend (diagnostics) (
  9cc48f)
- Docs: add Leaflet→GTMap migration guide and world→screen helper (
  a8593e)
- HUD: split move vs rotate toggles; fix WebGL2 instanced icon rotation; remove demo marker persistence; add marker transition builder (
  de9082)
- icons: eliminate jitter by snapping TL always and quantizing center/size to device pixels in both instanced and non-instanced paths (
  df6283)
- render: fix idle LOD handling and remove alpha-0 enqueue; keep backfill; opaque overlay gating + per-level filter hysteresis to prevent darkening/flicker (
  47b260)
- docs: regenerate API docs and update READMEs/guides; add early-stage disclaimer (
  097afb)
- Docs: regenerate API with grouped sections and wrap/bounds links (
  a614a9)
- Public API: generic marker data + grouped docs (
  05d69e)
- Icons: split atlas and mask builder (
  77e02a)
- Events: extract EventBridge from mapgl (
  c82c20)
- Core: extract AutoResizeManager and integrate (
  10a34f)
- Core: extract PanController and integrate (
  f0ecb4)
- Naming: standardize TypeScript filenames to kebab-case (
  fcde3b)
- Tiles: coverage-aware deferral during interaction; only start new loads when viewport coverage (<95%) needs them; otherwise render with existing ancestors and resume once idle (
  0ac837)
- Tiles: clamp deferral comparison to effective base zoom (min(viewerZ, imageMaxZ)) so deferral still applies when viewer zoom exceeds source max (
  131d48)
- Loader: add cancelUnwanted(wanted) to abort in-flight and queued tiles not needed; wire from mapgl cancelUnwantedLoads() (
  b795fa)
- Tiles: defer high-Z fetch during interaction if ancestor tiles (up to 3 levels) are present; keep rendering with existing tiles and resume loads when less busy (
  51a4c9)
- IsIdle (
  c61578)
- Icons: reduce pan jitter by snapping TL to device pixels when iconScale≈1 (fixed-size icons); keep unsnapped for scaling icons to prevent shimmer on zoom (
  a29117)
- Breaking: require tileSource in MapOptions and validate in constructor; make TileSourceOptions fields required (url, tileSize, mapSize, sourceMinZoom/Max); update demos and guides; improve error messages for invalid configs (
  a47379)
- Map init: set tile source in constructor to configure sourceMaxZoom; fix vector style passthrough in \_flushVectors; update Svelte demo to init via constructor and add vectors individually; restore maxZoom=10 (

456675.

- API docs: enrich ViewTransition JSDoc (methods, examples, behavior) and regenerate docs for better transition coverage (
  1c8fe7)
- chore(docs): regenerate TypeDoc with markdown + overview; hide internals; update overview links; export missing types (
  ea1c7d)
- docs(api): export event maps and payload types (EventMap, MarkerData, VectorGeometry, MarkerEventMap, VectorEventMap, LayerEventMap, PointerMeta, etc.) for TypeDoc coverage and consumer typing (
  37582d)
- Finalize type cleanup: remove remaining 'as any' and add comments/shims; fix pointer meta typing and event overload casts; typed idle callbacks (
  c25f4e)
- More 'as any' cleanup: typed mask build/hit info, event adapter casts narrowed, tile loader typed; requestIdleCallback shim; remove remaining stray property errors (
  ea906d)
- Reduce 'as any' usage: typed pointer meta; remove backgroundColor cast; type-safe fetch/createImageBitmap/texImage2D; add requestIdleCallback shims; narrow event adapter casts with comments (

846310.

- Fix: remove stray assignment to removed \_markerIds in mapgl.setMarkers (
  8afc78)
- Fix TS errors: remove stray started assignment; relax EventedEntity constraint; remove unused \_markerIds and guard id mapping in marker set; add zoom getters already implemented (
  65ed27)
- Fix TS typings: remove unused import; add zoom accessors to MapImpl and impl; relax TypedEventBus constraint; include marker id in MarkerInput; remove unused flag; clamp fitBounds via impl getters (
  f8938b)
- Events: add typed MarkerEvents/VectorEvents/LayerEvents/MapEvents with documented names; update entities and map to use them; maintain overloads for on(event, handler) (
  3178c4)
- Events API: add overload on(event, handler) for PublicEvents; implement in map, entities, and layer to improve IntelliSense and ergonomics (
  36357d)
- Events typing: remove string index signatures from event maps to restore literal key IntelliSense; add TSDoc descriptions (
  c346e2)
- Transitions: remove markers(...) builder for now; update docs and README accordingly (
  8e440a)
- Transitions: export easings; add points() and markers() fit utilities; plumb easing through zoom/pan; docs updated (
  1b2479)
- Icons: stop snapping tlWorld for icons to eliminate jitter when iconScaleFunction varies with zoom (
  37843a)
- Transitions: add bounds(...) to ViewTransition with fit logic; update docs (
  74608c)
- Transitions: add chainable view builder API; remove legacy view methods; update demos/docs; implement interrupt policies and cancel-instant (
  d9ea71)
- fix mouse enter leave for markers (
  6d6dc8)
- Viewport background: transparent-or-solid policy + docs (
  9fdbf4)
- update readme (
  377d3d)
- chore(packaging, versioning): scoped package @gaming.tools/gtmap, add auto versioning, bundle JS, emit public .d.ts only, include README/LICENSE, add release scripts and cleanup (
  b3fb33)
- chore(release): gtmap v0.2.0 (
  29d189)
- Lint & format (
  df1665)
- feat(map): background color plumbing (Graphics.init alpha, adaptive grid palette); finalize event forwarding and types (
  131eaa)
- feat(map): default transparent background; docs: add backgroundColor usage and runtime update examples (
  554e4d)
- chore: remove legacy map-level markerEvents helper and export (
  f71845)
- feat(events): add pointerdown/up, tap, longpress for markers; update docs (
  ca11cc)
- feat(events): add device-aware pointer metadata; rename marker enter/leave to pointerenter/pointerleave\n\n- MarkerEventMap now includes pointer meta on pointer-derived events\n- GTMap forwards impl marker events with pointer metadata and new names\n- Docs: update marker events section with pointer meta and usage (
  b5ff2e)
- feat(map): add load/resize events; improve resize stability\n\n- Add load and resize events to EventMap and emit points\n- Debounced trailing resize; attach auto-resize after first frame\n- Snap CSS sizes to integers and hide overflow to avoid flicker/scrollbars\n- Fix screen cache texture reallocation on size changes\n- Add Windows repair script (win-repair-node.ps1) for clean install/rebuild (

619100.

- feat(resize): add autoResize option with debounced ResizeObserver and setAutoResize() API\n\n- autoResize in public and internal MapOptions (default true)\n- Debounced container ResizeObserver + window resize listener\n- Public GTMap.setAutoResize(on) to toggle at runtime\n- Cleanup observers on destroy() (
  70f250)
- feat(events): introduce entity-based events and entities\n\n- Add Marker, Vector, Layer classes with typed PublicEvents\n- Refactor GTMap to expose layers and per-entity events\n- Wire internal marker events to per-marker events\n- Remove legacy addMarkers in favor of per-entity API\n- Keep map.events read-only (on/once); hide public emit\n- Avoid any/unknown on public surface (
  80a6ad)
- Events: include originalEvent in marker events; expose marker.events.on API; minor demo adjustments (
  2f1cf3)
- Add per-marker event helpers: onMarker/onMarkerData/createMarkerEventProxy\n\n- New API under packages/gtmap/src/api/markerEvents.ts\n- Re-exported from api/index.ts for convenient imports\n- Usage: onMarker(map, id, 'markerclick', cb) or createMarkerEventProxy(map, id).on(...) (
  b6fd2a)
- Mouse events: derive from pointer events, emit exactly once per action, and enrich with markers (
  84b6cb)
- Mouse events: include markers hit under cursor when hover is enabled (
  b9aeb7)
- Markers: add user 'data' payload (any|null) and surface in marker events (
  ca6dac)
- Clicks: fallback to AABB if mask not yet available\n\n- Restore click capture before deferred masks are built; once masks exist, alpha is enforced\n- Keeps hover using AABB+alpha where available (
  33ae4a)
- Perceived load: defer drawing icons until base tile coverage >= 50%\n\n- MapRenderer gates icon draw until initial coverage is sufficient, then unlocks permanently\n- Avoids icons painting before tiles, improving perceived startup (
  908d14)
- Hit-testing deferral: build icon alpha masks only after first render (
  af9ac2)
- Hit-testing perf: parallel icon loads and idle mask build (

490768.

- Hit-testing: alpha-aware marker picking with CORS-safe CPU masks\n\n- Build per-icon alpha masks on load (CORS required); fallback to AABB per icon if mask build fails\n- Map pointer to icon local coords with anchor/rotation/scale; sample mask after AABB check\n- Keep hover debounce and click tolerance logic to avoid churn during motion (
  a24215)
- Clicks: suppress markerclick during pans by using click tolerance (
  d687b5)
- Hover: disable marker hit-testing during pan/zoom with 75ms debounce (
  09663f)
- Types: tighten gtmap typings; remove any/unknown and casts (
  7e9aba)
- Events: richer marker events + marker identity and icon metadata\n\n- Add BaseEvent concept and redesign marker events to include marker{id,index,world,size,rotation} and icon{id,urls,metrics}\n- Include screen and view in marker events; remove ambiguous top-level 'type'\n- Add marker id and rotation to public/internal marker types; GTMap generates ids for markers\n- IconDef supports anchor; IconRenderer stores icon metadata and returns richer marker info for hit-testing\n- Implement dblclick zoom and keyboard +/- and arrow panning\n- Add panTo and flyTo convenience methods\n- Update Svelte demo to log marker events (
  2e417b)
- Events/typing: fix public view payloads and raster wanted-key threading\n\n- InputDeps.getView now returns public ViewState (Point center)\n- Added \_viewPublic() and used for all event payloads\n- ZoomController emits 'zoomend' with typed payload via deps.getPublicView()\n- RasterRenderer.drawTilesForLevel takes wantTileKey in params; MapRenderer threads it\n- Removed unused \_view() and stray EventBus import; cleaned unused var in icons\n- Fixed all InputController usages from center.lng/lat -> center.x/y (
  37aefc)
- HUD: add perf stats in Svelte app via typed frame event (
  8f9640)
- Tiles: fix wanted-keys pruning; mark visible/prefetch tiles as wanted (
  f4aaa5)
- Optimize icon loading to prefer retina versions and avoid redundant downloads (
  a3aa38)
- Fix type exports and clean up index.ts (
  038c73)
- Add comprehensive JSDoc comments to GTMap public API (
  70721c)
- Improve pan-throw-inertia smoothness with better easing (
  6a3777)
- Add adaptive decode queue optimization to prevent main thread blocking (
  23a9ff)
- Optimize for HTTP/2-3 on Cloudflare CDN (
  64707d)
- Remove TypeScript build cache from git and add to gitignore (
  f414b5)
- Performance optimizations and vector rendering fix (
  d9f4db)
- fix: remove lng/lat from public API, use x/y coordinates only (

844321.

- refactor: comprehensive TypeScript type system improvements (
  b70bae)
- Clean up: finalize GTMap exports; remove stray api/L.ts; stage index.ts (
  928db6)
- Remove unused internal/adapters now that Leaflet facade is gone (
  57abdc)
- Remove Leaflet compatibility layers (leaflet and leaflet2) and related exports; keep new GTMap API only (

255919.

- API: addIcon + addMarker (icon handle); batch marker updates via RAF\n\n- Expose addIcon and addMarker for clean per-item APIs\n- Internal batching: coalesce marker mutations and commit once per frame\n- Keep default icon so markers are visible without setup\n- Migrate Svelte app to GTMap API and icon/marker workflow\n- Add canvas CSS classes and vector canvas CSS sizing (
  4ede46)
- Leaflet 2.0 TS stubs: add core, geometry, dom helpers, and composed options\n\n- Add minimal core (Evented, Util, Handler, Browser) and geometry/geo modules\n- Port Layer/Map/Marker/Vector/Tile/Overlay/Control class stubs (no impl)\n- Compose options via shared types + setOptions; add sensible defaults\n- Add popup/tooltip stubs on Layer/Marker\n- Barrel exports and folder structure mirroring Leaflet 2.0\n\nPrepares a Leaflet-compatible TS API surface to adapt to our internals. (
  b7e3c7)
- Public Marker: switch to composition, register impl↔public, delegate methods\n\n- Events now resolve to public Marker via bridge in internal emit side\n- Public Marker exposes getOptions() and delegates set/getLatLng, on/off, addTo/remove (
  decd1a)
- Marker hitTest: remove linear fallback, add scale-aware grid radius, and tighten logs\n\n- R computed from CSS radius -> world -> cells (clamped 1..4)\n- Remove fallbackLinear path\n- Keep concise logs: index (with R), candidates count, final result (
  6ab4b0)
- Marker grid: compute pointer world from snapped TL/scale (match renderer) for correct grid cell lookup\n\nEliminates grid 0-candidate issue after coord refactor; neighborhood/fallback remain as safety. (
  3b327d)
- Marker hitTest: align CSS projection with renderer (zParts + tlLevel + device-pixel snapping)\n\nFixes subpixel drift between rendered icon position and hit rect after coord refactor. (
  48fd6b)
- Marker hitTest: expand grid neighborhood (R=2) and fallback to linear scan if no candidates\n\nMitigates mismatch after internal coord refactor so clicks still register while we verify indexing. (
  d25973)
- Marker debug: add detailed logging for click handling and hit test when DEBUG=true\n\n- Log pointerdown/up/context with hit summary\n- Extend hitTest() with optional logging detailing world conversion, grid cells, candidates, per-candidate rect tests\n- Gate logs behind DEBUG flag (packages/gtmap/src/debug.ts)\n\nEnable by setting DEBUG=true in debug.ts or global. (
  fe71eb)
- Hitboxes: ensure draw routine runs without vectors\n\n- Remove early return in \_drawVectors when no vectors are set\n- Always restore context, and draw hitboxes afterwards\n\nFixes: marker hitboxes not appearing when no vector overlay exists. (
  a38e4d)
- ScreenCache: scissor to finite map extent during cache draw\n\nClips cached previous frame to the current map rectangle, preventing\noverlay/icon ghosts from appearing outside the image during zoom/pan. (
  45f102)
- Icons: clip to finite map extent via scissor\n\n- Compute map rect in CSS from tl/scale and level size\n- Enable WebGL scissor around map area during icon draw (instanced and non-instanced)\n- Pass mapSize + imageMaxZ to icons.draw\n\nPrevents icons rendering outside the map image, eliminating zoom artifacts beyond edges. (
  ceb2fa)
- Revert: screen cache update ordering (restore post-icons update)\n\nUser reports artifacts outside map persist; reverting to original ordering. (
  6cb3e7)
- ScreenCache: update before icons so cached frame excludes overlays\n\nPrevents ghost/icon artifacts during zoom by avoiding double-drawing\nof previous-frame icons from the screen cache overlay. (
  e63c52)
- Grid/Vector overlays: fix DPI sizing and scaling\n\n- Make overlay canvases device-pixel sized (w*h*dpr)\n- Scale 2D contexts by dpr in vector path (grid already does)\n- Keeps drawGrid using CSS units with dpr scaling for crisp lines\n\nFixes grid not scaling/moving properly with pan/zoom on HiDPI displays. (
  6b6fab)
- icons: fix references in non-instanced path (use baseZ/effScale) to avoid zInt ReferenceError (
  b4a9c7)
- Coords: finish centralization across icons, raster, vectors, grid, tiles\n\n- icons: use zParts/tlLevelFor + device-pixel snapping\n- vectors: compute circle radius via zParts/sFor\n- raster: replace level scaling with sFor\n- grid: use sFor for absolute factor\n- tiles: use sFor and levelFactor in pipeline/queue\n- add helpers: levelFactor, scaleAtLevel\n\nAligns all remaining modules to shared coordinate helpers. (
  abf115)
- Coords: centralize z/scale/TL math; fix zoom artifacts\n\n- Add helpers: zParts, sFor, tlLevelFor(+WithScale), css<->level transforms\n- Use helpers in renderer, input, zoom, grid, facade, prefetch\n- Correct per-level TL computation for cross-fade (prev/next levels)\n- Snap TL per level to device pixels to avoid seams\n- Minor consistency tweaks in tile prefetch/scheduling and bounds\n\nResult: eliminates tile edge artifacts during zoom in/out and aligns all \ncoordinate calculations across modules. (
  6e2eef)
- Chore: Remove temporary debug logs and disable DEBUG flag (
  8124ee)
- Fix(draw): Use sourceMaxZoom (image pyramid max) for per-level tile range in drawTilesForLevel; viewer maxZoom was shrinking level sizes (
  848fb3)
- Debug: Add verbose logging for tile coverage/draw, prefetch, pipeline enqueue, and loader start (guarded by DEBUG flag) (
  0bb25a)
- Fix(coverage): Pass sourceMaxZoom to raster.coverage so per-level s uses image pyramid max; fixes missing tiles at mid/fractional zooms (
  72bc48)
- Fix(tiles): Use sourceMaxZoom (image pyramid max) for per-level s in raster draw/coverage; avoid using viewer maxZoom which broke tile ranges (
  1e1db2)
- Leaflet-style: TileLayer supports bounds/noWrap; demo uses bounds + noWrap to constrain requests (
  f4b1a6)
- Tiles: Limit baseline prefetch to ring around center; infer mapSize from sourceMaxZoom in tileLayer.onAdd to avoid out-of-bounds requests (
  19a7f4)
- Coords: Switch ZoomController anchoring math to coords (cssToWorld/worldToLevel/levelToWorld); keep world-native center (
  1b39f9)
- Coords: Align icons tlWorld with tlWorldFor + snapping (
  0e0ade)
- Coords: Apply cssToWorld/worldToCSS in InputController for pointer tracking and pinch start (
  6c36fc)
- Coords: Use tlWorldFor + snapLevelToDevice in MapRenderer; centralize tl computations (
  3be1f8)
- Coords: Use helpers in vector draw and marker hit-test; project() uses worldToLevel (
  71568d)
- Coords: Integrate helpers — use worldToLevel in project; prefetch with NX/NY (non-square) instead of 1<<z (
  fe5b06)
- Coords: Add internal helpers for world->level->CSS, snapping, and tile counts/indexing (non-square, variable TS) (

651496.

- Vectors: Move vector overlay methods inside GTMap class (fix no-op overlay) (
  27b004)
- L: Add vector factories (polyline/polygon/rectangle/circle) and Svelte demo vectors (
  c0f406)
- Vectors: Initial implementation via 2D overlay batching (Polyline/Polygon/Rectangle/Circle) (
  3b3f03)
- Fix: Update internal DEBUG imports after moving internals under src/internal (
  f6d7ad)
- Refactor: Move internals under src/internal/ and fix imports (adapters, engine, events) (
  d1f4fa)
- Refactor: Rename api/_ to adapters/_ and update imports (
  f976c4)
- Cleanup: Remove unused leaflet/Leaflet.ts; confirm apps avoid deep api imports (
  54c06f)
- Controls: Respect dynamic step in ZoomControl; add setStep API and wire Svelte component reactivity (

148970.

- Phase 5: Implement minimal controls (zoom, attribution) in L.control (
  b41091)
- Phase 2-3: Hide internals via exports; simplify leaflet geo exports; align demo imports (
  ec1aac)
- Fix: Add L.grid alias to preserve GT.L.grid() compatibility (
  eb5eaa)
- Phase 1: Consolidate exports to leaflet surface and keep GT.L alias (
  b7453c)
- Leaflet compat: drop projection exports and module; pixel CRS only (
  e3ab30)
- Leaflet compat: drop CRS modules and exports; enforce pixel-based system only (
  f8db8c)
- Leaflet compat: provide L namespace built from wrappers; export from package index (
  3277a2)
- Leaflet compat: add core/dom/geometry/geo module stubs and Leaflet.ts aggregator; export control stubs; fix lint/tsc (
  1a80c9)
- Leaflet compat: scaffold Leaflet-like folder structure and named exports; wrap Map/TileLayer/Marker; stub overlays, vectors, and WMS with Not Implemented; add L alias without breaking GT exports (
  e6e864)
- P6: Input ergonomics — add setWheelOptions convenience while preserving existing API (
  9fe437)
- P5: Extract grid renderer and wire into map; keep projection helper inline as typed function in ctx (
  f6bb1b)
- P4: Prefetch improvements and queue scoring tweaks; support baseline prefetch (
  be0d54)
- P3: Add MapImpl interface and type Leaflet facades against it (
  c606c7)
- P2: Introduce FrameLoop and move RAF/pacing out of mapgl (
  8bd3db)
- P1: Extract tile loader to tiles/loader.ts and wire via deps (
  dbbb37)
- Types cleanup (P0): fix imports, tighten RenderCtx, remove dead code, align InputDeps, type-safe MapRenderer, and build clean (
  b839e7)
- HUD: Debounce marker count updates (200ms) to avoid rapid rebuilds while typing (
  1fbd69)
- WebGL2: Prefer webgl2 context; instanced markers use native drawArraysInstanced when available\n\n- Graphics: request webgl2 first, fallback to webgl\n- IconRenderer: support WebGL2 instancing (vertexAttribDivisor/drawArraysInstanced) and fallback to ANGLE extension (
  3aa289)
- VS Code: Add workspace formatting settings and align Prettier printWidth=200\n\n- .vscode/settings.json: Prettier as default formatter, Svelte formatter for .svelte, formatOnSave, ESLint fixes\n- Update .prettierrc.json printWidth from 100 to 200 for consistency with editor settings (
  911fd8)
- API: Hide setIconDefs/setMarkers from facade; demo uses L.marker exclusively\n\n- Remove public setIconDefs/setMarkers from LeafletMapFacade\n- Update Svelte map page to build markers via L.marker + LayerGroup chunking\n- Clean up references to batch APIs in demo code (
  ed07df)
- LayerGroup: Chunk addTo(map) with requestAnimationFrame for large groups\n\n- Adds up to 2000 layers per frame when group size > 3000\n- Cancels chunking on remove; safe if some layers not yet added\n- Works with marker batching; reduces main-thread stalls during large adds (
  30597e)
- Markers: Batch flush marker set updates to a single setMarkers call per tick\n\n- Replace immediate flush with end-of-tick debounce (setTimeout 0)\n- Adding/removing many L.marker instances now triggers one batched GPU update\n- Works with LayerGroup add; also rebuilds spatial index once per batch (
  a499fa)
- Markers: Add spatial grid for event hit-testing\n\n- Build a simple uniform grid index (256px native cells) for L.marker events\n- Rebuild index on marker set changes; query 3x3 neighborhood per pointer event\n- Fallback to linear scan if no index (empty set) (
  e88041)
- Icons: Deduplicate loads by URL and coalesce inflight fetches\n\n- Reuse a single WebGL texture for identical icon URLs across types\n- Skip reloading keys already present\n- Coalesce concurrent fetches for the same URL to one network request (
  f4fc2c)
- Markers: Add dblclick and contextmenu events\n\n- Fire Leaflet-like dblclick with timing+distance heuristic\n- Map DOM contextmenu to marker contextmenu with correct payload\n- Include latlng, containerPoint, layerPoint, originalEvent in all mouse events (
  dd854b)
- Markers: Add Leaflet-like mouse events via facade hit-testing\n\n- LeafletMarkerFacade gains on/off and fires: click, mousedown, mouseup, mouseover, mouseout, mousemove\n- Hook map pointer events and hit-test markers using current zoom/center and icon size\n- No bubbling to map yet; defaults align with Leaflet's bubblingMouseEvents=false\n- Keeps fast batch rendering; O(n) hit test for now (can index later) (
  55def8)
- Leaflet compat: accept inertia options in L.map(...options)\n\n- Extend LeafletMapOptions with inertia, inertiaDeceleration, inertiaMaxSpeed, easeLinearity\n- Apply via impl.setInertiaOptions during facade construction if provided (

457783.

- API: Expose setInertiaOptions on facade for desktop tuning\n\n- Allows callers to adjust inertiaDeceleration, inertiaMaxSpeed, easeLinearity, or disable inertia\n- No behavior change until used (
  889ae5)
- Touch: Block inertia after pinch with explicit cooldown\n\n- Add pinchCooldownUntil and consult it in inertia start\n- Extend suppression windows when pinch ends or transitions to one finger\n- Should stop zoom-out pinch from triggering throw on iPhone (
  81f12a)
- Touch inertia: Use raw velocity (no ease attenuation) and longer duration\n\n- For recent touch, compute velocity as dx/dt (px/s) and derive duration as v/decel\n- Min duration for touch throws increased to 0.65s, capped at 1.5s\n- Keep desktop inertia unchanged (ease-attenuated velocity) (
  30fb1b)
- Touch inertia: Lengthen and stabilize throw on iPhone\n\n- Increase velocity sample window to ~120ms for better touch velocity estimates\n- Ignore windows <20ms to avoid noisy spikes\n- Raise touch cap to ~1400 px/s; enforce min duration 0.45s (max 1.5s)\n- Keeps desktop behavior unchanged, only touch-recency path affected (
  f57fdc)
- Touch: Further reduce accidental inertia after pinch\n\n- Track lastTouchAt and treat inertia as touch if within 200ms\n- Require >=10px displacement to start inertia\n- Cap touch inertia speed (~900 px/s)\n- Suppress inertia for 300ms on pinch end (
  a49a34)
- Touch: Prevent inertia after pinch and fix one-finger lift transition\n\n- On pinch->one-finger, switch to pan by initializing baseline and resetting samples\n- Suppress inertia for 250ms after pinch to avoid accidental throws\n- Initialize pan baseline if undefined to prevent large dx/dy spikes (
  8ae47d)
- Touch: Use Leaflet-like pinch midpoint delta for center update\n\n- Compute pinchStartLatLng under initial midpoint and track centerPoint (container center)\n- During pinch, set center so projected pinchStart shifts by midpoint delta at current zoom\n- Clamp center during pinch; leaves mouse/wheel behavior unchanged (
  a0a32d)
- Touch: Leaflet-like pinch zoom flow\n\n- Record start center/zoom/distance on pinch start\n- During pinch move, compute zoom from start (getScaleZoom equivalent)\n- Keep center fixed to start center to prevent jumps\n- Emit zoom/move continuously; no inertia for pinch; emit zoomend on end (
  607c6d)
- Touch: Anchor pinch zoom to center to avoid jump on iPhone\n\n- Use 'center' anchor for pinch gesture instead of pointer anchor\n- Prevents out-center bias from shifting view unexpectedly during pinch-out (
  8cbb68)
- Upscale: Improve mobile/retina behavior\n\n- Use highp float in fragment shader for precise UV math on iOS\n- Gate bicubic near tile edges to avoid seams (fallback to linear)\n- Explicitly set linear mode for screen cache and icons draws (
  cc5d35)
- API: Add setUpscaleFilter('auto'|'linear'|'bicubic') and plumb through renderer\n\n- Facade + impl method to control upscale filtering\n- Pass filter mode through RenderCtx and MapRenderer to RasterRenderer\n- Raster picks bicubic only when requested ('auto' uses bicubic when upscaling) (
  8ea735)
- Tiles: Add bicubic GPU upscaling when zoomed past source tiles\n\n- Extend fragment shader with optional bicubic sampler (16-tap Catmull-Rom)\n- Pass per-tile texel size and enable bicubic only when upscaling\n- Keeps default linear sampling for native scale/downscale to preserve perf (
  644d34)
- Tiles: Fix zoom seams by edge-aligned rounding\n\n- Compute tile quad edges in device pixels (left/top/right/bottom) and derive\n integer width/height to avoid per-tile rounding mismatches during zoom\n- Removes 1px gaps that previously revealed clear color (now dark) (
  18b5cd)
- Tiles: Use dark clear color and map background\n\n- Set WebGL clearColor to dark neutral to avoid white flashes during pan\n- Switch Svelte map container background to dark (#171717) to match app (
  01fe94)
- Grid: Stabilize and darken overlay; fix artifacts\n\n- Snap grid origin to device pixel grid to prevent shimmer while panning\n- Use thinner lines and dark label backgrounds to avoid white flashes\n- Keep DPR-aware canvas sizing; clear every frame to prevent residue (
  dcea7f)
- Renderer: Clear screen cache on icon/marker updates to prevent ghosted markers (
  986b7c)
- UI: Darken home cards and add nav hover (
  18e388)
- Debug: add central DEBUG flag; guard all debug logs behind it (
  686db8)
- Logging: disable debug and remove temporary center logs (
  7e3baf)
- Debug: enable inertia/pointer logging in InputController (DEBUG=true) (
  d071f0)
- Types: add 'bounceAtZoomLimits' to LeafletMapOptions and MapOptions; pass through and remove 'as any' in demo init (
  767a21)
- Types: export EventBus/LeafletMapFacade; type map.events; remove any casts in Svelte; use GT.L without casts (
  61f4fc)
- Bounds: no clamp when unlocked; strict clamp for setCenter/pan inertia if maxBounds exists; enforce min zoom by bounds in zoom controller (
  e7180d)
- Bounds: no clamp without maxBounds (Leaflet semantics); relabel HUD to 'lock to image bounds' (
  a98ba5)
- Bounds clamp: match Leaflet semantics (container-size based, strict vs viscous) (
  26c48c)
- Bounds: use full image bounds in HUD (via getImageBounds) instead of current view; add getImageBounds() to facade (
  749aae)
- HUD/API: remove freePan; add bounds controls (enable + viscosity) in HUD; stop passing freePan (
  9c804f)
- Map bounds: add Leaflet-like maxBounds and maxBoundsViscosity (
  dd8baa)
- HUD: make all settings adjustable (fps cap, ctrl speed, freePan, wrapX) (
  fda27b)
- Pointer HUD: restrict updates to inside container; clear coords on leave (
  2533af)
- HUD: emit pointermove and update HUD on idle pointer moves (

318389.

- Zoom: default anchor is pointer; remove exposed anchor API and heuristic center override (
  be412c)
- API: remove non-Leaflet recenter() from facade; update demos to use setView/panTo (
  c14544)
- Pan behavior: reintroduce freePan option and correct wrapX handling (

34917.

- Recenter: return to initial (home) center instead of (0,0) (
  4e8e2b)
- Grid: fix layer onRemove to hide grid using provided map instance (
  9832fc)
- Rendering: Snap tiles/icons to device pixels and snap tlWorld to grid to reduce pan shimmer (
  99e7e6)
- API: Rename targetFps option to fpsCap across engine, facade, and demo (
  9c18c3)
- HUD: Rename 'fps' label to 'fps cap' for clarity (
  e3908f)
- FPS HUD: Measure actual render cadence via 'frame' event; emit per-frame from engine (
  559f93)
- Render pacing: Add targetFps option (default 60) and gate rAF rendering; plumb via LeafletMapOptions (
  40efca)
- Fix: Remove duplicate super() in marker and use onRemove instead of overriding remove() (
  77114c)
- Fix: Remove double super() and avoid overriding remove in tile layer (
  9a68cc)
- Leaflet Layers: Add base Layer, layer groups, and integrate with map; migrate tile/marker/grid to extend Layer (
  93d9d7)
- Leaflet: Add grid layer facade (L.grid) and use it in demo (
  d81cc7)
- Types: Fix type-only imports in L.ts to satisfy VSCode (
  57f91c)
- Startup: Load tiles only after tileLayer; remove default tile source (
  a464a7)
- Startup: avoid OSM flash by disabling baseline prefetch and clearing screen cache on source change (
  585fc9)
- Leaflet types: Remove GT-specific options from LeafletMapOptions; adjust demo (

210506.

- API: Rename imageSize to mapSize across engine, facade, demo, and docs (
  d4be8a)
- Docs+Cleanup: Remove Mercator; document Pixel CRS only (
  69bbbe)
- CRS: Fix input/zoom for pixel CRS; refactor world conversions (
  c55b3c)
- CRS: Switch to pixel-based CRS with arbitrary image size (
  f77e07)
- Markers: Add GT.L map extensions for bulk icons/markers; update demo (

480527.

- API: Make GT.L the sole public API and type it (
  a5f404)
- GT.L Phase 1: scaffold Leaflet-like facade (GT.L.map/tileLayer/marker/icon) + demo page\n- Namespace exported as GT.L with basic factories\n- LeafletMap facade wraps GTMap; marker facade batches via icons\n- Added demo page leaflet.html and src/demo-leaflet.ts (
  d82592)
- API: add MapApi + createMap factory, tiles facade, and switch demo to map.icons.\*\n- New api/MapApi.ts with createMap() returning a minimal surface\n- New api/TilesApi.ts grouped controls for loader/prefetch/screen cache\n- Public facade GTMap now exposes icons and tiles facades\n- Demo updated to use map.icons.setDefs/setMarkers (
  c3cd33)
- API: add public facade class GTMap with map.icons.\*; keep impl in mapgl.ts internal\n- Facade forwards core methods and exposes icons.setDefs/setMarkers/clear\n- Default export now points to facade; internal files continue to use impl (
  8bd1a8)
- Icons: remove pre-dpr rounding of translate/size to reduce pan jitter (use floats \* dpr) (
  b5f19a)
- Config: add Recommended tunables\n- MapOptions: maxTiles, maxInflightLoads, interactionIdleMs, prefetch{enabled,baselineLevel}, screenCache, wheelSpeedCtrl\n- Setters: setLoaderOptions, setPrefetchOptions, setScreenCacheEnabled, setWheelCtrlSpeed\n- Honor prefetch enabled for baseline + neighbor prefetch (
  daa81b)
- API: accept boolean for zoomOutCenterBias; false disables (0), true uses default (0.15) (
  5bcb0f)
- Config: support zoomOutCenterBias in MapOptions (constructor) in addition to setter (
  3c2501)
- API: add GTMap.setZoomOutCenterBias(v) to control zoom-out center bias (passed to ZoomController) (
  6c253a)
- API: add GTMap.setInertiaOptions({ inertia, inertiaDeceleration, inertiaMaxSpeed, easeLinearity }) (
  2dee6a)
- Pan inertia: fix direction sign (use dxPx/scale, dyPx/scale for world offset) to avoid bounce/reversal (
  a6cf38)
- Cleanup: remove temporary pan debug logs (console.log) (
  c7322a)
- Pan inertia: implement Leaflet-like inertia based on recent drag samples\n- InputController samples last ~50ms of drag positions; computes speed vector with easeLinearity and inertiaDeceleration\n- On release, starts a time-based panBy animation in GTMap; cancels on new interactions\n- Remove previous velocity-based inertia and fields (
  4dd655)
- Pan: Leaflet-like screen-locked drag + inertial throw on release\n- Revert drag to screen-locked (dx/scale), compute velocity in world units/sec\n- Add pan inertia tick in GTMap with exponential damping\n- Input cancels inertia on new zoom/wheel and starts on pointer/touch end\n- Wire panVelocityTick via MapRenderer hooks (
  40984d)
- Pan: try zoom-normalized panning (use 2^zoom for pan scale); keep screen-locked option commented (
  796f11)
- Icons: render after tile blending and force alpha=1 to avoid fade during fractional zoom (
  46ff90)
- Fix: pass canvas to IconRenderer and use it for u_resolution (prevent undefined access) (
  12b1d4)
- Icons: load textures via fetch+createImageBitmap with CORS; fallback to Image() and warn on failure (
  f9f590)
- Fix: draw icon quads with TRIANGLE_STRIP (buffer has 4 verts) (
  89c650)
- DX: mark package tsconfig as composite for TS project references (VSCode) (
  e370d6)
- Refactor: remove DEFAULT_TILE_SIZE from mercator helpers; require tileSize param explicitly (
  57bbce)
- Fix: honor per-instance tileSize in TilePipeline and simplify recenter() (
  f90933)
- Feature: add simple high-performance icon markers (batch per type) (

476872.

- Feature: add GTMap.setActive(active, { releaseGL }) to suspend/resume maps (
  e4da0b)
- Refactor: inline single-class-only helpers into owning classes (
  072cad)
- Refactor to complete class+DI migration: - Move all zoom logic to ZoomController; add ZoomDeps, remove map cross-file access - Make tile size per-instance (not global); thread tileSize via RenderCtx, deps and helpers - Update mercator to parametric tile size; add core/bounds clamp - Render/MapRenderer ctor DI with ctx provider + hooks - Loader uses TileLoaderDeps; remove direct map reach-ins - Update prefetch/queue/raster/grid/input to use per-instance tileSize - Clean up unused helpers and TS usage hacks; lint/TS pass - Update docs to reflect DI and tile size changes (
  18f0be)
- Prefetch DI: GTMap.prefetchNeighbors now uses prefetchNeighborsCtx (wrapXTile, hasTile, enqueueTile); InputDeps exposes getWheelStep; strict TS green (
  5cf5ba)
- Input DI: add getWheelStep in InputDeps and adapter; use in InputController. Prefetch DI: add prefetchNeighborsCtx using wrapXTile; GTMap RenderCtx and wrappers; docs updated (RenderCtx partial and prefetch note). (
  87ff54)
- Render DI: add RenderCtx usage in frame; MapRenderer builds ctx via GTMap.getRenderCtx; add GTMap wrappers (prefetch/cancel/clear/velocity); draw grid from GTMap; keep TS strict green with TEMP config usage (
  e5d50f)
- Render DI: introduce RenderCtx to frame; MapRenderer builds ctx and supplies callbacks; update migration docs (F1/F2 partial render DI) (
  53f048)
- Render DI (continued): add callbacks to render/frame for stepAnimation, zoomVelocityTick, prefetch, cancel; MapRenderer adapts map internals via callbacks (

470233.

- Render DI (partial): allow MapRenderer to supply stepAnimation to render/frame; GTMap delegates via ZoomController.step() (
  ab9e8b)
- DI (cont.): refactor InputController to DI adapter in GTMap; add InputDeps; update ZoomController with isAnimating/cancel and use in GTMap loop; keep TS strict green (
  42e2ac)
- DI: add InputDeps and refactor InputController to use it; provide adapter in GTMap; remove \_markUsed (replaced with TEMP \_tsUseInternals); TS strict remains green (
  4ca17c)
- Finalization F1/F2: add TileDeps interface and refactor TilePipeline to DI; adapt GTMap with tileDeps adapter; remove GTMap's own queue usage; keep TS strict green (
  7fa508)
- Phase 5: add shared ViewState in GTMap; remove obsolete screen format helper; update migration checklist (
  2477cd)
- Phase 5: introduce ViewState getter and dispose cascade; fix import order warnings; keep strict TS green (
  2a9c78)
- Phase 3: add gl/Graphics class to own WebGL context and program init; GTMap delegates; update migration doc (
  1590f2)
- Docs: update class-migration checklist marking Phase 1 complete, Phase 2 (TilePipeline) integrated, Phase 3 MapRenderer done, Phase 4 ZoomController added (
  2d0ead)
- Phase 2-3: add tiles/TilePipeline and render/MapRenderer classes; delegate enqueue/process/prefetch/render; keep TypeScript strict green (
  fd18c3)
- Phase 1: introduce input/InputController class (attach/dispose), wire into GTMap; remove old input/handlers; TS build green (
  559a6d)
- Strict checks: enable TS noUnusedLocals/Parameters; make ESLint unused vars errors; add import/no-unused-modules; adjust mapgl.ts imports and add \_markUsed() to account for delegated runtime usage (
  acc4a7)
- Core/GL: extract canvas init, grid canvas, GL context, programs, and resize into modules; GTMap delegates; remove unused compile/link (

51849.

- Render: extract frame rendering to render/frame and tile prefetch to tiles/prefetch; remove duplicate grid/wheel helpers from GTMap (
  68be3e)
- Core: extract zoom easing/anchored logic to core/zoom; delegate methods in GTMap (
  2cf7a7)
- Tiles: extract image/texture loader to tiles/loader; delegate \_startImageLoad to module (
  4c96c8)
- Input: extract pointer/touch/wheel handlers to input/handlers; GTMap now delegates to attachHandlers() (
  010ea8)
- Core split: extract grid overlay (render/grid) and wheel normalization (core/wheel); wire imports in GTMap (
  dd8a50)
- Events: scaffold chainable EventBus + streams; expose map.events; emit core events (move/zoom/pointer); add events plan doc (
  e0a06d)
- Chore: rename legacy backup to mapgl.ts.backup (
  91bdab)
- Split: remove dead screen-cache code from GTMap; tick acceptance items after parity test (
  b054ff)
- Cleanup: remove duplicate method; fix TS types (u_uv0/u_uv1, imageBitmap flag); ScreenCache enum typing; exclude legacy file from build (
  ea51bc)
- Split Task C+D: wire TileQueue into GTMap (idle gating, priority, prune); extract raster renderer and coverage; route draws via module (
  381c39)
- Split Task C wiring: introduce TileCache in GTMap and route ready/loading/error + clear/evict; keep behavior unchanged (
  c21ccf)
- Split Task C: add tiles/source, tiles/cache, tiles/queue; switch GTMap to source helpers for keys/wrap/url (
  3fca0b)
- Split Task B: extract screen cache into render/screenCache and wire into GTMap; dispose on destroy (
  b19423)
- Split Task A: add GL helpers (program, quad) and wire into GTMap; backup legacy mapgl.ts (

545087.

- Backup: snapshot current mapgl.ts as mapgl.legacy.ts (
  fc321e)
- Core: Merge mercator improvements; MapGL wheel normalization and cleanup (
  0aefff)
- GTMap TS: port sticky center anchor for finite worlds with hysteresis; keep wheel zoom on eased path; finalize touch pinch/pan + clamping; add neighbor prefetch helper; cleanup dup grid init. (
  0ddddd)
- GTMap TS: revert wheel to responsive ease (no per-frame step/tail); smooth zoom via \_startZoomEase; simplify loop gating to anim or needsRender; fix touch cleanup handlers. (
  31ee54)
- GTMap TS: port touch pan/pinch with named handlers; clamp center on pan/zoom; add easing options; refine render loop and cross-fade; improve loader prioritization; ensure GL blend state and mipmapped textures. (

689893.

- GTMap TS: fix duplicate grid init; implement setTileSource clearCache; stabilize render loop during easing; refine loader cancellation (do not abort inflight); enable blending + mipmapped textures; add neighbor prefetch and pointerAbs updates. (
  a7feb8)
- GTMap: flip package export to TypeScript implementation (packages/gtmap/src/mapgl.ts) for live testing (
  1319a2)
- Tooling: switch to ESLint flat config with TS support; add Prettier; scripts for lint/format. Refactor to GTMap package (packages/gtmap) with TS scaffolding and basic GL program + minimal tile rendering path. Update Vite alias and imports. Fix import order warnings. (
  c15fb7)

## v0.2.0 - 2025-09-06

- Lint & format (df16652)
- feat(map): background color plumbing (Graphics.init alpha, adaptive grid palette); finalize event forwarding and types (
  131eaa)
- feat(map): default transparent background; docs: add backgroundColor usage and runtime update examples (
  554e4d)
- chore: remove legacy map-level markerEvents helper and export (
  f71845)
- feat(events): add pointerdown/up, tap, longpress for markers; update docs (
  ca11cc)
- feat(events): add device-aware pointer metadata; rename marker enter/leave to pointerenter/pointerleave\n\n- MarkerEventMap now includes pointer meta on pointer-derived events\n- GTMap forwards impl marker events with pointer metadata and new names\n- Docs: update marker events section with pointer meta and usage (
  b5ff2e)
- feat(map): add load/resize events; improve resize stability\n\n- Add load and resize events to EventMap and emit points\n- Debounced trailing resize; attach auto-resize after first frame\n- Snap CSS sizes to integers and hide overflow to avoid flicker/scrollbars\n- Fix screen cache texture reallocation on size changes\n- Add Windows repair script (win-repair-node.ps1) for clean install/rebuild (

619100.

- feat(resize): add autoResize option with debounced ResizeObserver and setAutoResize() API\n\n- autoResize in public and internal MapOptions (default true)\n- Debounced container ResizeObserver + window resize listener\n- Public GTMap.setAutoResize(on) to toggle at runtime\n- Cleanup observers on destroy() (
  70f250)
- feat(events): introduce entity-based events and entities\n\n- Add Marker, Vector, Layer classes with typed PublicEvents\n- Refactor GTMap to expose layers and per-entity events\n- Wire internal marker events to per-marker events\n- Remove legacy addMarkers in favor of per-entity API\n- Keep map.events read-only (on/once); hide public emit\n- Avoid any/unknown on public surface (
  80a6ad)
- Events: include originalEvent in marker events; expose marker.events.on API; minor demo adjustments (
  2f1cf3)
- Add per-marker event helpers: onMarker/onMarkerData/createMarkerEventProxy\n\n- New API under packages/gtmap/src/api/markerEvents.ts\n- Re-exported from api/index.ts for convenient imports\n- Usage: onMarker(map, id, 'markerclick', cb) or createMarkerEventProxy(map, id).on(...) (
  b6fd2a)
- Mouse events: derive from pointer events, emit exactly once per action, and enrich with markers (
  84b6cb)
- Mouse events: include markers hit under cursor when hover is enabled (
  b9aeb7)
- Markers: add user 'data' payload (any|null) and surface in marker events (
  ca6dac)
- Clicks: fallback to AABB if mask not yet available\n\n- Restore click capture before deferred masks are built; once masks exist, alpha is enforced\n- Keeps hover using AABB+alpha where available (
  33ae4a)
- Perceived load: defer drawing icons until base tile coverage >= 50%\n\n- MapRenderer gates icon draw until initial coverage is sufficient, then unlocks permanently\n- Avoids icons painting before tiles, improving perceived startup (
  908d14)
- Hit-testing deferral: build icon alpha masks only after first render (
  af9ac2)
- Hit-testing perf: parallel icon loads and idle mask build (

490768.

- Hit-testing: alpha-aware marker picking with CORS-safe CPU masks\n\n- Build per-icon alpha masks on load (CORS required); fallback to AABB per icon if mask build fails\n- Map pointer to icon local coords with anchor/rotation/scale; sample mask after AABB check\n- Keep hover debounce and click tolerance logic to avoid churn during motion (
  a24215)
- Clicks: suppress markerclick during pans by using click tolerance (
  d687b5)
- Hover: disable marker hit-testing during pan/zoom with 75ms debounce (
  09663f)
- Types: tighten gtmap typings; remove any/unknown and casts (
  7e9aba)
- Events: richer marker events + marker identity and icon metadata\n\n- Add BaseEvent concept and redesign marker events to include marker{id,index,world,size,rotation} and icon{id,urls,metrics}\n- Include screen and view in marker events; remove ambiguous top-level 'type'\n- Add marker id and rotation to public/internal marker types; GTMap generates ids for markers\n- IconDef supports anchor; IconRenderer stores icon metadata and returns richer marker info for hit-testing\n- Implement dblclick zoom and keyboard +/- and arrow panning\n- Add panTo and flyTo convenience methods\n- Update Svelte demo to log marker events (
  2e417b)
- Events/typing: fix public view payloads and raster wanted-key threading\n\n- InputDeps.getView now returns public ViewState (Point center)\n- Added \_viewPublic() and used for all event payloads\n- ZoomController emits 'zoomend' with typed payload via deps.getPublicView()\n- RasterRenderer.drawTilesForLevel takes wantTileKey in params; MapRenderer threads it\n- Removed unused \_view() and stray EventBus import; cleaned unused var in icons\n- Fixed all InputController usages from center.lng/lat -> center.x/y (
  37aefc)
- HUD: add perf stats in Svelte app via typed frame event (
  8f9640)
- Tiles: fix wanted-keys pruning; mark visible/prefetch tiles as wanted (
  f4aaa5)
- Optimize icon loading to prefer retina versions and avoid redundant downloads (
  a3aa38)
- Fix type exports and clean up index.ts (
  038c73)
- Add comprehensive JSDoc comments to GTMap public API (
  70721c)
- Improve pan-throw-inertia smoothness with better easing (
  6a3777)
- Add adaptive decode queue optimization to prevent main thread blocking (
  23a9ff)
- Optimize for HTTP/2-3 on Cloudflare CDN (
  64707d)
- Remove TypeScript build cache from git and add to gitignore (
  f414b5)
- Performance optimizations and vector rendering fix (
  d9f4db)
- fix: remove lng/lat from public API, use x/y coordinates only (

844321.

- refactor: comprehensive TypeScript type system improvements (
  b70bae)
- Clean up: finalize GTMap exports; remove stray api/L.ts; stage index.ts (
  928db6)
- Remove unused internal/adapters now that Leaflet facade is gone (
  57abdc)
- Remove Leaflet compatibility layers (leaflet and leaflet2) and related exports; keep new GTMap API only (

255919.

- API: addIcon + addMarker (icon handle); batch marker updates via RAF\n\n- Expose addIcon and addMarker for clean per-item APIs\n- Internal batching: coalesce marker mutations and commit once per frame\n- Keep default icon so markers are visible without setup\n- Migrate Svelte app to GTMap API and icon/marker workflow\n- Add canvas CSS classes and vector canvas CSS sizing (
  4ede46)
- Leaflet 2.0 TS stubs: add core, geometry, dom helpers, and composed options\n\n- Add minimal core (Evented, Util, Handler, Browser) and geometry/geo modules\n- Port Layer/Map/Marker/Vector/Tile/Overlay/Control class stubs (no impl)\n- Compose options via shared types + setOptions; add sensible defaults\n- Add popup/tooltip stubs on Layer/Marker\n- Barrel exports and folder structure mirroring Leaflet 2.0\n\nPrepares a Leaflet-compatible TS API surface to adapt to our internals. (
  b7e3c7)
- Public Marker: switch to composition, register impl↔public, delegate methods\n\n- Events now resolve to public Marker via bridge in internal emit side\n- Public Marker exposes getOptions() and delegates set/getLatLng, on/off, addTo/remove (
  decd1a)
- Marker hitTest: remove linear fallback, add scale-aware grid radius, and tighten logs\n\n- R computed from CSS radius -> world -> cells (clamped 1..4)\n- Remove fallbackLinear path\n- Keep concise logs: index (with R), candidates count, final result (
  6ab4b0)
- Marker grid: compute pointer world from snapped TL/scale (match renderer) for correct grid cell lookup\n\nEliminates grid 0-candidate issue after coord refactor; neighborhood/fallback remain as safety. (
  3b327d)
- Marker hitTest: align CSS projection with renderer (zParts + tlLevel + device-pixel snapping)\n\nFixes subpixel drift between rendered icon position and hit rect after coord refactor. (
  48fd6b)
- Marker hitTest: expand grid neighborhood (R=2) and fallback to linear scan if no candidates\n\nMitigates mismatch after internal coord refactor so clicks still register while we verify indexing. (
  d25973)
- Marker debug: add detailed logging for click handling and hit test when DEBUG=true\n\n- Log pointerdown/up/context with hit summary\n- Extend hitTest() with optional logging detailing world conversion, grid cells, candidates, per-candidate rect tests\n- Gate logs behind DEBUG flag (packages/gtmap/src/debug.ts)\n\nEnable by setting DEBUG=true in debug.ts or global. (
  fe71eb)
- Hitboxes: ensure draw routine runs without vectors\n\n- Remove early return in \_drawVectors when no vectors are set\n- Always restore context, and draw hitboxes afterwards\n\nFixes: marker hitboxes not appearing when no vector overlay exists. (
  a38e4d)
- ScreenCache: scissor to finite map extent during cache draw\n\nClips cached previous frame to the current map rectangle, preventing\noverlay/icon ghosts from appearing outside the image during zoom/pan. (
  45f102)
- Icons: clip to finite map extent via scissor\n\n- Compute map rect in CSS from tl/scale and level size\n- Enable WebGL scissor around map area during icon draw (instanced and non-instanced)\n- Pass mapSize + imageMaxZ to icons.draw\n\nPrevents icons rendering outside the map image, eliminating zoom artifacts beyond edges. (
  ceb2fa)
- Revert: screen cache update ordering (restore post-icons update)\n\nUser reports artifacts outside map persist; reverting to original ordering. (
  6cb3e7)
- ScreenCache: update before icons so cached frame excludes overlays\n\nPrevents ghost/icon artifacts during zoom by avoiding double-drawing\nof previous-frame icons from the screen cache overlay. (
  e63c52)
- Grid/Vector overlays: fix DPI sizing and scaling\n\n- Make overlay canvases device-pixel sized (w*h*dpr)\n- Scale 2D contexts by dpr in vector path (grid already does)\n- Keeps drawGrid using CSS units with dpr scaling for crisp lines\n\nFixes grid not scaling/moving properly with pan/zoom on HiDPI displays. (
  6b6fab)
- icons: fix references in non-instanced path (use baseZ/effScale) to avoid zInt ReferenceError (
  b4a9c7)
- Coords: finish centralization across icons, raster, vectors, grid, tiles\n\n- icons: use zParts/tlLevelFor + device-pixel snapping\n- vectors: compute circle radius via zParts/sFor\n- raster: replace level scaling with sFor\n- grid: use sFor for absolute factor\n- tiles: use sFor and levelFactor in pipeline/queue\n- add helpers: levelFactor, scaleAtLevel\n\nAligns all remaining modules to shared coordinate helpers. (
  abf115)
- Coords: centralize z/scale/TL math; fix zoom artifacts\n\n- Add helpers: zParts, sFor, tlLevelFor(+WithScale), css<->level transforms\n- Use helpers in renderer, input, zoom, grid, facade, prefetch\n- Correct per-level TL computation for cross-fade (prev/next levels)\n- Snap TL per level to device pixels to avoid seams\n- Minor consistency tweaks in tile prefetch/scheduling and bounds\n\nResult: eliminates tile edge artifacts during zoom in/out and aligns all \ncoordinate calculations across modules. (
  6e2eef)
- Chore: Remove temporary debug logs and disable DEBUG flag (
  8124ee)
- Fix(draw): Use sourceMaxZoom (image pyramid max) for per-level tile range in drawTilesForLevel; viewer maxZoom was shrinking level sizes (
  848fb3)
- Debug: Add verbose logging for tile coverage/draw, prefetch, pipeline enqueue, and loader start (guarded by DEBUG flag) (
  0bb25a)
- Fix(coverage): Pass sourceMaxZoom to raster.coverage so per-level s uses image pyramid max; fixes missing tiles at mid/fractional zooms (
  72bc48)
- Fix(tiles): Use sourceMaxZoom (image pyramid max) for per-level s in raster draw/coverage; avoid using viewer maxZoom which broke tile ranges (
  1e1db2)
- Leaflet-style: TileLayer supports bounds/noWrap; demo uses bounds + noWrap to constrain requests (
  f4b1a6)
- Tiles: Limit baseline prefetch to ring around center; infer mapSize from sourceMaxZoom in tileLayer.onAdd to avoid out-of-bounds requests (
  19a7f4)
- Coords: Switch ZoomController anchoring math to coords (cssToWorld/worldToLevel/levelToWorld); keep world-native center (
  1b39f9)
- Coords: Align icons tlWorld with tlWorldFor + snapping (
  0e0ade)
- Coords: Apply cssToWorld/worldToCSS in InputController for pointer tracking and pinch start (
  6c36fc)
- Coords: Use tlWorldFor + snapLevelToDevice in MapRenderer; centralize tl computations (
  3be1f8)
- Coords: Use helpers in vector draw and marker hit-test; project() uses worldToLevel (
  71568d)
- Coords: Integrate helpers — use worldToLevel in project; prefetch with NX/NY (non-square) instead of 1<<z (
  fe5b06)
- Coords: Add internal helpers for world->level->CSS, snapping, and tile counts/indexing (non-square, variable TS) (

651496.

- Vectors: Move vector overlay methods inside GTMap class (fix no-op overlay) (
  27b004)
- L: Add vector factories (polyline/polygon/rectangle/circle) and Svelte demo vectors (
  c0f406)
- Vectors: Initial implementation via 2D overlay batching (Polyline/Polygon/Rectangle/Circle) (
  3b3f03)
- Fix: Update internal DEBUG imports after moving internals under src/internal (
  f6d7ad)
- Refactor: Move internals under src/internal/ and fix imports (adapters, engine, events) (
  d1f4fa)
- Refactor: Rename api/_ to adapters/_ and update imports (
  f976c4)
- Cleanup: Remove unused leaflet/Leaflet.ts; confirm apps avoid deep api imports (
  54c06f)
- Controls: Respect dynamic step in ZoomControl; add setStep API and wire Svelte component reactivity (

148970.

- Phase 5: Implement minimal controls (zoom, attribution) in L.control (
  b41091)
- Phase 2-3: Hide internals via exports; simplify leaflet geo exports; align demo imports (
  ec1aac)
- Fix: Add L.grid alias to preserve GT.L.grid() compatibility (
  eb5eaa)
- Phase 1: Consolidate exports to leaflet surface and keep GT.L alias (
  b7453c)
- Leaflet compat: drop projection exports and module; pixel CRS only (
  e3ab30)
- Leaflet compat: drop CRS modules and exports; enforce pixel-based system only (
  f8db8c)
- Leaflet compat: provide L namespace built from wrappers; export from package index (
  3277a2)
- Leaflet compat: add core/dom/geometry/geo module stubs and Leaflet.ts aggregator; export control stubs; fix lint/tsc (
  1a80c9)
- Leaflet compat: scaffold Leaflet-like folder structure and named exports; wrap Map/TileLayer/Marker; stub overlays, vectors, and WMS with Not Implemented; add L alias without breaking GT exports (
  e6e864)
- P6: Input ergonomics — add setWheelOptions convenience while preserving existing API (
  9fe437)
- P5: Extract grid renderer and wire into map; keep projection helper inline as typed function in ctx (
  f6bb1b)
- P4: Prefetch improvements and queue scoring tweaks; support baseline prefetch (
  be0d54)
- P3: Add MapImpl interface and type Leaflet facades against it (
  c606c7)
- P2: Introduce FrameLoop and move RAF/pacing out of mapgl (
  8bd3db)
- P1: Extract tile loader to tiles/loader.ts and wire via deps (
  dbbb37)
- Types cleanup (P0): fix imports, tighten RenderCtx, remove dead code, align InputDeps, type-safe MapRenderer, and build clean (
  b839e7)
- HUD: Debounce marker count updates (200ms) to avoid rapid rebuilds while typing (
  1fbd69)
- WebGL2: Prefer webgl2 context; instanced markers use native drawArraysInstanced when available\n\n- Graphics: request webgl2 first, fallback to webgl\n- IconRenderer: support WebGL2 instancing (vertexAttribDivisor/drawArraysInstanced) and fallback to ANGLE extension (
  3aa289)
- VS Code: Add workspace formatting settings and align Prettier printWidth=200\n\n- .vscode/settings.json: Prettier as default formatter, Svelte formatter for .svelte, formatOnSave, ESLint fixes\n- Update .prettierrc.json printWidth from 100 to 200 for consistency with editor settings (
  911fd8)
- API: Hide setIconDefs/setMarkers from facade; demo uses L.marker exclusively\n\n- Remove public setIconDefs/setMarkers from LeafletMapFacade\n- Update Svelte map page to build markers via L.marker + LayerGroup chunking\n- Clean up references to batch APIs in demo code (
  ed07df)
- LayerGroup: Chunk addTo(map) with requestAnimationFrame for large groups\n\n- Adds up to 2000 layers per frame when group size > 3000\n- Cancels chunking on remove; safe if some layers not yet added\n- Works with marker batching; reduces main-thread stalls during large adds (
  30597e)
- Markers: Batch flush marker set updates to a single setMarkers call per tick\n\n- Replace immediate flush with end-of-tick debounce (setTimeout 0)\n- Adding/removing many L.marker instances now triggers one batched GPU update\n- Works with LayerGroup add; also rebuilds spatial index once per batch (
  a499fa)
- Markers: Add spatial grid for event hit-testing\n\n- Build a simple uniform grid index (256px native cells) for L.marker events\n- Rebuild index on marker set changes; query 3x3 neighborhood per pointer event\n- Fallback to linear scan if no index (empty set) (
  e88041)
- Icons: Deduplicate loads by URL and coalesce inflight fetches\n\n- Reuse a single WebGL texture for identical icon URLs across types\n- Skip reloading keys already present\n- Coalesce concurrent fetches for the same URL to one network request (
  f4fc2c)
- Markers: Add dblclick and contextmenu events\n\n- Fire Leaflet-like dblclick with timing+distance heuristic\n- Map DOM contextmenu to marker contextmenu with correct payload\n- Include latlng, containerPoint, layerPoint, originalEvent in all mouse events (
  dd854b)
- Markers: Add Leaflet-like mouse events via facade hit-testing\n\n- LeafletMarkerFacade gains on/off and fires: click, mousedown, mouseup, mouseover, mouseout, mousemove\n- Hook map pointer events and hit-test markers using current zoom/center and icon size\n- No bubbling to map yet; defaults align with Leaflet's bubblingMouseEvents=false\n- Keeps fast batch rendering; O(n) hit test for now (can index later) (
  55def8)
- Leaflet compat: accept inertia options in L.map(...options)\n\n- Extend LeafletMapOptions with inertia, inertiaDeceleration, inertiaMaxSpeed, easeLinearity\n- Apply via impl.setInertiaOptions during facade construction if provided (

457783.

- API: Expose setInertiaOptions on facade for desktop tuning\n\n- Allows callers to adjust inertiaDeceleration, inertiaMaxSpeed, easeLinearity, or disable inertia\n- No behavior change until used (
  889ae5)
- Touch: Block inertia after pinch with explicit cooldown\n\n- Add pinchCooldownUntil and consult it in inertia start\n- Extend suppression windows when pinch ends or transitions to one finger\n- Should stop zoom-out pinch from triggering throw on iPhone (
  81f12a)
- Touch inertia: Use raw velocity (no ease attenuation) and longer duration\n\n- For recent touch, compute velocity as dx/dt (px/s) and derive duration as v/decel\n- Min duration for touch throws increased to 0.65s, capped at 1.5s\n- Keep desktop inertia unchanged (ease-attenuated velocity) (
  30fb1b)
- Touch inertia: Lengthen and stabilize throw on iPhone\n\n- Increase velocity sample window to ~120ms for better touch velocity estimates\n- Ignore windows <20ms to avoid noisy spikes\n- Raise touch cap to ~1400 px/s; enforce min duration 0.45s (max 1.5s)\n- Keeps desktop behavior unchanged, only touch-recency path affected (
  f57fdc)
- Touch: Further reduce accidental inertia after pinch\n\n- Track lastTouchAt and treat inertia as touch if within 200ms\n- Require >=10px displacement to start inertia\n- Cap touch inertia speed (~900 px/s)\n- Suppress inertia for 300ms on pinch end (
  a49a34)
- Touch: Prevent inertia after pinch and fix one-finger lift transition\n\n- On pinch->one-finger, switch to pan by initializing baseline and resetting samples\n- Suppress inertia for 250ms after pinch to avoid accidental throws\n- Initialize pan baseline if undefined to prevent large dx/dy spikes (
  8ae47d)
- Touch: Use Leaflet-like pinch midpoint delta for center update\n\n- Compute pinchStartLatLng under initial midpoint and track centerPoint (container center)\n- During pinch, set center so projected pinchStart shifts by midpoint delta at current zoom\n- Clamp center during pinch; leaves mouse/wheel behavior unchanged (
  a0a32d)
- Touch: Leaflet-like pinch zoom flow\n\n- Record start center/zoom/distance on pinch start\n- During pinch move, compute zoom from start (getScaleZoom equivalent)\n- Keep center fixed to start center to prevent jumps\n- Emit zoom/move continuously; no inertia for pinch; emit zoomend on end (
  607c6d)
- Touch: Anchor pinch zoom to center to avoid jump on iPhone\n\n- Use 'center' anchor for pinch gesture instead of pointer anchor\n- Prevents out-center bias from shifting view unexpectedly during pinch-out (
  8cbb68)
- Upscale: Improve mobile/retina behavior\n\n- Use highp float in fragment shader for precise UV math on iOS\n- Gate bicubic near tile edges to avoid seams (fallback to linear)\n- Explicitly set linear mode for screen cache and icons draws (
  cc5d35)
- API: Add setUpscaleFilter('auto'|'linear'|'bicubic') and plumb through renderer\n\n- Facade + impl method to control upscale filtering\n- Pass filter mode through RenderCtx and MapRenderer to RasterRenderer\n- Raster picks bicubic only when requested ('auto' uses bicubic when upscaling) (
  8ea735)
- Tiles: Add bicubic GPU upscaling when zoomed past source tiles\n\n- Extend fragment shader with optional bicubic sampler (16-tap Catmull-Rom)\n- Pass per-tile texel size and enable bicubic only when upscaling\n- Keeps default linear sampling for native scale/downscale to preserve perf (
  644d34)
- Tiles: Fix zoom seams by edge-aligned rounding\n\n- Compute tile quad edges in device pixels (left/top/right/bottom) and derive\n integer width/height to avoid per-tile rounding mismatches during zoom\n- Removes 1px gaps that previously revealed clear color (now dark) (
  18b5cd)
- Tiles: Use dark clear color and map background\n\n- Set WebGL clearColor to dark neutral to avoid white flashes during pan\n- Switch Svelte map container background to dark (#171717) to match app (
  01fe94)
- Grid: Stabilize and darken overlay; fix artifacts\n\n- Snap grid origin to device pixel grid to prevent shimmer while panning\n- Use thinner lines and dark label backgrounds to avoid white flashes\n- Keep DPR-aware canvas sizing; clear every frame to prevent residue (
  dcea7f)
- Renderer: Clear screen cache on icon/marker updates to prevent ghosted markers (
  986b7c)
- UI: Darken home cards and add nav hover (
  18e388)
- Debug: add central DEBUG flag; guard all debug logs behind it (
  686db8)
- Logging: disable debug and remove temporary center logs (
  7e3baf)
- Debug: enable inertia/pointer logging in InputController (DEBUG=true) (
  d071f0)
- Types: add 'bounceAtZoomLimits' to LeafletMapOptions and MapOptions; pass through and remove 'as any' in demo init (
  767a21)
- Types: export EventBus/LeafletMapFacade; type map.events; remove any casts in Svelte; use GT.L without casts (
  61f4fc)
- Bounds: no clamp when unlocked; strict clamp for setCenter/pan inertia if maxBounds exists; enforce min zoom by bounds in zoom controller (
  e7180d)
- Bounds: no clamp without maxBounds (Leaflet semantics); relabel HUD to 'lock to image bounds' (
  a98ba5)
- Bounds clamp: match Leaflet semantics (container-size based, strict vs viscous) (
  26c48c)
- Bounds: use full image bounds in HUD (via getImageBounds) instead of current view; add getImageBounds() to facade (
  749aae)
- HUD/API: remove freePan; add bounds controls (enable + viscosity) in HUD; stop passing freePan (
  9c804f)
- Map bounds: add Leaflet-like maxBounds and maxBoundsViscosity (
  dd8baa)
- HUD: make all settings adjustable (fps cap, ctrl speed, freePan, wrapX) (
  fda27b)
- Pointer HUD: restrict updates to inside container; clear coords on leave (
  2533af)
- HUD: emit pointermove and update HUD on idle pointer moves (

318389.

- Zoom: default anchor is pointer; remove exposed anchor API and heuristic center override (
  be412c)
- API: remove non-Leaflet recenter() from facade; update demos to use setView/panTo (
  c14544)
- Pan behavior: reintroduce freePan option and correct wrapX handling (

34917.

- Recenter: return to initial (home) center instead of (0,0) (
  4e8e2b)
- Grid: fix layer onRemove to hide grid using provided map instance (
  9832fc)
- Rendering: Snap tiles/icons to device pixels and snap tlWorld to grid to reduce pan shimmer (
  99e7e6)
- API: Rename targetFps option to fpsCap across engine, facade, and demo (
  9c18c3)
- HUD: Rename 'fps' label to 'fps cap' for clarity (
  e3908f)
- FPS HUD: Measure actual render cadence via 'frame' event; emit per-frame from engine (
  559f93)
- Render pacing: Add targetFps option (default 60) and gate rAF rendering; plumb via LeafletMapOptions (
  40efca)
- Fix: Remove duplicate super() in marker and use onRemove instead of overriding remove() (
  77114c)
- Fix: Remove double super() and avoid overriding remove in tile layer (
  9a68cc)
- Leaflet Layers: Add base Layer, layer groups, and integrate with map; migrate tile/marker/grid to extend Layer (
  93d9d7)
- Leaflet: Add grid layer facade (L.grid) and use it in demo (
  d81cc7)
- Types: Fix type-only imports in L.ts to satisfy VSCode (
  57f91c)
- Startup: Load tiles only after tileLayer; remove default tile source (
  a464a7)
- Startup: avoid OSM flash by disabling baseline prefetch and clearing screen cache on source change (
  585fc9)
- Leaflet types: Remove GT-specific options from LeafletMapOptions; adjust demo (

210506.

- API: Rename imageSize to mapSize across engine, facade, demo, and docs (
  d4be8a)
- Docs+Cleanup: Remove Mercator; document Pixel CRS only (
  69bbbe)
- CRS: Fix input/zoom for pixel CRS; refactor world conversions (
  c55b3c)
- CRS: Switch to pixel-based CRS with arbitrary image size (
  f77e07)
- Markers: Add GT.L map extensions for bulk icons/markers; update demo (

480527.

- API: Make GT.L the sole public API and type it (
  a5f404)
- GT.L Phase 1: scaffold Leaflet-like facade (GT.L.map/tileLayer/marker/icon) + demo page\n- Namespace exported as GT.L with basic factories\n- LeafletMap facade wraps GTMap; marker facade batches via icons\n- Added demo page leaflet.html and src/demo-leaflet.ts (
  d82592)
- API: add MapApi + createMap factory, tiles facade, and switch demo to map.icons.\*\n- New api/MapApi.ts with createMap() returning a minimal surface\n- New api/TilesApi.ts grouped controls for loader/prefetch/screen cache\n- Public facade GTMap now exposes icons and tiles facades\n- Demo updated to use map.icons.setDefs/setMarkers (
  c3cd33)
- API: add public facade class GTMap with map.icons.\*; keep impl in mapgl.ts internal\n- Facade forwards core methods and exposes icons.setDefs/setMarkers/clear\n- Default export now points to facade; internal files continue to use impl (
  8bd1a8)
- Icons: remove pre-dpr rounding of translate/size to reduce pan jitter (use floats \* dpr) (
  b5f19a)
- Config: add Recommended tunables\n- MapOptions: maxTiles, maxInflightLoads, interactionIdleMs, prefetch{enabled,baselineLevel}, screenCache, wheelSpeedCtrl\n- Setters: setLoaderOptions, setPrefetchOptions, setScreenCacheEnabled, setWheelCtrlSpeed\n- Honor prefetch enabled for baseline + neighbor prefetch (
  daa81b)
- API: accept boolean for zoomOutCenterBias; false disables (0), true uses default (0.15) (
  5bcb0f)
- Config: support zoomOutCenterBias in MapOptions (constructor) in addition to setter (
  3c2501)
- API: add GTMap.setZoomOutCenterBias(v) to control zoom-out center bias (passed to ZoomController) (
  6c253a)
- API: add GTMap.setInertiaOptions({ inertia, inertiaDeceleration, inertiaMaxSpeed, easeLinearity }) (
  2dee6a)
- Pan inertia: fix direction sign (use dxPx/scale, dyPx/scale for world offset) to avoid bounce/reversal (
  a6cf38)
- Cleanup: remove temporary pan debug logs (console.log) (
  c7322a)
- Pan inertia: implement Leaflet-like inertia based on recent drag samples\n- InputController samples last ~50ms of drag positions; computes speed vector with easeLinearity and inertiaDeceleration\n- On release, starts a time-based panBy animation in GTMap; cancels on new interactions\n- Remove previous velocity-based inertia and fields (
  4dd655)
- Pan: Leaflet-like screen-locked drag + inertial throw on release\n- Revert drag to screen-locked (dx/scale), compute velocity in world units/sec\n- Add pan inertia tick in GTMap with exponential damping\n- Input cancels inertia on new zoom/wheel and starts on pointer/touch end\n- Wire panVelocityTick via MapRenderer hooks (
  40984d)
- Pan: try zoom-normalized panning (use 2^zoom for pan scale); keep screen-locked option commented (
  796f11)
- Icons: render after tile blending and force alpha=1 to avoid fade during fractional zoom (
  46ff90)
- Fix: pass canvas to IconRenderer and use it for u_resolution (prevent undefined access) (
  12b1d4)
- Icons: load textures via fetch+createImageBitmap with CORS; fallback to Image() and warn on failure (
  f9f590)
- Fix: draw icon quads with TRIANGLE_STRIP (buffer has 4 verts) (
  89c650)
- DX: mark package tsconfig as composite for TS project references (VSCode) (
  e370d6)
- Refactor: remove DEFAULT_TILE_SIZE from mercator helpers; require tileSize param explicitly (
  57bbce)
- Fix: honor per-instance tileSize in TilePipeline and simplify recenter() (
  f90933)
- Feature: add simple high-performance icon markers (batch per type) (

476872.

- Feature: add GTMap.setActive(active, { releaseGL }) to suspend/resume maps (
  e4da0b)
- Refactor: inline single-class-only helpers into owning classes (
  072cad)
- Refactor to complete class+DI migration: - Move all zoom logic to ZoomController; add ZoomDeps, remove map cross-file access - Make tile size per-instance (not global); thread tileSize via RenderCtx, deps and helpers - Update mercator to parametric tile size; add core/bounds clamp - Render/MapRenderer ctor DI with ctx provider + hooks - Loader uses TileLoaderDeps; remove direct map reach-ins - Update prefetch/queue/raster/grid/input to use per-instance tileSize - Clean up unused helpers and TS usage hacks; lint/TS pass - Update docs to reflect DI and tile size changes (
  18f0be)
- Prefetch DI: GTMap.prefetchNeighbors now uses prefetchNeighborsCtx (wrapXTile, hasTile, enqueueTile); InputDeps exposes getWheelStep; strict TS green (
  5cf5ba)
- Input DI: add getWheelStep in InputDeps and adapter; use in InputController. Prefetch DI: add prefetchNeighborsCtx using wrapXTile; GTMap RenderCtx and wrappers; docs updated (RenderCtx partial and prefetch note). (
  87ff54)
- Render DI: add RenderCtx usage in frame; MapRenderer builds ctx via GTMap.getRenderCtx; add GTMap wrappers (prefetch/cancel/clear/velocity); draw grid from GTMap; keep TS strict green with TEMP config usage (
  e5d50f)
- Render DI: introduce RenderCtx to frame; MapRenderer builds ctx and supplies callbacks; update migration docs (F1/F2 partial render DI) (
  53f048)
- Render DI (continued): add callbacks to render/frame for stepAnimation, zoomVelocityTick, prefetch, cancel; MapRenderer adapts map internals via callbacks (

470233.

- Render DI (partial): allow MapRenderer to supply stepAnimation to render/frame; GTMap delegates via ZoomController.step() (
  ab9e8b)
- DI (cont.): refactor InputController to DI adapter in GTMap; add InputDeps; update ZoomController with isAnimating/cancel and use in GTMap loop; keep TS strict green (
  42e2ac)
- DI: add InputDeps and refactor InputController to use it; provide adapter in GTMap; remove \_markUsed (replaced with TEMP \_tsUseInternals); TS strict remains green (
  4ca17c)
- Finalization F1/F2: add TileDeps interface and refactor TilePipeline to DI; adapt GTMap with tileDeps adapter; remove GTMap's own queue usage; keep TS strict green (
  7fa508)
- Phase 5: add shared ViewState in GTMap; remove obsolete screen format helper; update migration checklist (
  2477cd)
- Phase 5: introduce ViewState getter and dispose cascade; fix import order warnings; keep strict TS green (
  2a9c78)
- Phase 3: add gl/Graphics class to own WebGL context and program init; GTMap delegates; update migration doc (
  1590f2)
- Docs: update class-migration checklist marking Phase 1 complete, Phase 2 (TilePipeline) integrated, Phase 3 MapRenderer done, Phase 4 ZoomController added (
  2d0ead)
- Phase 2-3: add tiles/TilePipeline and render/MapRenderer classes; delegate enqueue/process/prefetch/render; keep TypeScript strict green (
  fd18c3)
- Phase 1: introduce input/InputController class (attach/dispose), wire into GTMap; remove old input/handlers; TS build green (
  559a6d)
- Strict checks: enable TS noUnusedLocals/Parameters; make ESLint unused vars errors; add import/no-unused-modules; adjust mapgl.ts imports and add \_markUsed() to account for delegated runtime usage (
  acc4a7)
- Core/GL: extract canvas init, grid canvas, GL context, programs, and resize into modules; GTMap delegates; remove unused compile/link (

51849.

- Render: extract frame rendering to render/frame and tile prefetch to tiles/prefetch; remove duplicate grid/wheel helpers from GTMap (
  68be3e)
- Core: extract zoom easing/anchored logic to core/zoom; delegate methods in GTMap (
  2cf7a7)
- Tiles: extract image/texture loader to tiles/loader; delegate \_startImageLoad to module (
  4c96c8)
- Input: extract pointer/touch/wheel handlers to input/handlers; GTMap now delegates to attachHandlers() (
  010ea8)
- Core split: extract grid overlay (render/grid) and wheel normalization (core/wheel); wire imports in GTMap (
  dd8a50)
- Events: scaffold chainable EventBus + streams; expose map.events; emit core events (move/zoom/pointer); add events plan doc (
  e0a06d)
- Chore: rename legacy backup to mapgl.ts.backup (
  91bdab)
- Split: remove dead screen-cache code from GTMap; tick acceptance items after parity test (
  b054ff)
- Cleanup: remove duplicate method; fix TS types (u_uv0/u_uv1, imageBitmap flag); ScreenCache enum typing; exclude legacy file from build (
  ea51bc)
- Split Task C+D: wire TileQueue into GTMap (idle gating, priority, prune); extract raster renderer and coverage; route draws via module (
  381c39)
- Split Task C wiring: introduce TileCache in GTMap and route ready/loading/error + clear/evict; keep behavior unchanged (
  c21ccf)
- Split Task C: add tiles/source, tiles/cache, tiles/queue; switch GTMap to source helpers for keys/wrap/url (
  3fca0b)
- Split Task B: extract screen cache into render/screenCache and wire into GTMap; dispose on destroy (
  b19423)
- Split Task A: add GL helpers (program, quad) and wire into GTMap; backup legacy mapgl.ts (

545087.

- Backup: snapshot current mapgl.ts as mapgl.legacy.ts (
  fc321e)
- Core: Merge mercator improvements; MapGL wheel normalization and cleanup (
  0aefff)
- GTMap TS: port sticky center anchor for finite worlds with hysteresis; keep wheel zoom on eased path; finalize touch pinch/pan + clamping; add neighbor prefetch helper; cleanup dup grid init. (
  0ddddd)
- GTMap TS: revert wheel to responsive ease (no per-frame step/tail); smooth zoom via \_startZoomEase; simplify loop gating to anim or needsRender; fix touch cleanup handlers. (
  31ee54)
- GTMap TS: port touch pan/pinch with named handlers; clamp center on pan/zoom; add easing options; refine render loop and cross-fade; improve loader prioritization; ensure GL blend state and mipmapped textures. (

689893.

- GTMap TS: fix duplicate grid init; implement setTileSource clearCache; stabilize render loop during easing; refine loader cancellation (do not abort inflight); enable blending + mipmapped textures; add neighbor prefetch and pointerAbs updates. (
  a7feb8)
- GTMap: flip package export to TypeScript implementation (packages/gtmap/src/mapgl.ts) for live testing (
  1319a2)
- Tooling: switch to ESLint flat config with TS support; add Prettier; scripts for lint/format. Refactor to GTMap package (packages/gtmap) with TS scaffolding and basic GL program + minimal tile rendering path. Update Vite alias and imports. Fix import order warnings. (
  c15fb7)
