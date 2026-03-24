# Color Shared Components

## `createLoadingScreenComponent` contract and API

Shared skeleton loader used by color surfaces (for example, Color Explore) while data and cards are still loading.

The component is intentionally split into:
- Shared ownership: skeleton structure, shimmer visuals, card count API, show/hide lifecycle.
- Consumer ownership: responsive layout strategy (columns, spacing, breakpoint behavior) so each block can match its own card grid contract.

## API

**Import**

```js
import { createLoadingScreenComponent } from './createLoadingScreenComponent.js';
```

**Factory**

```js
const loading = createLoadingScreenComponent({
  variant: 'palettes',
  cardCount: 24,
});
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `variant` | `string` | `'gradients'` | Sets `data-variant` on the root for consumer-specific styling hooks. |
| `cardCount` | `number` | `6` | Number of skeleton cards to render in the loading grid. |

### Return object

| Member | Type | Description |
|---|---|---|
| `element` | `HTMLElement` | Root loading node to append in the consumer block. |
| `setVariant(nextVariant)` | `function` | Updates `data-variant` on the root element. |
| `setCardCount(nextCount)` | `function` | Rebuilds skeleton cards to match the requested count. |
| `show()` | `function` | Sets visible loading state while keeping placeholders hidden from assistive tech (`aria-hidden="true"`, `display: block`). |
| `hide()` | `function` | Sets hidden loading state (`aria-hidden="true"`, `display: none`, `hidden`). |

## DOM contract

The component renders this stable structure:

```html
<div class="ax-color-loading" aria-hidden="true" data-variant="...">
  <div class="ax-color-loading__grid">
    <div class="ax-color-loading-card">...</div>
    ...
  </div>
</div>
```

Card internals use:
- `.ax-color-loading-card__visual`
- `.ax-color-loading-card__meta`
- `.ax-color-loading-card__text`
- `.ax-color-loading-card__icon`
- `.ax-color-loading-shimmer`

These class names are the styling hooks consumers can rely on.

## Consumer layout contract

Consumers should decide how loader cards map to their real card grid, including breakpoints and columns.

Recommended pattern:
- Use the same breakpoint model as the real grid (for example 1/2/3 columns).
- Compute `cardCount` from the consumer’s paging/visible-card rules.
- Keep layout rules in the consumer surface CSS so another block can choose a different grid behavior.

Current default behavior in shared styles:
- Shared styles handle only card skeleton visuals.
- Consumers are responsible for `grid-template-columns` and breakpoint behavior.

Example consumer override:

```css
.my-block .ax-color-loading__grid {
  grid-template-columns: 1fr;
}

@media (min-width: 600px) {
  .my-block .ax-color-loading__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1200px) {
  .my-block .ax-color-loading__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Accessibility and semantics

- The loader is decorative and non-interactive.
- `aria-hidden` is toggled via `show()`/`hide()` so assistive tech does not treat placeholders as content.
- Skeleton items do not expose interactive controls.

## Notes

- The component loads a shared stylesheet from `createLoadingScreenComponent.css`.
