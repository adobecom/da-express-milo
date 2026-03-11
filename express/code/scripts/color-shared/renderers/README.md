# Color Shared Renderers

## Scope
This folder contains renderer helpers that build color-shared DOM structures and wire adapters/controllers.

## createStripContainerRenderer.js
- Builds strip-container variants backed by `<color-swatch-rail>`.
- Supports horizontal, stacked, vertical, two-row, and four-row layouts based on options.
- Can render color blindness rows (`Deuteranopia`, `Protanopia`, `Tritanopia`) and conflict summaries.
- Uses adapter/controller subscriptions to keep UI synced with rail state.

## createStripsRenderer.js
- Renders strips/palette content from data and config, including:
  - simple L/M/S card mode (`config.simpleSizeVariants`)
  - palette variant grid mode (`summary` or `compact`)
  - demo/review mode (`config.showDemoVariants`)
- Uses Spectrum icon loading (`loadIconsRail`) and wraps card content with Spectrum theme helpers.
- Initializes tooltip behavior for card action buttons and swatch rail controls.
- Implements keyboard navigation for palette grids:
  - card-level roving tabindex with arrow/Home/End keys
  - Enter/Space to enter action controls
  - Escape to return focus to the card
- Cleans up adapters/controllers and event listeners on destroy.

## Notes
- Renderer files intentionally keep in-file comments minimal; contract and behavior notes belong in this README.
