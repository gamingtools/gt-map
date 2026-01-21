<script lang="ts">
	import { onMount } from 'svelte';
	import { GTMap, TextVisual, SvgVisual } from '@gtmap';

	let container: HTMLDivElement | null = null;
	let map: GTMap;

	const MAP_IMAGE = { url: 'https://cdn.gaming.tools/gt/map-demo/map-sample-3.webp', width: 8192, height: 8192 };
	const PREVIEW_IMAGE = { url: 'https://cdn.gaming.tools/gt/map-demo/map-sample-3_1k.webp', width: 1024, height: 1024 };
	const CENTER = { x: MAP_IMAGE.width / 2, y: MAP_IMAGE.height / 2 };
	const SVG_CDN = 'https://cdn.gaming.tools/gt/game-icons/lorc';

	onMount(() => {
		if (!container) return;

		map = new GTMap(container, {
			center: CENTER,
			zoom: 2,
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
			const scale = Math.pow(2, zoom - 3);
			return Math.min(1, Math.max(0.4, scale));
		});

		addShowcase();

		return () => {
			map?.destroy?.();
		};
	});

	function addShowcase(): void {
		// === REGION NAMES (Large, stroked text) ===
		const regions = [
			{ text: 'THE NORTHERN WASTES', x: 4096, y: 1200, size: 24, color: '#e0f2fe', stroke: '#0c4a6e' },
			{ text: 'CRIMSON DESERT', x: 6400, y: 4096, size: 20, color: '#fecaca', stroke: '#7f1d1d' },
			{ text: 'VERDANT PLAINS', x: 2000, y: 4500, size: 18, color: '#bbf7d0', stroke: '#166534' },
			{ text: 'THE SHADOWLANDS', x: 4096, y: 7000, size: 22, color: '#d4d4d8', stroke: '#3f3f46' },
		];

		regions.forEach((region) => {
			const label = new TextVisual(region.text, {
				fontSize: region.size,
				fontWeight: 'bold',
				color: region.color,
				strokeColor: region.stroke,
				strokeWidth: 3,
			});
			label.anchor = 'center';
			label.iconScaleFunction = null;
			map.addMarker(region.x, region.y, { visual: label });
		});

		// === LOCATION NAMES (Medium, italic) ===
		const locations = [
			{ text: 'Crystal Lake', x: 1600, y: 2400 },
			{ text: 'Whispering Woods', x: 2800, y: 3200 },
			{ text: "Dragon's Rest", x: 5600, y: 2000 },
			{ text: 'Merchant Bay', x: 6800, y: 5800 },
			{ text: 'Ancient Ruins', x: 3400, y: 5600 },
		];

		locations.forEach((loc) => {
			const label = new TextVisual(loc.text, {
				fontSize: 14,
				fontStyle: 'italic',
				color: '#fef3c7',
				strokeColor: '#78350f',
				strokeWidth: 2,
			});
			label.anchor = 'center';
			label.iconScaleFunction = null;
			map.addMarker(loc.x, loc.y, { visual: label });
		});

		// === POI LABELS (With icons and badge labels) ===
		const pois = [
			{ icon: 'castle.svg', fill: '#fbbf24', label: 'Goldspire Castle', x: 4096, y: 4096 },
			{ icon: 'village.svg', fill: '#a16207', label: 'Millbrook', x: 2200, y: 3800 },
			{ icon: 'beer-stein.svg', fill: '#b45309', label: 'The Jolly Tankard', x: 5200, y: 4800 },
			{ icon: 'skull-crossed-bones.svg', fill: '#dc2626', label: 'Bone Pit', x: 6000, y: 3200 },
		];

		pois.forEach((poi) => {
			const icon = new SvgVisual(`${SVG_CDN}/${poi.icon}`, 36, {
				fill: poi.fill,
				stroke: '#1e293b',
				strokeWidth: 1.5,
				shadow: { blur: 4, offsetY: 2 }
			});
			icon.anchor = 'center';
			map.addMarker(poi.x, poi.y, { visual: icon });

			const label = new TextVisual(poi.label, {
				fontSize: 11,
				color: '#ffffff',
				strokeColor: '#000000',
				strokeWidth: 2,
			});
			label.anchor = 'top-center';
			label.iconScaleFunction = null;
			map.addMarker(poi.x, poi.y + 26, { visual: label });
		});

		// === STATUS BADGES ===
		const badges = [
			{ text: 'SAFE ZONE', bg: '#22c55e', color: '#ffffff', x: 1400, y: 5200 },
			{ text: 'DANGER', bg: '#dc2626', color: '#ffffff', x: 6200, y: 2600 },
			{ text: 'CONTESTED', bg: '#f59e0b', color: '#000000', x: 4600, y: 5400 },
			{ text: 'NEUTRAL', bg: '#64748b', color: '#ffffff', x: 3000, y: 6200 },
		];

		badges.forEach((badge) => {
			const label = new TextVisual(badge.text, {
				fontSize: 10,
				fontWeight: 'bold',
				color: badge.color,
				backgroundColor: badge.bg,
				padding: 6,
			});
			label.anchor = 'center';
			label.iconScaleFunction = null;
			map.addMarker(badge.x, badge.y, { visual: label });
		});

		// === COORDINATE MARKERS (Monospace) ===
		const coords = [
			{ x: 1000, y: 1000 },
			{ x: 7000, y: 1000 },
			{ x: 1000, y: 7000 },
			{ x: 7000, y: 7000 },
		];

		coords.forEach((coord) => {
			const label = new TextVisual(`[${coord.x}, ${coord.y}]`, {
				fontSize: 9,
				fontFamily: 'monospace',
				color: '#a1a1aa',
				backgroundColor: 'rgba(0,0,0,0.6)',
				padding: 4,
			});
			label.anchor = 'center';
			label.iconScaleFunction = null;
			map.addMarker(coord.x, coord.y, { visual: label });
		});

		// === DISTANCE MARKERS ===
		const distances = [
			{ from: 'Castle', to: 'Village', dist: '2.4 km', x: 3200, y: 4000 },
			{ from: 'Harbor', to: 'Ruins', dist: '5.1 km', x: 5100, y: 5700 },
		];

		distances.forEach((d) => {
			const label = new TextVisual(`${d.from} -> ${d.to}: ${d.dist}`, {
				fontSize: 10,
				fontFamily: 'monospace',
				color: '#d4d4d8',
				strokeColor: '#27272a',
				strokeWidth: 1,
			});
			label.anchor = 'center';
			label.iconScaleFunction = null;
			map.addMarker(d.x, d.y, { visual: label });
		});

		// === STYLED QUOTES ===
		const quote = new TextVisual('"Here be dragons"', {
			fontSize: 16,
			fontStyle: 'italic',
			fontFamily: 'Georgia, serif',
			color: '#fca5a5',
			strokeColor: '#7f1d1d',
			strokeWidth: 2,
		});
		quote.anchor = 'center';
		quote.iconScaleFunction = null;
		map.addMarker(6400, 1400, { visual: quote });

		// === MULTI-LINE SIMULATION (stacked labels) ===
		const titleLine1 = new TextVisual('WELCOME TO', {
			fontSize: 12,
			color: '#a1a1aa',
			strokeColor: '#27272a',
			strokeWidth: 1,
		});
		titleLine1.anchor = 'center';
		titleLine1.iconScaleFunction = null;
		map.addMarker(CENTER.x, CENTER.y - 60, { visual: titleLine1 });

		const titleLine2 = new TextVisual('THE REALM', {
			fontSize: 28,
			fontWeight: 'bold',
			color: '#fbbf24',
			strokeColor: '#78350f',
			strokeWidth: 3,
		});
		titleLine2.anchor = 'center';
		titleLine2.iconScaleFunction = null;
		map.addMarker(CENTER.x, CENTER.y - 20, { visual: titleLine2 });

		const titleLine3 = new TextVisual('Est. 1247', {
			fontSize: 11,
			fontStyle: 'italic',
			color: '#d4d4d8',
			strokeColor: '#3f3f46',
			strokeWidth: 1,
		});
		titleLine3.anchor = 'center';
		titleLine3.iconScaleFunction = null;
		map.addMarker(CENTER.x, CENTER.y + 20, { visual: titleLine3 });
	}
</script>

<svelte:head>
	<title>Text Labels Demo - GTMap</title>
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
