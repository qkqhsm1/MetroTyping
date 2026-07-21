# Workflow

## Goal

Build a polished Korean subway typing game for six lines with route and random modes, animated SVG trains, sound, anonymous nickname accounts, and online rankings.

## Decisions

- Stack: Vite, React, Firebase Authentication, Firestore, Cloud Functions, and App Check.
- Client language: TypeScript with custom CSS/SVG; no shadcn/ui, Tailwind, or Express.
- Quality gate: `npm run check` runs ESLint, Vitest, strict TypeScript checking, and the production build.
- Selection UX: official high-resolution Seoul overview plus aligned SVG hit areas; dedicated SVG replaces the raster for setup/gameplay. Tokyo uses a dedicated Yamanote loop.
- Lines: Seoul 1/2, Incheon 1/2, AREX, and JR Yamanote.
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

- Executing the approved route-expansion plan; Task 1 line data and metadata are complete, with quick-route generation next.

### Next

- Execute `docs/superpowers/plans/2026-07-21-departure-presets-new-lines.md` task by task with TDD checkpoints.
- Connect the leaderboard read model to the UI after a Firebase project/config is supplied.
- Re-run official station-order verification before freezing production data.

## Verification

- On 2026-07-21, Korail's current operating-status page and 2024-11-18 operating notice confirmed Suin·Bundang endpoints `청량리/왕십리↔죽전↔고색↔오이도↔인천` and Line 3 `대화↔삼송`; Seoul Data Hub's official Seoul Metro timetable API catalog confirmed station-timetable coverage for the Seoul-operated Line 3 segment and the bundled official map confirmed full station order/colors. Direct row-level API access requires a key, so `구파발`/`오금` were retained from the candidate timetable set with that access limitation recorded; no primary source contradicted them.
- `npm run check` passed on 2026-07-21 after Task 1: ESLint, 31 client tests, 2 server tests, strict TypeScript, and the production Vite build.
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
