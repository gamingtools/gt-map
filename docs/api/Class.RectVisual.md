[**@gaming.tools/gtmap**](README.md)

***

# Class: RectVisual

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Example](#example)
- [Extends](#extends)
- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Properties](#properties)
  - [anchor](#anchor)
  - [borderRadius?](#borderradius)
  - [fill?](#fill)
  - [iconScaleFunction?](#iconscalefunction)
  - [size](#size)
  - [stroke?](#stroke)
  - [strokeWidth?](#strokewidth)
  - [type](#type)
- [Methods](#methods)
  - [getSize()](#getsize)

Defined in: [api/visual.ts:281](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L281)

Rectangle shape visual.

## Remarks

For point-based rectangle markers. For absolute-coordinate rectangles, use Vector with polygon geometry.

## Example

```ts
const box = new RectVisual({ width: 20, height: 16 }, { fill: '#0000ff', stroke: '#000' });
```

## Extends

- [`Visual`](Class.Visual.md)

## Constructors

### Constructor

> **new RectVisual**(`size`, `options`): `RectVisual`

Defined in: [api/visual.ts:304](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L304)

Create a rectangle visual.

#### Parameters

##### size

[`VisualSize`](TypeAlias.VisualSize.md)

Rectangle size (number for square, or {width, height})

##### options

Styling options

###### borderRadius?

`number`

###### fill?

`string`

###### stroke?

`string`

###### strokeWidth?

`number`

#### Returns

`RectVisual`

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

### borderRadius?

> `readonly` `optional` **borderRadius**: `number`

Defined in: [api/visual.ts:297](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L297)

Corner radius for rounded rectangles.

***

### fill?

> `readonly` `optional` **fill**: `string`

Defined in: [api/visual.ts:288](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L288)

Fill color.

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

Defined in: [api/visual.ts:285](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L285)

Rectangle size.

***

### stroke?

> `readonly` `optional` **stroke**: `string`

Defined in: [api/visual.ts:291](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L291)

Stroke color.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth**: `number`

Defined in: [api/visual.ts:294](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L294)

Stroke width in pixels.

***

### type

> `readonly` **type**: `"rect"`

Defined in: [api/visual.ts:282](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L282)

Discriminator for runtime type checking.

#### Overrides

[`Visual`](Class.Visual.md).[`type`](Class.Visual.md#type)

## Methods

### getSize()

> **getSize**(): `object`

Defined in: [api/visual.ts:322](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L322)

Get resolved size as {width, height}.

#### Returns

`object`

##### height

> **height**: `number`

##### width

> **width**: `number`
