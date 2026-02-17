[**@gaming.tools/gtmap**](README.md)

***

# Class: SpriteVisual

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Example](#example)
- [Extends](#extends)
- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Properties](#properties)
  - [anchor](#anchor)
  - [atlasHandle](#atlashandle)
  - [iconScaleFunction?](#iconscalefunction)
  - [size?](#size)
  - [spriteName](#spritename)
  - [type](#type)
- [Methods](#methods)
  - [getIconId()](#geticonid)
  - [getSize()](#getsize)

Defined in: [api/visual.ts:479](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L479)

Sprite-based visual referencing a sub-region of a loaded sprite atlas.

## Remarks

Use after calling `map.content.addSpriteAtlas()` to get a `SpriteAtlasHandle`.

## Example

```ts
const atlas = await map.content.addSpriteAtlas(url, descriptor);
const sprite = new SpriteVisual(atlas, 'sword', 32);
map.content.addMarker(100, 200, { visual: sprite });
```

## Extends

- [`Visual`](Class.Visual.md)

## Constructors

### Constructor

> **new SpriteVisual**(`atlasHandle`, `spriteName`, `size?`): `SpriteVisual`

Defined in: [api/visual.ts:497](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L497)

Create a sprite visual.

#### Parameters

##### atlasHandle

[`SpriteAtlasHandle`](Interface.SpriteAtlasHandle.md)

Handle returned from addSpriteAtlas

##### spriteName

`string`

Name of the sprite in the atlas descriptor

##### size?

[`VisualSize`](TypeAlias.VisualSize.md)

Optional display size override (number for square, or {width, height})

#### Returns

`SpriteVisual`

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

### atlasHandle

> `readonly` **atlasHandle**: [`SpriteAtlasHandle`](Interface.SpriteAtlasHandle.md)

Defined in: [api/visual.ts:483](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L483)

Handle to the loaded sprite atlas.

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

### size?

> `readonly` `optional` **size**: [`VisualSize`](TypeAlias.VisualSize.md)

Defined in: [api/visual.ts:489](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L489)

Optional display size override.

***

### spriteName

> `readonly` **spriteName**: `string`

Defined in: [api/visual.ts:486](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L486)

Name of the sprite within the atlas.

***

### type

> `readonly` **type**: `"sprite"`

Defined in: [api/visual.ts:480](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L480)

Discriminator for runtime type checking.

#### Overrides

[`Visual`](Class.Visual.md).[`type`](Class.Visual.md#type)

## Methods

### getIconId()

> **getIconId**(): `string`

Defined in: [api/visual.ts:505](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L505)

Get the icon ID for this sprite (atlasId/spriteName).

#### Returns

`string`

***

### getSize()

> **getSize**(): `undefined` \| \{ `height`: `number`; `width`: `number`; \}

Defined in: [api/visual.ts:510](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/visual.ts#L510)

Get resolved size as {width, height} if size is specified.

#### Returns

`undefined` \| \{ `height`: `number`; `width`: `number`; \}
