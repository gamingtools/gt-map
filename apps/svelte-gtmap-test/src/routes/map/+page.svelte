<script lang="ts">
	import { onMount } from 'svelte';
	import { GTMap, type IconDef, type IconHandle } from '@gtmap';
	// Sample icons for demonstrating custom icon registration
	import iconDefs from '$lib/sample-data/MapIcons.json';
	const typedIconDefs: Record<string, IconDef> = iconDefs;
	import Hud from '$lib/Hud.svelte';

	let container: HTMLDivElement | null = null;
	let map: GTMap;

	const MAP_IMAGE = {
		url: 'https://gtcdn.info/dune/tiles/hb_8k.webp',
		width: 8192,
		height: 8192,
		preview: { url: 'https://gtcdn.info/dune/tiles/hb_1k.webp', width: 1024, height: 1024 }
	};
	const HOME = { lng: MAP_IMAGE.width / 2, lat: MAP_IMAGE.height / 2 };

	let markerCount = 1000;


	function clampMarkerCount(n: number): number {
		if (!Number.isFinite(n)) return 0;
		n = Math.max(0, Math.min(999_999, Math.floor(n)));
		return n;
	}

	function rand(min: number, max: number): number {
		return Math.random() * (max - min) + min;
	}

	let iconHandles: IconHandle[] | null = null;
	let fallbackIcon: IconHandle | null = null;

	function createFallbackIcon(): IconHandle | null {
		try {
			const size = 32;
			const cnv = document.createElement('canvas');
			cnv.width = size;
			cnv.height = size;
			const ctx = cnv.getContext('2d');
			if (!ctx) return null;
			ctx.clearRect(0, 0, size, size);
			// Draw a rotated-looking triangle arrow so rotation is obvious
			ctx.fillStyle = '#ef4444';
			ctx.strokeStyle = '#111827';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(size * 0.50, size * 0.10);
			ctx.lineTo(size * 0.85, size * 0.90);
			ctx.lineTo(size * 0.15, size * 0.90);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			const url = cnv.toDataURL('image/png');
			return map.addIcon({ iconPath: url, width: size, height: size, anchorX: size / 2, anchorY: size / 2 });
		} catch {
			return null;
		}
	}

	function applyMarkerCount(n: number): void {
		if (!map) return;
		const count = clampMarkerCount(n);
		markerCount = count;
		map?.clearMarkers?.();

		for (let i = 0; i < markerCount; i++) {
			const x = rand(0, MAP_IMAGE.width);
			const y = rand(0, MAP_IMAGE.height);
			const iconHandle = iconHandles && iconHandles.length > 0 ? iconHandles[i % iconHandles.length] : (fallbackIcon ?? null);
			const marker = map.addMarker(
				x,
				y,
				iconHandle ? { icon: iconHandle, data: { id: i } } : undefined
			);
			// marker.events.on('click').each((e) => {
			// 	console.log('Marker clicked:', e);
			// });
			// marker.events.on('pointerenter').each((e) => {
			// 	console.log('Marker pointerenter:', e);
			// });
			// marker.events.on('pointerleave').each((e) => {
			// 	console.log('Marker pointerleave:', e);
			// });
		}

			// No persistence in demo: markers start fresh each run
	}

	function setMarkerCount(n: number): void {
		applyMarkerCount(n);
	}


	function addVectors(): void {
		if (!map) return;
		try {
			// Add vectors one by one (preferred over deprecated addVectors)
			map.addVector({
				type: 'polyline',
				points: [
					{ x: 1000, y: 1000 },
					{ x: 2000, y: 1400 },
					{ x: 3000, y: 1200 }
				],
				style: { color: '#1e90ff', weight: 2, opacity: 0.9 }
			});
			map.addVector({
				type: 'polygon',
				points: [
					{ x: 2600, y: 2600 },
					{ x: 3000, y: 3000 },
					{ x: 2600, y: 3200 },
					{ x: 2300, y: 3000 }
				],
				style: {
					color: '#10b981',
					weight: 2,
					opacity: 0.9,
					fill: true,
					fillColor: '#10b981',
					fillOpacity: 0.25
				}
			});
			map.addVector({
				type: 'circle',
				center: { x: HOME.lng, y: HOME.lat },
				radius: 200,
				style: {
					color: '#f59e0b',
					weight: 2,
					opacity: 0.9,
					fill: true,
					fillColor: '#f59e0b',
					fillOpacity: 0.2
				}
			});
		} catch {}
	}

	function clearVectors(): void {
		try {
			map?.clearVectors?.();
		} catch {}
	}

	function setMarkersEnabled(on: boolean): void {
		if (on) applyMarkerCount(markerCount);
		else map?.clearMarkers?.();
	}

	function setVectorsEnabled(on: boolean): void {
		if (on) addVectors();
		else clearVectors();
	}

	onMount(() => {
		if (!container) return;

		map = new GTMap(container, {
			// Initial view
			center: { x: HOME.lng, y: HOME.lat },
			zoom: 2,
			minZoom: 0,
			maxZoom: 5,
			fpsCap: 60,
			autoResize: true,
			image: MAP_IMAGE,
			wrapX: false
		});

		// Register a custom icon to demonstrate addIcon/addMarker
		try {
			for (const key in typedIconDefs) {
				const def = typedIconDefs[key];
				iconHandles = iconHandles || [];
				iconHandles.push(
					map.addIcon({
						iconPath: def.iconPath,
						x2IconPath: def.x2IconPath,
						width: def.width,
						height: def.height
					})
				);
			}
		} catch {}

		// Ensure we have a visible, asymmetric icon for rotation if remote icons fail
		// fallbackIcon = createFallbackIcon();
		// applyMarkerCount(markerCount);
		// addVectors();

		// Test icon scaling examples
		// Example 1: Scale with zoom (like real world objects)
		// map.setIconScaleFunction((zoom, minZoom, maxZoom) => Math.pow(2, zoom - 3));

		// Example 2: Fixed size (default behavior)
		// map.setIconScaleFunction(() => 1);

		// Example 3: Step-based scaling
		// map.setIconScaleFunction((zoom) => {
		// 	if (zoom < 2) return 0.5;
		// 	if (zoom < 4) return 1;
		// 	return 1.5;
		// });

		// map.setIconScaleFunction((zoom, minZoom, maxZoom) => {
		// 	const maxScale = 1;
		// 	const scale = Math.pow(2, zoom - 3);
		// 	return Math.min(maxScale, Math.max(0.5, scale));
		// });

		// map.events.on('pointerup').each((e) => console.log('up', e));
		// map.events.on('markerenter').each((e) => console.log('markerenter', e));
		// map.events.on('markerleave').each((e) => console.log('markerleave', e));
		// map.events.on('click').each((e) => console.log('map click', e));
		// map.events.on('mousedown').each((e) => console.log('mousedown', e));


			// Teardown on navigation/unmount per Svelte docs
			return () => {
				map?.destroy?.();
			};
	});
	
</script>

<div bind:this={container} class="map">
	<Hud
		{map}
		fpsCap={60}
		wheelSpeed={1.0}
		home={HOME}
		{markerCount}
		{setMarkerCount}
		{setMarkersEnabled}
		{setVectorsEnabled}
	/>
	<!-- Controls removed for simplified API -->
</div>

<style>
	.map {
		position: relative;
		/* Dark neutral to match app background */
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
		width: 100%;
		height: calc(100vh - 32px);
	}
</style>
