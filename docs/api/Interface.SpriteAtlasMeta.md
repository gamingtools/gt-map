[**@gaming.tools/gtmap**](README.md)

***

# Interface: SpriteAtlasMeta

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [format?](#format)
  - [generatedAt?](#generatedat)
  - [generator?](#generator)
  - [image?](#image)
  - [size](#size)

Defined in: [api/types.ts:387](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L387)

Informational metadata about a sprite atlas.

## Properties

### format?

> `optional` **format**: `string`

Defined in: [api/types.ts:393](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L393)

Pixel format (informational, e.g. 'RGBA8888').

***

### generatedAt?

> `optional` **generatedAt**: `string`

Defined in: [api/types.ts:397](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L397)

ISO timestamp of generation (informational).

***

### generator?

> `optional` **generator**: `string`

Defined in: [api/types.ts:395](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L395)

Generator tool name (informational).

***

### image?

> `optional` **image**: `string`

Defined in: [api/types.ts:389](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L389)

Filename of the atlas image (informational).

***

### size

> **size**: `object`

Defined in: [api/types.ts:391](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L391)

Total atlas image dimensions (required for UV computation).

#### height

> **height**: `number`

#### width

> **width**: `number`
