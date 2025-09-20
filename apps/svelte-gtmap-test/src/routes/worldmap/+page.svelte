<script lang="ts">
  import { onMount } from 'svelte';
  import { GTMap, type IconDef, type IconHandle, type Marker as GTMarker } from '@gtmap';
  import Hud from '$lib/Hud.svelte';
  import iconDefs from '$lib/sample-data/MapIcons.json';
  const typedIconDefs: Record<string, IconDef> = iconDefs;

  let container: HTMLDivElement | null = null;
  let map: GTMap<{ id: string; camp?: boolean }>;

  const MAP_IMAGE = { url: 'https://gtcdn.info/dune/tiles/hb_8k.webp', width: 8192, height: 8192 };
  const HOME = { x: MAP_IMAGE.width / 2, y: MAP_IMAGE.height / 2 };

  type MarkerRec = { m: GTMarker<{ id: string; camp?: boolean }>; camp: boolean };
  let markers: MarkerRec[] = [];
  let iconHandles: IconHandle[] = [];

  let markerCount = 800;

  function clampMarkerCount(n: number): number { return Math.max(0, Math.min(999_999, Math.floor(Number.isFinite(n) ? n : 0))); }
  function rand(min: number, max: number): number { return Math.random() * (max - min) + min; }

  function pickIconHandle(i: number): IconHandle | null {
    if (iconHandles.length === 0) return null;
    return iconHandles[i % iconHandles.length] ?? null;
  }

  // Removed zoom-based show/hide logic: markers remain present at all zoom levels

  function clearMarkers(): void {
    try { map?.clearMarkers(); } finally { markers = []; }
  }

  function applyMarkerCount(n: number): void {
    if (!map) return;
    markerCount = clampMarkerCount(n);
    clearMarkers();
    for (let i = 0; i < markerCount; i++) {
      const x = rand(0, MAP_IMAGE.width);
      const y = rand(0, MAP_IMAGE.height);
      const ih = pickIconHandle(i);
      const isCamp = Boolean(ih && iconHandlesMeta.get(ih.id)?.isCamp);
      const m = map.addMarker(x, y, ih ? { icon: ih, data: { id: `poi-${i}`, camp: isCamp } } : { data: { id: `poi-${i}`, camp: isCamp } });
      markers.push({ m, camp: isCamp });
      // Hover events: could drive a tooltip; demo logs to console
      m.events.on('pointerenter').each((e) => { /* placeholder for tooltip show */ void e; });
      m.events.on('pointerleave').each((e) => { /* placeholder for tooltip hide */ void e; });
    }
    // No zoom-based toggling — markers remain visible
  }

  function setMarkerCount(n: number): void { applyMarkerCount(n); }

  function panToAll(): void {
    if (!map || markers.length === 0) return;
    let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = 0, maxY = 0;
    for (const rec of markers) { const { x, y } = rec.m; if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; }
    void map.transition().bounds({ minX, minY, maxX, maxY }, { top: 24, right: 24, bottom: 24, left: 24 }).apply({ animate: { durationMs: 400 } });
  }

  function panToRandomCluster(): void {
    if (!map || markers.length === 0) return;
    const cx = rand(1000, 7000), cy = rand(1000, 7000), r = 600;
    void map.transition().bounds({ minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r }, { top: 24, right: 24, bottom: 24, left: 24 }).apply({ animate: { durationMs: 350 } });
  }

  // Track icon meta by handle id for quick camp detection
  const iconHandlesMeta = new Map<string, { isCamp: boolean }>();

  // Remote dataset (gzip) for real markers
  interface RemoteIcon { iconPath: string; x2IconPath?: string; width?: number; height?: number }
  interface RemoteLocation { x: number; y: number }
  interface RemoteMarker { id?: string; mapId?: string; mapIcon?: RemoteIcon; location?: RemoteLocation }

  const DATA_URL = 'https://data.gtcdn.info/dev/dune/1.2.0.0/data/en/mapMarkers.json.gz';
  const ICON_PREFIX = 'https://gtcdn.info/dune/1.2.0.0/images';

  async function loadRemoteMarkers(): Promise<void> {
    if (!map) return;
    try {
      const dataRes = await fetch(DATA_URL);
      const data = await dataRes.json() as RemoteMarker[];
      // Build icon cache map by path
      const iconCache = new Map<string, IconHandle>();
      const ensureIcon = (ico?: RemoteIcon): IconHandle | null => {
        if (!ico || !ico.iconPath) return null;
        const key = ico.iconPath;
        const full1x = ICON_PREFIX + (ico.iconPath.startsWith('/') ? '' : '/') + ico.iconPath;
        const full2x = ico.x2IconPath ? ICON_PREFIX + (ico.x2IconPath.startsWith('/') ? '' : '/') + ico.x2IconPath : undefined;
        let h = iconCache.get(key);
        if (h) return h;
        const w = Math.max(1, Math.floor(ico.width ?? 24));
        const hgt = Math.max(1, Math.floor(ico.height ?? w));
        h = map.addIcon({ iconPath: full1x, x2IconPath: full2x, width: w, height: hgt, anchorX: Math.round(w/2), anchorY: Math.round(hgt/2) });
        iconCache.set(key, h);
        return h;
      };

      // Create markers for survival_1
      const subset = data.filter((m) => (m?.mapId === 'survival_1') && m.location && m.mapIcon);
      // Use authoritative world extents for survival_1 (Hagga Basin) to align with the raster
      // From mapInfo.json: min = (-457200, -457200), max = (355600, 355600)
      let minX = -457200, minY = -457200, maxX = 355600, maxY = 355600;
      // Fallback to data extents if needed (in case of mismatch or alternate maps)
      if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
        minX = Number.POSITIVE_INFINITY; minY = Number.POSITIVE_INFINITY; maxX = Number.NEGATIVE_INFINITY; maxY = Number.NEGATIVE_INFINITY;
        for (const m of subset) {
          const x = m.location!.x; const y = m.location!.y;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      const widthW = Math.max(1, maxX - minX);
      const heightW = Math.max(1, maxY - minY);
      const PIX = MAP_IMAGE.width;
      const k = Math.min(PIX / widthW, PIX / heightW);
      const offsetX = (PIX - widthW * k) / 2;
      const offsetY = (PIX - heightW * k) / 2;
      // Toggle vertical orientation: set to true to flip (world up -> pixels down), false to keep as-is
      const FLIP_Y = false;
      const toPixel = (wx: number, wy: number) => ({
        x: offsetX + (wx - minX) * k,
        y: offsetY + (FLIP_Y ? (maxY - wy) * k : (wy - minY) * k),
      });
      // Clear existing synthetic markers first
      clearMarkers();
      markers = [];
      for (let i = 0; i < subset.length; i++) {
        const m = subset[i];
        const ih = ensureIcon(m.mapIcon || undefined);
        const isCamp = Boolean(m.mapIcon?.iconPath?.endsWith('camp.webp'));
        const p = toPixel(m.location!.x, m.location!.y);
        const marker = map.addMarker(p.x, p.y, ih ? { icon: ih, data: { id: m.id ?? `poi-${i}`, camp: isCamp } } : { data: { id: m.id ?? `poi-${i}`, camp: isCamp } });
        markers.push({ m: marker, camp: isCamp });
      }
      // No zoom-based toggling — markers remain visible
    } catch (err) {
      console.error('Failed to load remote markers', err);
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
    });

    // Marker resize function (icon scaling) like the Map demo
    map.setIconScaleFunction((zoom, _minZoom, _maxZoom) => {
      const maxScale = 1;
      const scale = Math.pow(2, zoom - 3);
      return Math.min(maxScale, Math.max(0.5, scale));
    });

    // Register a small set of icons
    try {
      let i = 0;
      for (const key in typedIconDefs) {
        if (i++ > 24) break;
        const def = typedIconDefs[key];
        const ih = map.addIcon({ iconPath: def.iconPath, x2IconPath: def.x2IconPath, width: def.width, height: def.height, anchorX: Math.round(def.width/2), anchorY: Math.round(def.height/2) });
        iconHandles.push(ih);
        iconHandlesMeta.set(ih.id, { isCamp: def.iconPath.endsWith('camp.webp') });
      }
    } catch {}

    // Generate a small synthetic set first, then load remote markers
    applyMarkerCount(markerCount);
    void loadRemoteMarkers();

    return () => { map?.destroy?.(); };
  });
</script>

<div class="page">

  <div bind:this={container} class="map">
    <Hud {map} fpsCap={60} wheelSpeed={1.0} home={{ lng: HOME.x, lat: HOME.y }} markerCount={markerCount} setMarkerCount={setMarkerCount} setMarkersEnabled={(on: boolean) => on ? applyMarkerCount(markerCount) : clearMarkers()} setVectorsEnabled={() => {}} />
  </div>
</div>

<style>
  .map { 		position: relative;
		/* Dark neutral to match app background */
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
		width: 100%;
		height: calc(100vh - 32px); }
  /* Hud component handles its own styles */
</style>
