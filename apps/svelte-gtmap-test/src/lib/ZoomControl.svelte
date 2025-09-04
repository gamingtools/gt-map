<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { L, type LeafletMapFacade, type ControlPosition, type ZoomControl as ZoomControlClass } from '@gtmap';

  const props = $props<{ map: LeafletMapFacade; position?: ControlPosition; step?: number }>();

  let ctrl: ZoomControlClass | null = null;

  onMount(() => {
    ctrl = L.control().zoom({ position: props.position, step: props.step });
    ctrl.addTo(props.map);
  });

  onDestroy(() => {
    try {
      ctrl?.remove?.();
    } catch {}
    ctrl = null;
  });

  $effect(() => {
    if (ctrl) ctrl.setStep(props.step ?? 1);
  });
</script>

<!-- No markup: control attaches DOM to the map container -->
