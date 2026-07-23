# Line 2 Invalid Enter Shake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retrigger a complete Line 2 typing-sign shake on every incorrect Enter without disturbing the native input.

**Architecture:** Pass the existing error counter to `Line2TypingField`, key only a new visual wrapper with that attempt value, and keep the controlled input outside the remounted wrapper.

**Tech Stack:** React 19, CSS, Vitest, Testing Library.

## Global Constraints

- Preserve native input identity, value, focus, Korean IME, and rapid typing.
- Do not animate the reference sign, map, camera, or train.

### Task 1: Repeated invalid-Enter feedback

**Files:**
- Modify: `src/components/Game.test.tsx`
- Modify: `src/components/Game.tsx`
- Modify: `src/components/Line2TypingField.tsx`
- Modify: `src/styles.css`
- Modify: `MDs/Workflow.md`

- [ ] Add a failing test that presses invalid Enter twice, expects visual attempt `1` then `2`, the same input node, and unchanged value.
- [ ] Run the focused test and verify RED.
- [ ] Pass `errors` as `errorAttempt`, wrap only visual sign layers in a keyed wrapper, and animate it on positive attempts.
- [ ] Add a reduced-motion red flash without translation.
- [ ] Run focused tests and verify GREEN.
- [ ] Capture 360/768/1440 and reduced-motion evidence.
- [ ] Run `npm run check`, update Workflow, commit, push `main`, and verify Pages assets.
