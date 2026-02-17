import type { MarkerInternal } from '../../api/types';
import type { ClusterWorkerRequest, ClusterWorkerResponse, ClusterComputeOutput, ClusterWorkerComputeRequest } from './cluster-worker-protocol';
import { decodeWorkerClusters } from './cluster-worker-protocol';

interface ClusterWorkerClientDeps {
	debugWarn(msg: string, err?: unknown): void;
}

export interface ClusterWorkerComputeInput {
	markers: MarkerInternal[];
	markersChanged: boolean;
	zoom: number;
	radius: number;
	minSize: number;
	imageMaxZoom: number;
	includeBounds: boolean;
	includeMembers: boolean;
}

export class ClusterWorkerClient {
	private _deps: ClusterWorkerClientDeps;
	private _worker: Worker | null = null;
	private _enabled = false;
	private _busy = false;
	private _nextRequestId = 1;
	private _inflightRequestId = 0;
	private _inflightOnResult: ((output: ClusterComputeOutput) => void) | null = null;
	private _queued: { input: ClusterWorkerComputeInput; onResult: (output: ClusterComputeOutput) => void } | null = null;

	constructor(deps: ClusterWorkerClientDeps) {
		this._deps = deps;
		this._initWorker();
	}

	get enabled(): boolean {
		return this._enabled;
	}

	private _initWorker(): void {
		try {
			if (typeof Worker === 'undefined') return;
			const srcMode = /[/\\]src[/\\]/.test(import.meta.url);
			const workerUrl = srcMode ? new URL('./workers/cluster-worker.ts', import.meta.url) : new URL('./internal/layers/workers/cluster-worker.js', import.meta.url);
			const worker = new Worker(workerUrl, { type: 'module' });
			worker.onmessage = (ev: MessageEvent<ClusterWorkerResponse>) => this._handleWorkerMessage(ev.data);
			worker.onerror = (e: ErrorEvent) => {
				this._deps.debugWarn('cluster worker error', e.error ?? e.message);
				this.dispose();
			};
			this._worker = worker;
			this._enabled = true;
		} catch (e) {
			this._deps.debugWarn('cluster worker init', e);
			this._worker = null;
			this._enabled = false;
		}
	}

	request(input: ClusterWorkerComputeInput, onResult: (output: ClusterComputeOutput) => void): void {
		if (!this._enabled || !this._worker) return;
		this._queued = { input, onResult };
		this._pump();
	}

	private _pump(): void {
		if (this._busy || !this._worker || !this._queued) return;
		const { input, onResult } = this._queued;
		this._queued = null;

		const transfer: Transferable[] = [];
		let markerCoords: Float32Array | undefined;
		if (input.markersChanged) {
			markerCoords = new Float32Array(input.markers.length * 2);
			for (let i = 0; i < input.markers.length; i++) {
				const marker = input.markers[i]!;
				const j = i * 2;
				markerCoords[j] = marker.x;
				markerCoords[j + 1] = marker.y;
			}
			transfer.push(markerCoords.buffer);
		}

		const requestId = this._nextRequestId++;
		const request: ClusterWorkerComputeRequest = {
			type: 'compute',
			requestId,
			zoom: input.zoom,
			radius: input.radius,
			minSize: input.minSize,
			imageMaxZoom: input.imageMaxZoom,
			includeBounds: input.includeBounds,
			includeMembers: input.includeMembers,
			markerCount: input.markers.length,
			...(markerCoords ? { markerCoords } : {}),
		};

		this._busy = true;
		this._inflightRequestId = requestId;
		this._inflightOnResult = onResult;
		this._worker.postMessage(request satisfies ClusterWorkerRequest, transfer);
	}

	private _handleWorkerMessage(msg: ClusterWorkerResponse): void {
		if (!this._busy) return;
		if (msg.requestId !== this._inflightRequestId) return;

		this._busy = false;
		const onResult = this._inflightOnResult;
		this._inflightOnResult = null;

		if (msg.type === 'error') {
			this._deps.debugWarn('cluster worker compute', msg.message);
		} else if (onResult) {
			onResult({
				clusters: decodeWorkerClusters(msg.clusters),
				singlesIndices: Array.from(msg.singlesIndices),
			});
		}

		this._pump();
	}

	dispose(): void {
		try {
			this._worker?.terminate();
		} catch {
			/* noop */
		}
		this._worker = null;
		this._enabled = false;
		this._busy = false;
		this._inflightRequestId = 0;
		this._inflightOnResult = null;
		this._queued = null;
	}
}
