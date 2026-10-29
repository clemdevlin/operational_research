export type Point = { x: number; y: number };
export type Constraint = {
  a: number;
  b: number;
  op: "<=" | ">=" | "=";
  rhs: number;
};
export type Problem = {
  objective: Point;
  direction: "max" | "min";
  constraints: Constraint[];
  nonnegative: boolean;
};
export type HalfPlane = { a: number; b: number; rhs: number };
export type Solution = {
  status: "optimal" | "infeasible" | "unbounded";
  vertices: Point[];
  point?: Point;
  value?: number;
  multiple?: boolean;
};
const EPS = 1e-8;
export const dot = (p: Point, q: Point) => p.x * q.x + p.y * q.y;
export function halfPlanes(problem: Problem): HalfPlane[] {
  const result: HalfPlane[] = [];
  for (const c of problem.constraints) {
    if (![c.a, c.b, c.rhs].every(Number.isFinite))
      throw new Error("All coefficients must be finite numbers.");
    const norm = Math.hypot(c.a, c.b);
    const h = {
      a: norm ? c.a / norm : 0,
      b: norm ? c.b / norm : 0,
      rhs: norm ? c.rhs / norm : c.rhs,
    };
    if (c.op !== ">=") result.push(h);
    if (c.op !== "<=") result.push({ a: -h.a, b: -h.b, rhs: -h.rhs });
  }
  if (problem.nonnegative)
    result.push({ a: -1, b: 0, rhs: 0 }, { a: 0, b: -1, rhs: 0 });
  return result;
}
export function contains(planes: HalfPlane[], p: Point) {
  return planes.every(
    (h) => h.a * p.x + h.b * p.y <= h.rhs + EPS * Math.max(1, Math.abs(h.rhs)),
  );
}
function unique(points: Point[]) {
  return points.filter(
    (p, i) =>
      points.findIndex((q) => Math.hypot(p.x - q.x, p.y - q.y) < EPS * 10) ===
      i,
  );
}
function candidates(planes: HalfPlane[]) {
  const corners: Point[] = [];
  const points: Point[] = [{ x: 0, y: 0 }];
  for (let i = 0; i < planes.length; i++) {
    const h = planes[i],
      norm = h.a * h.a + h.b * h.b;
    if (norm) points.push({ x: (h.a * h.rhs) / norm, y: (h.b * h.rhs) / norm });
    for (let j = i + 1; j < planes.length; j++) {
      const k = planes[j],
        det = h.a * k.b - k.a * h.b;
      if (Math.abs(det) < EPS) continue;
      const p = {
        x: (h.rhs * k.b - k.rhs * h.b) / det,
        y: (h.a * k.rhs - k.a * h.rhs) / det,
      };
      if (contains(planes, p)) corners.push(p);
    }
  }
  return {
    vertices: unique(corners),
    feasible: unique([
      ...corners,
      ...points.filter((p) => contains(planes, p)),
    ]),
  };
}
function directions(planes: HalfPlane[], objective: Point) {
  const raw: Point[] = [
    objective,
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  for (const h of planes) raw.push({ x: -h.b, y: h.a }, { x: h.b, y: -h.a });
  return raw
    .filter((p) => Math.hypot(p.x, p.y) > EPS)
    .map((p) => {
      const n = Math.hypot(p.x, p.y);
      return { x: p.x / n, y: p.y / n };
    })
    .filter((p) => planes.every((h) => h.a * p.x + h.b * p.y <= EPS));
}
export function solve(problem: Problem): Solution {
  if (![problem.objective.x, problem.objective.y].every(Number.isFinite))
    throw new Error("The objective must contain finite numbers.");
  const planes = halfPlanes(problem),
    { vertices, feasible } = candidates(planes);
  if (!feasible.length) return { status: "infeasible", vertices };
  const sign = problem.direction === "max" ? 1 : -1;
  const objectiveNorm =
    Math.hypot(problem.objective.x, problem.objective.y) || 1;
  const objective = {
    x: (sign * problem.objective.x) / objectiveNorm,
    y: (sign * problem.objective.y) / objectiveNorm,
  };
  const rays = directions(planes, objective);
  if (rays.some((p) => dot(p, objective) > EPS))
    return { status: "unbounded", vertices, point: feasible[0] };
  const point = feasible.reduce((best, p) =>
    dot(p, objective) > dot(best, objective) ? p : best,
  );
  const value = dot(point, problem.objective);
  // Intersect the feasible set with the optimal objective line. This also handles strips and lines without vertices.
  const face = candidates([
    ...planes,
    ...halfPlanes({
      ...problem,
      nonnegative: false,
      constraints: [
        { a: problem.objective.x, b: problem.objective.y, op: "=", rhs: value },
      ],
    }),
  ]).feasible;
  const multiple =
    face.some((p) => Math.hypot(p.x - point.x, p.y - point.y) > EPS * 10) ||
    rays.some((p) => Math.abs(dot(p, objective)) < EPS);
  return { status: "optimal", vertices, point, value, multiple };
}
export function clipPolygon(polygon: Point[], planes: HalfPlane[]): Point[] {
  let output = polygon;
  for (const h of planes) {
    const input = output;
    output = [];
    if (!input.length) break;
    for (let i = 0; i < input.length; i++) {
      const p = input[i],
        q = input[(i + 1) % input.length];
      const dp = h.a * p.x + h.b * p.y - h.rhs,
        dq = h.a * q.x + h.b * q.y - h.rhs;
      if (dp <= EPS) output.push(p);
      if (dp <= EPS !== dq <= EPS) {
        const t = dp / (dp - dq);
        output.push({ x: p.x + t * (q.x - p.x), y: p.y + t * (q.y - p.y) });
      }
    }
  }
  return unique(output);
}
