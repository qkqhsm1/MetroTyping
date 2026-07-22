# Sound Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make MetroTyping effects clearly audible without changing sound event behavior.

**Architecture:** Keep the existing Web Audio oscillator implementation and adjust only its tested synthesis constants.

**Tech Stack:** TypeScript, Web Audio API, Vitest

## Global Constraints

- Gain is exactly `0.09`.
- Key sound is exactly `520Hz` and `triangle`.
- Correct/error/complete frequencies, 80ms decay, mute, and context cleanup remain unchanged.
- Add no dependency or audio asset.

---

### Task 1: Tune and Verify Sound Synthesis

**Files:**
- Modify: `src/audio/sounds.test.ts`
- Modify: `src/audio/sounds.ts`
- Modify: `MDs/Workflow.md`

- [x] **Step 1: Extend the test to assert frequencies, waveforms, gain, and decay.**

Capture oscillator `{ frequency, type }`, initial gain calls, ramp calls, and stop times. Assert:

```ts
expect(tones).toEqual([
  { frequency: 520, type: 'triangle' },
  { frequency: 660, type: 'sine' },
  { frequency: 125, type: 'sawtooth' },
  { frequency: 880, type: 'sine' },
])
expect(setGain).toHaveBeenCalledWith(0.09, 0)
expect(rampGain).toHaveBeenCalledWith(0.0001, 0.08)
```
- [x] **Step 2: Run `npm test -- --run src/audio/sounds.test.ts` and confirm RED for the old key tone/gain.**
- [x] **Step 3: Change only the key frequency/type and gain constants.**

```ts
const frequencies: Record<SoundKind, number> = { key: 520, correct: 660, error: 125, complete: 880 }
oscillator.type = kind === 'error' ? 'sawtooth' : kind === 'key' ? 'triangle' : 'sine'
gain.gain.setValueAtTime(0.09, context.currentTime)
```
- [x] **Step 4: Run the focused test and `npm run check`; both must pass.**
- [x] **Step 5: Record verification, commit, push, and confirm GitHub Pages serves the new bundle.**
