# Technical Features (WebGL2‑First)

## Rendering Core

- WebGL2 baseline: Instanced draws (`drawArraysInstanced`), VAOs, GLSL 3.00 ES.
- Texture storage: `texStorage2D` + mipmaps; NPOT‑friendly atlases.
- Efficient updates: Buffer orphaning + `bufferSubData` for dynamic ranges.
- Interleaved attributes: Tight per‑instance layouts to reduce bandwidth.
- Stable transforms: World‑pixels → clip mapping via shared view uniforms.

## GTMap Main Class

- Single entry point: `GTMap` with stable, typed options.
- View & loop: DPR‑aware canvas sizing, resize handling, RAF scheduling.
- `requestRender()`: Demand‑driven frames; coalesces updates to avoid churn.
- Options: `minZoom`, `maxZoom`, `wrapX`, `freePan`, speed/ease controls, `tileUrl`.

## Tiles Pipeline

- LRU tile cache: Bounded GPU textures with eviction by last use.
- Smart loading: Inflight limits, idle‑aware prioritization, cancel/prune queues.
- Prefetch pyramid: Baseline level seeding with pin/unpin residency.
- Seam control: Clamp‑to‑edge, consistent UV math, mipmap policy.
- Screen cache: DPR‑aware reuse of previous frame for flicker‑free zoom/pan.

## Layers & Ordering

- Built‑ins: Raster tiles, sprite markers, vector shapes, HTML overlay.
- Deterministic z‑order: CPU ordering with per‑layer z; optional per‑entity z.
- Depth off for blending: Predictable results without depth conflicts.

## Sprites & Atlas

- Atlas packing: Single texture with mipmaps; UV lookup per sprite key.
- Per‑instance data: position, rotation, scale, z, anchor, UV rect.
- Z sorting: Integer z‑buckets → a few instanced draws per frame.
- Hit‑testing: Oriented bounds; optional spatial grid for large sets.

## Shapes

- Polylines: GPU extrusion with per‑vertex normals; bevel/miter limit initially.
- Polygons: Triangulation support; earcut‑style integrated early for general shapes.
- Styling: RGBA fill/stroke; screen‑constant stroke widths.

## Events (Chainable, Promise‑Like)

- Chainable streams: `on('click').filter().map().throttle().each(...)`.
- Operators: `filter`, `map`, `tap`, `throttle`, `debounce`, `once`, `take`, `takeUntil`, `merge`.
- Promise/async: `first().then(...)`, `when('moveend')`, `toAsyncIterator()`.
- Performance: Precompiled operator chains, pooled event objects, O(1) unsubscribe.

## Projection & Coordinates

- Pluggable projection: Default Web Mercator; finite‑world (no‑wrap) support.
- World pixels: Consistent `worldSize(z)` and lat clamp semantics.

## Performance Targets

- ~1k animated markers at 60 FPS on mainstream gamer GPUs.
- ≥10k static markers around 30 FPS; smooth pan/zoom under load.

## Quality & Lifecycle

- Typed APIs: TypeScript strict mode; JSDoc on public surface.
- Resource cleanup: `dispose()` for layers; `GTMap.destroy()` cleans GL/DOM.
- Examples: Tiles, markers, shapes, HTML overlays; manual smoke tests.

## Compatibility

- WebGL1 fallback: ANGLE instancing path can be added later if needed (~1%).
