[**@gaming.tools/gtmap**](README.md)

***

# Abstract Class: Visual

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Extended by](#extended-by)
- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Properties](#properties)
  - [anchor](#anchor)
  - [iconScaleFunction?](#iconscalefunction)
  - [type](#type)

Defined in: [api/visual.ts:89](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L89)

Abstract base class for all visuals.

## Remarks

Visuals define appearance only. Use with Marker (interactive) or Decal (non-interactive).

## Extended by

- [`ImageVisual`](Class.ImageVisual.md)
- [`TextVisual`](Class.TextVisual.md)
- [`CircleVisual`](Class.CircleVisual.md)
- [`RectVisual`](Class.RectVisual.md)
- [`SvgVisual`](Class.SvgVisual.md)
- [`HtmlVisual`](Class.HtmlVisual.md)

## Constructors

### Constructor

> **new Visual**(): `Visual`

#### Returns

`Visual`

## Properties

### anchor

> **anchor**: [`Anchor`](TypeAlias.Anchor.md) = `'center'`

Defined in: [api/visual.ts:94](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L94)

Anchor point for positioning. Defaults to center.

***

### iconScaleFunction?

> `optional` **iconScaleFunction**: `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [api/visual.ts:101](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L101)

Optional scale function for this visual.
Overrides the map-level iconScaleFunction when set.
Set to `null` to disable scaling (use scale=1 always).

***

### type

> `abstract` `readonly` **type**: [`VisualType`](TypeAlias.VisualType.md)

Defined in: [api/visual.ts:91](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/visual.ts#L91)

Discriminator for runtime type checking.
