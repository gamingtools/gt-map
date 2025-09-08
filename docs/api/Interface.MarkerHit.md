[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerHit\<T\>

[← Back to API index](./README.md)

## Contents

- [Type Parameters](#type-parameters)
  - [T](#t)
- [Properties](#properties)
  - [icon](#icon)
  - [marker](#marker)

Defined in: [api/types.ts:354](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L354)

Marker hit information for hover/interaction.

## Type Parameters

### T

`T` = `unknown`

Type of custom data attached to the marker

## Properties

### icon

> **icon**: `object`

Defined in: [api/types.ts:371](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L371)

Icon metadata associated with the hit marker

#### anchorX

> **anchorX**: `number`

Anchor X offset

#### anchorY

> **anchorY**: `number`

Anchor Y offset

#### height

> **height**: `number`

Icon height

#### iconPath

> **iconPath**: `string`

Icon image URL

#### id

> **id**: `string`

Icon type ID

#### width

> **width**: `number`

Icon width

#### x2IconPath?

> `optional` **x2IconPath**: `string`

2x resolution URL

***

### marker

> **marker**: `object`

Defined in: [api/types.ts:356](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L356)

Lightweight marker snapshot for hover purposes

#### data?

> `optional` **data**: `null` \| `T`

Custom user data

#### id

> **id**: `string`

Unique marker ID

#### index

> **index**: `number`

Marker index in render batch

#### rotation?

> `optional` **rotation**: `number`

Rotation in degrees

#### size

> **size**: `object`

Icon dimensions

##### size.h

> **h**: `number`

##### size.w

> **w**: `number`

#### world

> **world**: [`Point`](TypeAlias.Point.md)

World position
