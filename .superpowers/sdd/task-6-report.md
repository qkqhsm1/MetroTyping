# Task 6 Verification Report

Date: 2026-07-22  
Worktree: `G:\Projects\MetroTyping\.worktrees\seoul-lines-1-9`  
Branch: `feature/seoul-lines-1-9`

## Result

Task 6 release verification passed after fixing one reproduced regression: Seoul Lines 4–9 were public but lacked focused gameplay geometry in `RouteMap`, causing gameplay to throw. The release now reports `14 LINES`, every Seoul Line 1–9 dock control is enabled, every public line has declared gameplay geometry, and all requested automated and browser gates pass.

Commit: `HEAD` (`feat: complete Seoul lines 1 through 9`); immutable hash is included in the task handoff.

## TDD evidence

### Public release count

1. Added the `14 LINES` assertion and enabled-button smoke for Seoul Lines 1–9 to `src/App.test.tsx`.
2. RED command: `npx vitest run src/App.test.tsx`
3. RED result: 1 failed, 13 passed; the sole failure was `Unable to find an element with the text: 14 LINES`, while production rendered `9 LINES`.
4. Changed only the footer count in `src/App.tsx`.
5. GREEN result: 14 passed in 1 file.

### Public gameplay geometry regression

Inspection of the public setup-to-game flow found `RouteMap` entries only for Seoul Lines 1–3. Seoul Lines 4–9 reached the same shared component but threw `Missing route geometry`.

1. Added a six-case public-line render regression to `src/components/RouteMap.test.tsx`.
2. RED command: `npx vitest run src/components/RouteMap.test.tsx`
3. RED result: 6 failed, 6 passed; each of Seoul Lines 4–9 failed with its exact missing-geometry error.
4. Added only the six missing SVG-coordinate polylines to the existing `routes` table in `src/components/RouteMap.tsx`.
5. GREEN command: `npx vitest run src/components/RouteMap.test.tsx src/game/geometry.test.ts`
6. GREEN result: 14 passed in 2 files.

The focused geometry model samples stations and the train from the same declared polyline and SVG `viewBox`; it does not introduce CSS-pixel train positioning or animation state into scoring/input state.

## Automated verification

Final high-risk command:

```powershell
npx vitest run src/components/Game.test.tsx src/components/RouteMap.test.tsx src/game/geometry.test.ts src/audio/sounds.test.ts src/App.test.tsx
```

Result: 5 files passed, 39 tests passed, 0 failed. This covers departure-first typing, train hidden until the first correct answer, rapid answers, Korean IME Enter suppression, Hangul-jaso CPM, a maximum of eight visible stations, mute/resume behavior, and path sampling/alignment.

Final repository gate:

```powershell
npm run check
git diff --check
```

Result:

- ESLint: passed.
- Client Vitest: 11 files passed, 73 tests passed, 0 failed.
- Server Node tests: 2 passed, 0 failed.
- Strict TypeScript: passed.
- Vite production build: passed; 41 modules transformed.
- `git diff --check`: exit 0, no whitespace errors.

## Browser verification

Fresh preview commands:

```powershell
npm run build
npx vite preview --host 127.0.0.1 --port 4189
```

`http://127.0.0.1:4189/MetroTyping/` returned HTTP 200 with `text/html`. Microsoft Edge ran with exact CSS viewport overrides of 360×900, 768×900, and 1440×900. Thirty PNG captures and JSONL DOM/geometry measurements are stored at:

`G:\Projects\MetroTyping\.worktrees\seoul-lines-1-9\.superpowers\sdd\task-6-captures\`

Each width contains:

- `WIDTH-overview-line5-focus.png`
- `WIDTH-line5-setup.png`
- `WIDTH-line6-setup.png`
- `WIDTH-line6-game-before.png`
- `WIDTH-line6-game-after.png`
- `WIDTH-line8-setup.png`
- `WIDTH-line9-local-setup.png`
- `WIDTH-line9-local-game.png`
- `WIDTH-line9-express-setup.png`
- `WIDTH-line9-express-game.png`

Machine-readable evidence is in `measurements.jsonl` (10 scenarios per width, 30 total).

### Visual and measured findings

- No page-level horizontal overflow occurred at any tested width.
- At 768 and 1440, the full-width overview map had no internal horizontal scrollbar. At 360, the intended 850 px map surface and dock remained touch-pannable.
- Overview labels remained readable at 360 through panning; the focused Line 5 vector followed the official raster. Controls were neither clipped nor overlapping.
- Line 5 setup displayed both `방화 ↔ 하남검단산` and branch travel; Line 6 displayed its `응암순환` quick route; Line 8 displayed the current `별내 ↔ 모란` extension.
- Every captured gameplay route contained exactly 8 station nodes and 8 labels.
- Line 6 before departure had no `.train`, target `응암`; after entering the correct departure it had a train and target `새절`.
- Line 9 local selected `일반`, began at `개화`, and showed 38 stations. Express selected `급행`, began at `김포공항`, showed 16 stations, and never displayed `개화`.
- Gameplay controls and text remained within the viewport at 360, 768, and 1440.

## Preserved behavior

No changes were made to IME composition handling, jaso CPM calculation, audio implementation, input/scoring timing, station segmentation, train animation state, or styles. Existing tests for those paths remained green. The geometry fix keeps the route, sampled stations, and train in one SVG coordinate system.

## Concerns and remaining uncertainty

- Headless Edge cannot validate physical speaker output or a real OS Korean IME candidate window.
- Touch gesture feel and GPU rendering differences still require a physical-phone smoke test.
- The focused gameplay polylines are schematic, as they already are for other lines; official-route fidelity is carried by the overview raster/vector overlay. Station and train alignment on each gameplay polyline is numerically enforced.
- No push or deployment was performed.
