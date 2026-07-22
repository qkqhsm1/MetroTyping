# Suin–Bundang Quick Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limit Suin–Bundang quick travel to four approved station pairs while preserving both directions and custom station selection.

**Architecture:** Add an optional pair allowlist to the existing `Line` record. Reuse `getQuickRoutePairs()` and `getRoute()`; lines without an allowlist keep the current all-termini combination behavior.

**Tech Stack:** TypeScript, Vitest, existing React/Vite application

## Global Constraints

- Show only `인천↔오이도`, `인천↔왕십리`, `죽전↔고색`, and `인천↔청량리` for Suin–Bundang quick travel.
- Each card keeps both direction buttons.
- Preserve custom station selection and every other line's quick routes.
- Add no dependency, UI special case, or second route model.

---

### Task 1: Restrict Suin–Bundang Quick Routes

**Files:**
- Modify: `src/data/lines.ts`
- Modify: `src/game/routes.ts`
- Modify: `src/game/routes.test.ts`
- Modify: `MDs/Workflow.md`

**Interfaces:**
- Adds `Line.quickRoutePairs?: readonly (readonly [string, string])[]`.
- Keeps `getQuickRoutePairs(lineId: string): QuickRoutePair[]` unchanged.

- [x] **Step 1: Write the failing regression test**

```ts
expect(getQuickRoutePairs('suin-bundang').map(pair => pair.routes[0].from + ':' + pair.routes[0].to)).toEqual([
  '인천:오이도',
  '인천:왕십리',
  '죽전:고색',
  '인천:청량리',
])
for (const pair of getQuickRoutePairs('suin-bundang')) {
  expect(pair.routes[1].from).toBe(pair.routes[0].to)
  expect(pair.routes[1].to).toBe(pair.routes[0].from)
}
expect(getQuickRoutePairs('seoul-1')).toHaveLength(3)
```

- [x] **Step 2: Verify RED**

Run: `npm test -- --run src/game/routes.test.ts`

Expected: FAIL because Suin–Bundang currently produces all 15 terminus combinations.

- [x] **Step 3: Add the minimal data override**

Extend `Line` with `quickRoutePairs`. Set the Suin–Bundang record to:

```ts
quickRoutePairs: [
  ['인천', '오이도'],
  ['인천', '왕십리'],
  ['죽전', '고색'],
  ['인천', '청량리'],
]
```

In `getQuickRoutePairs()`, use `line.quickRoutePairs` when present; otherwise derive the existing `i < j` combinations from `serviceTermini`. Pass every chosen pair through the existing route building, validation, de-duplication, and reverse-direction logic.

- [x] **Step 4: Verify GREEN and full gate**

Run: `npm test -- --run src/game/routes.test.ts`

Expected: PASS.

Run: `npm run check`

Expected: lint, 48 client tests, 2 server tests, strict TypeScript, and Vite build PASS.

- [x] **Step 5: Record and commit**

Update `MDs/Workflow.md` with the four-card decision and verification, then commit the plan and implementation together. Push only because the user explicitly requested the deployed site to remain current.
