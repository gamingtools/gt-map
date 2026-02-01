[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerOptions\<T\>

Defined in: [entities/marker.ts:12](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L12)

Options for creating or styling a [Marker](Class.Marker.md).

## Type Parameters

### T

`T` = `unknown`

## Properties

### data?

> `optional` **data**: `T`

Defined in: [entities/marker.ts:34](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L34)

Arbitrary user data attached to the marker.

***

### iconScaleFunction?

> `optional` **iconScaleFunction**: `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [entities/marker.ts:32](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L32)

Override the map-level icon scale function for this marker.
Set to `null` to disable scaling (always use scale=1).
If undefined, falls back to visual's iconScaleFunction, then map's.

***

### opacity?

> `optional` **opacity**: `number`

Defined in: [entities/marker.ts:20](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L20)

Opacity (0-1).

***

### rotation?

> `optional` **rotation**: `number`

Defined in: [entities/marker.ts:18](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L18)

Clockwise rotation in degrees.

***

### scale?

> `optional` **scale**: `number`

Defined in: [entities/marker.ts:16](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L16)

Scale multiplier (1 = visual's native size).

***

### visual

> **visual**: [`Visual`](Class.Visual.md)

Defined in: [entities/marker.ts:14](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L14)

Visual template for rendering.

***

### zIndex?

> `optional` **zIndex**: `number`

Defined in: [entities/marker.ts:26](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L26)

Z-index for stacking order (higher values render on top).

#### Default Value

```ts
1
```

#### Remarks

Vectors always render at z=0. Use negative zIndex to place markers behind vectors.
