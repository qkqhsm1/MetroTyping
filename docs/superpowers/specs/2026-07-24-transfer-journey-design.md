# Transfer Journey Mode — Design

Date: 2026-07-24

## Goal

Add a third game mode, **환승 여행 (Transfer Journey)**, where the player boards
one line, rides it freely with no fixed destination, and presses **Tab** at a
real transfer station to switch to another line. The map, sign, and colour all
change to the line the player transferred onto. The run ends only when the
player can go no further on any line, or when they stop manually.

## Approved decisions

- New mode alongside the existing 노선 운행 (ordered) and 랜덤 역명 (timed) modes.
  Neither existing mode changes.
- No destination is chosen. Where the player ends up becomes the terminus.
- Setup: pick a **line → start station → direction (adjacent-station buttons)
  → start**. No destination selector.
- Transfer targets are only the lines the game already supports. Unsupported
  lines a real station connects to (김포골드라인, 서해선, …) are not offered.
- **Tab** (quick) transfers to the top of a fixed line priority order.
- **Tab held ≥1.5s** opens a transfer menu; number keys 1/2/3 pick a line; Esc
  cancels.
- Priority order: numbered Seoul lines 1→9 first, then the non-numbered lines
  (AREX, Suin·Bundang, Incheon 1, Incheon 2) in that order. No per-station or
  per-line special cases.
- Direction after a transfer is set by which neighbour the player types first,
  the same rule the setup direction buttons express before typing begins.
- The run ends automatically only at a true dead end: the current station is a
  terminus on the current line **and** has no transfer option. A terminus that a
  transfer line continues from (인천 → Suin·Bundang) is not a dead end — the
  player transfers on or ends manually. A loop line never dead-ends.
- The Tab / number keys are intercepted only at a transfer station and never
  reach the typing input; Korean IME composition is untouched.

## Components

### 1. `src/game/transfers.ts` (derived, no new data)

```ts
export type LinePriority = readonly string[]
export const LINE_PRIORITY: LinePriority // seoul-1..seoul-9, arex, suin-bundang, incheon-1, incheon-2

// Every supported line whose sequence contains `station`, excluding `currentLine`,
// ordered by LINE_PRIORITY. Empty when the station is not a transfer.
export function transferOptionsAt(station: string, currentLine: string): string[]

// The neighbours a run can move to from `station` on `line` in each direction,
// used to resolve direction by first-typed and to know when a station is a dead end.
export function onwardStations(line: string, station: string): string[]
```

`transferOptionsAt` is computed from `LINES` sequences and `oneWaySequences`; the
existing station-name crossing already yields 77 transfer stations. Yamanote is
excluded — it shares no station with the Seoul network.

### 2. `src/game/journey.ts` (the free-roam state machine)

Pure functions over an immutable journey position, so the machine is tested
without React:

```ts
export type Position = { line: string; station: string; direction: string }
export type Journey = { position: Position; visited: string[]; transfers: number }

// The station the player must type next given the current position, or null at a dead end.
export function nextStation(position: Position): string | null

// Advance one station in the current direction; after a transfer the direction is undecided, and
// typing either neighbour sets it (see resolveDirection).
export function advance(journey: Journey, typed: string): Journey

// After a transfer, the first correctly typed neighbour fixes direction.
export function resolveDirection(line: string, station: string, typedNeighbour: string): string

// Switch line at the current station; direction becomes undecided until the next station is typed.
export function transfer(journey: Journey, toLine: string): Journey

// True only when the station is a terminus on the current line AND no other line serves it, so the
// player can neither continue nor transfer onward. A terminus with a transfer (인천) is not a dead end.
export function isDeadEnd(position: Position): boolean
```

Boarding starts with a decided direction, chosen by the setup buttons. Every
transfer reopens it: the sign then accepts either neighbour and the first
correct one calls `resolveDirection`. While direction is undecided there is no
single next target, so the typing field shows an empty target (no grey overlay)
and the sign presents both onward neighbours as the two choices; typing either
one resolves the direction and the normal single-target render resumes.

### 3. `TransferSign` component (the `[current]→[next]` badge)

Rendered above the direction sign only when `transferOptionsAt` is non-empty.

- Collapsed: current line badge → arrow → the priority option's badge, e.g.
  `⑤ → Ⓐ`.
- A line badge is a colour circle: numbered lines show the digit; AREX shows
  `A`, Suin·Bundang `수인`, Incheon 1/2 `I1`/`I2`.
- While Tab is held, a ring fills over 1.5s; at 1.5s the badge expands into a
  numbered list of every option (`1.Ⓐ 공항철도  2.⑨ 9호선`).
- Colour and label come from `getLine(id)`; no new per-line data.

### 4. `Game.tsx` — the transfer branch

A new `journey` prop path. When `mode==='transfer'`, `Game` owns a `Journey`
state instead of a fixed `stations` array, and derives, each render:

- the current line's remaining path from the position, fed to `getLineWorld`,
  the sign, and the typing field exactly as today — so the world, camera, sign,
  and typing code are unchanged;
- `color` from `getLine(position.line)`, so a transfer recolours everything;
- the transfer options for `TransferSign`.

Ordered and timed modes keep passing fixed `stations`/`durationSeconds` and are
untouched. Tab handling lives in a `keydown`/`keyup` pair on the input:
`preventDefault` on Tab, start a 1.5s timer on keydown, quick-release transfers
to the priority line, held-release (or reaching 1.5s) opens the menu, number
keys pick, Esc closes. Tab is ignored when `transferOptionsAt` is empty.

### 5. `App.tsx` — setup

A third mode button 환승 여행. When selected, the setup shows the start-station
`StationSelect`, then direction buttons built from `onwardStations(line,start)`
(each button labelled with its adjacent station, e.g. `영등포 방향` / `구로 방향`;
a terminus yields one, auto-selected). Start launches `Game` with the initial
`Journey`. No destination selector, no quick routes.

## Data flow

```
setup(line, start, direction) → Journey{position:{line,start,direction}}
   → Game derives currentLine's remaining path → getLineWorld / sign / typing
   → type next station → advance() → new position
   → at a transfer station: Tab → transfer(toLine) → direction undecided
        → type either neighbour → resolveDirection → new position on new line
   → isDeadEnd → result screen
```

## Result screen

Stations passed, transfer count, the list of lines ridden in order, jaso typing
speed, and play time (first jaso to final arrival, as the other modes measure).

## Error handling

- Tab at a non-transfer station: ignored, no menu, input unaffected.
- Number key with the menu closed, or out of range: ignored.
- A transfer whose target line the player is already on is never offered
  (`transferOptionsAt` excludes `currentLine`).
- Boarding or transferring at a station with a single onward neighbour
  auto-resolves direction.
- Reduced motion, IME composition, and the jaso speed rules are inherited from
  the existing typing path unchanged.

## Testing

- `transfers.ts`: `transferOptionsAt` and priority order for 김포공항
  (`[5,9,arex]` → ordered seoul-5, seoul-9, arex minus current), 종로3가
  (1/3/5), 인천 (1, suin-bundang), and a non-transfer station (empty).
  `onwardStations` at a mid-line station (two), a terminus (one), and a branch
  junction.
- `journey.ts`: boarding resolves direction from the first typed neighbour and
  the opposite neighbour is equally valid; `advance` moves one station;
  `transfer` switches line and re-opens direction; `isDeadEnd` is true at 연천
  (Line 1 terminus, no transfer) and false at 인천 (Line 1 terminus but
  Suin·Bundang continues) and at 오금 (Line 3 terminus, Line 5 continues); a loop
  line is never a dead end.
- `TransferSign`: renders only at a transfer station, shows the priority badge
  collapsed, expands to a numbered list, badge labels per line.
- `Game.tsx`: a transfer recolours the map and swaps the world; Tab is ignored
  off a transfer station; quick Tab takes the priority line; held Tab opens the
  menu and a number key transfers; typing the first neighbour after a transfer
  sets direction; the input value and IME are untouched by Tab.
- Visual gate: board Line 1, ride, transfer at a real station, confirm the map,
  colour, and sign change, at 360/768/1440.

## Out of scope

- Unsupported lines as transfer targets (김포골드라인, 서해선, 경춘선, …).
- Shortest-path guidance or a target destination.
- Transfer walking time or fare.
- Yamanote in transfer mode (no shared stations with the Seoul network).
