[**@gaming.tools/gtmap**](README.md)

***

# Class: HtmlVisual

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Example](#example)
- [Extends](#extends)
- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Properties](#properties)
  - [anchor](#anchor)
  - [html](#html)
  - [iconScaleFunction?](#iconscalefunction)
  - [size](#size)
  - [type](#type)
- [Methods](#methods)
  - [getSize()](#getsize)

Defined in: [api/visual.ts:439](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L439)

HTML-based visual for complex content.

## Remarks

Rendered as a DOM overlay. Use sparingly for performance.

## Example

```ts
const html = new HtmlVisual('<div class="tooltip">Info</div>', { width: 100, height: 50 });
```

## Extends

- [`Visual`](Class.Visual.md)

## Constructors

### Constructor

> **new HtmlVisual**(`html`, `size`): `HtmlVisual`

Defined in: [api/visual.ts:453](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L453)

Create an HTML visual.

#### Parameters

##### html

`string`

HTML content string

##### size

[`VisualSize`](TypeAlias.VisualSize.md)

Display size

#### Returns

`HtmlVisual`

#### Overrides

[`Visual`](Class.Visual.md).[`constructor`](Class.Visual.md#constructor)

## Properties

### anchor

> **anchor**: [`Anchor`](TypeAlias.Anchor.md) = `'center'`

Defined in: [api/visual.ts:94](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L94)

Anchor point for positioning. Defaults to center.

#### Inherited from

[`Visual`](Class.Visual.md).[`anchor`](Class.Visual.md#anchor)

***

### html

> `readonly` **html**: `string`

Defined in: [api/visual.ts:443](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L443)

HTML content string.

***

### iconScaleFunction?

> `optional` **iconScaleFunction**: `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [api/visual.ts:101](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L101)

Optional scale function for this visual.
Overrides the map-level iconScaleFunction when set.
Set to `null` to disable scaling (use scale=1 always).

#### Inherited from

[`Visual`](Class.Visual.md).[`iconScaleFunction`](Class.Visual.md#iconscalefunction)

***

### size

> `readonly` **size**: [`VisualSize`](TypeAlias.VisualSize.md)

Defined in: [api/visual.ts:446](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L446)

Display size.

***

### type

> `readonly` **type**: `"html"`

Defined in: [api/visual.ts:440](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L440)

Discriminator for runtime type checking.

#### Overrides

[`Visual`](Class.Visual.md).[`type`](Class.Visual.md#type)

## Methods

### getSize()

> **getSize**(): `object`

Defined in: [api/visual.ts:460](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L460)

Get resolved size as {width, height}.

#### Returns

`object`

##### height

> **height**: `number`

##### width

> **width**: `number`
