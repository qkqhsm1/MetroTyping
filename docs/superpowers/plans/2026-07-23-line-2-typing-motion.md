# Line 2 Typing Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the existing correct lift/scale and error shake to Line 2 input characters only.

**Architecture:** Keep `Line2TypingField`'s existing `correct`, `wrong`, and `remaining` states. Extend CSS for those states, reuse `target-shake`, and disable transforms/animation under reduced motion.

**Tech Stack:** React 19, CSS, Vitest, Testing Library.

## Global Constraints

- No JavaScript animation state, dependencies, or motion on the reference sign, map, or train.
- Preserve Korean IME, rapid input, caret order, and fixed interaction geometry.

---

### Task 1: Input-only character motion

**Files:**
- Modify: `src/components/Line2TypingField.test.tsx`
- Modify: `src/styles.css`
- Modify: `MDs/Workflow.md`

- [ ] Add a failing test requiring the typing feedback wrapper to expose the Line 2 motion contract while retaining correct/wrong/remaining/caret order.
- [ ] Run `npm test -- --run src/components/Line2TypingField.test.tsx` and verify RED.
- [ ] Add the contract marker and CSS: correct characters use line color with lift/scale, wrong characters use `target-shake`, and remaining characters stay still.
- [ ] Add reduced-motion overrides that retain colors but remove transform and animation.
- [ ] Run focused tests and verify GREEN.
- [ ] Capture real feedback at 360, 768, and 1440 CSS pixels.
- [ ] Run `npm run check`, update workflow, commit, push `main`, and verify Pages assets.
