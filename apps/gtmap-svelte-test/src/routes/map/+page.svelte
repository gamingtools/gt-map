<script lang="ts" context="module">
	// Disable SSR for this page; run in the browser only
	export const ssr = false;
	export const csr = true;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import GT from '@gtmap';

	let container: HTMLDivElement | null = null;

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
		const map = L.map(container, {
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
	});
</script>

<h1>GTMap Svelte Demo</h1>
<p>Simple page demonstrating GT.L in SvelteKit.</p>
<div bind:this={container} class="map"></div>

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
</style>
