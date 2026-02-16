[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerOptions

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [data?](#data)
  - [iconScaleFunction?](#iconscalefunction)
  - [opacity?](#opacity)
  - [rotation?](#rotation)
  - [scale?](#scale)
  - [visual](#visual)

Defined in: [entities/marker.ts:12](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/marker.ts#L12)

Options for creating or styling a [Marker](Class.Marker.md).

## Properties

### data?

> `optional` **data**: `unknown`

Defined in: [entities/marker.ts:28](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/marker.ts#L28)

Arbitrary user data attached to the marker.

***

### iconScaleFunction?

> `optional` **iconScaleFunction**: `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [entities/marker.ts:26](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/marker.ts#L26)

Override the map-level icon scale function for this marker.
Set to `null` to disable scaling (always use scale=1).
If undefined, falls back to visual's iconScaleFunction, then map's.

***

### opacity?

> `optional` **opacity**: `number`

Defined in: [entities/marker.ts:20](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/marker.ts#L20)

Opacity (0-1).

***

### rotation?

> `optional` **rotation**: `number`

Defined in: [entities/marker.ts:18](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/marker.ts#L18)

Clockwise rotation in degrees.

***

### scale?

> `optional` **scale**: `number`

Defined in: [entities/marker.ts:16](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/marker.ts#L16)

Scale multiplier (1 = visual's native size).

***

### visual

> **visual**: [`Visual`](Class.Visual.md)

Defined in: [entities/marker.ts:14](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/marker.ts#L14)

Visual template for rendering.
