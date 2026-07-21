# MetroTyping Design

Date: 2026-07-21  
Status: Approved design, pending written-spec review

## Goal

Create a polished Korean typing game inspired by the flow of metrotyping.kr without copying its protected branding or assets. Players choose a line and route or play a timed random challenge, type Korean station names, and watch a line-colored train move across a schematic route map.

## Scope

The initial release supports:

1. Seoul Subway Line 1
2. Seoul Subway Line 2
3. Incheon Subway Line 1
4. Incheon Subway Line 2
5. AREX
6. JR Yamanote Line

Seoul Line 1 includes the northern Uijeongbu/Soyosan direction, the Incheon branch, and the Cheonan/Sinchang direction through the Guro split. Yamanote supports explicit inner-loop and outer-loop selection.

## Technology

- Vite, React 19, and TypeScript for the client application and typed route geometry.
- SVG for route maps, stations, and train graphics.
- CSS for responsive layout, route colors, and transitions.
- Web Audio API for generated key, correct, incorrect, and completion sounds.
- Firebase Anonymous Authentication for passwordless browser identities.
- Firestore for unique nicknames, profiles, and leaderboard reads.
- Cloud Functions for nickname reservation and ranked-result validation.
- Firebase App Check and Security Rules to reduce unauthorized writes and abuse.

The application remains playable in local practice mode without Firebase configuration. Ranked mode requires a working verified backend connection.

## Visual system

The interface uses a warm white background with dark typography. Only the selected line's official color is used for primary emphasis: route progress, current station, train stripe, line badge, buttons, and completion feedback. Untraveled route segments use a light neutral gray.

The first selection screen is a hybrid map experience. A `SEOUL / TOKYO` switch sits above the map. Seoul uses the official 5102×5102 Korean metropolitan route map published by Seoul Metro on 2025-09-29 under Korea Open Government License Type 1, with visible source attribution. Supported routes receive aligned transparent SVG hit areas. Unsupported route selections show a concise construction notice. Tokyo replaces the overview with a dedicated Yamanote loop.

Selecting a supported Seoul route zooms toward its map bounds and crossfades into a dedicated route SVG before direction, origin, and destination selection. The overview raster is never reused as game geometry. Reduced-motion mode skips the zoom and crossfade. The attached 1000×1000 reference image is not used in production.

Every route has one fixed SVG `viewBox`. Route paths, station nodes, labels, and the train share this coordinate system. Responsive layouts scale or pan the SVG as a whole; they do not independently reposition stations with CSS pixel values. `preserveAspectRatio` prevents distortion.

Station positions are stored as route distances and derived with `getPointAtLength`, not duplicated freehand coordinates. Any separate label offsets are presentation-only and cannot affect station or train geometry. Directed station distances must be monotonic within each non-loop branch. A station fails validation when its rendered node differs from its sampled path position by more than 0.5 SVG user units.

The game uses a fixed full-route overview. On small screens, the complete geometry remains unchanged and users may zoom or pan the map. Station numbers and text accompany color so state is not conveyed by color alone.

## Route data

Each line defines:

- Stable station ID and station number
- Korean display/answer name
- English name where applicable
- Japanese kanji and kana for Yamanote
- Ordered graph connections and branch membership
- SVG station coordinates
- Route path distance at the station
- Official line color and source metadata

Route and station data must be reconciled with current official operator sources before it is frozen. The data version and verification date are displayed in the application information screen.

## Game modes

### Route mode

Players select a line, origin, destination, and permitted direction. The game calculates the ordered path through the line graph. For Yamanote, players explicitly select inner or outer circulation. For branched Seoul Line 1 routes, invalid origin/destination combinations are disabled or explained before the game begins.

The first target is the station after the selected origin. A correct Korean station name followed by Enter advances the logical game state. Incorrect answers remain on the same station and increment the error count.

### Random mode

Practice random mode presents stations from the selected line for 60 seconds without immediate repetition. Ranked random mode uses a server-issued daily seed so every player receives the same sequence and can be compared fairly.

### First-run tutorial

A three-station sample trip teaches input, Enter submission, train movement, and results. Completion is stored locally and the tutorial remains available from settings.

## Korean and Japanese input

All accepted answers are Korean. Yamanote targets show kanji and kana above the Korean answer prompt, using katakana only where the official station spelling requires it.

Input handlers observe `compositionstart`, `compositionend`, and `isComposing`. Enter never submits an incomplete Korean IME composition. Input focus remains in the typing field throughout active play.

## Train motion and concurrency

Logical game progress and visual train progress are separate state domains.

1. A correct answer immediately updates score, target station, and input readiness.
2. The train has a displayed route distance and a target route distance.
3. Rendering advances the displayed distance along the SVG path toward the latest target.
4. Normal travel takes about 300 ms between adjacent stations.
5. If answers arrive faster, the train increases its path-following speed instead of queuing fixed animations.
6. The train never interpolates directly across map space; it always samples the SVG path.
7. The train orientation follows the path tangent.
8. A gap of two or more stations shortens the remaining travel duration without teleporting.
9. The result screen waits briefly for the final arrival animation after scoring has completed.
10. Reduced-motion mode moves immediately without intermediate animation.

The train body is white with dark windows, a line-colored side stripe, and a line badge. It is a consistent original pictogram rather than a copy of a real vehicle illustration.

## Feedback and sound

- Keystrokes produce subtle generated clicks.
- Correct answers produce immediate visual and audio confirmation.
- Incorrect answers produce a short input/train shake and warning sound without flashing.
- Route completion produces a distinct arrival sound.
- Audio initializes only after an intentional user action.
- A persistent mute control and volume setting are available.
- System `prefers-reduced-motion` is respected, with a manual override in settings.

Visual/audio feedback occurs immediately and does not wait for network requests or train animation.

## Accounts and nicknames

The first visit creates a Firebase anonymous account. The player registers a unique first-come nickname. Nickname normalization, validation, and reservation occur atomically on the server to prevent duplicate claims. The same browser signs in automatically; cross-device recovery is intentionally not supported in the initial release.

Nicknames have documented length and character limits and reject blank, control, misleading whitespace, and prohibited values.

## Rankings and result validation

Practice and ranked records are separate. Ranked leaderboards compare only identical line, mode, course, direction, and data-version combinations.

Ranked play begins with a server-issued, single-use run ticket containing the course and server start time. The client submits that authenticated ticket and a compact event summary to a callable Cloud Function. The server uses its own finish time and validates course identity, station sequence, elapsed-time bounds, duplicate submission, and plausible event timing before writing a leaderboard result. App Check and rate limits reduce automated abuse. Network latency is recorded separately and rankings use the validated run duration defined by the server protocol. These controls deter manipulation but do not claim perfect bot prevention.

Results show:

- Completion time
- Korean characters per minute
- Accuracy
- Mean time per station
- Slowest station
- Stations with errors
- Personal-best comparison
- Rank and percentile when a ranked result is accepted

## Failure handling

- Practice mode continues when the network is unavailable.
- Ranked mode checks connectivity before starting.
- A connection failure during ranked play preserves the result as a local practice record and clearly states that it was not ranked.
- Nickname conflicts and validation failures keep the entered value and explain the correction required.
- Audio initialization failure leaves the game playable and indicates muted state.
- Invalid or incomplete route data fails closed during development and does not expose the affected line in production.

## Accessibility and responsive behavior

- Full keyboard operation and visible focus states.
- Touch targets are at least 24 by 24 CSS pixels, with larger primary controls.
- Text and station symbols accompany route color.
- Motion can be reduced; audio can be muted and adjusted.
- No rapid flashing effects.
- SVG geometry keeps its aspect ratio on desktop and mobile.
- Mobile keyboards do not obscure the current target or input field.

## Verification

Automated checks cover:

- Station order, termini, branches, and both loop directions
- Route calculation for representative and boundary origin/destination pairs
- Every station coordinate lying on its declared route path within tolerance
- Monotonic station path distances on every directed branch and correct loop wraparound
- Train position and tangent remaining on the path during rapid consecutive answers
- Korean IME composition and Enter behavior
- Scoring, accuracy, timing, random seeding, and result serialization
- Nickname normalization and atomic collision handling
- Server rejection of invalid courses, impossible times, replayed runs, and unauthenticated writes
- Reduced motion, mute, and offline-practice fallbacks

Visual checks capture 360, 768, and 1440 CSS-pixel viewport widths and cover label collisions, route proportions, zoom/pan behavior, train scale, keyboard occlusion, and official line-color application. Interaction responsiveness targets an INP of 200 ms or less under representative mobile and desktop conditions.

## Sources

- [Original service flow and stated features](https://metrotyping.kr/terms)
- [Seoul Metropolitan Government route map](https://english.seoul.go.kr/service/movement/route-map/)
- [Seoul Metro 2025-09-29 official Korean map dataset and license](https://data.seoul.go.kr/dataList/OA-22535/F/1/datasetView.do)
- [Seoul color-vision-friendly map design](https://english.seoul.go.kr/seoul-publishes-color-blind-friendly-subway-map/)
- [Incheon Transit official route map](https://www.ictr.or.kr/main/railway/guidance/map.jsp)
- [JR East Yamanote directions and 30 stations](https://media.jreast.co.jp/articles/1214)
- [Firebase callable functions](https://firebase.google.com/docs/functions/callable)
- [Firebase App Check for Cloud Functions](https://firebase.google.com/docs/app-check/cloud-functions)
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [MDN Korean/IME composition signal](https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/isComposing)
- [MDN autoplay and Web Audio policy](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- [W3C audio control guidance](https://www.w3.org/WAI/WCAG22/Understanding/audio-control)
- [W3C animation-from-interaction guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [web.dev INP responsiveness guidance](https://web.dev/articles/optimize-inp)

## Deliberate exclusions

The initial release excludes multiplayer, chat, friends, virtual currency, stores, advertisements, large achievement systems, copied train artwork, copied announcement recordings, and a full multi-line transfer network. These do not improve the core typing loop enough to justify their complexity in the first release.
