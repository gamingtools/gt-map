[**@gaming.tools/gtmap**](README.md)

***

# Interface: MapOptions

Defined in: [api/types.ts:48](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L48)

## Properties

### autoResize?

> `optional` **autoResize**: `boolean`

Defined in: [api/types.ts:59](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L59)

Automatically resize the map when the container size or window DPR changes.
Enabled by default.

***

### backgroundColor?

> `optional` **backgroundColor**: `string` \| \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

Defined in: [api/types.ts:64](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L64)

Viewport background: either 'transparent' (default when omitted) or a solid color.
Alpha on provided colors is ignored; pass a hex like '#0a0a0a' or RGB components.

***

### bounceAtZoomLimits?

> `optional` **bounceAtZoomLimits**: `boolean`

Defined in: [api/types.ts:81](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L81)

When true, allow a small elastic bounce at zoom limits (visual easing only).
Defaults to false.

***

### center?

> `optional` **center**: [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:53](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L53)

***

### clipToBounds?

> `optional` **clipToBounds**: `boolean`

Defined in: [api/types.ts:76](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L76)

When true, clip all rendering (raster, markers, vectors) to the map image bounds.
Useful to prevent content from appearing outside the actual map area.
Defaults to false.

***

### debug?

> `optional` **debug**: `boolean`

Defined in: [api/types.ts:110](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L110)

Enable debug logging to console for this map instance.
When true, logs initialization timing, image uploads, and internal events.
Default: false.

***

### fpsCap?

> `optional` **fpsCap**: `number`

Defined in: [api/types.ts:66](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L66)

***

### freePan?

> `optional` **freePan**: `boolean`

Defined in: [api/types.ts:68](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L68)

***

### maxBoundsPx?

> `optional` **maxBoundsPx**: `null` \| \{ `maxX`: `number`; `maxY`: `number`; `minX`: `number`; `minY`: `number`; \}

Defined in: [api/types.ts:69](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L69)

***

### maxBoundsViscosity?

> `optional` **maxBoundsViscosity**: `number`

Defined in: [api/types.ts:70](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L70)

***

### maxZoom?

> `optional` **maxZoom**: `number`

Defined in: [api/types.ts:52](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L52)

***

### minZoom?

> `optional` **minZoom**: `number`

Defined in: [api/types.ts:51](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L51)

***

### screenCache?

> `optional` **screenCache**: `boolean`

Defined in: [api/types.ts:65](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L65)

***

### spinner?

> `optional` **spinner**: [`SpinnerOptions`](Interface.SpinnerOptions.md)

Defined in: [api/types.ts:91](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L91)

Spinner appearance while loading tiles.

- size: outer diameter in CSS pixels (default 32)
- thickness: ring thickness in CSS pixels (default 3)
- color: active arc color (default 'rgba(0,0,0,0.6)')
- trackColor: background ring color (default 'rgba(0,0,0,0.2)')
- speedMs: rotation period in milliseconds (default 1000)

***

### tiles

> **tiles**: [`TileSourceOptions`](Interface.TileSourceOptions.md)

Defined in: [api/types.ts:50](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L50)

Tile pyramid source.

***

### wrapX?

> `optional` **wrapX**: `boolean`

Defined in: [api/types.ts:67](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L67)

***

### zoom?

> `optional` **zoom**: `number`

Defined in: [api/types.ts:54](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L54)

***

### zoomSnapThreshold?

> `optional` **zoomSnapThreshold**: `number`

Defined in: [api/types.ts:104](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L104)

Fractional zoom threshold at which the renderer snaps to the next tile zoom level.

At zoom 3.4 with threshold 0.4, the renderer uses z=4 tiles (scaled down ~0.66x)
instead of z=3 tiles (scaled up ~1.32x). Lower values bias toward sharper tiles
at the cost of loading more tiles; higher values keep using lower-z tiles longer.

Range: 0 to 1. Default: 0.4.
- 0 = always use ceil (sharpest, most tiles)
- 0.5 = equivalent to Math.round
- 1 = equivalent to Math.floor (current blurriest, fewest tiles)
