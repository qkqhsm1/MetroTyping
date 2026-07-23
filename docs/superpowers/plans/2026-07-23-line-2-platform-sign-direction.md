# Line 2 Platform-Sign Direction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the previous/current/next Line 2 signs as one directional platform sign and place the typing caret immediately after the visible entered text.

**Architecture:** Reuse the existing three-card direction panel and native controlled input. CSS supplies the route band, inverted side cards, and arrow; the feedback layer supplies a dedicated visible caret while the native caret is made transparent.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library.

## Global Constraints

- Keep current card sizes and the existing mobile partial-card treatment.
- Keep Korean IME and scoring independent from presentation animation.
- Add no dependencies or new component abstraction.

---

### Task 1: Visible typing caret

**Files:**
- Modify: `src/components/Line2TypingField.test.tsx`
- Modify: `src/components/Line2TypingField.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: existing `value`, normalized target characters, and native controlled input.
- Produces: `.line2-typing-caret` after all entered characters in `.line2-typing-feedback`.

- [ ] **Step 1: Write the failing test**

Assert `.line2-typing-caret` is the feedback child immediately after the final entered character and is absent from the target's untyped suffix.

- [ ] **Step 2: Run the focused test to verify RED**

Run: `npm test -- --run src/components/Line2TypingField.test.tsx`
Expected: FAIL because `.line2-typing-caret` does not exist.

- [ ] **Step 3: Implement the minimal caret**

Render the caret between entered and remaining character runs. Set the native input's `caret-color` to transparent and animate only the visible caret.

- [ ] **Step 4: Run the focused test to verify GREEN**

Run: `npm test -- --run src/components/Line2TypingField.test.tsx`
Expected: all tests pass.

### Task 2: Connected directional platform sign

**Files:**
- Modify: `src/components/Game.test.tsx`
- Modify: `src/components/Game.tsx`
- Modify: `src/styles.css`
- Modify: `MDs/Workflow.md`

**Interfaces:**
- Consumes: existing `previous`, `current`, and `next` station order.
- Produces: `data-travel-side="next"` on the panel, inverted non-current cards, one green band, and a white next-side arrow.

- [ ] **Step 1: Write the failing test**

Assert the direction panel declares the next side and that the previous/next nodes retain their semantic positions.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `npm test -- --run src/components/Game.test.tsx`
Expected: FAIL because the travel-side marker is absent.

- [ ] **Step 3: Implement the connected sign**

Add the travel-side marker in `Game.tsx`. Use pseudo-elements on the existing panel for the green band and next-side arrow; invert only non-current card colors while preserving dimensions and responsive clipping.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `npm test -- --run src/components/Game.test.tsx src/components/Line2TypingField.test.tsx`
Expected: all focused tests pass.

- [ ] **Step 5: Verify and release**

Capture the live component at 360, 768, and 1440 CSS pixels, run `npm run check`, update `MDs/Workflow.md`, commit, push `main`, and verify the Pages bundle MIME and feature markers.
