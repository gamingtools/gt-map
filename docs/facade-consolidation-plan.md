# Facade Consolidation — Phased Checklist Plan

Goal

- Single public surface via the Leaflet facade (`leaflet/`). Keep `GT.L` as a legacy alias that proxies to the same implementation to avoid drift. Do not expose `api/*` directly from the package root.

Scope

- In‑package consolidation only. No functional changes to rendering core, tile pipeline, input/events. Initial phases are non‑breaking.

## Phase 0 — Inventory & Baseline

- [ ] Confirm current public exports at `packages/gtmap/src/index.ts`
- [ ] Identify all external imports of `@gtmap` in apps/examples
- [ ] Verify `leaflet/` surface covers required factories/types for current usage

## Phase 1 — Consolidate Exports (Non‑breaking)

- [ ] Update root `index.ts` to re‑export named APIs from `leaflet/index.ts`
- [ ] Set default export to an alias that exposes `L` under `GT.L` (compat)
- [ ] Re‑export `L` namespace from `leaflet/L.ts`
- [ ] Stop exporting `api/*` types from root (map/grid facades)
- [ ] Ensure public types are exported from `leaflet` barrels (MapOptions, TileLayerOptions, IconOptions, MarkerOptions, LeafletLatLng)
- [ ] Add JSDoc `@deprecated` to `api/L.ts` (thin alias to `leaflet/L.ts`), or re‑export to prevent drift

Verification

- [ ] Build repo and type‑check
- [ ] Run `apps/svelte-gtmap-test` and `apps/noframework-gtmap-test` manually
- [ ] Confirm examples import only from `@gtmap` (no deep `api/*`)

## Phase 2 — Hide Internal Facades

- [ ] Add `exports` map to `package.json` to expose only `./src/leaflet/*` (and root) to consumers
- [ ] Ensure `api/*` is not reachable via package exports
- [ ] Keep `leaflet/*` classes extending/using `api/*` internally

Verification

- [ ] Run a consumer build (apps) to ensure no broken imports
- [ ] Confirm tree‑shaking and bundle size unaffected or improved

## Phase 3 — Remove Aggregator Duplication

- [ ] Choose one barrel: keep `leaflet/index.ts` as canonical aggregator
- [ ] Make `leaflet/Leaflet.ts` re‑export from `leaflet/index.ts` or remove it
- [ ] Grep for imports referencing the removed file and update them

Verification

- [ ] Build + run apps; ensure all `L.*` factories work

## Phase 4 — Documentation & Examples

- [ ] Update README to reference only `L` factories and public types
- [ ] Add deprecation note for `GT.L` (kept for compatibility)
- [ ] Add this plan to `docs/` and link from README “Contributing/Architecture”
- [ ] Ensure Svelte example imports types from `@gtmap` (leaflet‑exported)

## Phase 5 — Optional Enhancements (Follow‑ups)

- [ ] Implement `leaflet/control/Control` minimal zoom/attribution/scale
- [ ] Flesh out overlays (Popup/Tooltip/ImageOverlay) or mark explicitly as TODO
- [ ] Expand `Marker` events typing and hit‑test config (anchor/size)
- [ ] Add stricter public types where casts were previously needed

## Validation Checklist (per phase)

- [ ] TypeScript: no `any`/`unknown` casts added; improve source types instead
- [ ] Manual smoke: pan, wheel/pinch zoom, grid toggle, zoom speed, recenter, FPS/HUD
- [ ] No regressions: seams, zoom flicker, anchor behavior, wrapX setting
- [ ] Public API unchanged for existing consumers (Phase 1–3)

## Rollout & Versioning

- [ ] Release Phase 1–3 under a minor version (non‑breaking)
- [ ] Announce deprecation of `GT.L` in CHANGELOG
- [ ] Plan a future major to remove `GT.L` alias after adoption

## Risks & Mitigations

- Parallel surfaces drift: mitigated by aliasing `GT.L` to `leaflet` implementation
- Hidden internals break deep imports: mitigated by updating examples and adding `exports` map with clear error messages
- Over‑exposure via barrels: keep `leaflet` barrels minimal and stable; avoid re‑exporting internals

