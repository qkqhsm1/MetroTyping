# Line 2 Balanced Platform Sign Design

## Goal

Make the Line 2 direction display read as one continuous platform sign at every station-name length, while correcting width, arrow, and SVG station-number alignment defects.

## Approved geometry

- Render one continuous green background across the full direction assembly.
- Overlay the white current-station sign at the horizontal center.
- The green background continues behind the current sign, so no seam or empty connector can appear.
- Center previous-station content between the assembly's left edge and the current sign's left face.
- Center next-station content between the current sign's right face and the assembly's right edge.
- Preserve the existing adjacent-card height and outer rounded ends.
- Round the current sign to half its height, matching the pill-like operator references.
- Keep the direction assembly within the existing responsive viewport; mobile continues to expose only the useful adjacent portions.

## Station-dependent width

- Calculate current-sign and input-shell width from the Korean station name only.
- A two-character station uses approximately 270 CSS pixels on desktop.
- Increase width only as Korean character count requires.
- English names never enlarge the current sign; long English text scales down within the available width.
- The input shell always uses the same target width as the current sign, while its native interaction surface remains stable for rapid typing.

## Direction arrow

- Place one white arrow on the next-station side.
- Center it within the visible connector area immediately outside the current sign's right face.
- Do not position the arrow from the next card's arbitrary negative offset.

## SVG station numbers

- Center every Line 2 map station number using SVG text anchoring and `dominant-baseline="middle"`.
- Use the station circle's exact `x` and `y`; remove manual `y + 4` font compensation.
- Keep train/path/station geometry unchanged.

## Verification

- Add RED/GREEN tests for Korean-only target width, balanced direction geometry markers, and centered SVG station-number attributes.
- Preserve Korean IME, rapid input, reduced motion, and typing-caret behavior.
- Capture real gameplay at 360, 768, and 1440 CSS pixels, including a two-character current station.
- Run `npm run check`, push `main`, and verify the deployed Pages assets and rendered DOM.
