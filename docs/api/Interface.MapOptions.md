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

Defined in: [api/types.ts:69](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L69)

Configuration options for creating a GTMap instance.

## Properties

### autoResize?

> `optional` **autoResize**: `boolean`

Defined in: [api/types.ts:104](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L104)

Automatically resize the map when the container size or window DPR changes.

#### Default Value

`true`

***

### backgroundColor?

> `optional` **backgroundColor**: `string` \| \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

Defined in: [api/types.ts:112](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L112)

Viewport background: either 'transparent' or a solid color.

#### Default Value

`'transparent'`

#### Remarks

Alpha on provided colors is ignored; pass a hex like '#0a0a0a' or RGB components.

***

### center?

> `optional` **center**: [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:92](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L92)

Initial center position in world pixels.

#### Default Value

```ts
Center of the map
```

***

### fpsCap?

> `optional` **fpsCap**: `number`

Defined in: [api/types.ts:130](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L130)

Maximum frames per second.

#### Default Value

`60`

***

### maxZoom?

> `optional` **maxZoom**: `number`

Defined in: [api/types.ts:86](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L86)

Maximum zoom level.

#### Default Value

`sourceMaxZoom` from tile source

***

### minZoom?

> `optional` **minZoom**: `number`

Defined in: [api/types.ts:80](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L80)

Minimum zoom level.

#### Default Value

`0`

***

### prefetch?

> `optional` **prefetch**: `object`

Defined in: [api/types.ts:118](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L118)

Tile prefetching configuration.

#### baselineLevel?

> `optional` **baselineLevel**: `number`

#### enabled?

> `optional` **enabled**: `boolean`

#### ring?

> `optional` **ring**: `number`

#### Default Value

`{ enabled: true, baselineLevel: 2, ring: 1 }`

***

### screenCache?

> `optional` **screenCache**: `boolean`

Defined in: [api/types.ts:124](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L124)

Enable screen caching optimization.

#### Default Value

`true`

***

### tileSource

> **tileSource**: [`TileSourceOptions`](Interface.TileSourceOptions.md)

Defined in: [api/types.ts:74](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L74)

Tile source configuration (URL template, pyramid, wrap).
Required for map initialization.

***

### zoom?

> `optional` **zoom**: `number`

Defined in: [api/types.ts:98](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L98)

Initial zoom level.

#### Default Value

`0`
