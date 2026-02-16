[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerEventMap

[← Back to API index](./README.md)

## Contents

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

Defined in: [api/events/maps.ts:52](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L52)

Events emitted by a Marker instance.

## Properties

### click

> **click**: `object`

Defined in: [api/events/maps.ts:54](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L54)

Device-agnostic activate (mouse click or touch tap).

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### longpress

> **longpress**: `object`

Defined in: [api/events/maps.ts:58](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L58)

Touch long-press (~500ms) on the marker.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### pointerdown

> **pointerdown**: `object`

Defined in: [api/events/maps.ts:60](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L60)

Pointer pressed on the marker.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### pointerenter

> **pointerenter**: `object`

Defined in: [api/events/maps.ts:64](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L64)

Hover enter on the top-most marker under the pointer.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### pointerleave

> **pointerleave**: `object`

Defined in: [api/events/maps.ts:66](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L66)

Hover leave for the previously hovered marker.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### pointerup

> **pointerup**: `object`

Defined in: [api/events/maps.ts:62](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L62)

Pointer released on the marker.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### positionchange

> **positionchange**: `object`

Defined in: [api/events/maps.ts:68](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L68)

Position changed via Marker.moveTo; includes deltas.

#### dx

> **dx**: `number`

#### dy

> **dy**: `number`

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### remove

> **remove**: `object`

Defined in: [api/events/maps.ts:70](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L70)

Marker was removed.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

***

### tap

> **tap**: `object`

Defined in: [api/events/maps.ts:56](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L56)

Touch alias for click (emitted only on touch).

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`
