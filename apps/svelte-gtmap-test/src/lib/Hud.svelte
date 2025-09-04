<script lang="ts">
	// Single status widget: subscribes to map events and shows key values
	import type { LeafletMapFacade } from '@gtmap';

	const {
		map,
		fpsCap: fpsCapInitial = 60,
		wheelSpeed: wheelSpeedInitial = 1.0,
		home,
		markerCount,
		setMarkerCount
	} = $props<{
		map: LeafletMapFacade;
		fpsCap?: number;
		wheelSpeed?: number;
		home: { lng: number; lat: number };
		markerCount: number;
		setMarkerCount: (n: number) => void;
	}>();

	let fps = $state(0);
	let center = $state<{ lng: number; lat: number }>({ lng: 0, lat: 0 });
	let zoom = $state(0);
	let mouse: { x: number; y: number } | null = $state(null);
	let _prev = 0;
	let wheelSpeed = $state(wheelSpeedInitial);
	let fpsCap = $state(fpsCapInitial);
	let gridEnabled = $state(false);
	let markersLocal = $state<number>(markerCount ?? 0);

	function refresh(fromFrame = false, now?: number) {
		if (!map) return;
		const cArr = map.getCenter();
		center = { lng: cArr[1], lat: cArr[0] };
		zoom = map.getZoom();
		mouse = map.pointerAbs
			? { x: Math.round(map.pointerAbs.x), y: Math.round(map.pointerAbs.y) }
			: null;
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
			) => { each: (callback: (e: { now: number }) => void) => () => void }
		)('frame').each((e) => refresh(true, e.now));
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

	function recenter() {
		if (!map || !home) return;
		map.setView([home.lat, home.lng], map.getZoom());
	}
	function onMarkersChange() {
		const n = Math.max(0, Math.min(999_999, Math.floor(markersLocal)));
		markersLocal = n;
		try {
			setMarkerCount(n);
		} catch {}
	}
</script>

<div
	class="pointer-events-none absolute top-2 left-2 z-10 rounded-md border border-gray-200/60 bg-white/80 px-3 py-2 text-xs text-gray-800 shadow backdrop-blur select-none"
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
			<span class="font-semibold text-gray-700">Mouse:</span><span class="tabular-nums"
				>{mouse ? `X: ${mouse.x}, Y: ${mouse.y}` : '—'}</span
			>
		</div>
	</div>
	<div class="my-2 h-px bg-gray-200"></div>
	<!-- Controls (interactive only on elements) -->
	<div class="pointer-events-none space-y-2 select-auto">
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
		<label class="flex items-center gap-2">
			<input class="pointer-events-auto" type="checkbox" bind:checked={gridEnabled} />
			<span>Show Grid</span>
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
