# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For deeper guidance on specific topics (performance, block patterns, testing, CSS standards, code review, etc.), refer to the specialized rules in `.cursor/rules/`. Each `.mdc` file covers a distinct area of this project's standards and best practices.

## Project Overview

Official repo for `adobe.com/express`, built on **AEM Edge Delivery Services (AEM EDS)** — a Franklin/Helix architecture where content is authored in Google Docs/SharePoint and delivered via the Helix CDN. JavaScript blocks transform raw HTML content into rich UI components.

## Commands

### Development
```sh
aem up          # Start local dev server at http://localhost:3000 (requires: sudo npm install -g @adobe/helix-cli)
```

### Testing
```sh
npm test                    # Run unit tests with coverage
npm run test:watch          # Run tests in watch mode

# Run a single test file
npx wtr --config ./web-test-runner.config.js --node-resolve --port=2000 "**/pricing.test.js" --debug
```

### E2E Testing (Nala / Playwright)
```sh
npx playwright install      # Install browsers (first time only)

npm run nala <env> [options]
# env: main | stage | branch-name
# Examples:
npm run nala stage @ax-columns                  # Run by tag on stage
npm run nala stage @ax-columns browser=firefox  # Specific browser
npm run nala stage test=ax-columns.test.cjs     # Specific file
npm run nala stage mode=headed                  # Non-headless

npm run a11y <env|url> [path]   # Accessibility tests
npm run nala help               # Show all Nala options
```

### Linting
```sh
npm run lint          # JS + CSS
npm run lint:fix      # Auto-fix
npm run lint:js       # ESLint only
npm run lint:css      # Stylelint only
npm run lint:css-vars # CSS design token compliance
```

## Architecture

### AEM EDS Block Model

Content arrives as plain HTML from the CMS. Each **block** (`express/code/blocks/<name>/`) exports a default `init(el)` function that transforms the raw author HTML into final UI.

Block structure:
```
express/code/blocks/hero-color/
  hero-color.js    # export default async function init(el) { ... }
  hero-color.css
```

The main orchestration is in `express/code/scripts/scripts.js`, which runs the **Three-Phase Loading (E-L-D)** lifecycle:
- **Phase E (Eager)**: LCP-critical elements, synchronous, <100KB, single origin, first section only
- **Phase L (Lazy)**: Below-fold enhancement, async with intersection observers
- **Phase D (Delayed)**: Third-party scripts, analytics, 3+ seconds after LCP

### Block Development Rules

Always export `init(el)` as default. Follow author-first design — block HTML must be readable in a table format in Word/Google Docs, and authors should "squint and see the final UI."

```javascript
// ✅ Standard pattern
export default async function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const title = el.querySelector('h1, h2, h3');  // probe from required content

  // Add human-readable classes — never rely on nth-child
  title.classList.add('headline');

  // Preserve content/events — never use innerHTML for restructuring
  while (source.firstChild) target.appendChild(source.firstChild);
}
```

Key rules:
- **No `innerHTML` for restructuring** — destroys events and breaks Preact components
- **No `nth-child` selectors** — brittle when author content changes
- **Max 3 columns** in table structure; flip to rows beyond that
- Use `section.classList` checks for layout variants instead of complex block options

### Shared Utilities

```javascript
// Icons
getIconElementDeprecated('adobe-express-logo')  // use deprecated version for compat

// Cart/pricing links
formatDynamicCartLink(cta);
await trackBranchParameters([link]);
```

### CSS Variables

The project enforces design system CSS variable usage (`npm run lint:css-vars`). Use design tokens rather than raw values.

## Testing

### Unit Tests (`test/`)

Framework: Web Test Runner + Chai + Sinon. Tests live at `test/blocks/<name>/` mirroring the source.

Key patterns:
- Set `document.body.innerHTML` in `beforeEach`, clean up in `afterEach`
- Mock `fetch` with `sinon.stub(global, 'fetch')`, restore in `afterEach`
- Test public behavior, not internal methods
- Test that block transformation preserves semantic content (e.g., `h1` text unchanged)

### E2E Tests (`nala/`)

Playwright-based tests in `nala/blocks/`. Use `.test.cjs` extension. Tests are tagged with annotations like `@ax-columns` for selective runs. When using debug/ui mode, always target a single test with a tag — running multiple tests in these modes opens a browser window per test.

## PR Workflow

PRs use label-based auto-merge (runs every 4 hours, batches up to 8 PRs):

| Label | Effect |
|-------|--------|
| `Ready for Review` | Signals review needed; must be removed before auto-merge |
| `Ready for Stage` | Queues for stage merge (needs 2+ approvals, passing checks) |
| `QA Approved` | QA alternative to Ready for Stage |
| `Zero Impact` | Docs/tests/config — bypasses some batch restrictions |
| `Do Not Merge` | Blocks all auto-merge |
| `Run Nala` | Triggers full Playwright E2E suite |

Stage → Main promotion requires PageSpeed Insights checks passing and is RCP-aware.
