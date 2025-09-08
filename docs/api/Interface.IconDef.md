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

Defined in: [api/types.ts:163](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L163)

Icon bitmap metadata for registering marker icons.

## Remarks

Provide intrinsic pixel dimensions for the source image and optional 2x asset and anchor.

## Properties

### anchorX?

> `optional` **anchorX**: `number`

Defined in: [api/types.ts:173](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L173)

Optional anchor X in pixels from the left (defaults to width/2).

***

### anchorY?

> `optional` **anchorY**: `number`

Defined in: [api/types.ts:175](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L175)

Optional anchor Y in pixels from the top (defaults to height/2).

***

### height

> **height**: `number`

Defined in: [api/types.ts:171](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L171)

Intrinsic height of the icon in pixels (1x asset).

***

### iconPath

> **iconPath**: `string`

Defined in: [api/types.ts:165](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L165)

URL or data URL for the 1x icon bitmap.

***

### width

> **width**: `number`

Defined in: [api/types.ts:169](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L169)

Intrinsic width of the icon in pixels (1x asset).

***

### x2IconPath?

> `optional` **x2IconPath**: `string`

Defined in: [api/types.ts:167](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L167)

Optional URL or data URL for a 2x (retina) icon bitmap.
