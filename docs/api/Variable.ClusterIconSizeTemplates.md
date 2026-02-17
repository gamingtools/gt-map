[**@gaming.tools/gtmap**](README.md)

***

# Variable: ClusterIconSizeTemplates

[← Back to API index](./README.md)

## Contents

- [Type Declaration](#type-declaration)
  - [linear()](#linear)
  - [logarithmic()](#logarithmic)
  - [stepped()](#stepped)

> `const` **ClusterIconSizeTemplates**: `object`

Defined in: [api/layers/types.ts:50](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/types.ts#L50)

## Type Declaration

### linear()

> `readonly` **linear**: (`size`) => `number`

Linear scaling: smooth growth with a cap to avoid giant cluster icons.

#### Parameters

##### size

`number`

#### Returns

`number`

### logarithmic()

> `readonly` **logarithmic**: (`size`) => `number`

Logarithmic scaling: stronger early growth, then tapers for dense clusters.

#### Parameters

##### size

`number`

#### Returns

`number`

### stepped()

> `readonly` **stepped**: (`size`) => `1` \| `1.15` \| `1.35` \| `1.6` \| `1.85`

Stepped scaling: predictable visual tiers for quick density reading.

#### Parameters

##### size

`number`

#### Returns

`1` \| `1.15` \| `1.35` \| `1.6` \| `1.85`
