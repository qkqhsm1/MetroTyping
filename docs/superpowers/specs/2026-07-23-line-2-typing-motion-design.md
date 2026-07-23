# Line 2 Typing Motion Design

## Goal

Bring the useful per-character feedback from the other lines into the Line 2 typing sign without moving the reference sign, map, or train.

## Approved behavior

- Apply motion only to characters inside the Line 2 input feedback layer.
- A correct entered character changes to the active line color, lifts slightly, and scales up subtly.
- An incorrect entered character turns red and performs the existing short horizontal shake.
- Untyped target characters remain still and grey.
- The visible caret remains immediately after the entered prefix.
- The current-station sign above, direction band, map, halo, and train receive no new typing motion.

## Interaction constraints

- Character feedback must be immediate and must not wait for train or camera animation.
- Rapid typing and Korean IME composition must not remount the input or move its interaction surface.
- Reduced-motion mode keeps color feedback but removes translation, scale, and shake.
- Reuse the existing `target-shake` keyframes and native CSS transitions; add no JavaScript animation state or dependency.

## Verification

- Add tests proving correct, wrong, remaining, and caret states retain distinct classes in input order.
- Confirm the correct class uses line-color motion and wrong class uses `target-shake`.
- Verify rapid consecutive answers, Korean IME Enter handling, and reduced motion.
- Capture Line 2 typing feedback at 360, 768, and 1440 CSS pixels.
- Run `npm run check`, push `main`, and verify the deployed Pages assets.
