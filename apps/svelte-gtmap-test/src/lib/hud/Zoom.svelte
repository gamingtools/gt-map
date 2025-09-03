<script lang="ts">
  const { zoom } = $props<{ zoom: number }>();
</script>

<div class="flex items-center gap-2">
  <span class="font-semibold text-gray-700">Zoom:</span>
  <span class="tabular-nums">{zoom.toFixed(2)}</span>
</div>

