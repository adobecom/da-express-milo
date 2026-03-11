# Services

## `createColorBlindnessService.js`

Provides color-blindness simulation and conflict detection utilities used by shared color UI renderers and modals.

### Exports

- `TYPE_ORDER`: ordered defect keys used by UI (`deutan`, `protan`, `tritan`).
- `TYPE_LABELS`: display labels per defect type.
- `DEFECT_DEFINITIONS`: full text descriptions per defect type.
- `CONFLICT_THRESHOLD_DELTA_E`: default DeltaE threshold for conflict detection.
- `simulate(r, g, b, type)`: returns simulated RGB tuple for a defect type.
- `getConflictPairs(colors, type, threshold?)`: returns index pairs that conflict under simulation.
- `getConflictingIndices(pairs)`: flattens conflict pairs into a set of color indices.
- `simulateHex(hex, type)`: returns simulated hex color for a defect type.

### Inputs and assumptions

- Color inputs are expected as 6-digit hex (`#RRGGBB`) for hex-based APIs.
- Conflict detection compares simulated colors in Lab space using DeltaE 2000.
- `CONFLICT_THRESHOLD_DELTA_E` can be overridden via `getConflictPairs(..., threshold)`.

### Main consumers

- `renderers/createStripContainerRenderer.js`
- `modal/createColorBlindnessModalContent.js`
