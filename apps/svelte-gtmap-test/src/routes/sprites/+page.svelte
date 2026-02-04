<script lang="ts">
  import { tick } from 'svelte';
  import { packSprites, type SpriteInput, type PackedSprite } from '$lib/sprite-packer';

  type SpriteEntry = {
    id: string;
    name: string;
    dataUrl: string;
    width: number;
    height: number;
    anchorX: number;
    anchorY: number;
    tags: string;
    image: HTMLImageElement;
  };

  let sprites: SpriteEntry[] = $state([]);
  let padding = $state(1);
  let maxWidth = $state(2048);
  let packedResult: { sprites: PackedSprite[]; width: number; height: number } | null =
    $state(null);
  let previewCanvas: HTMLCanvasElement | null = $state(null);
  let dragOver = $state(false);
  let idSeq = 0;

  function addFiles(files: FileList | File[]) {
    const fileArr = Array.from(files);
    for (const file of fileArr) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const id = `s${++idSeq}`;
          const name = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
          sprites = [
            ...sprites,
            {
              id,
              name,
              dataUrl,
              width: img.naturalWidth,
              height: img.naturalHeight,
              anchorX: Math.round(img.naturalWidth / 2),
              anchorY: Math.round(img.naturalHeight / 2),
              tags: '',
              image: img,
            },
          ];
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) addFiles(input.files);
    input.value = '';
  }

  function removeSprite(id: string) {
    sprites = sprites.filter((s) => s.id !== id);
  }

  async function generate() {
    if (sprites.length === 0) return;

    const inputs: SpriteInput[] = sprites.map((s) => ({
      id: s.id,
      name: s.name,
      width: s.width,
      height: s.height,
      anchorX: s.anchorX,
      anchorY: s.anchorY,
      tags: s.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      image: s.image,
    }));

    const result = packSprites(inputs, padding, maxWidth);
    packedResult = result;

    // Wait for Svelte to mount the canvas (it's inside {#if packedResult})
    await tick();

    // Draw to preview canvas
    if (previewCanvas && result.width > 0 && result.height > 0) {
      previewCanvas.width = result.width;
      previewCanvas.height = result.height;
      const ctx = previewCanvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, result.width, result.height);

      // Draw sprites
      for (const sp of result.sprites) {
        ctx.drawImage(sp.image, sp.x, sp.y, sp.width, sp.height);
      }
    }
  }

  function downloadPng() {
    if (!previewCanvas) return;
    previewCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'atlas.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  function downloadJson() {
    if (!packedResult) return;

    const descriptor = {
      version: 1,
      meta: {
        image: 'atlas.png',
        size: { width: packedResult.width, height: packedResult.height },
        format: 'RGBA8888',
        generator: 'gtmap-sprite-generator',
        generatedAt: new Date().toISOString(),
      },
      sprites: Object.fromEntries(
        packedResult.sprites.map((sp) => [
          sp.name,
          {
            x: sp.x,
            y: sp.y,
            width: sp.width,
            height: sp.height,
            anchorX: sp.anchorX,
            anchorY: sp.anchorY,
            tags: sp.tags,
            metadata: {},
          },
        ]),
      ),
    };

    const json = JSON.stringify(descriptor, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'atlas.json';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>Sprite Atlas Generator</title>
</svelte:head>

<div class="flex h-[calc(100vh-2rem)] flex-col bg-panel text-data">
  <!-- Top bar -->
  <div class="flex items-center gap-4 border-b border-panel-border px-4 py-2">
    <h1 class="text-sm font-semibold text-data-bright">Sprite Atlas Generator</h1>
    <div class="flex items-center gap-2 text-xs">
      <label class="flex items-center gap-1 text-data-dim">Padding
        <input
          type="number"
          class="hud-number w-14 rounded border border-input-border bg-input-bg px-1.5 py-0.5 text-xs text-data-bright outline-none focus:border-input-focus"
          bind:value={padding}
          min="0"
          max="32"
        />
      </label>
      <label class="ml-2 flex items-center gap-1 text-data-dim">Max width
        <input
          type="number"
          class="hud-number w-18 rounded border border-input-border bg-input-bg px-1.5 py-0.5 text-xs text-data-bright outline-none focus:border-input-focus"
          bind:value={maxWidth}
          min="64"
          max="4096"
          step="64"
        />
      </label>
    </div>
    <div class="ml-auto flex gap-2">
      <button
        class="rounded border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1 text-xs font-semibold text-accent-cyan transition hover:bg-accent-cyan/20 disabled:opacity-30"
        onclick={generate}
        disabled={sprites.length === 0}
      >
        Generate Atlas
      </button>
      {#if packedResult}
        <button
          class="rounded border border-accent-green/30 bg-accent-green/10 px-3 py-1 text-xs font-semibold text-accent-green transition hover:bg-accent-green/20"
          onclick={downloadPng}
        >
          Download PNG
        </button>
        <button
          class="rounded border border-accent-amber/30 bg-accent-amber/10 px-3 py-1 text-xs font-semibold text-accent-amber transition hover:bg-accent-amber/20"
          onclick={downloadJson}
        >
          Download JSON
        </button>
      {/if}
    </div>
  </div>

  <div class="flex min-h-0 flex-1">
    <!-- Left panel: upload + sprite list -->
    <div class="hud-scroll flex w-80 flex-shrink-0 flex-col border-r border-panel-border overflow-y-auto">
      <!-- Upload zone -->
      <div
        class="m-2 flex flex-col items-center justify-center rounded border-2 border-dashed p-6 text-center transition {dragOver
          ? 'border-accent-cyan bg-accent-cyan/5'
          : 'border-panel-border-hi'}"
        ondrop={handleDrop}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        role="button"
        tabindex="0"
      >
        <p class="text-xs text-data-dim">Drop images here</p>
        <p class="mt-1 text-[10px] text-data-dim">PNG, WebP, JPEG</p>
        <label
          class="mt-2 cursor-pointer rounded border border-panel-border-hi px-3 py-1 text-xs text-data transition hover:border-accent-cyan hover:text-accent-cyan"
        >
          Browse files
          <input type="file" accept="image/*" multiple class="hidden" onchange={handleFileInput} />
        </label>
      </div>

      <!-- Sprite list -->
      {#if sprites.length > 0}
        <div class="px-2 pb-2">
          <div class="mb-1 text-[10px] font-semibold tracking-wider text-data-dim uppercase">
            Sprites ({sprites.length})
          </div>
          {#each sprites as sprite (sprite.id)}
            <div
              class="mb-1.5 rounded border border-panel-border bg-panel-surface p-2"
            >
              <div class="flex items-start gap-2">
                <img
                  src={sprite.dataUrl}
                  alt={sprite.name}
                  class="h-10 w-10 flex-shrink-0 rounded border border-panel-border object-contain"
                  style="image-rendering: pixelated;"
                />
                <div class="min-w-0 flex-1">
                  <input
                    type="text"
                    class="mb-1 w-full rounded border border-input-border bg-input-bg px-1.5 py-0.5 text-xs text-data-bright outline-none focus:border-input-focus"
                    bind:value={sprite.name}
                    placeholder="name"
                  />
                  <div class="flex gap-1 text-[10px] text-data-dim">
                    <span>{sprite.width}x{sprite.height}</span>
                  </div>
                  <div class="mt-1 flex items-center gap-1 text-[10px]">
                    <label class="flex items-center gap-0.5 text-data-dim">aX
                      <input
                        type="number"
                        class="hud-number w-10 rounded border border-input-border bg-input-bg px-1 py-0 text-[10px] text-data-bright outline-none focus:border-input-focus"
                        bind:value={sprite.anchorX}
                        min="0"
                        max={sprite.width}
                      />
                    </label>
                    <label class="ml-1 flex items-center gap-0.5 text-data-dim">aY
                      <input
                        type="number"
                        class="hud-number w-10 rounded border border-input-border bg-input-bg px-1 py-0 text-[10px] text-data-bright outline-none focus:border-input-focus"
                        bind:value={sprite.anchorY}
                        min="0"
                        max={sprite.height}
                      />
                    </label>
                  </div>
                  <div class="mt-1">
                    <input
                      type="text"
                      class="w-full rounded border border-input-border bg-input-bg px-1.5 py-0 text-[10px] text-data outline-none focus:border-input-focus"
                      bind:value={sprite.tags}
                      placeholder="tags (comma separated)"
                    />
                  </div>
                </div>
                <button
                  class="flex-shrink-0 rounded px-1.5 py-0.5 text-xs text-accent-red transition hover:bg-accent-red/10"
                  onclick={() => removeSprite(sprite.id)}
                  title="Remove"
                >
                  x
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Right panel: atlas preview -->
    <div class="hud-scroll flex flex-1 flex-col items-center overflow-auto bg-[#080a0e] p-4">
      {#if packedResult}
        <div class="mb-2 text-xs text-data-dim">
          Atlas: {packedResult.width} x {packedResult.height} px -- {packedResult.sprites.length} sprites
        </div>
        <div
          class="inline-block border border-panel-border"
          style="background-image: linear-gradient(45deg, #1a1a2e 25%, transparent 25%),
            linear-gradient(-45deg, #1a1a2e 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #1a1a2e 75%),
            linear-gradient(-45deg, transparent 75%, #1a1a2e 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0px;"
        >
          <canvas
            bind:this={previewCanvas}
            style="display: block; image-rendering: pixelated;"
          ></canvas>
        </div>
      {:else}
        <div class="flex h-full items-center justify-center text-sm text-data-dim">
          {#if sprites.length === 0}
            Upload images to get started
          {:else}
            Click "Generate Atlas" to pack sprites
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
