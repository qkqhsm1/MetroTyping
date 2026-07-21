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
