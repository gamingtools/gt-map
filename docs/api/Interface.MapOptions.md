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
  - [fpsCap?](#fpscap)
  - [freePan?](#freepan)
  - [image](#image)
  - [maxBoundsPx?](#maxboundspx)
  - [maxBoundsViscosity?](#maxboundsviscosity)
  - [maxZoom?](#maxzoom)
  - [minZoom?](#minzoom)
  - [screenCache?](#screencache)
  - [wrapX?](#wrapx)
  - [zoom?](#zoom)

Defined in: [api/types.ts:32](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L32)

## Properties

### autoResize?

> `optional` **autoResize**: `boolean`

Defined in: [api/types.ts:43](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L43)

Automatically resize the map when the container size or window DPR changes.
Enabled by default.

***

### backgroundColor?

> `optional` **backgroundColor**: `string` \| \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

Defined in: [api/types.ts:48](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L48)

Viewport background: either 'transparent' (default when omitted) or a solid color.
Alpha on provided colors is ignored; pass a hex like '#0a0a0a' or RGB components.

***

### bounceAtZoomLimits?

> `optional` **bounceAtZoomLimits**: `boolean`

Defined in: [api/types.ts:55](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L55)

***

### center?

> `optional` **center**: [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:37](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L37)

***

### fpsCap?

> `optional` **fpsCap**: `number`

Defined in: [api/types.ts:50](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L50)

***

### freePan?

> `optional` **freePan**: `boolean`

Defined in: [api/types.ts:52](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L52)

***

### image

> **image**: [`ImageSourceOptions`](Interface.ImageSourceOptions.md)

Defined in: [api/types.ts:34](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L34)

Single raster image to display.

***

### maxBoundsPx?

> `optional` **maxBoundsPx**: `null` \| \{ `maxX`: `number`; `maxY`: `number`; `minX`: `number`; `minY`: `number`; \}

Defined in: [api/types.ts:53](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L53)

***

### maxBoundsViscosity?

> `optional` **maxBoundsViscosity**: `number`

Defined in: [api/types.ts:54](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L54)

***

### maxZoom?

> `optional` **maxZoom**: `number`

Defined in: [api/types.ts:36](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L36)

***

### minZoom?

> `optional` **minZoom**: `number`

Defined in: [api/types.ts:35](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L35)

***

### screenCache?

> `optional` **screenCache**: `boolean`

Defined in: [api/types.ts:49](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L49)

***

### wrapX?

> `optional` **wrapX**: `boolean`

Defined in: [api/types.ts:51](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L51)

***

### zoom?

> `optional` **zoom**: `number`

Defined in: [api/types.ts:38](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L38)
