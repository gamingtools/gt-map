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

Defined in: [api/types.ts:365](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L365)

## Type Parameters

### T

`T` = `unknown`

## Properties

### icon

> **icon**: `object`

Defined in: [api/types.ts:370](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L370)

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

Defined in: [api/types.ts:369](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L369)

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

Defined in: [api/types.ts:366](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L366)

***

### originalEvent?

> `optional` **originalEvent**: `PointerEvent` \| `MouseEvent`

Defined in: [api/types.ts:371](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L371)

***

### screen

> **screen**: `object`

Defined in: [api/types.ts:368](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L368)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:367](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L367)
