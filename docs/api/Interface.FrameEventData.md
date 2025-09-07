[**@gaming.tools/gtmap**](README.md)

***

# Interface: FrameEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [now](#now)
  - [stats?](#stats)

Defined in: [api/types.ts:220](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L220)

Per‑frame payload for diagnostics/HUD.

## Properties

### now

> **now**: `number`

Defined in: [api/types.ts:222](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L222)

High‑resolution timestamp for the frame.

***

### stats?

> `optional` **stats**: [`RenderStats`](Interface.RenderStats.md)

Defined in: [api/types.ts:224](https://github.com/gamingtools/gt-map/blob/a614a9d52dc2e3002effbc8d9f1a71b2ca6e5b74/packages/gtmap/src/api/types.ts#L224)

Optional renderer stats if enabled.
