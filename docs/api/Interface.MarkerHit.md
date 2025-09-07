[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerHit

Defined in: [api/types.ts:195](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/types.ts#L195)

Marker hover hit on the map surface (mouse only, when enabled).

## Properties

### icon

> **icon**: `object`

Defined in: [api/types.ts:199](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/types.ts#L199)

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

Defined in: [api/types.ts:197](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/types.ts#L197)

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
