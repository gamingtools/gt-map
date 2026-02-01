[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerHit

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [icon](#icon)
  - [marker](#marker)

Defined in: [api/types.ts:232](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L232)

Marker hover hit on the map surface (mouse only, when enabled).

## Properties

### icon

> **icon**: `object`

Defined in: [api/types.ts:236](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L236)

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

Defined in: [api/types.ts:234](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L234)

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

##### size.height

> **height**: `number`

##### size.width

> **width**: `number`

#### world

> **world**: [`Point`](TypeAlias.Point.md)
