<script lang="ts">
	import { onMount } from 'svelte';
	import {
		GTMap,
		TileLayer,
		SpriteVisual,
		ClusterIconSizeTemplates,
		type ClusteredLayerOptions,
		type ClusterEventData,
		type MarkerEventData,
		type SpriteAtlasDescriptor,
		type SpriteAtlasHandle,
	} from '@gtmap';
	import { ClusteredLayer } from '@gtmap';

	// -- Types --

	interface ResourceLayerInfo {
		resourceId: string;
		displayName: string;
		color: string;
		layer: ClusteredLayer;
		markerCount: number;
		visible: boolean;
	}

	interface ActorRecord {
		x: number;
		y: number;
		map_marker_id?: string;
	}

	// -- Constants --

	const MAP_SIZE = { width: 8192, height: 8192 };
	const MAP_TILES = {
		packUrl: 'https://gtcdn.info/dune/tiles/hb_8k.gtpk',
		tileSize: 256,
		sourceMinZoom: 0,
		sourceMaxZoom: 5,
	};
	const HOME = { lng: MAP_SIZE.width / 2, lat: MAP_SIZE.height / 2 };
	const ATLAS_CDN = 'https://cdn.gaming.tools/dune/images';
	const API_URL = 'https://dune-api-v2.gaming.tools/actors?seed=11&world=survival_1';

	const WORLD_MIN_X = -456485;
	const WORLD_MAX_X = 355555;
	const WORLD_MIN_Y = -457149;
	const WORLD_MAX_Y = 344662;

	const LAYER_COLORS: string[] = [
		'#22c55e',
		'#eab308',
		'#ef4444',
		'#f97316',
		'#3b82f6',
		'#8b5cf6',
		'#06b6d4',
		'#ec4899',
	];

	const DISPLAY_NAMES: Record<string, string> = {
		primrosefield: 'Primrose Field',
		brittlebush: 'Brittle Bush',
		rhyoliteore: 'Rhyolite Ore',
		scrapmetalwreckage: 'Scrap Metal Wreckage',
		azuriteore: 'Azurite Ore',
		basaltore: 'Basalt Ore',
		dolomiterock: 'Dolomite Rock',
		bauxiteore: 'Bauxite Ore',
		magnetiteore: 'Magnetite Ore',
		fuelcellwreckage: 'Fuel Cell Wreckage',
		erythriteore: 'Erythrite Ore',
		spicefieldsmall: 'Spice Field (Small)',
		jasmiumore: 'Jasmium Ore',
		npcfriendly: 'NPC (Friendly)',
		buriedtreasure: 'Buried Treasure',
		saguaroseed: 'Saguaro Seed',
		lootcontainer: 'Loot Container',
		scrapmetalpart: 'Scrap Metal Part',
		salvagesteel: 'Salvage Steel',
	};

	// -- State --

	let container: HTMLDivElement | null = null;
	let map: GTMap;
	let tileLayer: TileLayer;
	let mounted = $state(false);

	let loading = $state(true);
	let initStatus = $state('Fetching actor data...');
	let loadError = $state<string | null>(null);

	let resourceLayers = $state<ResourceLayerInfo[]>([]);

	let clusterRadius = $state(80);
	let minClusterSize = $state(2);
	let sizeTemplate = $state<'logarithmic' | 'linear' | 'stepped'>('logarithmic');

	let boundaryEnabled = $state(false);
	let boundaryFill = $state(true);
	let boundaryWeight = $state(1.5);
	let boundaryOpacity = $state(1);
	let boundaryFillOpacity = $state(0.15);

	let hoverInfo = $state<{ marker: string; cluster: ClusterEventData | null; screen: { x: number; y: number } } | null>(null);
	let cursorX = $state(0);
	let cursorY = $state(0);

	let fps = $state(0);
	let totalMarkers = $state(0);
	let totalClusters = $state(0);
	let clusterStatsTimer: ReturnType<typeof setTimeout> | null = null;

	// -- Helpers --

	function worldToMap(worldX: number, worldY: number): { x: number; y: number } {
		const mapX = ((worldX - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)) * MAP_SIZE.width;
		const mapY = ((worldY - WORLD_MIN_Y) / (WORLD_MAX_Y - WORLD_MIN_Y)) * MAP_SIZE.height;
		return { x: mapX, y: mapY };
	}

	function hexToRgba(hex: string, alpha: number): string {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r},${g},${b},${alpha})`;
	}

	function buildBoundaryOpts(color: string): ClusteredLayerOptions['boundary'] {
		if (!boundaryEnabled) {
			return { fill: false, opacity: 0, weight: 0 };
		}
		return {
			color: hexToRgba(color, 0.4),
			weight: boundaryWeight,
			opacity: boundaryOpacity,
			fill: boundaryFill,
			fillColor: hexToRgba(color, boundaryFillOpacity),
			fillOpacity: boundaryFillOpacity,
		};
	}

	function resolveClusterFromMarkerId(markerId: string): ClusterEventData | null {
		if (!markerId.startsWith('__cl_')) return null;
		const clusterId = markerId.slice('__cl_'.length);
		if (!clusterId) return null;

		for (const info of resourceLayers) {
			if (!info.visible) continue;
			const cluster = info.layer.getClusters().find((snapshot) => snapshot.id === clusterId);
			if (!cluster) continue;
			return {
				clusterId: cluster.id,
				size: cluster.size,
				center: { x: cluster.x, y: cluster.y },
				markerIds: cluster.markerIds,
			};
		}
		return null;
	}

	// -- Core initialization --

	async function initLayers(): Promise<void> {
		initStatus = 'Fetching actor data...';
		const resp = await fetch(API_URL);
		if (!resp.ok) throw new Error(`API responded with ${resp.status}`);
		const actors: ActorRecord[] = await resp.json();

		initStatus = 'Grouping by resource type...';
		const groups = new Map<string, { x: number; y: number }[]>();
		for (const actor of actors) {
			const key = actor.map_marker_id;
			if (!key) continue;
			let arr = groups.get(key);
			if (!arr) {
				arr = [];
				groups.set(key, arr);
			}
			arr.push({ x: actor.x, y: actor.y });
		}

		const sorted = [...groups.entries()]
			.sort((a, b) => b[1].length - a[1].length)
			.slice(0, 11);

		initStatus = 'Loading sprite atlas...';
		const atlasResp = await fetch(`${ATLAS_CDN}/atlas.json`);
		const descriptor: SpriteAtlasDescriptor = await atlasResp.json();

		initStatus = 'Creating layers in parallel...';
		const buildLayerTasks: Promise<ResourceLayerInfo>[] = sorted.map(async ([resourceId, positions], i) => {
			const color = LAYER_COLORS[i % LAYER_COLORS.length]!;

			const layer = map.layers.createClusteredLayer({
				clusterRadius,
				minClusterSize,
				clusterIconSizeFunction: ClusterIconSizeTemplates[sizeTemplate],
				boundary: buildBoundaryOpts(color),
			});
			// Keep layers transparent while data/atlas are populated so clustering can precompute without progressive reveal.
			map.layers.addLayer(layer, { z: 10 + i, opacity: 1 });

			const handle: SpriteAtlasHandle = await layer.loadSpriteAtlas(
				`${ATLAS_CDN}/atlas.png`,
				descriptor,
				`dune_${resourceId}`,
			);

			const entry = descriptor.sprites[resourceId];
			let visual: SpriteVisual;
			if (entry) {
				visual = new SpriteVisual(handle, resourceId, {
					width: entry.width / 1.6,
					height: entry.height / 1.6,
				});
			} else {
				const fallbackName = Object.keys(descriptor.sprites)[0]!;
				const fb = descriptor.sprites[fallbackName]!;
				visual = new SpriteVisual(handle, fallbackName, {
					width: fb.width / 1.6,
					height: fb.height / 1.6,
				});
			}
			visual.anchor = 'center';

			for (const pos of positions) {
				const mapped = worldToMap(pos.x, pos.y);
				layer.addMarker(mapped.x, mapped.y, {
					visual,
					data: { resource: resourceId },
				});
			}

			return {
				resourceId,
				displayName: DISPLAY_NAMES[resourceId] ?? resourceId,
				color,
				layer,
				markerCount: positions.length,
				visible: true,
			};
		});
		const infos = await Promise.all(buildLayerTasks);
		const markerTotal = infos.reduce((total, info) => total + info.markerCount, 0);

		resourceLayers = infos;
		for (const info of infos) {
			map.layers.setLayerVisible(info.layer, info.visible);
			map.layers.setLayerOpacity(info.layer, info.visible ? 1 : 0);
		}
		totalMarkers = markerTotal;
		loading = false;
		initStatus = 'Ready';
		scheduleClusterStatsRefresh(0);
	}

	// -- Events (map-level, O(1) subscriptions instead of 81k per-marker) --

	const unsubs: (() => void)[] = [];

	function wireMapEvents(): void {
		unsubs.push(
			map.events.on('markerenter', (e: MarkerEventData) => {
				const data = e.marker.data as { resource?: string } | null | undefined;
				const resourceId = data?.resource ?? '';
				const displayName = DISPLAY_NAMES[resourceId] ?? resourceId;
				const clusterMeta = e.cluster ?? resolveClusterFromMarkerId(e.marker.id);
				hoverInfo = {
					marker: displayName,
					cluster: clusterMeta,
					screen: e.screen ?? { x: 0, y: 0 },
				};
			}),
		);
		unsubs.push(
			map.events.on('markerleave', () => {
				hoverInfo = null;
			}),
		);
	}

	// -- Layer controls --

	function toggleLayerVisibility(info: ResourceLayerInfo): void {
		info.visible = !info.visible;
		map.layers.setLayerVisible(info.layer, info.visible);
		resourceLayers = [...resourceLayers];
		scheduleClusterStatsRefresh(0);
	}

	function refreshClusterStats(): void {
		let total = 0;
		for (const info of resourceLayers) {
			if (!info.visible) continue;
			const clusters = info.layer.getClusters();
			total += clusters.length;
		}
		totalClusters = total;
	}

	function scheduleClusterStatsRefresh(delayMs = 120): void {
		if (clusterStatsTimer) clearTimeout(clusterStatsTimer);
		clusterStatsTimer = setTimeout(() => {
			clusterStatsTimer = null;
			refreshClusterStats();
		}, Math.max(0, delayMs));
	}

	// -- Reactive settings --

	$effect(() => {
		void clusterRadius;
		void minClusterSize;
		void sizeTemplate;
		void boundaryEnabled;
		void boundaryFill;
		void boundaryWeight;
		void boundaryOpacity;
		void boundaryFillOpacity;

		for (const info of resourceLayers) {
			info.layer.setClusterOptions({
				clusterRadius,
				minClusterSize,
				clusterIconSizeFunction: ClusterIconSizeTemplates[sizeTemplate],
				boundary: buildBoundaryOpts(info.color),
			});
		}
		scheduleClusterStatsRefresh(120);
	});

	// -- Lifecycle --

	onMount(() => {
		if (!container) return;
		mounted = true;

		map = new GTMap(container, {
			mapSize: MAP_SIZE,
			center: { x: HOME.lng, y: HOME.lat },
			zoom: 2,
			minZoom: 0,
			maxZoom: 7,
			fpsCap: 60,
			autoResize: true,
			clipToBounds: true,
			debug: false,
		});

		tileLayer = map.layers.createTileLayer(MAP_TILES);
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

		wireMapEvents();

		initLayers().catch((err) => {
			loadError = String(err);
			loading = false;
			console.error('Failed to initialize layers:', err);
		});

		return () => {
			if (clusterStatsTimer) {
				clearTimeout(clusterStatsTimer);
				clusterStatsTimer = null;
			}
			for (const u of unsubs) {
				try { u(); } catch { /* ignore */ }
			}
			map?.destroy?.();
		};
	});
</script>

<div class="flex h-[calc(100vh-32px)] w-full">
	<!-- Sidebar -->
	<div class="flex w-72 flex-shrink-0 flex-col gap-3 overflow-y-auto border-r border-neutral-700 bg-neutral-900/95 p-3 font-mono text-xs text-neutral-300">
		<h2 class="text-sm font-bold text-neutral-100">Cluster Demo</h2>
		{#if loading}
			<div class="rounded border border-neutral-700 bg-neutral-800/60 px-2 py-1 text-[10px] text-neutral-400">{initStatus}</div>
		{/if}

		<!-- Telemetry -->
		<div class="rounded border border-neutral-700 bg-neutral-800/60 p-2">
			<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-neutral-500">Telemetry</div>
			<div class="flex justify-between"><span class="text-neutral-500">FPS</span><span class="tabular-nums text-green-400">{fps.toFixed(0)}</span></div>
			<div class="flex justify-between"><span class="text-neutral-500">Markers</span><span class="tabular-nums">{totalMarkers.toLocaleString()}</span></div>
			<div class="flex justify-between"><span class="text-neutral-500">Clusters</span><span class="tabular-nums text-cyan-400">{totalClusters}</span></div>
		</div>

		<!-- Resource Layers -->
		<div class="rounded border border-neutral-700 bg-neutral-800/60 p-2">
			<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-neutral-500">Resource Layers</div>
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
		<div class="rounded border border-neutral-700 bg-neutral-800/60 p-2">
			<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-neutral-500">Clustering</div>

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
					<option value="logarithmic">Logarithmic</option>
					<option value="linear">Linear</option>
					<option value="stepped">Stepped</option>
				</select>
			</label>
		</div>

		<!-- Boundary Settings -->
		<div class="rounded border border-neutral-700 bg-neutral-800/60 p-2">
			<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-neutral-500">Boundaries</div>

			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={boundaryEnabled} class="accent-cyan-500" />
				<span>Show Boundaries</span>
			</label>

			{#if boundaryEnabled}
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

	<!-- Map -->
	<div bind:this={container} class="relative flex-1 bg-[#0a0c10]" style="touch-action:none;user-select:none;-webkit-user-select:none;">
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
</div>

<style>
	input[type='range'] {
		height: 4px;
	}
</style>
