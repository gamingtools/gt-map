/**
 * GridOverlay -- manages the grid canvas overlay that displays tile boundaries.
 */
import * as Coords from '../coords';
import { drawGrid } from './grid';

export interface GridOverlayDeps {
  getContainer(): HTMLElement;
  getZoom(): number;
  getCenter(): { x: number; y: number };
  getImageMaxZoom(): number;
  getMinZoom(): number;
  getMapSize(): { width: number; height: number };
  getTileSize(): number;
  getDpr(): number;
  getZoomSnapThreshold(): number;
  getGridPalette(): { minor: string; major: string; labelBg: string; labelFg: string };
  requestRender(): void;
}

export class GridOverlay {
  private _canvas: HTMLCanvasElement | null = null;
  private _ctx: CanvasRenderingContext2D | null = null;
  private _visible = false;
  private deps: GridOverlayDeps;

  constructor(deps: GridOverlayDeps) {
    this.deps = deps;
  }

  init(): void {
    const c = document.createElement('canvas');
    c.classList.add('gtmap-grid-canvas');
    this._canvas = c;
    c.style.display = 'block';
    c.style.position = 'absolute';
    c.style.left = '0';
    c.style.top = '0';
    c.style.right = '0';
    c.style.bottom = '0';
    c.style.zIndex = '5';
    c.style.pointerEvents = 'none';
    this.deps.getContainer().appendChild(c);
    this._ctx = c.getContext('2d');
    c.style.display = this._visible ? 'block' : 'none';
  }

  setVisible(visible: boolean): void {
    this._visible = !!visible;
    if (this._canvas) {
      this._canvas.style.display = this._visible ? 'block' : 'none';
      if (!this._visible) this._ctx?.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
    this.deps.requestRender();
  }

  get visible(): boolean {
    return this._visible;
  }

  draw(): void {
    if (!this._visible) return;
    const zoom = this.deps.getZoom();
    const center = this.deps.getCenter();
    const imageMaxZoom = this.deps.getImageMaxZoom();
    const minZoom = this.deps.getMinZoom();
    const dpr = this.deps.getDpr();
    const rect = (this.deps.getContainer() as HTMLElement).getBoundingClientRect();
    const widthCSS = rect.width;
    const heightCSS = rect.height;

    const rawTile = Coords.tileZParts(zoom, this.deps.getZoomSnapThreshold());
    const baseZ = Math.max(minZoom, Math.min(rawTile.zInt, imageMaxZoom));
    const scale = Math.pow(2, zoom - baseZ);
    const s = Coords.sFor(imageMaxZoom, baseZ);
    const centerLevel = { x: center.x / s, y: center.y / s };
    let tlWorld = Coords.tlLevelForWithScale(centerLevel, scale, { x: widthCSS, y: heightCSS });
    const snap = (v: number) => Coords.snapLevelToDevice(v, scale, dpr);
    tlWorld = { x: snap(tlWorld.x), y: snap(tlWorld.y) };
    const pal = this.deps.getGridPalette();
    drawGrid(this._ctx, this._canvas, baseZ, scale, widthCSS, heightCSS, tlWorld, dpr, imageMaxZoom, this.deps.getTileSize(), pal);
  }

  resize(w: number, h: number, cssW: number, cssH: number): void {
    if (!this._canvas) return;
    this._canvas.style.width = cssW + 'px';
    this._canvas.style.height = cssH + 'px';
    if (this._canvas.width !== w || this._canvas.height !== h) {
      this._canvas.width = w;
      this._canvas.height = h;
    }
  }

  dispose(): void {
    if (this._canvas) {
      try {
        this._canvas.remove();
      } catch { /* expected: element may already be detached */ }
      this._canvas = null;
      this._ctx = null;
    }
  }
}
