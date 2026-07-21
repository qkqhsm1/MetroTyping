# Map Line Highlight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the incorrect broad diagonal map hover with a precise, 1.2× route highlight and dim the other lines.

**Architecture:** Reuse `MapExplorer` and its single SVG overlay. Give each line a visible route stroke plus a separate transparent hit stroke, controlled by one active line id shared with the dock buttons.

**Tech Stack:** React, TypeScript, SVG, CSS, Vitest, Testing Library

## Global Constraints

- Keep the official map unchanged as the base layer.
- Use the map's 1600×1600 coordinate system for all route geometry.
- Visible highlight thickness is exactly 1.2× the normal overlay thickness.
- Do not add a dependency.

---

### Task 1: Shared highlight state

**Files:**
- Modify: `src/components/MapExplorer.test.tsx`
- Modify: `src/components/MapExplorer.tsx`

- [ ] Add a failing test that hovering the Seoul 2 dock button marks both the map and frame active.
- [ ] Run `npm test -- src/components/MapExplorer.test.tsx` and confirm the new assertion fails.
- [ ] Add one `activeLine` state and reuse it for pointer and focus events on map paths and dock buttons.
- [ ] Re-run the targeted test and confirm it passes.

### Task 2: Correct visual layers

**Files:**
- Modify: `src/components/MapExplorer.tsx`
- Modify: `src/styles.css`

- [ ] Replace each broad path with a narrow visible route path and an independent transparent hit path.
- [ ] Dim `.map-stage img` only while `activeLine` is present.
- [ ] Set the active visible stroke to 1.2× thickness and add a restrained glow; keep inactive overlays invisible.
- [ ] Capture the map and confirm no broad diagonal band appears.

### Task 3: Verification

**Files:**
- Modify: `MDs/Workflow.md`

- [ ] Run `npm run check`.
- [ ] Capture desktop and mobile map states and inspect route alignment.
- [ ] Record the verification result and any remaining coordinate uncertainty honestly.
