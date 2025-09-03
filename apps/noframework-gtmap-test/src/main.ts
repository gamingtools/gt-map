// Use Leaflet-compatible facade as the default API
import GT from '@gtmap';
const L = GT.L;
const container = document.getElementById('map') as HTMLDivElement;
const hud = document.getElementById('hud') as HTMLDivElement;
const attribution = document.getElementById('attribution') as HTMLDivElement;

const HAGGA = {
  url: 'https://gtcdn.info/dune/tiles/hb_8k/{z}/{x}_{y}.webp',
  minZoom: 0,
  maxZoom: 5,
  wrapX: false,
};

const HOME = { lng: 4096, lat: 4096 };
const map = L.map(container, {
  center: HOME,
  zoom: 2,
  minZoom: HAGGA.minZoom,
  maxZoom: HAGGA.maxZoom,
  fpsCap: 60,
} as any);
L.tileLayer(HAGGA.url, {
  minZoom: HAGGA.minZoom,
  maxZoom: HAGGA.maxZoom,
  tileSize: 256,
  tms: false,
}).addTo(map as any);

// HUD updates on actual render frames (engine emits 'frame')
(() => {
  const state: any = { prev: 0, fps: 0 };
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
    const cArr = map.getCenter() as [number, number];
    const c = { lng: cArr[1], lat: cArr[0] };
    const p = map.pointerAbs as { x: number; y: number } | null;
    const pText = p ? ` | x ${Math.round(p.x)}, y ${Math.round(p.y)}` : '';
    const z = map.getZoom() as number;
    hud.textContent = `lng ${c.lng.toFixed(5)}, lat ${c.lat.toFixed(5)} | zoom ${z.toFixed(2)} | fps ${Math.round(state.fps)}${pText}`;
  };
  map.events.on('frame').each((e: any) => renderHud({ now: e?.now, fromFrame: true }));
  map.events.on('pointermove').each(() => renderHud({ fromFrame: false }));
})();

attribution.textContent = 'Hagga Basin tiles © respective owners (game map)';

// Load sample icon definitions and place a few markers using L.marker
(async () => {
  try {
    const url = new URL('./sample-data/MapIcons.json', import.meta.url);
    const defs = await fetch(url).then((r) => r.json());
    // Build Leaflet-style icon objects from the defs
    const icons: Record<string, any> = {};
    Object.keys(defs).forEach((k) => {
      const d = (defs as any)[k];
      icons[k] = L.icon({
        iconUrl: d.iconPath,
        iconRetinaUrl: d.x2IconPath,
        iconSize: [d.width, d.height],
      });
    });
    // Optionally add markers via L.marker (no fixed markers at center)
    // A moderate number of random markers using L.marker
    const keys = Object.keys(icons);
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const COUNT = 500;
    for (let i = 0; i < COUNT; i++) {
      const key = keys[(Math.random() * keys.length) | 0];
      L.marker([rand(0, 8192), rand(0, 8192)], { icon: icons[key] }).addTo(map as any);
    }
  } catch (err) {
    console.warn('Icon demo load failed:', err);
  }
})();

const centerBtn = document.createElement('button');
centerBtn.textContent = 'Center Hagga Basin';
centerBtn.title = 'Recenter the map to Hagga Basin';
centerBtn.style.position = 'absolute';
centerBtn.style.left = '8px';
centerBtn.style.top = '40px';
centerBtn.style.background = 'rgba(255,255,255,0.9)';
centerBtn.style.color = '#222';
centerBtn.style.border = '1px solid #bbb';
centerBtn.style.borderRadius = '4px';
centerBtn.style.padding = '6px 8px';
centerBtn.style.font =
  '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif';
centerBtn.style.cursor = 'pointer';
centerBtn.style.zIndex = '11';
centerBtn.addEventListener('click', () => map.setView([HOME.lat, HOME.lng], map.getZoom()));
container.appendChild(centerBtn);

// Zoom speed control
const speedWrap = document.createElement('div');
speedWrap.style.position = 'absolute';
speedWrap.style.left = '8px';
speedWrap.style.top = '80px';
speedWrap.style.background = 'rgba(255,255,255,0.9)';
speedWrap.style.border = '1px solid #bbb';
speedWrap.style.borderRadius = '4px';
speedWrap.style.padding = '6px 8px';
speedWrap.style.font =
  '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif';
speedWrap.style.zIndex = '11';
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

// Grid toggle
const gridWrap = document.createElement('div');
gridWrap.style.position = 'absolute';
gridWrap.style.left = '8px';
gridWrap.style.top = '130px';
gridWrap.style.background = 'rgba(255,255,255,0.9)';
gridWrap.style.border = '1px solid #bbb';
gridWrap.style.borderRadius = '4px';
gridWrap.style.padding = '6px 8px';
gridWrap.style.font =
  '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif';
gridWrap.style.zIndex = '11';
const gridLabel = document.createElement('label');
gridLabel.textContent = 'Show Grid';
gridLabel.style.display = 'inline-flex';
gridLabel.style.alignItems = 'center';
gridLabel.style.gap = '6px';
const gridToggle = document.createElement('input');
gridToggle.type = 'checkbox';
gridToggle.checked = true;
// Create a Leaflet-like grid layer and add/remove via checkbox
const gridLayer = L.grid();
gridLayer.addTo(map as any);
gridToggle.addEventListener('change', () => {
  if (gridToggle.checked) gridLayer.addTo(map as any);
  else gridLayer.remove();
});
gridLabel.appendChild(gridToggle);
gridWrap.appendChild(gridLabel);
container.appendChild(gridWrap);

// Anchor mode selector removed (no public API yet)

// Invalidate map size when the container resizes
try {
  const ro = new ResizeObserver(() => {
    map.invalidateSize();
  });
  ro.observe(container);
} catch {
  // Fallback to window resize
  window.addEventListener('resize', () => map.invalidateSize());
}
