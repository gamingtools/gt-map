[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerEventMap

Defined in: [api/events/maps.ts:51](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L51)

Events emitted by a Marker instance.

## Properties

### click

> **click**: `object`

Defined in: [api/events/maps.ts:53](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L53)

Device‑agnostic activate (mouse click or touch tap).

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

Defined in: [api/events/maps.ts:57](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L57)

Touch long‑press (~500ms) on the marker.

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

Defined in: [api/events/maps.ts:59](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L59)

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

Defined in: [api/events/maps.ts:63](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L63)

Hover enter on the top‑most marker under the pointer.

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

Defined in: [api/events/maps.ts:65](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L65)

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

Defined in: [api/events/maps.ts:61](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L61)

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

Defined in: [api/events/maps.ts:67](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L67)

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

Defined in: [api/events/maps.ts:69](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L69)

Marker was removed.

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

***

### tap

> **tap**: `object`

Defined in: [api/events/maps.ts:55](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L55)

Touch alias for click (emitted only on touch).

#### marker

> **marker**: [`MarkerData`](Interface.MarkerData.md)

#### pointer?

> `optional` **pointer**: [`PointerMeta`](Interface.PointerMeta.md)

#### x

> **x**: `number`

#### y

> **y**: `number`
