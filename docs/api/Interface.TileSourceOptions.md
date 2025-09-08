[**@gaming.tools/gtmap**](README.md)

***

# Interface: TileSourceOptions

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [clearCache?](#clearcache)
  - [mapSize](#mapsize)
  - [sourceMaxZoom](#sourcemaxzoom)
  - [sourceMinZoom](#sourceminzoom)
  - [tileSize](#tilesize)
  - [url](#url)
  - [wrapX?](#wrapx)

Defined in: [api/types.ts:48](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L48)

## Properties

### clearCache?

> `optional` **clearCache**: `boolean`

Defined in: [api/types.ts:62](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L62)

Clear GPU/cache when switching sources.

***

### mapSize

> **mapSize**: `object`

Defined in: [api/types.ts:58](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L58)

Base image size at native resolution.

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### sourceMaxZoom

> **sourceMaxZoom**: `number`

Defined in: [api/types.ts:56](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L56)

Max level provided by the source (top of the image pyramid).

***

### sourceMinZoom

> **sourceMinZoom**: `number`

Defined in: [api/types.ts:54](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L54)

Min level provided by the source (usually 0).

***

### tileSize

> **tileSize**: `number`

Defined in: [api/types.ts:52](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L52)

Tile size in pixels (e.g., 256).

***

### url

> **url**: `string`

Defined in: [api/types.ts:50](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L50)

URL template for tile loading. Use {z}, {x}, {y} placeholders.

***

### wrapX?

> `optional` **wrapX**: `boolean`

Defined in: [api/types.ts:60](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L60)

Enable horizontal wrap for infinite panning.
