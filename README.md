# Operational Research

An interactive two-variable linear programming learning site built with Next.js and TypeScript. Phase 1 implements the graphical method: coefficient inputs, ≤/≥/= constraints, feasible-region shading, corners, optimal values, live RHS sliders, and explanations for infeasible, unbounded, and multiple-optimum problems.

## Develop

Use Node.js 24 and npm 11.

```sh
npm ci
npm run dev
```

Open the development server in a browser. No database, accounts, credentials, or external APIs are needed. Variables are nonnegative by default; uncheck the assumption to allow negative coordinates. Up to eight constraints are supported. Choose maximize/minimize, edit coefficients, or move the RHS sliders. Reset restores the worked example. The optional table shows every feasible corner and its objective value.

## Validate

```sh
npm test
npm run build
npm run typecheck
npm start
```

`npm test` runs the solver's named tests, including the production-mix example (maximize 3x + 2y, subject to x + y ≤ 4, x ≤ 2, y ≤ 3, x,y ≥ 0), whose optimum is (2,2) with Z=10. Tests also cover minimization, degeneracy, equality, free variables, infeasibility, unboundedness, and multiple solutions. These are independently specified examples, not transcribed course exercises; course notes have not been supplied.

For browser tests, install Chromium once with `npx playwright install chromium`, build, and start a server on port 3100:

```sh
npm run build
npm start -- --hostname 127.0.0.1 --port 3100
# In another terminal:
npm run test:e2e
```

Use `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e` for an existing system Chromium. `TEST_BASE_URL` overrides the test server URL. Tests cover live input, validation/reset, sliders, solver statuses, constraints, table visibility, and phone overflow. Browser tests do not start the server automatically.

## Structure and limitations

- `lib/solver.ts`: UI-independent half-plane solver and polygon clipping.
- `components/lp-workbench.tsx`: browser inputs, SVG graph, result and corner table.
- `tests/solver.test.ts`: analytic solver cases.
- `tests/browser/workbench.spec.ts`: interaction and mobile checks.

The solver checks feasibility and recession directions separately, so a finite graph window does not determine boundedness. Equality constraints can reduce the feasible set to a line or point. Finite optima without corners are supported. The highlighted point is one representative when there are multiple optima. The graph provides zoom controls and clips shading to its finite viewport; it is not a claim that the feasible set ends at the viewport.

Inputs are limited to absolute values of 1,000,000 in the UI. Floating-point tolerances mean nearly parallel or badly scaled problems can be numerically sensitive. This is an educational tool, not a certified optimization package. Deployment is deferred; the app can run locally or on a Next.js-compatible host. Simplex, more than two variables, accounts and saved data are outside Phase 1.
