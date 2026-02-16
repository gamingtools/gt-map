import {
  GTMap,
  InteractiveLayer,
  StaticLayer,
  TileLayer,
  SvgVisual,
  SpriteVisual,
  TextVisual,
  type SpriteAtlasDescriptor,
  type SpriteAtlasHandle,
} from '@gtmap';

const container = document.getElementById('map') as HTMLDivElement;
const hud = document.getElementById('hud') as HTMLDivElement;
const attribution = document.getElementById('attribution') as HTMLDivElement;

const MAP_SIZE = { width: 8192, height: 6192 };
const MAP_TILES = {
  packUrl: 'https://gtcdn.info/dune/tiles/hb_8k.gtpk',
  tileSize: 256,
  sourceMinZoom: 0,
  sourceMaxZoom: 5,
};
const HOME = { x: MAP_SIZE.width / 2, y: MAP_SIZE.height / 2 };

const map = new GTMap(container, {
  mapSize: MAP_SIZE,
  center: HOME,
  zoom: 2,
  minZoom: MAP_TILES.sourceMinZoom,
  maxZoom: 6,
  fpsCap: 60,
  wrapX: false,
  clipToBounds: true,
  autoResize: true,
  debug: true,
});

// Layers
const tileLayer: TileLayer = map.layers.createTileLayer(MAP_TILES);
map.layers.addLayer(tileLayer, { z: 0 });

const vectorLayer: StaticLayer = map.layers.createStaticLayer();
map.layers.addLayer(vectorLayer, { z: 5 });

const markerLayer: InteractiveLayer = map.layers.createInteractiveLayer();
map.layers.addLayer(markerLayer, { z: 10 });

// -- Icon scale function (same curve as Svelte demo) --
map.view.setIconScaleFunction((zoom) => {
  const maxScale = 1;
  const scale = Math.pow(2, zoom - 3);
  return Math.min(maxScale, Math.max(0.5, scale));
});

// -- SVG Visuals --
const SVG_CDN = 'https://cdn.gaming.tools/gt/game-icons/lorc';

function createSvgVisuals(): SvgVisual[] {
  const icons: SvgVisual[] = [];

  const sword = new SvgVisual(`${SVG_CDN}/broadsword.svg`, 32, {
    fill: '#dc2626',
    stroke: '#ffffff',
    strokeWidth: 2,
    shadow: { blur: 3, offsetY: 2 },
  });
  sword.anchor = 'center';
  icons.push(sword);

  const shield = new SvgVisual(`${SVG_CDN}/bordered-shield.svg`, 32, {
    fill: '#3b82f6',
    stroke: '#fbbf24',
    strokeWidth: 2,
    shadow: { blur: 3, offsetY: 2 },
  });
  shield.anchor = 'center';
  icons.push(shield);

  const crown = new SvgVisual(`${SVG_CDN}/crown.svg`, 32, {
    fill: '#f59e0b',
    stroke: '#78350f',
    strokeWidth: 2,
    shadow: { blur: 3, offsetY: 2 },
  });
  crown.anchor = 'center';
  icons.push(crown);

  const castle = new SvgVisual(`${SVG_CDN}/castle.svg`, 36, {
    fill: '#6b7280',
    stroke: '#1f2937',
    strokeWidth: 2,
    shadow: { blur: 3, offsetY: 2 },
  });
  castle.anchor = 'center';
  icons.push(castle);

  const chest = new SvgVisual(`${SVG_CDN}/locked-chest.svg`, 32, {
    fill: '#92400e',
    stroke: '#451a03',
    strokeWidth: 2,
    shadow: { blur: 3, offsetY: 2 },
  });
  chest.anchor = 'center';
  icons.push(chest);

  const diamond = new SvgVisual(`${SVG_CDN}/cut-diamond.svg`, 66, {
    fill: '#06b6d4',
    stroke: '#000000',
    strokeWidth: 3,
  });
  diamond.anchor = 'center';
  icons.push(diamond);

  return icons;
}

// -- Sprite Atlas --
const ATLAS_CDN = 'https://cdn.gaming.tools/dune/images';

async function loadSpriteAtlas(): Promise<SpriteVisual[]> {
  const resp = await fetch(`${ATLAS_CDN}/atlas.json`);
  const descriptor: SpriteAtlasDescriptor = await resp.json();
  const handle: SpriteAtlasHandle = await markerLayer.loadSpriteAtlas(
    `${ATLAS_CDN}/atlas.png`,
    descriptor,
    'dune',
  );
  const names = Object.keys(handle.spriteIds);
  return names.map((name) => {
    const entry = descriptor.sprites[name];
    const sp = new SpriteVisual(handle, name, {
      width: entry.width / 1.6,
      height: entry.height / 1.6,
    });
    sp.anchor = 'center';
    return sp;
  });
}

// -- Vectors (StaticLayer) --
function addVectors(): void {
  vectorLayer.addPolyline(
    [
      { x: 1000, y: 1000 },
      { x: 2000, y: 1400 },
      { x: 3000, y: 1200 },
    ],
    { color: '#1e90ff', weight: 2, opacity: 0.9 },
  );
  vectorLayer.addPolygon(
    [
      { x: 2600, y: 2600 },
      { x: 3000, y: 3000 },
      { x: 2600, y: 3200 },
      { x: 2300, y: 3000 },
    ],
    {
      color: '#10b981',
      weight: 2,
      opacity: 0.9,
      fill: true,
      fillColor: '#10b981',
      fillOpacity: 0.25,
    },
  );
  vectorLayer.addCircle({ x: HOME.x, y: HOME.y }, 10, {
    color: '#f59e0b',
    weight: 2,
    opacity: 0.9,
    fill: true,
    fillColor: '#f59e0b',
    fillOpacity: 0.5,
  });
}

// -- Text Labels --
function addTextLabels(): void {
  const PAD = 100;

  const label1 = new TextVisual('> TERMINAL_OUTPUT', {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#22c55e',
    backgroundColor: '#0a0a0a',
    padding: 6,
  });
  label1.anchor = 'top-left';
  label1.iconScaleFunction = null;
  markerLayer.addMarker(PAD, PAD, { visual: label1 });

  const label2 = new TextVisual('HEADER', {
    fontSize: 28,
    color: '#1e3a5f',
    backgroundColor: '#e0f2fe',
    padding: 12,
  });
  label2.anchor = 'top-right';
  label2.iconScaleFunction = null;
  markerLayer.addMarker(MAP_SIZE.width - PAD, PAD, { visual: label2 });

  const label3 = new TextVisual('Serif Text', {
    fontSize: 18,
    fontFamily: 'Georgia, serif',
    color: '#7c2d12',
    backgroundColor: '#fef3c7',
    padding: 10,
  });
  label3.anchor = 'bottom-left';
  label3.iconScaleFunction = null;
  markerLayer.addMarker(PAD, MAP_SIZE.height - PAD, { visual: label3 });

  const label4 = new TextVisual('TAG', {
    fontSize: 8,
    color: '#ffffff',
    backgroundColor: '#dc2626',
    padding: 3,
  });
  label4.anchor = 'bottom-right';
  label4.iconScaleFunction = null;
  markerLayer.addMarker(MAP_SIZE.width - PAD, MAP_SIZE.height - PAD, { visual: label4 });

  const label5 = new TextVisual('Plain Large Text', {
    fontSize: 32,
    color: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 2,
  });
  label5.anchor = 'center';
  label5.iconScaleFunction = null;
  markerLayer.addMarker(HOME.x, HOME.y, { visual: label5 });
}

// -- Markers --
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function placeMarkers(svgVisuals: SvgVisual[], spriteVisuals: SpriteVisual[]): void {
  const COUNT = 500;
  const allVisuals = [...svgVisuals, ...spriteVisuals];
  const fallback = svgVisuals[0];

  for (let i = 0; i < COUNT; i++) {
    const x = rand(0, MAP_SIZE.width);
    const y = rand(0, MAP_SIZE.height);
    const visual = allVisuals.length > 0 ? allVisuals[i % allVisuals.length] : fallback;
    markerLayer.addMarker(x, y, { visual, data: { id: i } });
  }

  addTextLabels();
}

// -- Initialize icons + atlas, then place markers --
(async () => {
  try {
    const svgVisuals = createSvgVisuals();
    let spriteVisuals: SpriteVisual[] = [];
    try {
      spriteVisuals = await loadSpriteAtlas();
    } catch (err) {
      console.warn('Sprite atlas load failed:', err);
    }
    placeMarkers(svgVisuals, spriteVisuals);
  } catch (err) {
    console.warn('Icon demo load failed:', err);
  }
})();

// -- Vectors --
addVectors();

// -- HUD --
(() => {
  const state: { prev: number; fps: number } = { prev: 0, fps: 0 };
  const renderHud = (opts?: { now?: number; fromFrame?: boolean }) => {
    const now = opts?.now ?? (performance.now ? performance.now() : Date.now());
    if (opts?.fromFrame) {
      if (!state.prev) state.prev = now;
      const dt = now - state.prev;
      state.prev = now;
      const inst = dt > 0 ? 1000 / dt : 0;
      const alpha = 0.2;
      state.fps = (1 - alpha) * state.fps + alpha * inst;
    }
    const c = map.view.getCenter();
    const p = map.view.getPointerAbs();
    const pText = p ? ` | x ${Math.round(p.x)}, y ${Math.round(p.y)}` : '';
    const z = map.view.getZoom();
    hud.textContent = `x ${c.x.toFixed(2)}, y ${c.y.toFixed(2)} | zoom ${z.toFixed(2)} | fps ${Math.round(state.fps)}${pText}`;
  };
  map.events.on('frame').each((e) => renderHud({ now: e?.now, fromFrame: true }));
  map.events.on('pointermove').each(() => renderHud({ fromFrame: false }));
})();

attribution.textContent = 'Hagga Basin imagery (c) respective owners (game map)';

// -- Center button --
const centerBtn = document.createElement('button');
centerBtn.textContent = 'Center Hagga Basin';
centerBtn.title = 'Recenter the map to Hagga Basin';
Object.assign(centerBtn.style, {
  position: 'absolute',
  left: '8px',
  top: '40px',
  background: 'rgba(255,255,255,0.9)',
  color: '#222',
  border: '1px solid #bbb',
  borderRadius: '4px',
  padding: '6px 8px',
  font: '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif',
  cursor: 'pointer',
  zIndex: '11',
} as CSSStyleDeclaration);
centerBtn.addEventListener('click', async () => {
  await map.view.setView({ center: HOME, animate: { durationMs: 600 } });
});
container.appendChild(centerBtn);

// -- Zoom speed slider --
const speedWrap = document.createElement('div');
Object.assign(speedWrap.style, {
  position: 'absolute',
  left: '8px',
  top: '80px',
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid #bbb',
  borderRadius: '4px',
  padding: '6px 8px',
  font: '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif',
  zIndex: '11',
} as CSSStyleDeclaration);
const speedLabel = document.createElement('label');
speedLabel.textContent = 'Zoom Speed';
speedLabel.style.display = 'block';
speedLabel.style.marginBottom = '4px';
const speedValue = document.createElement('span');
speedValue.textContent = '1.00';
speedValue.style.marginLeft = '6px';
speedValue.style.color = '#333';
const speedRow = document.createElement('div');
speedRow.style.display = 'flex';
speedRow.style.alignItems = 'center';
const speedInput = document.createElement('input');
speedInput.type = 'range';
speedInput.min = '0.05';
speedInput.max = '2.00';
speedInput.step = '0.05';
speedInput.value = '1.00';
speedInput.style.width = '140px';
speedInput.addEventListener('input', () => {
  const val = parseFloat(speedInput.value);
  map.input.setWheelSpeed(val);
  speedValue.textContent = val.toFixed(2);
});
speedRow.appendChild(speedInput);
speedRow.appendChild(speedValue);
speedWrap.appendChild(speedLabel);
speedWrap.appendChild(speedRow);
container.appendChild(speedWrap);

// -- Grid toggle --
const gridWrap = document.createElement('div');
Object.assign(gridWrap.style, {
  position: 'absolute',
  left: '8px',
  top: '130px',
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid #bbb',
  borderRadius: '4px',
  padding: '6px 8px',
  font: '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif',
  zIndex: '11',
} as CSSStyleDeclaration);
const gridLabel = document.createElement('label');
gridLabel.textContent = 'Show Grid';
gridLabel.style.display = 'inline-flex';
gridLabel.style.alignItems = 'center';
gridLabel.style.gap = '6px';
const gridToggle = document.createElement('input');
gridToggle.type = 'checkbox';
gridToggle.checked = true;
map.display.setGridVisible(true);
gridToggle.addEventListener('change', () => {
  map.display.setGridVisible(gridToggle.checked);
});
gridLabel.appendChild(gridToggle);
gridWrap.appendChild(gridLabel);
container.appendChild(gridWrap);

// -- Marker events --
map.events.on('markerenter').each((e) => console.log('markerenter', e));
map.events.on('markerleave').each((e) => console.log('markerleave', e));
map.events.on('markerclick').each((e) => console.log('markerclick', e));

// -- Resize observer --
try {
  const ro = new ResizeObserver(() => {
    map.view.invalidateSize();
  });
  ro.observe(container);
} catch {
  window.addEventListener('resize', () => map.view.invalidateSize());
}
