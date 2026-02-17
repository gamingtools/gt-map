// ── Types ──────────────────────────────────────────────────────────────

/**
 * How the image is fitted onto the tile-pyramid canvas.
 *
 * - `pad`       -- keep original pixel size, pad remainder with black (top-left anchor)
 * - `upscale`   -- scale image UP so the larger dimension matches the next power-of-2 canvas
 * - `downscale` -- scale image DOWN so the larger dimension matches the previous power-of-2 canvas
 * - `none`      -- no resize at all; only available when the image already fits a valid canvas size
 */
export type ResizeMode = 'pad' | 'upscale' | 'downscale' | 'none';

export const RESIZE_MODE_OPTIONS: { value: ResizeMode; label: string; description: string }[] = [
  { value: 'pad',       label: 'Pad',       description: 'Keep original size, fill remainder with black' },
  { value: 'upscale',   label: 'Upscale',   description: 'Scale up to fit next power-of-2 canvas' },
  { value: 'downscale', label: 'Downscale',  description: 'Scale down to fit previous power-of-2 canvas' },
  { value: 'none',      label: 'None',       description: 'No resize (only if dimensions already valid)' },
];

export const TILE_SIZE_OPTIONS = [128, 256, 512] as const;

/** Main thread -> Worker */
export interface GenerateRequest {
  type: 'generate';
  imageBlob: Blob;
  tileSize: number;
  quality: number;
  fileName: string;
  resizeMode: ResizeMode;
}

/** Worker -> Main thread */
export type WorkerMessage = ProgressMessage | CompleteMessage | ErrorMessage;

export interface ProgressMessage {
  type: 'progress';
  zoom: number;
  maxZoom: number;
  tileIndex: number;
  totalTiles: number;
}

export interface CompleteMessage {
  type: 'complete';
  gtpkBuffer: ArrayBuffer;
  fileName: string;
  stats: GenerationStats;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export interface GenerationStats {
  tileCount: number;
  fileSizeMb: number;
  zoomLevels: number;
  elapsedMs: number;
  canvasSize: number;
}

// ── Canvas size computation ───────────────────────────────────────────

/**
 * All valid canvas sizes: tileSize * 2^n.
 * For tileSize=256: [256, 512, 1024, 2048, 4096, 8192, 16384, 32768]
 */
export function getValidCanvasSizes(tileSize: number): number[] {
  const sizes: number[] = [];
  let s = tileSize;
  while (s <= 32768) {
    sizes.push(s);
    s *= 2;
  }
  return sizes;
}

/** Smallest valid canvas size >= dimension. */
export function ceilCanvasSize(dimension: number, tileSize: number): number {
  const sizes = getValidCanvasSizes(tileSize);
  for (const s of sizes) {
    if (s >= dimension) return s;
  }
  throw new Error(`Image too large: ${dimension}px (max ${sizes[sizes.length - 1]})`);
}

/** Largest valid canvas size <= dimension. Returns 0 if dimension < tileSize. */
export function floorCanvasSize(dimension: number, tileSize: number): number {
  const sizes = getValidCanvasSizes(tileSize);
  let result = 0;
  for (const s of sizes) {
    if (s <= dimension) result = s;
    else break;
  }
  return result;
}

/** Check if a dimension is exactly a valid canvas size (tileSize * 2^n). */
export function isValidCanvasSize(dimension: number, tileSize: number): boolean {
  if (dimension < tileSize || dimension > 32768) return false;
  return Number.isInteger(Math.log2(dimension / tileSize));
}

export interface CanvasPlan {
  /** The square canvas size (always tileSize * 2^maxZoom). */
  canvasSize: number;
  /** How the image is drawn onto the canvas. */
  drawWidth: number;
  drawHeight: number;
  /** Max zoom level. */
  maxZoom: number;
  /** Total tile count across all zoom levels. */
  totalTiles: number;
}

/**
 * Compute the canvas plan for a given image and settings.
 * The image is always placed at top-left (0,0).
 */
export function computeCanvasPlan(
  imageWidth: number,
  imageHeight: number,
  tileSize: number,
  resizeMode: ResizeMode,
): CanvasPlan {
  const maxDim = Math.max(imageWidth, imageHeight);
  let canvasSize: number;
  let drawWidth: number;
  let drawHeight: number;

  switch (resizeMode) {
    case 'pad':
      canvasSize = ceilCanvasSize(maxDim, tileSize);
      drawWidth = imageWidth;
      drawHeight = imageHeight;
      break;

    case 'upscale':
      canvasSize = ceilCanvasSize(maxDim, tileSize);
      // Scale so the larger dimension fills the canvas, maintaining aspect ratio
      if (imageWidth >= imageHeight) {
        drawWidth = canvasSize;
        drawHeight = Math.round(imageHeight * (canvasSize / imageWidth));
      } else {
        drawHeight = canvasSize;
        drawWidth = Math.round(imageWidth * (canvasSize / imageHeight));
      }
      break;

    case 'downscale': {
      canvasSize = floorCanvasSize(maxDim, tileSize);
      if (canvasSize === 0) {
        throw new Error(`Image too small to downscale with tile size ${tileSize}px`);
      }
      // Scale so the larger dimension matches the canvas
      if (imageWidth >= imageHeight) {
        drawWidth = canvasSize;
        drawHeight = Math.round(imageHeight * (canvasSize / imageWidth));
      } else {
        drawHeight = canvasSize;
        drawWidth = Math.round(imageWidth * (canvasSize / imageHeight));
      }
      break;
    }

    case 'none':
      if (!isValidCanvasSize(maxDim, tileSize)) {
        throw new Error(
          `Cannot use "none" resize: max dimension ${maxDim}px is not a valid canvas size ` +
          `(must be ${tileSize} * 2^n). Valid sizes: ${getValidCanvasSizes(tileSize).join(', ')}`,
        );
      }
      canvasSize = maxDim;
      drawWidth = imageWidth;
      drawHeight = imageHeight;
      break;
  }

  const maxZoom = Math.round(Math.log2(canvasSize / tileSize));
  const totalTiles = calculateTotalTiles(maxZoom);

  return { canvasSize, drawWidth, drawHeight, maxZoom, totalTiles };
}

// ── General helpers ───────────────────────────────────────────────────

/** Check if "none" resize mode is available for this image + tile size. */
export function isNoneResizeAvailable(imageWidth: number, imageHeight: number, tileSize: number): boolean {
  const maxDim = Math.max(imageWidth, imageHeight);
  return isValidCanvasSize(maxDim, tileSize);
}

/** Check if "downscale" is available (image must be >= tileSize). */
export function isDownscaleAvailable(imageWidth: number, imageHeight: number, tileSize: number): boolean {
  return floorCanvasSize(Math.max(imageWidth, imageHeight), tileSize) > 0;
}

/** Total tile count across all zoom levels 0..maxZoom. */
export function calculateTotalTiles(maxZoom: number): number {
  let total = 0;
  for (let z = 0; z <= maxZoom; z++) {
    const tilesPerAxis = Math.pow(2, z);
    total += tilesPerAxis * tilesPerAxis;
  }
  return total;
}

/** Human-readable file size. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
