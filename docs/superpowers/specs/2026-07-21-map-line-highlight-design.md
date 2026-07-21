# Map Line Highlight Design

## Approved interaction

- Remove every broad diagonal approximation currently visible on hover.
- Hovering or keyboard-focusing a supported line highlights the real route in its official color at 1.2× its normal visual thickness.
- While a line is highlighted, the underlying full map becomes slightly darker so the selected route reads clearly.
- The corresponding dock button and map route share one hover/focus state.
- Clicking keeps the highlight briefly before entering route setup.
- Unsupported lines retain the construction notice and never receive a false route highlight.

## Implementation

Keep the existing official raster as the base. Replace broad hit paths with route-aligned SVG paths in the same 1600×1600 coordinate system. Separate the wide invisible pointer stroke from the narrow visible highlight stroke, so accessibility does not distort the drawing. CSS owns the dimming and 1.2× thickness transition; React owns only the active line id.

## Verification

Component tests cover linked map/dock hover state, focus state, and selection. Visual captures verify that no diagonal band crosses unrelated stations and that the highlighted route follows the map at desktop and mobile sizes.
