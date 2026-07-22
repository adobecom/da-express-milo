# Color Explore Helpers

## `parseConfig.js`

`parseBlockConfig(rows, defaults)` converts block table rows into a normalized config object.

Behavior:
- Starts from `defaults`
- Reads two-cell rows (`key`, `value`)
- Normalizes keys by lowercasing and removing spaces
- Applies supported keys:
  - `variant`
  - `initialLoad`
  - `loadMoreIncrement`
  - `maxItems`
  - `swatchVerticalMaxPerRow` / `verticalMaxPerRow` (clamped to `1..10`)
  - `enableFilters`
  - `enableSearch`
  - `review` / `showReviewSection`
  - `enableGradientEditor`
  - `enableSizesDemo`

Unsupported keys are ignored.

## Focus Utility (Swatches)

Swatches focus-group navigation uses `getFirstFocusableInGroup()` from
`express/code/libs/color-components/utils/util.js`.

Behavior:
- Finds the first focusable match inside a container
- Skips `.edit-input-native` by default
- Falls back to the first matched element if all are skipped
