<script lang="ts" context="module">
	// Disable SSR for this page; run in the browser only
	export const ssr = false;
	export const csr = true;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import GT from '@gtmap';

	let container: HTMLDivElement | null = null;
	let hudText = '';
	let speed = 1.0;
	let gridEnabled = true;
	let anchorMode: 'pointer' | 'center' = 'pointer';
	let map: any;
	let gridLayer: any | null = null;

	onMount(() => {
		if (!container) return;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const L = (GT as any).L;
		const HAGGA = {
			url: 'https://gtcdn.info/dune/tiles/hb_8k/{z}/{x}_{y}.webp',
			minZoom: 0,
			maxZoom: 5,
			wrapX: false
		};
		map = L.map(container, {
			center: { lng: 4096, lat: 4096 },
			zoom: 2,
			minZoom: HAGGA.minZoom,
			maxZoom: HAGGA.maxZoom,
			fpsCap: 60
		});
		L.tileLayer(HAGGA.url, {
			minZoom: HAGGA.minZoom,
			maxZoom: HAGGA.maxZoom,
			tileSize: 256,
			tms: false
		}).addTo(map);

		// HUD updates on render frames
		(() => {
			const state: any = { prev: 0, fps: 0 };
			map.events.on('frame').each((e: any) => {
				const now = e?.now || performance.now();
				if (!state.prev) state.prev = now;
				const dt = now - state.prev;
				state.prev = now;
				const inst = dt > 0 ? 1000 / dt : 0;
				const alpha = 0.2;
				state.fps = (1 - alpha) * state.fps + alpha * inst;
				const cArr = map.getCenter() as [number, number];
				const c = { lng: cArr[1], lat: cArr[0] };
				const p = (map as any).pointerAbs as { x: number; y: number } | null;
				const pText = p ? ` | x ${Math.round(p.x)}, y ${Math.round(p.y)}` : '';
				const z = map.getZoom() as number;
				hudText = `lng ${c.lng.toFixed(5)}, lat ${c.lat.toFixed(5)} | zoom ${z.toFixed(2)} | fps cap ${Math.round(state.fps)}${pText}`;
			});
		})();

		// Grid layer initial
		try {
			gridLayer = (L as any).grid();
			if (gridEnabled) gridLayer.addTo(map);
		} catch {
			gridLayer = null;
		}

		// Resize handling
		try {
			const ro = new ResizeObserver(() => map.invalidateSize());
			ro.observe(container);
		} catch {
			window.addEventListener('resize', () => map.invalidateSize());
		}
	});

	function recenter() {
		map?.recenter?.();
	}

	function onSpeedInput(e: Event) {
		const t = e.target as HTMLInputElement;
		speed = parseFloat(t.value || '1');
		map?.setWheelSpeed?.(speed);
	}

	function onGridToggle(e: Event) {
		const t = e.target as HTMLInputElement;
		gridEnabled = t.checked;
		if (!gridLayer) return;
		if (gridEnabled) gridLayer.addTo(map);
		else gridLayer.remove();
	}

	function onAnchorChange(e: Event) {
		const t = e.target as HTMLSelectElement;
		anchorMode = (t.value as 'pointer' | 'center') ?? 'pointer';
		map?.setAnchorMode?.(anchorMode);
	}
</script>

<h1>GTMap Svelte Demo</h1>
<p>Simple page demonstrating GT.L in SvelteKit.</p>
<div bind:this={container} class="map">
	<div class="hud">{hudText}</div>
	<div class="attribution">Hagga Basin tiles © respective owners (game map)</div>

	<!-- Recenter button -->
	<button class="recenter" on:click={recenter}>Recenter</button>

	<!-- Zoom speed control -->
	<div class="panel speed">
		<label>Zoom Speed</label>
		<div class="row">
			<input type="range" min="0.05" max="2.00" step="0.05" bind:value={speed} on:input={onSpeedInput} />
			<span>{speed.toFixed(2)}</span>
		</div>
	</div>

	<!-- Grid toggle -->
	<div class="panel grid">
		<label class="row">
			<input type="checkbox" bind:checked={gridEnabled} on:change={onGridToggle} />
			<span>Show Grid</span>
		</label>
	</div>

	<!-- Anchor mode selector -->
	<div class="panel anchor">
		<label>Zoom Anchor</label>
		<select bind:value={anchorMode} on:change={onAnchorChange}>
			<option value="pointer">Pointer</option>
			<option value="center">Center</option>
		</select>
	</div>
</div>

<style>
	.map {
		position: relative;
		width: 100%;
		height: 80vh;
		background: #ddd;
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
	}

	.hud {
		position: absolute;
		left: 8px;
		top: 8px;
		background: rgba(255, 255, 255, 0.8);
		color: #222;
		padding: 4px 6px;
		border-radius: 4px;
		font: 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif;
		z-index: 10;
	}

	.attribution {
		position: absolute;
		right: 8px;
		bottom: 8px;
		background: rgba(255, 255, 255, 0.8);
		color: #222;
		padding: 4px 6px;
		border-radius: 4px;
		font: 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif;
		z-index: 10;
	}

	.recenter {
		position: absolute;
		left: 8px;
		bottom: 8px;
		background: #fff;
		border: 1px solid #bbb;
		border-radius: 4px;
		padding: 6px 8px;
		font: 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif;
		cursor: pointer;
		z-index: 11;
	}

	.panel {
		position: absolute;
		left: 8px;
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid #bbb;
		border-radius: 4px;
		padding: 6px 8px;
		font: 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif;
		z-index: 11;
	}

	.panel.speed { top: 80px; }
	.panel.grid { top: 130px; }
	.panel.anchor { top: 170px; }

	.row { display: flex; align-items: center; gap: 6px; }
	.panel.speed input[type='range'] { width: 140px; }
</style>
