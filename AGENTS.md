# Repository Guidelines

## Hard Rule (Must-Not-Break)

- STOP USING `any`/`unknown` when a concrete type can be used. This codebase is TypeScript-first for type safety and IntelliSense. Always prefer precise types over `any`/`unknown`, add minimal local interfaces when necessary, and propagate useful types through public APIs. Also don't use `as any` or `as unknown` unless it's absolutely necessary.

## Project Structure & Module Organization

- `apps/svelte-gtmap-test`: SvelteKit demo app (visit `/map`).
- `apps/noframework-gtmap-test/index.html`: No‑framework demo (simple HTML + TS).
- `packages/gtmap/src/api/map.ts`: Public `GTMap` facade (typed API surface).
- `packages/gtmap/src/internal/mapgl.ts`: Core WebGL implementation (tiles, input, rendering, cache).
- Pixel CRS only: use image pixel coordinates (no geodetic CRS).
- `package.json`: Scripts and dev deps (Vite, TypeScript, ESLint/Prettier).

## Build, Test, and Development Commands

- `npm install`: Install dependencies (npm workspaces).
- `npm start` or `npm run dev`: Run the Vite dev server at `http://localhost:5173`.
- Manual run (quick check): Open `index.html` directly in a browser, but prefer the dev server for consistent behavior and headers.

## Coding Style & Naming Conventions

- Language: Modern ES modules/TypeScript; keep imports relative (e.g., `./mapgl`).
- Indentation: 2 spaces; semicolons required; single quotes for strings.
- Naming: PascalCase for classes (e.g., `MapGL`), camelCase for functions/vars, UPPER_SNAKE_CASE for constants.
- Filenames: Use kebab-case for all TypeScript modules (e.g., `zoom-controller.ts`, `map-renderer.ts`). Do not use PascalCase or camelCase filenames.
- Formatting: No enforced linter; keep diffs small and style consistent with existing files.

## Testing Guidelines

- Framework: None. Validate changes manually in Chrome/Firefox.
- Smoke checks: pan, wheel zoom, pinch zoom (touch), grid toggle, zoom speed slider, recenter button, FPS/HUD updates.
- Regressions to watch: tile seams, flicker on zoom, incorrect anchor behavior, wrapX handling (disabled for Hagga Basin).

## Commit & Pull Request Guidelines

- Commits: Imperative, descriptive subject lines (mirroring history, e.g., “Zoom UX: …”), explain rationale in the body when non‑obvious.
- Scope: Keep changes focused; split refactors from feature work.
- PRs must include: clear description, before/after notes or GIF for interaction changes, manual test steps, and any perf implications. Link related issues.

## Security & Configuration Tips

- Tiles: Use HTTPS tile sources with proper CORS. Don’t commit secrets.
- Caching: Dev server disables cache; be mindful if changing headers.
- Ports: Default `5173`; override with `PORT=XXXX npm start`.

## Agent-Specific Instructions

- Do not introduce heavy frameworks or build steps; keep the project dependency‑light.
- Preserve public API of `GTMap` unless a breaking change is justified and documented in the PR.

### IMPORTANT: Svelte (v5) Docs First

- Always use the downloaded Svelte/SvelteKit docs under `docs/svelte/` as the source of truth for Svelte features and syntax. If internal knowledge conflicts or is outdated, follow the downloaded docs.
- Notable v5 changes to respect:
    - Event attributes: use `onclick={...}` (no `on:` directive in runes mode).
    - Reactivity via runes: `$state`, `$effect`, `$derived`, `$props`, etc.
    - Legacy APIs/semantics may be disabled in runes mode; confirm behavior in the docs.
- Before writing Svelte UI code, check the relevant file in `docs/svelte/` (e.g., `docs/svelte/svelte.dev/docs/svelte/llms.txt`).

References

- Svelte/SvelteKit docs mirror (LLM-friendly): `docs/svelte/` (populate/update via `npm run fetch:svelte-docs`).
- Examples: event attributes and runes are documented in `docs/svelte/svelte.dev/docs/svelte/llms.txt`.

### TypeScript Hygiene (No `any`/`unknown` Casts)

- Do not paper over type issues with `as any`, `as unknown as ...`, or similar escape hatches. It defeats the purpose of TypeScript and hides real API mismatches.
- When a type mismatch occurs, fix it at the source:
    - Improve the facade/implementation types so callers don’t need casts (e.g., expose a typed `events: EventBus` on the map facade).
    - Add precise types for event payloads and public methods instead of casting at the callsite.
    - In Svelte files, declare component props with `$props<...>()` and ensure handlers/values are properly typed.
- Avoid `// @ts-ignore`/`// eslint-disable` as a crutch. Prefer refinements, narrowing, and explicit interfaces.
- When dealing with union or generic types, use type guards or narrowings rather than `any` or `unknown` detours.
- If a type cannot be fixed immediately (e.g., third‑party), add a minimal, local type definition (interface or type alias) and reference it, instead of casting.

Checklist before submitting:

- [ ] No `as any` or `unknown` round‑trips in new/modified code
- [ ] Public API surfaces (facades) export useful types so callers don’t need casts
- [ ] Svelte components use typed props and Svelte v5 runes (see docs)
- [ ] Event payloads are typed, and handlers receive typed arguments (no `e: any`)
