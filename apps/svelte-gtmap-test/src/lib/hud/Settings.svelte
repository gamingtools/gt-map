<script lang="ts">
  const { wheelSpeed, wheelCtrlSpeed, fpsCap, freePan, wrapX } = $props<{
    wheelSpeed: number;
    wheelCtrlSpeed: number;
    fpsCap: number;
    freePan: boolean;
    wrapX: boolean;
  }>();
</script>

<div class="space-y-1">
  <div class="font-semibold text-gray-700">Settings</div>
  <div class="flex items-center justify-between">
    <span class="text-gray-600">Zoom speed</span>
    <span class="tabular-nums text-gray-900">{wheelSpeed.toFixed(2)}</span>
  </div>
  <div class="flex items-center justify-between">
    <span class="text-gray-600">Ctrl zoom speed</span>
    <span class="tabular-nums text-gray-900">{wheelCtrlSpeed.toFixed(2)}</span>
  </div>
  <div class="flex items-center justify-between">
    <span class="text-gray-600">FPS cap</span>
    <span class="tabular-nums text-gray-900">{fpsCap}</span>
  </div>
  <div class="flex items-center justify-between">
    <span class="text-gray-600">freePan</span>
    <span class="text-gray-900">{freePan ? 'on' : 'off'}</span>
  </div>
  <div class="flex items-center justify-between">
    <span class="text-gray-600">wrapX</span>
    <span class="text-gray-900">{wrapX ? 'on' : 'off'}</span>
  </div>
</div>

