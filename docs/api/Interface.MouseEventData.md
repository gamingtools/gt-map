[**@gaming.tools/gtmap**](README.md)

***

# Interface: MouseEventData

Defined in: [api/types.ts:223](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L223)

Map‑level mouse event payload (derived from pointer events).

## Remarks

May include `markers?` hover hits for convenience when idle.

## Properties

### markers?

> `optional` **markers**: [`MarkerHit`](Interface.MarkerHit.md)[]

Defined in: [api/types.ts:235](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L235)

Optional hover hits under the cursor (when enabled).

***

### originalEvent

> **originalEvent**: `PointerEvent` \| `MouseEvent`

Defined in: [api/types.ts:233](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L233)

Original DOM pointer/mouse event.

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:231](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L231)

Current view state snapshot.

***

### world

> **world**: `null` \| [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:229](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L229)

World position in pixels at current zoom, or `null` if the pointer is outside.

***

### x

> **x**: `number`

Defined in: [api/types.ts:225](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L225)

Screen X in CSS pixels relative to the container.

***

### y

> **y**: `number`

Defined in: [api/types.ts:227](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L227)

Screen Y in CSS pixels relative to the container.
