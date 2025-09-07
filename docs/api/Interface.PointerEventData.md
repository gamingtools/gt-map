[**@gaming.tools/gtmap**](README.md)

***

# Interface: PointerEventData

Defined in: [api/types.ts:159](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/types.ts#L159)

Map‑level pointer event payload.

## Remarks

Includes screen coordinates (CSS pixels), best‑effort world position, and the current view.

## Properties

### originalEvent

> **originalEvent**: `PointerEvent`

Defined in: [api/types.ts:169](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/types.ts#L169)

Original DOM pointer event.

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:167](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/types.ts#L167)

Current view state snapshot.

***

### world

> **world**: `null` \| [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:165](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/types.ts#L165)

World position in pixels at current zoom, or `null` if the pointer is outside.

***

### x

> **x**: `number`

Defined in: [api/types.ts:161](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/types.ts#L161)

Screen X in CSS pixels relative to the container.

***

### y

> **y**: `number`

Defined in: [api/types.ts:163](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/types.ts#L163)

Screen Y in CSS pixels relative to the container.
