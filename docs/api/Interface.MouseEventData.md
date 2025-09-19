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

Defined in: [api/types.ts:173](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L173)

Map‑level mouse event payload (derived from pointer events).

## Remarks

May include `markers?` hover hits for convenience when idle.

## Properties

### markers?

> `optional` **markers**: [`MarkerHit`](Interface.MarkerHit.md)[]

Defined in: [api/types.ts:185](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L185)

Optional hover hits under the cursor (when enabled).

***

### originalEvent

> **originalEvent**: `MouseEvent`

Defined in: [api/types.ts:183](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L183)

Original DOM mouse event.

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:181](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L181)

Current view state snapshot.

***

### world

> **world**: `null` \| [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:179](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L179)

World position in pixels at current zoom, or `null` if the pointer is outside.

***

### x

> **x**: `number`

Defined in: [api/types.ts:175](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L175)

Screen X in CSS pixels relative to the container.

***

### y

> **y**: `number`

Defined in: [api/types.ts:177](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L177)

Screen Y in CSS pixels relative to the container.
