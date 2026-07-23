# Seoul Line 2 Morphing Tracker Design

## Scope

Apply this change only to ordered Seoul Line 2 gameplay. Other lines and timed random play keep their current presentation.

## Direction panel

Replace the Line 2 single-name typing target with a horizontal three-position panel:

- previous station on the left;
- current typing target in the centre and visually dominant;
- next station on the right.

Each populated position shows the station number inside a Line 2-coloured circle, its Korean name, and its smaller English name. A directional connector makes travel order explicit. At a route boundary, the unavailable previous or next position stays empty without inventing a station.

## Continuous movement

After a correct answer, animate the train from the completed station to the next station along the declared SVG route for approximately 220 ms. Pan the camera over the same interval with a slight follow delay so the train briefly leads and the next target settles exactly at the centre.

The map remains one persistent SVG world. Do not remount or cross-fade route segments. The train, route, station points, labels, and camera must share the same coordinate system.

Typing state never waits for animation. A rapid subsequent correct answer retargets the active motion from its current rendered position toward the newest logical target instead of queueing animations or snapping through intermediate frames. Logical scoring and prompts update immediately.

The direction panel slides to its new previous/current/next values during the same transition. Its centre value must always match the active typing target.

When `prefers-reduced-motion: reduce` is active, update the train, camera, and panel immediately.

## Verification

- Assert the initial panel and the panel after a correct Sindorim answer.
- Assert all populated panel stations include their official number and English name.
- Assert motion samples stay on the SVG route and end at the new station.
- Assert a second correct answer during motion retargets without blocking input.
- Assert reduced motion settles immediately.
- Inspect real renders at 360, 768, and 1440 CSS pixels.
