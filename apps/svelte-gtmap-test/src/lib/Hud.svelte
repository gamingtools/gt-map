<script lang="ts">
	// Single status widget: subscribes to map events and shows key values
    import type { GTMap, Marker as GTMarker } from '@gtmap';

	const {
		map,
		fpsCap: fpsCapInitial = 60,
		wheelSpeed: wheelSpeedInitial = 1.0,
		inertia: inertiaInitial = true,
		inertiaDeceleration: inertiaDecelInitial = 3400,
		inertiaMaxSpeed: inertiaMaxSpeedInitial = 2000,
		easeLinearity: easeLinearityInitial = 0.2,
		zoomSnapThreshold: zoomSnapThresholdInitial = 0.4,
		rasterOpacity: rasterOpacityInitial = 1.0,
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
		fpsCap?: number;
		wheelSpeed?: number;
		inertia?: boolean;
		inertiaDeceleration?: number;
		inertiaMaxSpeed?: number;
		easeLinearity?: number;
		zoomSnapThreshold?: number;
		rasterOpacity?: number;
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
	let rasterOpacity = $state(rasterOpacityInitial);
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
		map?.display?.setRasterOpacity(rasterOpacity);
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
			map.view?.setIconScaleFunction((zoom) => Math.pow(2, zoom - 3));
			return;
		}
		map.view?.setIconScaleFunction((zoom) => {
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
					for (const mk of map.content.markers.getAll()) {
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
                    for (const mk of map.content.markers.getAll()) {
                        const r0 = typeof mk.rotation === 'number' ? mk.rotation : 0;
                        rotateBase.set(mk.id, r0);
                        rotateDir.set(mk.id, Math.random() < 0.5 ? -1 : 1);
                    }
                }

				// Track dynamic add/remove while enabled
				offLayerAdd = map.content.markers.events.on('entityadd').each(({ entity }: { entity: GTMarker }) => {
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
                offLayerRemove = map.content.markers.events.on('entityremove').each(({ entity }: { entity: GTMarker }) => {
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
        for (const mk of map.content.markers.getAll()) {
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
        for (const mk of map.content.markers.getAll()) {
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
</script>

<div class="absolute left-2 top-2 z-10 flex flex-col gap-2">
	<button
		class="pointer-events-auto w-fit rounded border border-gray-300 bg-white/80 px-2 py-1 text-xs text-gray-800 shadow hover:bg-white"
		onclick={() => (hudVisible = !hudVisible)}
	>
		{hudVisible ? 'Hide HUD' : 'Show HUD'}
	</button>
	{#if hudVisible}
		<div
			class="max-h-[calc(100vh-50px)] select-none overflow-y-auto rounded-md border border-gray-200/60 bg-white/80 px-3 py-2 text-xs text-gray-800 shadow backdrop-blur"
		>
			<!-- Status (non-interactive) -->
			<div class="pointer-events-none grid grid-cols-1 gap-x-6 gap-y-1">
		<div class="flex items-center gap-2">
			<span class="font-semibold text-gray-700">Center:</span><span class="tabular-nums"
				>X: {center.lng.toFixed(2)}, Y: {center.lat.toFixed(2)}</span
			>
		</div>
		<div class="flex items-center gap-2">
			<span class="font-semibold text-gray-700">Zoom:</span><span class="tabular-nums"
				>{zoom.toFixed(2)}</span
			>
		</div>
		<div class="flex items-center gap-2">
			<span class="font-semibold text-gray-700">FPS:</span><span class="tabular-nums"
				>{Math.round(fps)}</span
			>
		</div>
		<div class="flex items-center gap-2">
			<span class="font-semibold text-gray-700">Frame:</span>
			<span class="tabular-nums">{frame ?? '—'}</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="font-semibold text-gray-700">Mouse:</span><span class="tabular-nums"
				>{mouse ? `X: ${mouse.x}, Y: ${mouse.y}` : '—'}</span
			>
		</div>
	</div>
	<div class="my-2 h-px bg-gray-200"></div>
	<!-- Controls (interactive only on elements) -->
	<div class="pointer-events-none select-auto space-y-2">
		<button
			class="pointer-events-auto rounded border border-gray-300 bg-white/70 px-2 py-1 text-gray-800 hover:bg-white"
			onclick={recenter}>Recenter</button
		>
		<div>
			<label class="block text-gray-700" for="zoom-speed">Zoom speed</label>
			<div class="flex items-center gap-2">
				<input
					id="zoom-speed"
					class="pointer-events-auto w-40"
					type="range"
					min="0.05"
					max="2.00"
					step="0.05"
					bind:value={wheelSpeed}
				/>
				<span class="w-10 text-right tabular-nums">{wheelSpeed.toFixed(2)}</span>
			</div>
		</div>
		<label class="pointer-events-auto flex items-center gap-2">
			<input type="checkbox" bind:checked={gridEnabled} />
			<span>Show Grid</span>
		</label>
			<label class="pointer-events-auto flex items-center gap-2">
				<input type="checkbox" bind:checked={markersEnabled} />
				<span>Show Markers</span>
			</label>
            <label class="pointer-events-auto flex items-center gap-2">
                <input type="checkbox" bind:checked={animateMarkers} />
                <span>Animate Markers</span>
            </label>
            <label class="pointer-events-auto flex items-center gap-2">
                <input type="checkbox" bind:checked={rotateMarkers} />
                <span>Rotate Markers</span>
            </label>
		<label class="pointer-events-auto flex items-center gap-2">
			<input type="checkbox" bind:checked={vectorsEnabled} />
			<span>Show Vectors</span>
		</label>
		<div>
			<label class="block text-gray-700" for="marker-count">Markers</label>
			<div class="flex items-center gap-2">
				<input
					id="marker-count"
					class="pointer-events-auto w-28 rounded border border-gray-300 bg-white/70 px-2 py-0.5"
					type="number"
					min="0"
					max="999999"
					bind:value={markersLocal}
					oninput={onMarkersChange}
				/>
				<span class="tabular-nums">{markersLocal}</span>
			</div>
		</div>
		<div class="my-2 h-px bg-gray-200"></div>
		<div class="space-y-1">
			<div class="font-semibold text-gray-700">More settings</div>
			<div class="flex items-center gap-2">
				<label class="text-gray-700" for="fps-cap">FPS cap</label>
				<input
					id="fps-cap"
					class="pointer-events-auto w-24 rounded border border-gray-300 bg-white/70 px-2 py-0.5"
					type="number"
					min="15"
					max="240"
					bind:value={fpsCap}
				/>
			</div>
		</div>
		<div class="my-2 h-px bg-gray-200"></div>
		<div class="space-y-1">
			<div class="font-semibold text-gray-700">Display</div>
			<div class="flex items-center gap-2">
				<label class="text-gray-700" for="upscale-filter">Upscale</label>
				<select id="upscale-filter" class="pointer-events-auto rounded border border-gray-300 bg-white/70 px-2 py-0.5" bind:value={upscaleFilter}>
					<option value="auto">auto</option>
					<option value="linear">linear</option>
					<option value="bicubic">bicubic</option>
				</select>
			</div>
			<div>
				<label class="block text-gray-700" for="raster-opacity">Raster opacity</label>
				<div class="flex items-center gap-2">
					<input
						id="raster-opacity"
						class="pointer-events-auto w-40"
						type="range"
						min="0"
						max="1"
						step="0.01"
						bind:value={rasterOpacity}
					/>
					<span class="w-10 text-right tabular-nums">{rasterOpacity.toFixed(2)}</span>
				</div>
			</div>
			<div>
				<label class="block text-gray-700" for="zoom-snap">Zoom snap</label>
				<div class="flex items-center gap-2">
					<input
						id="zoom-snap"
						class="pointer-events-auto w-40"
						type="range"
						min="0"
						max="1"
						step="0.01"
						bind:value={zoomSnapThreshold}
					/>
					<span class="w-10 text-right tabular-nums">{zoomSnapThreshold.toFixed(2)}</span>
				</div>
			</div>
			<label class="pointer-events-auto flex items-center gap-2">
				<input type="checkbox" bind:checked={backgroundTransparent} />
				<span>Transparent bg</span>
			</label>
			<div class="flex items-center gap-2">
				<label class="text-gray-700" for="bg-color">BG color</label>
				<input
					id="bg-color"
					class="pointer-events-auto h-6 w-10 rounded border border-gray-300 bg-white/70"
					type="color"
					bind:value={backgroundColor}
					disabled={backgroundTransparent}
				/>
				<span class="tabular-nums">{backgroundColor}</span>
			</div>
		</div>
		<div class="my-2 h-px bg-gray-200"></div>
		<div class="space-y-1">
			<div class="font-semibold text-gray-700">View</div>
			<label class="pointer-events-auto flex items-center gap-2">
				<input type="checkbox" bind:checked={wrapX} />
				<span>Wrap X</span>
			</label>
			<label class="pointer-events-auto flex items-center gap-2">
				<input type="checkbox" bind:checked={clipToBounds} />
				<span>Clip to bounds</span>
			</label>
			<label class="pointer-events-auto flex items-center gap-2">
				<input type="checkbox" bind:checked={autoResize} />
				<span>Auto resize</span>
			</label>
			<div>
				<label class="block text-gray-700" for="bounds-viscosity">Bounds viscosity</label>
				<div class="flex items-center gap-2">
					<input
						id="bounds-viscosity"
						class="pointer-events-auto w-40"
						type="range"
						min="0"
						max="1"
						step="0.01"
						bind:value={maxBoundsViscosity}
					/>
					<span class="w-10 text-right tabular-nums">{maxBoundsViscosity.toFixed(2)}</span>
				</div>
			</div>
			<label class="pointer-events-auto flex items-center gap-2">
				<input type="checkbox" bind:checked={maxBoundsEnabled} />
				<span>Use max bounds</span>
			</label>
			<div class="grid grid-cols-2 gap-2">
				<label class="flex items-center gap-2">
					<span class="text-gray-700">Min X</span>
					<input
						class="pointer-events-auto w-20 rounded border border-gray-300 bg-white/70 px-2 py-0.5"
						type="number"
						bind:value={maxBoundsPx.minX}
						disabled={!maxBoundsEnabled}
					/>
				</label>
				<label class="flex items-center gap-2">
					<span class="text-gray-700">Min Y</span>
					<input
						class="pointer-events-auto w-20 rounded border border-gray-300 bg-white/70 px-2 py-0.5"
						type="number"
						bind:value={maxBoundsPx.minY}
						disabled={!maxBoundsEnabled}
					/>
				</label>
				<label class="flex items-center gap-2">
					<span class="text-gray-700">Max X</span>
					<input
						class="pointer-events-auto w-20 rounded border border-gray-300 bg-white/70 px-2 py-0.5"
						type="number"
						bind:value={maxBoundsPx.maxX}
						disabled={!maxBoundsEnabled}
					/>
				</label>
				<label class="flex items-center gap-2">
					<span class="text-gray-700">Max Y</span>
					<input
						class="pointer-events-auto w-20 rounded border border-gray-300 bg-white/70 px-2 py-0.5"
						type="number"
						bind:value={maxBoundsPx.maxY}
						disabled={!maxBoundsEnabled}
					/>
				</label>
			</div>
			{#if mapSize}
				<button
					class="pointer-events-auto rounded border border-gray-300 bg-white/70 px-2 py-1 text-gray-800 hover:bg-white"
					onclick={applyMapBoundsDefaults}
					disabled={!maxBoundsEnabled}
				>
					Set bounds to map size
				</button>
			{/if}
			<div class="flex items-center gap-2">
				<label class="text-gray-700" for="icon-scale">Icon scale</label>
				<select id="icon-scale" class="pointer-events-auto rounded border border-gray-300 bg-white/70 px-2 py-0.5" bind:value={iconScaleMode}>
					<option value="default">default</option>
					<option value="screen">screen-fixed</option>
					<option value="world">world-scaled</option>
					<option value="clamp">clamped world</option>
				</select>
			</div>
		</div>
		<div class="my-2 h-px bg-gray-200"></div>
		<div class="space-y-1">
			<div class="font-semibold text-gray-700">Inertia</div>
			<label class="pointer-events-auto flex items-center gap-2">
				<input type="checkbox" bind:checked={inertiaEnabled} />
				<span>Enable inertia</span>
			</label>
			<div class="flex items-center gap-2">
				<label class="text-gray-700" for="inertia-decel">Decel</label>
				<input
					id="inertia-decel"
					class="pointer-events-auto w-24 rounded border border-gray-300 bg-white/70 px-2 py-0.5"
					type="number"
					min="100"
					max="20000"
					step="100"
					bind:value={inertiaDecel}
					disabled={!inertiaEnabled}
				/>
			</div>
			<div class="flex items-center gap-2">
				<label class="text-gray-700" for="inertia-maxspeed">Max speed</label>
				<input
					id="inertia-maxspeed"
					class="pointer-events-auto w-24 rounded border border-gray-300 bg-white/70 px-2 py-0.5"
					type="number"
					min="10"
					max="1000000"
					step="100"
					bind:value={inertiaMaxSpeed}
					disabled={!inertiaEnabled}
				/>
			</div>
			<div>
				<label class="block text-gray-700" for="inertia-ease">Ease linearity</label>
				<div class="flex items-center gap-2">
					<input
						id="inertia-ease"
						class="pointer-events-auto w-40"
						type="range"
						min="0.01"
						max="1.00"
						step="0.01"
						bind:value={easeLinearity}
						disabled={!inertiaEnabled}
					/>
					<span class="w-10 text-right tabular-nums">{easeLinearity.toFixed(2)}</span>
				</div>
			</div>
		</div>
	</div>
	</div>
	{/if}
</div>
