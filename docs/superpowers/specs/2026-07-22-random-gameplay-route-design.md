# Random Gameplay Route Design

## Goal

Make each eight-station gameplay segment visually varied and spacious without making station order or geographic direction ambiguous.

## Approved behavior

- Keep the existing maximum of eight visible stations.
- Generate a new route shape whenever gameplay advances to the next eight-station segment.
- Keep that generated shape stable for the lifetime of the segment; ordinary React renders and typing updates must not move it.
- Preserve the official map's relative travel direction. For example, Incheon remains west/left, Yeoncheon remains north/up, and Sinchang remains south/down.
- Randomize only the bends between geographic anchors. A path must not reverse through its station order, cross itself, or place a later station visually before an earlier one along the path.
- Enlarge the gameplay SVG area and its internal safe margins so stations and labels read clearly at 360, 768, and 1440 CSS-pixel viewport widths.

## Geometry

`routeGeometry` remains the single source of route topology. Line 1 receives explicit branch-aware source polylines for its northern trunk, Incheon leg, and Sinchang leg instead of one generic path. Other branch, loop, and service geometries retain their existing topology keys.

A small pure generator accepts the focused source path and a segment seed. It samples ordered base points, applies bounded perpendicular offsets to internal control points, and rejects a candidate if it self-intersects or violates minimum spacing. Endpoints remain tied to the source path, so randomness cannot swap geographic direction. A short bounded retry loop falls back to the unmodified focused path if no candidate passes.

`Game` creates one seed when `segmentStart` changes and passes it to `RouteMap`. The seed is not derived from typing progress, so rapid input and rerenders cannot reshape the current map. No dependency is added.

## Rendering and labels

The route, station markers, and train remain in one SVG `viewBox`. Station and train positions continue to use path-length sampling from the generated route.

The SVG receives more vertical room and larger internal margins. Labels use the existing short-name/wrapped-name rendering, but placement chooses among nearby above, below, left, and right candidates. The first non-overlapping candidate inside the safe area wins. The target label keeps its stronger line-colored treatment. Route drawing remains presentation-only and never blocks scoring or input.

## Verification

- RED/GREEN unit tests prove a new seed produces a different accepted shape and the same seed reproduces the same shape.
- Assert that segment endpoints preserve the source geographic direction, including Line 1 Incheon, Yeoncheon, and Sinchang trips.
- Assert station progress is strictly ordered, the path does not self-intersect, and every station and train sample remains on the declared SVG path.
- Assert no more than eight stations render and estimated label boxes do not overlap or leave the safe area.
- Keep rapid-input, IME, reduced-motion, and segment-transition tests passing.
- Capture and inspect representative Line 1 branch, Line 2 loop, and Incheon Line 2 segments at 360, 768, and 1440 CSS pixels.

## Scope

This change does not alter route data order, scoring, animation timing, overview-map artwork, setup controls, or Firebase behavior. It adds no new package and does not attempt geographic-scale accuracy; only official relative direction and topology are preserved.
