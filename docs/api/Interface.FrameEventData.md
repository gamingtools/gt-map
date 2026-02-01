[**@gaming.tools/gtmap**](README.md)

***

# Interface: FrameEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [now](#now)
  - [stats?](#stats)

Defined in: [api/types.ts:252](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L252)

Per‑frame payload for diagnostics/HUD.

## Properties

### now

> **now**: `number`

Defined in: [api/types.ts:254](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L254)

High‑resolution timestamp for the frame.

***

### stats?

> `optional` **stats**: [`RenderStats`](Interface.RenderStats.md)

Defined in: [api/types.ts:261](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L261)

Optional renderer stats if enabled.

Note: At present only `frame` is populated by the engine. Other fields are reserved for
future diagnostics and may remain `undefined` in current builds.
