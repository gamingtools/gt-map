Svelte GTMap Demo

This is the SvelteKit demo app for the GTMap library. It showcases a minimal map at the `/map` route, including markers, vectors, HUD, and basic controls.

Develop

- From the repo root: `npm run dev`
- Directly in this workspace: `npm -w gtmap-svelte-test run dev`
- App URL: `http://localhost:5173/map`

Build

- From the repo root: `npm run build`
- Directly in this workspace: `npm -w gtmap-svelte-test run build`
- Preview: `npm -w gtmap-svelte-test run preview`

Notes

- Uses Svelte v5 runes. Refer to docs in `docs/svelte/` for syntax (e.g., `onclick={...}` for events).
- Imports `GTMap` via a Vite alias: `import { GTMap } from '@gtmap'`.
- See `src/routes/map/+page.svelte` for the demo implementation.
- E2E tests (optional locally): `npm -w gtmap-svelte-test run test`
