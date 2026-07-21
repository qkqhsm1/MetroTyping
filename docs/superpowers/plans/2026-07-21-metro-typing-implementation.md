# MetroTyping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished six-line Korean metro typing game with SVG route motion, sound, local practice, anonymous nicknames, and validated online rankings.

**Architecture:** A Vite React client owns deterministic route/game logic and renders full-route SVG maps from shared station path-distance data. Firebase adapters are optional at runtime: practice works locally, while nickname reservation and ranked result writes go through authenticated callable functions.

**Tech Stack:** Node 24, Vite, React 19, TypeScript, Vitest, Testing Library, Firebase Web SDK, Firebase Functions v2, Firestore, SVG, CSS, Web Audio API.

## Global Constraints

- Support Seoul Lines 1 and 2, Incheon Lines 1 and 2, AREX, and JR Yamanote.
- Use one SVG `viewBox` per line for path, station nodes, labels, and train.
- Derive station/train positions from SVG route distance; never duplicate them as responsive CSS pixel coordinates.
- Input and scoring must never wait for train animation.
- Never submit Korean input while IME composition is active.
- Practice works without Firebase; ranked mode requires authenticated server validation.
- Use official line colors with text/number cues and respect reduced motion and audio mute.
- Do not copy metrotyping.kr assets, real train art, or announcement audio.

---

### Task 1: Client shell and runnable test harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles.css`
- Create: `src/test/setup.js`
- Create: `src/App.test.jsx`

**Interfaces:**
- Produces: `App(): JSX.Element`, `npm run dev`, `npm test`, and `npm run build`.

- [ ] **Step 1: Create the package scripts and dependencies**

Use React/Vite plus only Firebase and the test packages required by the approved design. Scripts: `dev`, `build`, `preview`, and `test` (`vitest run`).

- [ ] **Step 2: Write the failing shell test**

Assert that the page exposes the `METRO/TYPE` product name and both `노선 운행` and `랜덤 역명` mode buttons.

- [ ] **Step 3: Run the test and verify failure**

Run: `npm test -- src/App.test.jsx`  
Expected: FAIL because the application shell does not exist.

- [ ] **Step 4: Implement the minimum shell and design tokens**

Create an accessible white-base layout with route-color CSS custom properties, Korean system font fallbacks, visible focus, and a responsive content container.

- [ ] **Step 5: Verify the shell**

Run: `npm test -- src/App.test.jsx` and `npm run build`  
Expected: tests pass and Vite emits `dist/`.

### Task 2: Six-line route data and deterministic routing

**Files:**
- Create: `src/data/lines.js`
- Create: `src/game/routes.js`
- Create: `src/game/routes.test.js`

**Interfaces:**
- Produces: `LINES`, `getLine(lineId)`, `getRoute(lineId, fromId, toId, direction)`, and `dailyStations(lineId, dateKey)`.
- Route result: `{ stationIds: string[], direction: string, pathId: string }`.

- [ ] **Step 1: Write route tests**

Cover Seoul Line 2 clockwise/counterclockwise wraparound, Yamanote inner/outer ordering, Seoul Line 1 Guro-to-Incheon and Guro-to-Sinchang branches, adjacent terminals, invalid cross-branch direction, and deterministic daily random sequences without adjacent duplicates.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/game/routes.test.js`  
Expected: FAIL because route data/functions do not exist.

- [ ] **Step 3: Add normalized line data**

Each line contains `id`, `name`, `color`, `viewBox`, `paths`, and `stations`. Each station contains `id`, `ko`, `en`, optional `kanji`/`kana`, `number`, `pathId`, and `distance`. Branch connections are explicit graph edges.

- [ ] **Step 4: Implement graph routing and seeded shuffle**

Use breadth-first search constrained by selected circular direction. Use a small deterministic integer hash/PRNG for the daily sequence; do not add a dependency.

- [ ] **Step 5: Verify routes**

Run: `npm test -- src/game/routes.test.js`  
Expected: all branch, loop, and random-order assertions pass.

### Task 3: SVG map geometry and line-colored train

**Files:**
- Create: `src/components/RouteMap.jsx`
- Create: `src/components/TrainIcon.jsx`
- Create: `src/components/RouteMap.test.jsx`
- Create: `src/game/geometry.js`
- Create: `src/game/geometry.test.js`

**Interfaces:**
- Consumes: `Line`, active route station IDs, logical target index.
- Produces: `samplePolyline(points, distance) -> { x, y, angle }` and `<RouteMap line route progress reducedMotion />`.

- [ ] **Step 1: Write geometry and rendering tests**

Assert endpoint/intermediate sampling, tangent angles, station distance monotonicity, loop wraparound, one shared `viewBox`, neutral remaining path, colored completed path, and a train transform sourced from sampled route distance.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/game/geometry.test.js src/components/RouteMap.test.jsx`  
Expected: FAIL because geometry/map components do not exist.

- [ ] **Step 3: Implement path sampling**

Represent approved schematic routes as polylines with rounded SVG joins. Compute cumulative segment lengths and sample x/y/tangent from distance. Station nodes derive their coordinates through the same sampler.

- [ ] **Step 4: Implement the full-route map**

Render the neutral base route, colored progress overlay, station nodes/numbers, labels, and original train pictogram. Animate displayed distance toward target distance; increase chase speed when more than one station behind and snap only when reduced motion is enabled.

- [ ] **Step 5: Verify geometry**

Run: `npm test -- src/game/geometry.test.js src/components/RouteMap.test.jsx`  
Expected: all geometry and DOM assertions pass.

### Task 4: Game reducer, Korean IME input, metrics, and sound

**Files:**
- Create: `src/game/game.js`
- Create: `src/game/game.test.js`
- Create: `src/components/Game.jsx`
- Create: `src/components/Game.test.jsx`
- Create: `src/audio/sounds.js`

**Interfaces:**
- Produces: `createGame(route, mode)`, `gameReducer(state, action)`, `calculateResults(state)`, `useGameSounds(settings)`, and `<Game session onFinish />`.

- [ ] **Step 1: Write reducer and IME tests**

Cover correct/incorrect Enter, no submission while composing, immediate target advancement during visual lag, 60-second random completion, CPM/accuracy/slowest-station metrics, focus retention, and final-arrival result delay.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/game/game.test.js src/components/Game.test.jsx`  
Expected: FAIL because game modules do not exist.

- [ ] **Step 3: Implement pure game state**

Keep `targetIndex`, typed/error counts, timestamps, per-station timing, and completion separate from the RouteMap's displayed train distance. Normalize answers with Unicode NFC and trimmed whitespace without accepting different station names.

- [ ] **Step 4: Implement the game screen and Web Audio**

Handle composition events explicitly, restore input focus, show immediate correct/error feedback, and generate short oscillator/noise sounds after the player's start action. Persist mute, volume, and reduced-motion preferences locally.

- [ ] **Step 5: Verify gameplay**

Run: `npm test -- src/game/game.test.js src/components/Game.test.jsx`  
Expected: all scoring, concurrency, IME, and interaction tests pass.

### Task 5: Setup, tutorial, results, and polished responsive UI

**Files:**
- Create: `src/components/Home.jsx`
- Create: `src/components/Setup.jsx`
- Create: `src/components/Tutorial.jsx`
- Create: `src/components/Results.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`
- Create: `src/App.flow.test.jsx`

**Interfaces:**
- Consumes: line data, route builder, Game completion result.
- Produces: complete home -> setup -> play -> result flow and persisted local settings/bests.

- [ ] **Step 1: Write the end-to-end component flow test**

Select Seoul Line 2, route mode, origin/destination, start, type the expected station, and assert result metrics. Also cover Yamanote Japanese labels/direction and unavailable ranked-mode messaging.

- [ ] **Step 2: Run the flow test and verify failure**

Run: `npm test -- src/App.flow.test.jsx`  
Expected: FAIL because the screens are not connected.

- [ ] **Step 3: Implement the complete local flow**

Add first-run tutorial, six line cards, route/random configuration, full game HUD, results insights, local bests, sound controls, and predictable browser back/restart behavior.

- [ ] **Step 4: Finish responsive visual detail**

Use the selected line color sparingly on a warm-white canvas. Keep the full route visible, preserve SVG ratio, permit touch pan/zoom on small screens, maintain 24px minimum targets, and prevent the mobile keyboard from covering target/input content.

- [ ] **Step 5: Verify the local product**

Run: `npm test` and `npm run build`  
Expected: complete suite passes and production build succeeds.

### Task 6: Anonymous nicknames and validated online rankings

**Files:**
- Create: `src/firebase/client.js`
- Create: `src/firebase/rankings.js`
- Create: `src/components/Profile.jsx`
- Create: `src/components/Leaderboard.jsx`
- Create: `functions/package.json`
- Create: `functions/index.js`
- Create: `functions/index.test.js`
- Create: `firebase.json`
- Create: `firestore.rules`
- Create: `.env.example`

**Interfaces:**
- Produces: `reserveNickname(name)`, `beginRankedRun(course)`, `submitRankedRun(run)`, and `subscribeLeaderboard(filter)`.
- Callable results: `{ ok: true, nickname }`, `{ runId, issuedAt, courseHash }`, and `{ accepted, rank, percentile }`.

- [ ] **Step 1: Write function tests**

Use Firebase emulators to cover normalized nickname collisions, authentication requirement, single-use ranked tickets, course/version mismatch, impossible duration, replay, and valid result creation.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm --prefix functions test`  
Expected: FAIL because callable functions do not exist.

- [ ] **Step 3: Implement callable functions and strict rules**

Reserve normalized nickname documents transactionally. Issue server-timed run tickets, validate submitted station/timing summaries, write accepted results with Admin SDK, and deny direct client leaderboard writes in Firestore Rules.

- [ ] **Step 4: Implement optional client adapters**

Initialize Firebase only when every required `VITE_FIREBASE_*` variable exists. Otherwise expose local practice and a clear ranked-unavailable state without throwing.

- [ ] **Step 5: Verify online behavior locally**

Run: `firebase emulators:exec "npm --prefix functions test"` and `npm test`  
Expected: function tests and client fallback tests pass.

### Task 7: Final data, accessibility, geometry, and visual verification

**Files:**
- Modify: `src/data/lines.js`
- Create: `src/data/lines.test.js`
- Create: `README.md`
- Modify: `MDs/Workflow.md`

**Interfaces:**
- Consumes: complete application.
- Produces: verified station dataset, documented setup, and completion evidence.

- [ ] **Step 1: Reconcile official railway sources**

Check every station spelling/order/direction and official line color against Seoul, Incheon Transit, AREX, and JR East sources. Record source URL and verification date in each line object.

- [ ] **Step 2: Add dataset invariants**

Assert unique IDs/numbers, connected graphs, valid terminals, station distances within path length, <=0.5 SVG-unit station/path deviation, and complete Korean/Japanese labels.

- [ ] **Step 3: Run all automated checks**

Run: `npm test`, `npm run build`, and Firebase emulator function tests.  
Expected: all checks pass with no warnings that affect gameplay.

- [ ] **Step 4: Inspect rendered breakpoints**

Capture 360, 768, and 1440 CSS-pixel widths for every line and inspect route shape, labels, train alignment, keyboard clearance, contrast, focus, sound mute, and reduced motion.

- [ ] **Step 5: Update handoff documentation**

Document exact local/Firebase commands and remaining external setup in `README.md`; replace Workflow progress with verified results and unresolved limitations only.
