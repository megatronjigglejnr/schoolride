// Mini-map geometry, ported unchanged from mmLerp / mmSegs / mmSplit / mmPath in app/app.js.
import type { MiniMapSpec, Point } from '@/data/types';

type Cubic = [Point, Point, Point, Point];

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Catmull-Rom through the stops, as cubic Bézier segments. */
export function segments(p: readonly Point[]): Cubic[] {
  const s: Cubic[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    s.push([
      p1,
      [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
      p2,
    ]);
  }
  return s;
}

/** de Casteljau: split one cubic at t. */
export function split(b: Cubic, t: number): [Cubic, Cubic] {
  const a = lerp(b[0], b[1], t);
  const m = lerp(b[1], b[2], t);
  const n = lerp(b[2], b[3], t);
  const d = lerp(a, m, t);
  const e = lerp(m, n, t);
  const f = lerp(d, e, t);
  return [
    [b[0], a, d, f],
    [f, e, n, b[3]],
  ];
}

/** SVG path data for a chain of cubics, one decimal place like the prototype. */
export function toPath(segs: Cubic[]): string {
  const f = (v: number) => v.toFixed(1);
  let d = 'M' + f(segs[0][0][0]) + ' ' + f(segs[0][0][1]);
  segs.forEach((s) => {
    d += ' C' + f(s[1][0]) + ' ' + f(s[1][1]) + ',' + f(s[2][0]) + ' ' + f(s[2][1]) + ',' + f(s[3][0]) + ' ' + f(s[3][1]);
  });
  return d;
}

/** Everything the mini-map draws: the route behind and ahead of the bus, and the bus's position and heading. */
export function layout(spec: MiniMapSpec) {
  const segs = segments(spec.pts);
  const parts = split(segs[spec.busSeg], spec.busT);
  const done = segs.slice(0, spec.busSeg).concat([parts[0]]);
  const rest = [parts[1]].concat(segs.slice(spec.busSeg + 1));
  const bus = parts[0][3];
  const b = segs[spec.busSeg];
  const t = spec.busT;
  const u = 1 - t;
  const dx = u * u * (b[1][0] - b[0][0]) + 2 * u * t * (b[2][0] - b[1][0]) + t * t * (b[3][0] - b[2][0]);
  const dy = u * u * (b[1][1] - b[0][1]) + 2 * u * t * (b[2][1] - b[1][1]) + t * t * (b[3][1] - b[2][1]);
  // Tilt the bus along the road, but never more than 26 degrees, so it stays readable.
  const angle = Math.max(-26, Math.min(26, (Math.atan2(dy, dx) * 180) / Math.PI));
  return { donePath: toPath(done), restPath: toPath(rest), bus, angle };
}
