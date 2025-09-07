[**@gaming.tools/gtmap**](README.md)

***

# Interface: MouseEventData

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Properties](#properties)
  - [markers?](#markers)
  - [originalEvent](#originalevent)
  - [view](#view)
  - [world](#world)
  - [x](#x)
  - [y](#y)

Defined in: [api/types.ts:184](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L184)

Map‑level mouse event payload (derived from pointer events).

## Remarks

May include `markers?` hover hits for convenience when idle.

## Properties

### markers?

> `optional` **markers**: [`MarkerHit`](Interface.MarkerHit.md)[]

Defined in: [api/types.ts:196](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L196)

Optional hover hits under the cursor (when enabled).

***

### originalEvent

> **originalEvent**: `MouseEvent`

Defined in: [api/types.ts:194](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L194)

Original DOM mouse event.

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:192](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L192)

Current view state snapshot.

***

### world

> **world**: `null` \| [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:190](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L190)

World position in pixels at current zoom, or `null` if the pointer is outside.

***

### x

> **x**: `number`

Defined in: [api/types.ts:186](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L186)

Screen X in CSS pixels relative to the container.

***

### y

> **y**: `number`

Defined in: [api/types.ts:188](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L188)

Screen Y in CSS pixels relative to the container.
