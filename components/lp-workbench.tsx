"use client";

import { useState, useEffect } from "react";
import {
  clipPolygon,
  halfPlanes,
  solve,
  dot,
  type Constraint,
  type Problem,
  type Point,
} from "../lib/solver";
const initial: Problem = {
  objective: { x: 3, y: 2 },
  direction: "max",
  nonnegative: true,
  constraints: [
    { a: 1, b: 1, op: "<=", rhs: 4 },
    { a: 1, b: 0, op: "<=", rhs: 2 },
    { a: 0, b: 1, op: "<=", rhs: 3 },
  ],
};
const fmt = (n: number) =>
  Math.abs(n) < 1e-9 ? "0" : Number(n.toPrecision(6)).toString();
const colors = [
  "#2458c6",
  "#b34220",
  "#713ead",
  "#087b71",
  "#a06c00",
  "#b43678",
  "#526321",
  "#596675",
];
function NumberField({
  value,
  label,
  onChange,
}: {
  value: number;
  label: string;
  onChange: (value: string) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <input
      aria-label={label}
      type="number"
      step="any"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value);
      }}
    />
  );
}
export default function Workbench() {
  const [problem, setProblem] = useState<Problem>(initial);
  const [revision, setRevision] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showTable, setShowTable] = useState(true);
  const [invalid, setInvalid] = useState<string[]>([]);
  const result = invalid.length ? null : solve(problem);
  function number(value: string, key: string, update: (n: number) => void) {
    const n = Number(value),
      valid = value.trim() !== "" && Number.isFinite(n) && Math.abs(n) <= 1e6;
    setInvalid((previous) =>
      valid
        ? previous.filter((k) => k !== key)
        : [...new Set([...previous, key])],
    );
    if (valid) update(n);
  }
  function constraint(index: number, patch: Partial<Constraint>) {
    setProblem((p) => ({
      ...p,
      constraints: p.constraints.map((c, i) =>
        i === index ? { ...c, ...patch } : c,
      ),
    }));
  }
  const points = [
    ...(result?.vertices ?? []),
    ...(result?.point ? [result.point] : []),
  ];
  const extent = Math.max(
    5,
    ...points.flatMap((p) => [Math.abs(p.x) * 1.3, Math.abs(p.y) * 1.3]),
  );
  const high = extent * zoom,
    low = problem.nonnegative ? -high * 0.08 : -high;
  const span = high - low;
  const map = (p: Point) => ({
    x: 54 + ((p.x - low) / span) * 480,
    y: 526 - ((p.y - low) / span) * 480,
  });
  const coords = (p: Point) => {
    const v = map(p);
    return `${v.x},${v.y}`;
  };
  const box = [
    { x: low, y: low },
    { x: high, y: low },
    { x: high, y: high },
    { x: low, y: high },
  ];
  const polygon =
    result && result.status !== "infeasible"
      ? clipPolygon(box, halfPlanes(problem))
      : [];
  function line(a: number, b: number, rhs: number) {
    const edges: Point[] = [];
    if (b)
      for (const x of [low, high]) {
        const y = (rhs - a * x) / b;
        if (y >= low && y <= high) edges.push({ x, y });
      }
    if (a)
      for (const y of [low, high]) {
        const x = (rhs - b * y) / a;
        if (x >= low && x <= high) edges.push({ x, y });
      }
    return edges.length >= 2
      ? [map(edges[0]), map(edges[edges.length - 1])]
      : null;
  }
  return (
    <div className="workbench">
      <section className="panel controls" aria-labelledby="problem-heading">
        <div className="section-heading">
          <h2 id="problem-heading">1. Define your problem</h2>
          <button
            onClick={() => {
              setProblem(initial);
              setRevision((r) => r + 1);
              setInvalid([]);
              setZoom(1);
            }}
          >
            Reset example
          </button>
        </div>
        <p className="muted">
          Choose an objective and up to eight constraints. Coefficients may be
          negative or decimal.
        </p>
        <div className="objective equation" key={revision}>
          <label>
            <span className="sr-only">Optimization direction</span>
            <select
              value={problem.direction}
              onChange={(e) =>
                setProblem((p) => ({
                  ...p,
                  direction: e.target.value as Problem["direction"],
                }))
              }
            >
              <option value="max">Maximize</option>
              <option value="min">Minimize</option>
            </select>
          </label>
          <span>Z =</span>
          {(["x", "y"] as const).map((axis, i) => (
            <label key={axis}>
              {i > 0 && <span> + </span>}
              <NumberField
                label={`Objective ${axis} coefficient`}
                value={problem.objective[axis]}
                onChange={(value) =>
                  number(value, `objective-${axis}`, (n) =>
                    setProblem((p) => ({
                      ...p,
                      objective: { ...p.objective, [axis]: n },
                    })),
                  )
                }
              />
              <span>{axis}</span>
            </label>
          ))}
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={problem.nonnegative}
            onChange={(e) =>
              setProblem((p) => ({ ...p, nonnegative: e.target.checked }))
            }
          />{" "}
          Assume x ≥ 0 and y ≥ 0
        </label>
        <p className="muted small">
          Turn this off to allow negative values for both variables.
        </p>
        <div className="constraints">
          {problem.constraints.map((c, i) => (
            <fieldset
              key={`${revision}-${i}`}
              style={{ borderLeftColor: colors[i] }}
            >
              <legend>Constraint {i + 1}</legend>
              <div className="equation">
                <NumberField
                  label={`Constraint ${i + 1} x coefficient`}
                  value={c.a}
                  onChange={(value) =>
                    number(value, `${i}-a`, (n) => constraint(i, { a: n }))
                  }
                />
                <span>x +</span>
                <NumberField
                  label={`Constraint ${i + 1} y coefficient`}
                  value={c.b}
                  onChange={(value) =>
                    number(value, `${i}-b`, (n) => constraint(i, { b: n }))
                  }
                />
                <span>y</span>
                <select
                  aria-label={`Constraint ${i + 1} relation`}
                  value={c.op}
                  onChange={(e) =>
                    constraint(i, { op: e.target.value as Constraint["op"] })
                  }
                >
                  <option value="<=">≤</option>
                  <option value=">=">≥</option>
                  <option value="=">=</option>
                </select>
                <NumberField
                  label={`Constraint ${i + 1} right-hand side`}
                  value={c.rhs}
                  onChange={(value) =>
                    number(value, `${i}-rhs`, (n) => constraint(i, { rhs: n }))
                  }
                />
                <button
                  className="remove"
                  aria-label={`Remove constraint ${i + 1}`}
                  onClick={() => {
                    setProblem((p) => ({
                      ...p,
                      constraints: p.constraints.filter(
                        (_, index) => index !== i,
                      ),
                    }));
                    setRevision((r) => r + 1);
                    setInvalid([]);
                  }}
                >
                  ×
                </button>
              </div>
              <label className="slider">
                Adjust right-hand side <output>{fmt(c.rhs)}</output>
                <input
                  aria-label={`Constraint ${i + 1} RHS slider`}
                  type="range"
                  min={Math.min(-10, Math.floor(c.rhs / 10) * 10 - 10)}
                  max={Math.max(20, Math.ceil(c.rhs / 10) * 10 + 10)}
                  step="0.1"
                  value={c.rhs}
                  onChange={(e) => {
                    constraint(i, { rhs: Number(e.target.value) });
                    setInvalid((v) => v.filter((k) => k !== `${i}-rhs`));
                  }}
                />
              </label>
            </fieldset>
          ))}
        </div>
        <button
          className="add"
          disabled={problem.constraints.length >= 8}
          onClick={() =>
            setProblem((p) => ({
              ...p,
              constraints: [...p.constraints, { a: 1, b: 1, op: "<=", rhs: 5 }],
            }))
          }
        >
          + Add constraint ({problem.constraints.length}/8)
        </button>
        {invalid.length > 0 && (
          <p role="alert" className="error">
            Enter a finite number between −1,000,000 and 1,000,000 in every
            field.
          </p>
        )}
      </section>
      <section className="panel visualization" aria-labelledby="graph-heading">
        <div className="section-heading">
          <h2 id="graph-heading">2. Explore the graph</h2>
          <label className="zoom">
            View{" "}
            <select
              aria-label="Graph zoom"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            >
              <option value={0.5}>Zoom in</option>
              <option value={1}>Fit solution</option>
              <option value={2}>Zoom out</option>
              <option value={5}>Wide view</option>
            </select>
          </label>
        </div>
        <svg
          viewBox="0 0 580 580"
          role="img"
          aria-label="Linear programming graph: constraint lines, shaded feasible region, corner points, and optimal solution"
        >
          <defs>
            <clipPath id="plot">
              <rect x="54" y="46" width="480" height="480" />
            </clipPath>
          </defs>
          <rect
            x="54"
            y="46"
            width="480"
            height="480"
            fill="#fafcfb"
            stroke="#ccd8d2"
          />
          {Array.from({ length: 6 }, (_, i) => {
            const v = low + (span * i) / 5,
              m = map({ x: v, y: v });
            return (
              <g key={i}>
                <path
                  d={`M ${m.x} 46 V 526 M 54 ${m.y} H 534`}
                  stroke="#e2e9e5"
                />
                <text x={m.x} y="549" textAnchor="middle">
                  {fmt(v)}
                </text>
                <text x="46" y={m.y + 4} textAnchor="end">
                  {fmt(v)}
                </text>
              </g>
            );
          })}
          <g clipPath="url(#plot)">
            <polygon
              points={polygon.map(coords).join(" ")}
              fill="#29a57a"
              fillOpacity=".2"
              stroke="#16835e"
              strokeWidth="3"
            />
            <path
              d={`M ${map({ x: 0, y: 0 }).x} 46 V 526 M 54 ${map({ x: 0, y: 0 }).y} H 534`}
              stroke="#72857b"
            />
            {problem.constraints.map((c, i) => {
              const l = line(c.a, c.b, c.rhs);
              return (
                l && (
                  <line
                    key={i}
                    x1={l[0].x}
                    y1={l[0].y}
                    x2={l[1].x}
                    y2={l[1].y}
                    stroke={colors[i]}
                    strokeWidth="2"
                  >
                    <title>Constraint {i + 1}</title>
                  </line>
                )
              );
            })}
            {result?.vertices.map((p, i) => (
              <circle key={i} cx={map(p).x} cy={map(p).y} r="4" fill="#163e31">
                <title>
                  Corner ({fmt(p.x)}, {fmt(p.y)})
                </title>
              </circle>
            ))}
            {result?.status === "optimal" && result.point && (
              <g>
                <circle
                  cx={map(result.point).x}
                  cy={map(result.point).y}
                  r="9"
                  fill="#ffce54"
                  stroke="#604700"
                  strokeWidth="2"
                />
                <text
                  x={map(result.point).x + 12}
                  y={map(result.point).y - 12}
                  fontWeight="bold"
                >
                  Optimal
                </text>
              </g>
            )}
          </g>
          <text x="550" y="527">
            x
          </text>
          <text x="54" y="30">
            y
          </text>
        </svg>
        <div className="legend">
          <span>
            <i style={{ background: "#b4e4d3" }} />
            Feasible region
          </span>
          <span>
            <i style={{ background: "#ffce54" }} />
            Optimal point
          </span>
          {problem.constraints.map((_, i) => (
            <span key={i}>
              <i style={{ background: colors[i] }} />C{i + 1}
            </span>
          ))}
        </div>
        <p className="small muted">
          The graph shows a finite window. Shading at its edge may continue
          beyond the view. Equality constraints can produce a line or a single
          point. The solver uses the constraints, independent of the view.
        </p>
      </section>
      <section className="panel result" aria-labelledby="answer-heading">
        <h2 id="answer-heading">3. Read the answer</h2>
        <div aria-live="polite" aria-atomic="true">
          {!result ? (
            <p>Complete all number fields to see the solution.</p>
          ) : result.status === "infeasible" ? (
            <>
              <h3>No feasible solution</h3>
              <p>
                No point satisfies all constraints. Try relaxing a constraint or
                adjusting its right-hand side.
              </p>
            </>
          ) : result.status === "unbounded" ? (
            <>
              <h3>The objective is unbounded</h3>
              <p>
                Feasible points exist, but Z can{" "}
                {problem.direction === "max" ? "increase" : "decrease"} without
                limit. There is no finite{" "}
                {problem.direction === "max" ? "maximum" : "minimum"}.
              </p>
            </>
          ) : (
            <>
              <h3>
                {problem.direction === "max" ? "Maximum" : "Minimum"} Z ={" "}
                {fmt(result.value!)}
              </h3>
              <p>
                At x = <strong>{fmt(result.point!.x)}</strong> and y ={" "}
                <strong>{fmt(result.point!.y)}</strong>.
              </p>
              {result.multiple && (
                <p className="notice">
                  Multiple optimal solutions: the highlighted point is one
                  example. Other feasible points attain the same objective
                  value.
                </p>
              )}
            </>
          )}
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={showTable}
            onChange={(e) => setShowTable(e.target.checked)}
          />{" "}
          Show corner-point calculations
        </label>
        {showTable && result && (
          <>
            {result.vertices.length ? (
              <div className="table-scroll">
                <table>
                  <caption>Feasible corner points</caption>
                  <thead>
                    <tr>
                      <th>x</th>
                      <th>y</th>
                      <th>
                        Z = {problem.objective.x}x + {problem.objective.y}y
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.vertices.map((p, i) => (
                      <tr
                        key={i}
                        className={
                          result.status === "optimal" &&
                          Math.abs(dot(p, problem.objective) - result.value!) <
                            1e-7
                            ? "best"
                            : ""
                        }
                      >
                        <td>{fmt(p.x)}</td>
                        <td>{fmt(p.y)}</td>
                        <td>{fmt(dot(p, problem.objective))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">
                No corner points. A feasible line, strip, or plane can have no
                corners; check the solution above.
              </p>
            )}
          </>
        )}
        <details>
          <summary>How the graphical method works</summary>
          <ol>
            <li>
              Draw each constraint boundary and keep the side satisfying its
              inequality.
            </li>
            <li>Intersect these regions to find feasible points.</li>
            <li>
              Evaluate the objective at feasible corners and check whether it
              can improve indefinitely.
            </li>
            <li>
              A finite optimum lies at a corner when corners exist. A parallel
              objective can give an entire optimal edge.
            </li>
          </ol>
          <p>
            Calculations use floating-point arithmetic and a numerical
            tolerance. Extremely ill-conditioned problems may require a
            specialist solver.
          </p>
        </details>
      </section>
    </div>
  );
}
