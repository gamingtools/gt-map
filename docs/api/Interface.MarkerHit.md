[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerHit

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [icon](#icon)
  - [marker](#marker)

Defined in: [api/types.ts:218](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L218)

Marker hover hit on the map surface (mouse only, when enabled).

## Properties

### icon

> **icon**: `object`

Defined in: [api/types.ts:222](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L222)

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

Defined in: [api/types.ts:220](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L220)

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
