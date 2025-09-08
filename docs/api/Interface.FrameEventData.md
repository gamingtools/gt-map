[**@gaming.tools/gtmap**](README.md)

***

# Interface: FrameEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [now](#now)
  - [stats?](#stats)

Defined in: [api/types.ts:402](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L402)

Per‑frame payload for diagnostics/HUD.

## Properties

### now

> **now**: `number`

Defined in: [api/types.ts:404](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L404)

High‑resolution timestamp for the frame.

***

### stats?

> `optional` **stats**: [`RenderStats`](Interface.RenderStats.md)

Defined in: [api/types.ts:406](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L406)

Optional renderer stats if enabled.
