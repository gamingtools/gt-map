[**@gaming.tools/gtmap**](README.md)

***

# Interface: FrameEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [now](#now)
  - [stats?](#stats)

Defined in: [api/types.ts:238](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L238)

Per‑frame payload for diagnostics/HUD.

## Properties

### now

> **now**: `number`

Defined in: [api/types.ts:240](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L240)

High‑resolution timestamp for the frame.

***

### stats?

> `optional` **stats**: [`RenderStats`](Interface.RenderStats.md)

Defined in: [api/types.ts:247](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L247)

Optional renderer stats if enabled.

Note: At present only `frame` is populated by the engine. Other fields are reserved for
future diagnostics and may remain `undefined` in current builds.
