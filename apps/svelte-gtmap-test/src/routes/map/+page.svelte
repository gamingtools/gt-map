<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import GT, { type LeafletMapFacade } from '@gtmap';
	import Hud from '$lib/Hud.svelte';

	let container: HTMLDivElement | null = null;
	let map: LeafletMapFacade;
	let gridLayer: any | null = null;

	const HOME = { lng: 4096, lat: 4096 };

  type IconDef = { iconPath: string; x2IconPath?: string; width: number; height: number };
  let iconDefs: Record<string, IconDef> = {};
  let markerCount = 500;

  function clampMarkerCount(n: number): number {
    if (!Number.isFinite(n)) return 0;
    n = Math.max(0, Math.min(999_999, Math.floor(n)));
    return n;
  }

  function rand(min: number, max: number): number { return Math.random() * (max - min) + min; }

  async function loadIconDefs(): Promise<void> {
    const url = new URL('../../sample-data/MapIcons.json', import.meta.url);
    const defs = (await fetch(url).then((r) => r.json())) as Record<string, IconDef>;
    iconDefs = defs;
    await map!.setIconDefs(defs);
  }

  function applyMarkerCount(n: number): void {
    if (!map) return;
    const count = clampMarkerCount(n);
    markerCount = count;
    const keys = Object.keys(iconDefs);
    if (keys.length === 0) { map.setMarkers([]); return; }
    const markers = new Array(Math.max(0, count)).fill(0).map(() => {
      const key = keys[(Math.random() * keys.length) | 0];
      return { lng: rand(0, 8192), lat: rand(0, 8192), type: key } as { lng: number; lat: number; type: string };
    });
    map.setMarkers(markers);
  }

  function setMarkerCount(n: number): void {
    applyMarkerCount(n);
  }

	onMount(() => {
		if (!container) return;
		const L = GT.L;
		const HAGGA = {
			url: 'https://gtcdn.info/dune/tiles/hb_8k/{z}/{x}_{y}.webp',
			minZoom: 0,
			maxZoom: 5,
			wrapX: false
		};
    // Full image bounds (pixel CRS): 0..8192 for 8k base (256 * 2^5)
    const BOUNDS: [[number, number], [number, number]] = [[0, 0], [8192, 8192]];
    map = L.map(container, {
      center: HOME,
      zoom: 2,
      minZoom: HAGGA.minZoom,
      maxZoom: 10,
      fpsCap: 60,
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

    // Load icon defs and seed initial markers
    loadIconDefs().then(() => applyMarkerCount(markerCount)).catch(() => {});

		// HUD handled by <Hud/> component

		// Grid layer init — add once so remove() can toggle visibility later
		try {
			gridLayer = (L as any).grid();
			// gridLayer.addTo(map);
		} catch {
			gridLayer = null;
		}

		// Resize handling (debounced): wait until user stops resizing
		let resizeTimer: any = null;
		const scheduleInvalidate = () => {
			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(() => {
				try { map?.invalidateSize(); } catch {}
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
		onDestroy(() => {
			console.log('GTMap Svelte unmounting');
			try { gridLayer?.remove?.(); } catch {}
			try { map?.setMarkers([]); } catch {}
			try { map?.remove?.(); } catch {}
			if (resizeTimer) { try { clearTimeout(resizeTimer); } catch {} resizeTimer = null; }
			try { ro?.disconnect?.(); } catch {}
			if (usedWindowResize) { try { window.removeEventListener('resize', scheduleInvalidate); } catch {} }
			console.log('GTMap Svelte unmounted');
		});
	});


</script>


<div bind:this={container} class="map">
  <Hud {map} fpsCap={60} wheelSpeed={1.0} home={HOME}
    markerCount={markerCount} setMarkerCount={setMarkerCount}
  />
 
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
