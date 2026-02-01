[**@gaming.tools/gtmap**](README.md)

***

# Interface: TileSourceOptions

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Properties](#properties)
  - [mapSize](#mapsize)
  - [packUrl](#packurl)
  - [sourceMaxZoom](#sourcemaxzoom)
  - [sourceMinZoom](#sourceminzoom)
  - [tileSize](#tilesize)

Defined in: [api/types.ts:27](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L27)

Tile pyramid source options (GTPK pack only).

## Remarks

Tiles must be square (tileSize x tileSize), but the overall map may be non-square.

## Properties

### mapSize

> **mapSize**: `object`

Defined in: [api/types.ts:33](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L33)

Full map dimensions in pixels at the source's maximum zoom level.

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### packUrl

> **packUrl**: `string`

Defined in: [api/types.ts:29](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L29)

URL to a `.gtpk` tile pack (single binary containing the full tile pyramid).

***

### sourceMaxZoom

> **sourceMaxZoom**: `number`

Defined in: [api/types.ts:37](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L37)

Maximum zoom level available in the tile set.

***

### sourceMinZoom

> **sourceMinZoom**: `number`

Defined in: [api/types.ts:35](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L35)

Minimum zoom level available in the tile set.

***

### tileSize

> **tileSize**: `number`

Defined in: [api/types.ts:31](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L31)

Tile size in pixels (tiles are always square).
