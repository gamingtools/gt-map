[**@gaming.tools/gtmap**](README.md)

***

# Interface: TileSourceOptions

Defined in: [api/types.ts:28](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L28)

Tile pyramid source options.

## Remarks

Use `{z}`, `{x}`, `{y}` placeholders in the URL template.
Tiles must be square (tileSize x tileSize), but the overall map may be non-square.

## Properties

### mapSize

> **mapSize**: `object`

Defined in: [api/types.ts:40](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L40)

Full map dimensions in pixels at the source's maximum zoom level.

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### packUrl?

> `optional` **packUrl**: `string`

Defined in: [api/types.ts:36](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L36)

Optional URL to a `.gtpk` tile pack (single binary containing the full tile pyramid).
When provided, tiles are served from this in-memory pack instead of individual HTTP requests.
Falls back to `url` template for tiles not found in the pack.

***

### sourceMaxZoom

> **sourceMaxZoom**: `number`

Defined in: [api/types.ts:44](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L44)

Maximum zoom level available in the tile set.

***

### sourceMinZoom

> **sourceMinZoom**: `number`

Defined in: [api/types.ts:42](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L42)

Minimum zoom level available in the tile set.

***

### tileSize

> **tileSize**: `number`

Defined in: [api/types.ts:38](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L38)

Tile size in pixels (tiles are always square).

***

### url

> **url**: `string`

Defined in: [api/types.ts:30](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L30)

URL template with `{z}`, `{x}`, `{y}` placeholders. Used as fallback when packUrl is set.
