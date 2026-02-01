[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerHit

Defined in: [api/types.ts:239](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L239)

Marker hover hit on the map surface (mouse only, when enabled).

## Properties

### icon

> **icon**: `object`

Defined in: [api/types.ts:243](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L243)

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

Defined in: [api/types.ts:241](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L241)

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
