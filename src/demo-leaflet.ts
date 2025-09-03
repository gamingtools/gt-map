import { GT } from '@gtmap';

const container = document.getElementById('map') as HTMLDivElement;
const map = GT.L.map(container, {
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  minZoom: 1,
  maxZoom: 19,
  wrapX: true,
});

GT.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map as any);

const icon = GT.L.icon({ iconUrl: 'https://tile.openstreetmap.org/markers/marker-icon.png', iconRetinaUrl: 'https://tile.openstreetmap.org/markers/marker-icon-2x.png', iconSize: [25, 41] });
GT.L.marker([0, 0], { icon }).addTo(map as any);

map.setView([0, 0], 2);

