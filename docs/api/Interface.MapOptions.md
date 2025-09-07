[**@gaming.tools/gtmap**](README.md)

***

# Interface: MapOptions

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [autoResize?](#autoresize)
  - [backgroundColor?](#backgroundcolor)
  - [center?](#center)
  - [fpsCap?](#fpscap)
  - [mapSize?](#mapsize)
  - [maxZoom?](#maxzoom)
  - [minZoom?](#minzoom)
  - [prefetch?](#prefetch)
  - [screenCache?](#screencache)
  - [tileSize?](#tilesize)
  - [tileUrl?](#tileurl)
  - [wrapX?](#wrapx)
  - [zoom?](#zoom)

Defined in: [api/types.ts:40](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L40)

## Properties

### autoResize?

> `optional` **autoResize**: `boolean`

Defined in: [api/types.ts:53](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L53)

Automatically resize the map when the container size or window DPR changes.
Enabled by default.

***

### backgroundColor?

> `optional` **backgroundColor**: `string` \| \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

Defined in: [api/types.ts:58](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L58)

Viewport background: either 'transparent' (default when omitted) or a solid color.
Alpha on provided colors is ignored; pass a hex like '#0a0a0a' or RGB components.

***

### center?

> `optional` **center**: [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:47](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L47)

***

### fpsCap?

> `optional` **fpsCap**: `number`

Defined in: [api/types.ts:61](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L61)

***

### mapSize?

> `optional` **mapSize**: `object`

Defined in: [api/types.ts:43](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L43)

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### maxZoom?

> `optional` **maxZoom**: `number`

Defined in: [api/types.ts:45](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L45)

***

### minZoom?

> `optional` **minZoom**: `number`

Defined in: [api/types.ts:44](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L44)

***

### prefetch?

> `optional` **prefetch**: `object`

Defined in: [api/types.ts:59](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L59)

#### baselineLevel?

> `optional` **baselineLevel**: `number`

#### enabled?

> `optional` **enabled**: `boolean`

#### ring?

> `optional` **ring**: `number`

***

### screenCache?

> `optional` **screenCache**: `boolean`

Defined in: [api/types.ts:60](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L60)

***

### tileSize?

> `optional` **tileSize**: `number`

Defined in: [api/types.ts:42](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L42)

***

### tileUrl?

> `optional` **tileUrl**: `string`

Defined in: [api/types.ts:41](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L41)

***

### wrapX?

> `optional` **wrapX**: `boolean`

Defined in: [api/types.ts:46](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L46)

***

### zoom?

> `optional` **zoom**: `number`

Defined in: [api/types.ts:48](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L48)
