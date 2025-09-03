import { createProgramFromSources } from './program';
import { createUnitQuad } from './quad';

export default class Graphics {
  private map: any;
  constructor(map: any) {
    this.map = map;
  }

  private static detectScreenFormat(gl: WebGLRenderingContext): number {
    try {
      const attrs = (gl as any).getContextAttributes?.();
      return attrs && attrs.alpha === false ? (gl.RGB as number) : (gl.RGBA as number);
    } catch {
      return gl.RGBA as number;
    }
  }

  init() {
    const canvas: HTMLCanvasElement = this.map.canvas;
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
    }) as WebGLRenderingContext | null;
    if (!gl) throw new Error('WebGL not supported');
    this.map.gl = gl;
    gl.clearColor(0.93, 0.93, 0.93, 1);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.map._screenTexFormat = Graphics.detectScreenFormat(gl);
  }

  initPrograms() {
    const gl: WebGLRenderingContext = this.map.gl;
    const vsSrc = `
      attribute vec2 a_pos; uniform vec2 u_translate; uniform vec2 u_size; uniform vec2 u_resolution; varying vec2 v_uv; void main(){ vec2 pixelPos=u_translate + a_pos*u_size; vec2 clip=(pixelPos/u_resolution)*2.0-1.0; clip.y*=-1.0; gl_Position=vec4(clip,0.0,1.0); v_uv=a_pos; }
    `;
    const fsSrc = `
      precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_alpha; uniform vec2 u_uv0; uniform vec2 u_uv1; void main(){ vec2 uv = mix(u_uv0, u_uv1, v_uv); vec4 c=texture2D(u_tex, uv); gl_FragColor=vec4(c.rgb, c.a*u_alpha); }
    `;
    const prog = createProgramFromSources(gl, vsSrc, fsSrc);
    const loc = {
      a_pos: gl.getAttribLocation(prog, 'a_pos'),
      u_translate: gl.getUniformLocation(prog, 'u_translate'),
      u_size: gl.getUniformLocation(prog, 'u_size'),
      u_resolution: gl.getUniformLocation(prog, 'u_resolution'),
      u_tex: gl.getUniformLocation(prog, 'u_tex'),
      u_alpha: gl.getUniformLocation(prog, 'u_alpha'),
      u_uv0: gl.getUniformLocation(prog, 'u_uv0'),
      u_uv1: gl.getUniformLocation(prog, 'u_uv1'),
    } as any;
    const quad = createUnitQuad(gl);
    this.map._prog = prog;
    this.map._loc = loc;
    this.map._quad = quad;
  }

  dispose() {
    const gl: WebGLRenderingContext = this.map.gl;
    try {
      if (this.map._quad) gl.deleteBuffer(this.map._quad);
    } catch {}
    try {
      if (this.map._prog) gl.deleteProgram(this.map._prog);
    } catch {}
  }
}
