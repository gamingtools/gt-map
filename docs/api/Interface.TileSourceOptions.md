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

Defined in: [api/types.ts:29](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L29)

## Properties

### clearCache?

> `optional` **clearCache**: `boolean`

Defined in: [api/types.ts:43](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L43)

Clear GPU/cache when switching sources.

***

### mapSize

> **mapSize**: `object`

Defined in: [api/types.ts:39](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L39)

Base image size at native resolution.

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### sourceMaxZoom

> **sourceMaxZoom**: `number`

Defined in: [api/types.ts:37](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L37)

Max level provided by the source (top of the image pyramid).

***

### sourceMinZoom

> **sourceMinZoom**: `number`

Defined in: [api/types.ts:35](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L35)

Min level provided by the source (usually 0).

***

### tileSize

> **tileSize**: `number`

Defined in: [api/types.ts:33](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L33)

Tile size in pixels (e.g., 256).

***

### url

> **url**: `string`

Defined in: [api/types.ts:31](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L31)

URL template for tile loading. Use {z}, {x}, {y} placeholders.

***

### wrapX?

> `optional` **wrapX**: `boolean`

Defined in: [api/types.ts:41](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L41)

Enable horizontal wrap for infinite panning.
