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
    // Match app's dark theme to avoid white flashes between tile draws
    gl.clearColor(0.10, 0.10, 0.10, 1);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.map._screenTexFormat = Graphics.detectScreenFormat(gl);
  }

  initPrograms() {
    const gl: WebGLRenderingContext = this.map.gl;
    const vsSrc = `
      attribute vec2 a_pos;
      uniform vec2 u_translate; uniform vec2 u_size; uniform vec2 u_resolution;
      varying vec2 v_uv;
      void main(){
        vec2 pixelPos=u_translate + a_pos*u_size;
        vec2 clip=(pixelPos/u_resolution)*2.0-1.0;
        clip.y*=-1.0; gl_Position=vec4(clip,0.0,1.0); v_uv=a_pos;
      }
    `;
    const fsSrc = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform float u_alpha;
      uniform vec2 u_uv0; uniform vec2 u_uv1;
      uniform vec2 u_texel; // 1/texture size in px
      uniform int u_filterMode; // 0=linear(default), 1=bicubic

      float w0(float a){ return (1.0/6.0)*(a*(a*(-a+3.0)-3.0)+1.0); }
      float w1(float a){ return (1.0/6.0)*(a*a*(3.0*a-6.0)+4.0); }
      float w2(float a){ return (1.0/6.0)*(a*(a*(-3.0*a+3.0)+3.0)+1.0); }
      float w3(float a){ return (1.0/6.0)*(a*a*a); }

      vec4 texBicubic(sampler2D tex, vec2 uv, vec2 texel){
        vec2 st = uv / texel - 0.5;
        vec2 i_st = floor(st);
        vec2 f = fract(st);
        vec2 base = (i_st - 1.0 + 0.5) * texel;
        float wx0 = w0(1.0 - f.x), wx1 = w1(1.0 - f.x), wx2 = w2(1.0 - f.x), wx3 = w3(1.0 - f.x);
        float wy0 = w0(1.0 - f.y), wy1 = w1(1.0 - f.y), wy2 = w2(1.0 - f.y), wy3 = w3(1.0 - f.y);
        vec4 row0 = texture2D(tex, base + texel*vec2(0.0,0.0))*wx0 + texture2D(tex, base + texel*vec2(1.0,0.0))*wx1 + texture2D(tex, base + texel*vec2(2.0,0.0))*wx2 + texture2D(tex, base + texel*vec2(3.0,0.0))*wx3;
        vec4 row1 = texture2D(tex, base + texel*vec2(0.0,1.0))*wx0 + texture2D(tex, base + texel*vec2(1.0,1.0))*wx1 + texture2D(tex, base + texel*vec2(2.0,1.0))*wx2 + texture2D(tex, base + texel*vec2(3.0,1.0))*wx3;
        vec4 row2 = texture2D(tex, base + texel*vec2(0.0,2.0))*wx0 + texture2D(tex, base + texel*vec2(1.0,2.0))*wx1 + texture2D(tex, base + texel*vec2(2.0,2.0))*wx2 + texture2D(tex, base + texel*vec2(3.0,2.0))*wx3;
        vec4 row3 = texture2D(tex, base + texel*vec2(0.0,3.0))*wx0 + texture2D(tex, base + texel*vec2(1.0,3.0))*wx1 + texture2D(tex, base + texel*vec2(2.0,3.0))*wx2 + texture2D(tex, base + texel*vec2(3.0,3.0))*wx3;
        return row0*wy0 + row1*wy1 + row2*wy2 + row3*wy3;
      }

      void main(){
        vec2 uv = mix(u_uv0, u_uv1, v_uv);
        vec4 c = (u_filterMode == 1) ? texBicubic(u_tex, uv, u_texel) : texture2D(u_tex, uv);
        gl_FragColor = vec4(c.rgb, c.a * u_alpha);
      }
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
      u_texel: gl.getUniformLocation(prog, 'u_texel'),
      u_filterMode: gl.getUniformLocation(prog, 'u_filterMode'),
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
