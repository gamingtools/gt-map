<script lang="ts" context="module">
	// Disable SSR for this page; run in the browser only
	export const ssr = false;
	export const csr = true;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import GT from '@gtmap';
	import Hud from '$lib/Hud.svelte';

	let container: HTMLDivElement | null = null;
	let map: any;
	let gridLayer: any | null = null;

	const HOME = { lng: 4096, lat: 4096 };

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
			center: HOME,
			zoom: 2,
			minZoom: HAGGA.minZoom,
			maxZoom: HAGGA.maxZoom,
			fpsCap: 60,
			freePan: true
		});
		L.tileLayer(HAGGA.url, {
			minZoom: HAGGA.minZoom,
			maxZoom: HAGGA.maxZoom,
			tileSize: 256,
			tms: false,
			wrapX: false
		}).addTo(map);

		// HUD handled by <Hud/> component

		// Grid layer init — add once so remove() can toggle visibility later
		try {
			gridLayer = (L as any).grid();
			gridLayer.addTo(map);
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
		if (!map) return;
		map.setView([HOME.lat, HOME.lng], map.getZoom());
	}

	// HUD drives settings directly

</script>

<h1>GTMap Svelte Demo</h1>
<p>Simple page demonstrating GT.L in SvelteKit.</p>
<div bind:this={container} class="map">
	<Hud {map} fpsCap={60} wheelSpeed={1.0} wheelCtrlSpeed={0.4} freePan={true} wrapX={false} home={HOME} />
	<div class="attribution">Hagga Basin tiles © respective owners (game map)</div>

 
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

/* HUD styles moved into Hud.svelte */

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

/* HUD now includes controls */
	.panel.speed input[type='range'] { width: 140px; }
</style>
