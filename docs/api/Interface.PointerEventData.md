[**@gaming.tools/gtmap**](README.md)

***

# Interface: PointerEventData

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Properties](#properties)
  - [originalEvent](#originalevent)
  - [view](#view)
  - [world](#world)
  - [x](#x)
  - [y](#y)

Defined in: [api/types.ts:173](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L173)

Map‑level pointer event payload.

## Remarks

Includes screen coordinates (CSS pixels), best‑effort world position, and the current view.

## Properties

### originalEvent

> **originalEvent**: `PointerEvent`

Defined in: [api/types.ts:183](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L183)

Original DOM pointer event.

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:181](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L181)

Current view state snapshot.

***

### world

> **world**: `null` \| [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:179](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L179)

World position in pixels at current zoom, or `null` if the pointer is outside.

***

### x

> **x**: `number`

Defined in: [api/types.ts:175](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L175)

Screen X in CSS pixels relative to the container.

***

### y

> **y**: `number`

Defined in: [api/types.ts:177](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L177)

Screen Y in CSS pixels relative to the container.
