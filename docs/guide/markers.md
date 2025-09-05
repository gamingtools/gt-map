# Markers

Markers are entities anchored at pixel coordinates. Use the `markers` layer on the map to manage them, and subscribe to per-marker events.

## Create

```ts
const m = map.addMarker(1024, 1024, { size: 1.2, rotation: 0 });
```

## Move and style

```ts
m.moveTo(1100, 980);
m.setStyle({ size: 1.5 });
```

## Events

```ts
m.events.on('click').each(({ x, y }) => console.log('click', x, y));
m.events.on('enter').each(() => console.log('enter'));
m.events.on('leave').each(() => console.log('leave'));
m.events.on('positionchange').each(({ dx, dy }) => console.log('moved', dx, dy));
```

## Remove

```ts
map.markers.remove(m);
// or
map.markers.clear();
```
