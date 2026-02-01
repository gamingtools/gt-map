<script lang="ts">
	import { onMount } from 'svelte';
	import { GTMap, ImageVisual, TextVisual, SvgVisual, type IconDef } from '@gtmap';
	import iconDefs from '$lib/sample-data/MapIcons.json';
	const typedIconDefs: Record<string, IconDef> = iconDefs;
	import Hud from '$lib/Hud.svelte';
	import Hover from '$lib/Hover.svelte';

	let container: HTMLDivElement | null = null;
	let map: GTMap;

	const MAP_TILES = {
		packUrl: 'https://gtcdn.info/dune/tiles/hb_8k.gtpk',
		tileSize: 256,
		mapSize: { width: 8192, height: 8192 },
		sourceMinZoom: 0,
		sourceMaxZoom: 5,
	};
	const HOME = { lng: MAP_TILES.mapSize.width / 2, lat: MAP_TILES.mapSize.height / 2 };

	let markerCount = 1000;

	function clampMarkerCount(n: number): number {
		if (!Number.isFinite(n)) return 0;
		n = Math.max(0, Math.min(999_999, Math.floor(n)));
		return n;
	}

	function rand(min: number, max: number): number {
		return Math.random() * (max - min) + min;
	}

	let iconVisuals: ImageVisual[] | null = null;
	let svgVisuals: SvgVisual[] | null = null;

	const SVG_CDN = 'https://cdn.gaming.tools/gt/game-icons/lorc';

	function createSvgVisuals(): SvgVisual[] {
		const icons: SvgVisual[] = [];

		// Sword - red with white stroke
		const sword = new SvgVisual(`${SVG_CDN}/broadsword.svg`, 32, {
			fill: '#dc2626',
			stroke: '#ffffff',
			strokeWidth: 2,
			shadow: { blur: 3, offsetY: 2 }
		});
		sword.anchor = 'center';
		icons.push(sword);

		// Shield - blue with yellow stroke
		const shield = new SvgVisual(`${SVG_CDN}/bordered-shield.svg`, 32, {
			fill: '#3b82f6',
			stroke: '#fbbf24',
			strokeWidth: 2,
			shadow: { blur: 3, offsetY: 2 }
		});
		shield.anchor = 'center';
		icons.push(shield);

		// Crown - gold with dark stroke
		const crown = new SvgVisual(`${SVG_CDN}/crown.svg`, 32, {
			fill: '#f59e0b',
			stroke: '#78350f',
			strokeWidth: 2,
			shadow: { blur: 3, offsetY: 2 }
		});
		crown.anchor = 'center';
		icons.push(crown);

		// Castle - gray with dark stroke
		const castle = new SvgVisual(`${SVG_CDN}/castle.svg`, 36, {
			fill: '#6b7280',
			stroke: '#1f2937',
			strokeWidth: 2,
			shadow: { blur: 3, offsetY: 2 }
		});
		castle.anchor = 'center';
		icons.push(castle);

		// Chest - brown with dark stroke
		const chest = new SvgVisual(`${SVG_CDN}/locked-chest.svg`, 32, {
			fill: '#92400e',
			stroke: '#451a03',
			strokeWidth: 2,
			shadow: { blur: 3, offsetY: 2 }
		});
		chest.anchor = 'center';
		icons.push(chest);

		// Diamond - cyan with dark stroke
		const diamond = new SvgVisual(`${SVG_CDN}/cut-diamond.svg`, 28, {
			fill: '#06b6d4',
			stroke: '#164e63',
			strokeWidth: 2,
			shadow: { blur: 4, offsetY: 2, color: 'rgba(6,182,212,0.4)' }
		});
		diamond.anchor = 'center';
		icons.push(diamond);

		return icons;
	}

	function createFallbackVisual(): ImageVisual {
		const size = 32;
		const cnv = document.createElement('canvas');
		cnv.width = size;
		cnv.height = size;
		const ctx = cnv.getContext('2d')!;
		ctx.clearRect(0, 0, size, size);
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
		const visual = new ImageVisual(url, size);
		visual.anchor = 'center';
		return visual;
	}

	function applyMarkerCount(n: number): void {
		if (!map) return;
		const count = clampMarkerCount(n);
		markerCount = count;
		map?.content?.clearMarkers?.();

		const fallback = createFallbackVisual();
		const allVisuals = [
			...(iconVisuals || []),
			...(svgVisuals || [])
		];

		for (let i = 0; i < markerCount; i++) {
			const x = rand(0, MAP_TILES.mapSize.width);
			const y = rand(0, MAP_TILES.mapSize.height);
			const visual = allVisuals.length > 0 ? allVisuals[i % allVisuals.length] : fallback;
			map.content.addMarker(x, y, { visual, data: { id: i } });
		}
		// Always re-add text labels after marker count change
		addTextLabels();
	}

	function setMarkerCount(n: number): void {
		applyMarkerCount(n);
	}

	function addVectors(): void {
		if (!map) return;
		map.content.addVector({
			type: 'polyline',
			points: [
				{ x: 1000, y: 1000 },
				{ x: 2000, y: 1400 },
				{ x: 3000, y: 1200 }
			],
			style: { color: '#1e90ff', weight: 2, opacity: 0.9 }
		});
		map.content.addVector({
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
		map.content.addVector({
			type: 'circle',
			center: { x: HOME.lng, y: HOME.lat },
			radius: 10,
			style: {
				color: '#f59e0b',
				weight: 2,
				opacity: 0.9,
				fill: true,
				fillColor: '#f59e0b',
				fillOpacity: 0.5
			}
		});
	}

	function clearVectors(): void {
		map?.content?.clearVectors?.();
	}

	function addTextLabels(): void {
		if (!map) return;

		const PAD = 100; // padding from edges

		// Top-left: Small monospace terminal style
		const label1 = new TextVisual('> TERMINAL_OUTPUT', {
			fontSize: 10,
			fontFamily: 'monospace',
			color: '#22c55e',
			backgroundColor: '#0a0a0a',
			padding: 6,
		});
		label1.anchor = 'top-left';
		label1.iconScaleFunction = null; // Don't scale with zoom
		map.content.addMarker(PAD, PAD, { visual: label1 });

		// Top-right: Large bold header
		const label2 = new TextVisual('HEADER', {
			fontSize: 28,
			color: '#1e3a5f',
			backgroundColor: '#e0f2fe',
			padding: 12,
		});
		label2.anchor = 'top-right';
		label2.iconScaleFunction = null; // Don't scale with zoom
		map.content.addMarker(MAP_TILES.mapSize.width - PAD, PAD, { visual: label2 });

		// Bottom-left: Medium serif style
		const label3 = new TextVisual('Serif Text', {
			fontSize: 18,
			fontFamily: 'Georgia, serif',
			color: '#7c2d12',
			backgroundColor: '#fef3c7',
			padding: 10,
		});
		label3.anchor = 'bottom-left';
		label3.iconScaleFunction = null; // Don't scale with zoom
		map.content.addMarker(PAD, MAP_TILES.mapSize.height - PAD, { visual: label3 });

		// Bottom-right: Tiny tag
		const label4 = new TextVisual('TAG', {
			fontSize: 8,
			color: '#ffffff',
			backgroundColor: '#dc2626',
			padding: 3,
		});
		label4.anchor = 'bottom-right';
		label4.iconScaleFunction = null; // Don't scale with zoom
		map.content.addMarker(MAP_TILES.mapSize.width - PAD, MAP_TILES.mapSize.height - PAD, { visual: label4 });

		// Center: Large plain text with black stroke (no background)
		const label5 = new TextVisual('Plain Large Text', {
			fontSize: 32,
			color: '#ffffff',
			strokeColor: '#000000',
			strokeWidth: 2,
		});
		label5.anchor = 'center';
		label5.iconScaleFunction = null; // Don't scale with zoom
		map.content.addMarker(HOME.lng, HOME.lat, { visual: label5 });
	}

	function setMarkersEnabled(on: boolean): void {
		if (on) applyMarkerCount(markerCount);
		else map?.content?.clearMarkers?.();
	}

	function setVectorsEnabled(on: boolean): void {
		if (on) addVectors();
		else clearVectors();
	}

	onMount(() => {
		if (!container) return;

		map = new GTMap(container, {
			center: { x: HOME.lng, y: HOME.lat },
			zoom: 2,
			minZoom: 0,
			maxZoom: 5,
			fpsCap: 60,
			autoResize: true,
			tiles: MAP_TILES,
			wrapX: false,
			clipToBounds: true,
			debug: true,
		});

		// Create ImageVisual instances from icon definitions
		for (const key in typedIconDefs) {
			const def = typedIconDefs[key];
			iconVisuals = iconVisuals || [];
			const visual = new ImageVisual(def.iconPath, { width: def.width, height: def.height }, def.x2IconPath);
			visual.anchor = 'center';
			iconVisuals.push(visual);
		}

		// Create SvgVisual instances
		svgVisuals = createSvgVisuals();

		applyMarkerCount(markerCount);

		map.view.setIconScaleFunction((zoom) => {
			const maxScale = 1;
			const scale = Math.pow(2, zoom - 3);
			return Math.min(maxScale, Math.max(0.5, scale));
		});

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
		mapSize={MAP_TILES.mapSize}
		home={HOME}
		{markerCount}
		{setMarkerCount}
		{setMarkersEnabled}
		{setVectorsEnabled}
	/>
	<Hover {map} />
</div>

<style>
	.map {
		position: relative;
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
		width: 100%;
		height: calc(100vh - 32px);
		background: #0a0c10;
	}
</style>
