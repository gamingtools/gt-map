[**@gaming.tools/gtmap**](README.md)

***

# Interface: MouseEventData

Defined in: [api/types.ts:179](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L179)

Map‑level mouse event payload (derived from pointer events).

## Remarks

May include `markers?` hover hits for convenience when idle.

## Properties

### markers?

> `optional` **markers**: [`MarkerHit`](Interface.MarkerHit.md)[]

Defined in: [api/types.ts:191](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L191)

Optional hover hits under the cursor (when enabled).

***

### originalEvent

> **originalEvent**: `MouseEvent`

Defined in: [api/types.ts:189](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L189)

Original DOM mouse event.

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:187](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L187)

Current view state snapshot.

***

### world

> **world**: `null` \| [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:185](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L185)

World position in pixels at current zoom, or `null` if the pointer is outside.

***

### x

> **x**: `number`

Defined in: [api/types.ts:181](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L181)

Screen X in CSS pixels relative to the container.

***

### y

> **y**: `number`

Defined in: [api/types.ts:183](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L183)

Screen Y in CSS pixels relative to the container.
