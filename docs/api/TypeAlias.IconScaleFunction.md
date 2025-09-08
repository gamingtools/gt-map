[**@gaming.tools/gtmap**](README.md)

***

# Type Alias: IconScaleFunction()

[← Back to API index](./README.md)

## Contents

- [Parameters](#parameters)
  - [zoom](#zoom)
  - [minZoom](#minzoom)
  - [maxZoom](#maxzoom)
- [Returns](#returns)

> **IconScaleFunction** = (`zoom`, `minZoom`, `maxZoom`) => `number`

Defined in: [api/types.ts:643](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/types.ts#L643)

Function to calculate icon scale based on zoom level.

## Parameters

### zoom

`number`

Current zoom level

### minZoom

`number`

Minimum zoom level

### maxZoom

`number`

Maximum zoom level

## Returns

`number`

Scale multiplier where 1.0 = original size
