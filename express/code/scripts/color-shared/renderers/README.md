# Color Shared Renderers

## Scope
This folder contains renderer helpers that build color-shared DOM structures and wire adapters/controllers.

## createStripContainerRenderer.js
- Builds strip-container variants backed by `<color-swatch-rail>`.
- Supports horizontal, stacked, vertical, two-row, and four-row layouts based on options.
- Can render color blindness rows (`Deuteranopia`, `Protanopia`, `Tritanopia`) and conflict summaries.
- Uses adapter/controller subscriptions to keep UI synced with rail state.

## Notes
- Renderer files intentionally keep in-file comments minimal; contract and behavior notes belong in this README.

