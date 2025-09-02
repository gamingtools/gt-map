import MapGL from './mapgl.js';

// Basic bootstrap
const container = document.getElementById('map');
const hud = document.getElementById('hud');
const attribution = document.getElementById('attribution');

// Hagga Basin (survival_1) only
const HAGGA = {
  url: 'https://gtcdn.info/dune/tiles/hb_8k/{z}/{x}_{y}.webp',
  minZoom: 0,
  maxZoom: 5,
  wrapX: false,
};

const map = new MapGL(container, {
  center: { lng: 0, lat: 0 },
  zoom: 2,
  minZoom: HAGGA.minZoom,
  maxZoom: HAGGA.maxZoom,
  tileUrl: HAGGA.url,
  wrapX: HAGGA.wrapX,
  freePan: true,
});

function updateHUD() {
  const c = map.center;
  // FPS meter (smoothed, updates ~2x/sec)
  if (!updateHUD._t) {
    updateHUD._t = performance.now();
    updateHUD._frames = 0;
    updateHUD._acc = 0;
    updateHUD._fps = 0;
  }
  const now = performance.now();
  const dt = now - updateHUD._t;
  updateHUD._t = now;
  updateHUD._acc += dt;
  updateHUD._frames += 1;
  if (updateHUD._acc >= 500) { // 0.5s window
    updateHUD._fps = Math.round((updateHUD._frames * 1000) / updateHUD._acc);
    updateHUD._frames = 0;
    updateHUD._acc = 0;
  }
  const p = map.pointerAbs;
  const pText = p ? ` | x ${Math.round(p.x)}, y ${Math.round(p.y)}` : '';
  hud.textContent = `lng ${c.lng.toFixed(5)}, lat ${c.lat.toFixed(5)} | zoom ${map.zoom.toFixed(2)} | fps ${updateHUD._fps}${pText}`;
  requestAnimationFrame(updateHUD);
}
updateHUD();

// Static attribution for Hagga
attribution.textContent = 'Hagga Basin tiles © respective owners (game map)';

// Pan-to-center control
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
centerBtn.style.font = '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif';
centerBtn.style.cursor = 'pointer';
centerBtn.style.zIndex = '11';
centerBtn.addEventListener('click', () => map.recenter());
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
speedWrap.style.font = '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif';
speedWrap.style.zIndex = '11';

const speedLabel = document.createElement('label');
speedLabel.textContent = 'Zoom Speed';
speedLabel.style.display = 'block';
speedLabel.style.marginBottom = '4px';

const speedValue = document.createElement('span');
speedValue.textContent = `${map.wheelSpeed.toFixed(2)}`;
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
speedInput.value = String(map.wheelSpeed);
speedInput.style.width = '140px';
speedInput.addEventListener('input', () => {
  const val = parseFloat(speedInput.value);
  const ctrl = Math.max(val, val * 2); // ctrl speed >= normal speed
  map.setWheelSpeed(val, ctrl);
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
gridWrap.style.font = '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif';
gridWrap.style.zIndex = '11';

const gridLabel = document.createElement('label');
gridLabel.textContent = 'Show Grid';
gridLabel.style.display = 'inline-flex';
gridLabel.style.alignItems = 'center';
gridLabel.style.gap = '6px';

const gridToggle = document.createElement('input');
gridToggle.type = 'checkbox';
gridToggle.checked = !!map.showGrid;
gridToggle.addEventListener('change', () => map.setGridVisible(gridToggle.checked));

gridLabel.appendChild(gridToggle);
gridWrap.appendChild(gridLabel);
container.appendChild(gridWrap);

// Zoom anchor mode selector
const anchorWrap = document.createElement('div');
anchorWrap.style.position = 'absolute';
anchorWrap.style.left = '8px';
anchorWrap.style.top = '170px';
anchorWrap.style.background = 'rgba(255,255,255,0.9)';
anchorWrap.style.border = '1px solid #bbb';
anchorWrap.style.borderRadius = '4px';
anchorWrap.style.padding = '6px 8px';
anchorWrap.style.font = '12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif';
anchorWrap.style.zIndex = '11';

const anchorLabel = document.createElement('label');
anchorLabel.textContent = 'Zoom Anchor';
anchorLabel.style.display = 'block';
anchorLabel.style.marginBottom = '4px';

const anchorSelect = document.createElement('select');
const optPointer = document.createElement('option'); optPointer.value = 'pointer'; optPointer.textContent = 'Pointer';
const optCenter = document.createElement('option'); optCenter.value = 'center'; optCenter.textContent = 'Center';
anchorSelect.appendChild(optPointer);
anchorSelect.appendChild(optCenter);
anchorSelect.value = map.anchorMode || 'pointer';
anchorSelect.addEventListener('change', () => {
  map.setAnchorMode(anchorSelect.value);
});

anchorWrap.appendChild(anchorLabel);
anchorWrap.appendChild(anchorSelect);
container.appendChild(anchorWrap);
