[**@gaming.tools/gtmap**](README.md)

***

# Interface: IconDef

Defined in: [api/types.ts:128](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L128)

Icon bitmap metadata for registering marker icons.

## Remarks

Provide intrinsic pixel dimensions for the source image and optional 2x asset and anchor.

## Properties

### anchorX?

> `optional` **anchorX**: `number`

Defined in: [api/types.ts:138](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L138)

Optional anchor X in pixels from the left (defaults to width/2).

***

### anchorY?

> `optional` **anchorY**: `number`

Defined in: [api/types.ts:140](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L140)

Optional anchor Y in pixels from the top (defaults to height/2).

***

### height

> **height**: `number`

Defined in: [api/types.ts:136](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L136)

Intrinsic height of the icon in pixels (1x asset).

***

### iconPath

> **iconPath**: `string`

Defined in: [api/types.ts:130](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L130)

URL or data URL for the 1x icon bitmap.

***

### width

> **width**: `number`

Defined in: [api/types.ts:134](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L134)

Intrinsic width of the icon in pixels (1x asset).

***

### x2IconPath?

> `optional` **x2IconPath**: `string`

Defined in: [api/types.ts:132](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/types.ts#L132)

Optional URL or data URL for a 2x (retina) icon bitmap.
