# Departure Animation, Quick Routes, and New Lines Design

## Goal

Make a route run visibly begin only after the player types the departure station, add one-click end-to-end route presets for every supported line, add Seoul Line 3 and the Suin–Bundang Line, and fix navigation under the GitHub Pages subpath.

## Scope

- Hide the train until the departure station is typed correctly.
- Add a non-blocking train entrance animation after the first correct answer.
- Generate one-click quick routes from every valid service terminus pair in both directions.
- Add full Seoul Line 3 and Suin–Bundang Line station data and supported service termini.
- Add fixed full-loop presets for Seoul Line 2 and JR Yamanote.
- Make the brand link return to the application root on local development and GitHub Pages.
- Keep custom origin/destination selection available for every station pair.

Online leaderboard presentation and Firebase project provisioning remain outside this change.

## Approved Interaction Design

### Departure

Before the first answer, the departure station has the target ring but no train is rendered. When the departure station is entered correctly:

1. scoring and the next prompt advance immediately;
2. the train appears from slightly behind the departure point over 260 ms;
3. its line-colored light turns on as it settles at the station;
4. typing remains available throughout the animation.

The animation is purely presentational. It never delays input, scoring, the timer, sound, or prompt changes. With `prefers-reduced-motion: reduce`, the train appears immediately without translation or scaling.

### Quick routes

The setup screen gains a `빠른 운행` section above the custom station selectors. Each undirected terminus pair is one card containing two explicit one-click direction buttons, such as `인천 → 신창` and `신창 → 인천`. A click sets origin, destination, and direction and starts the run immediately.

Quick routes are derived from declared service termini and route reachability rather than handwritten button lists. This prevents omissions when another line or terminus is added. Custom station selection remains directly below the presets.

For non-loop lines:

- simple two-terminus lines expose the two directions;
- branched lines expose every reachable service-terminus pair in both directions;
- invalid pairs that have no graph route are never rendered.

For loop lines:

- Seoul Line 2 starts at Sindorim and ends at the station immediately before returning to Sindorim, with clockwise and counterclockwise presets;
- JR Yamanote starts at Tokyo and ends at the station immediately before returning to Tokyo, with outer-loop and inner-loop presets.

### New lines

Seoul Line 3 covers Daehwa through Ogeum. The Suin–Bundang Line covers Incheon through Cheongnyangni. Their station order, official names, colors, and supported service termini are frozen only after comparison with current official operator data and timetable material.

The route selector treats every intermediate short-turn endpoint published in the current operator timetable as a quick-route terminus. An endpoint absent from that official timetable is not promoted to a preset. Arbitrary station pairs remain available through custom selection even when they are not quick presets.

## Architecture

### Line data

Extend the existing line records instead of introducing a second route model. Each line declares:

- ordered station sequences used by the route graph;
- line color and display name;
- service termini eligible for quick routes;
- optional loop preset origin and direction labels.

The existing graph route calculation remains the single source for validating and building preset routes. A small pure helper produces reachable directed preset pairs from a line record.

### Setup flow

The setup component renders generated presets for the selected line. A preset invokes the same route-start path used by custom selectors, so route calculation, validation, game initialization, sound, and results do not fork into a separate implementation.

### Game and train rendering

Game state continues to own answer progress. It passes an explicit train visibility state to `RouteMap`: hidden before the origin is completed, entering for the first visual render after completion, and visible afterward. `RouteMap` keeps train geometry and motion inside the existing SVG coordinate system.

The 260 ms entrance uses CSS/SVG presentation only. Rapid correct answers may advance logical progress while the train animation chases the latest completed station, preserving the existing non-blocking invariant.

### GitHub Pages navigation

The brand link uses Vite's `BASE_URL` instead of `/`. Local development therefore targets `/`, while the deployed build targets `/MetroTyping/`. No client router or 404 fallback is added because the application remains a single-page state flow with no deep routes.

## Data Sources and Validation

- Seoul Line 3 station identity and ordering: Seoul Metro line/station data and the current official metropolitan map.
- Suin–Bundang station identity, ordering, and service termini: current Korail line and timetable material.
- Shared map alignment and display names: the current official Seoul metropolitan rail map already bundled under its attribution license.

Station sequences are checked against at least two compatible official views when available: ordered station data/map plus current timetable endpoints. A service terminus is not added from memory or a third-party map alone.

## Failure Handling

- If a declared quick-route pair cannot be resolved, it is omitted and a test fails during development; the setup screen remains usable through custom selection.
- Duplicate termini and reversed duplicate cards are removed deterministically.
- A line with incomplete sequences cannot start a quick route.
- Train animation failure or reduced-motion settings never affect answer acceptance.
- GitHub Pages brand navigation is verified against the production base path during build tests.

## Verification

- Assert Seoul Line 3 order from Daehwa to Ogeum and both reverse routes.
- Assert Suin–Bundang order from Incheon to Cheongnyangni and routes involving every declared service terminus.
- Assert every generated quick-route direction resolves and contains the selected endpoints.
- Assert Seoul Line 1 creates every reachable terminus combination without duplicates.
- Assert Seoul Line 2 and Yamanote loop presets start at the approved anchor and stop immediately before returning.
- Assert the train is absent before the first correct answer and present afterward.
- Assert a second answer can be submitted during the 260 ms entrance animation.
- Assert reduced motion removes the entrance transition.
- Assert the brand link uses `/` in development and `/MetroTyping/` in the production build.
- Capture and inspect setup and gameplay at 360, 768, and 1440 CSS pixels for both new lines and the expanded preset list.

The repository quality gate remains `npm run check`, followed by a GitHub Pages deployment and HTTP 200 verification.
