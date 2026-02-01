[**@gaming.tools/gtmap**](README.md)

***

# Interface: IconDef

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Properties](#properties)
  - [anchorX?](#anchorx)
  - [anchorY?](#anchory)
  - [height](#height)
  - [iconPath](#iconpath)
  - [width](#width)
  - [x2IconPath?](#x2iconpath)

Defined in: [api/types.ts:121](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L121)

Icon bitmap metadata for registering marker icons.

## Remarks

Provide intrinsic pixel dimensions for the source image and optional 2x asset and anchor.

## Properties

### anchorX?

> `optional` **anchorX**: `number`

Defined in: [api/types.ts:131](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L131)

Optional anchor X in pixels from the left (defaults to width/2).

***

### anchorY?

> `optional` **anchorY**: `number`

Defined in: [api/types.ts:133](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L133)

Optional anchor Y in pixels from the top (defaults to height/2).

***

### height

> **height**: `number`

Defined in: [api/types.ts:129](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L129)

Intrinsic height of the icon in pixels (1x asset).

***

### iconPath

> **iconPath**: `string`

Defined in: [api/types.ts:123](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L123)

URL or data URL for the 1x icon bitmap.

***

### width

> **width**: `number`

Defined in: [api/types.ts:127](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L127)

Intrinsic width of the icon in pixels (1x asset).

***

### x2IconPath?

> `optional` **x2IconPath**: `string`

Defined in: [api/types.ts:125](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L125)

Optional URL or data URL for a 2x (retina) icon bitmap.
