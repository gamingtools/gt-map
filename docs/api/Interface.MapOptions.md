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
  - [maxZoom?](#maxzoom)
  - [minZoom?](#minzoom)
  - [prefetch?](#prefetch)
  - [screenCache?](#screencache)
  - [tileSource](#tilesource)
  - [zoom?](#zoom)

Defined in: [api/types.ts:47](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L47)

## Properties

### autoResize?

> `optional` **autoResize**: `boolean`

Defined in: [api/types.ts:58](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L58)

Automatically resize the map when the container size or window DPR changes.
Enabled by default.

***

### backgroundColor?

> `optional` **backgroundColor**: `string` \| \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

Defined in: [api/types.ts:63](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L63)

Viewport background: either 'transparent' (default when omitted) or a solid color.
Alpha on provided colors is ignored; pass a hex like '#0a0a0a' or RGB components.

***

### center?

> `optional` **center**: [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:52](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L52)

***

### fpsCap?

> `optional` **fpsCap**: `number`

Defined in: [api/types.ts:66](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L66)

***

### maxZoom?

> `optional` **maxZoom**: `number`

Defined in: [api/types.ts:51](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L51)

***

### minZoom?

> `optional` **minZoom**: `number`

Defined in: [api/types.ts:50](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L50)

***

### prefetch?

> `optional` **prefetch**: `object`

Defined in: [api/types.ts:64](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L64)

#### baselineLevel?

> `optional` **baselineLevel**: `number`

#### enabled?

> `optional` **enabled**: `boolean`

#### ring?

> `optional` **ring**: `number`

***

### screenCache?

> `optional` **screenCache**: `boolean`

Defined in: [api/types.ts:65](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L65)

***

### tileSource

> **tileSource**: [`TileSourceOptions`](Interface.TileSourceOptions.md)

Defined in: [api/types.ts:49](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L49)

Tile source configuration (URL template, pyramid, wrap).

***

### zoom?

> `optional` **zoom**: `number`

Defined in: [api/types.ts:53](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L53)
