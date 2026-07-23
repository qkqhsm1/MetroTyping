# All-Lines Tracking Presentation — Design

Date: 2026-07-23

## Goal

Apply the Seoul Line 2 presentation — one persistent SVG world with a tracking
camera, the balanced green platform sign, and the character-feedback typing
field — to every supported line, and remove the focused eight-station renderer
it replaces.

Supported lines: Seoul 1–9 (including the Line 1 Guro branches, the Line 5
Gangdong branches, the Line 6 directed Eungam loop, and Line 9 local/express),
Suin·Bundang, Incheon 1 and 2, AREX, and JR Yamanote.

## Approved decisions

- Station English names and station numbers come from a downloaded public
  dataset, generated into source. Station order stays on the existing frozen
  official data in `src/data/lines.ts`.
- The persistent world path reuses the existing source-guided polylines in
  `src/game/routeGeometry.ts` rather than new per-line artwork.
- The world is built from the **whole line**; rendering and the camera are
  limited to the **current run's segment**.
- Timed random play receives the station sign and the typing field only, not
  the tracking map.
- `RouteMap`, `labels.ts`, and `randomRoute.ts` are deleted after every line
  passes verification.

## Components

### 1. `src/data/stationInfo.ts` (generated)

```ts
export type StationInfo = { korean: string; english: string; number: string }
export const STATION_INFO: Record<string, Record<string, StationInfo>>
```

Keyed by line id first, then Korean station name, because one station carries a
different number on each line it serves (서울역 is `133` on Line 1, `426` on
Line 4, and `A01` on AREX).

`scripts/fetch-station-info.mjs` downloads the per-line station tables (station
number, Korean name, romanized name), writes the module, and records the source
URL and retrieval date in a file header. JR Yamanote's 30 entries (`JY01`–`JY30`)
are a static table inside the script.

`src/data/line2.ts` is removed; `LINE_2_STATIONS` and `LINE_2_BY_NAME` are
replaced by lookups into `STATION_INFO['seoul-2']`.

**Invariant test:** every station named in any `LINES[].sequences`,
`oneWaySequences`, or `services[].sequence` resolves in `STATION_INFO`. This is
the only guard against a sign rendering a blank number or subtitle.

### 2. `src/game/lineWorld.ts` (replaces `line2Geometry.ts`)

```ts
export type LineWorld = {
  pathD: string          // rendered world path, clipped to the run's segment
  loop: boolean
  stationNames: string[] // the run's stations, in travel order
  pointAt(distance: number): { x: number; y: number; angle: number }
  stationDistance(index: number): number
  cameraWidth(index: number): number
}
export function getLineWorld(lineId: string, stations: string[]): LineWorld
```

Construction:

1. **Resolve topology.** `resolveTopology(lineId, stations)` returns the control
   polyline (from the existing `getRouteGeometry` branch logic) *and* the full
   ordered station sequence for the same branch key. The sequence side is new:
   `seoul-1` picks one of three legs or a two-leg join at 구로, `seoul-5` picks
   trunk / Hanam / Macheon / cross-branch, `seoul-6` picks trunk or Eungam loop,
   `seoul-9` picks local or express, and every other line uses its single
   sequence. Loop lines rotate the sequence to the run's origin and reverse it
   for the counter-clockwise / inner direction.
2. **Build the world path.** Round the polyline corners, then scale uniformly so
   that arc length per station is a constant `STATION_SPACING`, matching the
   value Line 2 uses today. Loop lines close the path. The Line 2 and Yamanote
   loops keep the existing circular path (`LINE_2_PATH_D`) by sampling it into a
   dense polyline, so there is exactly one geometry pipeline.
3. **Place stations.** `stationDistance(i) = fullSequenceIndex(i) * STATION_SPACING`,
   wrapped for loops. Reverse runs are oriented by the existing `isReverseRoute`.
4. **Clip to the run.** `pathD` covers only the arc between the run's first and
   last station, and `stationNames` holds only the run's stations, so a partial
   trip shows its own segment while keeping whole-line curvature and spacing.

`cameraWidth` keeps the current adaptive density formula unchanged.

### 3. Components

| Now | After |
| --- | --- |
| `Line2TrackingMap` | `TrackingMap` — takes `lineId`, reads labels from `STATION_INFO` |
| `Line2TypingField` | `StationTypingField` — logic unchanged |
| `Line2DirectionStation` (inside `Game`) | `DirectionStation` |
| `line2-*` CSS classes | `tracking-*`, `typing-*`, `direction-*` |
| `--line2-target-width`, `--line2-interaction-width` | `--sign-target-width`, `--sign-interaction-width` |

The rename is mechanical and covers `styles.css`, the three components, and the
component tests.

### 4. `Game.tsx`

- `line2Tracking` becomes `tracking = !timed`. All ordered play renders the
  persistent world, the balanced platform sign, the character-feedback typing
  field, the live `PLAY TIME` readout, and the elapsed-time result screen.
- Timed random play keeps the existing `random-stage` panel and gains the current
  station sign (a single pill, no green side regions, since a shuffled sequence
  has no meaningful previous or next) plus `StationTypingField`.
- `showAllStations`, `shapeSeed`, `runSeed`, `trainVisible`, and `trainEntering`
  are removed. The world always renders its train, as Line 2 already does.

### 5. Deletion

Removed once every line passes verification: `src/components/RouteMap.tsx` and
its test, `src/game/labels.ts` and its test, `src/game/randomRoute.ts` and its
test, and `getFocusedRouteGeometry` / `focusedPath` / `normalizePath` in
`routeGeometry.ts`. `pointAt` in `geometry.ts`, `getRouteGeometry`, and
`isReverseRoute` stay, because the world uses them.

## Error handling

- A station missing from `STATION_INFO` renders its Korean name with an empty
  number and no subtitle rather than throwing, and the completeness test fails in
  CI so the gap cannot ship.
- `getLineWorld` throws for an unknown line id or a run whose stations are not a
  contiguous slice of any resolved sequence, matching the existing
  `Missing route geometry` behaviour.
- Reduced motion settles the camera and train immediately, unchanged.
- Typing, scoring, and submission never wait on camera or train state,
  unchanged.

## Verification

Unit and component tests:

- Station data completeness across every sequence of every line.
- Per-line world construction: constant per-station arc spacing, run-clipped
  path endpoints on the first and last station, bounded camera widths.
- Topology resolution: three Line 1 legs plus the cross-Guro join, four Line 5
  branch combinations, the Line 6 trunk and directed loop, Line 9 local and
  express, and both directions of the Line 2 and Yamanote loops.
- Reverse runs read in travel order.
- Sign and typing feedback behaviour, generalized from the current Line 2 tests.

Visual gate: SSR-render the real components and screenshot with headless Chrome
at 360, 768, and 1440 CSS pixels for a representative set — Line 1 Incheon leg,
Line 5 Hanam, Line 6 loop, Line 9 express, Suin·Bundang, Incheon 2, AREX, and
Yamanote — and inspect the PNGs before acceptance, as the Line 2 work did.

Final gate: `npm run check` (ESLint, Vitest, strict TypeScript, production
build), then commit and push `main`.

## Out of scope

- New per-line artwork or official vector path stitching.
- Changing station order, branch definitions, or service termini.
- The Seoul overview map and setup flow.
