<script lang="ts">
	import { onMount } from 'svelte';
	import { GTMap } from '@gtmap';
	import {
		defaults,
		SIZE_TEMPLATE_OPTIONS,
		resolveClusterIconSizeFunction,
		MAP_SIZE,
		MAP_TILES,
		HOME,
		buildBoundaryOpts,
		refreshClusterStats,
		fetchActorData,
		createLayers,
		wireMapEvents,
		type ResourceLayerInfo,
		type MarkerHoverInfo,
		type BoundaryParams,
		type SizeTemplateValue,
	} from './cluster-demo';

	// -- State --

	let container: HTMLDivElement | null = null;
	let map: GTMap;
	let mounted = $state(false);

	let loading = $state(true);
	let initStatus = $state('Fetching actor data...');
	let loadError = $state<string | null>(null);

	let resourceLayers = $state<ResourceLayerInfo[]>([]);

	let clusterRadius = $state(defaults.clusterRadius);
	let minClusterSize = $state(defaults.minClusterSize);
	let sizeTemplate = $state<SizeTemplateValue>(defaults.sizeTemplate);

	let boundaryEnabled = $state(defaults.boundary.enabled);
	let boundaryShowOnHover = $state(defaults.boundary.showOnHover);
	let boundaryFill = $state(defaults.boundary.fill);
	let boundaryWeight = $state(defaults.boundary.weight);
	let boundaryOpacity = $state(defaults.boundary.opacity);
	let boundaryFillOpacity = $state(defaults.boundary.fillOpacity);

	let hoverInfo = $state<MarkerHoverInfo | null>(null);
	let cursorX = $state(0);
	let cursorY = $state(0);

	let panelVisible = $state(true);
	let fps = $state(0);
	let totalMarkers = $state(0);
	let totalClusters = $state(0);
	let clusterStatsTimer: ReturnType<typeof setTimeout> | null = null;

	// -- Helpers --

	function getBoundaryParams(): BoundaryParams {
		return {
			enabled: boundaryEnabled,
			fill: boundaryFill,
			weight: boundaryWeight,
			opacity: boundaryOpacity,
			fillOpacity: boundaryFillOpacity,
			showOnHover: boundaryShowOnHover,
		};
	}

	function scheduleClusterStatsRefresh(delayMs = 120): void {
		if (clusterStatsTimer) clearTimeout(clusterStatsTimer);
		clusterStatsTimer = setTimeout(() => {
			clusterStatsTimer = null;
			totalClusters = refreshClusterStats(resourceLayers);
		}, Math.max(0, delayMs));
	}

	// -- Layer controls --

	let toggleAllCheckbox: HTMLInputElement | null = null;

	type ToggleAllState = 'all' | 'none' | 'mixed';
	let toggleAllState = $derived.by((): ToggleAllState => {
		if (resourceLayers.length === 0) return 'none';
		const visibleCount = resourceLayers.filter((l) => l.visible).length;
		if (visibleCount === 0) return 'none';
		if (visibleCount === resourceLayers.length) return 'all';
		return 'mixed';
	});

	$effect(() => {
		if (!toggleAllCheckbox) return;
		toggleAllCheckbox.indeterminate = toggleAllState === 'mixed';
		toggleAllCheckbox.checked = toggleAllState === 'all';
	});

	function toggleAllLayers(): void {
		const target = toggleAllState === 'none';
		for (const info of resourceLayers) {
			info.visible = target;
			map.layers.setLayerVisible(info.layer, target);
		}
		resourceLayers = [...resourceLayers];
		scheduleClusterStatsRefresh(0);
	}

	function toggleLayerVisibility(info: ResourceLayerInfo): void {
		info.visible = !info.visible;
		map.layers.setLayerVisible(info.layer, info.visible);
		resourceLayers = [...resourceLayers];
		scheduleClusterStatsRefresh(0);
	}

	// -- Reactive settings --

	$effect(() => {
		void clusterRadius;
		void minClusterSize;
		void sizeTemplate;
		void boundaryEnabled;
		void boundaryShowOnHover;
		void boundaryFill;
		void boundaryWeight;
		void boundaryOpacity;
		void boundaryFillOpacity;

		const bp = getBoundaryParams();
		for (const info of resourceLayers) {
			info.layer.setClusterOptions({
				clusterRadius,
				minClusterSize,
				clusterIconSizeFunction: resolveClusterIconSizeFunction(sizeTemplate),
				boundary: buildBoundaryOpts(info.color, bp),
			});
		}
		scheduleClusterStatsRefresh(120);
	});

	// -- Lifecycle --

	onMount(() => {
		if (!container) return;
		mounted = true;

		// Start fetching data immediately -- no map needed yet.
		const dataPromise = fetchActorData((msg) => { initStatus = msg; });

		// Init map while data is in flight.
		map = new GTMap(container, {
			mapSize: MAP_SIZE,
			center: { x: HOME.lng, y: HOME.lat },
			zoom: defaults.map.zoom,
			minZoom: defaults.map.minZoom,
			maxZoom: defaults.map.maxZoom,
			fpsCap: defaults.map.fpsCap,
			autoResize: true,
			clipToBounds: true,
			debug: false,
		});

		const tileLayer = map.layers.createTileLayer(MAP_TILES);
		map.layers.addLayer(tileLayer, { z: 0 });

		map.view.setIconScaleFunction((zoom) => {
			const scale = Math.pow(2, zoom - 3);
			return Math.min(1, Math.max(0.5, scale));
		});

		map.events.on('frame', (e) => {
			fps = e.stats?.fps ?? 0;
		});

		map.events.on('pointermove', (e) => {
			cursorX = e.x;
			cursorY = e.y;
			if (hoverInfo) {
				hoverInfo = { ...hoverInfo, screen: { x: e.x, y: e.y } };
			}
		});

		map.events.on('zoomend', () => scheduleClusterStatsRefresh(0));

		const unwireEvents = wireMapEvents(
			map,
			() => resourceLayers,
			(info) => { hoverInfo = info; },
		);

		// Once data arrives, create layers on the already-initialized map.
		dataPromise.then((data) => {
			return createLayers(map, data, {
				clusterRadius,
				minClusterSize,
				sizeTemplate,
				boundaryParams: getBoundaryParams(),
			}, (msg) => { initStatus = msg; });
		}).then((infos) => {
			resourceLayers = infos;
			const markerTotal = infos.reduce((total, info) => total + info.markerCount, 0);
			for (const info of infos) {
				map.layers.setLayerVisible(info.layer, info.visible);
				map.layers.setLayerOpacity(info.layer, info.visible ? 1 : 0);
			}
			totalMarkers = markerTotal;
			loading = false;
			initStatus = 'Ready';
			scheduleClusterStatsRefresh(0);
		}).catch((err) => {
			loadError = String(err);
			loading = false;
			console.error('Failed to initialize layers:', err);
		});

		return () => {
			if (clusterStatsTimer) {
				clearTimeout(clusterStatsTimer);
				clusterStatsTimer = null;
			}
			unwireEvents();
			map?.destroy?.();
		};
	});
</script>

<!-- Map (full viewport) -->
<div bind:this={container} class="cluster-map">
	<!-- Floating control panel -->
	<div class="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-2">
		{#if !panelVisible}
			<button
				class="pointer-events-auto flex h-7 items-center gap-1.5 rounded border border-neutral-600 bg-neutral-900/90 px-2.5 font-mono text-[10px] font-medium uppercase tracking-widest text-neutral-400 backdrop-blur-sm transition-all hover:border-cyan-500/40 hover:text-neutral-200"
				onclick={() => (panelVisible = true)}
			>
				<svg class="h-3 w-3" viewBox="0 0 12 12" fill="none">
					<path d="M2 3H10M2 6H10M2 9H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
				Clusters
			</button>
		{/if}

		{#if panelVisible}
			<div class="pointer-events-auto max-h-[calc(100vh-80px)] w-64 select-none overflow-y-auto rounded border border-neutral-700 bg-neutral-900/95 font-mono text-xs leading-tight text-neutral-300 shadow-2xl shadow-black/50 backdrop-blur-sm">
				<!-- Header with close -->
				<div class="border-b border-neutral-700 px-3 py-2.5">
					<div class="mb-2 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_4px_theme(--color-green-400)]"></div>
							<span class="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Telemetry</span>
						</div>
						<button
							class="flex h-5 w-5 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-red-400"
							onclick={() => (panelVisible = false)}
							title="Close panel"
							aria-label="Close panel"
						>
							<svg class="h-3 w-3" viewBox="0 0 12 12" fill="none">
								<path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
							</svg>
						</button>
					</div>
					<div class="grid grid-cols-3 gap-x-2">
						<div class="flex items-baseline justify-between">
							<span class="text-neutral-500">FPS</span>
							<span class="tabular-nums text-green-400">{fps.toFixed(0)}</span>
						</div>
						<div class="flex items-baseline justify-between">
							<span class="text-neutral-500">MKR</span>
							<span class="tabular-nums text-neutral-200">{totalMarkers.toLocaleString()}</span>
						</div>
						<div class="flex items-baseline justify-between">
							<span class="text-neutral-500">CLU</span>
							<span class="tabular-nums text-cyan-400">{totalClusters}</span>
						</div>
					</div>
					{#if loading}
						<div class="mt-1.5 text-[10px] text-neutral-500">{initStatus}</div>
					{/if}
				</div>

				<!-- Resource Layers -->
				<div class="border-b border-neutral-700 px-3 py-2.5">
					<label class="mb-1.5 flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							bind:this={toggleAllCheckbox}
							checked={toggleAllState === 'all'}
							onchange={toggleAllLayers}
							class="accent-cyan-500"
						/>
						<span class="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Resource Layers</span>
					</label>
					{#if resourceLayers.length === 0 && !loading}
						<div class="text-neutral-500">No layers loaded</div>
					{/if}
					{#each resourceLayers as info}
						<label class="flex cursor-pointer items-center gap-2 py-0.5">
							<input
								type="checkbox"
								checked={info.visible}
								onchange={() => toggleLayerVisibility(info)}
								class="accent-cyan-500"
							/>
							<span
								class="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
								style="background-color: {info.color}"
							></span>
							<span class="flex-1 truncate">{info.displayName}</span>
							<span class="tabular-nums text-neutral-500">{info.markerCount.toLocaleString()}</span>
						</label>
					{/each}
				</div>

				<!-- Cluster Settings -->
				<div class="border-b border-neutral-700 px-3 py-2.5">
					<div class="mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Clustering</div>

					<label class="flex items-center justify-between">
						<span>Radius</span>
						<span class="tabular-nums text-cyan-400">{clusterRadius}px</span>
					</label>
					<input type="range" bind:value={clusterRadius} min="20" max="200" step="5" class="mt-0.5 w-full accent-cyan-500" />

					<label class="mt-2 flex items-center justify-between">
						<span>Min Size</span>
						<span class="tabular-nums text-cyan-400">{minClusterSize}</span>
					</label>
					<input type="range" bind:value={minClusterSize} min="2" max="10" step="1" class="mt-0.5 w-full accent-cyan-500" />

					<label class="mt-2 flex items-center justify-between">
						<span>Size Template</span>
						<select
							bind:value={sizeTemplate}
							class="rounded border border-neutral-600 bg-neutral-700 px-1 py-0.5 text-neutral-200"
						>
							{#each SIZE_TEMPLATE_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</label>
				</div>

				<!-- Boundary Settings -->
				<div class="px-3 py-2.5">
					<div class="mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Boundaries</div>

					<label class="flex items-center gap-2">
						<input type="checkbox" bind:checked={boundaryEnabled} class="accent-cyan-500" />
						<span>Show Boundaries</span>
					</label>

					{#if boundaryEnabled}
						<label class="mt-2 flex items-center gap-2">
							<input type="checkbox" bind:checked={boundaryShowOnHover} class="accent-cyan-500" />
							<span>Show on Hover Only</span>
						</label>

						<label class="mt-2 flex items-center gap-2">
							<input type="checkbox" bind:checked={boundaryFill} class="accent-cyan-500" />
							<span>Fill</span>
						</label>

						<label class="mt-2 flex items-center justify-between">
							<span>Weight</span>
							<span class="tabular-nums text-cyan-400">{boundaryWeight.toFixed(1)}px</span>
						</label>
						<input type="range" bind:value={boundaryWeight} min="0.5" max="6" step="0.5" class="mt-0.5 w-full accent-cyan-500" />

						<label class="mt-2 flex items-center justify-between">
							<span>Border Opacity</span>
							<span class="tabular-nums text-cyan-400">{boundaryOpacity.toFixed(2)}</span>
						</label>
						<input type="range" bind:value={boundaryOpacity} min="0" max="1" step="0.05" class="mt-0.5 w-full accent-cyan-500" />

						{#if boundaryFill}
							<label class="mt-2 flex items-center justify-between">
								<span>Fill Opacity</span>
								<span class="tabular-nums text-cyan-400">{boundaryFillOpacity.toFixed(2)}</span>
							</label>
							<input type="range" bind:value={boundaryFillOpacity} min="0" max="1" step="0.05" class="mt-0.5 w-full accent-cyan-500" />
						{/if}
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Error panel -->
	{#if loadError}
		<div class="absolute left-3 top-3 z-30 rounded border border-red-500/60 bg-neutral-900/90 px-3 py-2 font-mono text-xs text-red-300">
			Error: {loadError}
		</div>
	{/if}

	<!-- Hover tooltip -->
	{#if hoverInfo}
		<div
			class="pointer-events-none absolute z-20 rounded border border-neutral-600 bg-neutral-800/95 px-3 py-2 font-mono text-xs text-neutral-200 shadow-xl backdrop-blur-sm"
			style="left:{Math.min(cursorX + 16, (container?.clientWidth ?? 800) - 220)}px;top:{Math.max(8, cursorY - 8)}px;"
		>
			<div class="flex items-center gap-1.5">
				{#if hoverInfo.cluster}
					<span class="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_theme(--color-cyan-400)]"></span>
				{:else}
					<span class="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_theme(--color-amber-400)]"></span>
				{/if}
				<span class="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Type</span>
				{#if hoverInfo.cluster}
					<span class="ml-auto tabular-nums text-cyan-400">Cluster</span>
				{:else}
					<span class="ml-auto tabular-nums text-amber-300">Marker</span>
				{/if}
			</div>
			<div class="mt-0.5 flex items-center gap-1.5">
				<span class="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Count</span>
				<span class="ml-auto tabular-nums text-neutral-200">{hoverInfo.cluster ? hoverInfo.cluster.size : 1}</span>
			</div>
			<div class="mt-1 text-neutral-400">
				Resource: <span class="text-neutral-200">{hoverInfo.marker}</span>
			</div>
			{#if hoverInfo.cluster}
				<div class="mt-0.5 text-neutral-500">
					Center: {hoverInfo.cluster.center.x.toFixed(0)}, {hoverInfo.cluster.center.y.toFixed(0)}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.cluster-map {
		position: relative;
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
		width: 100%;
		height: calc(100vh - 32px);
		background: #0a0c10;
	}
	input[type='range'] {
		height: 4px;
	}
</style>
