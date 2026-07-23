# Line 2 Platform-Sign Direction Design

## Goal

Make the Line 2 direction panel read like a Seoul Metro platform sign while fixing the typing caret so it follows the visible typed text exactly.

## Approved presentation

- Keep the existing previous/current/next card sizes.
- Keep the current station as a white sign with a green border and green station-number ring.
- Invert the adjacent station cards: green background, white text, and white station-number ring.
- Join the three signs with a green route band behind them.
- Put a white arrow on the band toward the next station so travel direction is immediate.
- Preserve the existing partial adjacent-card view on mobile.

## Typing surface

- Keep the input sign visually paired with the current station sign.
- Keep the pale number and target text, bold black correct characters, and red incorrect characters.
- Render the caret in the same visible text flow as the feedback characters instead of relying on the transparent native input's centered caret.
- Retain the native input for Korean IME, keyboard input, accessibility, and submission.
- Do not let sign-width transitions move or block the interaction surface.

## Verification

- Add a regression test for the direction band's inverted adjacent cards and next-side arrow.
- Add a regression test that the visible caret sits after the entered feedback characters.
- Verify Korean IME Enter handling and rapid consecutive answers remain unchanged.
- Capture the real game at 360, 768, and 1440 CSS pixels.
- Run `npm run check`, push `main`, and verify the deployed JavaScript/CSS assets.
