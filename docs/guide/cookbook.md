# Cookbook

## Recenter on marker click

```ts
const m = map.addMarker(1200, 900);
m.events.on('click').each(async () => {
  await map.transition().center({ x: m.x, y: m.y }).apply({ animate: { durationMs: 400 } });
});
```

## Wheel speed slider

```ts
const slider = document.querySelector('#wheelSpeed') as HTMLInputElement;
slider.oninput = () => map.setWheelSpeed(Number(slider.value));
```

## Frame loop hook (stats or overlays)

```ts
map.events.on('frame').each(({ now, stats }) => {
  // stats?.fps, stats?.tilesLoaded, etc.
});
```

## Throttle high-frequency events

Prefer rAF in handlers rather than core throttling:

```ts
let scheduled = false;
let lastPos = { x: 0, y: 0 };
map.events.on('pointermove').each(({ x, y }) => {
  lastPos = { x, y };
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      // do work with lastPos
    });
  }
});
```
