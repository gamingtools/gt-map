[**@gaming.tools/gtmap**](README.md)

***

# Class: CoordTransformer

[← Back to API index](./README.md)

## Contents

- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Methods](#methods)
  - [setSourceBounds()](#setsourcebounds)
  - [setTargetSize()](#settargetsize)
  - [translate()](#translate)

Defined in: [api/coord-transformer.ts:13](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/coord-transformer.ts#L13)

Coordinate transformer: maps source-space coordinates into image pixel space.

Computes a uniform scale (fit) and centered offset so the full source bounds fit within
the target image dimensions while preserving aspect ratio.

## Constructors

### Constructor

> **new CoordTransformer**(`targetWidth`, `targetHeight`, `source`, `_mode`): `CoordTransformer`

Defined in: [api/coord-transformer.ts:22](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/coord-transformer.ts#L22)

#### Parameters

##### targetWidth

`number`

##### targetHeight

`number`

##### source

[`SourceBounds`](TypeAlias.SourceBounds.md)

##### \_mode

`"fit"` = `'fit'`

#### Returns

`CoordTransformer`

## Methods

### setSourceBounds()

> **setSourceBounds**(`b`): `void`

Defined in: [api/coord-transformer.ts:103](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/coord-transformer.ts#L103)

Replace the source bounds and recompute the mapping.

#### Parameters

##### b

[`SourceBounds`](TypeAlias.SourceBounds.md)

#### Returns

`void`

***

### setTargetSize()

> **setTargetSize**(`width`, `height`): `void`

Defined in: [api/coord-transformer.ts:89](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/coord-transformer.ts#L89)

Update the destination image size (pixels).

#### Parameters

##### width

`number`

##### height

`number`

#### Returns

`void`

***

### translate()

> **translate**(`x`, `y`, `type`): `object`

Defined in: [api/coord-transformer.ts:37](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/coord-transformer.ts#L37)

Translate a source-space point to pixel coordinates using the given transform.

#### Parameters

##### x

`number`

##### y

`number`

##### type

[`TransformType`](TypeAlias.TransformType.md) = `'original'`

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`
