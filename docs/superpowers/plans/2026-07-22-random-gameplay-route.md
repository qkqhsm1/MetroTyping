# Random Gameplay Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render every eight-station gameplay segment as a spacious, stable randomized SVG route while preserving source-map direction, topology, station order, and train alignment.

**Architecture:** Add one pure seeded route-shape generator beside the existing geometry utilities. `Game` owns a random seed that changes only with `segmentStart`; `RouteMap` applies the generated path to the existing focused source geometry and keeps path-length sampling as the sole station/train coordinate source. Expand the SVG safe area and use deterministic label placement without new dependencies.

**Tech Stack:** React 19, TypeScript 6, SVG, Vitest, Testing Library, native browser/JavaScript APIs.

## Global Constraints

- Show at most eight stations.
- Generate one new shape per segment transition and keep it stable during rerenders.
- Preserve official relative direction and Line 1 branch topology.
- Reject self-intersecting or order-reversing shapes and fall back safely.
- Keep route, stations, labels, and train in one SVG `viewBox`.
- Add no package.
- Verify at 360, 768, and 1440 CSS pixels.
- After each completed code change, verify, commit, and push `main`.

---

### Task 1: Seeded route-shape generator

**Files:**
- Create: `src/game/randomRoute.ts`
- Create: `src/game/randomRoute.test.ts`

**Interfaces:**
- Consumes: `Point` from `src/game/geometry.ts`.
- Produces: `randomizeRoute(path: readonly Point[], seed: number): Point[]` and `hasSelfIntersection(path: readonly Point[]): boolean`.

- [ ] **Step 1: Write failing generator tests**

Test that identical seeds reproduce identical paths, different seeds change internal bends, endpoints remain unchanged, every result stays inside `x=35..565` and `y=35..325`, and no result self-intersects.

```ts
const source:Point[]=[[45,250],[180,210],[330,120],[555,55]]
expect(randomizeRoute(source,17)).toEqual(randomizeRoute(source,17))
expect(randomizeRoute(source,17)).not.toEqual(randomizeRoute(source,18))
expect(randomizeRoute(source,17)[0]).toEqual(source[0])
expect(randomizeRoute(source,17).at(-1)).toEqual(source.at(-1))
expect(hasSelfIntersection(randomizeRoute(source,17))).toBe(false)
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/game/randomRoute.test.ts`

Expected: FAIL because `randomRoute.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure generator**

Use a small seeded linear-congruential generator. Sample five ordered progress positions from the source with `pointAt`, offset only the three internal points perpendicular to the source endpoint vector, clamp to the safe area, and try at most six amplitudes before returning the source path.

```ts
export function randomizeRoute(path:readonly Point[],seed:number):Point[]{
  const start=path[0]!,end=path.at(-1)!
  // seeded values, bounded perpendicular offsets, intersection check
  return accepted??[...path]
}
```

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run src/game/randomRoute.test.ts`

Expected: all generator tests PASS.

- [ ] **Step 5: Commit and push**

```powershell
git add src/game/randomRoute.ts src/game/randomRoute.test.ts
git commit -m "feat: generate stable random route shapes"
git push origin main
```

### Task 2: Segment-owned randomness and SVG integration

**Files:**
- Modify: `src/components/Game.tsx`
- Modify: `src/components/Game.test.tsx`
- Modify: `src/components/RouteMap.tsx`
- Modify: `src/components/RouteMap.test.tsx`

**Interfaces:**
- Consumes: `randomizeRoute(path, seed)` from Task 1.
- Produces: optional `shapeSeed:number` prop on `RouteMap`.

- [ ] **Step 1: Write failing component tests**

Add tests proving `RouteMap` produces the same `points` for the same seed and different `points` for another seed. Extend the Game segment-transition test to assert the `points` value changes after the eighth correct answer while ordinary input rerenders keep it unchanged.

```ts
const first=container.querySelector('[data-route]')!.getAttribute('points')
rerender(<RouteMap {...props} shapeSeed={2}/>)
expect(container.querySelector('[data-route]')).not.toHaveAttribute('points',first)
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/components/RouteMap.test.tsx src/components/Game.test.tsx`

Expected: FAIL because `shapeSeed` is not accepted and route points remain unchanged.

- [ ] **Step 3: Add segment seed state**

In `Game`, keep a run seed in `useRef` and derive the segment seed from the run seed plus `segmentStart`; pass it to `RouteMap`. The value must not depend on `index`, typing value, timers, or render count.

```ts
const runSeed=useRef(Math.floor(Math.random()*0x7fffffff))
const shapeSeed=(runSeed.current+segmentStart*2654435761)>>>0
```

- [ ] **Step 4: Apply randomized path in RouteMap**

Remove the Line 2 straight-line exception and the blanket left/right mirroring. Generate the display path from focused source geometry with `randomizeRoute(sourceGeometry.path,shapeSeed)`. Preserve `data-global-start`, `data-global-end`, and `data-geometry` from the source geometry.

- [ ] **Step 5: Verify GREEN and geometry invariants**

Run: `npx vitest run src/components/RouteMap.test.tsx src/components/Game.test.tsx src/game/geometry.test.ts src/game/randomRoute.test.ts`

Expected: all focused tests PASS, with every station and train distance below `0.01` SVG unit.

- [ ] **Step 6: Commit and push**

```powershell
git add src/components/Game.tsx src/components/Game.test.tsx src/components/RouteMap.tsx src/components/RouteMap.test.tsx
git commit -m "feat: vary each gameplay route segment"
git push origin main
```

### Task 3: Spacious map and readable labels

**Files:**
- Modify: `src/components/RouteMap.tsx`
- Modify: `src/components/RouteMap.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: randomized display path from Task 2.
- Produces: label groups with `data-label-position` and a `0 0 600 360` gameplay `viewBox`.

- [ ] **Step 1: Write failing layout tests**

Assert the larger viewBox, at most eight labels, every station center within the safe area, and deterministic label placement metadata. Include long names such as `인천공항2터미널` and `동대문역사문화공원`.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/components/RouteMap.test.tsx`

Expected: FAIL on the old `0 0 600 290` viewBox and absent label placement metadata.

- [ ] **Step 3: Enlarge the SVG and place labels**

Change the viewBox to `0 0 600 360`, keep route points inside `35..565` by `35..325`, and choose label offsets from `above`, `below`, `left`, and `right`. Use estimated text width from character count and existing two-line splitting; select the first in-bounds candidate that does not overlap an already accepted label box.

- [ ] **Step 4: Adjust responsive CSS**

Give `.route-map` a larger rendered block while retaining `width:100%`, no page overflow, reduced-motion behavior, and the existing target/input spacing.

- [ ] **Step 5: Verify GREEN**

Run: `npx vitest run src/components/RouteMap.test.tsx src/components/Game.test.tsx`

Expected: all layout and gameplay tests PASS.

- [ ] **Step 6: Commit and push**

```powershell
git add src/components/RouteMap.tsx src/components/RouteMap.test.tsx src/styles.css
git commit -m "fix: enlarge gameplay route labels"
git push origin main
```

### Task 4: Geographic direction, full gate, and browser evidence

**Files:**
- Modify: `src/game/routeGeometry.ts`
- Modify: `src/game/geometry.test.ts`
- Modify: `MDs/Workflow.md`

**Interfaces:**
- Consumes: existing `getFocusedRouteGeometry` route context.
- Produces: explicit Line 1 northern, Incheon, and Sinchang branch source paths selected from immutable full-route stations.

- [ ] **Step 1: Write failing Line 1 direction tests**

Assert source-space relative endpoints: Incheon trips originate west/left, Yeoncheon trips point north/up, and Sinchang trips end south/down. Cover both directions and a later segment on each branch.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/game/geometry.test.ts src/components/RouteMap.test.tsx`

Expected: FAIL against the generic Line 1 base path.

- [ ] **Step 3: Add the minimum branch-aware Line 1 source geometry**

Reuse existing topology selection and add only three source-guided legs: northern trunk, Incheon leg, and Sinchang leg. Join legs at Guro for cross-branch trips before focused slicing; do not create per-station coordinate data.

- [ ] **Step 4: Run the complete gate**

Run: `npm run check` and `git diff --check`.

Expected: ESLint, all client/server tests, strict TypeScript, Vite production build, and diff check PASS.

- [ ] **Step 5: Capture browser evidence**

Build and preview under `/MetroTyping/`. Capture Line 1 Incheon, Line 1 Sinchang, Line 2, and Incheon Line 2 at 360, 768, and 1440 CSS pixels. Confirm eight or fewer stations, source-correct relative direction, distinct shapes after segment transitions, readable labels, aligned train, and no page overflow.

- [ ] **Step 6: Update workflow, commit, and push**

Record RED/GREEN evidence, gate counts, capture paths, and any mistakes in `MDs/Workflow.md`.

```powershell
git add src/game/routeGeometry.ts src/game/geometry.test.ts MDs/Workflow.md
git commit -m "fix: preserve Line 1 geographic direction"
git push origin main
```
