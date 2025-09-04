<script lang="ts">
	type IconDef = { iconPath: string; x2IconPath?: string; width: number; height: number };

	import { onMount, onDestroy } from 'svelte';
	import { L, type LeafletMapFacade } from '@gtmap';
	import Hud from '$lib/Hud.svelte';
	import ZoomControl from '$lib/ZoomControl.svelte';
	import AttributionControl from '$lib/AttributionControl.svelte';
	import iconDefs from '$lib/sample-data/MapIcons.json';
	const typedIconDefs: Record<string, IconDef> = iconDefs;

	let container: HTMLDivElement | null = null;
	let map: LeafletMapFacade;

	const HOME = { lng: 4096, lat: 4096 };

	onMount(() => {
		if (!container) return;

		map = L.map(container, {
			center: HOME,
			zoom: 2,
			minZoom: 0,
			maxZoom: 10,
			fpsCap: 60
		});
		map.setPrefetchOptions({ enabled: true, baselineLevel: 2, ring: 0 });
		L.tileLayer('https://gtcdn.info/dune/tiles/hb_8k/{z}/{x}_{y}.webp', {
			minZoom: 0,
			maxZoom: 5,
			tileSize: 256,
			tms: false,
			noWrap: true,
			bounds: [
				[0, 0],
				[8192, 8192]
			]
		}).addTo(map!);
		L.marker([4096, 4096], {
			icon: L.icon({
				iconUrl: typedIconDefs.sandstorm.iconPath,
				iconRetinaUrl: typedIconDefs.sandstorm.x2IconPath,
				iconSize: [typedIconDefs.sandstorm.width, typedIconDefs.sandstorm.height]
			})
		}).addTo(map);

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

		map.events.on('pointerup').each((e) => console.log('up', e));

		// Teardown on navigation/unmount per Svelte docs

		// Teardown on navigation/unmount per Svelte docs
		return () => {
			map?.remove?.();
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
