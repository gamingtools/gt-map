[**@gaming.tools/gtmap**](README.md)

***

# Interface: IconDef

Defined in: [api/types.ts:82](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L82)

Icon bitmap metadata for registering marker icons.

## Remarks

Provide intrinsic pixel dimensions for the source image and optional 2x asset and anchor.

## Properties

### anchorX?

> `optional` **anchorX**: `number`

Defined in: [api/types.ts:92](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L92)

Optional anchor X in pixels from the left (defaults to width/2).

***

### anchorY?

> `optional` **anchorY**: `number`

Defined in: [api/types.ts:94](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L94)

Optional anchor Y in pixels from the top (defaults to height/2).

***

### height

> **height**: `number`

Defined in: [api/types.ts:90](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L90)

Intrinsic height of the icon in pixels (1x asset).

***

### iconPath

> **iconPath**: `string`

Defined in: [api/types.ts:84](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L84)

URL or data URL for the 1x icon bitmap.

***

### width

> **width**: `number`

Defined in: [api/types.ts:88](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L88)

Intrinsic width of the icon in pixels (1x asset).

***

### x2IconPath?

> `optional` **x2IconPath**: `string`

Defined in: [api/types.ts:86](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L86)

Optional URL or data URL for a 2x (retina) icon bitmap.
