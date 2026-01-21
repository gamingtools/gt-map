<script lang="ts">
	import { onMount } from 'svelte';
	import { GTMap, TextVisual, SvgVisual } from '@gtmap';

	let container: HTMLDivElement | null = null;
	let map: GTMap;

	const MAP_IMAGE = { url: 'https://cdn.gaming.tools/gt/map-demo/map-sample-2.webp', width: 8192, height: 8192 };
	const PREVIEW_IMAGE = { url: 'https://cdn.gaming.tools/gt/map-demo/map-sample-2_1k.webp', width: 1024, height: 1024 };
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
		// === TRADE ROUTES (Polylines) ===

		// Main trade route - thick golden path
		map.addVector({
			type: 'polyline',
			points: [
				{ x: 800, y: 4000 },
				{ x: 1500, y: 3600 },
				{ x: 2400, y: 3800 },
				{ x: 3200, y: 3400 },
				{ x: 4096, y: 3600 },
				{ x: 5000, y: 3200 },
				{ x: 6000, y: 3400 },
				{ x: 7000, y: 3000 },
				{ x: 7600, y: 3200 },
			],
			style: { color: '#fbbf24', weight: 5, opacity: 0.8 }
		});

		// Secondary routes - thinner paths
		map.addVector({
			type: 'polyline',
			points: [
				{ x: 2400, y: 3800 },
				{ x: 2600, y: 4400 },
				{ x: 2400, y: 5200 },
				{ x: 2800, y: 6000 },
			],
			style: { color: '#a3a3a3', weight: 3, opacity: 0.7 }
		});

		map.addVector({
			type: 'polyline',
			points: [
				{ x: 5000, y: 3200 },
				{ x: 5400, y: 2400 },
				{ x: 5200, y: 1600 },
				{ x: 5600, y: 1000 },
			],
			style: { color: '#a3a3a3', weight: 3, opacity: 0.7 }
		});

		// River - blue wavy line
		map.addVector({
			type: 'polyline',
			points: [
				{ x: 1000, y: 1200 },
				{ x: 1400, y: 1800 },
				{ x: 1200, y: 2400 },
				{ x: 1600, y: 3000 },
				{ x: 1400, y: 3600 },
				{ x: 1800, y: 4200 },
				{ x: 1600, y: 4800 },
				{ x: 2000, y: 5400 },
				{ x: 1800, y: 6000 },
				{ x: 2200, y: 6600 },
				{ x: 2000, y: 7200 },
			],
			style: { color: '#3b82f6', weight: 6, opacity: 0.6 }
		});

		// === TERRITORIES (Polygons) ===

		// Kingdom territory - large blue region
		map.addVector({
			type: 'polygon',
			points: [
				{ x: 5500, y: 4500 },
				{ x: 6200, y: 4200 },
				{ x: 7000, y: 4400 },
				{ x: 7400, y: 5200 },
				{ x: 7200, y: 6000 },
				{ x: 6400, y: 6400 },
				{ x: 5600, y: 6200 },
				{ x: 5200, y: 5400 },
			],
			style: {
				color: '#3b82f6',
				weight: 3,
				opacity: 0.9,
				fill: true,
				fillColor: '#3b82f6',
				fillOpacity: 0.15
			}
		});

		// Add kingdom label
		const kingdomLabel = new TextVisual('Eastern Kingdom', {
			fontSize: 14,
			fontWeight: 'bold',
			color: '#bfdbfe',
			strokeColor: '#1e3a8a',
			strokeWidth: 2,
		});
		kingdomLabel.anchor = 'center';
		kingdomLabel.iconScaleFunction = null;
		map.addMarker(6300, 5300, { visual: kingdomLabel });

		// Forest region - green
		map.addVector({
			type: 'polygon',
			points: [
				{ x: 800, y: 5800 },
				{ x: 1600, y: 5400 },
				{ x: 2400, y: 5600 },
				{ x: 2800, y: 6400 },
				{ x: 2400, y: 7200 },
				{ x: 1600, y: 7400 },
				{ x: 800, y: 7000 },
				{ x: 600, y: 6400 },
			],
			style: {
				color: '#22c55e',
				weight: 2,
				opacity: 0.8,
				fill: true,
				fillColor: '#22c55e',
				fillOpacity: 0.2
			}
		});

		const forestLabel = new TextVisual('Elderwood Forest', {
			fontSize: 12,
			fontStyle: 'italic',
			color: '#bbf7d0',
			strokeColor: '#166534',
			strokeWidth: 2,
		});
		forestLabel.anchor = 'center';
		forestLabel.iconScaleFunction = null;
		map.addMarker(1600, 6400, { visual: forestLabel });

		// Danger zone - red triangle
		map.addVector({
			type: 'polygon',
			points: [
				{ x: 6800, y: 1000 },
				{ x: 7600, y: 2200 },
				{ x: 6000, y: 2200 },
			],
			style: {
				color: '#dc2626',
				weight: 3,
				opacity: 0.9,
				fill: true,
				fillColor: '#dc2626',
				fillOpacity: 0.2
			}
		});

		const dangerLabel = new TextVisual('Dragon Peak', {
			fontSize: 11,
			fontWeight: 'bold',
			color: '#fecaca',
			backgroundColor: 'rgba(127,29,29,0.8)',
			padding: 4,
		});
		dangerLabel.anchor = 'center';
		dangerLabel.iconScaleFunction = null;
		map.addMarker(6800, 1600, { visual: dangerLabel });

		// === POINTS OF INTEREST (Circles) ===

		// Major city - large circle
		map.addVector({
			type: 'circle',
			center: { x: 4096, y: 4096 },
			radius: 400,
			style: {
				color: '#fbbf24',
				weight: 4,
				opacity: 0.9,
				fill: true,
				fillColor: '#fbbf24',
				fillOpacity: 0.1
			}
		});

		const cityIcon = new SvgVisual(`${SVG_CDN}/castle.svg`, 48, {
			fill: '#fbbf24',
			stroke: '#78350f',
			strokeWidth: 2,
			shadow: { blur: 8, offsetY: 2 }
		});
		cityIcon.anchor = 'center';
		map.addMarker(4096, 4096, { visual: cityIcon });

		const cityLabel = new TextVisual('CROSSROADS CITY', {
			fontSize: 13,
			fontWeight: 'bold',
			color: '#fef3c7',
			strokeColor: '#78350f',
			strokeWidth: 2,
		});
		cityLabel.anchor = 'top-center';
		cityLabel.iconScaleFunction = null;
		map.addMarker(4096, 4180, { visual: cityLabel });

		// Outposts - medium circles
		const outposts = [
			{ x: 2000, y: 2000, name: 'North Watch' },
			{ x: 6000, y: 6800, name: 'South Gate' },
			{ x: 1200, y: 4600, name: 'West Tower' },
		];

		outposts.forEach((outpost) => {
			map.addVector({
				type: 'circle',
				center: { x: outpost.x, y: outpost.y },
				radius: 200,
				style: {
					color: '#64748b',
					weight: 2,
					opacity: 0.8,
					fill: true,
					fillColor: '#64748b',
					fillOpacity: 0.15
				}
			});

			const icon = new SvgVisual(`${SVG_CDN}/tower.svg`, 32, {
				fill: '#64748b',
				stroke: '#1e293b',
				strokeWidth: 1.5,
				shadow: { blur: 4, offsetY: 2 }
			});
			icon.anchor = 'center';
			map.addMarker(outpost.x, outpost.y, { visual: icon });

			const label = new TextVisual(outpost.name, {
				fontSize: 10,
				color: '#e2e8f0',
				strokeColor: '#1e293b',
				strokeWidth: 1.5,
			});
			label.anchor = 'top-center';
			label.iconScaleFunction = null;
			map.addMarker(outpost.x, outpost.y + 24, { visual: label });
		});

		// Magic wells - small glowing circles
		const wells = [
			{ x: 3200, y: 5800, color: '#a855f7' },
			{ x: 4800, y: 2200, color: '#06b6d4' },
			{ x: 7200, y: 4000, color: '#22c55e' },
		];

		wells.forEach((well) => {
			// Outer glow
			map.addVector({
				type: 'circle',
				center: { x: well.x, y: well.y },
				radius: 120,
				style: {
					color: well.color,
					weight: 2,
					opacity: 0.4,
					fill: true,
					fillColor: well.color,
					fillOpacity: 0.1
				}
			});
			// Inner circle
			map.addVector({
				type: 'circle',
				center: { x: well.x, y: well.y },
				radius: 60,
				style: {
					color: well.color,
					weight: 3,
					opacity: 0.8,
					fill: true,
					fillColor: well.color,
					fillOpacity: 0.3
				}
			});
		});
	}
</script>

<svelte:head>
	<title>Vectors Demo - GTMap</title>
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
