# Entity Collections

Entity collections group entities and expose lifecycle + visibility events.

```ts
// Access the built-in collections
const { markers, vectors } = map;

// Observe adds/removes
markers.events.on('entityadd').each(({ entity }) => console.log('marker added', entity.id));
markers.events.on('entityremove').each(({ entity }) => console.log('marker removed', entity.id));

// Visibility
markers.setVisible(false);
console.log('visible?', markers.visible);
```

### API

- `add(entity)` / `remove(entityOrId)` / `clear()`
- `get(id)` / `getAll()`
- `setVisible(boolean)` / `visible`
- Events: `entityadd`, `entityremove`, `clear`, `visibilitychange`
