[**@gaming.tools/gtmap**](README.md)

***

# Interface: MapOptions

Defined in: [api/types.ts:44](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L44)

## Properties

### autoResize?

> `optional` **autoResize**: `boolean`

Defined in: [api/types.ts:55](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L55)

Automatically resize the map when the container size or window DPR changes.
Enabled by default.

***

### backgroundColor?

> `optional` **backgroundColor**: `string` \| \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

Defined in: [api/types.ts:60](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L60)

Viewport background: either 'transparent' (default when omitted) or a solid color.
Alpha on provided colors is ignored; pass a hex like '#0a0a0a' or RGB components.

***

### bounceAtZoomLimits?

> `optional` **bounceAtZoomLimits**: `boolean`

Defined in: [api/types.ts:77](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L77)

When true, allow a small elastic bounce at zoom limits (visual easing only).
Defaults to false.

***

### center?

> `optional` **center**: [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:49](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L49)

***

### clipToBounds?

> `optional` **clipToBounds**: `boolean`

Defined in: [api/types.ts:72](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L72)

When true, clip all rendering (raster, markers, vectors) to the map image bounds.
Useful to prevent content from appearing outside the actual map area.
Defaults to false.

***

### debug?

> `optional` **debug**: `boolean`

Defined in: [api/types.ts:106](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L106)

Enable debug logging to console for this map instance.
When true, logs initialization timing, image uploads, and internal events.
Default: false.

***

### fpsCap?

> `optional` **fpsCap**: `number`

Defined in: [api/types.ts:62](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L62)

***

### freePan?

> `optional` **freePan**: `boolean`

Defined in: [api/types.ts:64](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L64)

***

### mapSize

> **mapSize**: `object`

Defined in: [api/types.ts:46](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L46)

Map bounds in pixels (defines the coordinate space).

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### maxBoundsPx?

> `optional` **maxBoundsPx**: `null` \| \{ `maxX`: `number`; `maxY`: `number`; `minX`: `number`; `minY`: `number`; \}

Defined in: [api/types.ts:65](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L65)

***

### maxBoundsViscosity?

> `optional` **maxBoundsViscosity**: `number`

Defined in: [api/types.ts:66](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L66)

***

### maxZoom?

> `optional` **maxZoom**: `number`

Defined in: [api/types.ts:48](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L48)

***

### minZoom?

> `optional` **minZoom**: `number`

Defined in: [api/types.ts:47](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L47)

***

### screenCache?

> `optional` **screenCache**: `boolean`

Defined in: [api/types.ts:61](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L61)

***

### spinner?

> `optional` **spinner**: [`SpinnerOptions`](Interface.SpinnerOptions.md)

Defined in: [api/types.ts:87](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L87)

Spinner appearance while loading tiles.

- size: outer diameter in CSS pixels (default 32)
- thickness: ring thickness in CSS pixels (default 3)
- color: active arc color (default 'rgba(0,0,0,0.6)')
- trackColor: background ring color (default 'rgba(0,0,0,0.2)')
- speedMs: rotation period in milliseconds (default 1000)

***

### wrapX?

> `optional` **wrapX**: `boolean`

Defined in: [api/types.ts:63](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L63)

***

### zoom?

> `optional` **zoom**: `number`

Defined in: [api/types.ts:50](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L50)

***

### zoomSnapThreshold?

> `optional` **zoomSnapThreshold**: `number`

Defined in: [api/types.ts:100](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L100)

Fractional zoom threshold at which the renderer snaps to the next tile zoom level.

At zoom 3.4 with threshold 0.4, the renderer uses z=4 tiles (scaled down ~0.66x)
instead of z=3 tiles (scaled up ~1.32x). Lower values bias toward sharper tiles
at the cost of loading more tiles; higher values keep using lower-z tiles longer.

Range: 0 to 1. Default: 0.4.
- 0 = always use ceil (sharpest, most tiles)
- 0.5 = equivalent to Math.round
- 1 = equivalent to Math.floor (current blurriest, fewest tiles)
