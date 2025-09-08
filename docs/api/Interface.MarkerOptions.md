[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerOptions\<T\>

[← Back to API index](./README.md)

## Contents

- [Type Parameters](#type-parameters)
  - [T](#t)
- [Properties](#properties)
  - [data?](#data)
  - [iconType?](#icontype)
  - [rotation?](#rotation)
  - [size?](#size)

Defined in: [entities/Marker.ts:14](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L14)

Options for creating or styling a [Marker](Class.Marker.md).

## Type Parameters

### T

`T` = `unknown`

Type of custom data attached to the marker

## Properties

### data?

> `optional` **data**: `T`

Defined in: [entities/Marker.ts:36](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L36)

Custom user data attached to the marker.

***

### iconType?

> `optional` **iconType**: `string`

Defined in: [entities/Marker.ts:19](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L19)

Icon type identifier from registered icons.

#### Default Value

`'default'`

***

### rotation?

> `optional` **rotation**: `number`

Defined in: [entities/Marker.ts:31](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L31)

Rotation angle in degrees (clockwise).

#### Default Value

`0`

***

### size?

> `optional` **size**: `number`

Defined in: [entities/Marker.ts:25](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L25)

Scale multiplier for the icon.

#### Default Value

`1`
