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

## Review correction: topology-aware gameplay geometry

The first Task 6 commit's six newly added uniform polylines were rejected in review because they did not preserve Line 5 branch choice or the Line 6 directed loop, and its render-only smoke did not independently validate geometry. This section supersedes the earlier geometry acceptance claim.

### Source and method

`src/game/routeGeometry.ts` now owns the geometry separately from the renderer. Its Seoul 4–9 values are **source-guided normalized gameplay anchors**, manually digitized into the 600×290 gameplay `viewBox` while comparing the bundled official 2025-09-29 overview raster and `public/assets/seoul-supported-lines.svg`. They preserve recognizable direction changes, endpoints, the Gangdong branch choice, and the directed Eungam loop. They are schematic presentation coordinates, not official or geospatial station coordinates.

Line 5 declares separate trunk, Hanam, and Macheon paths. The two branch paths share their Gangdong approach and then diverge, while a muted context path shows the sibling branch. Line 6 declares an open trunk independently from its directed loop; the loop has a separate closure segment from Gusan back to Eungam.

### TDD correction evidence

The replacement test was written before the correction and failed 10 of 16 RouteMap tests against the uniform paths: all eight topology fixtures lacked the required route metadata/reference endpoints, the Line 5 paths did not express shared-then-divergent topology, and Line 6 had no directed closure.

The corrected tests keep expected normalized anchors in `RouteMap.test.tsx`, independently from production selection and rendering. They parse rendered SVG route points, station-circle coordinates, train transforms, and context paths. For every Seoul 4–9 topology case they assert:

- the independently expected route key and endpoints;
- station-to-reference-anchor error below 0.001 SVG unit;
- station-to-rendered-path distance below 0.01 SVG unit;
- train-to-rendered-path distance below 0.01 SVG unit;
- distinct Line 5 Hanam/Macheon tails after a shared four-anchor Gangdong approach;
- a directed Line 6 loop closure that is absent from the open trunk.

Focused command:

```powershell
npx vitest run src/components/RouteMap.test.tsx src/game/geometry.test.ts src/components/Game.test.tsx
```

Result: 3 files passed, 28 tests passed, 0 failed.

Final correction gate:

```powershell
npm run check
git diff --check
```

Result: ESLint passed; 77 client tests in 11 files passed; 2 server tests passed; strict TypeScript passed; Vite built 42 modules; `git diff --check` exited 0.

### Corrected gameplay captures

A fresh Edge preview on port 4189 produced 24 additional gameplay captures under:

`G:\Projects\MetroTyping\.worktrees\seoul-lines-1-9\.superpowers\sdd\task-6-review-captures\`

There are eight scenarios at each exact 360×900, 768×900, and 1440×900 CSS viewport:

- `WIDTH-review-line4-game.png`
- `WIDTH-review-line5-hanam-game.png`
- `WIDTH-review-line5-macheon-game.png`
- `WIDTH-review-line6-loop-game.png`
- `WIDTH-review-line7-game.png`
- `WIDTH-review-line8-game.png`
- `WIDTH-review-line9-local-game.png`
- `WIDTH-review-line9-express-game.png`

`measurements.jsonl` records the exact route key, route/context points, station-node/label count, train transform, target, viewport, and horizontal-overflow measurements for all 24 captures. Visual inspection found readable labels and controls without page overflow at every width; train/path alignment was visually consistent; Seoul 4/7/8 and both Line 9 services retained their recognizable bends; Line 5 visibly changed branch direction between Hanam and Macheon; and Line 6 rendered a closed loop. Each capture had a visible train and 6–8 station labels/nodes.

Remaining uncertainty is unchanged for physical audio, real OS IME composition UI, touch feel, and device GPU rendering. The gameplay geometry is intentionally normalized and schematic; official-map fidelity remains with the overview raster/vector layer.

## Review correction: stable Line 5 branch identity

The topology review found one remaining identity defect: `Game` passed only its current `visibleStations` slice into `RouteMap`, so Line 5 fell back to `seoul-5-trunk` whenever `길동` or `둔촌동` was outside that eight-station window. Geometry could therefore change at a segment boundary even though the selected full route had not changed.

TDD RED added four forward/reverse regressions covering both branches after the marker leaves or before it enters the visible window. All four failed with `data-geometry="seoul-5-trunk"`. The minimal fix adds an optional `geometryStations` input to `RouteMap`; `Game` passes the immutable full `stations` route for identity resolution while continuing to pass only `visibleStations` for labels, nodes, target index, and the maximum-eight rendering cap.

The green regressions cover:

- forward Hanam after `길동` leaves the segment;
- forward Macheon after `둔촌동` leaves the segment;
- reverse Hanam before `길동` enters the segment;
- reverse Macheon before `둔촌동` enters the segment.

Focused verification:

```powershell
npx vitest run src/components/Game.test.tsx src/components/RouteMap.test.tsx src/game/geometry.test.ts
```

Result: 3 files passed, 36 tests passed, 0 failed; strict TypeScript also passed.

The final `npm run check` passed ESLint, 85 client tests in 11 files, 2 server tests, strict TypeScript, and the 42-module Vite build; `git diff --check` exited 0.

Fresh Edge evidence is under `.superpowers/sdd/task-6-stable-identity-captures-v2/`. At exact 360, 768, and 1440 CSS-pixel widths, the forward routes were advanced to segment 42, after the branch markers had left the visible window:

- Hanam retained `data-geometry="seoul-5-hanam"`, showed 7 labels, and targeted `상일동` at 44/49.
- Macheon retained `data-geometry="seoul-5-macheon"`, showed 4 labels, and targeted `개롱` at 44/46.

Visual inspection confirmed that both paths retained their distinct branch direction, labels remained readable, the train remained on the selected path, and no horizontal page overflow appeared at any width. No styles or animation behavior changed.
