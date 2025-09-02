// Import the library entry which re-exports the existing JS MapGL for now
import GTMap from '@gtmap';

const container = document.getElementById('map') as HTMLDivElement;
const hud = document.getElementById('hud') as HTMLDivElement;
const attribution = document.getElementById('attribution') as HTMLDivElement;

const HAGGA = {
  url: 'https://gtcdn.info/dune/tiles/hb_8k/{z}/{x}_{y}.webp',
  minZoom: 0,
  maxZoom: 5,
  wrapX: false,
};

const map = new (GTMap as any)(container, {
  center: { lng: 0, lat: 0 },
  zoom: 2,
  minZoom: HAGGA.minZoom,
  maxZoom: HAGGA.maxZoom,
  tileUrl: HAGGA.url,
  wrapX: HAGGA.wrapX,
  freePan: true,
});

function updateHUD() {
  const c = (map as any).center;
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
  const p = (map as any).pointerAbs;
  const pText = p ? ` | x ${Math.round(p.x)}, y ${Math.round(p.y)}` : '';
  hud.textContent = `lng ${c.lng.toFixed(5)}, lat ${c.lat.toFixed(5)} | zoom ${(map as any).zoom.toFixed(2)} | fps ${(updateHUD as any)._fps}${pText}`;
  requestAnimationFrame(updateHUD);
}
updateHUD();

attribution.textContent = 'Hagga Basin tiles © respective owners (game map)';

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
