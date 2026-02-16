[**@gaming.tools/gtmap**](README.md)

***

# Interface: SpriteAtlasEntry

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [anchorX?](#anchorx)
  - [anchorY?](#anchory)
  - [height](#height)
  - [metadata?](#metadata)
  - [tags?](#tags)
  - [width](#width)
  - [x](#x)
  - [y](#y)

Defined in: [api/types.ts:367](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L367)

A single sprite entry within a sprite atlas descriptor.

## Properties

### anchorX?

> `optional` **anchorX**: `number`

Defined in: [api/types.ts:377](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L377)

Anchor X in pixels from the left (defaults to width/2).

***

### anchorY?

> `optional` **anchorY**: `number`

Defined in: [api/types.ts:379](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L379)

Anchor Y in pixels from the top (defaults to height/2).

***

### height

> **height**: `number`

Defined in: [api/types.ts:375](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L375)

Sprite height in the atlas image (pixels).

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [api/types.ts:383](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L383)

Optional metadata for user extensibility (ignored by library).

***

### tags?

> `optional` **tags**: `string`[]

Defined in: [api/types.ts:381](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L381)

Optional tags for user extensibility (ignored by library).

***

### width

> **width**: `number`

Defined in: [api/types.ts:373](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L373)

Sprite width in the atlas image (pixels).

***

### x

> **x**: `number`

Defined in: [api/types.ts:369](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L369)

X offset in the atlas image (pixels).

***

### y

> **y**: `number`

Defined in: [api/types.ts:371](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L371)

Y offset in the atlas image (pixels).
