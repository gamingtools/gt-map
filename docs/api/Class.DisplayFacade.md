[**@gaming.tools/gtmap**](README.md)

***

# Class: DisplayFacade

[← Back to API index](./README.md)

## Contents

- [Methods](#methods)
  - [setBackgroundColor()](#setbackgroundcolor)
  - [setFpsCap()](#setfpscap)
  - [setGridVisible()](#setgridvisible)
  - [setRasterOpacity()](#setrasteropacity)
  - [setUpscaleFilter()](#setupscalefilter)
  - [setZoomSnapThreshold()](#setzoomsnapthreshold)

Defined in: [api/facades/display-facade.ts:17](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/display-facade.ts#L17)

## Methods

### setBackgroundColor()

> **setBackgroundColor**(`color`): `void`

Defined in: [api/facades/display-facade.ts:49](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/display-facade.ts#L49)

Set the viewport background color.

#### Parameters

##### color

`string` | \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

#### Returns

`void`

***

### setFpsCap()

> **setFpsCap**(`v`): `void`

Defined in: [api/facades/display-facade.ts:42](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/display-facade.ts#L42)

Set the maximum frames per second.

#### Parameters

##### v

`number`

#### Returns

`void`

***

### setGridVisible()

> **setGridVisible**(`on`): `void`

Defined in: [api/facades/display-facade.ts:28](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/display-facade.ts#L28)

Show or hide the pixel grid overlay.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### setRasterOpacity()

> **setRasterOpacity**(`v`): `void`

Defined in: [api/facades/display-facade.ts:56](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/display-facade.ts#L56)

Set the raster tile opacity.

#### Parameters

##### v

`number`

#### Returns

`void`

***

### setUpscaleFilter()

> **setUpscaleFilter**(`mode`): `void`

Defined in: [api/facades/display-facade.ts:35](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/display-facade.ts#L35)

Set the upscale filtering mode for the base image when zoomed in.

#### Parameters

##### mode

[`UpscaleFilterMode`](TypeAlias.UpscaleFilterMode.md)

#### Returns

`void`

***

### setZoomSnapThreshold()

> **setZoomSnapThreshold**(`v`): `void`

Defined in: [api/facades/display-facade.ts:64](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/display-facade.ts#L64)

Set the fractional zoom threshold at which the renderer snaps to the next tile zoom level.
Range: 0 to 1. Default: 0.4.

#### Parameters

##### v

`number`

#### Returns

`void`
