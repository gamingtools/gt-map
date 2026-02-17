[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerEventData

Defined in: [api/types.ts:462](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L462)

## Properties

### cluster?

> `optional` **cluster**: [`ClusterEventData`](Interface.ClusterEventData.md)

Defined in: [api/types.ts:470](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L470)

Present when the hit target is a cluster icon. Contains cluster metadata.

***

### icon

> **icon**: `object`

Defined in: [api/types.ts:467](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L467)

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

Defined in: [api/types.ts:466](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L466)

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

***

### now

> **now**: `number`

Defined in: [api/types.ts:463](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L463)

***

### originalEvent?

> `optional` **originalEvent**: `PointerEvent` \| `MouseEvent`

Defined in: [api/types.ts:468](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L468)

***

### screen

> **screen**: `object`

Defined in: [api/types.ts:465](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L465)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:464](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L464)
