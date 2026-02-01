[**@gaming.tools/gtmap**](README.md)

***

# Class: GTMap

[← Back to API index](./README.md)

## Contents

- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Properties](#properties)
  - [content](#content)
  - [display](#display)
  - [input](#input)
  - [view](#view)
- [Accessors](#accessors)
  - [events](#events)
- [Methods](#methods)
  - [destroy()](#destroy)
  - [resume()](#resume)
  - [suspend()](#suspend)

Defined in: [api/map.ts:35](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/map.ts#L35)

## Constructors

### Constructor

> **new GTMap**(`container`, `options`): `GTMap`

Defined in: [api/map.ts:48](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/map.ts#L48)

#### Parameters

##### container

`HTMLElement`

##### options

[`MapOptions`](Interface.MapOptions.md)

#### Returns

`GTMap`

## Properties

### content

> `readonly` **content**: [`ContentFacade`](Class.ContentFacade.md)

Defined in: [api/map.ts:44](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/map.ts#L44)

Content management: markers, vectors, icons.

***

### display

> `readonly` **display**: [`DisplayFacade`](Class.DisplayFacade.md)

Defined in: [api/map.ts:46](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/map.ts#L46)

Display settings: background, grid, upscale filter, FPS.

***

### input

> `readonly` **input**: [`InputFacade`](Class.InputFacade.md)

Defined in: [api/map.ts:42](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/map.ts#L42)

Input settings: wheel speed, inertia.

***

### view

> `readonly` **view**: [`ViewFacade`](Class.ViewFacade.md)

Defined in: [api/map.ts:40](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/map.ts#L40)

View control: center, zoom, transitions, bounds, coordinates.

## Accessors

### events

#### Get Signature

> **get** **events**(): [`MapEvents`](Interface.MapEvents.md)

Defined in: [api/map.ts:192](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/map.ts#L192)

##### Returns

[`MapEvents`](Interface.MapEvents.md)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [api/map.ts:186](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/map.ts#L186)

#### Returns

`void`

***

### resume()

> **resume**(): `this`

Defined in: [api/map.ts:181](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/map.ts#L181)

#### Returns

`this`

***

### suspend()

> **suspend**(`opts?`): `this`

Defined in: [api/map.ts:176](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/map.ts#L176)

#### Parameters

##### opts?

[`SuspendOptions`](Interface.SuspendOptions.md)

#### Returns

`this`
