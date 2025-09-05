<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { GTMap } from '@gtmap';
	import type { IconDef } from '@gtmap';
	import iconDefs from '$lib/sample-data/MapIcons.json';
	const typedIconDefs: Record<string, IconDef> = iconDefs;

	let container: HTMLDivElement | null = null;
	let map: GTMap;

	const HOME = { x: 4096, y: 4096 };

	onMount(() => {
		if (!container) return;

		// Create map with new GTMap API
		map = new GTMap(container, {
			center: HOME,
			zoom: 2,
			minZoom: 0,
			maxZoom: 10,
			fpsCap: 60,
			prefetch: { enabled: true, baselineLevel: 2, ring: 0 }
		});

		// Set tile source
		map.setTileSource({
			url: 'https://gtcdn.info/dune/tiles/hb_8k/{z}/{x}_{y}.webp',
			sourceMinZoom: 0,
			sourceMaxZoom: 5,
			tileSize: 256,
			wrapX: false,
			mapSize: { width: 8192, height: 8192 }
		});

		// Add icon and marker
		const iconHandle = map.addIcon(typedIconDefs.sandstorm);
		map.addMarker(HOME.x, HOME.y, { icon: iconHandle });

		// Listen to events
		const unsubClick = map.events.on('pointerdown').each((event) => {
			if (event.world && Math.abs(event.world.x - HOME.x) < 50 && Math.abs(event.world.y - HOME.y) < 50) {
				console.log('marker area clicked', event);
			}
		});

		// Resize handling (debounced): wait until user stops resizing
		let resizeTimer: any = null;
		const scheduleInvalidate = () => {
			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(() => {
				try {
					map?.invalidateSize();
				} catch {}
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
		return () => {
			unsubClick();
			map?.destroy?.();
			if (ro) {
				try {
					ro.disconnect();
				} catch {}
				ro = null;
			}
			if (usedWindowResize) {
				window.removeEventListener('resize', scheduleInvalidate);
				usedWindowResize = false;
			}
			if (resizeTimer) {
				clearTimeout(resizeTimer);
				resizeTimer = null;
			}
		};
	});
</script>

<div bind:this={container} class="map"></div>

<style>
	.map {
		position: relative;
		/* Dark neutral to match app background */
		background: #171717;
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
		width: 100%;
		height: calc(100vh - 32px);
	}
</style>