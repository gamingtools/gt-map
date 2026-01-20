[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerEventData\<T\>

[← Back to API index](./README.md)

## Contents

- [Type Parameters](#type-parameters)
  - [T](#t)
- [Properties](#properties)
  - [icon](#icon)
  - [marker](#marker)
  - [now](#now)
  - [originalEvent?](#originalevent)
  - [screen](#screen)
  - [view](#view)

Defined in: [api/types.ts:383](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L383)

## Type Parameters

### T

`T` = `unknown`

## Properties

### icon

> **icon**: `object`

Defined in: [api/types.ts:388](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L388)

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

Defined in: [api/types.ts:387](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L387)

#### data?

> `optional` **data**: `null` \| `T`

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

***

### now

> **now**: `number`

Defined in: [api/types.ts:384](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L384)

***

### originalEvent?

> `optional` **originalEvent**: `PointerEvent` \| `MouseEvent`

Defined in: [api/types.ts:389](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L389)

***

### screen

> **screen**: `object`

Defined in: [api/types.ts:386](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L386)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:385](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L385)
