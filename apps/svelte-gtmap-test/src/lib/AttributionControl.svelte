<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { L, type LeafletMapFacade, type ControlPosition } from '@gtmap';

  const props = $props<{ map: LeafletMapFacade; position?: ControlPosition; text?: string }>();

  let ctrl: { addTo: (m: LeafletMapFacade) => any; remove: () => any } | null = null;

  onMount(() => {
    ctrl = L.control().attribution({ position: props.position, text: props.text });
    ctrl.addTo(props.map);
  });

  onDestroy(() => {
    try {
      ctrl?.remove?.();
    } catch {}
    ctrl = null;
  });
</script>

<!-- No markup: control attaches DOM to the map container -->

