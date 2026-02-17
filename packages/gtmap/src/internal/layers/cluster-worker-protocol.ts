import type { ClusterData } from './cluster-engine';

export interface ClusterWorkerComputeRequest {
	type: 'compute';
	requestId: number;
	zoom: number;
	radius: number;
	minSize: number;
	imageMaxZoom: number;
	includeBounds: boolean;
	includeMembers: boolean;
	markerCount: number;
	markerCoords?: Float32Array;
}

export interface ClusterWorkerClusterPayload {
	id: string;
	x: number;
	y: number;
	representativeIndex: number;
	size: number;
	sourceId: number;
	sourceZoom: number;
	markerIndices: Uint32Array;
	bounds: Float32Array;
}

export interface ClusterWorkerComputeResult {
	type: 'result';
	requestId: number;
	clusters: ClusterWorkerClusterPayload[];
	singlesIndices: Uint32Array;
}

export interface ClusterWorkerError {
	type: 'error';
	requestId: number;
	message: string;
}

export type ClusterWorkerRequest = ClusterWorkerComputeRequest;
export type ClusterWorkerResponse = ClusterWorkerComputeResult | ClusterWorkerError;

export interface ClusterComputeOutput {
	clusters: ClusterData[];
	singlesIndices: number[];
}

export function decodeWorkerClusters(payloads: readonly ClusterWorkerClusterPayload[]): ClusterData[] {
	return payloads.map((payload) => {
		const markerIndices = Array.from(payload.markerIndices);
		const bounds: { x: number; y: number }[] = [];
		for (let i = 0; i < payload.bounds.length; i += 2) {
			const x = payload.bounds[i];
			const y = payload.bounds[i + 1];
			if (x === undefined || y === undefined) continue;
			bounds.push({ x, y });
		}
		return {
			id: payload.id,
			x: payload.x,
			y: payload.y,
			representativeIndex: payload.representativeIndex,
			markerIndices,
			size: payload.size,
			bounds,
			sourceId: payload.sourceId,
			sourceZoom: payload.sourceZoom,
		};
	});
}
