[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerTransition

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Example](#example)
- [Methods](#methods)
  - [apply()](#apply)
  - [cancel()](#cancel)
  - [moveTo()](#moveto)
  - [setStyle()](#setstyle)

Defined in: [entities/Marker.ts:61](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L61)

Builder for animating a single marker's properties (position/rotation/size).

## Remarks

Create via [Marker.transition](Class.Marker.md#transition). Changes are buffered until
[apply()](#apply) is called.

## Example

```ts
// Animate marker to new position over 600ms
await marker.transition()
  .moveTo(2000, 1500)
  .apply({ animate: { durationMs: 600 } });

// Combine movement with rotation
await marker.transition()
  .moveTo(3000, 2000)
  .setStyle({ rotation: 45, size: 1.5 })
  .apply({ animate: { durationMs: 800, easing: easeInOut } });
```

## Methods

### apply()

> **apply**(`opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [entities/Marker.ts:87](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L87)

Commit the transition (instant or animated).

#### Parameters

##### opts?

[`ApplyOptions`](Interface.ApplyOptions.md)

Optional animation settings

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Promise resolving when transition completes

***

### cancel()

> **cancel**(): `void`

Defined in: [entities/Marker.ts:92](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L92)

Cancel a pending or running transition.

#### Returns

`void`

***

### moveTo()

> **moveTo**(`x`, `y`): `this`

Defined in: [entities/Marker.ts:69](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L69)

Target a new position in world pixels.

#### Parameters

##### x

`number`

Target X coordinate in world pixels

##### y

`number`

Target Y coordinate in world pixels

#### Returns

`this`

This transition builder for chaining

***

### setStyle()

> **setStyle**(`opts`): `this`

Defined in: [entities/Marker.ts:79](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L79)

Target style properties (size, rotation).

#### Parameters

##### opts

Style properties to animate

###### rotation?

`number`

Target rotation in degrees

###### size?

`number`

Target scale multiplier

#### Returns

`this`

This transition builder for chaining
