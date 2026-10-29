import { test } from "node:test";
import assert from "node:assert/strict";
import {
  solve,
  clipPolygon,
  halfPlanes,
  type Problem,
  type Constraint,
} from "../lib/solver.ts";
const problem = (
  constraints: Constraint[],
  extra: Partial<Problem> = {},
): Problem => ({
  objective: { x: 3, y: 2 },
  direction: "max",
  nonnegative: true,
  constraints,
  ...extra,
});
const c = (
  a: number,
  b: number,
  rhs: number,
  op: Constraint["op"] = "<=",
): Constraint => ({ a, b, rhs, op });
test("textbook-style production mix: unique maximum at (2, 2)", () => {
  const s = solve(problem([c(1, 1, 4), c(1, 0, 2), c(0, 1, 3)]));
  assert.equal(s.status, "optimal");
  assert.deepEqual(s.point, { x: 2, y: 2 });
  assert.equal(s.value, 10);
  assert.equal(s.multiple, false);
  assert.equal(s.vertices.length, 5);
});
test("minimization with >= constraints", () => {
  const s = solve(problem([c(1, 1, 4, ">=")], { direction: "min" }));
  assert.equal(s.value, 8);
});
test("infeasible parallel constraints", () =>
  assert.equal(
    solve(problem([c(1, 0, 1), c(1, 0, 2, ">=")])).status,
    "infeasible",
  ));
test("unbounded objective", () =>
  assert.equal(solve(problem([c(1, -1, 1)])).status, "unbounded"));
test("multiple optimal points along an edge", () => {
  const s = solve(problem([c(1, 1, 4)], { objective: { x: 1, y: 1 } }));
  assert.equal(s.value, 4);
  assert.equal(s.multiple, true);
});
test("equality and single feasible point", () => {
  const s = solve(problem([c(1, 1, 0, "=")]));
  assert.equal(s.value, 0);
  assert.equal(s.multiple, false);
});
test("free variables: strip with no vertices has finite optimum", () => {
  const s = solve(
    problem([c(1, 0, 2), c(1, 0, 1, ">=")], {
      nonnegative: false,
      objective: { x: 1, y: 0 },
    }),
  );
  assert.equal(s.value, 2);
  assert.equal(s.multiple, true);
});
test("free variables: equality line has a constant optimum", () => {
  const s = solve(
    problem([c(1, 1, 4, "=")], {
      nonnegative: false,
      objective: { x: 1, y: 1 },
    }),
  );
  assert.equal(s.value, 4);
  assert.equal(s.multiple, true);
});
test("zero objective on bounded area has multiple optima", () =>
  assert.equal(
    solve(problem([c(1, 1, 4)], { objective: { x: 0, y: 0 } })).multiple,
    true,
  ));
test("constant impossible constraint", () =>
  assert.equal(solve(problem([c(0, 0, -1)])).status, "infeasible"));
test("redundant and scaled constraints preserve result", () =>
  assert.equal(
    solve(problem([c(1e-10, 1e-10, 4e-10), c(1, 0, 2), c(0, 1, 3), c(0, 0, 1)]))
      .value,
    10,
  ));
test("invalid values are rejected", () =>
  assert.throws(() => solve(problem([c(NaN, 1, 1)]))));
test("graph clipping respects constraints", () => {
  const p = problem([c(1, 1, 4)]);
  const polygon = clipPolygon(
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ],
    halfPlanes(p),
  );
  assert.equal(polygon.length, 3);
  assert.ok(polygon.every((v) => v.x + v.y <= 4.000001));
});
test("tiny objective still detects unbounded improvement", () =>
  assert.equal(
    solve(problem([], { objective: { x: 1e-12, y: 0 } })).status,
    "unbounded",
  ));
test("unrestricted plane and negative optimum", () => {
  assert.equal(solve(problem([], { nonnegative: false })).status, "unbounded");
  const s = solve(
    problem([c(1, 0, -2, "="), c(0, 1, -3, "=")], { nonnegative: false }),
  );
  assert.equal(s.value, -12);
  assert.equal(s.multiple, false);
});
