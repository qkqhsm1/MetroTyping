# Line 2 Balanced Platform Sign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved balanced continuous Line 2 platform sign, Korean-only target width, centered direction arrow, and centered SVG station numbers.

**Architecture:** Keep the current React station-order model and persistent Line 2 SVG. Replace the three-column stretching behavior with a fixed balanced assembly driven by one target-width variable; use layered CSS halves behind the current card and native SVG text centering for station numbers.

**Tech Stack:** React 19, TypeScript, CSS, SVG, Vitest, Testing Library.

## Global Constraints

- Do not add dependencies or block typing during width transitions.
- Keep scoring, Korean IME, train animation, and map geometry unchanged.
- Preserve current mobile clipping and reduced-motion behavior.

---

### Task 1: Korean-only station width

**Files:**
- Modify: `src/components/Game.test.tsx`
- Modify: `src/components/Game.tsx`

- [ ] Add a failing test proving two-character `교대` stays near 270px regardless of its long English name.
- [ ] Run `npm test -- --run src/components/Game.test.tsx` and verify RED.
- [ ] Replace English-dependent width calculation with Korean-character sizing and a 270px two-character baseline.
- [ ] Re-run the focused test and verify GREEN.

### Task 2: Balanced continuous direction assembly

**Files:**
- Modify: `src/components/Game.test.tsx`
- Modify: `src/components/Game.tsx`
- Modify: `src/styles.css`

- [ ] Add a failing structural test for dedicated previous/current/next content regions inside one balanced panel.
- [ ] Run the focused Game test and verify RED.
- [ ] Render two green half backgrounds with content centered in each exposed half, overlay the current sign, and anchor the arrow from the current sign's right face.
- [ ] Preserve the current responsive outer width and verify focused tests GREEN.

### Task 3: Center SVG station numbers

**Files:**
- Modify: `src/components/Line2TrackingMap.test.tsx`
- Modify: `src/components/Line2TrackingMap.tsx`

- [ ] Add a failing test requiring every station-number text to use its circle `y` and `dominant-baseline="middle"`.
- [ ] Run `npm test -- --run src/components/Line2TrackingMap.test.tsx` and verify RED.
- [ ] Remove `y + 4` and apply native SVG middle alignment.
- [ ] Re-run the focused test and verify GREEN.

### Task 4: Verify and release

**Files:**
- Modify: `MDs/Workflow.md`

- [ ] Capture real two-character gameplay at 360, 768, and 1440 CSS pixels.
- [ ] Confirm balanced exposed-side content, rounded current sign, centered arrow, matching input width, and centered SVG numbers.
- [ ] Run `npm run check`.
- [ ] Update project memory, commit, push `main`, verify Pages success, asset MIME types, and deployed feature markers.
