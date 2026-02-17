/// <reference lib="webworker" />

import {
  computeCanvasPlan,
  calculateTotalTiles,
  type GenerateRequest,
  type WorkerMessage,
} from './tile-generator';

declare const self: DedicatedWorkerGlobalScope;

// ── GTPK constants ─────────────────────────────────────────────────────

const GTPK_MAGIC = 0x4b505447; // "GTPK" little-endian
const GTPK_VERSION = 1;
const HEADER_SIZE = 16;
const INDEX_ENTRY_SIZE = 13;

// ── Entry point ────────────────────────────────────────────────────────

self.onmessage = async (ev: MessageEvent<GenerateRequest>) => {
  const msg = ev.data;
  if (!msg || msg.type !== 'generate') return;

  try {
    await generate(msg);
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};

function post(msg: WorkerMessage, transfer?: Transferable[]): void {
  self.postMessage(msg, { transfer: transfer ?? [] });
}

// ── Generator ──────────────────────────────────────────────────────────

async function generate(req: GenerateRequest): Promise<void> {
  const t0 = performance.now();
  const { tileSize, quality, fileName, resizeMode } = req;

  // 1. Decode image
  const srcBitmap = await createImageBitmap(req.imageBlob);
  const w = srcBitmap.width;
  const h = srcBitmap.height;

  // 2. Compute canvas plan based on resize mode
  const plan = computeCanvasPlan(w, h, tileSize, resizeMode);
  const { canvasSize, drawWidth, drawHeight, maxZoom, totalTiles } = plan;

  // 3. Create padded square canvas (black background, image at top-left)
  const padded = new OffscreenCanvas(canvasSize, canvasSize);
  const pCtx = padded.getContext('2d')!;
  pCtx.fillStyle = '#000000';
  pCtx.fillRect(0, 0, canvasSize, canvasSize);

  // Draw image: always top-left (0,0), sized according to resize mode
  if (drawWidth === w && drawHeight === h) {
    // No resize needed (pad / none modes)
    pCtx.drawImage(srcBitmap, 0, 0);
  } else {
    // Scale to drawWidth x drawHeight (upscale / downscale modes)
    pCtx.drawImage(srcBitmap, 0, 0, drawWidth, drawHeight);
  }
  srcBitmap.close();

  // Get an ImageBitmap of the padded canvas for createImageBitmap cropping
  const paddedBitmap = await createImageBitmap(padded);

  // 4. Generate tiles per zoom level
  const tiles: { z: number; x: number; y: number; data: ArrayBuffer }[] = [];
  let processedCount = 0;

  // Reusable tile canvas for encoding
  const tileCanvas = new OffscreenCanvas(tileSize, tileSize);
  const tileCtx = tileCanvas.getContext('2d')!;

  for (let z = 0; z <= maxZoom; z++) {
    const tilesPerAxis = Math.pow(2, z);
    const regionSize = canvasSize / tilesPerAxis;

    for (let x = 0; x < tilesPerAxis; x++) {
      for (let y = 0; y < tilesPerAxis; y++) {
        const sx = x * regionSize;
        const sy = y * regionSize;

        // Crop and resize using createImageBitmap (hardware-accelerated)
        const tileBitmap = await createImageBitmap(paddedBitmap, sx, sy, regionSize, regionSize, {
          resizeWidth: tileSize,
          resizeHeight: tileSize,
          resizeQuality: 'high',
        });

        // Draw to tile canvas and encode as WebP
        tileCtx.clearRect(0, 0, tileSize, tileSize);
        tileCtx.drawImage(tileBitmap, 0, 0);
        tileBitmap.close();

        const blob = await tileCanvas.convertToBlob({
          type: 'image/webp',
          quality,
        });
        const buf = await blob.arrayBuffer();
        tiles.push({ z, x, y, data: buf });

        processedCount++;
        // Send progress every tile
        post({
          type: 'progress',
          zoom: z,
          maxZoom,
          tileIndex: processedCount,
          totalTiles,
        });
      }
    }
  }

  paddedBitmap.close();

  // 5. Assemble GTPK binary
  const gtpkBuffer = packGtpk(tiles, tileSize);
  const elapsedMs = performance.now() - t0;

  post(
    {
      type: 'complete',
      gtpkBuffer,
      fileName,
      stats: {
        tileCount: tiles.length,
        fileSizeMb: gtpkBuffer.byteLength / 1024 / 1024,
        zoomLevels: maxZoom,
        elapsedMs,
        canvasSize,
      },
    },
    [gtpkBuffer],
  );
}

// ── GTPK packer ────────────────────────────────────────────────────────

function packGtpk(
  tiles: { z: number; x: number; y: number; data: ArrayBuffer }[],
  tileSize: number,
): ArrayBuffer {
  const tileCount = tiles.length;
  const indexSize = INDEX_ENTRY_SIZE * tileCount;
  const dataOffset = HEADER_SIZE + indexSize;

  // Calculate total data size
  let totalDataSize = 0;
  for (const t of tiles) totalDataSize += t.data.byteLength;

  const totalSize = dataOffset + totalDataSize;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Header (16 bytes, all little-endian)
  view.setUint32(0, GTPK_MAGIC, true);
  view.setUint32(4, GTPK_VERSION, true);
  view.setUint32(8, tileCount, true);
  view.setUint32(12, tileSize, true);

  // Index + Data
  let currentOffset = dataOffset;
  let indexPos = HEADER_SIZE;

  for (const t of tiles) {
    // Index entry (13 bytes)
    view.setUint8(indexPos, t.z);
    view.setUint16(indexPos + 1, t.x, true);
    view.setUint16(indexPos + 3, t.y, true);
    view.setUint32(indexPos + 5, currentOffset, true);
    view.setUint32(indexPos + 9, t.data.byteLength, true);
    indexPos += INDEX_ENTRY_SIZE;

    // Copy tile data
    bytes.set(new Uint8Array(t.data), currentOffset);
    currentOffset += t.data.byteLength;
  }

  return buffer;
}
