<script lang="ts">
	import { onMount } from 'svelte';
	import { GTMap, SvgVisual, TextVisual } from '@gtmap';

	let container: HTMLDivElement | null = null;
	let map: GTMap;

	const MAP_IMAGE = { url: 'https://cdn.gaming.tools/gt/map-demo/map-sample-1.webp', width: 8192, height: 8192 };
	const PREVIEW_IMAGE = { url: 'https://cdn.gaming.tools/gt/map-demo/map-sample-1_1k.webp', width: 1024, height: 1024 };
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
		// === SECTION 1: Top-left - Points of Interest ===
		const poiIcons = [
			{ icon: 'castle.svg', fill: '#64748b', label: 'Ironhold Keep', x: 1200, y: 1200 },
			{ icon: 'village.svg', fill: '#a16207', label: 'Millbrook Village', x: 2000, y: 1600 },
			{ icon: 'tower.svg', fill: '#475569', label: 'Watchtower', x: 1500, y: 2200 },
			{ icon: 'beer-stein.svg', fill: '#b45309', label: 'The Rusty Mug', x: 2400, y: 1200 },
		];

		poiIcons.forEach((poi) => {
			const visual = new SvgVisual(`${SVG_CDN}/${poi.icon}`, 36, {
				fill: poi.fill,
				stroke: '#1e293b',
				strokeWidth: 1.5,
				shadow: { blur: 4, offsetY: 2, color: 'rgba(0,0,0,0.5)' }
			});
			visual.anchor = 'center';
			map.addMarker(poi.x, poi.y, { visual });

			// Add label below
			const label = new TextVisual(poi.label, {
				fontSize: 11,
				color: '#f8fafc',
				strokeColor: '#0f172a',
				strokeWidth: 2,
			});
			label.anchor = 'top-center';
			label.iconScaleFunction = null;
			map.addMarker(poi.x, poi.y + 28, { visual: label });
		});

		// === SECTION 2: Top-right - Combat & Danger Zones ===
		const dangerIcons = [
			{ icon: 'skull-crossed-bones.svg', fill: '#dc2626', x: 6200, y: 1400 },
			{ icon: 'dragon-head.svg', fill: '#b91c1c', x: 6800, y: 1200 },
			{ icon: 'crossed-swords.svg', fill: '#991b1b', x: 6500, y: 1800 },
			{ icon: 'wolf-head.svg', fill: '#7f1d1d', x: 7100, y: 1600 },
		];

		dangerIcons.forEach((item) => {
			const visual = new SvgVisual(`${SVG_CDN}/${item.icon}`, 40, {
				fill: item.fill,
				stroke: '#450a0a',
				strokeWidth: 1.5,
				shadow: { blur: 8, offsetY: 0, color: 'rgba(220,38,38,0.4)' }
			});
			visual.anchor = 'center';
			map.addMarker(item.x, item.y, { visual });
		});

		// Danger zone label
		const dangerLabel = new TextVisual('DANGER ZONE', {
			fontSize: 12,
			fontWeight: 'bold',
			color: '#fef2f2',
			backgroundColor: '#991b1b',
			padding: 6,
		});
		dangerLabel.anchor = 'center';
		dangerLabel.iconScaleFunction = null;
		map.addMarker(6600, 1000, { visual: dangerLabel });

		// === SECTION 3: Center-left - Resources ===
		const resources = [
			{ icon: 'gold-bar.svg', fill: '#fbbf24', x: 1400, y: 4000 },
			{ icon: 'crystal-growth.svg', fill: '#a78bfa', x: 1800, y: 4400 },
			{ icon: 'ore.svg', fill: '#78716c', x: 2200, y: 4000 },
			{ icon: 'wood-pile.svg', fill: '#a16207', x: 1600, y: 4800 },
			{ icon: 'herbs-bundle.svg', fill: '#22c55e', x: 2000, y: 5200 },
		];

		resources.forEach((res) => {
			const visual = new SvgVisual(`${SVG_CDN}/${res.icon}`, 32, {
				fill: res.fill,
				stroke: '#1c1917',
				strokeWidth: 1,
				shadow: { blur: 3, offsetY: 2 }
			});
			visual.anchor = 'center';
			map.addMarker(res.x, res.y, { visual });
		});

		// === SECTION 4: Center - Main Castle with Glow ===
		const mainCastle = new SvgVisual(`${SVG_CDN}/castle-emblem.svg`, 64, {
			fill: '#fbbf24',
			stroke: '#78350f',
			strokeWidth: 2,
			shadow: { blur: 20, offsetY: 0, color: 'rgba(251,191,36,0.6)' }
		});
		mainCastle.anchor = 'center';
		map.addMarker(CENTER.x, CENTER.y, { visual: mainCastle });

		const capitalLabel = new TextVisual('CAPITAL CITY', {
			fontSize: 14,
			fontWeight: 'bold',
			color: '#fef3c7',
			strokeColor: '#78350f',
			strokeWidth: 2,
		});
		capitalLabel.anchor = 'top-center';
		capitalLabel.iconScaleFunction = null;
		map.addMarker(CENTER.x, CENTER.y + 50, { visual: capitalLabel });

		// === SECTION 5: Center-right - Quest Markers ===
		const quests = [
			{ icon: 'scroll-unfurled.svg', fill: '#fcd34d', x: 6000, y: 4200, label: 'Main Quest' },
			{ icon: 'envelope.svg', fill: '#60a5fa', x: 6400, y: 4600, label: 'Side Quest' },
			{ icon: 'treasure-map.svg', fill: '#f97316', x: 6800, y: 4200, label: 'Treasure Hunt' },
		];

		quests.forEach((quest) => {
			const visual = new SvgVisual(`${SVG_CDN}/${quest.icon}`, 36, {
				fill: quest.fill,
				stroke: '#1e293b',
				strokeWidth: 1.5,
				shadow: { blur: 6, offsetY: 2 }
			});
			visual.anchor = 'center';
			map.addMarker(quest.x, quest.y, { visual });

			const label = new TextVisual(quest.label, {
				fontSize: 10,
				color: '#ffffff',
				backgroundColor: 'rgba(0,0,0,0.7)',
				padding: 4,
			});
			label.anchor = 'top-center';
			label.iconScaleFunction = null;
			map.addMarker(quest.x, quest.y + 26, { visual: label });
		});

		// === SECTION 6: Bottom-left - Magic/Arcane ===
		const arcane = [
			{ icon: 'magic-portal.svg', fill: '#a855f7', glow: 'rgba(168,85,247,0.5)', x: 1600, y: 6400 },
			{ icon: 'crystal-ball.svg', fill: '#c084fc', glow: 'rgba(192,132,252,0.5)', x: 2100, y: 6800 },
			{ icon: 'fairy-wand.svg', fill: '#e879f9', glow: 'rgba(232,121,249,0.5)', x: 1400, y: 7000 },
			{ icon: 'rune-stone.svg', fill: '#8b5cf6', glow: 'rgba(139,92,246,0.5)', x: 2400, y: 6500 },
		];

		arcane.forEach((item) => {
			const visual = new SvgVisual(`${SVG_CDN}/${item.icon}`, 38, {
				fill: item.fill,
				shadow: { blur: 14, offsetY: 0, color: item.glow }
			});
			visual.anchor = 'center';
			map.addMarker(item.x, item.y, { visual });
		});

		// === SECTION 7: Bottom-right - Naval/Water ===
		const naval = [
			{ icon: 'anchor.svg', fill: '#0ea5e9', x: 6200, y: 6600 },
			{ icon: 'pirate-flag.svg', fill: '#1e293b', x: 6700, y: 6400 },
			{ icon: 'fishing-hook.svg', fill: '#64748b', x: 6400, y: 7000 },
			{ icon: 'lighthouse.svg', fill: '#fbbf24', x: 7000, y: 6800 },
		];

		naval.forEach((item) => {
			const visual = new SvgVisual(`${SVG_CDN}/${item.icon}`, 34, {
				fill: item.fill,
				stroke: '#0c4a6e',
				strokeWidth: 1.5,
				shadow: { blur: 4, offsetY: 2 }
			});
			visual.anchor = 'center';
			map.addMarker(item.x, item.y, { visual });
		});

		// Harbor label
		const harborLabel = new TextVisual('Stormwind Harbor', {
			fontSize: 12,
			fontStyle: 'italic',
			color: '#bae6fd',
			strokeColor: '#0c4a6e',
			strokeWidth: 2,
		});
		harborLabel.anchor = 'center';
		harborLabel.iconScaleFunction = null;
		map.addMarker(6600, 6200, { visual: harborLabel });
	}
</script>

<svelte:head>
	<title>Markers Demo - GTMap</title>
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
