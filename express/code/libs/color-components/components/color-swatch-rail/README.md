# Color Swatch Rail

## Scope
`color-swatch-rail` is the Lit rail used by color-shared palette UIs.

## Contract
- Max swatches: `10` (default), `12` for `two-rows`, `20` for `four-rows`.
- Orientations: `horizontal`, `vertical`, `stacked`, `two-rows`, `four-rows`.
- State source: `controller` with `subscribe`, `getState`, and `setState`.
- Rail state shape: `{ swatches: [{ hex }], baseColorIndex }`.
- Vertical color-wheel layout (`orientation='vertical'` + `verticalMaxPerRow=6`) keeps one row through 6 swatches, then uses balanced two-row layout (`7/8 => 4+3/4`, `9/10 => 5+4/5`) with odd-count add-slot placeholder support.

## Features
- Supported feature flags: `copy`, `colorPicker`, `lock`, `hexCode`, `trash`, `drag`, `addLeft`, `addRight`, `editTint`, `colorBlindness`, `baseColor`, `emptyStrip`, `editColorDisabled`.
- `swatchFeatures` accepts object, string array, or `'all'`.
- `hoverOnlyActions` (attr: `hover-only-actions`) accepts a comma/space-separated list of feature names for hover-only top-right actions: `drag`, `lock`, `editTint`, `trash`.
- `hoverOnlyActionCount` (attr: `hover-only-action-count`) remains available as fallback and hides the first `N` top-right action icons when `hoverOnlyActions` is not provided.
- In vertical/stacked layouts, color blindness control is auto-enabled unless explicitly disabled.

## Interaction
- Keyboard: column-first navigation with roving focus for in-column actions.
- Drag and drop: desktop pointer DnD and touch fallback reordering.
- Base color toggle can lock the active base swatch.
