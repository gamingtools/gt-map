[**@gaming.tools/gtmap**](README.md)

***

# Class: CircleVisual

Defined in: [api/visual.ts:245](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/visual.ts#L245)

Circle shape visual.

## Remarks

For point-based circle markers. For absolute-coordinate circles, use Vector with circle geometry.

## Example

```ts
const dot = new CircleVisual(8, { fill: '#ff0000' });
```

## Extends

- [`Visual`](Class.Visual.md)

## Constructors

### Constructor

> **new CircleVisual**(`radius`, `options`): `CircleVisual`

Defined in: [api/visual.ts:265](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/visual.ts#L265)

Create a circle visual.

#### Parameters

##### radius

`number`

Circle radius in pixels

##### options

Styling options

###### fill?

`string`

###### stroke?

`string`

###### strokeWidth?

`number`

#### Returns

`CircleVisual`

#### Overrides

[`Visual`](Class.Visual.md).[`constructor`](Class.Visual.md#constructor)

## Properties

### anchor

> **anchor**: [`Anchor`](TypeAlias.Anchor.md) = `'center'`

Defined in: [api/visual.ts:94](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/visual.ts#L94)

Anchor point for positioning. Defaults to center.

#### Inherited from

[`Visual`](Class.Visual.md).[`anchor`](Class.Visual.md#anchor)

***

### fill?

> `readonly` `optional` **fill**: `string`

Defined in: [api/visual.ts:252](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/visual.ts#L252)

Fill color.

***

### iconScaleFunction?

> `optional` **iconScaleFunction**: `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [api/visual.ts:101](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/visual.ts#L101)

Optional scale function for this visual.
Overrides the map-level iconScaleFunction when set.
Set to `null` to disable scaling (use scale=1 always).

#### Inherited from

[`Visual`](Class.Visual.md).[`iconScaleFunction`](Class.Visual.md#iconscalefunction)

***

### radius

> `readonly` **radius**: `number`

Defined in: [api/visual.ts:249](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/visual.ts#L249)

Radius in pixels.

***

### stroke?

> `readonly` `optional` **stroke**: `string`

Defined in: [api/visual.ts:255](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/visual.ts#L255)

Stroke color.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth**: `number`

Defined in: [api/visual.ts:258](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/visual.ts#L258)

Stroke width in pixels.

***

### type

> `readonly` **type**: `"circle"`

Defined in: [api/visual.ts:246](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/visual.ts#L246)

Discriminator for runtime type checking.

#### Overrides

[`Visual`](Class.Visual.md).[`type`](Class.Visual.md#type)
