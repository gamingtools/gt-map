# agents.md

Agent configuration and guidelines for AI-assisted development on this repository.

## Hard Rules

- No `any`/`unknown` when a concrete type exists. Prefer precise types, add minimal local interfaces when necessary. No `as any` or `as unknown` unless absolutely necessary.
- Preserve public API of `GTMap` unless a breaking change is justified and documented.
- Do not introduce heavy frameworks or dependencies; keep the project dependency-light.
- Zero external runtime dependencies in `packages/gtmap`.

## Project Structure

| Path | Purpose |
|------|---------|
| `packages/gtmap/src/index.ts` | Public API entry point |
| `packages/gtmap/src/api/map.ts` | GTMap class |
| `packages/gtmap/src/api/facades/` | ViewFacade, ContentFacade, DisplayFacade, InputFacade |
| `packages/gtmap/src/api/types.ts` | All public types |
| `packages/gtmap/src/api/events/` | Event types and public event surface |
| `packages/gtmap/src/internal/context/map-context.ts` | DI composition root |
| `packages/gtmap/src/internal/render/render-coordinator.ts` | Render pipeline |
| `packages/gtmap/src/internal/input/input-manager.ts` | Input handling |
| `packages/gtmap/src/internal/tiles/tile-manager.ts` | Tile loading and caching |
| `apps/svelte-gtmap-test/` | SvelteKit demo (visit `/map`) |
| `apps/noframework-gtmap-test/` | Plain HTML+TS demo |

Pixel CRS only: coordinates are image pixels (x, y). No geodetic CRS.

## Build & Dev

```bash
npm install          # npm workspaces
npm run dev          # Vite dev server at localhost:5173
npm run build        # Build gtmap + apps (~140kb bundle)
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Playwright E2E
npm run check        # svelte-check
npx typedoc          # Regenerate API docs to docs/api/
```

## Architecture Patterns

- **Facade pattern**: All public API through `map.view`, `map.content`, `map.display`, `map.input`
- **Narrow DI interfaces**: Each module declares its own `*Deps` interface (ZoomDeps, PanDeps extend ControllerDepsBase)
- **MapContext** as composition root wiring all modules
- **TypedEventBus** with `.on(name).each(handler)` and `.once(name)` for type-safe events
- **Tile pyramid only**: tiles served from `.gtpk` binary packs (no HTTP tile URL templates)
- **Lifecycle**: `map.suspend(opts?)`, `map.resume()`, `map.destroy()`

## Coding Style

- TypeScript strict mode
- 2-space indentation, single quotes, trailing commas, semicolons
- ~200 char max line width
- Filenames: kebab-case (e.g., `zoom-controller.ts`, `view-facade.ts`)
- PascalCase classes, camelCase functions/vars, UPPER_SNAKE_CASE constants

## Testing

- No unit test framework currently; validate manually in Chrome/Firefox
- Smoke checks: pan, wheel zoom, pinch zoom, grid toggle, markers, vectors
- Regressions to watch: tile flicker, zoom anchor, wrapX, marker hit testing

## TypeScript Hygiene

- Fix type mismatches at the source, not with casts
- Use type guards and narrowing over `any`/`unknown` detours
- Public API surfaces must export useful types so callers don't need casts
- No `// @ts-ignore` or `// eslint-disable` as a crutch

## Svelte (v5)

- Use Svelte v5 runes: `$state`, `$effect`, `$derived`, `$props`
- Event attributes: `onclick={...}` (no `on:` directive in runes mode)
- Typed props with `$props<...>()`

## Commit Guidelines

- Imperative subject lines, explain rationale in body when non-obvious
- Keep changes focused; split refactors from features
- Include before/after notes for interaction changes
