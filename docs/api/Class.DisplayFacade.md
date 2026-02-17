[**@gaming.tools/gtmap**](README.md)

***

# Class: DisplayFacade

[← Back to API index](./README.md)

## Contents

- [Methods](#methods)
  - [setBackgroundColor()](#setbackgroundcolor)
  - [setFpsCap()](#setfpscap)
  - [setGridVisible()](#setgridvisible)
  - [setUpscaleFilter()](#setupscalefilter)
  - [setZoomSnapThreshold()](#setzoomsnapthreshold)

Defined in: [api/facades/display-facade.ts:16](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/display-facade.ts#L16)

## Methods

### setBackgroundColor()

> **setBackgroundColor**(`color`): `void`

Defined in: [api/facades/display-facade.ts:48](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/display-facade.ts#L48)

Set the viewport background color.

#### Parameters

##### color

`string` | \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

#### Returns

`void`

***

### setFpsCap()

> **setFpsCap**(`v`): `void`

Defined in: [api/facades/display-facade.ts:41](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/display-facade.ts#L41)

Set the maximum frames per second.

#### Parameters

##### v

`number`

#### Returns

`void`

***

### setGridVisible()

> **setGridVisible**(`on`): `void`

Defined in: [api/facades/display-facade.ts:27](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/display-facade.ts#L27)

Show or hide the pixel grid overlay.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### setUpscaleFilter()

> **setUpscaleFilter**(`mode`): `void`

Defined in: [api/facades/display-facade.ts:34](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/display-facade.ts#L34)

Set the upscale filtering mode for the base image when zoomed in.

#### Parameters

##### mode

[`UpscaleFilterMode`](TypeAlias.UpscaleFilterMode.md)

#### Returns

`void`

***

### setZoomSnapThreshold()

> **setZoomSnapThreshold**(`v`): `void`

Defined in: [api/facades/display-facade.ts:56](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/facades/display-facade.ts#L56)

Set the fractional zoom threshold at which the renderer snaps to the next tile zoom level.
Range: 0 to 1. Default: 0.4.

#### Parameters

##### v

`number`

#### Returns

`void`
