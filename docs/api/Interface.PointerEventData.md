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

Defined in: [api/types.ts:164](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/api/types.ts#L164)

Map‑level pointer event payload.

## Remarks

Includes screen coordinates (CSS pixels), best‑effort world position, and the current view.

## Properties

### originalEvent

> **originalEvent**: `PointerEvent`

Defined in: [api/types.ts:174](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/api/types.ts#L174)

Original DOM pointer event.

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:172](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/api/types.ts#L172)

Current view state snapshot.

***

### world

> **world**: `null` \| [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:170](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/api/types.ts#L170)

World position in pixels at current zoom, or `null` if the pointer is outside.

***

### x

> **x**: `number`

Defined in: [api/types.ts:166](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/api/types.ts#L166)

Screen X in CSS pixels relative to the container.

***

### y

> **y**: `number`

Defined in: [api/types.ts:168](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/api/types.ts#L168)

Screen Y in CSS pixels relative to the container.
