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

Defined in: [api/types.ts:216](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L216)

Map‑level mouse event payload (derived from pointer events).

## Remarks

May include `markers?` hover hits for convenience when idle.

## Properties

### markers?

> `optional` **markers**: [`MarkerHit`](Interface.MarkerHit.md)[]

Defined in: [api/types.ts:228](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L228)

Optional hover hits under the cursor (when enabled).

***

### originalEvent

> **originalEvent**: `PointerEvent` \| `MouseEvent`

Defined in: [api/types.ts:226](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L226)

Original DOM pointer/mouse event.

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:224](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L224)

Current view state snapshot.

***

### world

> **world**: `null` \| [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:222](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L222)

World position in pixels at current zoom, or `null` if the pointer is outside.

***

### x

> **x**: `number`

Defined in: [api/types.ts:218](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L218)

Screen X in CSS pixels relative to the container.

***

### y

> **y**: `number`

Defined in: [api/types.ts:220](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L220)

Screen Y in CSS pixels relative to the container.
