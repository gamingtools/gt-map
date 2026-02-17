[**@gaming.tools/gtmap**](README.md)

***

# Class: SvgVisual

Defined in: [api/visual.ts:371](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L371)

SVG-based visual with color customization and shadow support.

## Remarks

Supports inline SVG content or URLs. Colors can be overridden dynamically.

## Example

```ts
// Basic SVG
const icon = new SvgVisual('<svg>...</svg>', { width: 24, height: 24 });

// With color override and shadow
const colored = new SvgVisual('<svg>...</svg>', { width: 32, height: 32 }, {
  fill: '#ff0000',
  stroke: '#000000',
  shadow: { blur: 4, offsetY: 2 }
});
```

## Extends

- [`Visual`](Class.Visual.md)

## Constructors

### Constructor

> **new SvgVisual**(`svg`, `size`, `options`): `SvgVisual`

Defined in: [api/visual.ts:398](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L398)

Create an SVG visual.

#### Parameters

##### svg

`string`

SVG content string or URL

##### size

[`VisualSize`](TypeAlias.VisualSize.md)

Display size

##### options

Color and shadow options

###### fill?

`string`

Override fill color for all SVG elements

###### shadow?

[`SvgShadow`](Interface.SvgShadow.md)

Shadow effect options

###### stroke?

`string`

Override stroke color for all SVG elements

###### strokeWidth?

`number`

Override stroke width for all SVG elements

#### Returns

`SvgVisual`

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

### fill?

> `readonly` `optional` **fill**: `string`

Defined in: [api/visual.ts:381](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L381)

Override fill color for all SVG elements.

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

### shadow?

> `readonly` `optional` **shadow**: [`SvgShadow`](Interface.SvgShadow.md)

Defined in: [api/visual.ts:390](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L390)

Shadow effect options.

***

### size

> `readonly` **size**: [`VisualSize`](TypeAlias.VisualSize.md)

Defined in: [api/visual.ts:378](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L378)

Display size.

***

### stroke?

> `readonly` `optional` **stroke**: `string`

Defined in: [api/visual.ts:384](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L384)

Override stroke color for all SVG elements.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth**: `number`

Defined in: [api/visual.ts:387](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L387)

Override stroke width for all SVG elements.

***

### svg

> `readonly` **svg**: `string`

Defined in: [api/visual.ts:375](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L375)

SVG content (inline string or URL).

***

### type

> `readonly` **type**: `"svg"`

Defined in: [api/visual.ts:372](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L372)

Discriminator for runtime type checking.

#### Overrides

[`Visual`](Class.Visual.md).[`type`](Class.Visual.md#type)

## Methods

### getSize()

> **getSize**(): `object`

Defined in: [api/visual.ts:422](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L422)

Get resolved size as {width, height}.

#### Returns

`object`

##### height

> **height**: `number`

##### width

> **width**: `number`
