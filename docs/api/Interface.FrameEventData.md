[**@gaming.tools/gtmap**](README.md)

***

# Interface: FrameEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [now](#now)
  - [stats?](#stats)

Defined in: [api/types.ts:220](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L220)

Per‑frame payload for diagnostics/HUD.

## Properties

### now

> **now**: `number`

Defined in: [api/types.ts:222](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L222)

High‑resolution timestamp for the frame.

***

### stats?

> `optional` **stats**: [`RenderStats`](Interface.RenderStats.md)

Defined in: [api/types.ts:224](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L224)

Optional renderer stats if enabled.
