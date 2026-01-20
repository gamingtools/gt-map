[**@gaming.tools/gtmap**](README.md)

***

# Interface: FrameEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [now](#now)
  - [stats?](#stats)

Defined in: [api/types.ts:226](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L226)

Per‑frame payload for diagnostics/HUD.

## Properties

### now

> **now**: `number`

Defined in: [api/types.ts:228](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L228)

High‑resolution timestamp for the frame.

***

### stats?

> `optional` **stats**: [`RenderStats`](Interface.RenderStats.md)

Defined in: [api/types.ts:235](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L235)

Optional renderer stats if enabled.

Note: At present only `frame` is populated by the engine. Other fields are reserved for
future diagnostics and may remain `undefined` in current builds.
