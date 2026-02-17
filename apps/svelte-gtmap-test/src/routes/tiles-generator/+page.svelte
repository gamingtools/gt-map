<script lang="ts">
	import { onMount } from 'svelte';
	import {
		computeCanvasPlan,
		formatFileSize,
		isNoneResizeAvailable,
		isDownscaleAvailable,
		RESIZE_MODE_OPTIONS,
		TILE_SIZE_OPTIONS,
		type ResizeMode,
		type WorkerMessage,
		type GenerateRequest,
		type GenerationStats,
		type CanvasPlan,
	} from './tile-generator';

	// -- State --

	let fileInput: HTMLInputElement | null = null;

	let imageFile = $state<File | null>(null);
	let imageWidth = $state(0);
	let imageHeight = $state(0);
	let imagePreviewUrl = $state<string | null>(null);
	let draggingOver = $state(false);
	let previewZoom = $state(-1); // -1 = maxZoom (default)
	let previewCanvas: HTMLCanvasElement | null = null;
	let previewContainer: HTMLDivElement | null = null;

	// Config
	let tileSize = $state<number>(256);
	let quality = $state(0.75);
	let resizeMode = $state<ResizeMode>('pad');

	// Generation state
	type Phase = 'idle' | 'generating' | 'done' | 'error';
	let phase = $state<Phase>('idle');
	let progressZoom = $state(0);
	let progressMaxZoom = $state(0);
	let progressIndex = $state(0);
	let progressTotal = $state(0);
	let errorMessage = $state('');
	let stats = $state<GenerationStats | null>(null);
	let resultBuffer = $state<ArrayBuffer | null>(null);
	let resultFileName = $state('');

	let worker: Worker | null = null;

	// -- Derived --

	let plan = $derived.by((): CanvasPlan | null => {
		if (!imageFile || imageWidth === 0 || imageHeight === 0) return null;
		try {
			return computeCanvasPlan(imageWidth, imageHeight, tileSize, resizeMode);
		} catch {
			return null;
		}
	});

	let planError = $derived.by((): string => {
		if (!imageFile || imageWidth === 0 || imageHeight === 0) return '';
		try {
			computeCanvasPlan(imageWidth, imageHeight, tileSize, resizeMode);
			return '';
		} catch (e) {
			return e instanceof Error ? e.message : String(e);
		}
	});

	let noneAvailable = $derived(imageWidth > 0 && imageHeight > 0 && isNoneResizeAvailable(imageWidth, imageHeight, tileSize));
	let downscaleAvailable = $derived(imageWidth > 0 && imageHeight > 0 && isDownscaleAvailable(imageWidth, imageHeight, tileSize));

	let progressPercent = $derived(progressTotal > 0 ? Math.round((progressIndex / progressTotal) * 100) : 0);
	let baseName = $derived(imageFile ? imageFile.name.replace(/\.[^.]+$/, '').toLowerCase() : '');

	/** Effective zoom level for the preview grid. -1 means use maxZoom. */
	let effectivePreviewZoom = $derived(plan ? (previewZoom < 0 ? plan.maxZoom : Math.min(previewZoom, plan.maxZoom)) : 0);

	// -- Preview grid drawing --

	let previewImgEl: HTMLImageElement | null = null;

	function loadPreviewImage(): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			if (previewImgEl && previewImgEl.src === imagePreviewUrl && previewImgEl.complete) {
				resolve(previewImgEl);
				return;
			}
			const img = new Image();
			img.onload = () => {
				previewImgEl = img;
				resolve(img);
			};
			img.onerror = reject;
			img.src = imagePreviewUrl!;
		});
	}

	async function drawTileGrid(): Promise<void> {
		if (!previewCanvas || !plan || !previewContainer || !imagePreviewUrl) return;
		const container = previewContainer;
		const rect = container.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;

		const cw = rect.width;
		const ch = rect.height;
		if (cw === 0 || ch === 0) return;

		previewCanvas.width = cw * dpr;
		previewCanvas.height = ch * dpr;
		previewCanvas.style.width = `${cw}px`;
		previewCanvas.style.height = `${ch}px`;

		const ctx = previewCanvas.getContext('2d');
		if (!ctx) return;
		ctx.scale(dpr, dpr);
		ctx.clearRect(0, 0, cw, ch);

		// Compute scale: fit canvasSize x canvasSize into cw x ch with padding
		const pad = 24;
		const bottomPad = 20; // extra space for label below
		const availW = cw - pad * 2;
		const availH = ch - pad - pad - bottomPad;
		const scale = Math.min(availW / plan.canvasSize, availH / plan.canvasSize);
		const totalW = plan.canvasSize * scale;
		const totalH = plan.canvasSize * scale;
		const ox = pad + (availW - totalW) / 2;
		const oy = pad + (availH - totalH) / 2;

		// Fill the canvas area background (represents the padded square)
		ctx.fillStyle = '#0d1117';
		ctx.fillRect(ox, oy, totalW, totalH);

		// Draw the source image into the draw area
		try {
			const img = await loadPreviewImage();
			ctx.drawImage(img, ox, oy, plan.drawWidth * scale, plan.drawHeight * scale);
		} catch {
			// Image load failed, just show grid
		}

		// Darken padding area outside the draw region (if any)
		if (plan.drawWidth < plan.canvasSize || plan.drawHeight < plan.canvasSize) {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
			// Right strip
			if (plan.drawWidth < plan.canvasSize) {
				ctx.fillRect(ox + plan.drawWidth * scale, oy, (plan.canvasSize - plan.drawWidth) * scale, totalH);
			}
			// Bottom strip (below image, left of right strip)
			if (plan.drawHeight < plan.canvasSize) {
				const dw = Math.min(plan.drawWidth, plan.canvasSize);
				ctx.fillRect(ox, oy + plan.drawHeight * scale, dw * scale, (plan.canvasSize - plan.drawHeight) * scale);
			}
		}

		// Draw tile grid at the effective zoom level
		const z = effectivePreviewZoom;
		const tilesPerAxis = Math.pow(2, z);
		const tilePx = totalW / tilesPerAxis;

		ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'; // cyan-500
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let i = 1; i < tilesPerAxis; i++) {
			const x = ox + i * tilePx;
			ctx.moveTo(x, oy);
			ctx.lineTo(x, oy + totalH);
		}
		for (let j = 1; j < tilesPerAxis; j++) {
			const y = oy + j * tilePx;
			ctx.moveTo(ox, y);
			ctx.lineTo(ox + totalW, y);
		}
		ctx.stroke();

		// Canvas boundary (outer square)
		ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)';
		ctx.lineWidth = 1;
		ctx.strokeRect(ox, oy, totalW, totalH);

		// Draw area boundary (green dashed)
		if (plan.drawWidth !== plan.canvasSize || plan.drawHeight !== plan.canvasSize) {
			ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
			ctx.lineWidth = 1.5;
			ctx.setLineDash([4, 3]);
			ctx.strokeRect(ox, oy, plan.drawWidth * scale, plan.drawHeight * scale);
			ctx.setLineDash([]);
		}

		// Labels
		ctx.font = '10px monospace';
		ctx.textBaseline = 'top';

		// Canvas size label (top-right)
		const canvasLabel = `${plan.canvasSize}x${plan.canvasSize}`;
		ctx.fillStyle = 'rgba(100, 100, 100, 0.9)';
		const clw = ctx.measureText(canvasLabel).width;
		ctx.fillText(canvasLabel, ox + totalW - clw - 4, oy + 4);

		// Draw size label (green, bottom-left of image area)
		if (plan.drawWidth !== plan.canvasSize || plan.drawHeight !== plan.canvasSize) {
			const drawLabel = `${plan.drawWidth}x${plan.drawHeight}`;
			ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
			ctx.fillText(drawLabel, ox + 4, oy + plan.drawHeight * scale - 14);
		}

		// Tile info label (below the canvas)
		const tileLabel = `${tilesPerAxis}x${tilesPerAxis} tiles (z${z})`;
		ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
		ctx.font = '11px monospace';
		const tlw = ctx.measureText(tileLabel).width;
		ctx.fillText(tileLabel, ox + (totalW - tlw) / 2, oy + totalH + 6);
	}

	// Redraw grid whenever plan, zoom, or image changes
	$effect(() => {
		void plan;
		void effectivePreviewZoom;
		void imagePreviewUrl;
		requestAnimationFrame(() => drawTileGrid());
	});

	// ResizeObserver to redraw when container resizes
	$effect(() => {
		if (!previewContainer) return;
		const ro = new ResizeObserver(() => drawTileGrid());
		ro.observe(previewContainer);
		return () => ro.disconnect();
	});

	// -- File handling --

	function handleFiles(files: FileList | null): void {
		if (!files || files.length === 0) return;
		const f = files[0];
		if (!f.type.startsWith('image/')) return;

		imageFile = f;
		phase = 'idle';
		stats = null;
		resultBuffer = null;
		errorMessage = '';
		previewZoom = -1;

		// Revoke old preview URL
		if (imagePreviewUrl) {
			URL.revokeObjectURL(imagePreviewUrl);
			imagePreviewUrl = null;
		}

		// Read dimensions + keep preview URL
		const url = URL.createObjectURL(f);
		imagePreviewUrl = url;
		const img = new Image();
		img.onload = () => {
			imageWidth = img.naturalWidth;
			imageHeight = img.naturalHeight;
		};
		img.onerror = () => {
			if (imagePreviewUrl) {
				URL.revokeObjectURL(imagePreviewUrl);
				imagePreviewUrl = null;
			}
			imageFile = null;
			errorMessage = 'Failed to read image dimensions.';
			phase = 'error';
		};
		img.src = url;
	}

	function onDrop(e: DragEvent): void {
		e.preventDefault();
		draggingOver = false;
		handleFiles(e.dataTransfer?.files ?? null);
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
		handleFiles(input.files);
	}

	// -- Generation --

	function startGeneration(): void {
		if (!imageFile || phase === 'generating' || !plan) return;

		phase = 'generating';
		progressIndex = 0;
		progressTotal = plan.totalTiles;
		progressZoom = 0;
		progressMaxZoom = plan.maxZoom;
		stats = null;
		resultBuffer = null;
		errorMessage = '';

		worker = new Worker(new URL('./tile-generator.worker.ts', import.meta.url), { type: 'module' });

		worker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
			const msg = ev.data;
			switch (msg.type) {
				case 'progress':
					progressZoom = msg.zoom;
					progressMaxZoom = msg.maxZoom;
					progressIndex = msg.tileIndex;
					progressTotal = msg.totalTiles;
					break;
				case 'complete':
					resultBuffer = msg.gtpkBuffer;
					resultFileName = msg.fileName;
					stats = msg.stats;
					phase = 'done';
					cleanupWorker();
					break;
				case 'error':
					errorMessage = msg.message;
					phase = 'error';
					cleanupWorker();
					break;
			}
		};

		worker.onerror = (err) => {
			errorMessage = err.message || 'Worker error';
			phase = 'error';
			cleanupWorker();
		};

		const request: GenerateRequest = {
			type: 'generate',
			imageBlob: imageFile,
			tileSize,
			quality,
			fileName: baseName,
			resizeMode,
		};
		worker.postMessage(request);
	}

	function cleanupWorker(): void {
		worker?.terminate();
		worker = null;
	}

	function downloadResult(): void {
		if (!resultBuffer) return;
		const blob = new Blob([resultBuffer], { type: 'application/octet-stream' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${resultFileName || baseName || 'tiles'}.gtpk`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function reset(): void {
		cleanupWorker();
		imageFile = null;
		imageWidth = 0;
		imageHeight = 0;
		if (imagePreviewUrl) {
			URL.revokeObjectURL(imagePreviewUrl);
			imagePreviewUrl = null;
		}
		previewZoom = -1;
		phase = 'idle';
		stats = null;
		resultBuffer = null;
		errorMessage = '';
		progressIndex = 0;
		progressTotal = 0;
	}

	// -- Lifecycle --

	onMount(() => {
		return () => {
			cleanupWorker();
			if (imagePreviewUrl) {
				URL.revokeObjectURL(imagePreviewUrl);
			}
		};
	});
</script>

<div class="flex h-[calc(100vh-32px)] w-full">
	<!-- Sidebar -->
	<div class="flex w-72 flex-shrink-0 flex-col gap-3 overflow-y-auto border-r border-neutral-700 bg-neutral-900/95 p-3 font-mono text-xs text-neutral-300">
		<h2 class="text-sm font-bold text-neutral-100">Tile Generator</h2>

		{#if imageFile && imageWidth > 0}
			<!-- Image Info -->
			<div class="rounded border border-neutral-700 bg-neutral-800/60 p-2">
				<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-neutral-500">Image</div>
				<div class="flex justify-between"><span class="text-neutral-500">File</span><span class="truncate ml-2 text-neutral-200" title={imageFile.name}>{imageFile.name}</span></div>
				<div class="flex justify-between"><span class="text-neutral-500">Size</span><span class="tabular-nums">{imageWidth} x {imageHeight}</span></div>
				<div class="flex justify-between"><span class="text-neutral-500">File Size</span><span class="tabular-nums">{formatFileSize(imageFile.size)}</span></div>
			</div>

			<!-- Tile Config -->
			<div class="rounded border border-neutral-700 bg-neutral-800/60 p-2">
				<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-neutral-500">Config</div>

				<!-- Tile Size -->
				<div class="flex items-center justify-between">
					<span class="text-neutral-500">Tile Size</span>
					<div class="flex gap-1">
						{#each TILE_SIZE_OPTIONS as ts}
							<button
								onclick={() => { tileSize = ts; }}
								class="rounded px-1.5 py-0.5 text-[10px] transition {tileSize === ts
									? 'bg-cyan-600 text-white'
									: 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600 hover:text-neutral-300'}"
								disabled={phase === 'generating'}
							>{ts}</button>
						{/each}
					</div>
				</div>

				<!-- Resize Mode -->
				<div class="mt-2">
					<span class="text-neutral-500">Resize Mode</span>
					<div class="mt-1 flex flex-col gap-1">
						{#each RESIZE_MODE_OPTIONS as opt}
							{@const disabled =
								(opt.value === 'none' && !noneAvailable) ||
								(opt.value === 'downscale' && !downscaleAvailable)}
							<button
								onclick={() => { if (!disabled) resizeMode = opt.value; }}
								class="rounded px-2 py-1 text-left text-[10px] transition {resizeMode === opt.value
									? 'bg-cyan-600 text-white'
									: disabled
										? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
										: 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600 hover:text-neutral-300'}"
								{disabled}
								title={disabled ? 'Not available for this image/tile size' : opt.description}
							>
								<span class="font-semibold">{opt.label}</span>
								<span class="ml-1 text-[9px] {resizeMode === opt.value ? 'text-cyan-200' : disabled ? 'text-neutral-700' : 'text-neutral-500'}">{opt.description}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- WebP Quality -->
				<div class="mt-2 flex items-center justify-between">
					<span class="text-neutral-500">WebP Quality</span>
					<span class="tabular-nums text-cyan-400">{(quality * 100).toFixed(0)}%</span>
				</div>
				<input
					type="range"
					bind:value={quality}
					min="0.5"
					max="1"
					step="0.05"
					class="mt-0.5 w-full accent-cyan-500"
					disabled={phase === 'generating'}
				/>
			</div>

			<!-- Plan Preview -->
			{#if plan}
				<div class="rounded border border-neutral-700 bg-neutral-800/60 p-2">
					<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-neutral-500">Output</div>
					<div class="flex justify-between"><span class="text-neutral-500">Canvas</span><span class="tabular-nums text-cyan-400">{plan.canvasSize} x {plan.canvasSize}</span></div>
					<div class="flex justify-between"><span class="text-neutral-500">Draw Size</span><span class="tabular-nums">{plan.drawWidth} x {plan.drawHeight}</span></div>
					<div class="flex justify-between"><span class="text-neutral-500">Zoom Levels</span><span class="tabular-nums text-cyan-400">{plan.maxZoom + 1} (0..{plan.maxZoom})</span></div>
					<div class="flex justify-between"><span class="text-neutral-500">Total Tiles</span><span class="tabular-nums text-cyan-400">{plan.totalTiles.toLocaleString()}</span></div>
				</div>
			{/if}

			<!-- Preview Zoom -->
			{#if plan}
				<div class="rounded border border-neutral-700 bg-neutral-800/60 p-2">
					<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-neutral-500">Preview Grid</div>
					<div class="flex items-center justify-between">
						<span class="text-neutral-500">Zoom</span>
						<div class="flex flex-wrap gap-1">
							{#each Array.from({ length: plan.maxZoom + 1 }, (_, i) => i) as z}
								<button
									onclick={() => { previewZoom = z; }}
									class="rounded px-1.5 py-0.5 text-[10px] transition {effectivePreviewZoom === z
										? 'bg-cyan-600 text-white'
										: 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600 hover:text-neutral-300'}"
								>{z}</button>
							{/each}
						</div>
					</div>
					<div class="mt-1 flex justify-between text-[10px]">
						<span class="text-neutral-600">Tiles at z{effectivePreviewZoom}</span>
						<span class="tabular-nums text-neutral-400">{Math.pow(2, effectivePreviewZoom)}x{Math.pow(2, effectivePreviewZoom)} = {Math.pow(4, effectivePreviewZoom)}</span>
					</div>
				</div>
			{/if}

			<!-- Plan Error -->
			{#if planError}
				<div class="rounded border border-amber-700/40 bg-amber-900/20 p-2 text-[10px] text-amber-300">
					{planError}
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex flex-col gap-2">
				{#if phase === 'idle' && plan}
					<button
						onclick={startGeneration}
						class="rounded bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-500 active:bg-cyan-700"
					>
						Generate GTPK
					</button>
				{/if}

				{#if phase === 'done' && resultBuffer}
					<button
						onclick={downloadResult}
						class="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-500 active:bg-green-700"
					>
						Download .gtpk ({formatFileSize(resultBuffer.byteLength)})
					</button>
				{/if}

				{#if phase !== 'generating'}
					<button
						onclick={reset}
						class="rounded border border-neutral-600 px-3 py-1 text-xs text-neutral-400 transition hover:border-neutral-500 hover:text-neutral-300"
					>
						Clear
					</button>
				{/if}
			</div>
		{/if}

		<!-- Progress -->
		{#if phase === 'generating'}
			<div class="rounded border border-neutral-700 bg-neutral-800/60 p-2">
				<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-neutral-500">Progress</div>
				<div class="flex justify-between"><span class="text-neutral-500">Zoom</span><span class="tabular-nums text-cyan-400">{progressZoom} / {progressMaxZoom}</span></div>
				<div class="flex justify-between"><span class="text-neutral-500">Tiles</span><span class="tabular-nums">{progressIndex.toLocaleString()} / {progressTotal.toLocaleString()}</span></div>
				<div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-700">
					<div
						class="h-full rounded-full bg-cyan-500 transition-all duration-150"
						style="width: {progressPercent}%"
					></div>
				</div>
				<div class="mt-1 text-right tabular-nums text-cyan-400">{progressPercent}%</div>
			</div>
		{/if}

		<!-- Stats (after completion) -->
		{#if phase === 'done' && stats}
			<div class="rounded border border-green-700/40 bg-green-900/20 p-2">
				<div class="mb-1 text-[9px] font-semibold uppercase tracking-widest text-green-400">Complete</div>
				<div class="flex justify-between"><span class="text-neutral-500">Canvas</span><span class="tabular-nums text-green-300">{stats.canvasSize}px</span></div>
				<div class="flex justify-between"><span class="text-neutral-500">Tiles</span><span class="tabular-nums text-green-300">{stats.tileCount.toLocaleString()}</span></div>
				<div class="flex justify-between"><span class="text-neutral-500">File Size</span><span class="tabular-nums text-green-300">{stats.fileSizeMb.toFixed(2)} MB</span></div>
				<div class="flex justify-between"><span class="text-neutral-500">Time</span><span class="tabular-nums text-green-300">{(stats.elapsedMs / 1000).toFixed(1)}s</span></div>
			</div>
		{/if}

		<!-- Error -->
		{#if phase === 'error' && errorMessage}
			<div class="rounded border border-red-700/40 bg-red-900/20 p-2 text-red-300">
				{errorMessage}
			</div>
		{/if}
	</div>

	<!-- Main area -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="relative flex flex-1 bg-[#0a0c10]"
		ondrop={onDrop}
		ondragover={onDragOver}
		ondragleave={onDragLeave}
	>
		{#if imagePreviewUrl && imageWidth > 0 && plan}
			<!-- Image preview with tile grid overlay (drawn on canvas) -->
			<div
				bind:this={previewContainer}
				class="relative h-full w-full"
			>
				<canvas
					bind:this={previewCanvas}
					class="absolute inset-0 h-full w-full"
				></canvas>

				<!-- Status overlay -->
				{#if phase === 'generating'}
					<div class="absolute inset-0 flex items-center justify-center bg-black/50">
						<div class="text-center">
							<svg class="mx-auto h-10 w-10 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							<p class="mt-3 text-sm text-neutral-300">Generating tiles...</p>
							<p class="mt-1 text-xs text-neutral-500">Zoom {progressZoom}/{progressMaxZoom} -- {progressPercent}%</p>
						</div>
					</div>
				{:else if phase === 'done'}
					<div class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-green-900/80 px-4 py-2 text-sm text-green-300 backdrop-blur-sm">
						Generation complete -- download from sidebar or drop a new image
					</div>
				{/if}

				<!-- Drag-over highlight -->
				{#if draggingOver}
					<div class="absolute inset-0 flex items-center justify-center bg-cyan-400/10 ring-2 ring-inset ring-cyan-400">
						<p class="text-sm text-cyan-300">Drop to replace image</p>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Empty drop zone -->
			<div class="flex h-full w-full items-center justify-center">
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
					<p class="mt-3 text-sm text-neutral-300">Drop an image here</p>
					<p class="mt-1 text-xs text-neutral-500">PNG, JPG, or WebP -- up to 32768px</p>
					<p class="mt-2 text-xs text-neutral-600">or click to browse</p>
				</div>
			</div>
		{/if}

		<input
			bind:this={fileInput}
			type="file"
			accept="image/png,image/jpeg,image/webp"
			class="hidden"
			onchange={onFileSelect}
		/>
	</div>
</div>

<style>
	input[type='range'] {
		height: 4px;
	}
</style>
