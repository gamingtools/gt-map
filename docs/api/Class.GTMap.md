[**@gaming.tools/gtmap**](README.md)

***

# Class: GTMap

Defined in: [api/map.ts:55](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/map.ts#L55)

GTMap -- the root class for creating and managing a WebGL map instance.

## Remarks

Construct with a container element and [MapOptions](Interface.MapOptions.md). Access functionality
through the four facades: [view](#view), [layers](#layers),
[display](#display), and [input](#input).
Subscribe to events via [events](#events).

## Constructors

### Constructor

> **new GTMap**(`container`, `options`): `GTMap`

Defined in: [api/map.ts:79](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/map.ts#L79)

Create a new GTMap instance inside the given container.

#### Parameters

##### container

`HTMLElement`

DOM element that will host the map canvas

##### options

[`MapOptions`](Interface.MapOptions.md)

Map configuration (size, zoom range, background, etc.)

#### Returns

`GTMap`

## Properties

### display

> `readonly` **display**: [`DisplayFacade`](Class.DisplayFacade.md)

Defined in: [api/map.ts:66](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/map.ts#L66)

Display settings: background, grid, upscale filter, FPS.

***

### input

> `readonly` **input**: [`InputFacade`](Class.InputFacade.md)

Defined in: [api/map.ts:64](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/map.ts#L64)

Input settings: wheel speed, inertia.

***

### layers

> `readonly` **layers**: [`LayersFacade`](Class.LayersFacade.md)

Defined in: [api/map.ts:62](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/map.ts#L62)

Layer management: creation, attachment, removal, per-layer display.

***

### view

> `readonly` **view**: [`ViewFacade`](Class.ViewFacade.md)

Defined in: [api/map.ts:60](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/map.ts#L60)

View control: center, zoom, transitions, bounds, coordinates.

## Accessors

### events

#### Get Signature

> **get** **events**(): [`MapEvents`](Interface.MapEvents.md)

Defined in: [api/map.ts:435](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/map.ts#L435)

Typed event surface for subscribing to map, pointer, and marker events.

##### Returns

[`MapEvents`](Interface.MapEvents.md)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [api/map.ts:421](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/map.ts#L421)

Destroy the map instance, releasing all resources and detaching from the DOM.

#### Returns

`void`

***

### resume()

> **resume**(): `this`

Defined in: [api/map.ts:415](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/map.ts#L415)

Resume rendering after a [suspend](#suspend) call.

#### Returns

`this`

***

### suspend()

> **suspend**(`opts?`): `this`

Defined in: [api/map.ts:409](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/map.ts#L409)

Suspend rendering and optionally release WebGL resources.
Call [resume](#resume) to restart.

#### Parameters

##### opts?

[`SuspendOptions`](Interface.SuspendOptions.md)

#### Returns

`this`
