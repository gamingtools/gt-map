import { createProgramFromSources } from './program';
import { createUnitQuad } from './quad';

export type ProgramLocs = {
  a_pos: number;
  u_translate: WebGLUniformLocation | null;
  u_size: WebGLUniformLocation | null;
  u_resolution: WebGLUniformLocation | null;
  u_tex: WebGLUniformLocation | null;
  u_alpha: WebGLUniformLocation | null;
  u_uv0: WebGLUniformLocation | null;
  u_uv1: WebGLUniformLocation | null;
};

export function initPrograms(gl: WebGLRenderingContext): { prog: WebGLProgram; loc: ProgramLocs; quad: WebGLBuffer } {
  const vsSrc = `
    attribute vec2 a_pos; uniform vec2 u_translate; uniform vec2 u_size; uniform vec2 u_resolution; varying vec2 v_uv; void main(){ vec2 pixelPos=u_translate + a_pos*u_size; vec2 clip=(pixelPos/u_resolution)*2.0-1.0; clip.y*=-1.0; gl_Position=vec4(clip,0.0,1.0); v_uv=a_pos; }
  `;
  const fsSrc = `
    precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_alpha; uniform vec2 u_uv0; uniform vec2 u_uv1; void main(){ vec2 uv = mix(u_uv0, u_uv1, v_uv); vec4 c=texture2D(u_tex, uv); gl_FragColor=vec4(c.rgb, c.a*u_alpha); }
  `;
  const prog = createProgramFromSources(gl, vsSrc, fsSrc);
  const loc: ProgramLocs = {
    a_pos: gl.getAttribLocation(prog, 'a_pos'),
    u_translate: gl.getUniformLocation(prog, 'u_translate'),
    u_size: gl.getUniformLocation(prog, 'u_size'),
    u_resolution: gl.getUniformLocation(prog, 'u_resolution'),
    u_tex: gl.getUniformLocation(prog, 'u_tex'),
    u_alpha: gl.getUniformLocation(prog, 'u_alpha'),
    u_uv0: gl.getUniformLocation(prog, 'u_uv0'),
    u_uv1: gl.getUniformLocation(prog, 'u_uv1'),
  };
  const quad = createUnitQuad(gl);
  return { prog, loc, quad };
}

