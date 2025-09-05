<script lang="ts">
  import { onMount } from 'svelte';

  type TestResult = {
    method: string;
    ok: boolean;
    message: string;
  };

  let url = $state('https://gtcdn.info/dune/1.1.20.0/images/map-icons/player.webp');
  let results = $state<TestResult[]>([]);
  let running = $state(false);

  async function testFetchCreateImageBitmap(u: string): Promise<TestResult> {
    try {
      const r = await fetch(u, { mode: 'cors', credentials: 'omit' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none' as any, colorSpaceConversion: 'none' as any } as any);
      // Draw to canvas and try to read back 1x1
      const cnv = document.createElement('canvas');
      cnv.width = 1; cnv.height = 1;
      const ctx = cnv.getContext('2d')!;
      ctx.drawImage(bmp, 0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1);
      (bmp as any).close?.();
      return { method: 'fetch + createImageBitmap + getImageData', ok: !!data, message: 'Readable via CORS' };
    } catch (err: any) {
      return { method: 'fetch + createImageBitmap + getImageData', ok: false, message: err?.message || String(err) };
    }
  }

  async function testImageElement(u: string): Promise<TestResult> {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('img load failed'));
        img.src = u;
      });
      const cnv = document.createElement('canvas');
      cnv.width = 1; cnv.height = 1;
      const ctx = cnv.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1);
      return { method: 'HTMLImageElement (crossOrigin=anonymous) + getImageData', ok: !!data, message: 'Readable via CORS' };
    } catch (err: any) {
      return { method: 'HTMLImageElement (crossOrigin=anonymous) + getImageData', ok: false, message: err?.message || String(err) };
    }
  }

  async function testImageElementNoCors(u: string): Promise<TestResult> {
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('img load failed'));
        img.src = u;
      });
      const cnv = document.createElement('canvas');
      cnv.width = 1; cnv.height = 1;
      const ctx = cnv.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 1, 1);
      // This will throw if cross-origin without CORS
      const data = ctx.getImageData(0, 0, 1, 1);
      return { method: 'HTMLImageElement (no crossOrigin) + getImageData', ok: !!data, message: 'Readable (same-origin or CORS not required)' };
    } catch (err: any) {
      return { method: 'HTMLImageElement (no crossOrigin) + getImageData', ok: false, message: err?.message || String(err) };
    }
  }

  async function run() {
    results = [];
    running = true;
    try {
      const r1 = await testFetchCreateImageBitmap(url);
      const r2 = await testImageElement(url);
      const r3 = await testImageElementNoCors(url);
      results = [r1, r2, r3];
    } finally {
      running = false;
    }
  }

  onMount(() => {
    // auto-run once
    run();
  });
</script>

<div class="wrap">
  <div class="card">
    <div class="row">
      <label for="url">Image URL</label>
      <input id="url" type="text" bind:value={url} />
      <button disabled={running} onclick={run}>Test</button>
    </div>
    <div class="sep"></div>
    <div class="results">
      {#each results as r}
        <div class="result {r.ok ? 'ok' : 'fail'}">
          <div class="method">{r.method}</div>
          <div class="msg">{r.ok ? 'OK' : 'FAIL'} — {r.message}</div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .wrap { padding: 16px; color: #e5e7eb; background: #0f0f0f; min-height: 100vh; box-sizing: border-box; }
  .card { max-width: 920px; margin: 0 auto; background: #171717; border: 1px solid #262626; border-radius: 8px; padding: 12px; }
  .row { display: flex; gap: 8px; align-items: center; }
  label { min-width: 80px; color: #d1d5db; }
  input { flex: 1; padding: 6px 8px; background: #0f0f0f; color: #e5e7eb; border: 1px solid #374151; border-radius: 4px; }
  button { padding: 6px 10px; background: #2563eb; border: 1px solid #1d4ed8; color: white; border-radius: 4px; cursor: pointer; }
  button[disabled] { opacity: 0.6; cursor: default; }
  .sep { height: 8px; }
  .results { display: grid; gap: 8px; }
  .result { padding: 8px; border-radius: 6px; background: #111827; border: 1px solid #1f2937; }
  .result.ok { border-color: #065f46; }
  .result.fail { border-color: #7f1d1d; }
  .method { font-weight: 600; color: #e5e7eb; margin-bottom: 4px; }
  .msg { color: #9ca3af; font-size: 12px; }
</style>

