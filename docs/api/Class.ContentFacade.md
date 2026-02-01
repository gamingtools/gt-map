[**@gaming.tools/gtmap**](README.md)

***

# Class: ContentFacade\<TMarkerData, TVectorData\>

Defined in: [api/facades/content-facade.ts:28](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/content-facade.ts#L28)

## Type Parameters

### TMarkerData

`TMarkerData` = `unknown`

### TVectorData

`TVectorData` = `unknown`

## Properties

### decals

> `readonly` **decals**: [`EntityCollection`](Class.EntityCollection.md)\<[`Decal`](Class.Decal.md)\>

Defined in: [api/facades/content-facade.ts:35](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/content-facade.ts#L35)

Decal collection for this map.

***

### markers

> `readonly` **markers**: [`EntityCollection`](Class.EntityCollection.md)\<[`Marker`](Class.Marker.md)\<`TMarkerData`\>\>

Defined in: [api/facades/content-facade.ts:33](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/content-facade.ts#L33)

Marker collection for this map.

***

### vectors

> `readonly` **vectors**: [`EntityCollection`](Class.EntityCollection.md)\<[`Vector`](Class.Vector.md)\<`TVectorData`\>\>

Defined in: [api/facades/content-facade.ts:37](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/content-facade.ts#L37)

Vector collection for this map.

## Methods

### addDecal()

> **addDecal**(`x`, `y`, `opts`): [`Decal`](Class.Decal.md)

Defined in: [api/facades/content-facade.ts:111](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/content-facade.ts#L111)

Create and add a decal (non-interactive visual).

#### Parameters

##### x

`number`

##### y

`number`

##### opts

[`DecalOptions`](Interface.DecalOptions.md)

#### Returns

[`Decal`](Class.Decal.md)

***

### addIcon()

> **addIcon**(`def`, `id?`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [api/facades/content-facade.ts:71](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/content-facade.ts#L71)

Register an icon definition for use with markers.

#### Parameters

##### def

[`IconDef`](Interface.IconDef.md)

##### id?

`string`

#### Returns

[`IconHandle`](Interface.IconHandle.md)

***

### addMarker()

> **addMarker**(`x`, `y`, `opts`): [`Marker`](Class.Marker.md)\<`TMarkerData`\>

Defined in: [api/facades/content-facade.ts:92](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/content-facade.ts#L92)

Create and add a marker.

#### Parameters

##### x

`number`

##### y

`number`

##### opts

[`MarkerOptions`](Interface.MarkerOptions.md)\<`TMarkerData`\>

#### Returns

[`Marker`](Class.Marker.md)\<`TMarkerData`\>

***

### addVector()

> **addVector**(`geometry`, `opts?`): [`Vector`](Class.Vector.md)\<`TVectorData`\>

Defined in: [api/facades/content-facade.ts:131](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/content-facade.ts#L131)

Create and add a vector shape.

#### Parameters

##### geometry

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

##### opts?

###### data?

`TVectorData`

#### Returns

[`Vector`](Class.Vector.md)\<`TVectorData`\>

***

### clearDecals()

> **clearDecals**(): `void`

Defined in: [api/facades/content-facade.ts:121](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/content-facade.ts#L121)

Remove all decals.

#### Returns

`void`

***

### clearMarkers()

> **clearMarkers**(): `void`

Defined in: [api/facades/content-facade.ts:102](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/content-facade.ts#L102)

Remove all markers.

#### Returns

`void`

***

### clearVectors()

> **clearVectors**(): `void`

Defined in: [api/facades/content-facade.ts:141](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/content-facade.ts#L141)

Remove all vectors.

#### Returns

`void`
