<script lang="ts">
  const { mouse } = $props<{ mouse: { x: number; y: number } | null }>();
</script>

<div class="flex items-center gap-2">
  <span class="font-semibold text-gray-700">Mouse:</span>
  <span class="tabular-nums">{mouse ? `x ${mouse.x}, y ${mouse.y}` : '—'}</span>
</div>

