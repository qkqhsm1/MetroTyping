# Seoul Line 2 Morphing Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a numbered previous/current/next direction panel and continuous, non-blocking train/camera movement to ordered Seoul Line 2 gameplay.

**Architecture:** Keep `Game` as the logical typing owner and extend the existing persistent `Line2TrackingMap` SVG. A tiny reusable motion helper interpolates route progress with `requestAnimationFrame`; the SVG derives both camera and train positions from that progress, while the direction panel derives directly from the current target index.

**Tech Stack:** React 19, TypeScript, native SVG, CSS, `requestAnimationFrame`, Vitest, Testing Library.

## Global Constraints

- Apply only to ordered Seoul Line 2 gameplay.
- Use no new dependency.
- Keep input and scoring independent from animation.
- Motion duration is 220 ms and rapid answers retarget from the rendered position.
- Reduced motion settles immediately.
- Previous/current/next values always match the selected route order.

---

### Task 1: Numbered direction panel

**Files:**
- Modify: `src/components/Game.tsx`
- Modify: `src/components/Game.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `LINE_2_BY_NAME: Map<string,Line2Station>` from `src/data/line2.ts`.
- Produces: Line 2-only `.line2-direction-panel` with `data-position="previous|current|next"`.

- [ ] **Step 1: Write the failing panel test**

Add a test that renders `['신도림','문래','영등포구청']`, asserts the initial centre is `신도림 / Sindorim / 234`, submits `신도림`, then asserts `신도림` is previous, `문래 / Mullae / 235` is current, and `영등포구청 / Yeongdeungpo-gu Office / 236` is next.

- [ ] **Step 2: Verify RED**

Run `npm test -- --run src/components/Game.test.tsx`.
Expected: FAIL because `.line2-direction-panel` does not exist.

- [ ] **Step 3: Add the minimal panel**

Import `LINE_2_BY_NAME`, derive:

```ts
const line2Direction=line2Tracking
  ? {previous:stations[index-1],current:stations[index],next:stations[index+1]}
  : undefined
```

Render the three fixed positions in place of the Line 2 single target heading. Each populated item contains `.line2-direction-number`, Korean name, and English name. Keep the textbox and `aria-label` unchanged.

- [ ] **Step 4: Style and verify GREEN**

Use a three-column grid on desktop, preserve the dominant centre column, and reduce side columns on narrow screens without horizontal overflow.

Run `npm test -- --run src/components/Game.test.tsx`.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Game.tsx src/components/Game.test.tsx src/styles.css
git commit -m "feat: show Line 2 travel direction panel"
```

### Task 2: Continuous SVG train and camera motion

**Files:**
- Modify: `src/components/Line2TrackingMap.tsx`
- Modify: `src/components/Line2TrackingMap.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `targetIndex:number`, ordered `stations:string[]`.
- Produces: `data-motion-progress`, persistent SVG camera coordinates, and train coordinates sampled from the same declared route.

- [ ] **Step 1: Write failing motion tests**

With fake timers and mocked `requestAnimationFrame`, rerender target index 0→1. Assert an intermediate frame differs from both endpoints, the final frame has `data-camera-station="문래"`, and the SVG node identity is unchanged. Rerender 1→2 before completion and assert the next frame advances from the intermediate rendered position rather than restarting at station 1.

- [ ] **Step 2: Verify RED**

Run `npm test -- --run src/components/Line2TrackingMap.test.tsx`.
Expected: FAIL because the current component snaps directly to the target.

- [ ] **Step 3: Implement minimal native motion**

Keep refs for rendered route progress, target progress, frame id, and previous timestamp. On `targetIndex` change, cancel the active frame and interpolate from the current rendered progress to the newest target over 220 ms with an ease-out cubic. Derive:

```ts
const trainPoint=pointAtProgress(renderedProgress)
const cameraProgress=from+(renderedProgress-from)*0.88
const cameraPoint=pointAtProgress(cameraProgress)
```

Use the camera point for `viewBox` and train point for the train transform. Cancel the frame on unmount. If reduced motion matches, set both immediately to the target.

- [ ] **Step 4: Verify rapid retargeting and reduced motion**

Run `npm test -- --run src/components/Line2TrackingMap.test.tsx`.
Expected: all motion, retarget, cleanup, and reduced-motion tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Line2TrackingMap.tsx src/components/Line2TrackingMap.test.tsx src/styles.css
git commit -m "feat: morph Line 2 train and tracking camera"
```

### Task 3: Integration, visual QA, and deployment

**Files:**
- Modify: `MDs/Workflow.md`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: verified and deployed ordered Line 2 gameplay.

- [ ] **Step 1: Run the full gate**

Run `npm run check`.
Expected: ESLint, all client/server tests, strict TypeScript, and production build PASS.

- [ ] **Step 2: Inspect responsive renders**

Capture ordered Line 2 gameplay at 360, 768, and 1440 CSS pixels before and after a correct answer. Confirm no clipping, the centre panel matches the typing target, all visible numbers are readable, and the train/camera transition remains one continuous SVG scene.

- [ ] **Step 3: Update project memory**

Move the feature to Done in `MDs/Workflow.md`, record exact test totals and visual evidence, and leave extension to other lines in Next.

- [ ] **Step 4: Commit and push**

```bash
git add MDs/Workflow.md
git commit -m "docs: record Line 2 morphing tracker verification"
git push origin main
```

- [ ] **Step 5: Verify Pages**

Wait for the matching GitHub Pages run to succeed, then confirm `/MetroTyping/` returns HTML and its referenced JS/CSS assets return the expected MIME types rather than the HTML fallback.
