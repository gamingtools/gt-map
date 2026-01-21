<script lang="ts">
	import { onMount } from 'svelte';
	import { GTMap, TextVisual, SvgVisual } from '@gtmap';

	let container: HTMLDivElement | null = null;
	let map: GTMap;

	// Non-square map (wider than tall)
	const MAP_IMAGE = { url: 'https://cdn.gaming.tools/gt/map-demo/map-sample-non-square.webp', width: 8192, height: 4096 };
	const PREVIEW_IMAGE = { url: 'https://cdn.gaming.tools/gt/map-demo/map-sample-non-square_1k.webp', width: 1024, height: 512 };
	const CENTER = { x: MAP_IMAGE.width / 2, y: MAP_IMAGE.height / 2 };
	const SVG_CDN = 'https://cdn.gaming.tools/gt/game-icons/lorc';

	onMount(() => {
		if (!container) return;

		map = new GTMap(container, {
			center: CENTER,
			zoom: 1,
			minZoom: 0,
			maxZoom: 6,
			fpsCap: 60,
			autoResize: true,
			preview: PREVIEW_IMAGE,
			image: MAP_IMAGE,
			clipToBounds: true,
			spinner: { size: 64, color: '#c2c2c2' },
		});

		map.setIconScaleFunction((zoom) => {
			const scale = Math.pow(2, zoom - 2);
			return Math.min(1, Math.max(0.4, scale));
		});

		addShowcase();

		return () => {
			map?.destroy?.();
		};
	});

	function addShowcase(): void {
		const W = MAP_IMAGE.width;
		const H = MAP_IMAGE.height;

		// === TITLE ===
		const title = new TextVisual('PANORAMIC MAP VIEW', {
			fontSize: 20,
			fontWeight: 'bold',
			color: '#f8fafc',
			strokeColor: '#0f172a',
			strokeWidth: 3,
		});
		title.anchor = 'center';
		title.iconScaleFunction = null;
		map.addMarker(CENTER.x, 400, { visual: title });

		const subtitle = new TextVisual(`${W} x ${H} pixels (2:1 aspect ratio)`, {
			fontSize: 12,
			color: '#94a3b8',
			backgroundColor: 'rgba(15,23,42,0.8)',
			padding: 6,
		});
		subtitle.anchor = 'center';
		subtitle.iconScaleFunction = null;
		map.addMarker(CENTER.x, 500, { visual: subtitle });

		// === LOCATIONS SPREAD ACROSS WIDTH ===
		const locations = [
			{ icon: 'sunrise.svg', fill: '#f59e0b', name: 'Eastern Shores', x: W * 0.85, y: H * 0.5 },
			{ icon: 'sunset.svg', fill: '#f97316', name: 'Western Coast', x: W * 0.15, y: H * 0.5 },
			{ icon: 'mountains.svg', fill: '#64748b', name: 'Central Peaks', x: W * 0.5, y: H * 0.35 },
			{ icon: 'palm-tree.svg', fill: '#22c55e', name: 'Southern Palms', x: W * 0.5, y: H * 0.75 },
			{ icon: 'tower.svg', fill: '#a855f7', name: 'North Tower', x: W * 0.35, y: H * 0.25 },
			{ icon: 'lighthouse.svg', fill: '#0ea5e9', name: 'Cape Light', x: W * 0.65, y: H * 0.25 },
		];

		locations.forEach((loc) => {
			const icon = new SvgVisual(`${SVG_CDN}/${loc.icon}`, 40, {
				fill: loc.fill,
				stroke: '#1e293b',
				strokeWidth: 1.5,
				shadow: { blur: 5, offsetY: 2 }
			});
			icon.anchor = 'center';
			map.addMarker(loc.x, loc.y, { visual: icon });

			const label = new TextVisual(loc.name, {
				fontSize: 11,
				color: '#f8fafc',
				strokeColor: '#0f172a',
				strokeWidth: 2,
			});
			label.anchor = 'top-center';
			label.iconScaleFunction = null;
			map.addMarker(loc.x, loc.y + 28, { visual: label });
		});

		// === TRADE ROUTE ACROSS THE MAP ===
		map.addVector({
			type: 'polyline',
			points: [
				{ x: W * 0.1, y: H * 0.5 },
				{ x: W * 0.25, y: H * 0.45 },
				{ x: W * 0.4, y: H * 0.5 },
				{ x: W * 0.5, y: H * 0.55 },
				{ x: W * 0.6, y: H * 0.5 },
				{ x: W * 0.75, y: H * 0.45 },
				{ x: W * 0.9, y: H * 0.5 },
			],
			style: { color: '#fbbf24', weight: 4, opacity: 0.7 }
		});

		// === TERRITORIES ===
		// Left territory
		map.addVector({
			type: 'polygon',
			points: [
				{ x: W * 0.05, y: H * 0.3 },
				{ x: W * 0.25, y: H * 0.25 },
				{ x: W * 0.3, y: H * 0.5 },
				{ x: W * 0.25, y: H * 0.75 },
				{ x: W * 0.05, y: H * 0.7 },
			],
			style: {
				color: '#3b82f6',
				weight: 2,
				opacity: 0.8,
				fill: true,
				fillColor: '#3b82f6',
				fillOpacity: 0.15
			}
		});

		// Right territory
		map.addVector({
			type: 'polygon',
			points: [
				{ x: W * 0.7, y: H * 0.25 },
				{ x: W * 0.95, y: H * 0.3 },
				{ x: W * 0.95, y: H * 0.7 },
				{ x: W * 0.75, y: H * 0.75 },
				{ x: W * 0.7, y: H * 0.5 },
			],
			style: {
				color: '#22c55e',
				weight: 2,
				opacity: 0.8,
				fill: true,
				fillColor: '#22c55e',
				fillOpacity: 0.15
			}
		});

		// === CORNER MARKERS ===
		const corners = [
			{ text: 'NW', x: 200, y: 200 },
			{ text: 'NE', x: W - 200, y: 200 },
			{ text: 'SW', x: 200, y: H - 200 },
			{ text: 'SE', x: W - 200, y: H - 200 },
		];

		corners.forEach((corner) => {
			const label = new TextVisual(corner.text, {
				fontSize: 14,
				fontWeight: 'bold',
				color: '#fbbf24',
				backgroundColor: 'rgba(0,0,0,0.7)',
				padding: 8,
			});
			label.anchor = 'center';
			label.iconScaleFunction = null;
			map.addMarker(corner.x, corner.y, { visual: label });
		});

		// === CENTER MARKER ===
		map.addVector({
			type: 'circle',
			center: { x: CENTER.x, y: CENTER.y },
			radius: 80,
			style: {
				color: '#f8fafc',
				weight: 2,
				opacity: 0.6,
				fill: false
			}
		});

		const centerLabel = new TextVisual('CENTER', {
			fontSize: 10,
			color: '#f8fafc',
			backgroundColor: 'rgba(0,0,0,0.5)',
			padding: 4,
		});
		centerLabel.anchor = 'center';
		centerLabel.iconScaleFunction = null;
		map.addMarker(CENTER.x, CENTER.y, { visual: centerLabel });
	}
</script>

<svelte:head>
	<title>Non-Square Map Demo - GTMap</title>
</svelte:head>

<div bind:this={container} class="map"></div>

<style>
	.map {
		position: relative;
		width: 100%;
		height: calc(100vh - 32px);
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
	}
</style>
