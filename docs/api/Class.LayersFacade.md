[**@gaming.tools/gtmap**](README.md)

***

# Class: LayersFacade

[← Back to API index](./README.md)

## Contents

- [Methods](#methods)
  - [addLayer()](#addlayer)
  - [createClusteredLayer()](#createclusteredlayer)
  - [createInteractiveLayer()](#createinteractivelayer)
  - [createStaticLayer()](#createstaticlayer)
  - [createTileLayer()](#createtilelayer)
  - [removeLayer()](#removelayer)
  - [setLayerOpacity()](#setlayeropacity)
  - [setLayerVisible()](#setlayervisible)
  - [setLayerZ()](#setlayerz)

Defined in: [api/facades/layers-facade.ts:25](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/layers-facade.ts#L25)

## Methods

### addLayer()

> **addLayer**(`layer`, `opts`): `void`

Defined in: [api/facades/layers-facade.ts:64](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/layers-facade.ts#L64)

Add a layer to the map at a given z-order.

#### Parameters

##### layer

`AnyLayer`

##### opts

[`AddLayerOptions`](Interface.AddLayerOptions.md)

#### Returns

`void`

***

### createClusteredLayer()

> **createClusteredLayer**(`opts?`): [`ClusteredLayer`](Class.ClusteredLayer.md)

Defined in: [api/facades/layers-facade.ts:57](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/layers-facade.ts#L57)

Create a clustered layer that groups nearby markers into clusters (not yet added to the map).

#### Parameters

##### opts?

[`ClusteredLayerOptions`](Interface.ClusteredLayerOptions.md)

#### Returns

[`ClusteredLayer`](Class.ClusteredLayer.md)

***

### createInteractiveLayer()

> **createInteractiveLayer**(): [`InteractiveLayer`](Class.InteractiveLayer.md)

Defined in: [api/facades/layers-facade.ts:43](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/layers-facade.ts#L43)

Create an interactive layer for markers with hit-testing (not yet added to the map).

#### Returns

[`InteractiveLayer`](Class.InteractiveLayer.md)

***

### createStaticLayer()

> **createStaticLayer**(): [`StaticLayer`](Class.StaticLayer.md)

Defined in: [api/facades/layers-facade.ts:50](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/layers-facade.ts#L50)

Create a static layer for vector shapes (not yet added to the map).

#### Returns

[`StaticLayer`](Class.StaticLayer.md)

***

### createTileLayer()

> **createTileLayer**(`opts`): [`TileLayer`](Class.TileLayer.md)

Defined in: [api/facades/layers-facade.ts:36](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/layers-facade.ts#L36)

Create a tile layer backed by a GTPK tile pyramid (not yet added to the map).

#### Parameters

##### opts

[`TileLayerOptions`](Interface.TileLayerOptions.md)

#### Returns

[`TileLayer`](Class.TileLayer.md)

***

### removeLayer()

> **removeLayer**(`layer`): `void`

Defined in: [api/facades/layers-facade.ts:71](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/layers-facade.ts#L71)

Remove a layer from the map (data is preserved).

#### Parameters

##### layer

`AnyLayer`

#### Returns

`void`

***

### setLayerOpacity()

> **setLayerOpacity**(`layer`, `opacity`): `void`

Defined in: [api/facades/layers-facade.ts:78](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/layers-facade.ts#L78)

Set opacity for an attached layer (0 to 1).

#### Parameters

##### layer

`AnyLayer`

##### opacity

`number`

#### Returns

`void`

***

### setLayerVisible()

> **setLayerVisible**(`layer`, `visible`): `void`

Defined in: [api/facades/layers-facade.ts:85](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/layers-facade.ts#L85)

Set visibility for an attached layer.

#### Parameters

##### layer

`AnyLayer`

##### visible

`boolean`

#### Returns

`void`

***

### setLayerZ()

> **setLayerZ**(`layer`, `z`): `void`

Defined in: [api/facades/layers-facade.ts:92](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/layers-facade.ts#L92)

Set z-order for an attached layer.

#### Parameters

##### layer

`AnyLayer`

##### z

`number`

#### Returns

`void`
