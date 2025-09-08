[**@gaming.tools/gtmap**](README.md)

***

# Interface: VectorStyle

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [color?](#color)
  - [fill?](#fill)
  - [fillColor?](#fillcolor)
  - [fillOpacity?](#fillopacity)
  - [opacity?](#opacity)
  - [weight?](#weight)

Defined in: [api/types.ts:191](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L191)

Style properties for vector shapes.

## Properties

### color?

> `optional` **color**: `string`

Defined in: [api/types.ts:196](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L196)

Stroke color (CSS color string).

#### Default Value

`'#3388ff'`

***

### fill?

> `optional` **fill**: `boolean`

Defined in: [api/types.ts:214](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L214)

Whether to fill the shape (polygon/circle only).

#### Default Value

`false`

***

### fillColor?

> `optional` **fillColor**: `string`

Defined in: [api/types.ts:220](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L220)

Fill color (CSS color string).

#### Default Value

Same as `color`

***

### fillOpacity?

> `optional` **fillOpacity**: `number`

Defined in: [api/types.ts:226](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L226)

Fill opacity (0-1).

#### Default Value

`0.2`

***

### opacity?

> `optional` **opacity**: `number`

Defined in: [api/types.ts:208](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L208)

Stroke opacity (0-1).

#### Default Value

`1`

***

### weight?

> `optional` **weight**: `number`

Defined in: [api/types.ts:202](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L202)

Stroke width in pixels.

#### Default Value

`3`
