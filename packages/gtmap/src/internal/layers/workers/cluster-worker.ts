/// <reference lib="webworker" />

import type { MarkerInternal } from '../../../api/types';
import { ClusterEngine } from '../cluster-engine';
import type { ClusterData } from '../cluster-engine';
import type { ClusterWorkerComputeRequest, ClusterWorkerComputeResult, ClusterWorkerError, ClusterWorkerResponse, ClusterWorkerClusterPayload } from '../cluster-worker-protocol';

declare const self: DedicatedWorkerGlobalScope;

const engine = new ClusterEngine();
let markers: MarkerInternal[] = [];

function updateMarkers(markerCount: number, coords?: Float32Array): void {
	if (!coords) return;
	if (coords.length !== markerCount * 2) throw new Error(`cluster-worker: expected ${markerCount * 2} coords, got ${coords.length}`);

	const next: MarkerInternal[] = new Array(markerCount);
	for (let i = 0; i < markerCount; i++) {
		const j = i * 2;
		next[i] = {
			x: coords[j]!,
			y: coords[j + 1]!,
			type: '',
			id: `m_${i}`,
		};
	}
	markers = next;
}

function encodeCluster(cluster: ClusterData): ClusterWorkerClusterPayload {
	const markerIndices = new Uint32Array(cluster.markerIndices);
	const bounds = new Float32Array(cluster.bounds.length * 2);
	for (let i = 0; i < cluster.bounds.length; i++) {
		const p = cluster.bounds[i]!;
		const j = i * 2;
		bounds[j] = p.x;
		bounds[j + 1] = p.y;
	}
	return {
		id: cluster.id,
		x: cluster.x,
		y: cluster.y,
		representativeIndex: cluster.representativeIndex,
		size: cluster.size,
		sourceId: cluster.sourceId,
		sourceZoom: cluster.sourceZoom,
		markerIndices,
		bounds,
	};
}

self.onmessage = (ev: MessageEvent<ClusterWorkerComputeRequest>) => {
	const msg = ev.data;
	if (!msg || msg.type !== 'compute') return;

	try {
		updateMarkers(msg.markerCount, msg.markerCoords);
		const result = engine.compute(markers, msg.zoom, msg.radius, msg.minSize, msg.imageMaxZoom, msg.includeBounds, msg.includeMembers);
		const clusters = result.clusters.map(encodeCluster);
		const singlesIndices = new Uint32Array(result.singlesIndices);

		const transfer: Transferable[] = [singlesIndices.buffer];
		for (const cluster of clusters) {
			transfer.push(cluster.markerIndices.buffer, cluster.bounds.buffer);
		}

		const response: ClusterWorkerComputeResult = {
			type: 'result',
			requestId: msg.requestId,
			clusters,
			singlesIndices,
		};
		self.postMessage(response satisfies ClusterWorkerResponse, transfer);
	} catch (error) {
		const err: ClusterWorkerError = {
			type: 'error',
			requestId: msg.requestId,
			message: error instanceof Error ? error.message : String(error),
		};
		self.postMessage(err satisfies ClusterWorkerResponse);
	}
};
