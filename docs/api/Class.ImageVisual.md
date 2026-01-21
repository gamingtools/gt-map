[**@gaming.tools/gtmap**](README.md)

***

# Class: ImageVisual

[← Back to API index](./README.md)

## Contents

- [Example](#example)
- [Extends](#extends)
- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Properties](#properties)
  - [anchor](#anchor)
  - [icon](#icon)
  - [icon2x?](#icon2x)
  - [iconScaleFunction?](#iconscalefunction)
  - [size](#size)
  - [type](#type)
- [Methods](#methods)
  - [getSize()](#getsize)

Defined in: [api/visual.ts:122](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L122)

Image-based visual using a bitmap icon.

## Example

```ts
const icon = new ImageVisual('/icons/marker.png', 32);
icon.anchor = 'bottom-center';
```

## Extends

- [`Visual`](Class.Visual.md)

## Constructors

### Constructor

> **new ImageVisual**(`icon`, `size`, `icon2x?`): `ImageVisual`

Defined in: [api/visual.ts:140](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L140)

Create an image visual.

#### Parameters

##### icon

`string`

URL or data URL for the icon

##### size

[`VisualSize`](TypeAlias.VisualSize.md)

Display size (number for square, or {width, height})

##### icon2x?

`string`

Optional 2x retina icon URL

#### Returns

`ImageVisual`

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

### icon

> `readonly` **icon**: `string`

Defined in: [api/visual.ts:126](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L126)

URL or data URL for the icon bitmap.

***

### icon2x?

> `readonly` `optional` **icon2x**: `string`

Defined in: [api/visual.ts:129](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L129)

Optional URL for 2x (retina) bitmap.

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

Defined in: [api/visual.ts:132](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L132)

Display size in pixels.

***

### type

> `readonly` **type**: `"image"`

Defined in: [api/visual.ts:123](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L123)

Discriminator for runtime type checking.

#### Overrides

[`Visual`](Class.Visual.md).[`type`](Class.Visual.md#type)

## Methods

### getSize()

> **getSize**(): `object`

Defined in: [api/visual.ts:148](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L148)

Get resolved size as {width, height}.

#### Returns

`object`

##### height

> **height**: `number`

##### width

> **width**: `number`
