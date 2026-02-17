[**@gaming.tools/gtmap**](README.md)

***

# Class: TextVisual

Defined in: [api/visual.ts:163](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L163)

Text-based visual for labels.

## Example

```ts
const label = new TextVisual('Location Name', { fontSize: 14, color: '#fff' });
label.anchor = 'bottom-center';
```

## Extends

- [`Visual`](Class.Visual.md)

## Constructors

### Constructor

> **new TextVisual**(`text`, `options`): `TextVisual`

Defined in: [api/visual.ts:201](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L201)

Create a text visual.

#### Parameters

##### text

`string`

Text content

##### options

Styling options

###### backgroundColor?

`string`

###### color?

`string`

###### fontFamily?

`string`

###### fontSize?

`number`

###### fontStyle?

`string`

Font style (normal, italic, oblique)

###### fontWeight?

`string`

Font weight (normal, bold, 100-900)

###### padding?

`number`

###### strokeColor?

`string`

Text stroke/outline color

###### strokeWidth?

`number`

Text stroke/outline width in pixels

#### Returns

`TextVisual`

#### Overrides

[`Visual`](Class.Visual.md).[`constructor`](Class.Visual.md#constructor)

## Properties

### anchor

> **anchor**: [`Anchor`](TypeAlias.Anchor.md) = `'center'`

Defined in: [api/visual.ts:94](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L94)

Anchor point for positioning. Defaults to center.

#### Inherited from

[`Visual`](Class.Visual.md).[`anchor`](Class.Visual.md#anchor)

***

### backgroundColor?

> `readonly` `optional` **backgroundColor**: `string`

Defined in: [api/visual.ts:179](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L179)

Optional background color.

***

### color

> `readonly` **color**: `string`

Defined in: [api/visual.ts:176](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L176)

Text color. Defaults to black.

***

### fontFamily

> `readonly` **fontFamily**: `string`

Defined in: [api/visual.ts:173](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L173)

Font family. Defaults to system sans-serif.

***

### fontSize

> `readonly` **fontSize**: `number`

Defined in: [api/visual.ts:170](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L170)

Font size in pixels.

***

### fontStyle?

> `readonly` `optional` **fontStyle**: `string`

Defined in: [api/visual.ts:194](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L194)

Font style (normal, italic, oblique).

***

### fontWeight?

> `readonly` `optional` **fontWeight**: `string`

Defined in: [api/visual.ts:191](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L191)

Font weight (normal, bold, 100-900).

***

### iconScaleFunction?

> `optional` **iconScaleFunction**: `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [api/visual.ts:101](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L101)

Optional scale function for this visual.
Overrides the map-level iconScaleFunction when set.
Set to `null` to disable scaling (use scale=1 always).

#### Inherited from

[`Visual`](Class.Visual.md).[`iconScaleFunction`](Class.Visual.md#iconscalefunction)

***

### padding?

> `readonly` `optional` **padding**: `number`

Defined in: [api/visual.ts:182](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L182)

Optional padding in pixels.

***

### strokeColor?

> `readonly` `optional` **strokeColor**: `string`

Defined in: [api/visual.ts:185](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L185)

Text stroke/outline color.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth**: `number`

Defined in: [api/visual.ts:188](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L188)

Text stroke/outline width in pixels.

***

### text

> `readonly` **text**: `string`

Defined in: [api/visual.ts:167](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L167)

Text content to display.

***

### type

> `readonly` **type**: `"text"`

Defined in: [api/visual.ts:164](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/visual.ts#L164)

Discriminator for runtime type checking.

#### Overrides

[`Visual`](Class.Visual.md).[`type`](Class.Visual.md#type)
