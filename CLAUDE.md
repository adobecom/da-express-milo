# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**da-express-milo** is the official repository for [adobe.com/express](https://www.adobe.com/express), built with AEM Edge Delivery Services (EDS) and Milo. The site is composed of reusable blocks developed with progressive enhancement, author-first design principles, and strict performance requirements.

- **Repository**: https://github.com/adobecom/da-express-milo
- **Architecture**: Block-based (117 blocks in `/express/code/blocks/`, 96+ Nala E2E tests)
- **Key utilities**: `express/code/scripts/utils/` — pricing.js, analytics.js, icons.js, media.js, decorate.js, and ~18 other shared helpers
- **Frontend Stack**: Vanilla JS, Lit components (Spectrum Web Components), CSS3 with design tokens
- **Test Infrastructure**: Web Test Runner (unit tests), Nala (E2E/accessibility tests), Playwright
- **Development Server**: Helix CLI (`aem up`)

## Essential Commands

### Development
```bash
# Start local dev server (http://localhost:3000)
aem up

# Install dependencies
npm install

# Lint all code (JS + CSS)
npm run lint
npm run lint:fix

# Check CSS variable usage against design system
npm run lint:css-vars
npm run lint:css-vars:fix
```

### Testing

#### Unit Tests (Web Test Runner)
```bash
# Run all unit tests
npm run test

# Watch mode with debugging UI
npm run test:watch

# Run single test file with debug enabled
npx wtr --config ./web-test-runner.config.js --node-resolve --port=2000 "**/pricing.test.js" --debug

# Coverage is available (may not be accurate per README)
```

#### E2E Tests (Nala + Playwright)
```bash
# View available Nala commands
npm run nala help

# Run tests on specific environment with browser/device options
npm run nala <env> [options]
# env: main | stage | branch-name | full URL
# browser=<chrome|firefox|webkit> (default: chrome)
# device=<desktop|mobile> (default: desktop)
# mode=<headless|ui|debug|headed> (default: headless)
# test=<.test.cjs> (specific test file)
# -g, --g=<@tag> (filter by annotation, e.g., @ax-columns)
# milolibs=<main|stage|feat-branch> (Milo libs environment)

# Examples
npm run nala stage @ax-columns                   # Run ax-columns block tests on stage
npm run nala stage @ax-columns browser=firefox  # Same test, Firefox
npm run nala stage milolibs=stage               # Use stage Milo libs

# Accessibility testing
npm run a11y <env|url> [path] [options]
npm run a11y stage /drafts/nala/blocks/ax-columns
npm run a11y https://adobe.com -- -t 'wcag2a'
```

#### Test Generation
```bash
# Auto-generate Nala E2E tests from block structure
npm run nala-test-gen
```

### Build Scripts
```bash
# Build Spectrum components and widgets
npm run build:spectrum

# Build with icons catalog
npm run build:spectrum:icons-catalog
```

## Architecture

### Block-Based System

All UI is composed of **blocks**—self-contained, reusable components authored in Word/Google Docs:

```
/express/code/blocks/          # Active block implementations (118 blocks)
  ├── hero/
  │   ├── hero.js              # Block initialization and decoration
  │   ├── hero.css             # Block styles
  │   └── hero.test.js         # Unit tests (optional)
  ├── ax-columns/
  ├── pricing-cards/
  └── ... (other blocks)

/nala/blocks/                  # E2E/Nala tests (96+ blocks)
  ├── hero.test.cjs
  ├── ax-columns.test.cjs
  └── ... (test files)

/test/                         # Unit test infrastructure
  ├── blocks/                  # Per-block test directories + test-utilities.js
  ├── mocks/                   # Mock utilities (test-utilities.js mockRes helper)
  ├── helpers/                 # Test helpers
  └── services/
```

### Block Pattern (Author-First Design)

Every block follows this pattern to ensure Word-compatible, intuitive authoring:

```javascript
// /express/code/blocks/hero/hero.js
export default async function init(el) {
  // 1. DIVIDE content into semantic parts (required vs optional)
  const rows = [...el.querySelectorAll(':scope > div')];
  const title = el.querySelector('h1, h2, h3');
  const detail = findContentAbove(title);
  const body = findContentBelow(title);
  const actions = findLinkContainer(el);
  
  // 2. DECORATE DOM with human-readable classes (avoid nth-child)
  if (detail) detail.classList.add('detail');
  title.classList.add('headline');
  if (body) body.classList.add('body');
  if (actions) actions.classList.add('actions');
  
  // 3. PRESERVE CONTENT via append/cloneNode (never innerHTML)
  const structure = createFinalStructure();
  safelyMoveContent(title, detail, body, actions, structure);
  el.append(structure);
}
```

**Key Principles**:
- **Author-first**: Word Online compatible (no key/value tables, <3 columns)
- **Progressive enhancement**: Start with semantic HTML, enhance with JS
- **Content preservation**: Use `.append()`, cloning—never `.innerHTML` (destroys Preact/Lit components)
- **Resilient selectors**: Use decorated classes, avoid `:nth-child()` or `:last-of-type`
- **Section metadata**: Use `.section` class overrides for layout variants instead of block options

**Express-Milo Utilities** (non-obvious, commonly needed in blocks):
```javascript
// Use deprecated icon helper for compatibility across express
const logo = getIconElementDeprecated('adobe-express-logo');

// Dynamic cart links must always be async-enhanced
formatDynamicCartLink(cta);

// Branch tracking on CTAs — always await
await trackBranchParameters([link]);
```

### Three-Phase Loading (E-L-D)

AEM EDS follows three performance phases—understand which code runs when:

```
Phase E (Eager/Immediate): <head> scripts, critical CSS
  → Block decorators run synchronously
  → Goal: First Contentful Paint (FCP)

Phase L (Lazy): After main content loads
  → Deferred enhancements (Promise.all of block init functions)
  → Load fonts, secondary images
  → Goal: Largest Contentful Paint (LCP)

Phase D (Deferred): 3+ seconds after page load
  → Third-party integrations (analytics, personalization)
  → Non-critical features
  → Goal: minimal performance impact
```

### Project Structure

```
/express/code/
  ├── blocks/                  # 118 reusable block implementations
  ├── libs/                    # Shared utilities and configs
  ├── scripts/
  │   ├── utils/              # Shared utilities (pricing.js, utils.js, etc.)
  │   ├── scripts.js           # Page initialization and block loading
  │   └── widgets/             # Spectrum Web Components, color tools
  ├── styles/                 # Global CSS and design tokens
  ├── icons/                  # SVG icons
  └── templates/              # HTML/CSS templates

/test/
  ├── blocks/                 # Unit test setup, test-utilities.js, mocks
  ├── **/*.test.js           # Unit tests (Web Test Runner)
  └── **/*.test.cjs          # Nala E2E tests in /nala/blocks/

/nala/
  ├── blocks/                # 96+ E2E test files (.test.cjs)
  └── utils/                 # Nala runners, global setup, reporters

/scripts/
  ├── lint-css-vars.js       # Validates CSS variables against design system
  └── ... (build & automation scripts)
```

## Testing Strategy

### Unit Tests (Web Test Runner)

- **Location**: `/test/**/*.test.js`
- **Framework**: Chai (assertions) + Sinon (mocks/stubs)
- **Running**: `npm run test` or `npm run test:watch`
- **External Requests Forbidden**: Unit tests must mock all fetch/XHR calls (enforced in `web-test-runner.config.js`)
- **Key Patterns**:
  ```javascript
  import { expect } from '@esm-bundle/chai';
  import sinon from 'sinon';
  import { mockRes } from '../blocks/test-utilities.js';
  
  describe('Feature', () => {
    it('should do something', async () => {
      window.fetch = sinon.stub().returns(mockRes({ data: {...} }));
      // Test logic
      expect(result).to.equal(expected);
    });
  });
  ```

### E2E Tests (Nala + Playwright)

- **Location**: `/nala/blocks/**/*.test.cjs`
- **Framework**: Playwright Test (`@playwright/test`)
- **Configuration**: `playwright.config.cjs` (custom baseURL, projects for Chrome/Firefox/Safari + mobile)
- **Running**: `npm run nala <env> [options]`
- **Key Features**:
  - **Tags**: Annotate tests with `@tag` (e.g., `@ax-columns`) for selective runs
  - **Accessibility**: Automatic axe-core checks via axe-html-reporter
  - **Cross-browser**: Chrome, Firefox, Safari desktop + mobile (Pixel 5, iPhone 12)
  - **Device testing**: Desktop and mobile viewports
  - **Debug mode**: `mode=debug` launches debugger (run one test at a time)

- **Example Test Structure**:
  ```javascript
  import { test, expect } from '@playwright/test';
  
  test.describe('Block Name', () => {
    test('should render and be interactive', async ({ page }) => {
      await page.goto('/path/to/page');
      const block = page.locator('.block-name');
      await expect(block).toBeVisible();
      await block.locator('button').click();
      await expect(block.locator('.active')).toBeVisible();
    });
    
    test('@mobile should respond to smaller viewports', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      // mobile-specific assertions
    });
  });
  ```

## Cursor AI Rules

The project includes 20+ specialized Cursor rules in `/.cursor/rules/` for AEM/performance guidance. Key rules:

- **Always Active**: Core Web Vitals, Three-Phase Loading, DOM preservation, image optimization, event handling
- **"Write my tests"**: Activates unit testing guidance (mocking patterns, async block testing)
- **"Code review"**: CSS variable linting, block pattern compliance, performance recommendations
- **"Generate Nala tests"**: Auto-generates E2E test templates with Playwright patterns
- **Performance queries**: PageSpeed diagnostics (LCP timing, render-blocking CSS)
- **Block development**: Author-first design, section metadata, content preservation

Specific rule files:
- `core-web-vitals-standards.mdc` — CWV metrics and LCP optimization
- `aem-three-phase-performance.mdc` — E-L-D phases and timing
- `express-milo-block-patterns.mdc` — Block design principles, author experience
- `unit-testing-standards.mdc` — Async patterns, mocking external requests
- `nala-test-generation.mdc` — Playwright patterns, cross-browser testing
- `code-review-standards.mdc` — CSS variable enforcement, accessibility checks

## CSS and Design System

- **Framework**: CSS3 + CSS custom properties (design tokens)
- **Linter**: Stylelint (standard config + prettier)
- **Token Validation**: `npm run lint:css-vars` ensures all variables are defined and used correctly
- **Pattern**: Variables defined in global styles, consumed in blocks
  ```css
  /* Global design token */
  --color-primary: #0473e0;
  
  /* Block usage */
  .block { color: var(--color-primary); }
  ```

## GitHub Workflow & PR Labels

Pull requests use an automated label-based workflow for merging to stage/main:

### Required Labels for Auto-Merge
- **"Ready for Stage"** or **"QA Approved"**: Marks PR for stage merge
  - Requires 2+ approvals, all checks passing
  - Cannot have "Ready for Review" label
- **"Ready for Review"**: Prevents auto-merge (remove after review complete)
- **"Zero Impact"**: Marks documentation/test changes with no functional impact
- **"Do Not Merge"**: Blocks auto-merge
- **"Run Nala"**: Triggers comprehensive test suite

### Merge Process
- **To Stage**: Every 4 hours, up to 8 PRs per batch (requires "Ready for Stage"/"QA Approved")
- **To Main**: Requires stage-to-main PR, PageSpeed Insights passing, RCP compliance
- **Conflicts**: File conflicts within batch will prevent merge (batch size/conflict detection)

## Performance Requirements

- **Target PageSpeed Score**: 90+
- **Core Web Vitals**:
  - **LCP** (Largest Contentful Paint): <2.5s
  - **FID/INP** (Interaction): <100ms
  - **CLS** (Layout Shift): <0.1
- **Common Issues**:
  - Render-blocking CSS (Phase E only for above-fold)
  - Unoptimized images (use responsive sizes, modern formats)
  - Synchronous third-party scripts (Phase D delay)
  - Unnecessary reflows/repaints (DOM manipulation best practices)

Use `npm run test` in concert with Lighthouse audits during development.

## Debugging Tips

1. **Local Development**: `aem up` provides live reload and dev tools
2. **Unit Test Debugging**: `npm run test:watch` opens interactive debugger
3. **Nala Test Debugging**: `npm run nala stage mode=debug` (one test at a time)
4. **Performance**: Chrome DevTools → Lighthouse, or PageSpeed Insights (https://pagespeed.web.dev)
5. **CSS Variables**: `npm run lint:css-vars` catches undefined/unused tokens
6. **Block Inspection**: Check `.block` DOM structure in DevTools—look for decorated classes (`.headline`, `.detail`, `.body`)

## Resources

- **AEM Edge Delivery Services**: https://www.aem.live/
- **Helix Block Design**: https://milo.adobe.com/blog/2022/07/05/block-design
- **Keeping it 100 (PageSpeed)**: https://www.aem.live/developer/keeping-it-100
- **Nala Wiki**: https://github.com/adobecom/milo/wiki/Nala
- **Web Test Runner**: https://modern-web.dev/docs/test-runner/overview/
- **Core Web Vitals**: https://web.dev/vitals/
- **Playwright Docs**: https://playwright.dev/docs/intro
