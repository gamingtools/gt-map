[**@gaming.tools/gtmap**](README.md)

***

# Class: RectVisual

Defined in: [api/visual.ts:293](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L293)

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

Defined in: [api/visual.ts:316](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L316)

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

Defined in: [api/visual.ts:94](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L94)

Anchor point for positioning. Defaults to center.

#### Inherited from

[`Visual`](Class.Visual.md).[`anchor`](Class.Visual.md#anchor)

***

### borderRadius?

> `readonly` `optional` **borderRadius**: `number`

Defined in: [api/visual.ts:309](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L309)

Corner radius for rounded rectangles.

***

### fill?

> `readonly` `optional` **fill**: `string`

Defined in: [api/visual.ts:300](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L300)

Fill color.

***

### iconScaleFunction?

> `optional` **iconScaleFunction**: `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [api/visual.ts:101](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L101)

Optional scale function for this visual.
Overrides the map-level iconScaleFunction when set.
Set to `null` to disable scaling (use scale=1 always).

#### Inherited from

[`Visual`](Class.Visual.md).[`iconScaleFunction`](Class.Visual.md#iconscalefunction)

***

### size

> `readonly` **size**: [`VisualSize`](TypeAlias.VisualSize.md)

Defined in: [api/visual.ts:297](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L297)

Rectangle size.

***

### stroke?

> `readonly` `optional` **stroke**: `string`

Defined in: [api/visual.ts:303](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L303)

Stroke color.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth**: `number`

Defined in: [api/visual.ts:306](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L306)

Stroke width in pixels.

***

### type

> `readonly` **type**: `"rect"`

Defined in: [api/visual.ts:294](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L294)

Discriminator for runtime type checking.

#### Overrides

[`Visual`](Class.Visual.md).[`type`](Class.Visual.md#type)

## Methods

### getSize()

> **getSize**(): `object`

Defined in: [api/visual.ts:334](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L334)

Get resolved size as {width, height}.

#### Returns

`object`

##### height

> **height**: `number`

##### width

> **width**: `number`
