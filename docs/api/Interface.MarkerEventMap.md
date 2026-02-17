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

Defined in: [api/events/maps.ts:53](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L53)

Events emitted by a Marker instance.

## Properties

### click

> **click**: `object`

Defined in: [api/events/maps.ts:55](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L55)

Device-agnostic activate (mouse click or touch tap).

#### cluster?

> `optional` **cluster**: [`ClusterEventData`](Interface.ClusterEventData.md)

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

Defined in: [api/events/maps.ts:59](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L59)

Touch long-press (~500ms) on the marker.

#### cluster?

> `optional` **cluster**: [`ClusterEventData`](Interface.ClusterEventData.md)

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

Defined in: [api/events/maps.ts:61](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L61)

Pointer pressed on the marker.

#### cluster?

> `optional` **cluster**: [`ClusterEventData`](Interface.ClusterEventData.md)

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

Defined in: [api/events/maps.ts:65](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L65)

Hover enter on the top-most marker under the pointer.

#### cluster?

> `optional` **cluster**: [`ClusterEventData`](Interface.ClusterEventData.md)

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

Defined in: [api/events/maps.ts:67](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L67)

Hover leave for the previously hovered marker.

#### cluster?

> `optional` **cluster**: [`ClusterEventData`](Interface.ClusterEventData.md)

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

Defined in: [api/events/maps.ts:63](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L63)

Pointer released on the marker.

#### cluster?

> `optional` **cluster**: [`ClusterEventData`](Interface.ClusterEventData.md)

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

Defined in: [api/events/maps.ts:69](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L69)

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

Defined in: [api/events/maps.ts:71](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L71)

Marker was removed.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

***

### tap

> **tap**: `object`

Defined in: [api/events/maps.ts:57](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L57)

Touch alias for click (emitted only on touch).

#### cluster?

> `optional` **cluster**: [`ClusterEventData`](Interface.ClusterEventData.md)

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`
