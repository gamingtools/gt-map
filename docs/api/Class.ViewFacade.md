[**@gaming.tools/gtmap**](README.md)

***

# Class: ViewFacade

Defined in: [api/facades/view-facade.ts:35](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L35)

## Implements

- `ViewTransitionHost`

## Accessors

### events

#### Get Signature

> **get** **events**(): `object`

Defined in: [api/facades/view-facade.ts:47](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L47)

Events surface (needed by ViewTransitionHost).

##### Returns

`object`

###### once()

###### Call Signature

> **once**(`event`): `Promise`\<[`MoveEventData`](Interface.MoveEventData.md)\>

###### Parameters

###### event

`"moveend"`

###### Returns

`Promise`\<[`MoveEventData`](Interface.MoveEventData.md)\>

###### Call Signature

> **once**(`event`): `Promise`\<[`ZoomEventData`](Interface.ZoomEventData.md)\>

###### Parameters

###### event

`"zoomend"`

###### Returns

`Promise`\<[`ZoomEventData`](Interface.ZoomEventData.md)\>

#### Implementation of

`ViewTransitionHost.events`

## Methods

### getCenter()

> **getCenter**(): [`Point`](TypeAlias.Point.md)

Defined in: [api/facades/view-facade.ts:56](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L56)

Get the current center position in world pixels.

#### Returns

[`Point`](TypeAlias.Point.md)

#### Implementation of

`ViewTransitionHost.getCenter`

***

### getPointerAbs()

> **getPointerAbs**(): `null` \| \{ `x`: `number`; `y`: `number`; \}

Defined in: [api/facades/view-facade.ts:71](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L71)

Get the last pointer position in world pixels.

#### Returns

`null` \| \{ `x`: `number`; `y`: `number`; \}

***

### getZoom()

> **getZoom**(): `number`

Defined in: [api/facades/view-facade.ts:64](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L64)

Get the current zoom level.

#### Returns

`number`

#### Implementation of

`ViewTransitionHost.getZoom`

***

### invalidateSize()

> **invalidateSize**(): `void`

Defined in: [api/facades/view-facade.ts:134](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L134)

Recompute canvas sizes after external container changes.

#### Returns

`void`

***

### resetIconScale()

> **resetIconScale**(): `void`

Defined in: [api/facades/view-facade.ts:120](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L120)

Reset icon scaling to default.

#### Returns

`void`

***

### setAutoResize()

> **setAutoResize**(`on`): `void`

Defined in: [api/facades/view-facade.ts:127](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L127)

Enable or disable automatic resize handling.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### setClipToBounds()

> **setClipToBounds**(`on`): `void`

Defined in: [api/facades/view-facade.ts:106](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L106)

Enable or disable clipping to map image bounds.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### setCoordBounds()

> **setCoordBounds**(`bounds`): `void`

Defined in: [api/facades/view-facade.ts:141](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L141)

Set source coordinate bounds for external-to-pixel mapping.

#### Parameters

##### bounds

[`SourceBounds`](TypeAlias.SourceBounds.md)

#### Returns

`void`

***

### setIconScaleFunction()

> **setIconScaleFunction**(`fn`): `void`

Defined in: [api/facades/view-facade.ts:113](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L113)

Set a custom icon scale function.

#### Parameters

##### fn

`null` | [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

#### Returns

`void`

***

### setMaxBoundsPx()

> **setMaxBoundsPx**(`bounds`): `void`

Defined in: [api/facades/view-facade.ts:92](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L92)

Constrain panning to pixel bounds. Pass null to clear.

#### Parameters

##### bounds

`null` | [`MaxBoundsPx`](Interface.MaxBoundsPx.md)

#### Returns

`void`

***

### setMaxBoundsViscosity()

> **setMaxBoundsViscosity**(`v`): `void`

Defined in: [api/facades/view-facade.ts:99](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L99)

Set bounds viscosity (0..1).

#### Parameters

##### v

`number`

#### Returns

`void`

***

### setWrapX()

> **setWrapX**(`on`): `void`

Defined in: [api/facades/view-facade.ts:85](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L85)

Enable or disable horizontal world wrap.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### transition()

> **transition**(): [`ViewTransition`](Interface.ViewTransition.md)

Defined in: [api/facades/view-facade.ts:78](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L78)

Start a chainable view transition.

#### Returns

[`ViewTransition`](Interface.ViewTransition.md)

***

### translate()

> **translate**(`x`, `y`, `type`): `object`

Defined in: [api/facades/view-facade.ts:150](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/facades/view-facade.ts#L150)

Translate from source coordinates to map pixel coordinates.

#### Parameters

##### x

`number`

##### y

`number`

##### type

[`TransformType`](TypeAlias.TransformType.md) = `'original'`

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`
