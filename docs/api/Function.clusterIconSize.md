[**@gaming.tools/gtmap**](README.md)

***

# Function: clusterIconSize()

> **clusterIconSize**(`mode`, `opts?`): [`ClusterIconSizeFunction`](TypeAlias.ClusterIconSizeFunction.md)

Defined in: [api/layers/types.ts:103](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L103)

Factory for cluster icon size functions.

## Parameters

### mode

[`ClusterIconSizeMode`](TypeAlias.ClusterIconSizeMode.md) = `'logarithmic'`

Scaling algorithm to use

### opts?

[`ClusterIconSizeOptions`](Interface.ClusterIconSizeOptions.md)

Override defaults for the chosen mode

## Returns

[`ClusterIconSizeFunction`](TypeAlias.ClusterIconSizeFunction.md)

A [ClusterIconSizeFunction](TypeAlias.ClusterIconSizeFunction.md)

## Example

```ts
// Defaults
clusterIconSize('logarithmic')

// Custom range
clusterIconSize('logarithmic', { min: 1.0, max: 1.5 })

// Exponential-log with dynamic ceiling (default -- adapts per-layer)
clusterIconSize('exponentialLog')

// Exponential-log with fixed ceiling
clusterIconSize('exponentialLog', { base: 2.0, ceiling: 500, max: 1.8 })

// Custom stepped
clusterIconSize('stepped', { steps: [[5, 1.0], [20, 1.3], [100, 1.6], [Infinity, 2.0]] })
```
