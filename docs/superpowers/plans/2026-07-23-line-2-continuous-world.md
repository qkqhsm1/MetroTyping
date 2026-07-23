# Seoul Line 2 Continuous World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Line 2 station-window prototype with one persistent 43-station SVG world, true path-length motion, adaptive camera framing, stable single-line direction cards, and per-character typing feedback.

**Architecture:** A pure geometry module owns the official path, arc-length lookup, station samples, tangent normals, route-distance unwrapping, and camera bounds. `Line2TrackingMap` renders every station once and animates train/camera distances without changing the station DOM. `Game` keeps logical input state and renders a native input beneath a pointer-inert visual feedback layer.

**Tech Stack:** React 19, TypeScript, native SVG/CSS, `requestAnimationFrame`, Vitest, Testing Library. No new dependency.

## Global Constraints

- Apply only to ordered Seoul Line 2 gameplay.
- Keep all 43 station nodes mounted throughout play.
- Use measured official SVG path length for stations and train.
- Keep input/scoring independent from animation.
- Scale motion duration from 320 to 520 ms and retarget rapid answers from the rendered frame.
- Keep Korean and English direction-card names on one line.
- Keep centre card and typing field outer width stable through arrival.
- Preserve native Korean IME and reduced-motion behavior.

---

### Task 1: Arc-length geometry engine

**Files:**
- Create: `src/game/line2Geometry.ts`
- Create: `src/game/line2Geometry.test.ts`
- Modify: `src/components/Line2TrackingMap.tsx`

**Interfaces:**
- Produces: `LINE_2_PATH_D:string`, `LINE_2_TOTAL_LENGTH:number`, `line2PointAt(distance:number):{x:number;y:number;angle:number}`, `line2StationDistance(name:string):number`, `unwrapLine2Route(stations:string[]):number[]`, and `line2CameraWidth(routeDistances:number[],index:number):number`.

- [ ] **Step 1: Write failing pure-geometry tests**

Test that all 43 names map to strictly increasing canonical arc distances, wrap safely, sampled points stay within `0.5` SVG units of an independently sampled official cubic path, reverse routes unwrap with decreasing values, and camera widths stay inside `360..620` while differing between locally dense and sparse samples.

- [ ] **Step 2: Verify RED**

Run `npm test -- --run src/game/line2Geometry.test.ts`.
Expected: FAIL because `line2Geometry.ts` does not exist.

- [ ] **Step 3: Implement the minimum lookup**

Represent every cubic segment from the official path. Sample each segment at 128 subdivisions, accumulate Euclidean distance, and binary-search the lookup in `line2PointAt`. Assign the 43 canonical stations at equal measured arc-length intervals starting from the existing Sindorim anchor. Compute angle from adjacent lookup samples.

`unwrapLine2Route` chooses the signed shortest canonical delta between each adjacent route station. `line2CameraWidth` measures the local two-stations-before/two-after span, adds readable padding, then clamps to `360..620`.

- [ ] **Step 4: Replace duplicated component geometry**

Remove `curves`, `cubic`, `stationPhase`, `pointAtPhase`, `stationPoint`, and `routePhases` from `Line2TrackingMap.tsx`; import the geometry module instead.

- [ ] **Step 5: Verify GREEN and commit**

Run `npm test -- --run src/game/line2Geometry.test.ts src/components/Line2TrackingMap.test.tsx`.
Expected: PASS.

```bash
git add src/game/line2Geometry.ts src/game/line2Geometry.test.ts src/components/Line2TrackingMap.tsx
git commit -m "feat: sample Line 2 by official path length"
```

### Task 2: Persistent 43-station world and continuous camera

**Files:**
- Modify: `src/components/Line2TrackingMap.tsx`
- Modify: `src/components/Line2TrackingMap.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: Task 1 geometry exports.
- Produces: one persistent `.line2-tracking-map` containing 43 `[data-station]` groups and `data-camera-width`.

- [ ] **Step 1: Write failing persistent-world tests**

Render a full 43-station route, retain references to all station groups, rerender multiple target indexes, and assert the count stays 43 and every node identity is unchanged. Assert dense/sparse targets expose different bounded `data-camera-width`. During fake-frame motion, assert train distance is intermediate; retarget and confirm the next frame continues from that value.

- [ ] **Step 2: Verify RED**

Run `npm test -- --run src/components/Line2TrackingMap.test.tsx`.
Expected: FAIL because the component currently renders only three or four stations.

- [ ] **Step 3: Render the full world**

Map `LINE_2_STATIONS` instead of slicing route context. Keep target state as attributes/classes; let the SVG viewport clip distant content. Position label groups along each station's tangent normal, alternating sides, and apply staggered radial offsets where adjacent projected bounds would overlap.

- [ ] **Step 4: Animate distance and adaptive viewBox**

Store rendered train distance, camera distance, and camera width. On target change, interpolate from current rendered values to `routeDistances[targetIndex]` and `line2CameraWidth(...)`. Choose duration by clamping projected travel distance to `320..520` ms. Train uses ease-out cubic; camera uses smoothstep. Preserve rapid retargeting and reduced motion.

- [ ] **Step 5: Verify GREEN and commit**

Run `npm test -- --run src/components/Line2TrackingMap.test.tsx src/game/line2Geometry.test.ts`.
Expected: PASS.

```bash
git add src/components/Line2TrackingMap.tsx src/components/Line2TrackingMap.test.tsx src/styles.css
git commit -m "feat: keep the full Line 2 world continuous"
```

### Task 3: Stable cards and per-character input feedback

**Files:**
- Create: `src/components/Line2TypingField.tsx`
- Create: `src/components/Line2TypingField.test.tsx`
- Modify: `src/components/Game.tsx`
- Modify: `src/components/Game.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `<Line2TypingField target:string value:string inputRef:RefObject<HTMLInputElement|null> onChange onKeyDown>`.
- Consumes: selected route station names and existing Game input handlers.

- [ ] **Step 1: Write failing feedback tests**

Render target `구로디지털단지` with values `''`, `구로디지`, `구로디지덜단지`, and `구로디지털단지X`. Assert target-grey, correct-dark, wrong-red, remaining-grey, and extra-red spans. Assert the native input remains the textbox and does not expose a duplicate station number.

- [ ] **Step 2: Verify RED**

Run `npm test -- --run src/components/Line2TypingField.test.tsx`.
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the native-input overlay**

Render target-length positions by index. At each position show the typed character when present; assign `correct`, `wrong`, or `remaining`. Append extra typed characters as `wrong`. Overlay this pointer-inert visual line above a native input whose text is transparent but caret remains visible. Forward existing value/change/keydown behavior unchanged.

- [ ] **Step 4: Stabilize card and field dimensions**

In `Game`, calculate a route-level width token once from the maximum Korean/English display length and expose it as `--line2-card-width`, clamped by CSS. Apply the token to the centre card and typing field. Use `white-space:nowrap`, responsive font scaling, and mobile overflow that keeps the current card centred with partial side cards.

- [ ] **Step 5: Verify Game and IME behavior**

Run `npm test -- --run src/components/Line2TypingField.test.tsx src/components/Game.test.tsx`.
Expected: feedback, stable-width, rapid-answer, and Korean composition tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Line2TypingField.tsx src/components/Line2TypingField.test.tsx src/components/Game.tsx src/components/Game.test.tsx src/styles.css
git commit -m "feat: add precise Line 2 typing feedback"
```

### Task 4: Full verification and deployment

**Files:**
- Modify: `MDs/Workflow.md`

- [ ] **Step 1: Run full quality gate**

Run `npm run check`.
Expected: ESLint, all client/server tests, strict TypeScript, and production build PASS.

- [ ] **Step 2: Run real-browser visual QA**

Capture ordered Line 2 gameplay at 360, 768, and 1440 CSS pixels around Sindorim, Gangnam, Sindaebang, and Dongdaemun History & Culture Park. Inspect settled and intermediate frames for label overlap, clipping, one-line cards, stable field width, and continuous train/camera positions.

- [ ] **Step 3: Update project memory**

Move the continuous-world feature to Done, record exact test totals and captures, and preserve extension to other lines as Next.

- [ ] **Step 4: Commit and push**

```bash
git add MDs/Workflow.md
git commit -m "docs: record Line 2 continuous-world verification"
git push origin main
```

- [ ] **Step 5: Verify production**

Wait for the matching Pages run to succeed. Confirm `/MetroTyping/` and referenced JS/CSS assets return HTTP 200 with HTML, JavaScript, and CSS MIME types, and confirm the live JS contains the persistent-world and typing-feedback selectors.

### Task 5: Station-sign input and route-normal halo

**Files:**
- Modify: `src/components/Line2TypingField.tsx`
- Modify: `src/components/Line2TypingField.test.tsx`
- Modify: `src/components/Game.tsx`
- Modify: `src/components/Line2TrackingMap.tsx`
- Modify: `src/components/Line2TrackingMap.test.tsx`
- Modify: `src/styles.css`
- Modify: `MDs/Workflow.md`

- [ ] **Step 1: Write failing station-sign tests**

Pass the current station number into `Line2TypingField`. Assert the shell contains one pale number circle, its combined number/name group is centred, and only name spans receive `remaining`, `correct`, or `wrong`.

- [ ] **Step 2: Verify RED**

Run `npm test -- --run src/components/Line2TypingField.test.tsx src/components/Game.test.tsx`.
Expected: FAIL because the typing field does not accept or render a station number.

- [ ] **Step 3: Implement the matching sign**

Add `number:string` to `Line2TypingField` and render `.line2-typing-number` beside the feedback layer inside a centred `.line2-typing-content`. Keep the native input over only the name region so IME, caret, selection, and Enter handling remain unchanged.

- [ ] **Step 4: Write failing halo-normal test**

Render a current station, read `data-halo-normal`, and assert its vector dot-product with the station tangent is within `0.001` of zero. Assert the CSS endpoints are symmetric `-amplitude` and `+amplitude`.

- [ ] **Step 5: Implement route-normal motion**

Use `line2PointAt` angle to compute `normalX=-sin(angle)` and `normalY=cos(angle)`. Put the halo in a translated SVG group with CSS variables for symmetric 14-unit endpoints. Animate translation only; remove scale and viewport-relative transform-origin behavior. Disable it under reduced motion.

- [ ] **Step 6: Verify, inspect, and deploy**

Run `npm run check`, inspect 360/768/1440 real-game captures, update `MDs/Workflow.md`, commit scoped files, push `main`, and verify the Pages run plus live JavaScript/CSS selectors.

- [ ] **Step 7: Decouple per-station shell morphing from input geometry**

Compute `line2TargetWidth` from the current Korean/English labels and `line2InteractionWidth` from the route maximum. Keep the direction centre axis and native input surface at `line2InteractionWidth`; render separate `.line2-card-shell` and `.line2-typing-shell` decorations at `line2TargetWidth`. Transition their width over the travel interval and let rapid target changes retarget CSS from the rendered width. Test that short/long targets change shell widths while input outer bounds and text centre remain identical.
