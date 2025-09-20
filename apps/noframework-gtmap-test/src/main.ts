import { GTMap } from '@gtmap';

const container = document.getElementById('map') as HTMLDivElement;
const hud = document.getElementById('hud') as HTMLDivElement;
const attribution = document.getElementById('attribution') as HTMLDivElement;

const HAGGA = {
  image: {
    url: 'https://gtcdn.info/dune/tiles/hb_8k.webp',
    width: 8192,
    height: 8192,
    preview: { url: 'https://gtcdn.info/dune/tiles/hb_1k.webp', width: 1024, height: 1024 },
  },
  minZoom: 0,
  maxZoom: 5,
  wrapX: false,
};
const HOME = { x: HAGGA.image.width / 2, y: HAGGA.image.height / 2 };
const map = new GTMap(container, {
  // Initial view
  center: HOME,
  zoom: 2,
  minZoom: HAGGA.minZoom,
  maxZoom: 10,
  fpsCap: 60,
  image: HAGGA.image,
  wrapX: HAGGA.wrapX,
});

// HUD updates on actual render frames (engine emits 'frame')
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
    const c = map.getCenter();
    const p = map.pointerAbs;
    const pText = p ? ` | x ${Math.round(p.x)}, y ${Math.round(p.y)}` : '';
    const z = map.getZoom();
    hud.textContent = `x ${c.x.toFixed(2)}, y ${c.y.toFixed(2)} | zoom ${z.toFixed(2)} | fps ${Math.round(state.fps)}${pText}`;
  };
  map.events.on('frame').each((e) => renderHud({ now: e?.now, fromFrame: true }));
  map.events.on('pointermove').each(() => renderHud({ fromFrame: false }));
})();

attribution.textContent = 'Hagga Basin imagery © respective owners (game map)';

// Load sample icon definitions and place a few markers using GTMap API
(async () => {
  try {
    const url = new URL('./sample-data/MapIcons.json', import.meta.url);
    const defs: Record<string, { iconPath: string; x2IconPath?: string; width: number; height: number }> = await fetch(url).then((r) => r.json());
    const handles: string[] = [];
    Object.keys(defs).forEach((k) => {
      const d = defs[k];
      const h = map.addIcon({ iconPath: d.iconPath, x2IconPath: d.x2IconPath, width: d.width, height: d.height });
      handles.push(h.id);
    });
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const COUNT = 500;
    for (let i = 0; i < COUNT; i++) {
      const iconId = handles[(Math.random() * handles.length) | 0];
      const rotation = Math.random() < 0.3 ? Math.round(rand(0, 360)) : undefined;
      map.addMarker(rand(0, HAGGA.image.width), rand(0, HAGGA.image.height), { icon: { id: iconId }, rotation });
    }
  } catch (err) {
    console.warn('Icon demo load failed:', err);
  }
})();

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
  font:
    '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif',
  cursor: 'pointer',
  zIndex: '11',
} as CSSStyleDeclaration);
centerBtn.addEventListener('click', async () => {
  await map.transition().center(HOME).apply({ animate: { durationMs: 600 } });
});
container.appendChild(centerBtn);

// Zoom speed control
const speedWrap = document.createElement('div');
Object.assign(speedWrap.style, {
  position: 'absolute',
  left: '8px',
  top: '80px',
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid #bbb',
  borderRadius: '4px',
  padding: '6px 8px',
  font:
    '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif',
  zIndex: '11',
} as CSSStyleDeclaration);
const speedLabel = document.createElement('label');
speedLabel.textContent = 'Zoom Speed';
speedLabel.style.display = 'block';
speedLabel.style.marginBottom = '4px';
const speedValue = document.createElement('span');
speedValue.textContent = `1.00`;
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
  map.setWheelSpeed(val);
  speedValue.textContent = val.toFixed(2);
});
speedRow.appendChild(speedInput);
speedRow.appendChild(speedValue);
speedWrap.appendChild(speedLabel);
speedWrap.appendChild(speedRow);
container.appendChild(speedWrap);

// Grid toggle (uses map.setGridVisible)
const gridWrap = document.createElement('div');
Object.assign(gridWrap.style, {
  position: 'absolute',
  left: '8px',
  top: '130px',
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid #bbb',
  borderRadius: '4px',
  padding: '6px 8px',
  font:
    '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif',
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
map.setGridVisible(true);
gridToggle.addEventListener('change', () => {
  map.setGridVisible(gridToggle.checked);
});
gridLabel.appendChild(gridToggle);
gridWrap.appendChild(gridLabel);
container.appendChild(gridWrap);

// Marker events demo
map.events.on('markerenter').each((e) => console.log('markerenter', e));
map.events.on('markerleave').each((e) => console.log('markerleave', e));
map.events.on('markerclick').each((e) => console.log('markerclick', e));

// Invalidate map size when the container resizes
try {
  const ro = new ResizeObserver(() => {
    map.invalidateSize();
  });
  ro.observe(container);
} catch {
  window.addEventListener('resize', () => map.invalidateSize());
}
