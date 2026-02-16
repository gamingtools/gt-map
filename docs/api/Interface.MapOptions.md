[**@gaming.tools/gtmap**](README.md)

***

# Interface: MapOptions

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [autoResize?](#autoresize)
  - [backgroundColor?](#backgroundcolor)
  - [bounceAtZoomLimits?](#bounceatzoomlimits)
  - [center?](#center)
  - [clipToBounds?](#cliptobounds)
  - [debug?](#debug)
  - [fpsCap?](#fpscap)
  - [freePan?](#freepan)
  - [mapSize](#mapsize)
  - [maxBoundsPx?](#maxboundspx)
  - [maxBoundsViscosity?](#maxboundsviscosity)
  - [maxZoom?](#maxzoom)
  - [minZoom?](#minzoom)
  - [screenCache?](#screencache)
  - [spinner?](#spinner)
  - [wrapX?](#wrapx)
  - [zoom?](#zoom)
  - [zoomSnapThreshold?](#zoomsnapthreshold)

Defined in: [api/types.ts:39](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L39)

## Properties

### autoResize?

> `optional` **autoResize**: `boolean`

Defined in: [api/types.ts:50](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L50)

Automatically resize the map when the container size or window DPR changes.
Enabled by default.

***

### backgroundColor?

> `optional` **backgroundColor**: `string` \| \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

Defined in: [api/types.ts:55](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L55)

Viewport background: either 'transparent' (default when omitted) or a solid color.
Alpha on provided colors is ignored; pass a hex like '#0a0a0a' or RGB components.

***

### bounceAtZoomLimits?

> `optional` **bounceAtZoomLimits**: `boolean`

Defined in: [api/types.ts:72](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L72)

When true, allow a small elastic bounce at zoom limits (visual easing only).
Defaults to false.

***

### center?

> `optional` **center**: [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:44](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L44)

***

### clipToBounds?

> `optional` **clipToBounds**: `boolean`

Defined in: [api/types.ts:67](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L67)

When true, clip all rendering (raster, markers, vectors) to the map image bounds.
Useful to prevent content from appearing outside the actual map area.
Defaults to false.

***

### debug?

> `optional` **debug**: `boolean`

Defined in: [api/types.ts:101](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L101)

Enable debug logging to console for this map instance.
When true, logs initialization timing, image uploads, and internal events.
Default: false.

***

### fpsCap?

> `optional` **fpsCap**: `number`

Defined in: [api/types.ts:57](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L57)

***

### freePan?

> `optional` **freePan**: `boolean`

Defined in: [api/types.ts:59](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L59)

***

### mapSize

> **mapSize**: `object`

Defined in: [api/types.ts:41](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L41)

Map bounds in pixels (defines the coordinate space).

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### maxBoundsPx?

> `optional` **maxBoundsPx**: `null` \| \{ `maxX`: `number`; `maxY`: `number`; `minX`: `number`; `minY`: `number`; \}

Defined in: [api/types.ts:60](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L60)

***

### maxBoundsViscosity?

> `optional` **maxBoundsViscosity**: `number`

Defined in: [api/types.ts:61](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L61)

***

### maxZoom?

> `optional` **maxZoom**: `number`

Defined in: [api/types.ts:43](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L43)

***

### minZoom?

> `optional` **minZoom**: `number`

Defined in: [api/types.ts:42](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L42)

***

### screenCache?

> `optional` **screenCache**: `boolean`

Defined in: [api/types.ts:56](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L56)

***

### spinner?

> `optional` **spinner**: [`SpinnerOptions`](Interface.SpinnerOptions.md)

Defined in: [api/types.ts:82](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L82)

Spinner appearance while loading tiles.

- size: outer diameter in CSS pixels (default 32)
- thickness: ring thickness in CSS pixels (default 3)
- color: active arc color (default 'rgba(0,0,0,0.6)')
- trackColor: background ring color (default 'rgba(0,0,0,0.2)')
- speedMs: rotation period in milliseconds (default 1000)

***

### wrapX?

> `optional` **wrapX**: `boolean`

Defined in: [api/types.ts:58](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L58)

***

### zoom?

> `optional` **zoom**: `number`

Defined in: [api/types.ts:45](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L45)

***

### zoomSnapThreshold?

> `optional` **zoomSnapThreshold**: `number`

Defined in: [api/types.ts:95](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L95)

Fractional zoom threshold at which the renderer snaps to the next tile zoom level.

At zoom 3.4 with threshold 0.4, the renderer uses z=4 tiles (scaled down ~0.66x)
instead of z=3 tiles (scaled up ~1.32x). Lower values bias toward sharper tiles
at the cost of loading more tiles; higher values keep using lower-z tiles longer.

Range: 0 to 1. Default: 0.4.
- 0 = always use ceil (sharpest, most tiles)
- 0.5 = equivalent to Math.round
- 1 = equivalent to Math.floor (current blurriest, fewest tiles)
