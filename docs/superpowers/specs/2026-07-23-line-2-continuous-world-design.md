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

The current-target halo moves back and forth through the station centre only along the route normal at that exact path point. A horizontal route produces vertical motion; a vertical route produces horizontal motion; curved sections use their local tangent. The halo must not scale, rotate, orbit, or use a viewport-relative transform origin. Keep its amplitude between 12 and 16 SVG units and render it behind the train and station content. Reduced motion keeps it stationary.

## Direction panel

Keep the previous/current/next direction panel. Measure a bounded visual width for each station from its Korean and English names. Morph the current card's decorative shell from its rendered width to the newest station width during the same 320–520 ms travel transition.

- Korean and English station names always remain on one line.
- Long stations such as `동대문역사문화공원` receive a wider shell.
- Shorter names receive a narrower shell while remaining on the same fixed centre axis.
- When viewport width is insufficient, clamp the card to available width and reduce text size within readable limits.
- Station-number circles retain a fixed circular shape.
- On mobile, keep the current card centred and allow partial previous/next cards to indicate continuation instead of wrapping names.
- Panel motion uses the same target change as the map, but never delays the new typing target.

## Typing field

Place the typing field directly below the current station card. Its rounded decorative shell morphs to the same per-station target width as the card above. Repeat the current station's number inside a fixed pale-grey outlined circle so the typing surface visibly matches the card above.

Keep the actual native input, caret, feedback text, and combined number/name centre anchored inside one route-maximum interaction surface. Shell width changes must not move the caret, text baseline, focus box, or hit area. Animate only the decorative shells from their current rendered width to the latest target width; rapid answers retarget without queueing or blocking input.

Keep the native input as the focus, selection, keyboard, and Korean IME owner. Render a pointer-inert visual text layer aligned with the input:

- the complete target name appears grey before typing;
- correctly entered characters appear bold dark;
- an incorrect character appears red at its typed position;
- correct characters after an isolated substitution return to bold dark;
- untyped target characters remain grey;
- characters beyond the target length appear red.

The number circle remains pale grey and never participates in answer colouring. Only station-name characters change between grey, bold dark, and red.

Do not submit while IME composition is active. The visual layer may reflect the current composition value, but it must not replace native input state or caret behavior.

## Verification

- Assert all 43 stations remain mounted before, during, and after target changes.
- Assert station and train samples lie on the official SVG path by independent distance checks.
- Assert dense and sparse sections choose different bounded camera widths.
- Assert a rapid second answer retargets from an intermediate frame.
- Assert long Korean and English names render as single-line content.
- Assert the centre card and typing shell share each station's target width while the native input, caret surface, and text centre retain the same route-maximum bounds across targets.
- Assert empty, correct-prefix, isolated-wrong-character, remaining-target, and extra-character visual states.
- Assert Korean IME composition still blocks Enter submission.
- Assert the typing sign includes the current station number while only name characters receive answer-state colours.
- Assert the target halo transform endpoints are collinear with the route normal and symmetric around the station.
- Assert reduced motion settles immediately.
- Inspect real gameplay at 360, 768, and 1440 CSS pixels, including Sindorim, Gangnam, Sindaebang, and Dongdaemun History & Culture Park sections.
