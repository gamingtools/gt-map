[**@gaming.tools/gtmap**](README.md)

***

# Interface: LoadEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [size](#size)
  - [view](#view)

Defined in: [api/types.ts:266](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L266)

Load event payload: fired once after the first frame is scheduled.

## Properties

### size

> **size**: `object`

Defined in: [api/types.ts:270](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L270)

Final container size and device pixel ratio.

#### dpr

> **dpr**: `number`

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:268](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L268)

Current view state snapshot.
