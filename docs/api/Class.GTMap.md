[**@gaming.tools/gtmap**](README.md)

***

# Class: GTMap\<TMarkerData, TVectorData\>

Defined in: [api/map.ts:41](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/map.ts#L41)

## Type Parameters

### TMarkerData

`TMarkerData` = `unknown`

### TVectorData

`TVectorData` = `unknown`

## Constructors

### Constructor

> **new GTMap**\<`TMarkerData`, `TVectorData`\>(`container`, `options`): `GTMap`\<`TMarkerData`, `TVectorData`\>

Defined in: [api/map.ts:54](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/map.ts#L54)

#### Parameters

##### container

`HTMLElement`

##### options

[`MapOptions`](Interface.MapOptions.md)

#### Returns

`GTMap`\<`TMarkerData`, `TVectorData`\>

## Properties

### content

> `readonly` **content**: [`ContentFacade`](Class.ContentFacade.md)\<`TMarkerData`, `TVectorData`\>

Defined in: [api/map.ts:50](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/map.ts#L50)

Content management: markers, decals, vectors, icons.

***

### display

> `readonly` **display**: [`DisplayFacade`](Class.DisplayFacade.md)

Defined in: [api/map.ts:52](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/map.ts#L52)

Display settings: background, grid, upscale filter, FPS.

***

### input

> `readonly` **input**: [`InputFacade`](Class.InputFacade.md)

Defined in: [api/map.ts:48](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/map.ts#L48)

Input settings: wheel speed, inertia.

***

### view

> `readonly` **view**: [`ViewFacade`](Class.ViewFacade.md)

Defined in: [api/map.ts:46](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/map.ts#L46)

View control: center, zoom, transitions, bounds, coordinates.

## Accessors

### events

#### Get Signature

> **get** **events**(): [`MapEvents`](Interface.MapEvents.md)\<`TMarkerData`\>

Defined in: [api/map.ts:164](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/map.ts#L164)

##### Returns

[`MapEvents`](Interface.MapEvents.md)\<`TMarkerData`\>

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [api/map.ts:158](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/map.ts#L158)

#### Returns

`void`

***

### resume()

> **resume**(): `this`

Defined in: [api/map.ts:153](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/map.ts#L153)

#### Returns

`this`

***

### suspend()

> **suspend**(`opts?`): `this`

Defined in: [api/map.ts:148](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/map.ts#L148)

#### Parameters

##### opts?

[`SuspendOptions`](Interface.SuspendOptions.md)

#### Returns

`this`
