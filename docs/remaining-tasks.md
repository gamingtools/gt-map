# Remaining Tasks (Post-Consolidation)

Status: Phase 1–4 complete; core consolidation done. The items below are deferred and tracked for future polish.

- README: add a short Controls section with usage of `L.control().zoom()` and `.attribution()`.
- Type surface: verify control option types exported at root (`ControlPosition`, `ZoomControlOptions`, `AttributionControlOptions`) are discoverable in editors.
- Optional control: implement `L.control().scale()` with pixel-CRS semantics.
- Optional overlays: wire minimal `Popup`/`Tooltip` DOM overlays anchored to map positions.
- Optional typing: tighten event payload types (markers/map streams) and refine `LeafletMapOptions` as needed.

Notes
- `docs/svelte/` is for agents only; no public docs changes needed there.
- Keep using `import { L } from '@gtmap'`; `GT.L` remains a legacy alias.

