[**@gaming.tools/gtmap**](README.md)

***

# Interface: SpriteAtlasMeta

Defined in: [api/types.ts:396](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L396)

Informational metadata about a sprite atlas.

## Properties

### format?

> `optional` **format**: `string`

Defined in: [api/types.ts:402](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L402)

Pixel format (informational, e.g. 'RGBA8888').

***

### generatedAt?

> `optional` **generatedAt**: `string`

Defined in: [api/types.ts:406](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L406)

ISO timestamp of generation (informational).

***

### generator?

> `optional` **generator**: `string`

Defined in: [api/types.ts:404](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L404)

Generator tool name (informational).

***

### image?

> `optional` **image**: `string`

Defined in: [api/types.ts:398](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L398)

Filename of the atlas image (informational).

***

### size

> **size**: `object`

Defined in: [api/types.ts:400](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L400)

Total atlas image dimensions (required for UV computation).

#### height

> **height**: `number`

#### width

> **width**: `number`
