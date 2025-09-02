import { TILE_SIZE, lngLatToWorld, worldToLngLat, tileXYZUrl, clampLat } from './mercator.js';

export default class MapGL {
  constructor(container, options = {}) {
    this.container = container;
    this.tileUrl = options.tileUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.minZoom = options.minZoom ?? 1;
    this.maxZoom = options.maxZoom ?? 19;
    this.wrapX = options.wrapX ?? true; // allow disabling for finite images
    this.freePan = options.freePan ?? false; // allow panning beyond map bounds
    this.center = {
      lng: options.center?.lng ?? 0,
      lat: options.center?.lat ?? 0,
    };
    this.zoom = options.zoom ?? 2; // continuous
    this._needsRender = true;

    this._initCanvas();
    this._initGL();
    this._initPrograms();
    this.resize();
    this._initEvents();
    this._tileCache = new Map(); // key: z/x/y => { tex, width, height, status }
    this._tileOrder = []; // LRU tracking
    this._maxTiles = options.maxTiles ?? 512;
    this._zoomAnim = null; // { from, to, px, py, start, dur }
    // Wheel zoom config (velocity-based smoothing)
    this.wheelSpeed = options.wheelSpeed ?? 0.60; // UI logical slider (0.05..0.75)
    this.wheelSpeedCtrl = options.wheelSpeedCtrl ?? 0.40;
    // Immediate step per wheel line (smooth hybrid)
    this.wheelImmediate = Number.isFinite(options.wheelImmediate) ? options.wheelImmediate : 0.12;
    this.wheelImmediateCtrl = Number.isFinite(options.wheelImmediateCtrl) ? options.wheelImmediateCtrl : 0.24;
    // Velocity gain per line for continued motion
    this.wheelGain = Number.isFinite(options.wheelGain) ? options.wheelGain : 0.22;
    this.wheelGainCtrl = Number.isFinite(options.wheelGainCtrl) ? options.wheelGainCtrl : 0.44;
    // Damping time constant for velocity tail (larger = smoother/longer)
    this.zoomDamping = Number.isFinite(options.zoomDamping) ? options.zoomDamping : 0.09;
    this.maxZoomRate = Number.isFinite(options.maxZoomRate) ? options.maxZoomRate : 12.0; // units/sec (higher cap)
    // Wheel state
    this._zoomVel = 0; // zoom units per second
    this._wheelAnchor = { px: 0, py: 0, mode: this.anchorMode };
    this._wheelLinesAccum = 0; // coalesced lines until next frame
    this._wheelLastCtrl = false;
    // Grid + pointer + anchor mode
    this.showGrid = options.showGrid ?? true;
    this.pointerAbs = null; // { x, y } in absolute map pixels (max integer zoom)
    this.anchorMode = (options.anchorMode === 'center' || options.anchorMode === 'pointer') ? options.anchorMode : 'pointer';
    this.outCenterBias = Number.isFinite(options.outCenterBias) ? options.outCenterBias : 0.15; // favor center on zoom-out
    // Easing options
    // Longer, smoother tail by default
    this.easeBaseMs = Number.isFinite(options.easeBaseMs) ? options.easeBaseMs : 150;
    this.easePerUnitMs = Number.isFinite(options.easePerUnitMs) ? options.easePerUnitMs : 240;
    this.easeMinMs = 120;
    this.easeMaxMs = 420;
    this.pinchEaseMs = Number.isFinite(options.pinchEaseMs) ? options.pinchEaseMs : 140;
    this.easePinch = options.easePinch ?? false;

    this._raf = null;
    this.debug = !!options.debug;
    this._zoomDir = 0; // -1 out, 1 in, 0 idle
    // Lock base tile LOD while zoom animates to avoid last-frame LOD pops
    this._renderBaseLockZInt = null;
    this._loop = this._loop.bind(this);
    this._logState = { last: null, lastTime: 0 };
    // Recompute immediate/gain from wheelSpeed defaults for consistent feel
    this.setWheelSpeed(this.wheelSpeed, this.wheelSpeedCtrl);
    this._loop();
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this._removeEvents();
  }

  setCenter(lng, lat) {
    this.center.lng = lng;
    this.center.lat = clampLat(lat);
    this._needsRender = true;
  }

  setZoom(zoom) {
    const z = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    if (z !== this.zoom) {
      this.zoom = z;
      this._needsRender = true;
    }
  }

  setTileSource({ url, minZoom, maxZoom, wrapX, clearCache = true }) {
    if (typeof url === 'string') this.tileUrl = url;
    if (Number.isFinite(minZoom)) this.minZoom = minZoom;
    if (Number.isFinite(maxZoom)) this.maxZoom = maxZoom;
    if (typeof wrapX === 'boolean') this.wrapX = wrapX;
    if (clearCache) this._clearTiles();
    this._needsRender = true;
  }

  setWheelSpeed(speed, ctrlSpeed) {
    if (Number.isFinite(speed)) {
      this.wheelSpeed = Math.max(0.01, Math.min(2, speed));
      // Map slider to immediate step and velocity gain
      // Immediate step ~ 0.05..0.35 (higher = more zoom per wheel turn)
      this.wheelImmediate = 0.05 + (this.wheelSpeed / 0.75) * (0.35 - 0.05);
      // Velocity gain ~ 0.12..0.35
      this.wheelGain = 0.12 + (this.wheelSpeed / 0.75) * (0.35 - 0.12);
    }
    if (Number.isFinite(ctrlSpeed)) {
      this.wheelSpeedCtrl = Math.max(0.01, Math.min(2, ctrlSpeed));
      this.wheelImmediateCtrl = 0.10 + (this.wheelSpeedCtrl / 0.75) * (0.60 - 0.10);
      this.wheelGainCtrl = 0.20 + (this.wheelSpeedCtrl / 0.75) * (0.50 - 0.20);
    }
  }

  setAnchorMode(mode) {
    if (mode === 'center' || mode === 'pointer') {
      this.anchorMode = mode;
    }
  }

  setEaseOptions({ easeBaseMs, easePerUnitMs, pinchEaseMs, easePinch }) {
    if (Number.isFinite(easeBaseMs)) this.easeBaseMs = Math.max(50, Math.min(600, easeBaseMs));
    if (Number.isFinite(easePerUnitMs)) this.easePerUnitMs = Math.max(0, Math.min(600, easePerUnitMs));
    if (Number.isFinite(pinchEaseMs)) this.pinchEaseMs = Math.max(40, Math.min(600, pinchEaseMs));
    if (typeof easePinch === 'boolean') this.easePinch = easePinch;
  }

  _clearTiles() {
    for (const rec of this._tileCache.values()) {
      if (rec?.tex) this.gl.deleteTexture(rec.tex);
    }
    this._tileCache.clear();
    this._tileOrder.length = 0;
  }

  resize() {
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    const rect = this.container.getBoundingClientRect();
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this._dpr = dpr;
      this.gl.viewport(0, 0, width, height);
      this._needsRender = true;
    }
    if (this.gridCanvas) {
      this.gridCanvas.style.width = rect.width + 'px';
      this.gridCanvas.style.height = rect.height + 'px';
      if (this.gridCanvas.width !== width || this.gridCanvas.height !== height) {
        this.gridCanvas.width = width;
        this.gridCanvas.height = height;
        this._needsRender = true;
      }
    }
  }

  // --- Internal setup ---
  _initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0';
    this.canvas.style.top = '0';
    this.canvas.style.right = '0';
    this.canvas.style.bottom = '0';
    this.canvas.style.zIndex = '0';
    this.container.appendChild(this.canvas);

    // Grid overlay canvas (2D)
    this.gridCanvas = document.createElement('canvas');
    this.gridCanvas.style.display = 'block';
    this.gridCanvas.style.position = 'absolute';
    this.gridCanvas.style.left = '0';
    this.gridCanvas.style.top = '0';
    this.gridCanvas.style.right = '0';
    this.gridCanvas.style.bottom = '0';
    this.gridCanvas.style.zIndex = '5';
    this.gridCanvas.style.pointerEvents = 'none';
    this.container.appendChild(this.gridCanvas);
    this._gridCtx = this.gridCanvas.getContext('2d');

    window.addEventListener('resize', () => this.resize());
  }

  _initGL() {
    const gl = this.canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;
    gl.clearColor(0.93, 0.93, 0.93, 1);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // common buffers
    // A unit quad [0,0]..[1,1]
    this._quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        1, 1,
      ]),
      gl.STATIC_DRAW
    );
  }

  _compile(type, src) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compile error: ' + info);
    }
    return shader;
  }

  _link(vs, fs) {
    const gl = this.gl;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error('Program link error: ' + info);
    }
    return prog;
  }

  _initPrograms() {
    const vs = this._compile(this.gl.VERTEX_SHADER, `
      attribute vec2 a_pos;
      uniform vec2 u_translate; // pixels (top-left)
      uniform vec2 u_size;      // pixels (width,height)
      uniform vec2 u_resolution;// canvas pixels (w,h)
      varying vec2 v_uv;
      void main(){
        vec2 pixelPos = u_translate + a_pos * u_size;
        vec2 clip = (pixelPos / u_resolution) * 2.0 - 1.0;
        clip.y *= -1.0;
        gl_Position = vec4(clip, 0.0, 1.0);
        v_uv = a_pos;
      }
    `);
    const fs = this._compile(this.gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform float u_alpha;
      void main(){
        vec4 c = texture2D(u_tex, v_uv);
        gl_FragColor = vec4(c.rgb, c.a * u_alpha);
      }
    `);
    const prog = (this._prog = this._link(vs, fs));
    const gl = this.gl;
    this._loc = {
      a_pos: gl.getAttribLocation(prog, 'a_pos'),
      u_translate: gl.getUniformLocation(prog, 'u_translate'),
      u_size: gl.getUniformLocation(prog, 'u_size'),
      u_resolution: gl.getUniformLocation(prog, 'u_resolution'),
      u_tex: gl.getUniformLocation(prog, 'u_tex'),
      u_alpha: gl.getUniformLocation(prog, 'u_alpha'),
    };
  }

  _initEvents() {
    const canvas = this.canvas;
    let dragging = false;
    let lastX = 0, lastY = 0;

    const onMouseDown = (e) => {
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId ?? 1);
    };
    const onMouseMove = (e) => {
      // Always update pointer coordinate for HUD
      this._updatePointerAbs(e);
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      this._panBy(dx, dy);
    };
    const onMouseUp = () => { dragging = false; };

    canvas.addEventListener('pointerdown', onMouseDown);
    window.addEventListener('pointermove', onMouseMove);
    window.addEventListener('pointerup', onMouseUp);

    // Wheel zoom with responsive ease animation (no discrete jumps)
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      // Normalize to 'lines'
      let lines = e.deltaY;
      if (e.deltaMode === 0) lines = e.deltaY / 100; else if (e.deltaMode === 2) lines = e.deltaY * 3;
      if (!Number.isFinite(lines)) return;
      const rect = this.container.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      if (this.debug) {
        try { console.log(`[Wheel] mode=${e.deltaMode} dy=${Number(e.deltaY).toFixed(3)} lines=${Number(lines).toFixed(4)} ctrl=${!!e.ctrlKey}`); } catch {}
      }
      // Map lines to a smooth target zoom delta and start/retarget an ease
      const ctrl = !!e.ctrlKey;
      const step = ctrl ? (this.wheelImmediateCtrl || this.wheelImmediate || 0.16) : (this.wheelImmediate || 0.16);
      // Per-event dz; clamp extreme spikes from high-res wheels
      let dz = -lines * step;
      const maxDzEvent = 1.5;
      dz = Math.max(-maxDzEvent, Math.min(maxDzEvent, dz));
      this._startZoomEase(dz, px, py, this.anchorMode);
      // Clear any residual coalesced or velocity tails
      this._wheelLinesAccum = 0;
      this._wheelLastCtrl = ctrl;
      this._zoomVel = 0;
      this._wheelAnchor = { px, py, mode: this.anchorMode };
      this._needsRender = true;
    }, { passive: false });

    // Basic touch pinch and pan
    let touchState = null;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchState = { mode: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const [t0, t1] = e.touches;
        const dx = t1.clientX - t0.clientX;
        const dy = t1.clientY - t0.clientY;
        touchState = {
          mode: 'pinch',
          cx: (t0.clientX + t1.clientX) / 2,
          cy: (t0.clientY + t1.clientY) / 2,
          dist: Math.hypot(dx, dy),
        };
      }
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      if (!touchState) return;
      if (touchState.mode === 'pan' && e.touches.length === 1) {
        const t = e.touches[0];
        const dx = t.clientX - touchState.x; const dy = t.clientY - touchState.y;
        touchState.x = t.clientX; touchState.y = t.clientY;
        this._panBy(dx, dy);
      } else if (touchState.mode === 'pinch' && e.touches.length === 2) {
        const [t0, t1] = e.touches;
        const dx = t1.clientX - t0.clientX;
        const dy = t1.clientY - t0.clientY;
        const dist = Math.hypot(dx, dy);
        const scaleDelta = Math.log2(dist / touchState.dist);
        const rect = this.container.getBoundingClientRect();
        const px = ((t0.clientX + t1.clientX) / 2) - rect.left;
        const py = ((t0.clientY + t1.clientY) / 2) - rect.top;
        // Immediate pinch zoom; cancel any animation
        this._zoomAnim = null;
        const z = this.zoom + scaleDelta;
        this._zoomToAnchored(z, px, py, this.anchorMode);
        touchState.dist = dist;
      }
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', () => { touchState = null; });

    this._cleanupEvents = () => {
      canvas.removeEventListener('pointerdown', onMouseDown);
      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('pointerup', onMouseUp);
    };
  }

  _removeEvents() {
    this._cleanupEvents?.();
  }

  // --- Interaction helpers ---
  _updatePointerAbs(e) {
    try {
      const rect = this.container.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const { zInt, scale, tlWorld } = this._currentState();
      const wx = tlWorld.x + px / scale;
      const wy = tlWorld.y + py / scale;
      const zAbs = Math.floor(this.maxZoom);
      const factor = Math.pow(2, zAbs - zInt);
      const ax = wx * factor;
      const ay = wy * factor;
      this.pointerAbs = { x: ax, y: ay };
    } catch {
      this.pointerAbs = null;
    }
  }
  _currentState(zIntOverride) {
    const zInt = Number.isFinite(zIntOverride) ? zIntOverride : Math.floor(this.zoom);
    const scale = Math.pow(2, this.zoom - zInt); // screen scale relative to zInt tiles
    const rect = this.container.getBoundingClientRect();
    const widthCSS = rect.width;
    const heightCSS = rect.height;
    const centerWorld = lngLatToWorld(this.center.lng, this.center.lat, zInt);
    const tlWorld = {
      x: centerWorld.x - (widthCSS / (2 * scale)),
      y: centerWorld.y - (heightCSS / (2 * scale)),
    };
    const dpr = this._dpr || 1;
    return { zInt, scale, widthCSS, heightCSS, dpr, centerWorld, tlWorld };
  }

  _clampCenterWorld(centerWorld, zInt, scale, widthCSS, heightCSS) {
    if (this.freePan) return centerWorld; // no clamping when free-pan is enabled
    const worldSize = TILE_SIZE * (1 << zInt);
    const halfW = widthCSS / (2 * scale);
    const halfH = heightCSS / (2 * scale);
    let cx = centerWorld.x;
    let cy = centerWorld.y;
    if (!this.wrapX) {
      if (halfW >= worldSize / 2) {
        cx = worldSize / 2;
      } else {
        cx = Math.max(halfW, Math.min(worldSize - halfW, cx));
      }
    }
    if (halfH >= worldSize / 2) {
      cy = worldSize / 2;
    } else {
      cy = Math.max(halfH, Math.min(worldSize - halfH, cy));
    }
    return { x: cx, y: cy };
  }

  _isViewportLarger(zInt, scale, widthCSS, heightCSS) {
    const worldSize = TILE_SIZE * (1 << zInt);
    const halfW = widthCSS / (2 * scale);
    const halfH = heightCSS / (2 * scale);
    const margin = 0.98; // small hysteresis to avoid flicker near boundary
    return halfW >= (worldSize / 2) * margin || halfH >= (worldSize / 2) * margin;
  }

  _wouldViewportBeLarger(targetZoom) {
    if (this.wrapX) return false;
    const rect = this.container.getBoundingClientRect();
    const widthCSS = rect.width;
    const heightCSS = rect.height;
    const zClamped = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));
    const zInt2 = Math.floor(zClamped);
    const s2 = Math.pow(2, zClamped - zInt2);
    return this._isViewportLarger(zInt2, s2, widthCSS, heightCSS);
  }

  _viewportCoverageRatio(zInt, scale, widthCSS, heightCSS) {
    const worldSize = TILE_SIZE * (1 << zInt);
    const halfW = widthCSS / (2 * scale);
    const halfH = heightCSS / (2 * scale);
    const halfWorld = worldSize / 2;
    return Math.max(halfW, halfH) / halfWorld;
  }

  _shouldAnchorCenterForZoom(targetZoom) {
    if (this.wrapX) return false;
    const rect = this.container.getBoundingClientRect();
    const widthCSS = rect.width;
    const heightCSS = rect.height;
    const zClamped = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));
    const zInt2 = Math.floor(zClamped);
    const s2 = Math.pow(2, zClamped - zInt2);
    const ratio = this._viewportCoverageRatio(zInt2, s2, widthCSS, heightCSS);
    const enter = 0.995; // more conservative entering center-anchor
    const exit = 0.90;   // require clearly smaller to exit
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (this._stickyCenterAnchor) {
      if (this._stickyAnchorUntil && now < this._stickyAnchorUntil) {
        return true;
      }
      if (ratio <= exit) this._stickyCenterAnchor = false;
    } else {
      if (ratio >= enter) {
        this._stickyCenterAnchor = true;
        this._stickyAnchorUntil = now + 300; // keep centered for 300ms
      }
    }
    return this._stickyCenterAnchor;
  }

  _panBy(dxCSS, dyCSS) {
    const { zInt, scale, widthCSS, heightCSS, tlWorld } = this._currentState();
    // Move the map by pixel delta: shift TL by -delta/scale
    const newTL = { x: tlWorld.x - dxCSS / scale, y: tlWorld.y - dyCSS / scale };
    let newCenter = { x: newTL.x + widthCSS / (2 * scale), y: newTL.y + heightCSS / (2 * scale) };
    newCenter = this._clampCenterWorld(newCenter, zInt, scale, widthCSS, heightCSS);
    const { lng, lat } = worldToLngLat(newCenter.x, newCenter.y, zInt);
    this.setCenter(lng, lat);
  }

  _zoomAt(delta, pxCSS, pyCSS) {
    const newZoom = this.zoom + delta;
    this._zoomToAnchored(newZoom, pxCSS, pyCSS, this.anchorMode);
  }

  _zoomTo(targetZoom, pxCSS, pyCSS) {
    const { zInt, scale, widthCSS, heightCSS, tlWorld } = this._currentState();
    const s1 = scale;
    const zClamped = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));
    const s2 = Math.pow(2, zClamped - Math.floor(zClamped));
    const zInt2 = Math.floor(zClamped);

    let center2;
    // default anchor decision
    const anchorCenter = (!this.wrapX && this._isViewportLarger(zInt2, s2, widthCSS, heightCSS));
    if (anchorCenter) {
      // Maintain current center when anchoring to viewport center
      const centerNow = lngLatToWorld(this.center.lng, this.center.lat, zInt);
      const factor = Math.pow(2, zInt2 - zInt);
      center2 = { x: centerNow.x * factor, y: centerNow.y * factor };
    } else {
      const worldBefore = { x: tlWorld.x + pxCSS / s1, y: tlWorld.y + pyCSS / s1 };
      const factor = Math.pow(2, zInt2 - zInt);
      const worldBefore2 = { x: worldBefore.x * factor, y: worldBefore.y * factor };
      const tl2 = { x: worldBefore2.x - (pxCSS / s2), y: worldBefore2.y - (pyCSS / s2) };
      center2 = { x: tl2.x + widthCSS / (2 * s2), y: tl2.y + heightCSS / (2 * s2) };
    }
    center2 = this._clampCenterWorld(center2, zInt2, s2, widthCSS, heightCSS);
    const { lng, lat } = worldToLngLat(center2.x, center2.y, zInt2);
    this.center = { lng, lat: clampLat(lat) };
    this.zoom = zClamped;
    if (this.debug) this._maybeLogZoom(this.zoom);
    this._needsRender = true;
  }

  _zoomToAnchored(targetZoom, pxCSS, pyCSS, anchor) {
    const { zInt, scale, widthCSS, heightCSS, tlWorld } = this._currentState();
    const s1 = scale;
    const zClamped = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));
    const zInt2 = Math.floor(zClamped);
    const s2 = Math.pow(2, zClamped - zInt2);

    let center2;
    if (anchor === 'center') {
      // Maintain current center position across zoom levels
      const centerNow = lngLatToWorld(this.center.lng, this.center.lat, zInt);
      const factor = Math.pow(2, zInt2 - zInt);
      center2 = { x: centerNow.x * factor, y: centerNow.y * factor };
    } else {
      const worldBefore = { x: tlWorld.x + pxCSS / s1, y: tlWorld.y + pyCSS / s1 };
      const factor = Math.pow(2, zInt2 - zInt);
      const worldBefore2 = { x: worldBefore.x * factor, y: worldBefore.y * factor };
      const tl2 = { x: worldBefore2.x - (pxCSS / s2), y: worldBefore2.y - (pyCSS / s2) };
      const centerPointer = { x: tl2.x + widthCSS / (2 * s2), y: tl2.y + heightCSS / (2 * s2) };

      // Slightly favor centering when zooming out for stability
      const zoomingOut = (this._zoomDir ? this._zoomDir < 0 : (zClamped < this.zoom));
      if (zoomingOut) {
        const centerNow = lngLatToWorld(this.center.lng, this.center.lat, zInt);
        const centerScaled = { x: centerNow.x * factor, y: centerNow.y * factor };
        const dz = Math.max(0, Math.abs(this.zoom - zClamped));
        const bias = Math.max(0, Math.min(0.6, (this.outCenterBias ?? 0.15) * dz));
        center2 = {
          x: centerPointer.x * (1 - bias) + centerScaled.x * bias,
          y: centerPointer.y * (1 - bias) + centerScaled.y * bias,
        };
      } else {
        center2 = centerPointer;
      }
    }
    center2 = this._clampCenterWorld(center2, zInt2, s2, widthCSS, heightCSS);
    const { lng, lat } = worldToLngLat(center2.x, center2.y, zInt2);
    this.center = { lng, lat: clampLat(lat) };
    this.zoom = zClamped;
    if (this.debug) this._maybeLogZoom(this.zoom);
    this._needsRender = true;
  }

  recenter() {
    // Move center to the map's world center at current integer zoom
    const zInt = Math.floor(this.zoom);
    const worldSize = TILE_SIZE * (1 << zInt);
    const worldCenter = { x: worldSize / 2, y: worldSize / 2 };
    const { lng, lat } = worldToLngLat(worldCenter.x, worldCenter.y, zInt);
    this.setCenter(lng, lat);
  }

  _maybeLogZoom(z) {
    try {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const rounded = Math.round(z * 1000) / 1000;
      // Throttle to avoid spamming and jank
      if (this._logState.last === rounded && (now - this._logState.lastTime) < 150) return;
      console.log(`[MapGL] zoom: ${rounded.toFixed(3)}`);
      this._logState.last = rounded;
      this._logState.lastTime = now;
    } catch {}
  }

  // --- Tile management ---
  _wrapX(x, z) { // wrap around antimeridian
    const n = 1 << z;
    let r = ((x % n) + n) % n;
    return r;
  }

  _enqueueTile(z, x, y) {
    const key = `${z}/${x}/${y}`;
    if (this._tileCache.has(key)) return;
    const gl = this.gl;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      this._tileCache.set(key, { status: 'ready', tex, width: img.naturalWidth, height: img.naturalHeight });
      this._tileOrder.push(key);
      this._evictIfNeeded();
      this._needsRender = true;
    };
    img.onerror = () => {
      this._tileCache.set(key, { status: 'error' });
    };
    const url = tileXYZUrl(this.tileUrl, z, x, y);
    this._tileCache.set(key, { status: 'loading' });
    img.src = url;
  }

  _evictIfNeeded() {
    if (this._tileOrder.length <= this._maxTiles) return;
    const overflow = this._tileOrder.length - this._maxTiles;
    for (let i = 0; i < overflow; i++) {
      const key = this._tileOrder.shift();
      const rec = this._tileCache.get(key);
      if (rec?.tex) {
        this.gl.deleteTexture(rec.tex);
      }
      this._tileCache.delete(key);
    }
  }

  // --- Render loop ---
  _loop() {
    this._raf = requestAnimationFrame(this._loop);
    // Time step
    const now = performance.now();
    this._lastTS = this._lastTS ?? now;
    const dt = (now - this._lastTS) / 1000;
    this._lastTS = now;

    // Coalesced per-frame wheel step, then apply zoom velocity linearly and damp
    let consumed = 0;
    if (Math.abs(this._wheelLinesAccum || 0) > 1e-6) {
      const ctrl = !!this._wheelLastCtrl;
      const step = ctrl ? (this.wheelImmediateCtrl || this.wheelImmediate || 0.16) : (this.wheelImmediate || 0.16);
      const linesAccum = (this._wheelLinesAccum || 0);
      let dz = -linesAccum * step;
      const maxDzFrame = 0.8;
      dz = Math.max(-maxDzFrame, Math.min(maxDzFrame, dz));
      const z = this.zoom + dz;
      const anchor = this._wheelAnchor?.mode || this.anchorMode;
      const px = this._wheelAnchor?.px ?? 0;
      const py = this._wheelAnchor?.py ?? 0;
      this._zoomToAnchored(z, px, py, anchor);
      consumed += dz;
      if (this.debug) {
        try { console.log(`[WheelFrame] linesAccum=${Number(linesAccum).toFixed(4)} step=${Number(step).toFixed(3)} dz=${Number(dz).toFixed(4)}`); } catch {}
      }
      this._wheelLinesAccum = 0;
      this._needsRender = true;
    }

    // Apply zoom velocity linearly and damp
    if (Math.abs(this._zoomVel) > 1e-4) {
      const maxStep = Math.max(0.0001, this.maxZoomRate * dt);
      let step = this._zoomVel * dt;
      step = Math.max(-maxStep, Math.min(maxStep, step));
      const z = this.zoom + step;
      const anchor = this._wheelAnchor?.mode || this.anchorMode;
      const px = this._wheelAnchor?.px ?? 0;
      const py = this._wheelAnchor?.py ?? 0;
      this._zoomToAnchored(z, px, py, anchor);
      consumed = step;
      // Exponential damping
      const k = Math.exp(-dt / this.zoomDamping);
      this._zoomVel *= k;
      if (Math.abs(this._zoomVel) < 1e-3) this._zoomVel = 0;
      this._needsRender = true;
    }

    const animating = this._stepAnimation();
    if (animating || consumed || this._needsRender) {
      this._render();
      this._needsRender = false;
    }
  }

  _stepAnimation() {
    if (!this._zoomAnim) return false;
    const now = performance.now();
    const a = this._zoomAnim;
    const t = Math.min(1, (now - a.start) / a.dur);
    // easeOutCubic for stable, non-jumpy feel
    const ease = 1 - Math.pow(1 - t, 3);
    const z = a.from + (a.to - a.from) * ease;
    this._zoomToAnchored(z, a.px, a.py, a.anchor || 'pointer');
    if (t >= 1) {
      this._zoomAnim = null;
      this._zoomDir = 0;
      // Release base LOD lock after animation finishes
      this._renderBaseLockZInt = null;
    }
    return true;
  }

  _startZoomEase(dz, px, py, anchor) {
    const now = performance.now();
    // If an animation is in progress, sample its current value as the new start
    let current = this.zoom;
    if (this._zoomAnim) {
      const a = this._zoomAnim;
      const t = Math.min(1, (now - a.start) / a.dur);
      const ease = 1 - Math.pow(1 - t, 3);
      current = a.from + (a.to - a.from) * ease;
    }
    // Lock base LOD during the zoom ease to avoid LOD swap at end
    if (!Number.isFinite(this._renderBaseLockZInt)) {
      this._renderBaseLockZInt = Math.floor(current);
    }
    const to = Math.max(this.minZoom, Math.min(this.maxZoom, current + dz));
    const dist = Math.abs(to - current);
    const base = this.easeBaseMs;
    const per = this.easePerUnitMs;
    const raw = base + per * dist;
    const dur = Math.max(this.easeMinMs, Math.min(this.easeMaxMs, raw));
    this._zoomAnim = { from: current, to, px, py, start: now, dur, anchor };
    this._zoomDir = dz < 0 ? -1 : dz > 0 ? 1 : 0;
  }

  _render() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);

    const zIntActual = Math.floor(this.zoom);
    const baseZ = Number.isFinite(this._renderBaseLockZInt) ? this._renderBaseLockZInt : zIntActual;
    const { zInt, scale, widthCSS, heightCSS, dpr, tlWorld } = this._currentState(baseZ);
    const frac = this.zoom - zInt;
    const zIntNext = Math.min(Math.floor(this.maxZoom), zInt + 1);
    const zIntPrev = Math.max(Math.floor(this.minZoom), zInt - 1);

    const prog = this._prog;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quad);
    gl.enableVertexAttribArray(this._loc.a_pos);
    gl.vertexAttribPointer(this._loc.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(this._loc.u_resolution, this.canvas.width, this.canvas.height);
    gl.uniform1i(this._loc.u_tex, 0);

    // If base level coverage is low (tiles still loading), draw previous level underneath
    const coverage = this._tileCoverage(zInt, tlWorld, scale, widthCSS, heightCSS);
    if (coverage < 0.98 && zIntPrev >= this.minZoom) {
      const centerPrev = lngLatToWorld(this.center.lng, this.center.lat, zIntPrev);
      const scalePrev = Math.pow(2, this.zoom - zIntPrev);
      const tlPrev = {
        x: centerPrev.x - (widthCSS / (2 * scalePrev)),
        y: centerPrev.y - (heightCSS / (2 * scalePrev)),
      };
      // Draw fallback fully to avoid gaps, base level will overwrite where present
      this._drawTilesForLevel(zIntPrev, tlPrev, scalePrev, dpr, 1.0);
    }

    // Draw base level fully
    this._drawTilesForLevel(zInt, tlWorld, scale, dpr, 1.0);

    // Draw next level on top to cross-fade when available
    if (zIntNext > zInt && frac > 0) {
      // Recompute tl for next level in its own world units
      const centerNext = lngLatToWorld(this.center.lng, this.center.lat, zIntNext);
      const scaleNext = Math.pow(2, this.zoom - zIntNext);
      const tlNext = {
        x: centerNext.x - (widthCSS / (2 * scaleNext)),
        y: centerNext.y - (heightCSS / (2 * scaleNext)),
      };
      this._drawTilesForLevel(zIntNext, tlNext, scaleNext, dpr, frac);
    }

    // 2D grid overlay
    if (this.showGrid) this._drawGrid();
  }

  _chooseGridSpacing(scale) {
    const base = TILE_SIZE; // align with tile boundaries
    const candidates = [
      base / 16, base / 8, base / 4, base / 2,
      base,
      base * 2, base * 4, base * 8, base * 16, base * 32, base * 64,
    ];
    const targetPx = 100; // aim for ~100 CSS px
    let best = candidates[0];
    let bestErr = Infinity;
    for (const w of candidates) {
      const css = w * scale;
      const err = Math.abs(css - targetPx);
      if (err < bestErr) { bestErr = err; best = w; }
    }
    return Math.max(1, Math.round(best));
  }

  _drawGrid() {
    const ctx = this._gridCtx;
    if (!ctx) return;
    const { zInt, scale, widthCSS, heightCSS, tlWorld } = this._currentState();
    const dpr = this._dpr || 1;
    ctx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const spacingWorld = this._chooseGridSpacing(scale);
    const base = TILE_SIZE;
    const zAbs = Math.floor(this.maxZoom);
    const factorAbs = Math.pow(2, zAbs - zInt);
    ctx.font = '11px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // Vertical lines with labels on major tile boundaries
    let startWX = Math.floor(tlWorld.x / spacingWorld) * spacingWorld;
    for (let wx = startWX; (wx - tlWorld.x) * scale <= widthCSS + spacingWorld * scale; wx += spacingWorld) {
      const xCSS = (wx - tlWorld.x) * scale;
      const isMajor = (Math.round(wx) % base) === 0;
      ctx.beginPath();
      ctx.strokeStyle = isMajor ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)';
      ctx.lineWidth = isMajor ? 1.2 : 0.8;
      ctx.moveTo(Math.round(xCSS) + 0.5, 0);
      ctx.lineTo(Math.round(xCSS) + 0.5, heightCSS);
      ctx.stroke();
      if (isMajor) {
        const xAbs = Math.round(wx * factorAbs);
        const label = `x ${xAbs}`;
        const tx = Math.round(xCSS) + 2;
        const ty = 2;
        const m = ctx.measureText(label);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(tx - 2, ty - 1, m.width + 4, 12);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillText(label, tx, ty);
      }
    }

    // Horizontal lines with labels on major tile boundaries
    let startWY = Math.floor(tlWorld.y / spacingWorld) * spacingWorld;
    for (let wy = startWY; (wy - tlWorld.y) * scale <= heightCSS + spacingWorld * scale; wy += spacingWorld) {
      const yCSS = (wy - tlWorld.y) * scale;
      const isMajor = (Math.round(wy) % base) === 0;
      ctx.beginPath();
      ctx.strokeStyle = isMajor ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)';
      ctx.lineWidth = isMajor ? 1.2 : 0.8;
      ctx.moveTo(0, Math.round(yCSS) + 0.5);
      ctx.lineTo(widthCSS, Math.round(yCSS) + 0.5);
      ctx.stroke();
      if (isMajor) {
        const yAbs = Math.round(wy * factorAbs);
        const label = `y ${yAbs}`;
        const tx = 2;
        const ty = Math.round(yCSS) + 2;
        const m = ctx.measureText(label);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(tx - 2, ty - 1, m.width + 4, 12);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillText(label, tx, ty);
      }
    }

    ctx.restore();
  }

  setGridVisible(visible) {
    this.showGrid = !!visible;
    this._needsRender = true;
  }

  _tileCoverage(zLevel, tlWorld, scale, widthCSS, heightCSS) {
    const startX = Math.floor(tlWorld.x / TILE_SIZE);
    const startY = Math.floor(tlWorld.y / TILE_SIZE);
    const endX = Math.floor((tlWorld.x + widthCSS / scale) / TILE_SIZE) + 1;
    const endY = Math.floor((tlWorld.y + heightCSS / scale) / TILE_SIZE) + 1;
    let total = 0;
    let ready = 0;
    for (let ty = startY; ty <= endY; ty++) {
      if (ty < 0 || ty >= (1 << zLevel)) continue;
      for (let tx = startX; tx <= endX; tx++) {
        let tileX = tx;
        if (this.wrapX) tileX = this._wrapX(tx, zLevel);
        else if (tx < 0 || tx >= (1 << zLevel)) continue;
        total++;
        const key = `${zLevel}/${tileX}/${ty}`;
        const record = this._tileCache.get(key);
        if (!record) this._enqueueTile(zLevel, tileX, ty);
        if (record?.status === 'ready') ready++;
      }
    }
    if (total === 0) return 1;
    return ready / total;
  }

  _drawTilesForLevel(zLevel, tlWorld, scale, dpr, alpha) {
    const gl = this.gl;
    const rect = this.container.getBoundingClientRect();
    const widthCSS = rect.width;
    const heightCSS = rect.height;
    const startX = Math.floor(tlWorld.x / TILE_SIZE);
    const startY = Math.floor(tlWorld.y / TILE_SIZE);
    const endX = Math.floor((tlWorld.x + widthCSS / scale) / TILE_SIZE) + 1;
    const endY = Math.floor((tlWorld.y + heightCSS / scale) / TILE_SIZE) + 1;
    const tilePixelSizeCSS = TILE_SIZE * scale;
    const tilePixelSize = tilePixelSizeCSS * dpr;

    this.gl.uniform1f(this._loc.u_alpha, alpha);

    for (let ty = startY; ty <= endY; ty++) {
      if (ty < 0 || ty >= (1 << zLevel)) continue; // clamp y
      for (let tx = startX; tx <= endX; tx++) {
        const wx = tx * TILE_SIZE;
        const wy = ty * TILE_SIZE;
        let sxCSS = (wx - tlWorld.x) * scale;
        const syCSS = (wy - tlWorld.y) * scale;

        let tileX = tx;
        if (this.wrapX) {
          tileX = this._wrapX(tx, zLevel);
          if (tx !== tileX) {
            const dxTiles = tx - tileX;
            sxCSS -= dxTiles * TILE_SIZE * scale;
          }
        } else {
          if (tx < 0 || tx >= (1 << zLevel)) continue;
        }

        const key = `${zLevel}/${tileX}/${ty}`;
        const record = this._tileCache.get(key);
        if (!record) this._enqueueTile(zLevel, tileX, ty);

        if (record?.status === 'ready') {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, record.tex);
          gl.uniform2f(this._loc.u_translate, sxCSS * dpr, syCSS * dpr);
          gl.uniform2f(this._loc.u_size, tilePixelSize, tilePixelSize);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
    }
  }
}
