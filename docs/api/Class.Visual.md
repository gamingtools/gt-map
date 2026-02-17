[**@gaming.tools/gtmap**](README.md)

***

# Abstract Class: Visual

Defined in: [api/visual.ts:89](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L89)

Abstract base class for all visuals.

## Remarks

Visuals define appearance only. Use with Marker for screen-sized interactive entities.

## Extended by

- [`ImageVisual`](Class.ImageVisual.md)
- [`TextVisual`](Class.TextVisual.md)
- [`CircleVisual`](Class.CircleVisual.md)
- [`RectVisual`](Class.RectVisual.md)
- [`SvgVisual`](Class.SvgVisual.md)
- [`HtmlVisual`](Class.HtmlVisual.md)
- [`SpriteVisual`](Class.SpriteVisual.md)

## Constructors

### Constructor

> **new Visual**(): `Visual`

#### Returns

`Visual`

## Properties

### anchor

> **anchor**: [`Anchor`](TypeAlias.Anchor.md) = `'center'`

Defined in: [api/visual.ts:94](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L94)

Anchor point for positioning. Defaults to center.

***

### iconScaleFunction?

> `optional` **iconScaleFunction**: `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [api/visual.ts:101](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L101)

Optional scale function for this visual.
Overrides the map-level iconScaleFunction when set.
Set to `null` to disable scaling (use scale=1 always).

***

### type

> `abstract` `readonly` **type**: [`VisualType`](TypeAlias.VisualType.md)

Defined in: [api/visual.ts:91](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L91)

Discriminator for runtime type checking.
