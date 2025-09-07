[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerHit

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [icon](#icon)
  - [marker](#marker)

Defined in: [api/types.ts:200](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L200)

Marker hover hit on the map surface (mouse only, when enabled).

## Properties

### icon

> **icon**: `object`

Defined in: [api/types.ts:204](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L204)

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

Defined in: [api/types.ts:202](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L202)

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
