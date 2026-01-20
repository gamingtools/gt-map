<script lang="ts">
	// Single status widget: subscribes to map events and shows key values
    import type { GTMap, Marker as GTMarker } from '@gtmap';

	const {
		map,
		fpsCap: fpsCapInitial = 60,
		wheelSpeed: wheelSpeedInitial = 1.0,
		home,
		markerCount,
		setMarkerCount,
		setMarkersEnabled,
		setVectorsEnabled
	} = $props<{
        map: GTMap;
		fpsCap?: number;
		wheelSpeed?: number;
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
		const c = map.getCenter();
		center = { lng: c.x, lat: c.y };
		zoom = map.getZoom();
		const pAbs = map.getPointerAbs();
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
		map?.setWheelSpeed(wheelSpeed);
	});
	$effect(() => {
		map?.setFpsCap(fpsCap);
	});
	$effect(() => {
		map?.setGridVisible(gridEnabled);
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
					for (const mk of map.markers.getAll()) {
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
                    for (const mk of map.markers.getAll()) {
                        const r0 = typeof mk.rotation === 'number' ? mk.rotation : 0;
                        rotateBase.set(mk.id, r0);
                        rotateDir.set(mk.id, Math.random() < 0.5 ? -1 : 1);
                    }
                }

				// Track dynamic add/remove while enabled
				offLayerAdd = map.markers.events.on('entityadd').each(({ entity }: { entity: GTMarker }) => {
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
                offLayerRemove = map.markers.events.on('entityremove').each(({ entity }: { entity: GTMarker }) => {
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
        for (const mk of map.markers.getAll()) {
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
        for (const mk of map.markers.getAll()) {
            const r0 = rotateBase.get(mk.id);
            if (r0 == null) continue;
            const dir = rotateDir.get(mk.id) ?? 1;
            const rot = r0 + dir * ROT_DEG_PER_SEC * t;
            try { mk.setStyle({ rotation: ((rot % 360) + 360) % 360 }); } catch {}
        }
    }

    async function recenter() {
        if (!map || !home) return;
        await map.transition().center({ x: home.lng, y: home.lat }).apply();
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
			markersDebounce = setTimeout(() => {
				markersDebounce = null;
				try {
					setMarkerCount(n);
				} catch {}
			}, 200) as unknown as number;
		} catch {}
	}
</script>

<div
	class="pointer-events-none absolute left-2 top-2 z-10 select-none rounded-md border border-gray-200/60 bg-white/80 px-3 py-2 text-xs text-gray-800 shadow backdrop-blur"
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
	</div>
</div>
