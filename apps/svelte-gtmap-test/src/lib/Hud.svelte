<script lang="ts">
  // Single status widget: subscribes to map events and shows key values
  type MapLike = {
    getCenter: () => [number, number];
    getZoom: () => number;
    pointerAbs: { x: number; y: number } | null;
    events: { on: (name: string) => { each: (fn: (e: any) => () => void | void) => () => void } };
  };

  const { map, fpsCap = 60, wheelSpeed: wheelSpeedInitial = 1.0, wheelCtrlSpeed = 0.4, freePan = false, wrapX = false, home } = $props<{
    map: MapLike;
    fpsCap?: number;
    wheelSpeed?: number;
    wheelCtrlSpeed?: number;
    freePan?: boolean;
    wrapX?: boolean;
    home: { lng: number; lat: number };
  }>();

  let fps = $state(0);
  let center = $state<{ lng: number; lat: number }>({ lng: 0, lat: 0 });
  let zoom = $state(0);
  let mouse: { x: number; y: number } | null = $state(null);
  let _prev = 0;
  let wheelSpeed = $state(wheelSpeedInitial);
  let gridEnabled = $state(true);

  function refresh(fromFrame = false, now?: number) {
    if (!map) return;
    const cArr = map.getCenter();
    center = { lng: cArr[1], lat: cArr[0] };
    zoom = map.getZoom();
    mouse = map.pointerAbs ? { x: Math.round(map.pointerAbs.x), y: Math.round(map.pointerAbs.y) } : null;
    if (fromFrame) {
      const t = now ?? (performance.now ? performance.now() : Date.now());
      if (!_prev) _prev = t;
      const dt = t - _prev;
      _prev = t;
      const inst = dt > 0 ? 1000 / dt : 0;
      const alpha = 0.2;
      fps = (1 - alpha) * fps + alpha * inst;
    }
  }

  $effect(() => {
    if (!map) return;
    const offFrame = map.events.on('frame').each((e: any) => refresh(true, e?.now));
    const offPointer = map.events.on('pointermove').each(() => refresh(false));
    refresh(false);
    return () => {
      try { offFrame?.(); } catch {}
      try { offPointer?.(); } catch {}
    };
  });

  // Apply controls
  $effect(() => { if (map) (map as any).setWheelSpeed?.(wheelSpeed); });
  $effect(() => { if (map) (map as any).setGridVisible?.(gridEnabled); });

  function recenter() {
    if (!map || !home) return;
    (map as any).setView([home.lat, home.lng], (map as any).getZoom());
  }
</script>

<div class="absolute left-2 top-2 z-10 min-w-72 rounded-md border border-gray-200/60 bg-white/80 backdrop-blur px-3 py-2 text-xs text-gray-800 shadow select-none">
  <!-- Status (non-interactive) -->
  <div class="pointer-events-none grid grid-cols-2 gap-x-6 gap-y-1">
    <div class="flex items-center gap-2"><span class="font-semibold text-gray-700">Center:</span><span class="tabular-nums">lng {center.lng.toFixed(2)}, lat {center.lat.toFixed(2)}</span></div>
    <div class="flex items-center gap-2"><span class="font-semibold text-gray-700">Zoom:</span><span class="tabular-nums">{zoom.toFixed(2)}</span></div>
    <div class="flex items-center gap-2"><span class="font-semibold text-gray-700">FPS:</span><span class="tabular-nums">{Math.round(fps)}</span></div>
    <div class="flex items-center gap-2"><span class="font-semibold text-gray-700">Mouse:</span><span class="tabular-nums">{mouse ? `x ${mouse.x}, y ${mouse.y}` : '—'}</span></div>
  </div>
  <div class="my-2 h-px bg-gray-200"></div>
  <!-- Controls (interactive) -->
  <div class="space-y-2 pointer-events-auto select-auto">
    <button class="rounded border border-gray-300 bg-white/70 px-2 py-1 text-gray-800 hover:bg-white" on:click={recenter}>Recenter</button>
    <div>
      <label class="block text-gray-700">Zoom speed</label>
      <div class="flex items-center gap-2">
        <input class="w-40" type="range" min="0.05" max="2.00" step="0.05" bind:value={wheelSpeed} />
        <span class="tabular-nums w-10 text-right">{wheelSpeed.toFixed(2)}</span>
      </div>
    </div>
    <label class="flex items-center gap-2">
      <input type="checkbox" bind:checked={gridEnabled} />
      <span>Show Grid</span>
    </label>
    <div class="my-2 h-px bg-gray-200"></div>
    <div class="space-y-1">
      <div class="font-semibold text-gray-700">Settings</div>
      <div class="flex items-center justify-between"><span class="text-gray-600">Ctrl zoom speed</span><span class="tabular-nums text-gray-900">{wheelCtrlSpeed.toFixed(2)}</span></div>
      <div class="flex items-center justify-between"><span class="text-gray-600">FPS cap</span><span class="tabular-nums text-gray-900">{fpsCap}</span></div>
      <div class="flex items-center justify-between"><span class="text-gray-600">freePan</span><span class="text-gray-900">{freePan ? 'on' : 'off'}</span></div>
      <div class="flex items-center justify-between"><span class="text-gray-600">wrapX</span><span class="text-gray-900">{wrapX ? 'on' : 'off'}</span></div>
    </div>
  </div>
</div>
