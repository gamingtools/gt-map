/**
 * StaticLayer -- a layer that owns vector shapes (polylines, polygons, circles).
 */
import type { Point, VectorStyle, VectorPrimitiveInternal } from '../types';
import type { VectorGeometry as VectorGeom } from '../events/maps';
import { EntityCollection } from '../../entities/entity-collection';
import { Vector } from '../../entities/vector';
import type { VectorOptions } from '../../entities/vector';

let _staticLayerIdSeq = 0;

export class StaticLayer {
  readonly type = 'static' as const;
  readonly id: string;

  /** Vector collection for this layer. */
  readonly vectors: EntityCollection<Vector>;

  /** @internal */
  _attached = false;
  /** @internal */
  _destroyed = false;

  // Deps set by the map when attached
  /** @internal */
  _deps: StaticLayerDeps | null = null;
  /** @internal Per-layer renderer (created by GTMap) */
  _renderer: import('../../internal/layers/static-layer-renderer').StaticLayerRenderer | null = null;

  constructor() {
    _staticLayerIdSeq = (_staticLayerIdSeq + 1) % Number.MAX_SAFE_INTEGER;
    this.id = `sl_${_staticLayerIdSeq.toString(36)}`;

    const onVectorsChanged = () => this._flushVectors();
    this.vectors = new EntityCollection<Vector>({ id: `vectors_${this.id}`, onChange: onVectorsChanged });
  }

  /** @internal Wire dependencies from the map. */
  _wire(deps: StaticLayerDeps): void {
    this._deps = deps;
  }

  // -- Convenience methods --

  addPolygon(points: Point[], style?: VectorStyle, opts?: VectorOptions): Vector {
    const geometry: VectorGeom = { type: 'polygon', points: points.map((p) => ({ x: p.x, y: p.y })), ...(style != null ? { style } : {}) };
    return this._addVector(geometry, opts);
  }

  addPolyline(points: Point[], style?: VectorStyle, opts?: VectorOptions): Vector {
    const geometry: VectorGeom = { type: 'polyline', points: points.map((p) => ({ x: p.x, y: p.y })), ...(style != null ? { style } : {}) };
    return this._addVector(geometry, opts);
  }

  addCircle(center: Point, radius: number, style?: VectorStyle, opts?: VectorOptions): Vector {
    const geometry: VectorGeom = { type: 'circle', center: { x: center.x, y: center.y }, radius, ...(style != null ? { style } : {}) };
    return this._addVector(geometry, opts);
  }

  /** Generic add method for any vector geometry. */
  addVector(geometry: VectorGeom, opts?: VectorOptions): Vector {
    return this._addVector(geometry, opts);
  }

  clearVectors(): void {
    this.vectors.clear();
    this._deps?.setVectors([]);
  }

  // -- Private --

  private _addVector(geometry: VectorGeom, opts?: VectorOptions): Vector {
    const vecOpts = opts?.data !== undefined ? { data: opts.data } : {};
    const v = new Vector(geometry, vecOpts, () => this._flushVectors());
    this.vectors.add(v);
    return v;
  }

  /** @internal */
  _flushVectors(): void {
    if (!this._deps) return;
    const list = this.vectors.getFiltered();
    const internalVectors: VectorPrimitiveInternal[] = list.map((v) => {
      const g = v.geometry;
      if (g.type === 'polyline' || g.type === 'polygon') {
        const polyGeom = g as VectorGeom & { type: 'polyline' | 'polygon'; points: Point[] };
        return {
          type: polyGeom.type,
          points: polyGeom.points.map((p) => ({ x: p.x, y: p.y })),
          ...(polyGeom.style != null ? { style: polyGeom.style } : {}),
        };
      }
      const circleGeom = g as VectorGeom & { type: 'circle'; center: Point; radius: number };
      return {
        type: 'circle' as const,
        center: { x: circleGeom.center.x, y: circleGeom.center.y },
        radius: circleGeom.radius,
        ...(circleGeom.style != null ? { style: circleGeom.style } : {}),
      };
    });
    this._deps.setVectors(internalVectors);
  }
}

/** @internal */
export interface StaticLayerDeps {
  setVectors(vectors: VectorPrimitiveInternal[]): void;
}
