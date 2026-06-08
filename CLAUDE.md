# Express

adobe.com/express — AEM Edge Delivery Services + Milo. Vanilla JS, Lit/Spectrum Web Components, CSS design tokens.

## Block Authoring Rules
- Never use `.innerHTML` — destroys Preact/Lit components; use `.append()` or `cloneNode`

## Express-Specific Utilities (non-obvious)
- Icons: `getIconElementDeprecated('adobe-express-logo')` — use deprecated helper for cross-express compatibility
- Cart CTAs: `formatDynamicCartLink(cta)` — always async-enhance dynamic cart links
- Branch tracking: `await trackBranchParameters([link])` — always await on CTAs

## Important Conventions
- No hardcoded text in blocks — all text (including a11y) must come from authored DOM content or placeholders via `replaceKey`/`replaceKeyArray`
- `scripts.js` loads on every page — changes require high scrutiny
- `color.adobe.com` shares this codebase; its blocks are: `color-blindness`, `color-contrast-checker`, `color-explore`, `color-extract`, `color-headline`, `color-wheel`; shared code in `/libs/color-components/` and `/scripts/color-shared/`

## Testing
- No real/staging URLs in test data — use mock HTML files or `sinon` stubs instead.
