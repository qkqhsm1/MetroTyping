# MetroTyping Project Agreement

## Product invariants

- Treat `https://github.com/qkqhsm1/MetroTyping` and its `main` branch as the canonical repository for all future work.
- Support Seoul Lines 1–9, Suin·Bundang, Incheon Lines 1 and 2, AREX, and JR Yamanote.
- Keep Line 5's Gangdong branch, Line 6's directed Eungam loop, and Line 9's local/express station sets explicit and independently tested.
- Keep station order, branches, directions, labels, and line colors traceable to official operator sources.
- Render each route, stations, and train in one SVG `viewBox`; never position the train with unrelated CSS pixel coordinates.
- Derive train position with SVG path-length sampling and verify station/path alignment numerically before visual approval.
- Keep scoring/input state independent from train animation state. Typing must never wait for animation.
- Keep the train on the last completed station; present the next station as a separate typing target and advance the train only after a correct submission.
- Ask the player to type the selected departure station first; never silently count it as completed.
- Show at most eight route stations at once and swap focused segments without blocking input; never compress a long route into one unreadable gameplay SVG.
- Show the Seoul overview as one large full-width source image without desktop-internal scrollbars; keep the raster static and animate only lightweight dimming and SVG highlight layers.
- Calculate Korean typing speed from Unicode Hangul jaso entered after the first input, not completed syllable count or time spent waiting before typing.
- Treat Korean IME composition correctly and never submit while composition is active.
- Preserve practice play when Firebase is unavailable; ranked play requires a verified server connection.
- Never trust client-submitted rank results without server validation.

## Verification invariants

- Test station order and route calculation for every terminus, branch, and circular direction.
- Keep Seoul Line 3 and Suin·Bundang service termini synchronized with current Seoul Metro and Korail timetable material.
- Assert that station points and train motion remain on the declared SVG path.
- Capture and inspect route renders at 360, 768, and 1440 CSS-pixel viewport widths before completion.
- Verify Pages preview assets by MIME/content and rendered DOM under `/MetroTyping/`; HTTP 200 alone may be an HTML fallback.
- Test rapid consecutive correct inputs, Korean IME Enter handling, reduced motion, audio mute, and mobile layout.
- Use official railway sources again immediately before freezing route data.
