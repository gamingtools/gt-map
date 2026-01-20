[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerHit

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [icon](#icon)
  - [marker](#marker)

Defined in: [api/types.ts:209](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/api/types.ts#L209)

Marker hover hit on the map surface (mouse only, when enabled).

## Properties

### icon

> **icon**: `object`

Defined in: [api/types.ts:213](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/api/types.ts#L213)

Icon metadata associated with the hit marker.

#### anchorX

> **anchorX**: `number`

#### anchorY

> **anchorY**: `number`

#### height

> **height**: `number`

#### iconPath

> **iconPath**: `string`

#### id

> **id**: `string`

#### width

> **width**: `number`

#### x2IconPath?

> `optional` **x2IconPath**: `string`

***

### marker

> **marker**: `object`

Defined in: [api/types.ts:211](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/api/types.ts#L211)

Lightweight marker snapshot for hover purposes.

#### data?

> `optional` **data**: `unknown`

#### id

> **id**: `string`

#### index

> **index**: `number`

#### rotation?

> `optional` **rotation**: `number`

#### size

> **size**: `object`

##### size.h

> **h**: `number`

##### size.w

> **w**: `number`

#### world

> **world**: [`Point`](TypeAlias.Point.md)
