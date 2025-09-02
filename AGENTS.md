# Repository Guidelines

## Project Structure & Module Organization

- `index.html`: App shell and HUD elements.
- `src/main.ts`: App bootstrap, UI controls, and HUD updates.
- `packages/gtmap/src/mapgl.ts`: Core WebGL map (tiles, input, rendering, cache).
- `packages/gtmap/src/mercator.ts`: Web Mercator and tile helpers.
- `package.json`: Scripts and dev deps (Vite, TypeScript, ESLint/Prettier).

## Build, Test, and Development Commands

- `npm install`: Install dependencies.
- `npm start` or `npm run dev`: Run the Vite dev server at `http://localhost:5173`.
- Manual run (quick check): Open `index.html` directly in a browser, but prefer the dev server for consistent behavior and headers.

## Coding Style & Naming Conventions

- Language: Modern ES modules/TypeScript; keep imports relative (e.g., `./mapgl`).
- Indentation: 2 spaces; semicolons required; single quotes for strings.
- Naming: PascalCase for classes (e.g., `MapGL`), camelCase for functions/vars, UPPER_SNAKE_CASE for constants.
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
- Preserve public API of `MapGL` unless a breaking change is justified and documented in the PR.
