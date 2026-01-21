[**@gaming.tools/gtmap**](README.md)

***

# Interface: DecalEventMap

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [positionchange](#positionchange)
  - [remove](#remove)

Defined in: [api/events/maps.ts:89](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L89)

Events emitted by a Decal instance.

## Properties

### positionchange

> **positionchange**: `object`

Defined in: [api/events/maps.ts:91](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L91)

Position changed via Decal.moveTo; includes deltas.

#### decal

> **decal**: [`DecalData`](Interface.DecalData.md)

#### dx

> **dx**: `number`

#### dy

> **dy**: `number`

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### remove

> **remove**: `object`

Defined in: [api/events/maps.ts:93](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/maps.ts#L93)

Decal was removed.

#### decal

> **decal**: [`DecalData`](Interface.DecalData.md)
