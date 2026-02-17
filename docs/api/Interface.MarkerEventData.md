[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [cluster?](#cluster)
  - [icon](#icon)
  - [marker](#marker)
  - [now](#now)
  - [originalEvent?](#originalevent)
  - [screen](#screen)
  - [view](#view)

Defined in: [api/types.ts:453](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L453)

## Properties

### cluster?

> `optional` **cluster**: [`ClusterEventData`](Interface.ClusterEventData.md)

Defined in: [api/types.ts:461](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L461)

Present when the hit target is a cluster icon. Contains cluster metadata.

***

### icon

> **icon**: `object`

Defined in: [api/types.ts:458](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L458)

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

Defined in: [api/types.ts:457](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L457)

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

Defined in: [api/types.ts:454](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L454)

***

### originalEvent?

> `optional` **originalEvent**: `PointerEvent` \| `MouseEvent`

Defined in: [api/types.ts:459](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L459)

***

### screen

> **screen**: `object`

Defined in: [api/types.ts:456](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L456)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:455](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L455)
