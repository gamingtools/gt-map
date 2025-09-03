<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>
    <header class="flex flex-row gap-2 h-8 items-center px-1 bg-neutral-950">
		<a href="/" class="font-semibold text-neutral-200 hover:text-neutral-100 transition-colors">GTMap Svelte Demo</a>
		<nav class="font-semibold">
			<a href="/map" class="header-link">Map</a>
		</nav>
	</header>
{@render children?.()}
