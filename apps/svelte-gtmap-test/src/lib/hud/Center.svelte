<script lang="ts">
  const { center } = $props<{ center: { lng: number; lat: number } }>();
</script>

<div class="flex items-center gap-2">
  <span class="font-semibold text-gray-700">Center:</span>
  <span class="tabular-nums">lng {center.lng.toFixed(2)}, lat {center.lat.toFixed(2)}</span>
  
</div>

