import { Map, createMap } from './Map';

// Handlers (stubs) — attach for API parity
class BoxZoom {
	constructor() {
		/* no-op stub */
	}
}
class DoubleClickZoom {
	constructor() {
		/* no-op stub */
	}
}
class Drag {
	constructor() {
		/* no-op stub */
	}
}
class Keyboard {
	constructor() {
		/* no-op stub */
	}
}
class ScrollWheelZoom {
	constructor() {
		/* no-op stub */
	}
}
class TapHold {
	constructor() {
		/* no-op stub */
	}
}
class TouchZoom {
	constructor() {
		/* no-op stub */
	}
}

// Attach as static properties to mirror Leaflet
(Map as any).BoxZoom = BoxZoom;
(Map as any).DoubleClickZoom = DoubleClickZoom;
(Map as any).Drag = Drag;
(Map as any).Keyboard = Keyboard;
(Map as any).ScrollWheelZoom = ScrollWheelZoom;
(Map as any).TapHold = TapHold;
(Map as any).TouchZoom = TouchZoom;

export { Map, createMap as map };
export { default as Layer } from '../../api/layer';
export { LeafletLayerGroupFacade as LayerGroup, createLayerGroup as layerGroup, LeafletFeatureGroupFacade as FeatureGroup, createFeatureGroup as featureGroup } from '../../api/layerGroup';

export * from '../layer/index';
