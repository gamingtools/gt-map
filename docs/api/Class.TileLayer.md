[**@gaming.tools/gtmap**](README.md)

***

# Class: TileLayer

Defined in: [api/layers/tile-layer.ts:16](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/tile-layer.ts#L16)

A layer backed by a GTPK tile pyramid.

## Remarks

Create via `map.layers.createTileLayer(options)`, then attach
with `map.layers.addLayer(layer, { z })`.

## Constructors

### Constructor

> **new TileLayer**(`options`): `TileLayer`

Defined in: [api/layers/tile-layer.ts:26](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/tile-layer.ts#L26)

#### Parameters

##### options

[`TileLayerOptions`](Interface.TileLayerOptions.md)

#### Returns

`TileLayer`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [api/layers/tile-layer.ts:18](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/tile-layer.ts#L18)

***

### options

> `readonly` **options**: `Readonly`\<[`TileLayerOptions`](Interface.TileLayerOptions.md)\>

Defined in: [api/layers/tile-layer.ts:19](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/tile-layer.ts#L19)

***

### type

> `readonly` **type**: `"tile"`

Defined in: [api/layers/tile-layer.ts:17](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/tile-layer.ts#L17)
