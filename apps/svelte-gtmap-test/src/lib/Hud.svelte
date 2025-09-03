<script lang="ts">
  // Using runes + $effect to (re)subscribe when map changes
  import Center from './hud/Center.svelte';
  import Zoom from './hud/Zoom.svelte';
  import Fps from './hud/Fps.svelte';
  import Mouse from './hud/Mouse.svelte';
  import Settings from './hud/Settings.svelte';

  type MapLike = {
    getCenter: () => [number, number];
    getZoom: () => number;
    pointerAbs: { x: number; y: number } | null;
    events: { on: (name: string) => { each: (fn: (e: any) => () => void | void) => () => void } };
  };

  const { map, fpsCap = 60, wheelSpeed = 1.0, wheelCtrlSpeed = 0.4, freePan = false, wrapX = false } = $props<{
    map: MapLike;
    fpsCap?: number;
    wheelSpeed?: number;
    wheelCtrlSpeed?: number;
    freePan?: boolean;
    wrapX?: boolean;
  }>();

  let fps = $state(0);
  let center = $state<{ lng: number; lat: number }>({ lng: 0, lat: 0 });
  let zoom = $state(0);
  let mouse: { x: number; y: number } | null = $state(null);
  let _prev = 0;

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
    // Kick an initial refresh so values show immediately
    refresh(false);
    return () => {
      try { offFrame?.(); } catch {}
      try { offPointer?.(); } catch {}
    };
  });
</script>

<div class="absolute left-2 top-2 z-10 min-w-72 rounded-md border border-gray-200/60 bg-white/80 backdrop-blur px-3 py-2 text-xs text-gray-800 shadow pointer-events-none select-none">
  <div class="grid grid-cols-2 gap-x-6 gap-y-1">
    <Center {center} />
    <Zoom {zoom} />
    <Fps {fps} />
    <Mouse {mouse} />
  </div>
  <div class="my-2 h-px bg-gray-200"></div>
  <Settings {wheelSpeed} {wheelCtrlSpeed} {fpsCap} {freePan} {wrapX} />
</div>
