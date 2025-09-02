import { detectScreenFormat } from './context';
import { initPrograms } from './programs';

export default class Graphics {
  private map: any;
  constructor(map: any) { this.map = map; }

  init() {
    const canvas: HTMLCanvasElement = this.map.canvas;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false }) as WebGLRenderingContext | null;
    if (!gl) throw new Error('WebGL not supported');
    this.map.gl = gl;
    gl.clearColor(0.93, 0.93, 0.93, 1);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.map._screenTexFormat = detectScreenFormat(gl);
  }

  initPrograms() {
    const { prog, loc, quad } = initPrograms(this.map.gl);
    this.map._prog = prog;
    this.map._loc = loc;
    this.map._quad = quad;
  }

  dispose() {
    const gl: WebGLRenderingContext = this.map.gl;
    try { if (this.map._quad) gl.deleteBuffer(this.map._quad); } catch {}
    try { if (this.map._prog) gl.deleteProgram(this.map._prog); } catch {}
  }
}

