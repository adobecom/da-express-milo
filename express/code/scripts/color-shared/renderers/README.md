# Color-Shared Renderers

## `createStripContainerRenderer(options)`

Renders one or more strip rails using `color-swatch-rail` via the shared adapter layer.

### Relevant Config API

These keys are read from `options.config`:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `stripContainerOrientations` | `string[]` | `['horizontal', 'stacked', 'vertical']` | Orientation for each rendered strip rail. |
| `swatchFeatures` | `object\|string[]\|'all'` | `undefined` | Feature set passed to each rail. |
| `swatchVerticalMaxPerRow` | `number` | `undefined` | Vertical mode max items per row before wrapping. |
| `swatchHoverOnlyActions` | `string[]\|string` | `undefined` | Feature-name hover-only map for top-right action icons (`drag`, `lock`, `editTint`, `trash`). |
| `swatchHoverOnlyActionCount` | `number` | `undefined` | Fallback count mode when `swatchHoverOnlyActions` is not provided. |
| `colorBlindness` | `boolean` | `false` | Enables color-blindness strip variants and enforced core feature behavior. |

### Hover-Only Precedence

1. If `swatchHoverOnlyActions` is present, feature-name mapping is used.
2. Else if `swatchHoverOnlyActionCount` is present, first `N` eligible top-right actions are hover-only.
3. Else no hover-only behavior is applied.

### Example

```js
const renderer = createStripContainerRenderer({
  config: {
    stripContainerOrientations: ['horizontal', 'stacked', 'vertical'],
    swatchFeatures: ['copy', 'lock', 'drag', 'editTint', 'trash', 'baseColor'],
    swatchHoverOnlyActions: ['drag', 'lock', 'editTint'],
  },
});
```
