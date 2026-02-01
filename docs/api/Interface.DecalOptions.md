[**@gaming.tools/gtmap**](README.md)

***

# Interface: DecalOptions

Defined in: [entities/decal.ts:12](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/decal.ts#L12)

Options for creating a [Decal](Class.Decal.md).

## Properties

### iconScaleFunction?

> `optional` **iconScaleFunction**: `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [entities/decal.ts:32](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/decal.ts#L32)

Override the map-level icon scale function for this decal.
Set to `null` to disable scaling (always use scale=1).
If undefined, falls back to visual's iconScaleFunction, then map's.

***

### opacity?

> `optional` **opacity**: `number`

Defined in: [entities/decal.ts:20](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/decal.ts#L20)

Opacity (0-1).

***

### rotation?

> `optional` **rotation**: `number`

Defined in: [entities/decal.ts:18](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/decal.ts#L18)

Clockwise rotation in degrees.

***

### scale?

> `optional` **scale**: `number`

Defined in: [entities/decal.ts:16](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/decal.ts#L16)

Scale multiplier (1 = visual's native size).

***

### visual

> **visual**: [`Visual`](Class.Visual.md)

Defined in: [entities/decal.ts:14](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/decal.ts#L14)

Visual template for rendering.

***

### zIndex?

> `optional` **zIndex**: `number`

Defined in: [entities/decal.ts:26](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/decal.ts#L26)

Z-index for stacking order (higher values render on top).

#### Default Value

```ts
1
```

#### Remarks

Vectors always render at z=0. Use negative zIndex to place decals behind vectors.
