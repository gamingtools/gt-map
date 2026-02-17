/**
 * Cluster demo -- types, constants, helpers, and initialization logic
 * extracted from the clusters/+page.svelte component.
 */
import {
	GTMap,
	SpriteVisual,
	clusterIconSize,
	type ClusterIconSizeMode,
	type ClusteredLayerOptions,
	type ClusterEventData,
	type MarkerEventData,
	type SpriteAtlasDescriptor,
	type SpriteAtlasHandle,
} from '@gtmap';
import { ClusteredLayer } from '@gtmap';

// -- Types --

export interface ResourceLayerInfo {
	resourceId: string;
	displayName: string;
	color: string;
	layer: ClusteredLayer;
	markerCount: number;
	visible: boolean;
}

interface ActorRecord {
	x: number;
	y: number;
	map_marker_id?: string;
}

// -- Constants --

export const MAP_SIZE = { width: 8192, height: 8192 };
export const MAP_TILES = {
	packUrl: 'https://gtcdn.info/dune/tiles/hb_8k.gtpk',
	tileSize: 256,
	sourceMinZoom: 0,
	sourceMaxZoom: 5,
};
export const HOME = { lng: MAP_SIZE.width / 2, lat: MAP_SIZE.height / 2 };

const ATLAS_CDN = 'https://cdn.gaming.tools/dune/images';
const API_URL = 'https://dune-api-v2.gaming.tools/actors?seed=11&world=survival_1';

const WORLD_MIN_X = -456485;
const WORLD_MAX_X = 355555;
const WORLD_MIN_Y = -457149;
const WORLD_MAX_Y = 344662;

export const LAYER_COLORS: string[] = [
	'#22c55e',
	'#eab308',
	'#ef4444',
	'#f97316',
	'#3b82f6',
	'#8b5cf6',
	'#06b6d4',
	'#ec4899',
];

export const DISPLAY_NAMES: Record<string, string> = {
	primrosefield: 'Primrose Field',
	brittlebush: 'Brittle Bush',
	rhyoliteore: 'Rhyolite Ore',
	scrapmetalwreckage: 'Scrap Metal Wreckage',
	azuriteore: 'Azurite Ore',
	basaltore: 'Basalt Ore',
	dolomiterock: 'Dolomite Rock',
	bauxiteore: 'Bauxite Ore',
	magnetiteore: 'Magnetite Ore',
	fuelcellwreckage: 'Fuel Cell Wreckage',
	erythriteore: 'Erythrite Ore',
	spicefieldsmall: 'Spice Field (Small)',
	jasmiumore: 'Jasmium Ore',
	npcfriendly: 'NPC (Friendly)',
	buriedtreasure: 'Buried Treasure',
	saguaroseed: 'Saguaro Seed',
	lootcontainer: 'Loot Container',
	scrapmetalpart: 'Scrap Metal Part',
	salvagesteel: 'Salvage Steel',
};

// -- Helpers --

export function worldToMap(worldX: number, worldY: number): { x: number; y: number } {
	const mapX = ((worldX - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)) * MAP_SIZE.width;
	const mapY = ((worldY - WORLD_MIN_Y) / (WORLD_MAX_Y - WORLD_MIN_Y)) * MAP_SIZE.height;
	return { x: mapX, y: mapY };
}

export function hexToRgba(hex: string, alpha: number): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r},${g},${b},${alpha})`;
}

export interface BoundaryParams {
	enabled: boolean;
	fill: boolean;
	weight: number;
	opacity: number;
	fillOpacity: number;
}

export function buildBoundaryOpts(color: string, params: BoundaryParams): ClusteredLayerOptions['boundary'] {
	if (!params.enabled) {
		return { fill: false, opacity: 0, weight: 0 };
	}
	return {
		color: hexToRgba(color, 0.4),
		weight: params.weight,
		opacity: params.opacity,
		fill: params.fill,
		fillColor: hexToRgba(color, params.fillOpacity),
		fillOpacity: params.fillOpacity,
	};
}

export function resolveClusterFromMarkerId(markerId: string, layers: ResourceLayerInfo[]): ClusterEventData | null {
	if (!markerId.startsWith('__cl_')) return null;
	const clusterId = markerId.slice('__cl_'.length);
	if (!clusterId) return null;

	for (const info of layers) {
		if (!info.visible) continue;
		const cluster = info.layer.getClusters().find((snapshot) => snapshot.id === clusterId);
		if (!cluster) continue;
		return {
			clusterId: cluster.id,
			size: cluster.size,
			center: { x: cluster.x, y: cluster.y },
			markerIds: cluster.markerIds,
		};
	}
	return null;
}

export function refreshClusterStats(layers: ResourceLayerInfo[]): number {
	let total = 0;
	for (const info of layers) {
		if (!info.visible) continue;
		total += info.layer.getClusters().length;
	}
	return total;
}

// -- Initialization --

export interface InitLayersConfig {
	clusterRadius: number;
	minClusterSize: number;
	sizeTemplate: ClusterIconSizeMode;
	boundaryParams: BoundaryParams;
}

export async function initLayers(
	map: GTMap,
	config: InitLayersConfig,
	onStatus: (msg: string) => void,
): Promise<ResourceLayerInfo[]> {
	onStatus('Fetching actor data...');
	const resp = await fetch(API_URL);
	if (!resp.ok) throw new Error(`API responded with ${resp.status}`);
	const actors: ActorRecord[] = await resp.json();

	onStatus('Grouping by resource type...');
	const groups = new Map<string, { x: number; y: number }[]>();
	for (const actor of actors) {
		const key = actor.map_marker_id;
		if (!key) continue;
		let arr = groups.get(key);
		if (!arr) {
			arr = [];
			groups.set(key, arr);
		}
		arr.push({ x: actor.x, y: actor.y });
	}

	const sorted = [...groups.entries()]
		.sort((a, b) => b[1].length - a[1].length)
		.slice(0, 11);

	onStatus('Loading sprite atlas...');
	const atlasResp = await fetch(`${ATLAS_CDN}/atlas.json`);
	const descriptor: SpriteAtlasDescriptor = await atlasResp.json();

	onStatus('Creating layers in parallel...');
	const buildLayerTasks: Promise<ResourceLayerInfo>[] = sorted.map(async ([resourceId, positions], i) => {
		const color = LAYER_COLORS[i % LAYER_COLORS.length]!;

		const layer = map.layers.createClusteredLayer({
			clusterRadius: config.clusterRadius,
			minClusterSize: config.minClusterSize,
			clusterIconSizeFunction: clusterIconSize(config.sizeTemplate),
			boundary: buildBoundaryOpts(color, config.boundaryParams),
		});
		map.layers.addLayer(layer, { z: 10 + i, opacity: 1 });

		const handle: SpriteAtlasHandle = await layer.loadSpriteAtlas(
			`${ATLAS_CDN}/atlas.png`,
			descriptor,
			`dune_${resourceId}`,
		);

		const entry = descriptor.sprites[resourceId];
		let visual: SpriteVisual;
		if (entry) {
			visual = new SpriteVisual(handle, resourceId, {
				width: entry.width / 1.6,
				height: entry.height / 1.6,
			});
		} else {
			const fallbackName = Object.keys(descriptor.sprites)[0]!;
			const fb = descriptor.sprites[fallbackName]!;
			visual = new SpriteVisual(handle, fallbackName, {
				width: fb.width / 1.6,
				height: fb.height / 1.6,
			});
		}
		visual.anchor = 'center';

		for (const pos of positions) {
			const mapped = worldToMap(pos.x, pos.y);
			layer.addMarker(mapped.x, mapped.y, {
				scale:1 / 1.6,
				visual,
				data: { resource: resourceId },
			});
		}

		return {
			resourceId,
			displayName: DISPLAY_NAMES[resourceId] ?? resourceId,
			color,
			layer,
			markerCount: positions.length,
			visible: true,
		};
	});

	return Promise.all(buildLayerTasks);
}

// -- Events --

export interface MarkerHoverInfo {
	marker: string;
	cluster: ClusterEventData | null;
	screen: { x: number; y: number };
}

export function wireMapEvents(
	map: GTMap,
	layers: () => ResourceLayerInfo[],
	onHover: (info: MarkerHoverInfo | null) => void,
): () => void {
	const unsubs: (() => void)[] = [];

	unsubs.push(
		map.events.on('markerenter', (e: MarkerEventData) => {
			const data = e.marker.data as { resource?: string } | null | undefined;
			const resourceId = data?.resource ?? '';
			const displayName = DISPLAY_NAMES[resourceId] ?? resourceId;
			const clusterMeta = e.cluster ?? resolveClusterFromMarkerId(e.marker.id, layers());
			onHover({
				marker: displayName,
				cluster: clusterMeta,
				screen: e.screen ?? { x: 0, y: 0 },
			});
		}),
	);

	unsubs.push(
		map.events.on('markerleave', () => {
			onHover(null);
		}),
	);

	return () => {
		for (const u of unsubs) {
			try { u(); } catch { /* ignore */ }
		}
	};
}
