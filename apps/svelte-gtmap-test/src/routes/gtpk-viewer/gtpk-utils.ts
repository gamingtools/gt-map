/**
 * Lightweight GTPK header parser -- extracts metadata from a .gtpk file
 * without loading the full tile data into the GTMap library.
 */

const HEADER_SIZE = 16;
const INDEX_ENTRY_SIZE = 13;
const MAGIC = 0x4b505447; // "GTPK" as uint32 LE

export interface GtpkInfo {
  tileCount: number;
  tileSize: number;
  /** Highest zoom level found in the index. */
  maxZoom: number;
  /** Lowest zoom level found in the index. */
  minZoom: number;
  /** Computed map size in pixels: tileSize * 2^maxZoom. */
  mapSize: number;
}

/**
 * Parse a GTPK file's header and index to extract metadata.
 * Reads only the header + index bytes (not the tile data blobs).
 */
export function parseGtpkHeader(buffer: ArrayBuffer): GtpkInfo {
  const view = new DataView(buffer);

  if (buffer.byteLength < HEADER_SIZE) {
    throw new Error('GTPK: file too small for header');
  }

  const magic = view.getUint32(0, true);
  if (magic !== MAGIC) {
    throw new Error(`GTPK: invalid magic 0x${magic.toString(16)}, expected 0x${MAGIC.toString(16)}`);
  }

  const version = view.getUint32(4, true);
  if (version !== 1) {
    throw new Error(`GTPK: unsupported version ${version}`);
  }

  const tileCount = view.getUint32(8, true);
  const tileSize = view.getUint32(12, true);

  // Scan index entries to find min/max zoom
  const indexEnd = HEADER_SIZE + tileCount * INDEX_ENTRY_SIZE;
  if (buffer.byteLength < indexEnd) {
    throw new Error('GTPK: file too small for index');
  }

  let minZoom = 255;
  let maxZoom = 0;
  for (let i = 0; i < tileCount; i++) {
    const z = view.getUint8(HEADER_SIZE + i * INDEX_ENTRY_SIZE);
    if (z < minZoom) minZoom = z;
    if (z > maxZoom) maxZoom = z;
  }

  if (tileCount === 0) {
    minZoom = 0;
    maxZoom = 0;
  }

  const mapSize = tileSize * Math.pow(2, maxZoom);

  return { tileCount, tileSize, maxZoom, minZoom, mapSize };
}

/** Human-readable file size. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
