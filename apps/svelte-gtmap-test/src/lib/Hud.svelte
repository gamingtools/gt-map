<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

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

  let offFrame: (() => void) | null = null;
  let offPointer: (() => void) | null = null;
  onMount(() => {
    if (!map) return;
    offFrame = map.events.on('frame').each((e: any) => {
      refresh(true, e?.now);
    });
    offPointer = map.events.on('pointermove').each(() => {
      refresh(false);
    });
  });
  onDestroy(() => {
    try { offFrame?.(); } catch {}
    try { offPointer?.(); } catch {}
  });
</script>

<div class="hud">
  <div><strong>Center:</strong> lng {center.lng.toFixed(2)}, lat {center.lat.toFixed(2)}</div>
  <div><strong>Zoom:</strong> {zoom.toFixed(2)}</div>
  <div><strong>FPS:</strong> {Math.round(fps)}</div>
  <div><strong>Mouse:</strong> {mouse ? `x ${mouse.x}, y ${mouse.y}` : '—'}</div>
  <div class="sep"></div>
  <div><strong>Settings:</strong></div>
  <div>• Zoom speed: {wheelSpeed.toFixed(2)}</div>
  <div>• Ctrl zoom speed: {wheelCtrlSpeed.toFixed(2)}</div>
  <div>• FPS cap: {fpsCap}</div>
  <div>• freePan: {freePan ? 'on' : 'off'}; wrapX: {wrapX ? 'on' : 'off'}</div>
</div>

<style>
  .hud {
    position: absolute;
    left: 8px;
    top: 8px;
    background: rgba(255, 255, 255, 0.85);
    color: #222;
    padding: 6px 8px;
    border-radius: 4px;
    font: 12px/1.3 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif;
    z-index: 10;
    min-width: 220px;
  }
  .hud .sep { height: 6px; }
</style>

