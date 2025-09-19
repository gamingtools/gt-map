[**@gaming.tools/gtmap**](README.md)

***

# Class: LeafletCompat\<TMarkerData\>

[← Back to API index](./README.md)

## Contents

- [Type Parameters](#type-parameters)
  - [TMarkerData](#tmarkerdata)
- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Methods](#methods)
  - [addCircle()](#addcircle)
  - [addIcon()](#addicon)
  - [addLayer()](#addlayer)
  - [addMarker()](#addmarker)
  - [addPolygon()](#addpolygon)
  - [addPolyline()](#addpolyline)
  - [clearMarkers()](#clearmarkers)
  - [clearVectors()](#clearvectors)
  - [fitBounds()](#fitbounds)
  - [flyTo()](#flyto)
  - [getBoundsZoom()](#getboundszoom)
  - [getCenter()](#getcenter)
  - [getZoom()](#getzoom)
  - [getZoomScale()](#getzoomscale)
  - [hasLayer()](#haslayer)
  - [icon()](#icon)
  - [marker()](#marker)
  - [on()](#on)
  - [once()](#once)
  - [panTo()](#panto)
  - [project()](#project)
  - [removeLayer()](#removelayer)
  - [setView()](#setview)
  - [unproject()](#unproject)

Defined in: [compat/leaflet-compat.ts:38](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L38)

## Type Parameters

### TMarkerData

`TMarkerData` = `unknown`

## Constructors

### Constructor

> **new LeafletCompat**\<`TMarkerData`\>(`map`): `LeafletCompat`\<`TMarkerData`\>

Defined in: [compat/leaflet-compat.ts:39](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L39)

#### Parameters

##### map

[`GTMap`](Class.GTMap.md)\<`TMarkerData`\>

#### Returns

`LeafletCompat`\<`TMarkerData`\>

## Methods

### addCircle()

> **addCircle**(`latlng`, `radius`, `style?`): [`VectorEntity`](Class.VectorEntity.md)

Defined in: [compat/leaflet-compat.ts:149](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L149)

#### Parameters

##### latlng

[`LatLngLike`](TypeAlias.LatLngLike.md)

##### radius

`number`

##### style?

[`VectorStyle`](Interface.VectorStyle.md)

#### Returns

[`VectorEntity`](Class.VectorEntity.md)

***

### addIcon()

> **addIcon**(`opts`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [compat/leaflet-compat.ts:125](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L125)

Alias to `icon()` for symmetry with Leaflet.

#### Parameters

##### opts

[`LeafletIconOptions`](Interface.LeafletIconOptions.md)

#### Returns

[`IconHandle`](Interface.IconHandle.md)

***

### addLayer()

> **addLayer**(`marker`): `void`

Defined in: [compat/leaflet-compat.ts:160](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L160)

#### Parameters

##### marker

`CompatMarker`\<`TMarkerData`\>

#### Returns

`void`

***

### addMarker()

> **addMarker**(`latlng`, `opts?`): `CompatMarker`\<`TMarkerData`\>

Defined in: [compat/leaflet-compat.ts:135](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L135)

Convenience: create and return a marker wrapper (alias of `marker`).

#### Parameters

##### latlng

[`LatLngLike`](TypeAlias.LatLngLike.md)

##### opts?

###### data?

`TMarkerData`

###### icon?

[`IconHandle`](Interface.IconHandle.md)

###### rotation?

`number`

###### size?

`number`

#### Returns

`CompatMarker`\<`TMarkerData`\>

***

### addPolygon()

> **addPolygon**(`latlngs`, `style?`): [`VectorEntity`](Class.VectorEntity.md)

Defined in: [compat/leaflet-compat.ts:144](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L144)

#### Parameters

##### latlngs

[`LatLngLike`](TypeAlias.LatLngLike.md)[]

##### style?

[`VectorStyle`](Interface.VectorStyle.md)

#### Returns

[`VectorEntity`](Class.VectorEntity.md)

***

### addPolyline()

> **addPolyline**(`latlngs`, `style?`): [`VectorEntity`](Class.VectorEntity.md)

Defined in: [compat/leaflet-compat.ts:139](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L139)

#### Parameters

##### latlngs

[`LatLngLike`](TypeAlias.LatLngLike.md)[]

##### style?

[`VectorStyle`](Interface.VectorStyle.md)

#### Returns

[`VectorEntity`](Class.VectorEntity.md)

***

### clearMarkers()

> **clearMarkers**(): `void`

Defined in: [compat/leaflet-compat.ts:154](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L154)

#### Returns

`void`

***

### clearVectors()

> **clearVectors**(): `void`

Defined in: [compat/leaflet-compat.ts:155](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L155)

#### Returns

`void`

***

### fitBounds()

> **fitBounds**(`bounds`, `opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [compat/leaflet-compat.ts:62](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L62)

#### Parameters

##### bounds

\[[`LatLngLike`](TypeAlias.LatLngLike.md), [`LatLngLike`](TypeAlias.LatLngLike.md)\] | `LatLngBoundsCompat`

##### opts?

###### animate?

`boolean`

###### maxZoom?

`number`

###### padding?

[`LeafletPadding`](TypeAlias.LeafletPadding.md)

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

***

### flyTo()

> **flyTo**(`latlng`, `zoom`, `opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [compat/leaflet-compat.ts:52](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L52)

#### Parameters

##### latlng

[`LatLngLike`](TypeAlias.LatLngLike.md)

##### zoom

`number`

##### opts?

###### duration?

`number`

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

***

### getBoundsZoom()

> **getBoundsZoom**(`bounds`, `_inside?`): `number`

Defined in: [compat/leaflet-compat.ts:93](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L93)

Compute the zoom that fits given bounds; approximates Leaflet's getBoundsZoom.

#### Parameters

##### bounds

\[[`LatLngLike`](TypeAlias.LatLngLike.md), [`LatLngLike`](TypeAlias.LatLngLike.md)\]

##### \_inside?

`boolean`

#### Returns

`number`

***

### getCenter()

> **getCenter**(): `object`

Defined in: [compat/leaflet-compat.ts:184](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L184)

Get center as LatLng (CRS.Simple).

#### Returns

`object`

##### lat

> **lat**: `number`

##### lng

> **lng**: `number`

***

### getZoom()

> **getZoom**(): `number`

Defined in: [compat/leaflet-compat.ts:87](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L87)

Current zoom (fractional allowed).

#### Returns

`number`

***

### getZoomScale()

> **getZoomScale**(`toZoom`, `fromZoom`): `number`

Defined in: [compat/leaflet-compat.ts:90](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L90)

Scale factor from `fromZoom` → `toZoom` (2^(to-from)).

#### Parameters

##### toZoom

`number`

##### fromZoom

`number`

#### Returns

`number`

***

### hasLayer()

> **hasLayer**(`marker`): `boolean`

Defined in: [compat/leaflet-compat.ts:159](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L159)

#### Parameters

##### marker

`CompatMarker`\<`TMarkerData`\>

#### Returns

`boolean`

***

### icon()

> **icon**(`opts`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [compat/leaflet-compat.ts:118](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L118)

Create an icon handle (Leaflet-like).

#### Parameters

##### opts

[`LeafletIconOptions`](Interface.LeafletIconOptions.md)

#### Returns

[`IconHandle`](Interface.IconHandle.md)

***

### marker()

> **marker**(`latlng`, `opts?`): `CompatMarker`\<`TMarkerData`\>

Defined in: [compat/leaflet-compat.ts:128](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L128)

Create a marker wrapper with Leaflet-like API.

#### Parameters

##### latlng

[`LatLngLike`](TypeAlias.LatLngLike.md)

##### opts?

###### data?

`TMarkerData`

###### icon?

[`IconHandle`](Interface.IconHandle.md)

###### rotation?

`number`

###### size?

`number`

#### Returns

`CompatMarker`\<`TMarkerData`\>

***

### on()

> **on**\<`K`\>(`name`, `handler`): [`Unsubscribe`](TypeAlias.Unsubscribe.md)

Defined in: [compat/leaflet-compat.ts:108](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L108)

#### Type Parameters

##### K

`K` *extends* `"click"` \| `"load"` \| `"resize"` \| `"move"` \| `"moveend"` \| `"zoom"` \| `"zoomend"` \| `"pointerdown"` \| `"pointermove"` \| `"pointerup"` \| `"frame"` \| `"markerenter"` \| `"markerleave"` \| `"markerclick"` \| `"markerdown"` \| `"markerup"` \| `"markerlongpress"` \| `"mousedown"` \| `"mousemove"` \| `"mouseup"` \| `"dblclick"` \| `"contextmenu"`

#### Parameters

##### name

`K`

##### handler

(`e`) => `void`

#### Returns

[`Unsubscribe`](TypeAlias.Unsubscribe.md)

***

### once()

> **once**\<`K`\>(`name`): `Promise`\<[`EventMap`](Interface.EventMap.md)\<`TMarkerData`\>\[`K`\]\>

Defined in: [compat/leaflet-compat.ts:112](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L112)

#### Type Parameters

##### K

`K` *extends* `"click"` \| `"load"` \| `"resize"` \| `"move"` \| `"moveend"` \| `"zoom"` \| `"zoomend"` \| `"pointerdown"` \| `"pointermove"` \| `"pointerup"` \| `"frame"` \| `"markerenter"` \| `"markerleave"` \| `"markerclick"` \| `"markerdown"` \| `"markerup"` \| `"markerlongpress"` \| `"mousedown"` \| `"mousemove"` \| `"mouseup"` \| `"dblclick"` \| `"contextmenu"`

#### Parameters

##### name

`K`

#### Returns

`Promise`\<[`EventMap`](Interface.EventMap.md)\<`TMarkerData`\>\[`K`\]\>

***

### panTo()

> **panTo**(`latlng`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [compat/leaflet-compat.ts:47](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L47)

#### Parameters

##### latlng

[`LatLngLike`](TypeAlias.LatLngLike.md)

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

***

### project()

> **project**(`ll`, `_zoomRef`): \[`number`, `number`\]

Defined in: [compat/leaflet-compat.ts:178](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L178)

Convert LatLng (CRS.Simple) to pixel coords (world): returns [x, y] = [lng, -lat].

#### Parameters

##### ll

[`LatLngLike`](TypeAlias.LatLngLike.md)

##### \_zoomRef

`number`

#### Returns

\[`number`, `number`\]

***

### removeLayer()

> **removeLayer**(`marker`): `void`

Defined in: [compat/leaflet-compat.ts:165](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L165)

#### Parameters

##### marker

`CompatMarker`\<`TMarkerData`\>

#### Returns

`void`

***

### setView()

> **setView**(`latlng`, `zoom`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [compat/leaflet-compat.ts:42](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L42)

#### Parameters

##### latlng

[`LatLngLike`](TypeAlias.LatLngLike.md)

##### zoom

`number`

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

***

### unproject()

> **unproject**(`px`, `_zoomRef`): `object`

Defined in: [compat/leaflet-compat.ts:172](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/compat/leaflet-compat.ts#L172)

Convert pixel coords (world) to LatLng (CRS.Simple): returns { lat: -y, lng: x }.

#### Parameters

##### px

\[`number`, `number`\]

##### \_zoomRef

`number`

#### Returns

`object`

##### lat

> **lat**: `number`

##### lng

> **lng**: `number`
