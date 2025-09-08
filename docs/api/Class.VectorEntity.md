[**@gaming.tools/gtmap**](README.md)

***

# Class: VectorEntity

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Example](#example)
- [Extends](#extends)
- [Properties](#properties)
  - [events](#events)
  - [id](#id)
- [Accessors](#accessors)
  - [geometry](#geometry)
- [Methods](#methods)
  - [remove()](#remove)
  - [setGeometry()](#setgeometry)

Defined in: [entities/Vector.ts:96](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Vector.ts#L96)

Vector - a geometric shape overlay (polyline, polygon, or circle).

## Remarks

Vectors are created via [GTMap.addVector](Class.GTMap.md#addvector) and managed through
the [Layer](Class.Layer.md) collection. Each vector has a unique ID and geometry
definition that includes both shape and style properties.

Supported shapes:
- `polyline` - Connected line segments
- `polygon` - Closed shape with optional fill
- `circle` - Circle with center and radius

Events emitted via [vector.events](#events):
- `remove` - Vector was removed from the map

## Example

```ts
// Add a polyline
const line = map.addVector({
  type: 'polyline',
  points: [
    { x: 1000, y: 1000 },
    { x: 2000, y: 1500 },
    { x: 3000, y: 1200 }
  ],
  style: { color: '#1e90ff', weight: 2, opacity: 0.9 }
});

// Add a filled polygon
const poly = map.addVector({
  type: 'polygon',
  points: [
    { x: 2000, y: 2000 },
    { x: 2500, y: 2000 },
    { x: 2500, y: 2500 },
    { x: 2000, y: 2500 }
  ],
  style: {
    color: '#10b981',
    weight: 2,
    fill: true,
    fillColor: '#10b981',
    fillOpacity: 0.3
  }
});

// Add a circle
const circle = map.addVector({
  type: 'circle',
  center: { x: 4096, y: 4096 },
  radius: 200,
  style: {
    color: '#f59e0b',
    weight: 2,
    fill: true,
    fillColor: '#f59e0b',
    fillOpacity: 0.2
  }
});
```

## Extends

- `EventedEntity`\<[`VectorEventMap`](Interface.VectorEventMap.md)\>

## Properties

### events

> `readonly` **events**: [`VectorEvents`](Interface.VectorEvents.md)

Defined in: [entities/Vector.ts:217](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Vector.ts#L217)

Public events surface for this vector.

#### Remarks

Currently only emits `remove` events. Future versions may
add interaction events like `click`, `pointerenter`, etc.

#### Example

```ts
// Listen for removal
vector.events.on('remove').each(({ vector }) => {
  console.log('Vector removed:', vector.id);
});
```

#### Overrides

`EventedEntity.events`

***

### id

> `readonly` **id**: `string`

Defined in: [entities/Vector.ts:97](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Vector.ts#L97)

## Accessors

### geometry

#### Get Signature

> **get** **geometry**(): [`VectorGeometry`](TypeAlias.VectorGeometry.md)

Defined in: [entities/Vector.ts:133](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Vector.ts#L133)

Get the current geometry definition.

##### Remarks

The geometry includes both shape data (points/center/radius)
and style properties (color, weight, fill).

##### Example

```ts
const geo = vector.geometry;
if (geo.type === 'circle') {
  console.log('Circle at', geo.center, 'radius', geo.radius);
}
```

##### Returns

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

## Methods

### remove()

> **remove**(): `void`

Defined in: [entities/Vector.ts:197](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Vector.ts#L197)

Remove this vector from the map.

#### Returns

`void`

#### Remarks

Emits a `remove` event. The owning [Layer](Class.Layer.md) will clear it
from the collection and trigger a renderer sync.

#### Example

```ts
// Remove vector directly
vector.remove();

// Remove all circles
map.vectors.getAll()
  .filter(v => v.geometry.type === 'circle')
  .forEach(v => v.remove());
```

***

### setGeometry()

> **setGeometry**(`geometry`): `void`

Defined in: [entities/Vector.ts:174](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Vector.ts#L174)

Replace the vector's geometry definition.

#### Parameters

##### geometry

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

New geometry with shape and style

#### Returns

`void`

#### Remarks

Completely replaces the geometry, including shape type.
Triggers a renderer sync to update the display.

#### Example

```ts
// Change a polygon to a polyline
vector.setGeometry({
  type: 'polyline',
  points: [
    { x: 0, y: 0 },
    { x: 100, y: 50 },
    { x: 200, y: 25 }
  ],
  style: { color: '#ff0000', weight: 3 }
});

// Update circle radius and style
vector.setGeometry({
  type: 'circle',
  center: { x: 2000, y: 2000 },
  radius: 300,
  style: {
    color: '#00ff00',
    weight: 2,
    fill: true,
    fillColor: '#00ff00',
    fillOpacity: 0.2
  }
});
```
