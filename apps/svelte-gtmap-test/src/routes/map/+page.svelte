<script lang="ts">
	import { onMount } from 'svelte';
	import { GTMap, ImageVisual, TextVisual, type IconDef } from '@gtmap';
	import iconDefs from '$lib/sample-data/MapIcons.json';
	const typedIconDefs: Record<string, IconDef> = iconDefs;
	import Hud from '$lib/Hud.svelte';

	let container: HTMLDivElement | null = null;
	let map: GTMap;

	const MAP_IMAGE = { url: 'https://gtcdn.info/dune/tiles/hb_8k.webp', width: 8192, height: 8192 };
	const PREVIEW_IMAGE = { url: 'https://gtcdn.info/dune/tiles/hb_1k.webp', width: 1024, height: 1024 };
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

	let iconVisuals: ImageVisual[] | null = null;

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
		map?.clearMarkers?.();

		const fallback = createFallbackVisual();
		for (let i = 0; i < markerCount; i++) {
			const x = rand(0, MAP_IMAGE.width);
			const y = rand(0, MAP_IMAGE.height);
			const visual = iconVisuals && iconVisuals.length > 0 ? iconVisuals[i % iconVisuals.length] : fallback;
			map.addMarker(x, y, { visual, data: { id: i } });
		}
		// Always re-add text labels after marker count change
		addTextLabels();
	}

	function setMarkerCount(n: number): void {
		applyMarkerCount(n);
	}

	function addVectors(): void {
		if (!map) return;
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
		map?.clearVectors?.();
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
		map.addMarker(PAD, PAD, { visual: label1 });

		// Top-right: Large bold header
		const label2 = new TextVisual('HEADER', {
			fontSize: 28,
			color: '#1e3a5f',
			backgroundColor: '#e0f2fe',
			padding: 12,
		});
		label2.anchor = 'top-right';
		label2.iconScaleFunction = null; // Don't scale with zoom
		map.addMarker(MAP_IMAGE.width - PAD, PAD, { visual: label2 });

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
		map.addMarker(PAD, MAP_IMAGE.height - PAD, { visual: label3 });

		// Bottom-right: Tiny tag
		const label4 = new TextVisual('TAG', {
			fontSize: 8,
			color: '#ffffff',
			backgroundColor: '#dc2626',
			padding: 3,
		});
		label4.anchor = 'bottom-right';
		label4.iconScaleFunction = null; // Don't scale with zoom
		map.addMarker(MAP_IMAGE.width - PAD, MAP_IMAGE.height - PAD, { visual: label4 });

		// Center: Large plain text with black stroke (no background)
		const label5 = new TextVisual('Plain Large Text', {
			fontSize: 32,
			color: '#ffffff',
			strokeColor: '#000000',
			strokeWidth: 2,
		});
		label5.anchor = 'center';
		label5.iconScaleFunction = null; // Don't scale with zoom
		map.addMarker(HOME.lng, HOME.lat, { visual: label5 });
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
			center: { x: HOME.lng, y: HOME.lat },
			zoom: 2,
			minZoom: 0,
			maxZoom: 6,
			fpsCap: 60,
			autoResize: true,
			preview: PREVIEW_IMAGE,
			image: MAP_IMAGE,
			wrapX: false,
			spinner: { size: 64, color: '#c2c2c2' },
		});

		// Create ImageVisual instances from icon definitions
		for (const key in typedIconDefs) {
			const def = typedIconDefs[key];
			iconVisuals = iconVisuals || [];
			const visual = new ImageVisual(def.iconPath, { width: def.width, height: def.height }, def.x2IconPath);
			visual.anchor = 'center';
			iconVisuals.push(visual);
		}

		applyMarkerCount(markerCount);

		map.setIconScaleFunction((zoom) => {
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
		home={HOME}
		{markerCount}
		{setMarkerCount}
		{setMarkersEnabled}
		{setVectorsEnabled}
	/>
</div>

<style>
	.map {
		position: relative;
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
		width: 100%;
		height: calc(100vh - 32px);
	}
</style>
