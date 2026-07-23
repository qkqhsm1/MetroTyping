# Line 2 Invalid Enter Shake Design

## Goal

Give an unmistakable response every time the player presses Enter with an incorrect Line 2 answer.

## Behavior

- Each invalid Enter shakes the complete visible typing sign once, including its shell, station number, typed characters, remaining target, and visible caret.
- Repeated Enter presses with the same unchanged incorrect value retrigger the shake every time.
- Immediate per-character feedback remains unchanged: correct characters pop in the line color and incorrect characters shake in red while typing.
- The native input, value, caret position, Korean IME state, and focus are preserved during the sign shake.
- The reference sign, direction band, map, halo, camera, and train do not react to invalid Enter.
- Reduced motion replaces displacement with a brief red border/halo flash.

## Implementation constraint

- Reuse the existing error-attempt counter as the animation identity.
- Remount only a pointer-inert visual wrapper; never remount the controlled native input.
- Add no timer state, JavaScript animation library, or dependency.

## Verification

- Assert two consecutive invalid Enter presses increment the visual attempt identity twice without replacing the native input.
- Assert the input value remains unchanged after invalid Enter.
- Verify Korean IME Enter is still ignored while composition is active.
- Verify reduced motion, 360/768/1440 layouts, the full quality gate, and deployed Pages assets.
