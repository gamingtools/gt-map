[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerHit

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [icon](#icon)
  - [marker](#marker)

Defined in: [api/types.ts:189](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L189)

Marker hover hit on the map surface (mouse only, when enabled).

## Properties

### icon

> **icon**: `object`

Defined in: [api/types.ts:193](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L193)

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

Defined in: [api/types.ts:191](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L191)

Lightweight marker snapshot for hover purposes.

#### data?

> `optional` **data**: `any`

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
