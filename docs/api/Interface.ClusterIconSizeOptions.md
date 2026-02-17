[**@gaming.tools/gtmap**](README.md)

***

# Interface: ClusterIconSizeOptions

Defined in: [api/layers/types.ts:53](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L53)

Options for [clusterIconSize](Function.clusterIconSize.md). All fields are optional and have sensible defaults per mode.

## Properties

### base?

> `optional` **base**: `number`

Defined in: [api/layers/types.ts:61](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L61)

(exponentialLog) Interpolation base. Default: 1.5.

***

### ceiling?

> `optional` **ceiling**: `number`

Defined in: [api/layers/types.ts:67](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L67)

(exponentialLog) Fixed cluster count treated as the ceiling for interpolation.
When omitted, the function uses the `maxClusterSize` parameter provided by
the renderer (dynamic per-layer ceiling). Set a fixed value to override. Default: undefined (auto).

***

### max?

> `optional` **max**: `number`

Defined in: [api/layers/types.ts:57](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L57)

Maximum scale multiplier. Default: 2.0.

***

### min?

> `optional` **min**: `number`

Defined in: [api/layers/types.ts:55](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L55)

Minimum scale multiplier. Default varies by mode (~0.9-1.0).

***

### steps?

> `optional` **steps**: \[`number`, `number`\][]

Defined in: [api/layers/types.ts:59](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L59)

(stepped) Breakpoints as `[threshold, scale]` pairs, sorted ascending by threshold.
