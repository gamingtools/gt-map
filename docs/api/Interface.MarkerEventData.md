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

Defined in: [api/types.ts:388](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L388)

## Type Parameters

### T

`T` = `unknown`

## Properties

### icon

> **icon**: `object`

Defined in: [api/types.ts:393](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L393)

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

Defined in: [api/types.ts:392](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L392)

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

Defined in: [api/types.ts:389](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L389)

***

### originalEvent?

> `optional` **originalEvent**: `PointerEvent` \| `MouseEvent`

Defined in: [api/types.ts:394](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L394)

***

### screen

> **screen**: `object`

Defined in: [api/types.ts:391](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L391)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:390](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L390)
