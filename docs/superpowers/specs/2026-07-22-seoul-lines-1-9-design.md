# MetroTyping Seoul Lines 1–9 Design

## Goal

Make every Seoul subway line from Line 1 through Line 9 playable without regressing the existing Incheon, AREX, Suin–Bundang, or Yamanote games. Replace the internally scrolling Seoul overview with a large full-map presentation. Only Line 9 exposes a local/express service choice.

## Scope

- Preserve the existing playable Seoul Lines 1–4.
- Add Seoul Lines 5, 7, 8, and 9.
- Correct and re-enable Seoul Line 6 only after its directed Eungam loop passes route and UI verification.
- Keep Incheon Lines 1 and 2, AREX, Suin–Bundang, and JR Yamanote unchanged.
- Do not introduce a general service-pattern engine or new dependency. Extend the existing line model with the smallest optional Line 9 service-pattern field.

## Route Topology

### Seoul Line 5

- Main service: `방화 ↔ 하남검단산`.
- Macheon branch: `방화 ↔ 마천`.
- The graph shares the trunk through `강동` and branches toward `길동` or `둔촌동`.
- Quick routes expose both end-to-end services. Invalid or identical-station combinations show a recoverable setup error.

### Seoul Line 6

- Trunk: `응암 ↔ 신내`.
- The Eungam loop is directed: `응암 → 역촌 → 불광 → 독바위 → 연신내 → 구산 → 응암`.
- The UI must not imply that the loop operates in reverse.
- Line 6 remains under construction until directed-route tests, setup behavior, and overview hit-area alignment all pass.

### Seoul Line 7

- End-to-end service: `장암 ↔ 석남`.
- Quick route and custom station selection are bidirectional.

### Seoul Line 8

- Current full service: `별내 ↔ 모란`.
- The Byeollae extension is part of the route data and overview highlight.
- Quick route and custom station selection are bidirectional.

### Seoul Line 9

- Line 9 alone displays a service selector.
- Local (`일반`): `개화 ↔ 중앙보훈병원`, including every station.
- Express (`급행`): `김포공항 ↔ 중앙보훈병원`, restricted to:
  `김포공항`, `마곡나루`, `가양`, `염창`, `당산`, `여의도`, `노량진`, `동작`, `고속터미널`, `신논현`, `선정릉`, `봉은사`, `종합운동장`, `석촌`, `올림픽공원`, `중앙보훈병원`.
- Route setup, quick routes, and random mode use the selected service's station set.
- Express never offers `개화` because it is not an express stop.

## Data and Sources

- Freeze station order, branches, endpoints, colors, and service patterns from current official operator or public-sector sources immediately before adding data.
- Use the bundled official 2025-09-29 Seoul map PDF as geometry and full-network visual reference.
- Use Seoul Open Data's current Lines 1–9 timetable material to distinguish Line 9 `일반` and `급행` operation.
- Record a claim-matching source URL for every new terminus or service pattern, following the existing data convention.
- Never expose a new line if its data is incomplete or its source cannot be reproduced.

## Overview Map

- Use approved layout B: display the entire original high-resolution Seoul map at the page's available width.
- Remove internal vertical and horizontal overview scrollbars on desktop; the document scrolls naturally.
- Preserve the map's intrinsic aspect ratio and do not upscale beyond useful source resolution.
- On narrow touch screens, allow native pinch zoom and panning because shrinking the full map makes station names unreadable.
- Keep the raster static during hover. Fade a lightweight dimmer and show the exact PDF-derived SVG highlight at 1.2 times base stroke.
- Preserve hover intent delay so merely crossing a control does not trigger feedback.
- Add PDF-derived hit and highlight paths for Lines 5–9. Approximate hit paths are never visible artwork.

## Setup and Gameplay

- Every line provides end-to-end quick cards and custom departure/destination selection.
- Line 9 inserts `일반 / 급행` before route choices. Other lines show no service selector.
- The chosen departure station is the first typing target; the train appears only after it is typed correctly.
- Train animation never blocks input and advances only after a correct submission.
- Gameplay maps show at most eight stations and swap focused segments without compressing long routes.
- Existing Korean IME handling, jaso-based live/final speed, sound, mute, ranking validation, and random timing remain unchanged.

## Error Handling

- Invalid routes produce a recoverable setup message instead of throwing through React.
- An unverified route remains `공사 중` and cannot enter setup.
- Firebase failure does not block practice; ranked play still requires verified server connectivity.
- Audio failure never blocks navigation or gameplay.

## Verification

- Test order for every new route, branch, direction, and terminus.
- Test both Line 5 branches through `강동`.
- Test the Line 6 loop in its allowed direction and reject reverse-only traversal.
- Test Line 8 from `별내` through the extension to `모란`.
- Test that Line 9 local includes all stations, express contains exactly the declared stops, and `개화` never appears in express setup or random play.
- Test invalid, identical, and branch-crossing station combinations at route and UI boundaries.
- Numerically check new overview SVG geometry and visually inspect every highlight independently.
- Run train/path alignment, rapid-answer, Korean IME, reduced-motion, mute, and mobile regressions.
- Capture overview, setup, and gameplay at 360, 768, and 1440 CSS pixels, including touch navigation for the full map.
- Run `npm run check`, then verify deployed GitHub Pages assets and rendered DOM under `/MetroTyping/`.

## Delivery

- Implement with tests first in route-data, setup, overview, and verification stages.
- Change the footer count to 14 playable networks only after all five Seoul additions are enabled.
- Commit and push to canonical `main`, then verify GitHub Pages deployment as previously authorized.
