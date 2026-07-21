# Departure Animation, Quick Routes, and New Lines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every supported route start visibly and correctly, add one-click service-terminus trips, add Seoul Line 3 and Suin–Bundang, and make home navigation safe on GitHub Pages.

**Architecture:** Extend the existing `Line` records with service-terminus and loop-preset metadata, then derive all quick-route buttons through tested pure routing helpers. Keep gameplay progress authoritative while a separate presentational train-visibility state controls the 260 ms SVG entrance. Continue using the official overview image plus PDF-derived SVG hit overlays for selection, and the existing focused eight-station SVG for gameplay.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS, SVG, existing PDF-vector extraction script

## Global Constraints

- Canonical repository and branch: `https://github.com/qkqhsm1/MetroTyping`, `main`.
- Do not add dependencies, a router, or a second route model.
- Keep station order, branches, labels, colors, and service termini traceable to current official operator sources.
- The departure station remains the first required answer; never pre-complete it.
- Keep scoring/input state independent from animation state; typing must never wait for animation.
- Keep route, stations, and train in one SVG `viewBox`; never use unrelated CSS pixel coordinates for train position.
- Show at most eight gameplay stations at once and keep segment swaps non-blocking.
- Preserve Unicode Hangul-jamo CPM calculation and Korean IME composition guards.
- Reduced motion must remove entrance translation and scaling.
- Finish with `npm run check` and inspect 360, 768, and 1440 CSS-pixel renders.

---

## File Map

- `src/data/lines.ts`: line metadata, ordered station sequences, official service termini, loop-preset declarations.
- `src/game/routes.ts`: graph routing, full-loop construction, deterministic quick-route-pair generation.
- `src/game/routes.test.ts`: station order, branch reachability, loop, duplicate, and invalid-data coverage.
- `src/components/QuickRoutes.tsx`: presentational quick-route cards and two direction buttons per pair.
- `src/components/QuickRoutes.test.tsx`: one-click selection and accessible-label coverage.
- `src/App.tsx`: one shared start path for custom and preset trips; Vite base-path brand URL.
- `src/App.test.tsx`: setup integration, presets, loop starts, and base-path behavior.
- `src/components/Game.tsx`: train visibility/entrance state independent from answer progress.
- `src/components/Game.test.tsx`: hidden-before-departure, entrance, rapid input, and reduced-motion hooks.
- `src/components/RouteMap.tsx`: new line geometries and conditional SVG train rendering.
- `src/components/RouteMap.test.tsx`: geometry, path alignment, and train visibility assertions.
- `src/components/MapExplorer.tsx`: selectable Seoul Line 3 and Suin–Bundang overview overlays.
- `src/components/MapExplorer.test.tsx`: selection and delayed-highlight regression coverage.
- `scripts/extract-supported-map-lines.mjs`: extract the two new official PDF color layers.
- `public/assets/seoul-supported-lines.svg`: regenerated official vector definitions.
- `src/styles.css`: quick-route layout and 260 ms train/light entrance.
- `AGENTS.md`: promote support and verification invariants for the two new lines.
- `MDs/Workflow.md`: current progress, verification, and any discovered data corrections.

---

### Task 1: Freeze Official Route Data and Extend the Line Model

**Files:**
- Modify: `src/data/lines.ts`
- Modify: `src/game/routes.test.ts`
- Modify: `AGENTS.md`
- Modify: `MDs/Workflow.md`

**Interfaces:**
- Produces: `ServiceTerminus`, `LoopPreset`, and extended `Line` metadata consumed by Task 2.
- Produces exact `seoul-3` and `suin-bundang` records consumed by all later UI tasks.

- [ ] **Step 1: Re-check official data immediately before editing**

Compare the bundled official metropolitan map with current Seoul Metro and Korail operator station/timetable material. Record source title, URL, access date `2026-07-21`, and the exact endpoint evidence in the existing source comment block or a new compact comment immediately above the relevant constants in `src/data/lines.ts`. Reject third-party-only evidence.

The frozen main sequences must be exactly:

```ts
const seoul3 = [
  '대화', '주엽', '정발산', '마두', '백석', '대곡', '화정', '원당', '원흥', '삼송', '지축',
  '구파발', '연신내', '불광', '녹번', '홍제', '무악재', '독립문', '경복궁', '안국',
  '종로3가', '을지로3가', '충무로', '동대입구', '약수', '금호', '옥수', '압구정', '신사',
  '잠원', '고속터미널', '교대', '남부터미널', '양재', '매봉', '도곡', '대치', '학여울',
  '대청', '일원', '수서', '가락시장', '경찰병원', '오금',
]

const suinBundang = [
  '청량리', '왕십리', '서울숲', '압구정로데오', '강남구청', '선정릉', '선릉', '한티', '도곡',
  '구룡', '개포동', '대모산입구', '수서', '복정', '가천대', '태평', '모란', '야탑', '이매',
  '서현', '수내', '정자', '미금', '오리', '죽전', '보정', '구성', '신갈', '기흥', '상갈',
  '청명', '영통', '망포', '매탄권선', '수원시청', '매교', '수원', '고색', '오목천', '어천',
  '야목', '사리', '한대앞', '중앙', '고잔', '초지', '안산', '신길온천', '정왕', '오이도',
  '달월', '월곶', '소래포구', '인천논현', '호구포', '남동인더스파크', '원인재', '연수',
  '송도', '인하대', '숭의', '신포', '인천',
]
```

Before freezing service termini, compare the current timetable against these candidate sets and change them only when the official timetable contradicts them: Seoul 3 `['대화', '구파발', '삼송', '오금']`; Suin–Bundang `['청량리', '왕십리', '죽전', '고색', '오이도', '인천']`. Document every correction in `MDs/Workflow.md` rather than silently preserving a remembered value.

- [ ] **Step 2: Write failing metadata and order tests**

Add tests that assert the complete arrays, official colors, uniqueness, and endpoint metadata:

```ts
expect(getLine('seoul-3')).toMatchObject({
  name: '서울 3호선',
  color: '#EF7C1C',
  sequences: [seoul3Expected],
})
expect(getLine('suin-bundang')).toMatchObject({
  name: '수인·분당선',
  color: '#F5A200',
  sequences: [suinBundangExpected],
})
for (const id of ['seoul-3', 'suin-bundang']) {
  const line = getLine(id)
  expect(new Set(line.sequences.flat()).size).toBe(line.sequences.flat().length)
  expect(line.serviceTermini?.every(station => line.sequences.flat().includes(station))).toBe(true)
}
```

Also assert Seoul 2 metadata uses origin `신도림` with `clockwise/counterclockwise`, and Yamanote uses origin `도쿄` with `outer/inner`.

- [ ] **Step 3: Run the focused test and confirm failure**

Run: `npm test -- src/game/routes.test.ts`

Expected: FAIL because `seoul-3`, `suin-bundang`, `serviceTermini`, and `loopPreset` do not exist.

- [ ] **Step 4: Extend the types and line records minimally**

Use these exact public shapes:

```ts
export type ServiceTerminus = { station: string; source: string }
export type LoopDirection = { value: 'clockwise' | 'counterclockwise' | 'outer' | 'inner'; label: string }
export type LoopPreset = { origin: string; directions: readonly [LoopDirection, LoopDirection] }
export type Line = {
  id: string
  name: string
  color: string
  loop?: boolean
  sequences: string[][]
  serviceTermini?: ServiceTerminus[]
  loopPreset?: LoopPreset
}
```

Add both new line records, add verified metadata to all non-loop lines, and add loop metadata to Seoul 2/Yamanote. Preserve the existing station label spelling used by the game unless the official source proves it wrong.

- [ ] **Step 5: Run the focused test**

Run: `npm test -- src/game/routes.test.ts`

Expected: PASS for all line-data assertions.

- [ ] **Step 6: Commit**

```powershell
git add src/data/lines.ts src/game/routes.test.ts AGENTS.md MDs/Workflow.md
git commit -m "feat: add official line 3 and suin-bundang data"
```

---

### Task 2: Generate Reachable Quick Routes and Exact One-Lap Routes

**Files:**
- Modify: `src/game/routes.ts`
- Modify: `src/game/routes.test.ts`

**Interfaces:**
- Consumes: `Line.serviceTermini` and `Line.loopPreset` from Task 1.
- Produces: `QuickRoute`, `QuickRoutePair`, `getFullLoopRoute()`, and `getQuickRoutePairs()` for Tasks 3 and 4.

- [ ] **Step 1: Write failing route-generation tests**

Add the exact behavior tests:

```ts
const pairs = getQuickRoutePairs('seoul-1')
expect(new Set(pairs.map(pair => pair.id)).size).toBe(pairs.length)
for (const pair of pairs) {
  for (const route of pair.routes) {
    expect(route.stationIds[0]).toBe(route.from)
    expect(route.stationIds.at(-1)).toBe(route.to)
    expect(route.stationIds.length).toBeGreaterThan(1)
  }
}

const clockwise = getFullLoopRoute('seoul-2', '신도림', 'clockwise')
expect(clockwise.stationIds[0]).toBe('신도림')
expect(clockwise.stationIds).toHaveLength(getLine('seoul-2').sequences[0]!.length)
expect(clockwise.stationIds.at(-1)).not.toBe('신도림')
expect(new Set(clockwise.stationIds).size).toBe(clockwise.stationIds.length)

const outer = getFullLoopRoute('yamanote', '도쿄', 'outer')
expect(outer.stationIds[0]).toBe('도쿄')
expect(outer.stationIds.at(-1)).not.toBe('도쿄')
```

Add one assertion per declared service terminus proving it occurs in at least one generated pair, and assert every pair contains two opposite directions. Add `expect(() => getFullLoopRoute('seoul-1', '인천', 'clockwise')).toThrow('Not a loop line')`.

- [ ] **Step 2: Run the route tests and confirm failure**

Run: `npm test -- src/game/routes.test.ts`

Expected: FAIL because the quick-route exports do not exist.

- [ ] **Step 3: Add exact route types and loop construction**

Add:

```ts
export type QuickRoute = {
  id: string
  label: string
  from: string
  to: string
  direction: string
  stationIds: string[]
}

export type QuickRoutePair = {
  id: string
  title: string
  routes: readonly [QuickRoute, QuickRoute]
}

export function getFullLoopRoute(lineId: string, origin: string, direction: string) {
  const line = getLine(lineId)
  const sequence = line.sequences[0]
  if (!line.loop || !sequence) throw new Error('Not a loop line')
  const originIndex = sequence.indexOf(origin)
  if (originIndex < 0) throw new Error('Invalid station')
  const step = direction === 'clockwise' || direction === 'outer' ? 1 : -1
  const stationIds = Array.from({ length: sequence.length }, (_, offset) => {
    const index = (originIndex + offset * step + sequence.length) % sequence.length
    const station = sequence[index]
    if (!station) throw new Error('Invalid line data')
    return station
  })
  return { stationIds, direction, pathId: lineId }
}
```

- [ ] **Step 4: Generate deterministic pairs without hand-written buttons**

Implement `getQuickRoutePairs(lineId: string): QuickRoutePair[]` with these rules:

```ts
if (line.loopPreset) {
  const [first, second] = line.loopPreset.directions
  const routes = [first, second].map(item => {
    const route = getFullLoopRoute(lineId, line.loopPreset!.origin, item.value)
    return {
      ...route,
      id: `${lineId}:${item.value}`,
      label: `${line.loopPreset!.origin} · ${item.label} 한 바퀴`,
      from: line.loopPreset!.origin,
      to: route.stationIds.at(-1)!,
    }
  }) as unknown as readonly [QuickRoute, QuickRoute]
  return [{ id: `${lineId}:loop`, title: `${line.loopPreset.origin} 한 바퀴`, routes }]
}
```

For non-loop lines, iterate `serviceTermini` by stable declaration order with `leftIndex < rightIndex`; call `getRoute()` in both directions; emit one pair only when both resolve; use a `Set` keyed by sorted station names to prevent reversed duplicates. Do not swallow errors other than `No route`; invalid declared stations must fail tests.

- [ ] **Step 5: Run the route suite**

Run: `npm test -- src/game/routes.test.ts`

Expected: PASS, including both circular directions and every declared terminus.

- [ ] **Step 6: Commit**

```powershell
git add src/game/routes.ts src/game/routes.test.ts
git commit -m "feat: generate service terminus quick routes"
```

---

### Task 3: Render One-Click Quick-Route Cards

**Files:**
- Create: `src/components/QuickRoutes.tsx`
- Create: `src/components/QuickRoutes.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `QuickRoutePair` from Task 2.
- Produces: `QuickRoutes({ pairs, color, onStart })` for Task 4.

- [ ] **Step 1: Write the failing component test**

```tsx
const onStart = vi.fn()
render(<QuickRoutes pairs={[pair]} color="#0052A4" onStart={onStart} />)
expect(screen.getByRole('heading', { name: '빠른 여행' })).toBeInTheDocument()
expect(screen.getByText('인천 ↔ 신창')).toBeInTheDocument()
fireEvent.click(screen.getByRole('button', { name: '인천에서 신창까지 바로 시작' }))
expect(onStart).toHaveBeenCalledWith(pair.routes[0])
```

Also assert the reverse button calls `pair.routes[1]` and every button is keyboard reachable.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/components/QuickRoutes.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Add the focused presentational component**

```tsx
import type { QuickRoute, QuickRoutePair } from '../game/routes'

export default function QuickRoutes({ pairs, color, onStart }: {
  pairs: QuickRoutePair[]
  color: string
  onStart: (route: QuickRoute) => void
}) {
  if (!pairs.length) return null
  return <section className="quick-routes" style={{ '--line': color } as React.CSSProperties}>
    <div><p className="eyebrow">ONE CLICK TRIP</p><h2>빠른 여행</h2></div>
    <div className="quick-route-grid">{pairs.map(pair => <article key={pair.id}>
      <h3>{pair.title}</h3>
      <div>{pair.routes.map(route => <button key={route.id} onClick={() => onStart(route)}
        aria-label={`${route.from}에서 ${route.to}까지 바로 시작`}>{route.label}</button>)}</div>
    </article>)}</div>
  </section>
}
```

- [ ] **Step 4: Add restrained responsive styling**

Use a horizontally scrollable card row at 360 px and a two-column grid from 768 px. Buttons must be at least 44 CSS px tall, inherit the line color through `--line`, retain visible focus, and never cover the custom selectors. Do not use fixed page-height menus.

- [ ] **Step 5: Run the component test**

Run: `npm test -- src/components/QuickRoutes.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/components/QuickRoutes.tsx src/components/QuickRoutes.test.tsx src/styles.css
git commit -m "feat: add one-click quick route cards"
```

---

### Task 4: Unify Preset and Custom Starts and Fix GitHub Pages Home Navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `getQuickRoutePairs()` and `QuickRoutes`.
- Produces: one `startRoute()` state transition used by presets and custom selection.

- [ ] **Step 1: Write failing integration tests**

Add tests that select Seoul 1, click an `인천 → 신창` quick button, and assert the game first asks for `인천`. Add a loop test that clicks Seoul 2 clockwise and asserts the route begins at `신도림` and does not contain a repeated terminal `신도림`. Keep the custom selector test proving arbitrary stations still work.

Add a production-base test by stubbing `import.meta.env.BASE_URL` through Vite’s test config or by extracting the expression to an exported constant:

```tsx
expect(screen.getByRole('link', { name: 'METRO/TYPE' })).toHaveAttribute('href', import.meta.env.BASE_URL)
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because presets are not rendered and the brand still points to `/`.

- [ ] **Step 3: Add one route-start path**

Add state `routeOverride: string[] | null` and one callback:

```ts
const startRoute = (selection?: QuickRoute) => {
  if (selection) {
    setFrom(selection.from)
    setTo(selection.to)
    setDirection(selection.direction)
    setRouteOverride(selection.stationIds)
  } else {
    setRouteOverride(null)
  }
  setMode('route')
  setPlaying(true)
}
```

Resolve gameplay with `routeOverride ?? getRoute(...).stationIds`. Render `<QuickRoutes>` above the custom selectors, call `startRoute(route)` from presets and `startRoute()` from the primary button, and clear `routeOverride` whenever the player selects a new line, changes custom origin/destination/direction, or leaves gameplay.

- [ ] **Step 4: Fix the brand URL**

Replace `<a className="brand" href="/">` with:

```tsx
<a className="brand" href={import.meta.env.BASE_URL}>METRO<span>/</span>TYPE</a>
```

Do not add React Router or a GitHub Pages 404 fallback.

- [ ] **Step 5: Run focused tests and production build**

Run: `npm test -- src/App.test.tsx src/components/QuickRoutes.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: PASS; the emitted application is built with `/MetroTyping/` when `vite.config.ts` uses repository-name base in production.

- [ ] **Step 6: Commit**

```powershell
git add src/App.tsx src/App.test.tsx
git commit -m "feat: connect quick starts and pages-safe home link"
```

---

### Task 5: Add Seoul Line 3 and Suin–Bundang to Both SVG Map Surfaces

**Files:**
- Modify: `scripts/extract-supported-map-lines.mjs`
- Modify: `public/assets/seoul-supported-lines.svg`
- Modify: `src/components/MapExplorer.tsx`
- Modify: `src/components/MapExplorer.test.tsx`
- Modify: `src/components/RouteMap.tsx`
- Modify: `src/components/RouteMap.test.tsx`

**Interfaces:**
- Consumes: `seoul-3` and `suin-bundang` line IDs/colors from Task 1.
- Produces: selectable official-overview overlays and focused gameplay geometry for both lines.

- [ ] **Step 1: Write failing overview and gameplay-map tests**

Add selection assertions:

```tsx
fireEvent.click(screen.getByRole('button', { name: '서울 3호선 선택' }))
expect(onSelect).toHaveBeenCalledWith('seoul-3')
fireEvent.click(screen.getByRole('button', { name: '수인·분당선 선택' }))
expect(onSelect).toHaveBeenCalledWith('suin-bundang')
```

For each new line, render `RouteMap`, assert its base polyline differs from Seoul 2, assert every supplied station has a `<text>` label, and assert each sampled station point has distance less than `0.01` SVG units from the declared route polyline using the existing geometry helper/test pattern.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/components/MapExplorer.test.tsx src/components/RouteMap.test.tsx`

Expected: FAIL because neither line has hit geometry or focused geometry.

- [ ] **Step 3: Extend official PDF-vector extraction**

Add exact `seoul-3` and `suin-bundang` entries to the extraction color map after inspecting `.artifacts/seoul-map.svg`. Do not guess profile-converted RGB values: count candidate paths, generate the asset, and inspect each layer alone against the official raster. Keep the existing guard and require at least five extracted paths per line.

Run: `node scripts/extract-supported-map-lines.mjs`

Expected: `public/assets/seoul-supported-lines.svg` contains `<g id="seoul-3">` and `<g id="suin-bundang">`, each with five or more paths.

- [ ] **Step 4: Wire hit areas and focused geometries**

Add the two IDs to `MapExplorer`’s `hitPaths` using the PDF-derived paths and line colors. Add one readable normalized route template per line to `RouteMap`’s geometry table; station positions must continue to be produced by path-length sampling, not per-station CSS coordinates. For Suin–Bundang’s long route, geometry only needs to describe the current focused eight-station segment shape; it must not squeeze all 63 stations into one SVG.

- [ ] **Step 5: Run tests and capture overlay-only diagnostics**

Run: `npm test -- src/components/MapExplorer.test.tsx src/components/RouteMap.test.tsx`

Expected: PASS.

Capture each new overlay active at 1440 CSS px and compare it to the official map. Verify 1.2× selected-line thickness, existing 150 ms pointer-intent delay, and base-map dimming remain unchanged.

- [ ] **Step 6: Commit**

```powershell
git add scripts/extract-supported-map-lines.mjs public/assets/seoul-supported-lines.svg src/components/MapExplorer.tsx src/components/MapExplorer.test.tsx src/components/RouteMap.tsx src/components/RouteMap.test.tsx
git commit -m "feat: add line 3 and suin-bundang map geometry"
```

---

### Task 6: Hide the Train Until Departure and Animate Its First Appearance

**Files:**
- Modify: `src/components/Game.tsx`
- Modify: `src/components/Game.test.tsx`
- Modify: `src/components/RouteMap.tsx`
- Modify: `src/components/RouteMap.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Adds RouteMap props: `trainVisible?: boolean` and `trainEntering?: boolean`.
- Keeps `progress`, `targetIndex`, SVG path sampling, and game answer state unchanged.

- [ ] **Step 1: Write failing visibility and rapid-input tests**

In `Game.test.tsx`, render a route beginning `['신도림', '문래', '영등포구청']`; assert `.train` is absent initially; type `신도림` and press Enter; assert `.train` exists with `.train-entering`; without advancing timers, type `문래` and press Enter; assert the prompt advances to `영등포구청` and the train remains present.

In `RouteMap.test.tsx`, assert:

```tsx
const { container, rerender } = render(<RouteMap {...props} trainVisible={false} />)
expect(container.querySelector('.train')).not.toBeInTheDocument()
rerender(<RouteMap {...props} trainVisible trainEntering />)
expect(container.querySelector('.train')).toHaveClass('train-entering')
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/components/Game.test.tsx src/components/RouteMap.test.tsx`

Expected: FAIL because the train is currently unconditional.

- [ ] **Step 3: Separate presentation state from answer progress**

In `Game`, add:

```ts
const [trainVisible, setTrainVisible] = useState(false)
const [trainEntering, setTrainEntering] = useState(false)
```

On the first correct route-mode submission (`!timed && index === 0`), set both true and schedule only `setTrainEntering(false)` after 260 ms. Clear that timer in an effect cleanup. Do not await it, disable the input, delay `setIndex`, or alter CPM timing. Pass both props to `RouteMap`. Random mode remains train-free.

- [ ] **Step 4: Render the train conditionally inside the same SVG**

Wrap the existing train body without changing its path-derived outer transform:

```tsx
{trainVisible && <g className={`train${trainEntering ? ' train-entering' : ''}`} transform={trainTransform}>
  <g className="train-entrance-shell">
    <g className="train-body" transform="translate(-22 0)">{/* existing train artwork */}</g>
    <path className="train-light" d="M -2 -4 L 7 -4" />
  </g>
</g>}
```

Animate only `.train-entrance-shell`; the outer `.train` remains on the sampled SVG path and tangent.

- [ ] **Step 5: Add the exact 260 ms motion and reduced-motion override**

```css
.train-entering .train-entrance-shell {
  transform-box: fill-box;
  transform-origin: center;
  animation: train-enter 260ms cubic-bezier(.2,.8,.2,1) both;
}
.train-entering .train-light { animation: train-light-on 260ms ease-out both; }
@keyframes train-enter {
  from { opacity: 0; transform: translateX(-18px) scale(.72); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}
@keyframes train-light-on {
  from { opacity: 0; stroke-dasharray: 0 12; }
  to { opacity: 1; stroke-dasharray: 12 0; }
}
@media (prefers-reduced-motion: reduce) {
  .train-entering .train-entrance-shell,
  .train-entering .train-light { animation: none; }
}
```

- [ ] **Step 6: Run focused tests**

Run: `npm test -- src/components/Game.test.tsx src/components/RouteMap.test.tsx`

Expected: PASS, including two correct answers inside the 260 ms window.

- [ ] **Step 7: Commit**

```powershell
git add src/components/Game.tsx src/components/Game.test.tsx src/components/RouteMap.tsx src/components/RouteMap.test.tsx src/styles.css
git commit -m "feat: reveal train after typing departure"
```

---

### Task 7: Full Verification, Responsive Visual QA, and Handoff State

**Files:**
- Modify: `MDs/Workflow.md`
- Modify: `AGENTS.md` only if verification reveals a reusable prevention rule.

**Interfaces:**
- Consumes all prior tasks.
- Produces a verified local `main` ready for explicit user-authorized push/deployment.

- [ ] **Step 1: Run the full quality gate**

Run: `npm run check`

Expected: ESLint PASS, all Vitest client/server tests PASS, `tsc --noEmit` PASS, and Vite production build PASS.

- [ ] **Step 2: Exercise high-risk interactions manually**

Verify all of the following in the built preview:

```text
Seoul 1: every generated terminus pair starts in both directions
Seoul 2: Sindorim first; clockwise/counterclockwise stop before repeated Sindorim
Seoul 3: Daehwa↔Ogeum custom route plus every verified timetable terminus preset
Suin–Bundang: Incheon↔Cheongnyangni custom route plus every verified timetable terminus preset
Incheon 1/2 and AREX: both directions for every declared endpoint pair
Yamanote: Tokyo first; inner/outer stop before repeated Tokyo
Departure: no train before first correct answer; appears afterward
Rapid typing: second correct answer accepted during entrance
IME: composing Enter never submits
Sound: key/correct/error/complete and mute remain correct
Reduced motion: train appears with no entrance transform
Brand: click returns to /MetroTyping/ in production preview
```

- [ ] **Step 3: Capture responsive evidence**

At 360, 768, and 1440 CSS-pixel widths, capture and inspect:

```text
Seoul overview with Seoul 3 active
Seoul overview with Suin–Bundang active
Seoul 1 setup with the longest quick-route list
Seoul 2 loop quick routes
Seoul 3 gameplay before and after departure
Suin–Bundang gameplay at an eight-station segment boundary
Yamanote inner/outer quick routes
```

Reject overlap, clipped Korean labels, hidden buttons, more than eight gameplay stations, or horizontal page overflow. A horizontal quick-card scroller at 360 px is allowed.

- [ ] **Step 4: Verify the Pages base path without publishing**

Run a production preview and request both the site root and emitted assets under `/MetroTyping/`. Expected: HTTP 200. Click `METRO/TYPE`; expected browser location remains `/MetroTyping/`, never the account root `/`.

- [ ] **Step 5: Update durable handoff state**

Replace `MDs/Workflow.md` Progress and Verification with the exact test count, commands, capture widths, official sources, and remaining uncertainty. Record any failed assumption immediately under Mistakes using `date | symptom | cause | correction | prevention`.

- [ ] **Step 6: Commit verification records**

```powershell
git add MDs/Workflow.md AGENTS.md
git commit -m "docs: record route expansion verification"
```

- [ ] **Step 7: Stop before external publication unless explicitly authorized**

Report the local commits and verification results. Do not push, publish, or trigger GitHub Pages merely because the local implementation passes; those external mutations require explicit user authorization.

