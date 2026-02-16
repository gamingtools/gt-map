[**@gaming.tools/gtmap**](README.md)

***

# Class: GTMap

[← Back to API index](./README.md)

## Contents

- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Properties](#properties)
  - [display](#display)
  - [input](#input)
  - [layers](#layers)
  - [view](#view)
- [Accessors](#accessors)
  - [events](#events)
- [Methods](#methods)
  - [destroy()](#destroy)
  - [resume()](#resume)
  - [suspend()](#suspend)

Defined in: [api/map.ts:46](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/map.ts#L46)

## Constructors

### Constructor

> **new GTMap**(`container`, `options`): `GTMap`

Defined in: [api/map.ts:64](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/map.ts#L64)

#### Parameters

##### container

`HTMLElement`

##### options

[`MapOptions`](Interface.MapOptions.md)

#### Returns

`GTMap`

## Properties

### display

> `readonly` **display**: [`DisplayFacade`](Class.DisplayFacade.md)

Defined in: [api/map.ts:57](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/map.ts#L57)

Display settings: background, grid, upscale filter, FPS.

***

### input

> `readonly` **input**: [`InputFacade`](Class.InputFacade.md)

Defined in: [api/map.ts:55](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/map.ts#L55)

Input settings: wheel speed, inertia.

***

### layers

> `readonly` **layers**: [`LayersFacade`](Class.LayersFacade.md)

Defined in: [api/map.ts:53](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/map.ts#L53)

Layer management: creation, attachment, removal, per-layer display.

***

### view

> `readonly` **view**: [`ViewFacade`](Class.ViewFacade.md)

Defined in: [api/map.ts:51](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/map.ts#L51)

View control: center, zoom, transitions, bounds, coordinates.

## Accessors

### events

#### Get Signature

> **get** **events**(): [`MapEvents`](Interface.MapEvents.md)

Defined in: [api/map.ts:353](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/map.ts#L353)

##### Returns

[`MapEvents`](Interface.MapEvents.md)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [api/map.ts:340](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/map.ts#L340)

#### Returns

`void`

***

### resume()

> **resume**(): `this`

Defined in: [api/map.ts:335](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/map.ts#L335)

#### Returns

`this`

***

### suspend()

> **suspend**(`opts?`): `this`

Defined in: [api/map.ts:330](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/map.ts#L330)

#### Parameters

##### opts?

[`SuspendOptions`](Interface.SuspendOptions.md)

#### Returns

`this`
