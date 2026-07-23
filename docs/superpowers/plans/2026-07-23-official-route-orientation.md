# Official Route Orientation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every gameplay route in its official-map orientation while seeded random curves vary only the interior shape.

**Architecture:** `src/game/routeGeometry.ts` remains the single owner of canonical line topology. Travel direction traverses that fixed geometry forward or backward, and `randomizeRoute` continues to preserve the focused segment's endpoints.

**Tech Stack:** React 19, TypeScript, Vitest, SVG, Vite

## Global Constraints

- Preserve official-map left/right and up/down station relationships.
- Preserve branches and the directed Eungam loop.
- Keep at most eight visible stations.
- Keep stations and train sampled from the same SVG path.
- Add no dependency or new rendering abstraction.

---

### Task 1: Fix and verify canonical route orientation

**Files:**
- Modify: `src/game/routeGeometry.ts`
- Modify: `src/components/RouteMap.test.tsx`
- Modify: `MDs/Workflow.md`

**Interfaces:**
- Consumes: `getRoute(lineId, from, to).stationIds`, `getFocusedRouteGeometry(lineId, stations, routeStationCount, segmentStart, segmentLength)`, and existing `randomizeRoute(path, seed)`.
- Produces: unchanged `RouteGeometry`; its `path[0]` and `path.at(-1)` retain official-map orientation before route traversal.

- [ ] **Step 1: Audit every canonical topology against the bundled official map**

Inspect `public/assets/seoul-metro-map-20250929.pdf` and record each supported topology's endpoint relationship directly in the test table: Seoul Lines 1–9, Suin-Bundang, Incheon Lines 1/2, AREX, and Yamanote, including Line 1 and Line 5 branches and the Line 6 directed loop.

- [ ] **Step 2: Write failing direction tests**

Extend `src/components/RouteMap.test.tsx` with table-driven cases that render the real `RouteMap`, pass `shapeSeed={17}`, and compare the first and last station circles:

```tsx
const officialDirectionCases = [
  { name:'Line 4 Oido departure', lineId:'seoul-4', from:'오이도', to:'진접', axis:'x', order:'less' },
  { name:'Line 7 Seoknam departure', lineId:'seoul-7', from:'석남', to:'장암', axis:'x', order:'less' },
  { name:'Suin-Bundang Oido to Handae-ap', lineId:'suin-bundang', from:'오이도', to:'한대앞', axis:'x', order:'less' },
  { name:'Suin-Bundang Handae-ap to Incheon', lineId:'suin-bundang', from:'한대앞', to:'인천', axis:'x', order:'greater' },
  { name:'Incheon 2 Gajaeul to Geomdan Oryu', lineId:'incheon-2', from:'가재울', to:'검단오류', axis:'y', order:'greater' },
] as const
```

Add the remaining audited topology directions to the same table. For each case, derive the real route with `getRoute`, render its first focused window, and assert the requested coordinate ordering. Also assert the randomized polyline endpoints equal the first and last station points and `hasSelfIntersection(route)` is false.

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```powershell
npx vitest run src/components/RouteMap.test.tsx
```

Expected: reported Line 4, Line 7, and Suin-Bundang cases fail on coordinate ordering while existing alignment assertions pass.

- [ ] **Step 4: Apply the smallest canonical-data correction**

In `src/game/routeGeometry.ts`, reverse or mirror only canonical paths whose sequence direction disagrees with the official map. Do not add per-trip rendering conditions. Keep `isReverseRoute`, focused sampling, normalization, and `randomizeRoute` unchanged unless a failing test proves a shared defect.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```powershell
npx vitest run src/components/RouteMap.test.tsx src/game/randomRoute.test.ts
```

Expected: all direction, endpoint, alignment, determinism, bounds, and non-self-intersection tests pass.

- [ ] **Step 6: Render visual evidence**

Use the existing real-`RouteMap` SSR/headless-Chrome screenshot flow to capture representative forward and reverse trips, including the five reported cases, at 360, 768, and 1440 CSS pixels. Inspect that official direction is preserved and random curves remain varied and readable.

- [ ] **Step 7: Run the repository quality gate**

Run:

```powershell
npm run check
```

Expected: ESLint, all client/server tests, strict TypeScript, and the production build pass.

- [ ] **Step 8: Update memory, commit, push, and verify Pages**

Replace `MDs/Workflow.md` progress with the completed behavior and exact verification evidence. Commit only the scoped files, push `main`, wait for the Pages workflow, and verify the deployed JS asset MIME/content and rendered DOM under `/MetroTyping/`.

