# Operational Research Learning Site: Phase 1 Plan

## Overall vision
An interactive website that helps students learn operational research as a whole. Topics are added one at a time. Phase 1 covers linear programming (LP) only.

## Goal of Phase 1
A Next.js website where a student enters a two-variable LP problem, sees the feasible region and optimal corner point drawn on a graph, and adjusts constraints to see how the answer changes. Phase 1 covers only the graphical method.

## What must work at the end of Phase 1
1. Students enter an objective function (maximize or minimize) and up to a set number of constraints using <=, >=, or =.
2. The graph shows the constraint lines, shades the feasible region, and marks each corner point.
3. The optimal corner point and its objective value are highlighted, with the answer stated in words.
4. Sliders adjust each constraint's right-hand side, and the graph and answer update live.
5. Clear messages for infeasible problems, unbounded problems, and problems with multiple optimal solutions.
6. The solver logic passes a set of test problems, including textbook examples from the course notes.
7. The site works on a phone screen.

## Out of scope for Phase 1
- Simplex method and step-by-step walkthrough
- User accounts, saved student data, and any database
- Problems with more than two variables
- Any non-LP topic

## Open decisions
- Source of the test problems (textbook or course notes)
- Input style: typed form fields or free-text such as "3x + 2y <= 12"
- Number of constraints allowed in Phase 1
- Whether students see the corner-point calculation table or only the result
- Whether the site is public or runs locally for now

## Tech stack
- Next.js (latest stable) with TypeScript
- Solver logic in its own module with no UI code, so it can be tested and reused
- Interactive graph and sliders run in the browser
- Backend and database deferred until student accounts are needed

## Build order
1. Project setup: Next.js, TypeScript, basic layout
2. Solver module with tests, no UI
3. Input form connected to the solver
4. Graph rendering with the feasible region
5. Sliders and live updates
6. Error and edge-case messages
7. Mobile layout check and final review against test problems

## Git workflow
- Initial commits go straight to `main`.
- Each feature gets its own branch (e.g. `feat/project-setup`, `feat/lp-solver`), then a pull request into `main`.
- Pull requests are reviewed before merging.
