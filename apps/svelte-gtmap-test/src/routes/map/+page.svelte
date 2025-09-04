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
	let gridLayer: any | null = null;
	let leafletMarkers: Array<any> = [];
	let markerGroup: any | null = null;
  let vectorLayers: Array<any> = [];

	const HOME = { lng: 4096, lat: 4096 };

	let markerCount = 1000;

	function clampMarkerCount(n: number): number {
		if (!Number.isFinite(n)) return 0;
		n = Math.max(0, Math.min(999_999, Math.floor(n)));
		return n;
	}

	function rand(min: number, max: number): number {
		return Math.random() * (max - min) + min;
	}

	function applyMarkerCount(n: number): void {
		if (!map) return;
		const count = clampMarkerCount(n);
		markerCount = count;
		const keys = Object.keys(typedIconDefs);
		if (keys.length === 0) {
			clearLeafletMarkers();
			return;
		}
		clearLeafletMarkers();
		// Create an empty group and add it first so per-batch addLayer goes to map
		markerGroup = (L as any).layerGroup();
		markerGroup.addTo(map);
		const iconCache: Record<string, any> = {};
		const CREATE_BATCH = 10000;
		let i = 0;
		const step = () => {
			const end = Math.min(count, i + CREATE_BATCH);
			for (; i < end; i++) {
				const key = keys[(Math.random() * keys.length) | 0];
				const def = typedIconDefs[key];
				const icon =
					iconCache[key] ||
					(iconCache[key] = L.icon({
						iconUrl: def.iconPath,
						iconRetinaUrl: def.x2IconPath,
						iconSize: [def.width, def.height]
					}));
				const m = L.marker([rand(0, 8192), rand(0, 8192)], { icon });
				m.on('click', (ev: any) => {
					console.log('marker click', ev);
				});
				markerGroup.addLayer(m);
				leafletMarkers.push(m);
			}
			if (i < count) {
				requestAnimationFrame(step);
			}
		};
		step();
	}

	function setMarkerCount(n: number): void {
		applyMarkerCount(n);
	}

	function clearLeafletMarkers(): void {
		try {
			if (markerGroup) {
				try {
					markerGroup.remove?.();
				} catch {}
				markerGroup = null;
			}
			if (leafletMarkers && leafletMarkers.length) {
				for (const m of leafletMarkers) {
					try {
						m.remove?.();
					} catch {}
				}
			}
		} finally {
			leafletMarkers = [];
		}
	}

	onMount(() => {
		if (!container) return;
		const HAGGA = {
			url: 'https://gtcdn.info/dune/tiles/hb_8k/{z}/{x}_{y}.webp',
			minZoom: 0,
			maxZoom: 5,
			wrapX: false
		};
		// Full image bounds (pixel CRS): 0..8192 for 8k base (256 * 2^5)
		const BOUNDS: [[number, number], [number, number]] = [
			[0, 0],
			[8192, 8192]
		];
		map = L.map(container, {
			center: HOME,
			zoom: 2,
			minZoom: HAGGA.minZoom,
			maxZoom: 10,
			fpsCap: 60
			//   maxBounds: BOUNDS,
			//   maxBoundsViscosity: 1,
			//   bounceAtZoomLimits: true
		});
		L.tileLayer(HAGGA.url, {
			minZoom: HAGGA.minZoom,
			maxZoom: HAGGA.maxZoom,
			tileSize: 256,
			tms: false,
			wrapX: false
		}).addTo(map!);

		gridLayer = L.grid();

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
		applyMarkerCount(markerCount);
    addVectors();
    try {
      const vLine = L.polyline(
        [
          [1000, 1000],
          [2000, 1400],
          [3000, 1200]
        ],
        { color: '#1e90ff', weight: 2, opacity: 0.9 }
      ).addTo(map as any);
      const vPoly = L.polygon(
        [
          [2600, 2600],
          [3000, 3000],
          [2600, 3200],
          [2300, 3000]
        ],
        { color: '#10b981', weight: 2, opacity: 0.9, fill: true, fillColor: '#10b981', fillOpacity: 0.25 }
      ).addTo(map as any);
      const vRect = L.rectangle(
        [ [1200, 3800], [1800, 4400] ],
        { color: '#ef4444', weight: 2, opacity: 0.9, fill: true, fillColor: '#ef4444', fillOpacity: 0.2 }
      ).addTo(map as any);
      const vCircle = L.circle(
        [4096, 4096],
        { color: '#f59e0b', weight: 2, opacity: 0.9, fill: true, fillColor: '#f59e0b', fillOpacity: 0.2, radius: 200 }
      ).addTo(map as any);
      // Clean up on destroy
      onDestroy(() => {
        try { (vLine as any)?.remove?.(); } catch {}
        try { (vPoly as any)?.remove?.(); } catch {}
        try { (vRect as any)?.remove?.(); } catch {}
        try { (vCircle as any)?.remove?.(); } catch {}
      });
    } catch {}

		// Teardown on navigation/unmount per Svelte docs
		onDestroy(() => {
			console.log('GTMap Svelte unmounting');
			try {
				gridLayer?.remove?.();
			} catch {}
			try {
				clearLeafletMarkers();
			} catch {}
			try { clearVectors(); } catch {}
			try {
				map?.remove?.();
			} catch {}
			if (resizeTimer) {
				try {
					clearTimeout(resizeTimer);
				} catch {}
				resizeTimer = null;
			}
			try {
				ro?.disconnect?.();
			} catch {}
			if (usedWindowResize) {
				try {
					window.removeEventListener('resize', scheduleInvalidate);
				} catch {}
			}
			console.log('GTMap Svelte unmounted');
		});
	});
</script>

<div bind:this={container} class="map">
	<Hud {map} fpsCap={60} wheelSpeed={1.0} home={HOME} {markerCount} {setMarkerCount} setMarkersEnabled={setMarkersEnabled} setVectorsEnabled={setVectorsEnabled} />
  {#if map}
    <ZoomControl {map} position="top-right" step={1} />
    <AttributionControl {map} position="bottom-right" text="Hagga Basin tiles © respective owners (game map)" />
  {/if}
</div>

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
