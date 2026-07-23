# Seoul Line 2 Continuous World Design

## Scope

Replace the ordered Seoul Line 2 prototype's fixed station window and proportional station placement. Other lines and timed random play remain unchanged.

## Persistent SVG world

Mount the official Line 2 loop, all 43 station nodes, all labels, and the train once in one SVG coordinate system. Target changes must not add or remove stations. The viewport naturally clips distant stations; no station-count window controls visibility.

Place stations by measured arc length on the declared official SVG path, not by raw cubic-segment parameter. The train uses the same path-length coordinate, so its intermediate and final positions remain on the visible route.

## Camera and motion

After a correct answer, move the train continuously from its current rendered path length to the newest logical target. Duration scales from 320 to 520 ms according to screen distance. The camera follows with a softer easing and settles on the target.

Calculate camera zoom from local station density. Dense sections zoom in enough to separate labels; sparse sections zoom out enough to preserve route continuity. Clamp zoom to readable limits. Rapid answers retarget from the current rendered train and camera state without queuing, snapping, or blocking input.

Reduced motion settles immediately.

## Labels

Derive each label offset from the route tangent and alternate it across the route normal. Use measured label bounds to prevent overlap among labels, station-number circles, and the train. Keep every visible Korean and English label attached to its own station.

All 43 station nodes remain mounted even when labels outside the viewport are clipped.

## Direction panel

Keep the previous/current/next direction panel. At game start, measure the longest Korean and English station names in the selected route and choose one bounded centre-card width. Keep that outer width unchanged through arrival so target changes never make the layout pulse.

- Korean and English station names always remain on one line.
- Long stations such as `동대문역사문화공원` determine the stable centre-card width.
- Shorter names stay centred in the same card.
- When viewport width is insufficient, clamp the card to available width and reduce text size within readable limits.
- Station-number circles retain a fixed circular shape.
- On mobile, keep the current card centred and allow partial previous/next cards to indicate continuation instead of wrapping names.
- Panel motion uses the same target change as the map, but never delays the new typing target.

## Typing field

Place the typing field directly below the current station card and give it the same stable outer width. Do not show the station number inside the field. Increase its station-name text to visually match the centre card.

Keep the native input as the focus, selection, keyboard, and Korean IME owner. Render a pointer-inert visual text layer aligned with the input:

- the complete target name appears grey before typing;
- correctly entered characters appear bold dark;
- an incorrect character appears red at its typed position;
- correct characters after an isolated substitution return to bold dark;
- untyped target characters remain grey;
- characters beyond the target length appear red.

Do not submit while IME composition is active. The visual layer may reflect the current composition value, but it must not replace native input state or caret behavior.

## Verification

- Assert all 43 stations remain mounted before, during, and after target changes.
- Assert station and train samples lie on the official SVG path by independent distance checks.
- Assert dense and sparse sections choose different bounded camera widths.
- Assert a rapid second answer retargets from an intermediate frame.
- Assert long Korean and English names render as single-line content.
- Assert the centre card and typing field keep the same route-derived width across short and long targets.
- Assert empty, correct-prefix, isolated-wrong-character, remaining-target, and extra-character visual states.
- Assert Korean IME composition still blocks Enter submission.
- Assert reduced motion settles immediately.
- Inspect real gameplay at 360, 768, and 1440 CSS pixels, including Sindorim, Gangnam, Sindaebang, and Dongdaemun History & Culture Park sections.
