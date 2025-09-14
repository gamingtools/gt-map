<script lang="ts">
  import { onMount } from 'svelte';
  import { GTMap, leafletCompat, type IconHandle, type IconDef } from '@gtmap';
  import iconDefs from '$lib/sample-data/MapIcons.json';
  const typedIconDefs: Record<string, IconDef> = iconDefs;

  let container: HTMLDivElement | null = null;
  let map: GTMap;
  let Lx: ReturnType<typeof leafletCompat>;

  const HOME = { x: 4096, y: 4096 };

  let markerCount = 500;
  let iconHandles: IconHandle[] | null = null;
  let fallbackIcon: IconHandle | null = null;

  // HUD state (compat-only)
  let hudZoom = 0;
  let hudCenter = { lat: 0, lng: 0 };
  let hudPointer: { x: number; y: number } | null = null;
  let hudFps: number | null = null;

  function clampMarkerCount(n: number): number {
    if (!Number.isFinite(n)) return 0;
    n = Math.max(0, Math.min(999_999, Math.floor(n)));
    return n;
  }

  function rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  function createFallbackIcon(): IconHandle | null {
    try {
      const size = 24;
      const cnv = document.createElement('canvas');
      cnv.width = size; cnv.height = size;
      const ctx = cnv.getContext('2d');
      if (!ctx) return null;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(size/2, size/2, size*0.45, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#111827'; ctx.lineWidth = 1.5; ctx.stroke();
      const url = cnv.toDataURL('image/png');
      return Lx.icon({ iconUrl: url, iconSize: [size, size], iconAnchor: [size/2, size/2] });
    } catch { return null; }
  }

  function clearMarkers(): void {
    try { Lx.clearMarkers(); } catch {}
  }
  function clearVectors(): void {
    try { Lx.clearVectors(); } catch {}
  }

  function applyMarkerCount(n: number): void {
    if (!Lx) return;
    const count = clampMarkerCount(n);
    markerCount = count;
    clearMarkers();
    for (let i = 0; i < markerCount; i++) {
      const x = rand(0, 8192);
      const y = rand(0, 8192);
      const iconHandle = iconHandles && iconHandles.length > 0 ? iconHandles[i % iconHandles.length] : (fallbackIcon ?? null);
      const m = Lx.addMarker([-y, x], iconHandle ? { icon: iconHandle } : undefined);
      // Optional: attach a click handler via compat API
      m.on('click', () => {/* no-op in demo */});
    }
  }

  function setMarkerCount(n: number): void { applyMarkerCount(n); }

  function addVectors(): void {
    if (!Lx) return;
    try {
      // Polyline
      Lx.addPolyline([ [ -1000, 1000 ], [ -1400, 2000 ], [ -1200, 3000 ] ], { color: '#1e90ff', weight: 2, opacity: 0.9 });
      // Polygon
      Lx.addPolygon([ [ -2600, 2600 ], [ -3000, 3000 ], [ -2600, 3200 ], [ -2300, 3000 ] ], {
        color: '#10b981', weight: 2, opacity: 0.9, fill: true, fillColor: '#10b981', fillOpacity: 0.25
      });
      // Circle
      Lx.addCircle([ -4096, 4096 ], 200, { color: '#f59e0b', weight: 2, opacity: 0.9, fill: true, fillColor: '#f59e0b', fillOpacity: 0.2 });
    } catch {}
  }

  function setMarkersEnabled(on: boolean): void { if (on) applyMarkerCount(markerCount); else clearMarkers(); }
  function setVectorsEnabled(on: boolean): void { if (on) addVectors(); else clearVectors(); }

  function goHome() { if (Lx) void Lx.setView([-HOME.y, HOME.x], 2); }
  function fitSample() { if (Lx) void Lx.fitBounds([ [ -3500, 3500 ], [ -4700, 4700 ] ], { padding: 24, animate: true, maxZoom: 3.25 }); }

  onMount(() => {
    if (!container) return;
    map = new GTMap(container, {
      tileSource: {
        url: 'https://gtcdn.info/dune/tiles/hb_8k/{z}/{x}_{y}.webp',
        tileSize: 256,
        mapSize: { width: 8192, height: 8192 },
        wrapX: false,
        sourceMinZoom: 0,
        sourceMaxZoom: 5,
      },
      minZoom: 0,
      maxZoom: 5,
      center: HOME,
      zoom: 2,
      autoResize: true,
    });

    Lx = leafletCompat(map);

    // Register a handful of sample icons via compat API
    try {
      iconHandles = [];
      let i = 0;
      for (const key in typedIconDefs) {
        if (i++ > 16) break; // keep it light
        const def = typedIconDefs[key];
        iconHandles.push(Lx.icon({ iconUrl: def.iconPath, iconRetinaUrl: def.x2IconPath, iconSize: [def.width, def.height], iconAnchor: [Math.round(def.width/2), Math.round(def.height/2)] }));
      }
    } catch {}
    fallbackIcon = createFallbackIcon();

    // Seed content
    applyMarkerCount(markerCount);
    addVectors();

    // HUD subscriptions via compat-only API
    try {
      hudZoom = Lx.getZoom();
      hudCenter = Lx.getCenter();
    } catch {}
    const offMove = Lx.on('move', ({ view }) => {
      hudZoom = view.zoom;
      hudCenter = { lat: -view.center.y, lng: view.center.x };
    });
    const offZoom = Lx.on('zoom', ({ view }) => {
      hudZoom = view.zoom;
      hudCenter = { lat: -view.center.y, lng: view.center.x };
    });
    const offPointer = Lx.on('pointermove', (e) => {
      hudPointer = e.world ? { x: Math.round(e.world.x), y: Math.round(e.world.y) } : null;
    });
    const offFrame = Lx.on('frame', (e) => {
      if (e.stats?.fps) hudFps = Math.round(e.stats.fps);
    });

    // Basic click log via compat
    Lx.on('click', ({ x, y, world }) => {
      console.log('map click (compat):', x, y, world);
    });

    return () => { try { offMove(); offZoom(); offPointer(); offFrame(); } catch {} map?.destroy?.(); };
  });
</script>

<div class="page">
  <div class="toolbar">
    <button class="btn" onclick={goHome}>Home</button>
    <button class="btn" onclick={fitSample}>Fit sample</button>
    <div class="spacer" />
    <label class="lbl">Markers:</label>
    <input type="number" min="0" max="20000" value={markerCount} oninput={(e) => setMarkerCount(Number((e.target as HTMLInputElement).value))} class="num" />
    <button class="btn" onclick={() => setMarkersEnabled(true)}>Enable</button>
    <button class="btn" onclick={() => setMarkersEnabled(false)}>Clear</button>
    <div class="sep" />
    <label class="lbl">Vectors:</label>
    <button class="btn" onclick={() => setVectorsEnabled(true)}>Add</button>
    <button class="btn" onclick={() => setVectorsEnabled(false)}>Clear</button>
    <div class="hint">Leaflet compat demo — using leafletCompat only</div>
  </div>
  <div bind:this={container} class="map" />

  <div class="hud">
    <div>Zoom: {hudZoom.toFixed(2)}</div>
    <div>Center: {hudCenter.lat.toFixed(1)}, {hudCenter.lng.toFixed(1)}</div>
    <div>Pointer: {hudPointer ? `${hudPointer.x}, ${hudPointer.y}` : '—'}</div>
    <div>Markers: {markerCount}</div>
    <div>Vectors: 3</div>
    <div>FPS: {hudFps ?? '—'}</div>
  </div>
</div>

<style>
  .page { display: grid; grid-template-rows: auto 1fr; height: calc(100vh - 32px); }
  .toolbar { display: flex; gap: 8px; align-items: center; padding: 8px 12px; background: rgba(24, 24, 27, 0.9); border-bottom: 1px solid #3f3f46; }
  .btn { background: #27272a; border: 1px solid #3f3f46; color: #e5e7eb; padding: 6px 10px; border-radius: 6px; font: 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif; cursor: pointer; }
  .btn:hover { background: #323238; border-color: #52525b; }
  .lbl { font-size: 12px; color: #d4d4d8; }
  .num { width: 88px; background: #111827; border: 1px solid #374151; color: #e5e7eb; padding: 4px 6px; border-radius: 6px; }
  .spacer { flex: 1; }
  .sep { width: 1px; height: 18px; background: #3f3f46; margin: 0 6px; }
  .hint { margin-left: 8px; font-size: 12px; color: #a3a3a3; }
  .map { position: relative; user-select: none; -webkit-user-select: none; touch-action: none; width: 100%; height: 100%; }
  .hud { position: absolute; right: 10px; top: 50px; background: rgba(17,17,17,0.75); color: #e5e7eb; padding: 8px 10px; border-radius: 8px; border: 1px solid #3f3f46; font: 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif; display: grid; gap: 4px; }
</style>
