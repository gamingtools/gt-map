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

const map = L.map(container, {
  center: { lng: 4096, lat: 4096 },
  zoom: 2,
  minZoom: HAGGA.minZoom,
  maxZoom: HAGGA.maxZoom,
} as any);
L.tileLayer(HAGGA.url, { minZoom: HAGGA.minZoom, maxZoom: HAGGA.maxZoom, tileSize: 256, tms: false }).addTo(map as any);


function updateHUD() {
  const cArr = (map as any).getCenter() as [number, number];
  const c = { lng: cArr[1], lat: cArr[0] };
  if (!(updateHUD as any)._t) {
    (updateHUD as any)._t = performance.now();
    (updateHUD as any)._frames = 0;
    (updateHUD as any)._acc = 0;
    (updateHUD as any)._fps = 0;
  }
  const now = performance.now();
  const dt = now - (updateHUD as any)._t;
  (updateHUD as any)._t = now;
  (updateHUD as any)._acc += dt;
  (updateHUD as any)._frames += 1;
  if ((updateHUD as any)._acc >= 500) {
    (updateHUD as any)._fps = Math.round(
      ((updateHUD as any)._frames * 1000) / (updateHUD as any)._acc,
    );
    (updateHUD as any)._frames = 0;
    (updateHUD as any)._acc = 0;
  }
  const p = (map as any).pointerAbs as { x: number; y: number } | null;
  const pText = p ? ` | x ${Math.round(p.x)}, y ${Math.round(p.y)}` : '';
  const z = (map as any).getZoom() as number;
  hud.textContent = `lng ${c.lng.toFixed(5)}, lat ${c.lat.toFixed(5)} | zoom ${z.toFixed(2)} | fps ${(updateHUD as any)._fps}${pText}`;
  requestAnimationFrame(updateHUD);
}
updateHUD();

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
      icons[k] = L.icon({ iconUrl: d.iconPath, iconRetinaUrl: d.x2IconPath, iconSize: [d.width, d.height] });
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
centerBtn.addEventListener('click', () => (map as any).recenter());
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
  (map as any).setWheelSpeed(val);
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
gridToggle.addEventListener('change', () => (map as any).setGridVisible(gridToggle.checked));
gridLabel.appendChild(gridToggle);
gridWrap.appendChild(gridLabel);
container.appendChild(gridWrap);

// Anchor mode selector
const anchorWrap = document.createElement('div');
anchorWrap.style.position = 'absolute';
anchorWrap.style.left = '8px';
anchorWrap.style.top = '170px';
anchorWrap.style.background = 'rgba(255,255,255,0.9)';
anchorWrap.style.border = '1px solid #bbb';
anchorWrap.style.borderRadius = '4px';
anchorWrap.style.padding = '6px 8px';
anchorWrap.style.font =
  '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif';
anchorWrap.style.zIndex = '11';
const anchorLabel = document.createElement('label');
anchorLabel.textContent = 'Zoom Anchor';
anchorLabel.style.display = 'block';
anchorLabel.style.marginBottom = '4px';
const anchorSelect = document.createElement('select');
const optPointer = document.createElement('option');
optPointer.value = 'pointer';
optPointer.textContent = 'Pointer';
const optCenter = document.createElement('option');
optCenter.value = 'center';
optCenter.textContent = 'Center';
anchorSelect.appendChild(optPointer);
anchorSelect.appendChild(optCenter);
anchorSelect.value = 'pointer';
anchorSelect.addEventListener('change', () => {
  (map as any).setAnchorMode(anchorSelect.value as 'pointer' | 'center');
});
anchorWrap.appendChild(anchorLabel);
anchorWrap.appendChild(anchorSelect);
container.appendChild(anchorWrap);
