<script lang="ts">
	import { onMount } from 'svelte';
	import { GTMap, TileLayer } from '@gtmap';
	import { parseGtpkHeader, formatFileSize, type GtpkInfo } from './gtpk-utils';

	// -- State --

	let fileInput: HTMLInputElement | null = null;
	let mapContainer: HTMLDivElement | null = null;

	let gtpkFile = $state<File | null>(null);
	let gtpkInfo = $state<GtpkInfo | null>(null);
	let blobUrl = $state<string | null>(null);
	let draggingOver = $state(false);
	let errorMessage = $state('');
	let fps = $state(0);
	let currentZoom = $state(0);
	let _prevFrameTime = 0;

	let map: GTMap | null = null;
	let tileLayer: TileLayer | null = null;

	// -- File handling --

	async function loadGtpkFile(file: File): Promise<void> {
		cleanup();
		errorMessage = '';

		try {
			const buffer = await file.arrayBuffer();
			const info = parseGtpkHeader(buffer);
			gtpkFile = file;
			gtpkInfo = info;

			// Create blob URL for GTMap to fetch
			blobUrl = URL.createObjectURL(file);

			// Wait a tick for the map container to appear in the DOM
			await new Promise((r) => requestAnimationFrame(r));
			initMap(info);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : String(err);
			gtpkFile = null;
			gtpkInfo = null;
		}
	}

	function initMap(info: GtpkInfo): void {
		if (!mapContainer || !blobUrl) return;

		const size = { width: info.mapSize, height: info.mapSize };

		map = new GTMap(mapContainer, {
			mapSize: size,
			center: { x: info.mapSize / 2, y: info.mapSize / 2 },
			zoom: 2,
			minZoom: 0,
			maxZoom: info.maxZoom + 1,
			fpsCap: 60,
			autoResize: true,
			clipToBounds: true,
			debug: false,
		});

		tileLayer = map.layers.createTileLayer({
			packUrl: blobUrl,
			tileSize: info.tileSize,
			sourceMinZoom: info.minZoom,
			sourceMaxZoom: info.maxZoom,
		});
		map.layers.addLayer(tileLayer, { z: 0 });

		(map.events.on as (event: string) => { each: (cb: (e: { now: number }) => void) => () => void })('frame').each((e) => {
			// Compute FPS from frame-to-frame timing (smoothed EMA)
			const t = e.now;
			if (_prevFrameTime) {
				const dt = t - _prevFrameTime;
				const inst = dt > 0 ? 1000 / dt : 0;
				fps = 0.8 * fps + 0.2 * inst;
			}
			_prevFrameTime = t;
			// Track current zoom level
			currentZoom = map!.view.getZoom();
		});
	}

	function cleanup(): void {
		map?.destroy?.();
		map = null;
		tileLayer = null;
		if (blobUrl) {
			URL.revokeObjectURL(blobUrl);
			blobUrl = null;
		}
		gtpkFile = null;
		gtpkInfo = null;
		fps = 0;
		currentZoom = 0;
		_prevFrameTime = 0;
	}

	// -- Drag & drop --

	function onDrop(e: DragEvent): void {
		e.preventDefault();
		draggingOver = false;
		const files = e.dataTransfer?.files;
		if (files && files.length > 0) loadGtpkFile(files[0]);
	}

	function onDragOver(e: DragEvent): void {
		e.preventDefault();
		draggingOver = true;
	}

	function onDragLeave(): void {
		draggingOver = false;
	}

	function onFileSelect(e: Event): void {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length > 0) loadGtpkFile(input.files[0]);
	}

	// -- Lifecycle --

	onMount(() => {
		return () => cleanup();
	});
</script>

<div class="flex h-[calc(100vh-32px)] w-full">
	<!-- Sidebar -->
	<div class="flex w-72 flex-shrink-0 flex-col gap-3 overflow-y-auto border-r border-neutral-700 bg-neutral-900/95 p-3 font-mono text-xs text-neutral-300">
		<h2 class="text-sm font-bold text-neutral-100">GTPK Viewer</h2>

		{#if gtpkFile && gtpkInfo}
			<!-- File Info -->
			<div class="rounded border border-neutral-700 bg-neutral-800/60 p-2">
				<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-neutral-500">File</div>
				<div class="flex justify-between"><span class="text-neutral-500">Name</span><span class="truncate ml-2 text-neutral-200" title={gtpkFile.name}>{gtpkFile.name}</span></div>
				<div class="flex justify-between"><span class="text-neutral-500">Size</span><span class="tabular-nums">{formatFileSize(gtpkFile.size)}</span></div>
			</div>

			<!-- GTPK Stats -->
			<div class="rounded border border-neutral-700 bg-neutral-800/60 p-2">
				<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-neutral-500">Pack Info</div>
				<div class="flex justify-between"><span class="text-neutral-500">Tiles</span><span class="tabular-nums text-cyan-400">{gtpkInfo.tileCount.toLocaleString()}</span></div>
				<div class="flex justify-between"><span class="text-neutral-500">Tile Size</span><span class="tabular-nums">{gtpkInfo.tileSize}px</span></div>
				<div class="flex justify-between"><span class="text-neutral-500">Zoom</span><span class="tabular-nums text-cyan-400">{gtpkInfo.minZoom}..{gtpkInfo.maxZoom}</span></div>
				<div class="flex justify-between"><span class="text-neutral-500">Map Size</span><span class="tabular-nums text-cyan-400">{gtpkInfo.mapSize.toLocaleString()}px</span></div>
			</div>

			<!-- Telemetry -->
			<div class="rounded border border-neutral-700 bg-neutral-800/60 p-2">
				<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-neutral-500">Telemetry</div>
				<div class="flex justify-between"><span class="text-neutral-500">FPS</span><span class="tabular-nums {fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-amber-400' : 'text-red-400'}">{Math.round(fps)}</span></div>
				<div class="flex justify-between"><span class="text-neutral-500">Zoom</span><span class="tabular-nums text-cyan-400">{currentZoom.toFixed(2)}</span></div>
			</div>

			<!-- Actions -->
			<button
				onclick={cleanup}
				class="rounded border border-neutral-600 px-3 py-1 text-xs text-neutral-400 transition hover:border-neutral-500 hover:text-neutral-300"
			>
				Clear
			</button>
		{:else}
			<p class="text-neutral-500">Drop a .gtpk file to view its tiles on an interactive map.</p>
		{/if}

		{#if errorMessage}
			<div class="rounded border border-red-700/40 bg-red-900/20 p-2 text-red-300">
				{errorMessage}
			</div>
		{/if}
	</div>

	<!-- Main area -->
	<div class="relative flex-1 bg-[#0a0c10]">
		{#if gtpkInfo}
			<!-- Map container -->
			<div
				bind:this={mapContainer}
				class="h-full w-full"
				style="touch-action:none;user-select:none;-webkit-user-select:none;"
			></div>
		{:else}
			<!-- Drop zone -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="flex h-full w-full items-center justify-center"
				ondrop={onDrop}
				ondragover={onDragOver}
				ondragleave={onDragLeave}
			>
				<div
					class="flex h-64 w-96 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors {draggingOver
						? 'border-cyan-400 bg-cyan-400/10'
						: 'border-neutral-600 bg-neutral-800/40 hover:border-neutral-500 hover:bg-neutral-800/60'}"
					onclick={() => fileInput?.click()}
					role="button"
					tabindex="0"
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInput?.click(); }}
				>
					<svg class="mx-auto h-10 w-10 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M4 12V8a3 3 0 013-3h10a3 3 0 013 3v4" />
					</svg>
					<p class="mt-3 text-sm text-neutral-300">Drop a .gtpk file here</p>
					<p class="mt-1 text-xs text-neutral-500">or click to browse</p>
				</div>
			</div>
		{/if}

		<input
			bind:this={fileInput}
			type="file"
			accept=".gtpk"
			class="hidden"
			onchange={onFileSelect}
		/>
	</div>
</div>
