# contrast-checker/renderers/components

Leaf UI components used by `createCheckerRenderer`. Each factory returns an object with an `element` property (the DOM node to mount) plus lifecycle methods.

---

## createColorInput

```js
import { createColorInput } from './createColorInput.js';

const { element, getValue, setValue, destroy } = createColorInput({
  label,          // string — visible label text; also drives the input's id/for pair
  ariaLabel,      // string — aria-label when no visible label is used
  value,          // string — initial hex color, default '#FFFFFF'
  onInput,        // ({ value }) => void — fires on every color-edit change
  onChange,       // ({ value }) => void — fires on editor close if value changed
});
```

Opens a `color-edit` popover (desktop: `sp-overlay`; mobile: full-screen) on click or Enter/Space. The hex field auto-focuses on desktop only. Cleans up the overlay and all listeners on `destroy()`.

---

## createSetRatioTab

```js
import createSetRatioTab from './createSetRatioTab.js';

const { element, update, destroy } = createSetRatioTab({
  dataService,             // contrast data service instance
  recommendationService,   // recommendation service instance
  onApply,                 // ({ foreground, background }) => void
  strings,                 // optional placeholder overrides
});
```

Renders the "Set Ratio" tab: a ratio input, a preview of candidate color pairs, and an Apply button.

---

## createSuggestionsTab

```js
import createSuggestionsTab from './createSuggestionsTab.js';

const { element, update, destroy, onVisible } = createSuggestionsTab({
  recommendationService,  // recommendation service instance
  onApply,                // ({ foreground, background }) => void
  strings,                // optional placeholder overrides
});
```

Renders the "Suggestions" tab: a carousel of `createSuggestionCard` instances. Call `update(fg, bg, results)` when colors change; call `onVisible()` when the tab becomes active to trigger lazy loading.

---

## createSuggestionCard

```js
import createSuggestionCard from './createSuggestionCard.js';

const { element, destroy } = createSuggestionCard({
  suggestion,  // { fg, bg, ratio } — a single color-pair recommendation
  onApply,     // ({ foreground, background }) => void
  strings,     // optional placeholder overrides
});
```

Single card showing a color-pair preview bar, ratio badge, and an Apply button.
