[**@gaming.tools/gtmap**](README.md)

***

# Interface: FrameEventData

Defined in: [api/types.ts:259](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L259)

Per‑frame payload for diagnostics/HUD.

## Properties

### now

> **now**: `number`

Defined in: [api/types.ts:261](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L261)

High‑resolution timestamp for the frame.

***

### stats?

> `optional` **stats**: [`RenderStats`](Interface.RenderStats.md)

Defined in: [api/types.ts:268](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L268)

Optional renderer stats if enabled.

Note: At present only `frame` is populated by the engine. Other fields are reserved for
future diagnostics and may remain `undefined` in current builds.
