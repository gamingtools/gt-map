<script lang="ts">
	// Single status widget: subscribes to map events and shows key values
    import type { GTMap, Marker as GTMarker, InteractiveLayer, TileLayer } from '@gtmap';

	const {
		map,
		markerLayer = undefined as unknown as InteractiveLayer,
		tileLayer = undefined as unknown as TileLayer,
		fpsCap: fpsCapInitial = 60,
		wheelSpeed: wheelSpeedInitial = 1.0,
		inertia: inertiaInitial = true,
		inertiaDeceleration: inertiaDecelInitial = 3400,
		inertiaMaxSpeed: inertiaMaxSpeedInitial = 2000,
		easeLinearity: easeLinearityInitial = 0.2,
		zoomSnapThreshold: zoomSnapThresholdInitial = 0.4,
		upscaleFilter: upscaleFilterInitial = 'auto',
		backgroundColor: backgroundColorInitial = '#ffffff',
		backgroundTransparent: backgroundTransparentInitial = true,
		wrapX: wrapXInitial = false,
		clipToBounds: clipToBoundsInitial = true,
		autoResize: autoResizeInitial = true,
		maxBoundsEnabled: maxBoundsEnabledInitial = false,
		maxBoundsViscosity: maxBoundsViscosityInitial = 0.0,
		maxBoundsPx: maxBoundsPxInitial = { minX: 0, minY: 0, maxX: 0, maxY: 0 },
		iconScaleMode: iconScaleModeInitial = 'clamp',
		mapSize,
		home,
		markerCount,
		setMarkerCount,
		setMarkersEnabled,
		setVectorsEnabled
	} = $props<{
        map: GTMap;
		markerLayer?: InteractiveLayer;
		tileLayer?: TileLayer;
		fpsCap?: number;
		wheelSpeed?: number;
		inertia?: boolean;
		inertiaDeceleration?: number;
		inertiaMaxSpeed?: number;
		easeLinearity?: number;
		zoomSnapThreshold?: number;
		upscaleFilter?: 'auto' | 'linear' | 'bicubic';
		backgroundColor?: string;
		backgroundTransparent?: boolean;
		wrapX?: boolean;
		clipToBounds?: boolean;
		autoResize?: boolean;
		maxBoundsEnabled?: boolean;
		maxBoundsViscosity?: number;
		maxBoundsPx?: { minX: number; minY: number; maxX: number; maxY: number };
		iconScaleMode?: 'default' | 'screen' | 'world' | 'clamp';
		mapSize?: { width: number; height: number };
		home: { lng: number; lat: number };
		markerCount: number;
		setMarkerCount: (n: number) => void;
		setMarkersEnabled: (on: boolean) => void;
		setVectorsEnabled: (on: boolean) => void;
	}>();

	let fps = $state(0);
	let center = $state<{ lng: number; lat: number }>({ lng: 0, lat: 0 });
	let zoom = $state(0);
	let mouse: { x: number; y: number } | null = $state(null);
	let _prev = 0;
	let wheelSpeed = $state(wheelSpeedInitial);
	let fpsCap = $state(fpsCapInitial);
    let gridEnabled = $state(false);
    let markersEnabled = $state(true);
    let vectorsEnabled = $state(true);
	let inertiaEnabled = $state(inertiaInitial);
	let inertiaDecel = $state(inertiaDecelInitial);
	let inertiaMaxSpeed = $state(inertiaMaxSpeedInitial);
	let easeLinearity = $state(easeLinearityInitial);
	let zoomSnapThreshold = $state(zoomSnapThresholdInitial);
	let rasterOpacity = $state(1.0);
	let upscaleFilter = $state<'auto' | 'linear' | 'bicubic'>(upscaleFilterInitial);
	let backgroundColor = $state(backgroundColorInitial);
	let backgroundTransparent = $state(backgroundTransparentInitial);
	let wrapX = $state(wrapXInitial);
	let clipToBounds = $state(clipToBoundsInitial);
	let autoResize = $state(autoResizeInitial);
	let maxBoundsEnabled = $state(maxBoundsEnabledInitial);
	let maxBoundsViscosity = $state(maxBoundsViscosityInitial);
	let maxBoundsPx = $state<{ minX: number; minY: number; maxX: number; maxY: number }>(maxBoundsPxInitial);
	let iconScaleMode = $state<'default' | 'screen' | 'world' | 'clamp'>(iconScaleModeInitial);
	let boundsSeeded = false;
    // Animate markers (position-only) + optional rotation
    let animateMarkers = $state(false);
    let rotateMarkers = $state(false);
    // Animation parameters
    const ORBIT_AMP = 64; // pixels
    const ORBIT_HZ = 0.6; // cycles per second
    const ROT_DEG_PER_SEC = 360; // degrees per second
    let markersLocal = $state<number>(markerCount ?? 0);
    let markersDebounce: number | null = null;

    // Animation bookkeeping
    let animStartMs = 0;   // for position orbit
    let rotStartMs = 0;    // for rotation spin
    const animState = new Map<string, { x0: number; y0: number; rot0: number; phase: number }>();
    const rotateBase = new Map<string, number>(); // marker.id -> base rotation at enable
    const rotateDir = new Map<string, number>();  // marker.id -> +1 (cw) or -1 (ccw)
    let offLayerAdd: (() => void) | null = null;
    let offLayerRemove: (() => void) | null = null;
    let rafId: number | null = null;

	// Perf stats from frame event (frame counter only)
	let frame = $state<number | null>(null);

	// Section collapse state
	let sectionsOpen = $state<Record<string, boolean>>({
		controls: true,
		display: false,
		view: false,
		inertia: false,
	});

	function toggleSection(key: string) {
		sectionsOpen[key] = !sectionsOpen[key];
	}

	function refresh(fromFrame = false, now?: number) {
		if (!map) return;
		const c = map.view.getCenter();
		center = { lng: c.x, lat: c.y };
		zoom = map.view.getZoom();
		const pAbs = map.view.getPointerAbs();
		mouse = pAbs ? { x: Math.round(pAbs.x), y: Math.round(pAbs.y) } : null;
		if (fromFrame) {
			const t = now ?? (performance.now ? performance.now() : Date.now());
			if (!_prev) _prev = t;
			const dt = t - _prev;
			_prev = t;
			const inst = dt > 0 ? 1000 / dt : 0;
			const alpha = 0.2;
			fps = (1 - alpha) * fps + alpha * inst;
		}
	}

	$effect(() => {
		if (!map) return;
		const offFrame = (
			map.events.on as (
				event: string
			) => { each: (callback: (e: { now: number; stats?: { cacheSize?: number; inflight?: number; pending?: number; frame?: number } }) => void) => () => void }
		)('frame').each((e) => {
			refresh(true, e.now);
            // When idle RAF is not running, drive a single step
            if (rafId == null) {
                try { if (animateMarkers) animateMarkersFrame(e.now); } catch {}
                try { if (rotateMarkers) rotateMarkersFrame(e.now); } catch {}
            }
			try {
				frame = e.stats?.frame ?? frame;
			} catch {}
		});
		const offPointer = (
			map.events.on as (
				event: string
			) => { each: (callback: (e: { x: number; y: number }) => void) => () => void }
		)('pointermove').each(() => refresh(false));
		refresh(false);
		return () => {
			try {
				offFrame?.();
			} catch {}
			try {
				offPointer?.();
			} catch {}
		};
	});

	// Apply controls
	$effect(() => {
		if (boundsSeeded) return;
		if (!mapSize) return;
		const zeroBounds = maxBoundsPx.minX === 0 && maxBoundsPx.minY === 0 && maxBoundsPx.maxX === 0 && maxBoundsPx.maxY === 0;
		if (zeroBounds) {
			maxBoundsPx = { minX: 0, minY: 0, maxX: mapSize.width, maxY: mapSize.height };
		}
		boundsSeeded = true;
	});

	$effect(() => {
		map?.input?.setWheelSpeed(wheelSpeed);
	});
	$effect(() => {
		map?.input?.setInertiaOptions({
			inertia: inertiaEnabled,
			inertiaDeceleration: inertiaDecel,
			inertiaMaxSpeed: inertiaMaxSpeed,
			easeLinearity,
		});
	});
	$effect(() => {
		map?.display?.setFpsCap(fpsCap);
	});
	$effect(() => {
		map?.display?.setGridVisible(gridEnabled);
	});
	$effect(() => {
		map?.display?.setUpscaleFilter(upscaleFilter);
	});
	$effect(() => {
		if (tileLayer) map?.layers?.setLayerOpacity(tileLayer, rasterOpacity);
	});
	$effect(() => {
		map?.display?.setZoomSnapThreshold(zoomSnapThreshold);
	});
	$effect(() => {
		if (!map) return;
		if (backgroundTransparent) {
			map.display?.setBackgroundColor('transparent');
		} else {
			map.display?.setBackgroundColor(backgroundColor);
		}
	});
	$effect(() => {
		map?.view?.setWrapX(wrapX);
	});
	$effect(() => {
		map?.view?.setClipToBounds(clipToBounds);
	});
	$effect(() => {
		map?.view?.setAutoResize(autoResize);
	});
	$effect(() => {
		map?.view?.setMaxBoundsViscosity(maxBoundsViscosity);
	});
	$effect(() => {
		if (!map) return;
		if (!maxBoundsEnabled) {
			map.view?.setMaxBoundsPx(null);
			return;
		}
		const minX = Math.min(maxBoundsPx.minX, maxBoundsPx.maxX);
		const maxX = Math.max(maxBoundsPx.minX, maxBoundsPx.maxX);
		const minY = Math.min(maxBoundsPx.minY, maxBoundsPx.maxY);
		const maxY = Math.max(maxBoundsPx.minY, maxBoundsPx.maxY);
		map.view?.setMaxBoundsPx({ minX, minY, maxX, maxY });
	});
	$effect(() => {
		if (!map) return;
		if (iconScaleMode === 'default') {
			map.view?.setIconScaleFunction(null);
			return;
		}
		if (iconScaleMode === 'screen') {
			map.view?.setIconScaleFunction(() => 1);
			return;
		}
		if (iconScaleMode === 'world') {
			map.view?.setIconScaleFunction((zoom: number) => Math.pow(2, zoom - 3));
			return;
		}
		map.view?.setIconScaleFunction((zoom: number) => {
			const maxScale = 1;
			const scale = Math.pow(2, zoom - 3);
			return Math.min(maxScale, Math.max(0.5, scale));
		});
	});
	$effect(() => {
		try {
			setMarkersEnabled?.(markersEnabled);
		} catch {}
	});
	$effect(() => {
		try {
			setVectorsEnabled?.(vectorsEnabled);
		} catch {}
	});

		$effect(() => {
			// Toggle marker animation/rotation
			if (!map) return;
			// Cleanup previous listeners
			try { offLayerAdd?.(); } catch {}
			try { offLayerRemove?.(); } catch {}
			// Stop any prior RAF loop before re-enabling
			try { if (rafId != null) cancelAnimationFrame(rafId); } catch {}
			rafId = null;

			const needPos = animateMarkers;
			const needRot = rotateMarkers;

			if (needPos || needRot) {
				const now = performance.now ? performance.now() : Date.now();
				if (needPos) {
					animStartMs = now;
					animState.clear();
					// Seed state for existing markers without causing a jump on the next frame
					for (const mk of markerLayer?.markers?.getAll() ?? []) {
						const rot0 = typeof mk.rotation === 'number' ? mk.rotation : 0;
						const phase = Math.random() * Math.PI * 2;
						const dx0 = ORBIT_AMP * Math.cos(phase);
						const dy0 = ORBIT_AMP * Math.sin(phase);
						animState.set(mk.id, { x0: mk.x - dx0, y0: mk.y - dy0, rot0, phase });
					}
				}
                if (needRot) {
                    rotStartMs = now;
                    rotateBase.clear();
                    rotateDir.clear();
                    for (const mk of markerLayer?.markers?.getAll() ?? []) {
                        const r0 = typeof mk.rotation === 'number' ? mk.rotation : 0;
                        rotateBase.set(mk.id, r0);
                        rotateDir.set(mk.id, Math.random() < 0.5 ? -1 : 1);
                    }
                }

				// Track dynamic add/remove while enabled
				offLayerAdd = markerLayer?.markers?.events?.on('entityadd').each(({ entity }: { entity: GTMarker }) => {
					const mk = entity;
					if (needPos) {
						const rot0 = typeof mk.rotation === 'number' ? mk.rotation : 0;
						const phase = Math.random() * Math.PI * 2;
						const dx0 = ORBIT_AMP * Math.cos(phase);
						const dy0 = ORBIT_AMP * Math.sin(phase);
						animState.set(mk.id, { x0: mk.x - dx0, y0: mk.y - dy0, rot0, phase });
					}
                    if (needRot) {
                        const r0 = typeof mk.rotation === 'number' ? mk.rotation : 0;
                        rotateBase.set(mk.id, r0);
                        rotateDir.set(mk.id, Math.random() < 0.5 ? -1 : 1);
                    }
                });
                offLayerRemove = markerLayer?.markers?.events?.on('entityremove').each(({ entity }: { entity: GTMarker }) => {
                    animState.delete(entity.id);
                    rotateBase.delete(entity.id);
                    rotateDir.delete(entity.id);
                });

				// Start RAF-driven loop so animation runs even when the map is idle
				const tick = (tNow: number) => {
					if (!animateMarkers && !rotateMarkers) { rafId = null; return; }
					if (animateMarkers) animateMarkersFrame(tNow);
					if (rotateMarkers) rotateMarkersFrame(tNow);
					rafId = requestAnimationFrame(tick);
				};
				rafId = requestAnimationFrame(tick);
			} else {
				// Stop RAF if running
				try { if (rafId != null) cancelAnimationFrame(rafId); } catch {}
				rafId = null;
                // Leave markers as-is; just clear state maps
                animState.clear();
                rotateBase.clear();
                rotateDir.clear();
            }
        });

    // Cleanup on component unmount
    $effect(() => {
        return () => {
            try { if (rafId != null) cancelAnimationFrame(rafId); } catch {}
            rafId = null;
        };
    });

    function animateMarkersFrame(now: number): void {
        if (!map || !animateMarkers) return;
        const t = (now - animStartMs) / 1000; // seconds
        const omega = 2 * Math.PI * ORBIT_HZ;
        for (const mk of markerLayer?.markers?.getAll() ?? []) {
            const st = animState.get(mk.id);
            if (!st) continue;
            const dx = ORBIT_AMP * Math.cos(omega * t + st.phase);
            const dy = ORBIT_AMP * Math.sin(omega * t + st.phase);
            try { mk.moveTo(st.x0 + dx, st.y0 + dy); } catch {}
        }
    }

    function rotateMarkersFrame(now: number): void {
        if (!map || !rotateMarkers) return;
        const t = (now - rotStartMs) / 1000; // seconds
        for (const mk of markerLayer?.markers?.getAll() ?? []) {
            const r0 = rotateBase.get(mk.id);
            if (r0 == null) continue;
            const dir = rotateDir.get(mk.id) ?? 1;
            const rot = r0 + dir * ROT_DEG_PER_SEC * t;
            try { mk.setStyle({ rotation: ((rot % 360) + 360) % 360 }); } catch {}
        }
    }

    async function recenter() {
        if (!map || !home) return;
        await map.view.setView({ center: { x: home.lng, y: home.lat } });
    }
	function onMarkersChange() {
		const n = Math.max(0, Math.min(999_999, Math.floor(markersLocal)));
		markersLocal = n;
		try {
			if (markersDebounce != null) {
				try {
					clearTimeout(markersDebounce);
				} catch {}
			}
			markersDebounce = window.setTimeout(() => {
				markersDebounce = null;
				try {
					setMarkerCount(n);
				} catch {}
			}, 200);
		} catch {}
	}

	function applyMapBoundsDefaults() {
		if (!mapSize) return;
		maxBoundsPx = { minX: 0, minY: 0, maxX: mapSize.width, maxY: mapSize.height };
	}

	let hudVisible = $state(true);

	function fpsColor(v: number): string {
		if (v >= 55) return 'text-accent-green';
		if (v >= 30) return 'text-accent-amber';
		return 'text-accent-red';
	}
</script>

<!-- HUD -->
<div class="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-2">
	{#if !hudVisible}
		<!-- Open button (only visible when HUD is closed) -->
		<button
			class="pointer-events-auto flex h-7 items-center gap-1.5 rounded border border-panel-border-hi bg-panel/90 px-2.5 font-mono text-[10px] font-medium uppercase tracking-widest text-data-dim transition-all hover:border-accent-cyan/40 hover:text-data"
			onclick={() => (hudVisible = true)}
		>
			<svg class="h-3 w-3" viewBox="0 0 12 12" fill="none">
				<path d="M2 3H10M2 6H10M2 9H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
			HUD
		</button>
	{/if}

	{#if hudVisible}
		<!-- Main Panel -->
		<div
			class="hud-scroll pointer-events-auto max-h-[calc(100vh-80px)] w-64 select-none overflow-y-auto rounded border border-panel-border bg-panel/95 font-mono text-[11px] leading-tight text-data shadow-2xl shadow-black/50 backdrop-blur-sm"
		>
			<!-- Telemetry Header with close button -->
			<div class="border-b border-panel-border px-3 py-2.5">
				<div class="mb-2 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="h-1.5 w-1.5 rounded-full bg-accent-green shadow-[0_0_4px_theme(--color-accent-green)]"></div>
						<span class="text-[9px] font-semibold uppercase tracking-[0.2em] text-data-dim">Telemetry</span>
					</div>
					<button
						class="flex h-5 w-5 items-center justify-center rounded text-data-dim transition-colors hover:bg-panel-surface hover:text-accent-red"
						onclick={() => (hudVisible = false)}
						title="Close HUD"
						aria-label="Close HUD"
					>
						<svg class="h-3 w-3" viewBox="0 0 12 12" fill="none">
							<path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
						</svg>
					</button>
				</div>
				<div class="grid grid-cols-2 gap-x-3 gap-y-1">
					<div class="flex items-baseline justify-between">
						<span class="text-data-dim">CTR</span>
						<span class="tabular-nums text-data-bright">{center.lng.toFixed(0)},{center.lat.toFixed(0)}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-data-dim">Z</span>
						<span class="tabular-nums text-accent-cyan">{zoom.toFixed(2)}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-data-dim">FPS</span>
						<span class="tabular-nums {fpsColor(fps)}">{Math.round(fps)}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-data-dim">FRM</span>
						<span class="tabular-nums text-data-bright">{frame ?? '--'}</span>
					</div>
					<div class="col-span-2 flex items-baseline justify-between">
						<span class="text-data-dim">PTR</span>
						<span class="tabular-nums text-data-bright">{mouse ? `${mouse.x}, ${mouse.y}` : '--'}</span>
					</div>
				</div>
			</div>

			<!-- Controls Section -->
			<button
				class="flex w-full items-center gap-2 border-b border-panel-border px-3 py-2 text-left transition-colors hover:bg-panel-surface"
				onclick={() => toggleSection('controls')}
			>
				<svg class="h-2.5 w-2.5 text-data-dim transition-transform {sectionsOpen.controls ? 'rotate-90' : ''}" viewBox="0 0 8 10" fill="currentColor">
					<path d="M1 0L7 5L1 10Z"/>
				</svg>
				<span class="text-[9px] font-semibold uppercase tracking-[0.2em] text-data-dim">Controls</span>
			</button>
			{#if sectionsOpen.controls}
				<div class="space-y-2.5 border-b border-panel-border px-3 py-2.5">
					<button
						class="flex h-6 items-center rounded border border-panel-border-hi bg-panel-surface px-2 text-[10px] uppercase tracking-wider text-data transition-all hover:border-accent-cyan/40 hover:text-accent-cyan"
						onclick={recenter}
					>Recenter</button>

					<!-- Zoom speed -->
					<div>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-data-dim">Zoom speed</span>
							<span class="tabular-nums text-accent-cyan">{wheelSpeed.toFixed(2)}</span>
						</div>
						<input class="hud-range pointer-events-auto w-full" type="range" min="0.05" max="2.00" step="0.05" bind:value={wheelSpeed} />
					</div>

					<!-- Toggles row -->
					<div class="space-y-1.5">
						<label class="pointer-events-auto flex cursor-pointer items-center gap-2">
							<input type="checkbox" class="hud-check" bind:checked={gridEnabled} />
							<span class="text-data">Grid</span>
						</label>
						<label class="pointer-events-auto flex cursor-pointer items-center gap-2">
							<input type="checkbox" class="hud-check" bind:checked={markersEnabled} />
							<span class="text-data">Markers</span>
						</label>
						<label class="pointer-events-auto flex cursor-pointer items-center gap-2">
							<input type="checkbox" class="hud-check" bind:checked={animateMarkers} />
							<span class="text-data">Animate pos</span>
						</label>
						<label class="pointer-events-auto flex cursor-pointer items-center gap-2">
							<input type="checkbox" class="hud-check" bind:checked={rotateMarkers} />
							<span class="text-data">Animate rot</span>
						</label>
						<label class="pointer-events-auto flex cursor-pointer items-center gap-2">
							<input type="checkbox" class="hud-check" bind:checked={vectorsEnabled} />
							<span class="text-data">Vectors</span>
						</label>
					</div>

					<!-- Marker count -->
					<div>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-data-dim">Markers</span>
							<span class="tabular-nums text-data-bright">{markersLocal}</span>
						</div>
						<input
							class="hud-number pointer-events-auto w-full rounded border border-input-border bg-input-bg px-2 py-1 tabular-nums text-data-bright outline-none transition-colors focus:border-accent-cyan"
							type="number"
							min="0"
							max="999999"
							bind:value={markersLocal}
							oninput={onMarkersChange}
						/>
					</div>

					<!-- FPS cap -->
					<div class="flex items-center justify-between gap-2">
						<span class="text-data-dim">FPS cap</span>
						<input
							class="hud-number pointer-events-auto w-16 rounded border border-input-border bg-input-bg px-2 py-1 text-right tabular-nums text-data-bright outline-none transition-colors focus:border-accent-cyan"
							type="number"
							min="15"
							max="240"
							bind:value={fpsCap}
						/>
					</div>
				</div>
			{/if}

			<!-- Display Section -->
			<button
				class="flex w-full items-center gap-2 border-b border-panel-border px-3 py-2 text-left transition-colors hover:bg-panel-surface"
				onclick={() => toggleSection('display')}
			>
				<svg class="h-2.5 w-2.5 text-data-dim transition-transform {sectionsOpen.display ? 'rotate-90' : ''}" viewBox="0 0 8 10" fill="currentColor">
					<path d="M1 0L7 5L1 10Z"/>
				</svg>
				<span class="text-[9px] font-semibold uppercase tracking-[0.2em] text-data-dim">Display</span>
			</button>
			{#if sectionsOpen.display}
				<div class="space-y-2.5 border-b border-panel-border px-3 py-2.5">
					<!-- Upscale filter -->
					<div class="flex items-center justify-between gap-2">
						<span class="text-data-dim">Upscale</span>
						<select class="hud-select pointer-events-auto rounded border border-input-border bg-input-bg px-2 py-1 text-data-bright outline-none transition-colors focus:border-accent-cyan" bind:value={upscaleFilter}>
							<option value="auto">auto</option>
							<option value="linear">linear</option>
							<option value="bicubic">bicubic</option>
						</select>
					</div>

					<!-- Raster opacity -->
					<div>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-data-dim">Raster opacity</span>
							<span class="tabular-nums text-accent-cyan">{rasterOpacity.toFixed(2)}</span>
						</div>
						<input class="hud-range pointer-events-auto w-full" type="range" min="0" max="1" step="0.01" bind:value={rasterOpacity} />
					</div>

					<!-- Zoom snap -->
					<div>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-data-dim">Zoom snap</span>
							<span class="tabular-nums text-accent-cyan">{zoomSnapThreshold.toFixed(2)}</span>
						</div>
						<input class="hud-range pointer-events-auto w-full" type="range" min="0" max="1" step="0.01" bind:value={zoomSnapThreshold} />
					</div>

					<!-- Background -->
					<label class="pointer-events-auto flex cursor-pointer items-center gap-2">
						<input type="checkbox" class="hud-check" bind:checked={backgroundTransparent} />
						<span class="text-data">Transparent bg</span>
					</label>
					<div class="flex items-center justify-between gap-2">
						<span class="text-data-dim">BG color</span>
						<div class="flex items-center gap-2">
							<input
								class="pointer-events-auto h-5 w-7 cursor-pointer rounded border border-input-border bg-input-bg"
								type="color"
								bind:value={backgroundColor}
								disabled={backgroundTransparent}
							/>
							<span class="tabular-nums text-data-dim" class:opacity-35={backgroundTransparent}>{backgroundColor}</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- View Section -->
			<button
				class="flex w-full items-center gap-2 border-b border-panel-border px-3 py-2 text-left transition-colors hover:bg-panel-surface"
				onclick={() => toggleSection('view')}
			>
				<svg class="h-2.5 w-2.5 text-data-dim transition-transform {sectionsOpen.view ? 'rotate-90' : ''}" viewBox="0 0 8 10" fill="currentColor">
					<path d="M1 0L7 5L1 10Z"/>
				</svg>
				<span class="text-[9px] font-semibold uppercase tracking-[0.2em] text-data-dim">View</span>
			</button>
			{#if sectionsOpen.view}
				<div class="space-y-2.5 border-b border-panel-border px-3 py-2.5">
					<div class="space-y-1.5">
						<label class="pointer-events-auto flex cursor-pointer items-center gap-2">
							<input type="checkbox" class="hud-check" bind:checked={wrapX} />
							<span class="text-data">Wrap X</span>
						</label>
						<label class="pointer-events-auto flex cursor-pointer items-center gap-2">
							<input type="checkbox" class="hud-check" bind:checked={clipToBounds} />
							<span class="text-data">Clip to bounds</span>
						</label>
						<label class="pointer-events-auto flex cursor-pointer items-center gap-2">
							<input type="checkbox" class="hud-check" bind:checked={autoResize} />
							<span class="text-data">Auto resize</span>
						</label>
					</div>

					<!-- Bounds viscosity -->
					<div>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-data-dim">Viscosity</span>
							<span class="tabular-nums text-accent-cyan">{maxBoundsViscosity.toFixed(2)}</span>
						</div>
						<input class="hud-range pointer-events-auto w-full" type="range" min="0" max="1" step="0.01" bind:value={maxBoundsViscosity} />
					</div>

					<!-- Max bounds -->
					<label class="pointer-events-auto flex cursor-pointer items-center gap-2">
						<input type="checkbox" class="hud-check" bind:checked={maxBoundsEnabled} />
						<span class="text-data">Max bounds</span>
					</label>
					<div class="grid grid-cols-2 gap-1.5" class:opacity-35={!maxBoundsEnabled}>
						<div class="flex items-center gap-1.5">
							<span class="w-5 text-right text-data-dim">mX</span>
							<input
								class="hud-number pointer-events-auto w-full rounded border border-input-border bg-input-bg px-1.5 py-0.5 tabular-nums text-data-bright outline-none transition-colors focus:border-accent-cyan"
								type="number"
								bind:value={maxBoundsPx.minX}
								disabled={!maxBoundsEnabled}
							/>
						</div>
						<div class="flex items-center gap-1.5">
							<span class="w-5 text-right text-data-dim">mY</span>
							<input
								class="hud-number pointer-events-auto w-full rounded border border-input-border bg-input-bg px-1.5 py-0.5 tabular-nums text-data-bright outline-none transition-colors focus:border-accent-cyan"
								type="number"
								bind:value={maxBoundsPx.minY}
								disabled={!maxBoundsEnabled}
							/>
						</div>
						<div class="flex items-center gap-1.5">
							<span class="w-5 text-right text-data-dim">MX</span>
							<input
								class="hud-number pointer-events-auto w-full rounded border border-input-border bg-input-bg px-1.5 py-0.5 tabular-nums text-data-bright outline-none transition-colors focus:border-accent-cyan"
								type="number"
								bind:value={maxBoundsPx.maxX}
								disabled={!maxBoundsEnabled}
							/>
						</div>
						<div class="flex items-center gap-1.5">
							<span class="w-5 text-right text-data-dim">MY</span>
							<input
								class="hud-number pointer-events-auto w-full rounded border border-input-border bg-input-bg px-1.5 py-0.5 tabular-nums text-data-bright outline-none transition-colors focus:border-accent-cyan"
								type="number"
								bind:value={maxBoundsPx.maxY}
								disabled={!maxBoundsEnabled}
							/>
						</div>
					</div>
					{#if mapSize}
						<button
							class="flex h-6 items-center rounded border border-panel-border-hi bg-panel-surface px-2 text-[10px] uppercase tracking-wider text-data transition-all hover:border-accent-cyan/40 hover:text-accent-cyan disabled:opacity-35 disabled:hover:border-panel-border-hi disabled:hover:text-data"
							onclick={applyMapBoundsDefaults}
							disabled={!maxBoundsEnabled}
						>Reset to map size</button>
					{/if}

					<!-- Icon scale -->
					<div class="flex items-center justify-between gap-2">
						<span class="text-data-dim">Icon scale</span>
						<select class="hud-select pointer-events-auto rounded border border-input-border bg-input-bg px-2 py-1 text-data-bright outline-none transition-colors focus:border-accent-cyan" bind:value={iconScaleMode}>
							<option value="default">default</option>
							<option value="screen">screen</option>
							<option value="world">world</option>
							<option value="clamp">clamp</option>
						</select>
					</div>
				</div>
			{/if}

			<!-- Inertia Section -->
			<button
				class="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-panel-surface"
				onclick={() => toggleSection('inertia')}
			>
				<svg class="h-2.5 w-2.5 text-data-dim transition-transform {sectionsOpen.inertia ? 'rotate-90' : ''}" viewBox="0 0 8 10" fill="currentColor">
					<path d="M1 0L7 5L1 10Z"/>
				</svg>
				<span class="text-[9px] font-semibold uppercase tracking-[0.2em] text-data-dim">Inertia</span>
			</button>
			{#if sectionsOpen.inertia}
				<div class="space-y-2.5 border-t border-panel-border px-3 py-2.5">
					<label class="pointer-events-auto flex cursor-pointer items-center gap-2">
						<input type="checkbox" class="hud-check" bind:checked={inertiaEnabled} />
						<span class="text-data">Enable</span>
					</label>

					<div class="flex items-center justify-between gap-2" class:opacity-35={!inertiaEnabled}>
						<span class="text-data-dim">Decel</span>
						<input
							class="hud-number pointer-events-auto w-20 rounded border border-input-border bg-input-bg px-2 py-1 text-right tabular-nums text-data-bright outline-none transition-colors focus:border-accent-cyan"
							type="number"
							min="100"
							max="20000"
							step="100"
							bind:value={inertiaDecel}
							disabled={!inertiaEnabled}
						/>
					</div>

					<div class="flex items-center justify-between gap-2" class:opacity-35={!inertiaEnabled}>
						<span class="text-data-dim">Max speed</span>
						<input
							class="hud-number pointer-events-auto w-20 rounded border border-input-border bg-input-bg px-2 py-1 text-right tabular-nums text-data-bright outline-none transition-colors focus:border-accent-cyan"
							type="number"
							min="10"
							max="1000000"
							step="100"
							bind:value={inertiaMaxSpeed}
							disabled={!inertiaEnabled}
						/>
					</div>

					<div class:opacity-35={!inertiaEnabled}>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-data-dim">Ease linearity</span>
							<span class="tabular-nums text-accent-cyan">{easeLinearity.toFixed(2)}</span>
						</div>
						<input class="hud-range pointer-events-auto w-full" type="range" min="0.01" max="1.00" step="0.01" bind:value={easeLinearity} disabled={!inertiaEnabled} />
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
