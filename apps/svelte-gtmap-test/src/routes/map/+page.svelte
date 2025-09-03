<script lang="ts" context="module">
	// Disable SSR for this page; run in the browser only
	export const ssr = false;
	export const csr = true;
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import GT from '@gtmap';
	import Hud from '$lib/Hud.svelte';

	let container: HTMLDivElement | null = null;
	let map: any;
	let gridLayer: any | null = null;

	const HOME = { lng: 4096, lat: 4096 };

	onMount(() => {
		if (!container) return;
		const L = GT.L;
		const HAGGA = {
			url: 'https://gtcdn.info/dune/tiles/hb_8k/{z}/{x}_{y}.webp',
			minZoom: 0,
			maxZoom: 5,
			wrapX: false
		};
    // Full image bounds (pixel CRS): 0..8192 for 8k base (256 * 2^5)
    const BOUNDS: [[number, number], [number, number]] = [[0, 0], [8192, 8192]];
    map = L.map(container, {
      center: HOME,
      zoom: 2,
      minZoom: HAGGA.minZoom,
      maxZoom: HAGGA.maxZoom,
      fpsCap: 60,
      maxBounds: BOUNDS,
      maxBoundsViscosity: 1,
      bounceAtZoomLimits: true
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

		// Resize handling (debounced): wait until user stops resizing
		let resizeTimer: any = null;
		const scheduleInvalidate = () => {
			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(() => {
				try { map.invalidateSize(); } catch {}
			}, 160);
		};
		let ro: ResizeObserver | null = null;
		let usedWindowResize = false;
		try {
			ro = new ResizeObserver(scheduleInvalidate);
			ro.observe(container);
		} catch {
			window.addEventListener('resize', scheduleInvalidate);
			usedWindowResize = true;
		}

		// Teardown on navigation/unmount per Svelte docs
		onDestroy(() => {
			console.log('GTMap Svelte unmounting');
			try { gridLayer?.remove?.(); } catch {}
			try { map?.remove?.(); } catch {}
			if (resizeTimer) { try { clearTimeout(resizeTimer); } catch {} resizeTimer = null; }
			try { ro?.disconnect?.(); } catch {}
			if (usedWindowResize) { try { window.removeEventListener('resize', scheduleInvalidate); } catch {} }
			console.log('GTMap Svelte unmounted');
		});
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
  <Hud {map} fpsCap={60} wheelSpeed={1.0} wheelCtrlSpeed={0.4} home={HOME} />
	<div class="attribution">Hagga Basin tiles © respective owners (game map)</div>

 
</div>

<style>
	.map {
		position: relative;
		background: #ddd;
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
		/* Make container square based on viewport height, capped by width */
		aspect-ratio: 1 / 1;
		width: min(80vh, 100%);
		height: auto;
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


</style>
