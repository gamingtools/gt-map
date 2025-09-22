<script lang="ts">
  import { onMount } from 'svelte';
  import { GTMap, type IconHandle } from '@gtmap';

  let container: HTMLDivElement | null = null;
  let map: GTMap<RemoteMarker>;

	const MAP_IMAGE = { url: 'https://gtcdn.info/dune/tiles/hb_8k.webp', width: 8192, height: 8192 };
  const HOME = { x: MAP_IMAGE.width / 2, y: MAP_IMAGE.height / 2 };

  // Remote dataset (gzip) for real markers
  interface RemoteIcon { iconPath: string; x2IconPath?: string; width?: number; height?: number }
  interface RemoteLocation { x: number; y: number }
  interface RemoteMarker { id?: string; mapId?: string; mapIcon?: RemoteIcon; location?: RemoteLocation }

  const DATA_URL = 'https://data.gtcdn.info/dev/dune/1.2.0.0/data/en/mapMarkers.json.gz';
  const ICON_PREFIX = 'https://gtcdn.info/dune/1.2.0.0/images';

  // Authoritative world extents for Hagga Basin (survival_1)
  const HAGGA_EXTENTS = { minX: -457200, minY: -457200, maxX: 355600, maxY: 355600 };
  // Coordinate transform will be handled by map.translate() after setCoordBounds()

  // Cache icon handles per iconPath so identical icons reuse atlas entries
  const iconCache = new Map<string, IconHandle>();
  function ensureIcon(ico?: RemoteIcon): IconHandle | null {
    if (!map || !ico || !ico.iconPath) return null;
    const key = ico.iconPath;
    let h = iconCache.get(key);
    if (h) return h;
    const full1x = ICON_PREFIX + (ico.iconPath.startsWith('/') ? '' : '/') + ico.iconPath;
    const full2x = ico.x2IconPath ? ICON_PREFIX + (ico.x2IconPath.startsWith('/') ? '' : '/') + ico.x2IconPath : undefined;
    const w = Math.max(1, Math.floor(ico.width ?? 24));
    const hgt = Math.max(1, Math.floor(ico.height ?? w));
    h = map.addIcon({ iconPath: full1x, x2IconPath: full2x, width: w, height: hgt, anchorX: Math.round(w / 2), anchorY: Math.round(hgt / 2) });
    iconCache.set(key, h);
    return h;
  }

  // Minimal: fetch, project, and add markers with icons
  async function loadRemoteMarkers(): Promise<void> {
    if (!map) return;
    const res = await fetch(DATA_URL);
    const data = (await res.json()) as RemoteMarker[];
    for (let i = 0; i < data.length; i++) {
      const m = data[i];
      if (m.mapId !== 'survival_1' || !m.location || !m.mapIcon) continue;
      const ih = ensureIcon(m.mapIcon);
      if (!ih) continue; // only render icons from the source
      const p = map.translate(m.location.x, m.location.y);
      map.addMarker(p.x, p.y, { icon: ih, data: m });
    }
  }

  onMount(() => {
    if (!container) return;
    map = new GTMap(container, {
      image: MAP_IMAGE,
      wrapX: false,
      minZoom: 0,
      maxZoom: 10,
      center: HOME,
      zoom: 2,
      autoResize: true,
      spinner: { size: 64, color: '#c2c2c2' },
    });
    // Initialize coord transformer (Unreal/world → pixel)
    map.setCoordBounds(HAGGA_EXTENTS);
    // Log the original marker record when an icon is clicked
    map.events.on('markerclick').each((e) => {
      // e.marker.data is the original RemoteMarker
      console.log('marker click:', e.marker.data);
    });
    // Load remote markers/icons only
    void loadRemoteMarkers();
    return () => { map?.destroy?.(); };
  });
</script>

<div bind:this={container} class="map"></div>

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
