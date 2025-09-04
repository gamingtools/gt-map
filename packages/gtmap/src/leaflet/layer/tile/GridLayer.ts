import { LeafletGridLayerFacade as BaseGridLayer, type GridLayerOptions } from '../../../adapters/grid';

export class GridLayer extends BaseGridLayer {}

export function gridLayer(options?: GridLayerOptions): GridLayer {
	return new GridLayer(options);
}

// Public types and compatibility alias
export type { GridLayerOptions };
export type LeafletGridLayerFacade = GridLayer;
