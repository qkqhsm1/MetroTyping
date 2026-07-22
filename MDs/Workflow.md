# Workflow

## Goal

Build a polished Korean subway typing game with Seoul Lines 1–9 plus the existing Incheon, AREX, Suin–Bundang, and Yamanote networks, including correct branches, Line 9 local/express play, a full-width overview, animated SVG trains, sound, anonymous nickname accounts, and online rankings.

## Decisions

- Stack: Vite, React, Firebase Authentication, Firestore, Cloud Functions, and App Check.
- Client language: TypeScript with custom CSS/SVG; no shadcn/ui, Tailwind, or Express.
- Quality gate: `npm run check` runs ESLint, Vitest, strict TypeScript checking, and the production build.
- Selection UX: official high-resolution Seoul overview plus aligned SVG hit areas; dedicated SVG replaces the raster for setup/gameplay. Tokyo uses a dedicated Yamanote loop.
- Target playable lines: Seoul 1–9, Incheon 1/2, AREX, Suin–Bundang, and JR Yamanote. Seoul Line 6 remains under construction until its directed loop passes the approved verification gate.
- Seoul Line 9 alone offers `일반 / 급행`: local uses `개화↔중앙보훈병원`, while express uses only its actual stops from `김포공항↔중앙보훈병원` in route and random modes.
- The Seoul overview uses the approved B layout: the entire original map fills the page width without desktop-internal scrollbars; mobile retains touch zoom and pan.
- Seoul Line 4 covers `진접↔오이도`; Seoul Line 6 covers the bidirectional `응암↔신내` trunk and the real one-way Eungam loop.
- The overview uses PDF-rendered high-resolution raster tiles for text clarity and SVG only for aligned interaction highlights.
- The first line selection plays one original Web Audio chime; existing effect gain rises from `0.09` to `0.135` with an output ceiling.
- Visual design: white base, official line color accents, full-route fixed overview.
- Route mode selects origin and destination; Yamanote also selects inner/outer direction.
- Seoul Line 1 includes the Incheon, Uijeongbu/Soyosan, and Cheonan/Sinchang directions and the Guro branch.
- Random mode lasts 60 seconds; ranked random play uses the same daily sequence for everyone.
- Yamanote shows kanji and kana above the Korean answer; users type Korean.
- The SVG train uses the same coordinate system as the route and follows the path tangent.
- Input/scoring advances immediately; train rendering chases the latest logical station without blocking typing.
- Login uses a unique first-come nickname backed by anonymous browser authentication.

## Progress

### Done

- Approved and documented the Seoul Lines 1–9 expansion, including Line 5 branches, the Line 6 directed Eungam loop, Lines 7/8 current endpoints, and Line 9-only local/express play.
- Approved replacing the internally scrolling Seoul overview with the full-width original-map layout.

- Closed every Seoul Line 6 entry point and restored its dock control to the construction notice without deleting the internal route data needed for correction.
- Removed hover-time filtering and scaling from the 10205px overview image; line focus now composites a lightweight dimmer layer above the fixed raster and the SVG highlight above that layer.
- Added Seoul Line 4 `진접↔오이도` and Seoul Line 6 `응암순환+신내`, including directed Eungam-loop routing, custom station selection, and the approved compact quick trips.
- Added official-PDF-derived Line 4/6 hit geometry and a 10205×10205 responsive WebP map source while keeping SVG limited to interaction highlights.
- Replaced the Seoul/Tokyo explorer copy, updated the footer to `10 LINES`, and retained readable responsive typography at actual 360 CSS pixels.
- Added a once-per-page original line-selection chime, raised effect gain to `0.135`, and routed cues through a shared Web Audio dynamics compressor.
- Doubled effect peak gain from `0.045` to `0.09` and changed the key tone from a 260 Hz sine to a clearer 520 Hz triangle while preserving the other cues, mute, 80 ms decay, and context cleanup.
- Reduced Suin–Bundang quick travel to four two-way cards: `인천↔오이도`, `인천↔왕십리`, `죽전↔고색`, and `인천↔청량리`; custom station selection remains available.
- Hid the route train until the departure station is typed, then added a non-blocking 260 ms SVG entrance that preserves the front-edge path anchor and accepts rapid answers.
- Inspected the empty workspace and reference website flow.
- Completed and approved product brainstorming, architecture, gameplay, animation, failure handling, and verification design.
- Researched official web platform, accessibility, Firebase, and rail-operator sources.
- Created the React 19/Vite/TypeScript shell and six-line selection flow.
- Added route graph logic for circular directions and Seoul Line 1 branches.
- Passed the full quality gate with 19 client tests and 2 server tests.
- Downloaded the official 2025-09-29 Korean Seoul Metro map (5102×5102 JPG) and vector-reference PDF from Seoul Open Data Plaza; license is Korea Open Government License Type 1 with attribution.
- Completed the map-first Seoul/Tokyo explorer, supported-line hit areas, construction notices, setup flow, route/random play, Korean IME guard, sound, route-colored SVG train, nickname reservation backend, and server-validated ranked-run endpoints.
- Added a tested 60-second random mode, pinned dependency ranges, strict indexed/unused TypeScript checks, and project setup documentation.
- Replaced broad approximate map hit paths with official PDF-derived vector paths; hover/focus now highlights the selected line at 1.2× thickness while dimming the base map.
- Audited typography across home, setup, game, profile, Tokyo, result, and mobile views; enlarged all actionable Korean text and made the route name a primary setup heading.
- Added a 150 ms pointer-intent delay for map highlights and raised the dimmed map brightness from 0.62 to 0.74; keyboard focus remains immediate.
- Replaced native station selects with accessible custom listboxes that always open below, show about eight rows in a 408 px internal scroller, and support Escape, arrow keys, outside click, and Enter/click selection.
- Added a prominent live Korean CPM meter and exposed every station label during route play with alternating placement and long-name wrapping.
- Corrected gameplay semantics so the train begins at the selected departure station and advances only after a correct answer; the current station and next typing target are now explicitly separated.
- Corrected the first prompt to include the selected departure station, then advance in order to the following station.
- Connected the existing deterministic daily shuffle to random mode and replaced its misleading terminus map with a clearly labeled, endless-until-time-up challenge panel.
- Rebuilt the Tokyo overview with a shared loop formula for line and station points, all 30 station labels, a wider canvas, and a non-overlapping selection button.
- Replaced compressed full-route gameplay maps with readable eight-station focused segments and a 240 ms non-blocking transition between them.
- Linked the current typing target back to its route station with a larger line-colored marker, pulsing ring, and stronger label.
- Replaced syllable-count/mount-time speed with first-input Hangul jaso CPM, following Hancom's documented jaso-unit method, and added restrained per-character correct/error motion inspired by typing-focused interfaces.
- Froze Seoul Line 3 and Suin·Bundang station order, colors, and service-terminus metadata from the bundled official map and current Seoul Metro/Korail operator material.
- Extended every line record with source-backed service termini or a deterministic loop preset without adding a second route model.

### In progress

- Task 6 release verification is complete locally; the verified branch is ready for integration review.

### Next

- Integrate the verified Seoul Lines 1–9 branch and perform Pages MIME/DOM verification after an authorized push.
- Connect the leaderboard read model to the UI after a Firebase project/config is supplied.
- Re-run official station-order verification before freezing production data.

## Verification

- Final broad-review RED failed four first/later/forward/reverse focused-window cases because later segments reused the full route and failed the map-source test on `10204w`. GREEN passes 50 focused RouteMap/Game/MapExplorer/geometry tests: Game supplies global segment start/count, the geometry layer slices the correctly oriented full polyline, normalizes only that interval, exposes independent global endpoints, retains at most eight labels, and keeps the train within 0.01 SVG unit of the focused path. The verified 10205×10205 WebP descriptor is now `10205w`.
- Final broad-review gate passed ESLint, 89 client tests in 11 files, 2 server tests, strict TypeScript, the 42-module Vite build, and working-tree `git diff --check`. The ignored `.superpowers/sdd/task-6-report.md` scratch report was removed from Git tracking while retained locally for handoff.

- Task 6 stable-identity correction on 2026-07-22: four RED cases proved Line 5 collapsed to trunk geometry when `길동`/`둔촌동` was outside `visibleStations`. `Game` now passes the immutable full route separately as `geometryStations`, while `RouteMap` still renders only the maximum-eight visible slice. Focused Game/RouteMap/geometry verification passed 36 tests in 3 files plus strict TypeScript.
- Fresh Edge captures under `.superpowers/sdd/task-6-stable-identity-captures-v2/` advanced both forward Line 5 routes to segment 42 at exact 360/768/1440 widths. With branch markers absent, Hanam remained `seoul-5-hanam` with 7 labels and Macheon remained `seoul-5-macheon` with 4 labels; visual inspection confirmed distinct branches, aligned trains, readable labels, and no overflow.
- Final stable-identity gate passed ESLint, 85 client tests in 11 files, 2 server tests, strict TypeScript, the 42-module Vite build, and `git diff --check`.

- Task 6 review correction on 2026-07-22 replaced the rejected uniform Seoul 4–9 paths with source-guided normalized gameplay anchors in a renderer-independent module. A 10-failure RED proved missing endpoint metadata, Line 5 branch divergence, and Line 6 directed closure; GREEN passed 28 focused RouteMap/geometry/Game tests. Independent test fixtures parse route, context, station, and train SVG values and enforce endpoint identity, <0.001 SVG-unit station-anchor error, <0.01 station/path and train/path distance, branch distinctness, and loop topology.
- Fresh correction captures under `.superpowers/sdd/task-6-review-captures/` cover Seoul 4, both Line 5 branches, the Line 6 directed loop, Seoul 7/8, and Line 9 local/express at exact 360, 768, and 1440 CSS-pixel widths (24 PNGs plus JSONL measurements). Inspection confirmed readable labels, visible aligned trains, distinct Line 5 tails, a closed Line 6 loop, 6–8 visible stations, and no page overflow. These are source-guided normalized schematic anchors, not official/geospatial coordinates.
- Final correction gate passed ESLint, 77 client tests in 11 files, 2 server tests, strict TypeScript, a 42-module Vite build, and `git diff --check`.

- Task 6 public-count TDD on 2026-07-22: `npx vitest run src/App.test.tsx` failed exactly because the footer still rendered `9 LINES`; after the one-line footer change, all 14 App tests passed and the smoke assertion confirmed enabled controls for Seoul Lines 1–9.
- Task 6 high-risk gate `npx vitest run src/components/Game.test.tsx src/components/RouteMap.test.tsx src/game/geometry.test.ts src/audio/sounds.test.ts src/App.test.tsx` passed 33 tests in 5 files before browser QA. Browser-flow inspection then exposed missing focused gameplay geometry for Seoul Lines 4–9; a six-case RouteMap regression test failed on all six `Missing route geometry` errors and passed 14 tests in 2 files with the geometry suite after the six declared polylines were added.
- Fresh Edge production-preview evidence used `npm run build` and `npx vite preview --host 127.0.0.1 --port 4189`, with HTTP 200 `text/html` confirmed under `/MetroTyping/`. Thirty screenshots and machine-readable measurements are under `.superpowers/sdd/task-6-captures/`: ten scenarios each at exact 360, 768, and 1440 CSS-pixel viewports, covering the Seoul overview, Line 5 branch setup, Line 6 loop setup/game before and after departure, Line 8 extension setup, and Line 9 local/express setup/game.
- Visual inspection of those captures found no page-level horizontal overflow or clipped/overlapping controls. The overview map had no desktop-internal horizontal scrollbar at 768/1440; at 360 its 850 px surface and the line dock retained deliberate touch panning. Labels remained readable, the Line 5 focus overlay followed the official raster, Line 5 showed both branch cards, Line 6 showed the directed-loop card, and Line 8 began at `별내`.
- Browser measurements recorded exactly 8 gameplay station nodes/labels for every captured game. Line 6 had no `.train` before typing `응암` and did have one after the correct departure answer, with the target advancing to `새절`. Line 9 local began at `개화` (38 stations), while express began at `김포공항` (16 stations) and never displayed `개화`; service controls and quick routes matched each selection at every viewport.
- Final fresh gates on 2026-07-22: the specified high-risk command passed 39 tests in 5 files; `npm run check` passed ESLint, 73 client tests in 11 files, 2 server tests, strict TypeScript, and the Vite production build; `git diff --check` exited 0 with no whitespace errors.
- Remaining device-only uncertainty: headless Edge cannot validate physical audio output, a real OS Korean IME candidate window, touch gesture feel, or GPU rendering differences on physical phones. Automated suites continue to cover mute/resume, jaso CPM, IME composition Enter suppression, rapid inputs, reduced motion, and sampled train/path alignment.

- The Line 6 availability regression failed while its dock/map entry and `10 LINES` footer remained, then passed with no `onSelect('seoul-6')`, a construction notice, no setup heading, and `9 LINES`; the focused explorer/App suites passed 16 tests and strict TypeScript passed.
- On 2026-07-22, the map-hover regression failed without `.map-dimmer`, then passed after removing raster `filter`/`scale` work from the active state; the focused MapExplorer suite passed 9 tests and strict TypeScript passed.
- The suspended-audio regression failed until the shared `AudioContext` explicitly resumed, then the audio/App suites passed 9 tests with the first-selection cue, mute, limiter, and `0.135` gain intact.
- GitHub Pages run `29906857744` completed successfully for commit `fdd31ae`. The production page, JavaScript, CSS, 10205px WebP, and supported-lines SVG returned HTTP 200 with `application/javascript`, `text/css`, `image/webp`, and `image/svg+xml`; the deployed bundle contains the new Seoul copy, `seoul-4`, `seoul-6`, and `10 LINES`.
- On 2026-07-22, `npm run check` passed ESLint, 56 client tests, 2 server tests, strict TypeScript, and the Vite production build. Focused RED/GREEN cycles covered Line 4 end-to-end travel, Line 6 directed-loop routing, quick-trip counts/directions, custom loop-station selection, new explorer copy/controls, 10205px responsive map selection, the once-only chime, mute, `0.135` gain, and shared output limiting.
- The generated official-map overlay contains 32 Line 4 paths and 28 Line 6 paths. The PDF-rendered WebP is 10205×10205 at 3,733,012 bytes; visual inspection confirmed Korean labels remained present and sharp.
- Fresh overview captures at 768 and 1440 CSS pixels and a Windows-Edge-scaled capture representing 360 CSS pixels showed readable copy, map labels, Line 4/6 dock controls, attribution, and `10 LINES` without page overflow. Gameplay remains on the existing tested eight-station `RouteMap` component.
- On 2026-07-22, deployed Edge diagnostics confirmed each typing event created a running audio context, completed playback, closed normally, and raised no browser errors. The sound regression then failed against the old 260 Hz sine and passed with the approved 520 Hz triangle, `0.09` gain, unchanged cue frequencies, 80 ms decay, and mute behavior; `npm run check` passed 48 client tests, 2 server tests, lint, strict TypeScript, and build.
- On 2026-07-22, the Suin–Bundang quick-route regression failed against the previous 15 combinations, then passed with exactly four approved pairs and both directions. `npm run check` passed ESLint, 48 client tests, 2 server tests, strict TypeScript, and the Vite production build.
- GitHub Pages deployment run `29890876444` completed successfully on 2026-07-22 for commit `3acb36c`. `https://qkqhsm1.github.io/MetroTyping/` returned HTTP 200 and served the new `index-CBzr9U5R.js` and `index-B3Zh_kEc.css` bundles with JavaScript/CSS MIME types; the deployed bundle contains `8 LINES`. Local `main` and `origin/main` were synchronized after deployment.
- Task 7 final gate on 2026-07-21: `npm run check` passed ESLint, 47 client tests in 10 files, 2 server tests, strict `tsc -p tsconfig.json`, and the Vite production build. The focused command `npm test -- --run src/components/Game.test.tsx src/App.test.tsx src/audio/sounds.test.ts` passed 17 tests in 3 files.
- Route coverage exercises every declared service-terminus quick-route in both directions, Seoul 1 branches, exact Seoul 2 and Yamanote one-lap presets without repeated origins, Seoul 3 and Suin·Bundang frozen orders/custom routing, and Incheon 1/2 plus AREX endpoint pairs. Sources remain the bundled official Seoul map, Seoul Open Data datasets `OA-101` and `OA-22535`, and Korail operating notice `nttNo=23761`; production data must still be rechecked immediately before freezing.
- Edge 150 production-preview captures at actual CSS viewports 360, 768, and 1440 covered Seoul 3/Suin·Bundang overview focus, Seoul 1 and Seoul 2 quick routes, Seoul 3 gameplay before/after departure, Suin·Bundang at a segment boundary, and Yamanote inner/outer presets. Browser measurements found no page overflow after fixes, no off-viewport gameplay controls, 8 or fewer rendered gameplay labels (7 at the Suin boundary), and train hidden before/visible after departure. The permitted 360 px overview/quick-route horizontal scrollers remained internally scrollable.
- Production preview requests returned HTTP 200 with `text/html` at `/MetroTyping/` and HTTP 200 with `text/javascript`/`text/css` for emitted assets under `/MetroTyping/assets/`. Clicking `METRO/TYPE` kept `location.pathname === '/MetroTyping/'`.
- Game UI-event tests spy the key, error, correct, and complete calls with the enabled flag, verify `sound={false}` reaches both key and completion calls, and an App integration test verifies the header mute toggle reaches gameplay as `false`; the sound-unit test separately proves disabled playback creates no tone. Browser evidence confirms rapid answers during the 260 ms entrance, composing Enter suppression, timer cleanup on unmount, and reduced-motion train visibility with computed `animation-name: none` and `transform: none`. Headless automation cannot validate physical speaker output or a real OS Korean IME candidate window; those remain final-device smoke checks.

- Task 6 RED: focused Game/RouteMap tests failed because the train rendered unconditionally; GREEN: 15 focused tests passed after conditional SVG rendering and presentation-only state. `npm run check` passed with 44 client tests, 2 server tests, strict TypeScript, and the production build.
- Task 5 isolated the official PDF-vector color profiles to 30 Seoul Line 3 paths and 41 Suin·Bundang paths; 1440 px overlay captures follow the raster routes while preserving 1.2× highlight thickness, 150 ms intent delay, and base-map dimming.
- `npm run check` passed on 2026-07-21 after Task 4: ESLint, 38 client tests, 2 server tests, strict TypeScript, and the production Vite build.

- On 2026-07-21, Korail's current operating material confirmed Line 1 `연천↔인천`, Line 3 `대화↔삼송`, and Suin·Bundang `청량리/왕십리↔죽전↔고색↔오이도↔인천`; the official Seoul map confirmed Line 3's physical `오금` endpoint, and Seoul's public timetable sample returned 191 `구파발` destination rows. Review extended Line 1 through `연천→전곡→청산→소요산` and mapped each terminus to its claim-matching primary source.
- `npm run check` passed on 2026-07-21 after Task 1 review fixes: ESLint, 32 client tests, 2 server tests, strict TypeScript, and the production Vite build.
- The approved design was converted into a seven-task TDD implementation plan; placeholder scan and `git diff --check` passed on 2026-07-21.
- `npm run check` passed on 2026-07-21: ESLint, 29 client tests, 2 server tests, strict TypeScript, and Vite production build.
- GitHub Pages deployment succeeded on 2026-07-21 and `https://qkqhsm1.github.io/MetroTyping/` returned HTTP 200.
- Numerical geometry tests confirm sampled station/train points remain on the declared route polyline.
- Captured and visually inspected the home explorer at 360, 768, and 1440 output widths; the official map remains sharp and the line dock stays horizontally scrollable.
- The official and user-provided PDF/JPG copies were hash-identical; the web asset uses that same high-resolution original.
- Captured hover states for all five Seoul/Incheon/AREX choices; the official vector overlay follows the raster route and no diagonal approximation remains.
- Captured desktop home/setup/game/profile/Tokyo and mobile home/setup states after the typography pass; labels and controls remain readable without overlap.
- Captured open station menus on desktop and mobile; eight rows are visible and overflow remains inside the menu rather than covering the page.
- Automated gameplay coverage confirms the train remains at Sindorim while Mullae is the next target, then advances to Mullae only after the correct submission.

## Mistakes

- 2026-07-22 | Later focused gameplay windows restarted visually at the route origin | Stable branch identity was fixed, but every visible slice still sampled local 0..1 over the full geometry | Passed global segment metadata, sliced the oriented full polyline by station-index progress, then normalized only the subpath | Test first/later and forward/reverse global endpoints independently whenever viewport segmentation is introduced.
- 2026-07-22 | The 10205×10205 overview WebP was advertised as `10204w` | The descriptor was typed from an earlier assumption instead of the verified asset dimension | Corrected to `10205w` and asserted the exact descriptor | Image candidate descriptors must match inspected pixel dimensions exactly.

- 2026-07-22 | Line 5 could revert to trunk geometry at focused-segment boundaries | Geometry identity was inferred from the current maximum-eight display slice instead of the selected full route | Passed immutable full-route context separately while retaining the visible slice for rendering | Resolve topology identity before viewport segmentation and test forward/reverse marker-absent windows.

- 2026-07-22 | Review rejected the six newly public gameplay paths as arbitrary uniform polylines | The release fix stopped at crash prevention and treated same-function station/path sampling plus a render smoke as geometry validation | Separated source-guided normalized anchors from rendering, modeled Line 5 branches and Line 6 loop explicitly, and added independent DOM-parsed anchor/distance/topology tests | A public branched or directed-loop route requires independent reference anchors, topology assertions, and branch-specific gameplay captures before release acceptance.

- 2026-07-22 | Starting gameplay on newly public Seoul Lines 4–9 would throw `Missing route geometry` | Public setup coverage and data tests did not exercise each line through the shared RouteMap boundary | Added a render smoke for every newly public line and declared the six missing focused SVG polylines | Every public line must pass one setup-to-RouteMap smoke before release-count verification.
- 2026-07-22 | The first real-browser capture attempt could not find Korean-labeled controls and the second collided with PowerShell's `Measure` alias | Windows PowerShell decoded the temporary UTF-8 script labels incorrectly and the helper used a built-in alias name | Selected stable dock positions from the already-tested order and renamed the helper `Record-Measure` | Keep temporary Windows PowerShell automation ASCII-safe and avoid built-in command/alias names.

- 2026-07-22 | Seoul Line 6 was exposed as playable before the user accepted its implementation | Passing route/unit tests were treated as sufficient product approval for the complex Eungam topology | Removed all public Line 6 entry points while preserving data for correction | A newly modeled branch or one-way loop stays under construction until its end-to-end UI and route behavior receive explicit user approval.
- 2026-07-22 | Moving across line controls caused visible hover lag | The active state filtered and scaled the entire 10205px raster, forcing expensive GPU work on every hover transition | Kept the raster fixed and moved dimming to a small composited overlay below the SVG highlight | Never animate filters or transforms on full-resolution map rasters; animate overlay opacity and vector strokes only.
- 2026-07-22 | The first-selection subway chime could be silent in a browser | The shared `AudioContext` was not explicitly resumed when the browser left it suspended | Resume the context inside the user-triggered sound path and ignore resume failure without blocking navigation | Every user-triggered Web Audio path must handle `suspended` before scheduling tones.
- 2026-07-22 | A nominal 360px screenshot appeared to clip the new heading | Windows Edge enforced a wider minimum CSS viewport and cropped the raster output, repeating a previously recorded capture pitfall | Re-ran with a 1.3889 device scale so a 500px host window represented 360 CSS pixels | Record and validate CSS viewport dimensions; never infer them from screenshot width alone.
- 2026-07-22 | The first new visual capture showed old copy and an incompletely decoded map | Port 4173 was still served by a stale preview and the 10205px image had not finished decoding | Used a fresh preview port and a 5-second virtual-time budget | Use a unique preview port per build and wait for large responsive images before capture.
- 2026-07-21 | Production preview loaded a blank page although the HTML returned HTTP 200 | Vite preview used `/` while the built HTML referenced `/MetroTyping/assets/`, so asset requests returned the HTML fallback | Applied the Pages base to build and preview and verified asset MIME types plus browser rendering | Verify response MIME/content and rendered DOM, not status code alone, for base-path checks.
- 2026-07-21 | Seoul 3 gameplay overflowed horizontally at 360 and 768 CSS pixels | The explorer's generic `.map-stage` 850 px minimum also matched the gameplay map | Overrode the minimum inside `.game` and repeated exact-viewport captures | Scope layout selectors to their owning surface when a class name is shared.
- 2026-07-21 | Reduced-motion CDP evidence aborted after captures | The evaluator tried to serialize a DOM node with an object reference chain | Evaluated a boolean in the page context and reran the evidence set | Return primitives from browser automation measurements.

- 2026-07-21 | Task 6 tests passed but strict TypeScript rejected an argumentless timer ref | Assumed React's `useRef` still allowed an omitted initial value | Initialized the timer ref explicitly with `undefined` | Run strict typecheck immediately after adding React refs.
- 2026-07-21 | Task 5 runtime tests passed but strict TypeScript rejected geometry-test coordinate arrays | New test parsers inferred variable-length `number[]` instead of two-coordinate tuples | Typed parsed paths and sampled station coordinates as the existing `Point` tuple | Run the strict typecheck with focused tests before the full gate when adding numerical test helpers.
- 2026-07-21 | Seoul 1 omitted the Yeoncheon extension and Seoul 3 assigned one timetable-catalog URL to every candidate terminus without a reproduced row query | Reused stale endpoint data and treated API availability as endpoint evidence | Added `연천→전곡→청산`, mapped each endpoint to the primary source that names it, and restored `구파발` only after the public sample returned destination rows | Tests must assert current leaf endpoints and each terminus's non-empty, claim-matching source.
- 2026-07-21 | Initial inspection emitted missing-path and Git errors | Assumed an optional Codex reference path and Git repository existed | Confirmed the workspace is empty and not a Git repository | Test paths and repository state before reading or running Git commands.
- 2026-07-21 | First Vitest suite reported `test is not defined` | Test globals were not enabled or imported | Imported `test` and `expect` explicitly | Keep Vitest tests explicit unless `globals: true` is deliberately configured.
- 2026-07-21 | Route test could not parse the BFS queue declaration | A type annotation was written inside a comma-separated declaration | Split the graph and typed queue into separate declarations | Run TypeScript parsing immediately after each new logic module.
- 2026-07-21 | Preview URL was unreachable after being announced | The foreground Vite process was killed by the command timeout, leaving no listener on port 5173 | Launched Vite through a persistent hidden process and verified both the listening socket and HTTP 200 | Never announce a preview URL without verifying the port and an HTTP response after launch.
- 2026-07-21 | Line cards in the shared preview had no next action and the visual treatment felt generic | An implementation milestone was exposed before the setup/game flow existed | Continue through a complete playable vertical slice and replace generic cards with the approved map-first transit visual system | Do not invite visual review of controls that are knowingly inert; label incomplete previews explicitly.
- 2026-07-21 | A nominal 360px Edge screenshot behaved like a wider CSS viewport | Windows display scaling affected the headless capture viewport | Repeated capture with an explicit device-scale flag and treated raster width as insufficient evidence by itself | Verify CSS viewport dimensions, not only screenshot pixel dimensions, during responsive QA.
- 2026-07-21 | Hover exposed a broad diagonal band across unrelated stations | Visible highlight reused an approximate wide click path | Extracted exact route vectors from the official PDF and separated visible and pointer strokes | Never expose approximate interaction geometry as artwork; derive visible overlays from the same official coordinate source.
- 2026-07-21 | Initial PDF color extraction selected unrelated orange/cyan lines for Incheon 2 and AREX | Assumed display hex values mapped directly through the PDF color profile | Compared per-line browser captures and corrected the embedded PDF color values | Visually verify every extracted color layer independently before accepting generated route assets.
- 2026-07-21 | Train label showed Mullae while the large target showed Yeongdeungpo-gu Office | Train progress used the last completed index while the target used the next index | Made both render from the same target index and added a synchronization regression test | Any state shown in two visual components must share one logical index and a test asserting both labels.
- 2026-07-21 | A Sindorim-origin game initially placed the train at Mullae | A previous correction incorrectly forced the physical train and next typing target to share one index | Restored the train to the last completed station and labeled current/next states separately | Never conflate physical train position with the next answer; test both before and after the first submission.
- 2026-07-21 | Train still looked past Sindorim despite correct current-station state | The train body was centered on the station anchor, leaving its front half over the outbound segment | Anchored the train's front edge to the sampled station point | Verify the visible vehicle anchor, not only its logical progress value.
- 2026-07-21 | A Sindorim route first asked for Mullae | The target index initialized at 1 and treated the origin as already completed | Initialized the target at index 0 and separated target from last-completed position | The selected origin is the first required answer.
- 2026-07-21 | Random mode looked like a trip to Sinchang but stopped at 60 seconds | It reused an ordered full-route map and did not call the existing shuffle | Connected the daily shuffle and gave timed random play a destination-free presentation | Timed random and ordered route modes must not share journey semantics.
- 2026-07-21 | Tokyo and long-route station labels overlapped and the Tokyo button covered Kanda | Full networks were compressed into a small fixed SVG and Tokyo only labeled every fifth station | Widened the Tokyo overview and segmented gameplay routes into at most eight stations | Never claim full readability from a compressed network; cap gameplay density and test label count.
- 2026-07-21 | The next station existed on the focused map but was not visually discoverable | Target and ordinary future stations shared the same gray styling | Added a tested target marker and label state driven by the same target index as the prompt | Every prompt change must have a matching map target state.
