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

Defined in: [api/types.ts:153](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L153)

Map‑level pointer event payload.

## Remarks

Includes screen coordinates (CSS pixels), best‑effort world position, and the current view.

## Properties

### originalEvent

> **originalEvent**: `PointerEvent`

Defined in: [api/types.ts:163](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L163)

Original DOM pointer event.

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:161](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L161)

Current view state snapshot.

***

### world

> **world**: `null` \| [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:159](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L159)

World position in pixels at current zoom, or `null` if the pointer is outside.

***

### x

> **x**: `number`

Defined in: [api/types.ts:155](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L155)

Screen X in CSS pixels relative to the container.

***

### y

> **y**: `number`

Defined in: [api/types.ts:157](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L157)

Screen Y in CSS pixels relative to the container.
