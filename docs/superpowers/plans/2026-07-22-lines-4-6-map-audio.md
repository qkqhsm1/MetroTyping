# Seoul Lines 4/6, Map, and Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add playable Seoul Lines 4 and 6, sharpen the Seoul overview, revise home copy, and improve selection/typing sounds.

**Architecture:** Extend the existing line records and route graph instead of adding a second routing system. Keep the official raster map as the readable base and reuse its extracted SVG geometry only for interaction; use native responsive images/CSS and Web Audio with no new dependencies.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, CSS, SVG, Web Audio, ImageMagick/Poppler build tools.

## Global Constraints

- Line 4 is `진접 ↔ 오이도` with one two-way quick-trip card.
- Line 6 is `응암순환 + 신내`; loop travel is only `응암 → 역촌 → 불광 → 독바위 → 연신내 → 구산 → 응암`.
- Keep custom station selection and reject nonexistent reverse loop routes.
- The official PDF/JPG remains attributed under KOGL Type 1.
- SVG is interaction geometry, not the map text background.
- The line-selection chime plays once per page session and obeys mute.
- Existing effect gain is exactly `0.135`; audio failure never blocks selection or play.
- Do not add dependencies.

---

### Task 1: Directed route data and quick trips

**Files:**
- Modify: `src/data/lines.ts`
- Modify: `src/game/routes.ts`
- Test: `src/game/routes.test.ts`

**Interfaces:**
- Consumes: existing `Line`, `getRoute()`, `getQuickRoutePairs()`.
- Produces: `Line.oneWaySequences?: string[][]`; `QuickRoutePair.routes: readonly QuickRoute[]`.

- [ ] **Step 1: Write failing route tests**

```ts
test('routes Line 4 end to end in both directions', () => {
  expect(getRoute('seoul-4','진접','오이도').stationIds.at(-1)).toBe('오이도')
  expect(getRoute('seoul-4','오이도','진접').stationIds.at(-1)).toBe('진접')
})

test('keeps the Eungam loop one-way while connecting it to the trunk', () => {
  expect(getRoute('seoul-6','응암','구산').stationIds).toEqual(['응암','역촌','불광','독바위','연신내','구산'])
  expect(getRoute('seoul-6','구산','역촌').stationIds).toEqual(['구산','응암','역촌'])
})
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/game/routes.test.ts`
Expected: FAIL because `seoul-4` and `seoul-6` do not exist.

- [ ] **Step 3: Add minimal data and directed edges**

```ts
export type Line = { /* existing fields */ oneWaySequences?: string[][] }

function graphFor(sequences:string[][], oneWaySequences:string[][]=[]) {
  // Existing bidirectional links stay unchanged.
  // Each one-way sequence adds only sequence[index] -> sequence[index + 1].
}
```

Add the official Line 4 sequence from `진접` through `오이도`, the Line 6 trunk `응암↔신내`, and the repeated-origin directed loop above. Declare only the approved quick-route pairs.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- --run src/game/routes.test.ts src/components/QuickRoutes.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/data/lines.ts src/game/routes.ts src/game/routes.test.ts src/components/QuickRoutes.test.tsx
git commit -m "feat: add Seoul lines 4 and 6"
```

### Task 2: Selection UI and home copy

**Files:**
- Modify: `src/components/MapExplorer.tsx`
- Modify: `src/components/MapExplorer.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `LINES`, `onSelect(lineId)`.
- Produces: selectable Line 4/6 dock and SVG controls; exact Seoul/Tokyo copy; `10 LINES` footer.

- [ ] **Step 1: Write failing UI tests**

```ts
expect(screen.getByText('어느 노선에서 시작할까요?')).toBeInTheDocument()
fireEvent.click(screen.getByRole('button',{name:'서울 4호선 선택'}))
expect(onSelect).toHaveBeenCalledWith('seoul-4')
fireEvent.click(screen.getByRole('button',{name:'도쿄'}))
expect(screen.getByText('どの路線から始めますか？')).toBeInTheDocument()
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/components/MapExplorer.test.tsx src/App.test.tsx`
Expected: FAIL on copy, new controls, and `10 LINES`.

- [ ] **Step 3: Reuse the existing dock/hit-path mapping**

Remove Lines 4/6 from `unsupported`, add them to `hitPaths`, replace the copy with the approved Korean/Japanese strings, and change the footer to `10 LINES`.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- --run src/components/MapExplorer.test.tsx src/App.test.tsx`
Expected: PASS.

```powershell
git add src/components/MapExplorer.tsx src/components/MapExplorer.test.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: expose lines 4 and 6 on the explorer"
```

### Task 3: Official map geometry and crisp responsive map

**Files:**
- Modify: `scripts/extract-supported-map-lines.mjs`
- Modify: `public/assets/seoul-supported-lines.svg` (generated)
- Create: `public/assets/seoul-metro-map-20250929@2x.webp` (generated)
- Modify: `src/components/MapExplorer.tsx`
- Modify: `src/styles.css`
- Test: `src/components/MapExplorer.test.tsx`

**Interfaces:**
- Consumes: bundled official PDF and `.artifacts/seoul-map.svg`.
- Produces: responsive high-resolution map source and exact SVG symbols `#seoul-4`, `#seoul-6`.

- [ ] **Step 1: Add failing geometry/source assertions**

```ts
expect(screen.getByRole('button',{name:'지도에서 서울 4호선 선택'}).querySelector('use')).toHaveAttribute('href',expect.stringContaining('#seoul-4'))
expect(screen.getByRole('img',{name:'서울 수도권 지하철 노선도'})).toHaveAttribute('srcSet',expect.stringContaining('@2x.webp'))
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/components/MapExplorer.test.tsx`
Expected: FAIL because the symbols and responsive source are absent.

- [ ] **Step 3: Generate only the needed assets**

Add the PDF stroke profiles for official Line 4 blue and Line 6 brown to the existing extractor, regenerate the SVG, then render one 10204px WebP from the PDF with ImageMagick quality 92. Use native `srcSet` so browsers select it only when resolution requires it; do not build a custom tile viewer.

- [ ] **Step 4: Add short native zoom feedback**

Use the existing active-line state and CSS `transform`/`transform-origin` transition only. Keep overflow within `.map-frame`, respect `prefers-reduced-motion`, and never couple it to game input.

- [ ] **Step 5: Run GREEN and commit**

Run: `npm test -- --run src/components/MapExplorer.test.tsx && npm run build`
Expected: PASS and production build succeeds.

```powershell
git add scripts/extract-supported-map-lines.mjs public/assets/seoul-supported-lines.svg public/assets/seoul-metro-map-20250929@2x.webp src/components/MapExplorer.tsx src/styles.css
git commit -m "feat: sharpen and extend the Seoul map"
```

### Task 4: Chime and louder bounded effects

**Files:**
- Modify: `src/audio/sounds.ts`
- Modify: `src/audio/sounds.test.ts`
- Modify: `src/components/MapExplorer.tsx`
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: header `sound` state.
- Produces: `playSound(kind, enabled)` with `SoundKind` including `select`; one selection chime per App mount.

- [ ] **Step 1: Write failing audio behavior tests**

```ts
expect(setGain).toHaveBeenCalledWith(0.135,0)
fireEvent.click(screen.getByRole('button',{name:'서울 1호선 선택'}))
fireEvent.click(screen.getByRole('button',{name:'← 노선 선택'}))
fireEvent.click(screen.getByRole('button',{name:'서울 2호선 선택'}))
expect(playSound).toHaveBeenCalledTimes(1)
expect(playSound).toHaveBeenCalledWith('select',true)
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/audio/sounds.test.ts src/App.test.tsx`
Expected: FAIL on gain and missing selection cue.

- [ ] **Step 3: Implement the minimum Web Audio change**

Set effect gain to `0.135`, add a short original two-note `select` cue, and pass every sound through a native dynamics compressor before `context.destination`. Keep the selection-once ref in `App`, where the mute state already lives.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm test -- --run src/audio/sounds.test.ts src/App.test.tsx`
Expected: PASS.

```powershell
git add src/audio/sounds.ts src/audio/sounds.test.ts src/App.tsx src/App.test.tsx src/components/MapExplorer.tsx
git commit -m "feat: polish MetroTyping audio"
```

### Task 5: Full verification and handoff

**Files:**
- Modify: `MDs/Workflow.md`

- [ ] **Step 1: Run the complete quality gate**

Run: `npm run check`
Expected: ESLint, client/server Vitest, strict TypeScript, and Vite build all PASS.

- [ ] **Step 2: Capture exact viewports**

Capture Seoul overview, Line 4 setup/game, Line 6 loop setup/game, and Tokyo overview at 360, 768, and 1440 CSS pixels. Confirm no page overflow, readable labels, aligned highlight geometry, at most eight gameplay stations, reduced motion, and mute.

- [ ] **Step 3: Update project memory and commit**

Record completed behavior, exact verification commands/results, visual findings, and any mistakes in `MDs/Workflow.md`.

```powershell
git add MDs/Workflow.md
git commit -m "docs: record lines 4 and 6 verification"
```

- [ ] **Step 4: Push and verify Pages**

Run: `git push origin main`, wait for the Pages workflow, then verify `https://qkqhsm1.github.io/MetroTyping/` and emitted JS/CSS/WebP/SVG assets return HTTP 200 with correct MIME types.

