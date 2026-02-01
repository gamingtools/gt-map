/**
 * GtpkReader -- reads a GTPK tile pack (single binary containing an entire tile pyramid).
 *
 * Binary format:
 *   Header (16 bytes):
 *     4 bytes  - magic "GTPK"
 *     4 bytes  - version (uint32 LE, must be 1)
 *     4 bytes  - tile count (uint32 LE)
 *     4 bytes  - tile size in pixels (uint32 LE)
 *   Index (13 bytes per tile):
 *     1 byte   - z (zoom level)
 *     2 bytes  - x (uint16 LE)
 *     2 bytes  - y (uint16 LE)
 *     4 bytes  - offset from file start (uint32 LE)
 *     4 bytes  - data length (uint32 LE)
 *   Data:
 *     concatenated WebP blobs
 */

const HEADER_SIZE = 16;
const INDEX_ENTRY_SIZE = 13;
const MAGIC = 0x4b505447; // "GTPK" as uint32 LE

export class GtpkReader {
	private buffer: ArrayBuffer | null = null;
	private index = new Map<string, { offset: number; length: number }>();
	private _ready = false;
	private _loading = false;
	private _error: string | null = null;
	private _readyPromise: Promise<void>;
	private _resolveReady!: () => void;
	private _rejectReady!: (err: Error) => void;

	/** Number of tiles in the pack. */
	tileCount = 0;
	/** Tile size in pixels (from pack header). */
	tileSize = 0;

	constructor() {
		this._readyPromise = new Promise<void>((resolve, reject) => {
			this._resolveReady = resolve;
			this._rejectReady = reject;
		});
	}

	/** True once the pack has been fetched and parsed. */
	get ready(): boolean {
		return this._ready;
	}

	/** True while the pack is being fetched. */
	get loading(): boolean {
		return this._loading;
	}

	/** Error message if fetch/parse failed. */
	get error(): string | null {
		return this._error;
	}

	/** Resolves when the pack is ready (or rejects on error). */
	get whenReady(): Promise<void> {
		return this._readyPromise;
	}

	/** Fetch and parse a GTPK file from the given URL. */
	async load(url: string): Promise<void> {
		if (this._ready || this._loading) return;
		this._loading = true;

		try {
			const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
			if (!res.ok) throw new Error(`GTPK fetch failed: HTTP ${res.status}`);

			const buf = await res.arrayBuffer();
			this.parse(buf);
			this._ready = true;
			this._resolveReady();
		} catch (err) {
			this._error = (err as Error).message;
			this._rejectReady(err as Error);
			throw err;
		} finally {
			this._loading = false;
		}
	}

	private parse(buf: ArrayBuffer): void {
		const view = new DataView(buf);

		// Validate magic
		const magic = view.getUint32(0, true);
		if (magic !== MAGIC) {
			throw new Error(`GTPK: invalid magic 0x${magic.toString(16)}, expected 0x${MAGIC.toString(16)}`);
		}

		const version = view.getUint32(4, true);
		if (version !== 1) {
			throw new Error(`GTPK: unsupported version ${version}`);
		}

		this.tileCount = view.getUint32(8, true);
		this.tileSize = view.getUint32(12, true);

		// Parse index
		const indexStart = HEADER_SIZE;
		for (let i = 0; i < this.tileCount; i++) {
			const base = indexStart + i * INDEX_ENTRY_SIZE;
			const z = view.getUint8(base);
			const x = view.getUint16(base + 1, true);
			const y = view.getUint16(base + 3, true);
			const offset = view.getUint32(base + 5, true);
			const length = view.getUint32(base + 9, true);

			const key = `${z}/${x}/${y}`;
			this.index.set(key, { offset, length });
		}

		this.buffer = buf;
	}

	/** Check whether a tile exists in the pack. */
	has(key: string): boolean {
		return this.index.has(key);
	}

	/** Get a tile as a Blob (WebP). Returns null if not found or not ready. */
	getBlob(key: string): Blob | null {
		if (!this._ready || !this.buffer) return null;
		const entry = this.index.get(key);
		if (!entry) return null;
		const slice = this.buffer.slice(entry.offset, entry.offset + entry.length);
		return new Blob([slice], { type: 'image/webp' });
	}

	/** Release the buffer and index. */
	destroy(): void {
		this.buffer = null;
		this.index.clear();
		this._ready = false;
		this.tileCount = 0;
		this.tileSize = 0;
	}
}
