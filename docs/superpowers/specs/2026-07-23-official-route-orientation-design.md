# Official Route Orientation Design

## Goal

Gameplay route segments must preserve each station's relative position and travel direction from the official route map while retaining varied, seeded route curves.

## Behavior

- A station that is left, right, above, or below another station on the official map keeps that relative position in gameplay.
- Reversing a trip reverses train movement along the same fixed map orientation; it does not mirror the map.
- Examples:
  - Line 7 trips starting at Seoknam begin on the left when the destination is map-east of Seoknam.
  - Line 4 trips starting at Oido begin on the left when the destination is map-east of Oido.
  - Suin-Bundang Oido to Handae-ap begins on the left; Handae-ap to Incheon begins on the right.
  - Incheon Line 2 Gajaeul to Geomdan Oryu moves generally upward.
- Each focused window still receives a deterministic random curve. Randomization may vary intermediate bends but must not swap the fixed endpoints, reverse the dominant map direction, reorder stations, self-intersect, or move stations off the route.

## Implementation

Keep canonical gameplay geometry for each line topology (including branches and directed loops) in official-map orientation. Route direction selects which way the train traverses that geometry. Focused-window extraction samples the canonical geometry using station indices from the official sequence; it must not mirror endpoints for readability. The existing seeded randomizer may perturb only the interior route shape while preserving the sampled start and end relationship.

No line-specific rendering exceptions will be added. Line-specific data is limited to the canonical official-map geometry already owned by `routeGeometry.ts`.

## Verification

- Add direction tests for both directions of every supported bidirectional line, plus each valid circular, branch, and directed-loop direction.
- Cover the reported cases: Line 7 Seoknam, Line 4 Oido, Suin-Bundang Oido/Handae-ap/Incheon, and vertical Incheon Line 2 travel.
- Assert station order, endpoint-relative direction, route/station alignment, and non-self-intersection after randomization.
- Render and inspect representative routes at 360, 768, and 1440 CSS-pixel widths.
- Run `npm run check`.
