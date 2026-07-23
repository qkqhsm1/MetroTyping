# Line 2 Tracking Map Design

## Goal

Replace only Seoul Line 2 route-mode gameplay with a high-fidelity vector map whose camera follows the station currently being typed. Keep every other line and random mode unchanged until the Line 2 experience is reviewed.

## Map Source and Fidelity

- Extract the Line 2 path from the bundled official Seoul Metro PDF rather than tracing the raster overview or reusing the current schematic gameplay curve.
- Render the path, station nodes, train, and labels in one SVG coordinate system.
- Keep the complete Line 2 loop mounted as a fixed vector world. Camera movement changes only the SVG `viewBox`; it does not rebuild, mirror, or replace the route.
- SVG is resolution-independent. Lines, nodes, and text must remain sharp at every supported zoom and viewport.
- Verify all station positions against the official map before freezing them.

## Camera and Gameplay

- The station awaiting input is always the camera centre.
- Before the first answer, Sindorim is centred.
- Immediately after a correct Sindorim submission, Mullae becomes the camera centre and remains centred while the player types Mullae.
- The train and camera move to the next target together in approximately 100 ms.
- Scoring and input never wait for camera or train animation. Rapid consecutive correct submissions immediately update logical state to the latest target.
- The camera normally frames four stations: one previous station, the centred target, and two upcoming stations in the selected travel direction.
- At a route endpoint, show as many of those four roles as exist. Full-loop Line 2 trips wrap naturally.
- Respect `prefers-reduced-motion` by applying the target camera position without animation.

## Station Presentation

Each visible station displays:

1. Korean station name
2. Smaller official English station name
3. Official station number

Station metadata must be verified against current primary Seoul Metro or Seoul city operator data. Do not infer English spellings or numbers.

The target station receives the strongest node and label treatment. The previous station is subdued; the next two remain clearly readable. No separate fixed previous/current/next header is added.

## Time and Existing Metrics

- Add elapsed game time from the player's first typed input until route completion.
- Display it during route play as `MM:SS.t`.
- Include the final elapsed time on the completion result.
- Waiting before the first keystroke is excluded, matching the existing typing-speed start rule.
- Keep CPM, error count, progress, IME handling, mute, and completion behavior intact.

## Scope and Fallback

- Apply the new map only when `lineId === "seoul-2"` and the game is in ordered route mode.
- Other lines keep the existing focused eight-station randomized SVG.
- Random station mode keeps its current destination-free presentation.
- If validated Line 2 vector or station metadata is unavailable, render the existing focused RouteMap rather than an incomplete or misaligned tracking map.

## Verification

- Assert complete official Line 2 station order, English names, and station numbers.
- Test clockwise and counterclockwise travel, including wraparound.
- Test Sindorim centred before input and Mullae centred immediately after the correct Sindorim answer.
- Test the four-station camera window in both directions and near endpoints.
- Test rapid consecutive correct inputs without animation blocking.
- Assert every station node and train anchor lies on the official SVG path.
- Test elapsed time starts on the first typed input and freezes at completion.
- Test reduced motion, Korean IME Enter suppression, mute, and existing CPM behavior.
- Capture and inspect real renders at 360, 768, and 1440 CSS-pixel viewport widths.
- Run `npm run check`, push `main`, and verify the deployed Pages asset MIME/content and rendered page.

