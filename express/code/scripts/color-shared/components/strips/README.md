# Strips Components README

## Scope
This folder contains strip-related shared UI styles and defaults used by color palette and explore surfaces.

## Main files
- `color-strip.css`  
  Shared strip, summary card, and explore palette layout styles.
- `stripContainerDefaults.js`  
  Shared defaults for strip container sizing, spacing, and behavior.
- Generated token override stylesheet (optional)  
  Used for local verification only.

## Usage
- Consumers should rely on `color-strip.css` classes and CSS variables already wired to `express/code/styles/styles.css`.
- Keep component-specific behavior in this folder; block-level composition belongs in block code (for example `blocks/color-explore`).
- `color-strip.css` covers summary strips, compact/full-width strip layouts, stacked/vertical/two-row/four-row rails, and strip-container color-blindness layouts.

## Strip Container Defaults
- The strip container options are defined in `stripContainerDefaults.js`.
- Defaults:
  - `orientation: 'horizontal'`
  - `state: 'default'`
  - `theme: 'light'` (`light | dark | all`)
  - Visibility/behavior flags for hover, lock, drag, color blindness, edit, and add controls
  - `label` default format is hex (for example `#FF7500`)

## Conventions
- No design-tool IDs or tool-specific naming in docs.
- Keep implementation details concise and code-focused.
- Update this `README.md` when strip contracts or defaults change.
