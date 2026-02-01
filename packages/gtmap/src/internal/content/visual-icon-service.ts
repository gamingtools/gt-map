/**
 * VisualIconService -- converts Visual objects into internal icon definitions.
 *
 * Handles text-to-canvas rendering, SVG-to-dataUrl conversion, image visuals,
 * and default icon generation. Maintains caches for visual-to-iconId and
 * visual-to-size mappings.
 */
import type { IconDefInternal } from '../../api/types';
import { Visual, isImageVisual, isTextVisual, isSvgVisual, resolveAnchor } from '../../api/visual';
import { renderTextToCanvas } from '../layers/text-renderer';
import { renderSvgToDataUrlSync, renderSvgToCanvasAsync } from '../layers/svg-renderer';

export interface VisualIconServiceDeps {
  setIconDefs(defs: Record<string, IconDefInternal>): Promise<void>;
  onVisualUpdated(): void;
}

export class VisualIconService {
  private _deps: VisualIconServiceDeps;
  private _visualToIconId: WeakMap<Visual, string> = new WeakMap();
  private _visualToSize: WeakMap<Visual, { width: number; height: number }> = new WeakMap();
  private _visualIdSeq = 0;
  private _defaultIconReady = false;

  constructor(deps: VisualIconServiceDeps) {
    this._deps = deps;
  }

  ensureDefaultIcon(): void {
    if (this._defaultIconReady) return;
    try {
      const size = 16;
      const r = 7;
      const cnv = document.createElement('canvas');
      cnv.width = size;
      cnv.height = size;
      const ctx = cnv.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      const dataUrl = cnv.toDataURL('image/png');
      const defaultIcon: IconDefInternal = { iconPath: dataUrl, width: size, height: size };
      this._deps.setIconDefs({ default: defaultIcon });
      this._defaultIconReady = true;
    } catch { /* expected: canvas API may not be available (SSR) */ }
  }

  ensureRegistered(visual: Visual): string {
    const cached = this._visualToIconId.get(visual);
    if (cached) return cached;

    this._visualIdSeq = (this._visualIdSeq + 1) % Number.MAX_SAFE_INTEGER;
    const iconId = `v_${this._visualIdSeq.toString(36)}`;
    let iconDef: IconDefInternal | null = null;

    if (isImageVisual(visual)) {
      const size = visual.getSize();
      const anchor = resolveAnchor(visual.anchor);
      iconDef = {
        iconPath: visual.icon,
        ...(visual.icon2x != null ? { x2IconPath: visual.icon2x } : {}),
        width: size.width,
        height: size.height,
        anchorX: anchor.x * size.width,
        anchorY: anchor.y * size.height,
      };
    } else if (isTextVisual(visual)) {
      const result = renderTextToCanvas({
        text: visual.text,
        fontSize: visual.fontSize,
        fontFamily: visual.fontFamily,
        color: visual.color,
        ...(visual.backgroundColor != null ? { backgroundColor: visual.backgroundColor } : {}),
        ...(visual.padding != null ? { padding: visual.padding } : {}),
        ...(visual.strokeColor != null ? { strokeColor: visual.strokeColor } : {}),
        ...(visual.strokeWidth != null ? { strokeWidth: visual.strokeWidth } : {}),
        ...(visual.fontWeight != null ? { fontWeight: visual.fontWeight } : {}),
        ...(visual.fontStyle != null ? { fontStyle: visual.fontStyle } : {}),
      });
      const anchor = resolveAnchor(visual.anchor);
      const displayW = result.width / 2;
      const displayH = result.height / 2;
      iconDef = {
        iconPath: result.dataUrl,
        width: displayW,
        height: displayH,
        anchorX: anchor.x * displayW,
        anchorY: anchor.y * displayH,
      };
    } else if (isSvgVisual(visual)) {
      const size = visual.getSize();
      const anchor = resolveAnchor(visual.anchor);
      const needsAsync = visual.shadow || visual.svg.trim().startsWith('http');

      if (!needsAsync) {
        const dataUrl = renderSvgToDataUrlSync({
          svg: visual.svg,
          width: size.width,
          height: size.height,
          ...(visual.fill != null ? { fill: visual.fill } : {}),
          ...(visual.stroke != null ? { stroke: visual.stroke } : {}),
          ...(visual.strokeWidth != null ? { strokeWidth: visual.strokeWidth } : {}),
        });
        if (dataUrl) {
          iconDef = {
            iconPath: dataUrl,
            width: size.width,
            height: size.height,
            anchorX: anchor.x * size.width,
            anchorY: anchor.y * size.height,
          };
        }
      } else {
        this._visualToIconId.set(visual, iconId);
        renderSvgToCanvasAsync(
          {
            svg: visual.svg,
            width: size.width,
            height: size.height,
            ...(visual.fill != null ? { fill: visual.fill } : {}),
            ...(visual.stroke != null ? { stroke: visual.stroke } : {}),
            ...(visual.strokeWidth != null ? { strokeWidth: visual.strokeWidth } : {}),
            ...(visual.shadow != null ? { shadow: visual.shadow } : {}),
          },
          (result) => {
            const displayW = result.width / 2;
            const displayH = result.height / 2;
            const updatedDef: IconDefInternal = {
              iconPath: result.dataUrl,
              width: displayW,
              height: displayH,
              anchorX: anchor.x * displayW,
              anchorY: anchor.y * displayH,
            };
            this._deps.setIconDefs(Object.fromEntries([[iconId, updatedDef]]));
            this._visualToSize.set(visual, { width: displayW, height: displayH });
            this._deps.onVisualUpdated();
          },
        );
        return iconId;
      }
    } else {
      console.warn(`GTMap: Visual type '${visual.type}' is not yet supported for rendering. Using default icon.`);
      return 'default';
    }

    if (iconDef) {
      this._deps.setIconDefs(Object.fromEntries([[iconId, iconDef]]));
      this._visualToSize.set(visual, { width: iconDef.width, height: iconDef.height });
    }

    this._visualToIconId.set(visual, iconId);
    return iconId;
  }

  getIconId(visual: Visual): string {
    return this._visualToIconId.get(visual) ?? 'default';
  }

  getScaledSize(visual: Visual, scale: number): number | undefined {
    if (scale === 1) return undefined;
    const cachedSize = this._visualToSize.get(visual);
    if (cachedSize) return Math.max(cachedSize.width, cachedSize.height) * scale;
    if (isImageVisual(visual)) {
      const sz = visual.getSize();
      return Math.max(sz.width, sz.height) * scale;
    }
    return undefined;
  }
}
