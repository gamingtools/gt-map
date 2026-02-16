[**@gaming.tools/gtmap**](README.md)

***

# Class: LayersFacade

[← Back to API index](./README.md)

## Contents

- [Methods](#methods)
  - [addLayer()](#addlayer)
  - [createInteractiveLayer()](#createinteractivelayer)
  - [createStaticLayer()](#createstaticlayer)
  - [createTileLayer()](#createtilelayer)
  - [removeLayer()](#removelayer)
  - [setLayerOpacity()](#setlayeropacity)
  - [setLayerVisible()](#setlayervisible)
  - [setLayerZ()](#setlayerz)

Defined in: [api/facades/layers-facade.ts:23](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/facades/layers-facade.ts#L23)

## Methods

### addLayer()

> **addLayer**(`layer`, `opts`): `void`

Defined in: [api/facades/layers-facade.ts:55](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/facades/layers-facade.ts#L55)

Add a layer to the map at a given z-order.

#### Parameters

##### layer

`AnyLayer`

##### opts

[`AddLayerOptions`](Interface.AddLayerOptions.md)

#### Returns

`void`

***

### createInteractiveLayer()

> **createInteractiveLayer**(): [`InteractiveLayer`](Class.InteractiveLayer.md)

Defined in: [api/facades/layers-facade.ts:41](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/facades/layers-facade.ts#L41)

Create an interactive layer for markers with hit-testing (not yet added to the map).

#### Returns

[`InteractiveLayer`](Class.InteractiveLayer.md)

***

### createStaticLayer()

> **createStaticLayer**(): [`StaticLayer`](Class.StaticLayer.md)

Defined in: [api/facades/layers-facade.ts:48](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/facades/layers-facade.ts#L48)

Create a static layer for vector shapes (not yet added to the map).

#### Returns

[`StaticLayer`](Class.StaticLayer.md)

***

### createTileLayer()

> **createTileLayer**(`opts`): [`TileLayer`](Class.TileLayer.md)

Defined in: [api/facades/layers-facade.ts:34](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/facades/layers-facade.ts#L34)

Create a tile layer backed by a GTPK tile pyramid (not yet added to the map).

#### Parameters

##### opts

[`TileLayerOptions`](Interface.TileLayerOptions.md)

#### Returns

[`TileLayer`](Class.TileLayer.md)

***

### removeLayer()

> **removeLayer**(`layer`): `void`

Defined in: [api/facades/layers-facade.ts:62](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/facades/layers-facade.ts#L62)

Remove a layer from the map (data is preserved).

#### Parameters

##### layer

`AnyLayer`

#### Returns

`void`

***

### setLayerOpacity()

> **setLayerOpacity**(`layer`, `opacity`): `void`

Defined in: [api/facades/layers-facade.ts:69](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/facades/layers-facade.ts#L69)

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

Defined in: [api/facades/layers-facade.ts:76](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/facades/layers-facade.ts#L76)

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

Defined in: [api/facades/layers-facade.ts:83](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/facades/layers-facade.ts#L83)

Set z-order for an attached layer.

#### Parameters

##### layer

`AnyLayer`

##### z

`number`

#### Returns

`void`
