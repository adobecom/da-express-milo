# contrast-checker/renderers

Renderer implementations wired together by `factory/createContrastRenderer.js`.

---

## createCheckerRenderer

```js
import { createCheckerRenderer } from './createCheckerRenderer.js';

const renderer = createCheckerRenderer({
  container,           // HTMLElement to mount into
  config,              // block config (variant, foreground, background, …)
  dataService,         // createContrastDataService() instance
  actionMenu,          // optional action-menu factory
  strings,             // optional placeholder overrides
});

renderer.render();
renderer.on('contrast-change', (detail) => { … });
renderer.destroy();
```

Builds the full checker UI: color inputs, ratio bar with tint slider, WCAG summary table, Suggestions and Set-Ratio tabs, and an optional preview panel. Delegates leaf components to `components/`.

---

## createPreviewRenderer

```js
import { createPreviewRenderer } from './createPreviewRenderer.js';

const { render, destroy, highlightRegion } = createPreviewRenderer({
  container,   // HTMLElement to mount the preview panel into
  strings,     // optional placeholder overrides
});
```

Renders the live text-on-background preview panel. `highlightRegion(region)` highlights a specific WCAG category region (normal text, large text, UI components).

---

## components/

See [components/README.md](components/README.md) for `createColorInput`, `createSetRatioTab`, `createSuggestionsTab`, and `createSuggestionCard`.
