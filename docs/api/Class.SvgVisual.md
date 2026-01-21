[**@gaming.tools/gtmap**](README.md)

***

# Class: SvgVisual

[← Back to API index](./README.md)

## Contents

- [Example](#example)
- [Extends](#extends)
- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Properties](#properties)
  - [anchor](#anchor)
  - [iconScaleFunction?](#iconscalefunction)
  - [size](#size)
  - [svg](#svg)
  - [type](#type)
- [Methods](#methods)
  - [getSize()](#getsize)

Defined in: [api/visual.ts:336](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L336)

SVG-based visual.

## Example

```ts
const svg = new SvgVisual('<svg>...</svg>', { width: 24, height: 24 });
```

## Extends

- [`Visual`](Class.Visual.md)

## Constructors

### Constructor

> **new SvgVisual**(`svg`, `size`): `SvgVisual`

Defined in: [api/visual.ts:350](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L350)

Create an SVG visual.

#### Parameters

##### svg

`string`

SVG content string or URL

##### size

[`VisualSize`](TypeAlias.VisualSize.md)

Display size

#### Returns

`SvgVisual`

#### Overrides

[`Visual`](Class.Visual.md).[`constructor`](Class.Visual.md#constructor)

## Properties

### anchor

> **anchor**: [`Anchor`](TypeAlias.Anchor.md) = `'center'`

Defined in: [api/visual.ts:94](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L94)

Anchor point for positioning. Defaults to center.

#### Inherited from

[`Visual`](Class.Visual.md).[`anchor`](Class.Visual.md#anchor)

***

### iconScaleFunction?

> `optional` **iconScaleFunction**: `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [api/visual.ts:101](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L101)

Optional scale function for this visual.
Overrides the map-level iconScaleFunction when set.
Set to `null` to disable scaling (use scale=1 always).

#### Inherited from

[`Visual`](Class.Visual.md).[`iconScaleFunction`](Class.Visual.md#iconscalefunction)

***

### size

> `readonly` **size**: [`VisualSize`](TypeAlias.VisualSize.md)

Defined in: [api/visual.ts:343](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L343)

Display size.

***

### svg

> `readonly` **svg**: `string`

Defined in: [api/visual.ts:340](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L340)

SVG content (inline string or URL).

***

### type

> `readonly` **type**: `"svg"`

Defined in: [api/visual.ts:337](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L337)

Discriminator for runtime type checking.

#### Overrides

[`Visual`](Class.Visual.md).[`type`](Class.Visual.md#type)

## Methods

### getSize()

> **getSize**(): `object`

Defined in: [api/visual.ts:357](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L357)

Get resolved size as {width, height}.

#### Returns

`object`

##### height

> **height**: `number`

##### width

> **width**: `number`
