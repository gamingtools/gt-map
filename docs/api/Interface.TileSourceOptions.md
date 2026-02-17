[**@gaming.tools/gtmap**](README.md)

***

# Interface: TileSourceOptions

Defined in: [api/types.ts:32](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L32)

Tile pyramid source options (GTPK pack only).

## Remarks

Tiles must be square (tileSize x tileSize), but the overall map may be non-square.

## Properties

### packUrl

> **packUrl**: `string`

Defined in: [api/types.ts:34](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L34)

URL to a `.gtpk` tile pack (single binary containing the full tile pyramid).

***

### sourceMaxZoom

> **sourceMaxZoom**: `number`

Defined in: [api/types.ts:40](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L40)

Maximum zoom level available in the tile set.

***

### sourceMinZoom

> **sourceMinZoom**: `number`

Defined in: [api/types.ts:38](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L38)

Minimum zoom level available in the tile set.

***

### tileSize

> **tileSize**: `number`

Defined in: [api/types.ts:36](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L36)

Tile size in pixels (tiles are always square).
