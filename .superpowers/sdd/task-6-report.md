# Task 6 Report

## Result

- Route play renders no train before the correct departure answer.
- The first correct answer advances scoring and the prompt immediately while revealing a 260 ms SVG entrance.
- A second correct answer is accepted before the entrance timer completes; the train follows the latest completed station.
- Random mode remains train-free, the front-edge anchor is unchanged, and reduced motion disables the entrance transform and animation.

## TDD

- RED: `npm test -- src/components/Game.test.tsx src/components/RouteMap.test.tsx` — 2 expected failures because `.train` was unconditional.
- GREEN: the same command — 15/15 tests passed.

## Verification

- `npm run check` — passed: ESLint, 44 client tests, 2 server tests, strict TypeScript, and Vite production build.
- `git diff --check` — passed.

## Self-review

- Presentation state is separate from answer progress; no input disabling or awaited animation was introduced.
- One browser timer is created only on the first correct route answer and cleared on unmount.
- The outer train transform still comes only from SVG path sampling; entrance motion is confined to the inner shell.
- No dependencies or speculative abstractions added.

## Concerns

- None.

## Review fix

- Fix: `.train-light` now has `stroke={color}`, `strokeWidth="3"`, and `strokeLinecap="round"`, so the open SVG path is visible without changing its coordinates.
- RED: `npm test -- src/components/Game.test.tsx src/components/RouteMap.test.tsx` — 1 failed, 14 passed; the light assertion received `stroke=null`.
- GREEN: `npm test -- src/components/Game.test.tsx src/components/RouteMap.test.tsx` — 2 test files passed, 15 tests passed.
- Timer coverage: `.train-entering` remains at 259 ms, is removed at 260 ms, and unmounting with the timer pending produces no `console.error` after timers advance.
- Full verification: `npm run check` — ESLint passed; 9 client files/44 tests passed; 2 server tests passed; strict TypeScript passed; Vite built 40 modules successfully in 131 ms.
