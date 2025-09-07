# Vectors

Vectors are simple geometry overlays (polyline, polygon, circle). They live in the `vectors` layer and can be added individually.

## Add geometry

```ts
// Polyline
map.addVector({ type: 'polyline', points: [ { x: 0, y: 0 }, { x: 200, y: 100 } ] });

// Polygon
map.addVector({ type: 'polygon', points: [ { x: 100, y: 100 }, { x: 150, y: 160 }, { x: 80, y: 190 } ] });

// Circle
map.addVector({ type: 'circle', center: { x: 300, y: 300 }, radius: 60 });

// Keep a handle to update geometry later
const v = map.addVector({ type: 'polygon', points: [ { x: 100, y: 100 }, { x: 160, y: 160 }, { x: 80, y: 190 } ] });
v.setGeometry({ type: 'polyline', points: [ { x: 120, y: 120 }, { x: 180, y: 210 } ] });
```

## Remove / clear

```ts
map.vectors.clear();
```

Note: vector interaction events are minimal for now and will expand over time.
