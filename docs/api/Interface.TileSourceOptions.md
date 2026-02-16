[**@gaming.tools/gtmap**](README.md)

***

# Interface: TileSourceOptions

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Properties](#properties)
  - [packUrl](#packurl)
  - [sourceMaxZoom](#sourcemaxzoom)
  - [sourceMinZoom](#sourceminzoom)
  - [tileSize](#tilesize)

Defined in: [api/types.ts:27](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L27)

Tile pyramid source options (GTPK pack only).

## Remarks

Tiles must be square (tileSize x tileSize), but the overall map may be non-square.

## Properties

### packUrl

> **packUrl**: `string`

Defined in: [api/types.ts:29](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L29)

URL to a `.gtpk` tile pack (single binary containing the full tile pyramid).

***

### sourceMaxZoom

> **sourceMaxZoom**: `number`

Defined in: [api/types.ts:35](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L35)

Maximum zoom level available in the tile set.

***

### sourceMinZoom

> **sourceMinZoom**: `number`

Defined in: [api/types.ts:33](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L33)

Minimum zoom level available in the tile set.

***

### tileSize

> **tileSize**: `number`

Defined in: [api/types.ts:31](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L31)

Tile size in pixels (tiles are always square).
