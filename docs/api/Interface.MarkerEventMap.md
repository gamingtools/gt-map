[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerEventMap\<T\>

[← Back to API index](./README.md)

## Contents

- [Type Parameters](#type-parameters)
  - [T](#t)
- [Properties](#properties)
  - [click](#click)
  - [longpress](#longpress)
  - [pointerdown](#pointerdown)
  - [pointerenter](#pointerenter)
  - [pointerleave](#pointerleave)
  - [pointerup](#pointerup)
  - [positionchange](#positionchange)
  - [remove](#remove)
  - [tap](#tap)

Defined in: [api/events/maps.ts:61](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L61)

Events emitted by a Marker instance.

## Type Parameters

### T

`T` = `unknown`

## Properties

### click

> **click**: `object`

Defined in: [api/events/maps.ts:63](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L63)

Device‑agnostic activate (mouse click or touch tap).

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)\<`T`\>

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### longpress

> **longpress**: `object`

Defined in: [api/events/maps.ts:67](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L67)

Touch long‑press (~500ms) on the marker.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)\<`T`\>

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### pointerdown

> **pointerdown**: `object`

Defined in: [api/events/maps.ts:69](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L69)

Pointer pressed on the marker.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)\<`T`\>

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### pointerenter

> **pointerenter**: `object`

Defined in: [api/events/maps.ts:73](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L73)

Hover enter on the top‑most marker under the pointer.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)\<`T`\>

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### pointerleave

> **pointerleave**: `object`

Defined in: [api/events/maps.ts:75](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L75)

Hover leave for the previously hovered marker.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)\<`T`\>

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### pointerup

> **pointerup**: `object`

Defined in: [api/events/maps.ts:71](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L71)

Pointer released on the marker.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)\<`T`\>

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### positionchange

> **positionchange**: `object`

Defined in: [api/events/maps.ts:77](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L77)

Position changed via Marker.moveTo; includes deltas.

#### dx

> **dx**: `number`

#### dy

> **dy**: `number`

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)\<`T`\>

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### remove

> **remove**: `object`

Defined in: [api/events/maps.ts:79](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L79)

Marker was removed.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)\<`T`\>

***

### tap

> **tap**: `object`

Defined in: [api/events/maps.ts:65](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L65)

Touch alias for click (emitted only on touch).

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)\<`T`\>

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`
