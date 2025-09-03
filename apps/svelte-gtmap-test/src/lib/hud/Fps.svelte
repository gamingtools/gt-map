<script lang="ts">
  const { fps } = $props<{ fps: number }>();
</script>

<div class="flex items-center gap-2">
  <span class="font-semibold text-gray-700">FPS:</span>
  <span class="tabular-nums">{Math.round(fps)}</span>
</div>

