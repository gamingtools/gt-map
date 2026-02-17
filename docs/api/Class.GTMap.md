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

Defined in: [api/map.ts:48](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/map.ts#L48)

## Constructors

### Constructor

> **new GTMap**(`container`, `options`): `GTMap`

Defined in: [api/map.ts:66](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/map.ts#L66)

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

Defined in: [api/map.ts:59](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/map.ts#L59)

Display settings: background, grid, upscale filter, FPS.

***

### input

> `readonly` **input**: [`InputFacade`](Class.InputFacade.md)

Defined in: [api/map.ts:57](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/map.ts#L57)

Input settings: wheel speed, inertia.

***

### layers

> `readonly` **layers**: [`LayersFacade`](Class.LayersFacade.md)

Defined in: [api/map.ts:55](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/map.ts#L55)

Layer management: creation, attachment, removal, per-layer display.

***

### view

> `readonly` **view**: [`ViewFacade`](Class.ViewFacade.md)

Defined in: [api/map.ts:53](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/map.ts#L53)

View control: center, zoom, transitions, bounds, coordinates.

## Accessors

### events

#### Get Signature

> **get** **events**(): [`MapEvents`](Interface.MapEvents.md)

Defined in: [api/map.ts:416](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/map.ts#L416)

##### Returns

[`MapEvents`](Interface.MapEvents.md)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [api/map.ts:403](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/map.ts#L403)

#### Returns

`void`

***

### resume()

> **resume**(): `this`

Defined in: [api/map.ts:398](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/map.ts#L398)

#### Returns

`this`

***

### suspend()

> **suspend**(`opts?`): `this`

Defined in: [api/map.ts:393](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/map.ts#L393)

#### Parameters

##### opts?

[`SuspendOptions`](Interface.SuspendOptions.md)

#### Returns

`this`
