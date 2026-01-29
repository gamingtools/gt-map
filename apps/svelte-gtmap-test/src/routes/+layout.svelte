<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>
<header class="flex h-8 flex-row items-center gap-2 bg-neutral-900 px-1">
	<a href="/" class="font-semibold text-neutral-200 transition-colors hover:text-neutral-100"
		>GTMap Svelte Demo</a
	>
	<nav class="font-semibold">
		<a href="/map" class="header-link">Map</a>
	</nav>
</header>
{@render children?.()}
