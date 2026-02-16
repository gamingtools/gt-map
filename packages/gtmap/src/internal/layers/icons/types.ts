import type { IconScaleFunction } from '../../../api/types';

export type MarkerRenderData = {
	id: string;
	x: number;
	y: number;
	type: string;
	size?: number;
	rotation?: number;
	/** Per-marker icon scale function override (undefined = use map's, null = no scaling) */
	iconScaleFunction?: IconScaleFunction | null;
};

export interface IconSizeProvider {
	getSize(type: string): { w: number; h: number };
	getAnchor(type: string): { ax: number; ay: number };
}

export interface IconMeta {
	iconPath: string;
	x2IconPath?: string;
	width: number;
	height: number;
	anchorX: number;
	anchorY: number;
}
