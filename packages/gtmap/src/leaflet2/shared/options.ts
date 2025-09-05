// Shared option types mirroring Leaflet 2.0 public API (simplified)

// Base layer options available on most display layers
export type LayerOptions = {
  pane?: string;
  attribution?: string;
  interactive?: boolean;
};

// Options commonly present on interactive layers (Marker/Path etc.)
export type InteractiveLayerOptions = {
  keyboard?: boolean;
  bubblingPointerEvents?: boolean;
  autoPanOnFocus?: boolean;
};

// Base control options
export type ControlOptions = {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright' | string;
};

