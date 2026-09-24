# da-express-milo Repository Architecture

> **Purpose:** This document is the primary reference for AI agents working in this repo.
> Read this before making any decisions about where a requirement belongs or what is possible in this layer.

## Supporting Documentation

| Doc | What it covers |
|---|---|
| [eds-platform.md](eds-platform.md) | How AEM EDS works as a platform — authoring pipeline, code pipeline, URL structure, rendering lifecycle, local dev |
| [da-express-milo-internals.md](da-express-milo-internals.md) | AEM content layer vs code layer split — what authors own vs what developers own, deployment, key utility functions |

---

---

## 1. Repository Identity

**da-express-milo** is the frontend codebase for **adobe.com/express** — the marketing and SEO page layer for Adobe Express. It is built on Adobe's AEM Edge Delivery Services (EDS) using the Helix framework.

### Core Responsibilities
- Express landing pages, feature pages, and marketing content
- Express-specific block implementations and interactive components
- Client-side orchestration with Milo (shared Adobe library)
- Integration with CCEverywhere SDK for frictionless quick actions (image/video editing embedded in page)
- Metadata-driven page behaviour and dynamic content assembly

### What This Repo Does NOT Own
- **Horizon (Express app)** — The actual Express editor application. Quick action logic, editor flows, and app features live here. Referenced via deep-links and CCEverywhere SDK calls.
- **cceverywhere SDK** — Adobe's unified embed SDK for Express editing. Loaded as external script from `https://cc-embed.adobe.com/sdk/1p/v4/CCEverywhere.js`. Bridge layer between da-express-milo and Horizon.
- **Milo shared libraries** (`/libs`) — Common Adobe components: nav, footer, utils, localization, IMS auth. Mapped at build time via `setLibs()`.
- **Commerce backend** — Handled separately
- **Adobe IMS / Auth** — Provided by Milo's IMS integration
- **Analytics infrastructure** — Comes from Milo; this repo applies `daa-lh`/`daa-im` attributes and dispatches events

---

## 2. The Three-Repo System

Most features span three repos. Understanding which layer owns what is critical for requirement splitting.

```
┌─────────────────────────────────────────────────────────┐
│  da-express-milo  (this repo)                           │
│  SEO / Marketing Page Layer                             │
│  - Blocks, metadata, analytics attributes               │
│  - Page structure, floating CTAs                        │
│  - File upload UI, frictionless block orchestration     │
│  - Sends blob → CCEverywhere SDK                        │
└───────────────────────┬─────────────────────────────────┘
                        │ calls SDK (cross-origin)
                        ▼
┌─────────────────────────────────────────────────────────┐
│  cceverywhere SDK  (external — loaded from CDN)         │
│  Bridge / Embed Layer                                   │
│  - Injects Express editor iframe into the page         │
│  - Passes blob from SEO page → Horizon                  │
│  - Returns errors/events from Horizon → SEO page        │
│  - Manages auth context, SDK config                     │
└───────────────────────┬─────────────────────────────────┘
                        │ renders inside iframe
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Horizon  (Express app — separate repo)                 │
│  Quick Action / Editor Layer                            │
│  - All quick action logic (remove bg, resize, etc.)     │
│  - Editor flows, tool UIs                               │
│  - Export, download behaviour                           │
│  - App-side feature flags                               │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
/express/
  /code/
    /blocks/              # Express-specific block implementations (118+ blocks)
    /icons/               # SVG icon sprites
    /libs/
      /services/          # Search plugins (CCLibrary, Kuler, Stock, Behance)
      /color-components/  # Lit custom elements for color tools (Pattern B — see §11)
    /scripts/
      /color-shared/      # Color tool infrastructure: Spectrum wrappers, Lit components,
                          # state controllers, renderers, services (Pattern B — see §11)
        /spectrum/        # SWC lazy loaders, Express wrapper factories, CSS token overrides
      /widgets/           # Reusable UI components (floating-cta, carousels)
        /spectrum/
          build.mjs       # esbuild — bundles @spectrum-web-components/* → dist/*.js
          /dist/          # Pre-bundled SWC ESM files (committed, loaded at runtime)
      /utils/
        frictionless-utils.js       # Quick action orchestration, SDK loading
        mobile-fork-button-utils.js # Fork button logic, androidCheck
        pricing.js                  # Price formatting
      utils.js            # Core utils: getMetadata, buildAutoBlocks, getMobileOperatingSystem
      scripts.js          # Page entry point: config, Milo setup, decoration lifecycle
    /styles/
    /templates/

/nala/                    # E2E tests (Playwright)
  /blocks/                # Test suites (3-file pattern per block)
  /libs/                  # Test utilities: accessibility, SEO, web interactions
  /assets/                # test-image.png, test-image.jpg, test-video.mp4

/test/                    # Unit tests (WTR / mocha)
```

---

## 4. Block System

### Block Structure
Every block lives in `/express/code/blocks/<block-name>/`:
- **`<block-name>.js`** — Default export `decorate(block)` function
- **`<block-name>.css`** — Block styles (auto-loaded by Milo)

### Decoration Lifecycle
1. AEM renders `<div class="block-name">` in HTML
2. Milo's `loadBlocks()` calls each block's `decorate(block)` export
3. Block manipulates DOM, binds events, reads metadata

### The `meta-powered` Class
Blocks injected by `buildAutoBlocks()` get `meta-powered`. Signals the block was auto-created from metadata, not authored in page HTML. Blocks check for this before rendering:
```javascript
if (!block.classList.contains('meta-powered')) return;
```

---

## 5. Metadata System

Page `<meta>` tags drive almost all page behaviour. Reading happens via:
```javascript
getMetadata('key-name') // returns content attribute value
```

### Key Metadata Keys

**Floating CTA control:**
| Key | Values | Effect |
|---|---|---|
| `show-floating-cta` | `yes` | Master gate — injects floating button block |
| `desktop-floating-cta` | block name | Which block to inject on desktop |
| `mobile-floating-cta` | block name | Which block to inject on mobile |
| `fork-eligibility-check` | `on` | Restricts fork button to Android only |
| `frictionless-safari` | `on` | Unlocks frictionless mode on iOS/Safari |

**Valid block names for floating CTAs:**
`floating-button`, `multifunction-button`, `mobile-fork-button`, `mobile-fork-button-frictionless`, `mobile-fork-button-dismissable`

**CTA content:**
| Key | Purpose |
|---|---|
| `main-cta-link` / `main-cta-text` | Base CTA href and label |
| `mobile-floating-cta-link` / `mobile-floating-cta-text` | Mobile override |
| `desktop-floating-cta-link` / `desktop-floating-cta-text` | Desktop override |
| `fork-cta-1-icon`, `fork-cta-1-text`, `fork-cta-1-link` | First fork option |
| `fork-cta-2-icon`, `fork-cta-2-text`, `fork-cta-2-link` | Second fork option |
| `fork-cta-N-*-frictionless` | Frictionless variant overrides |
| `fork-button-header` | Header text in fork drawer |

**UI features:**
| Key | Values | Effect |
|---|---|---|
| `show-floating-cta-app-store-badge` | `on` | Show app store badge |
| `use-floating-cta-lottie-arrow` | `on` | Show scroll arrow |
| `floating-cta-suppress-until-not-visible` | `on` | Hide CTA while target elements visible |
| `floating-cta-drawer-delay` | number (ms) | Delay before drawer appears |

**Page config:**
| Key | Purpose |
|---|---|
| `template` | Page template type |
| `jarvis-immediately-visible` | `mobile` / `desktop` / `on` |
| `jarvis-surface-id` | e.g. `Acom_Express` |
| `frictionless-safari` | Enables Safari frictionless path |

---

## 6. Floating CTA System

### Block Family

| Block | Audience | Description |
|---|---|---|
| `floating-button` | Universal | Single CTA button |
| `multifunction-button` | Universal | CTA + toolbox menu |
| `mobile-fork-button` | Mobile | Fork to native app (Android gated) |
| `mobile-fork-button-frictionless` | Mobile | Frictionless quick actions (Android; Safari if flag on) |
| `mobile-fork-button-dismissable` | Mobile | Fork button with dismiss UI (Android only) |

### OS Detection
```javascript
// express/code/scripts/utils.js
getMobileOperatingSystem()
// Returns: 'Android' | 'iOS' | 'Windows Phone' | 'unknown'
```

### Android-gating pattern
`fork-eligibility-check=on` in metadata → only Android gets fork button, iOS falls back to `floating-button`.

`frictionless-safari=on` → adds iOS/Safari to the frictionless eligible path (Android is always eligible regardless).

---

## 7. Frictionless / Quick Action System

### Quick Action Types
**Image:** `remove-background`, `resize-image`, `crop-image`, `convert-to-jpg`, `convert-to-png`, `convert-to-svg`, `edit-image`

**Video:** `edit-video`, `crop-video`, `trim-video`, `resize-video`, `merge-videos`, `convert-to-mp4`, `caption-video`, `convert-to-gif`

### Data Flow
```
1. User uploads file via block upload button
2. Block validates file (type, size) against QA_CONFIGS
3. Block loads CCEverywhere SDK:
   loadAndInitializeCCEverywhere(getConfig) → window.CCEverywhere
4. Block calls SDK:
   ccEverywhere.quickAction.removeBackground(docConfig, appConfig, exportConfig, contConfig)
5. SDK injects iframe:
   <div class="quick-action-container">
     <iframe src="https://express.adobe.com/..."></iframe>
   </div>
6. User edits inside iframe (Horizon handles this)
7. User downloads → SDK callback fires → block handles result
```

### Iframe Boundary (Critical)
The Express editor iframe is cross-origin. da-express-milo:
- **CAN:** click, type, wait for elements via `frameLocator()`
- **CANNOT:** read DOM via `evaluate()`, access `window`, modify styles

This is intentional. Any feature that requires reading or modifying the Express editor UI belongs to Horizon, not da-express-milo.

### Key file
`/express/code/scripts/utils/frictionless-utils.js` — SDK loading, quick action configs, auth checks

---

## 8. Analytics System

### Attributes
| Attribute | Applied to | Purpose |
|---|---|---|
| `daa-lh` | Section | Section-level hierarchy identifier |
| `daa-im` | Block/element | Interaction model (`click`, `click\|download`) |

### Patterns
- Analytics attributes are applied during block decoration
- `WebUtil.getSectionDaalh(n)` and `WebUtil.getBlockDaalh(name, n)` generate correct values
- Always scan existing blocks for current patterns before writing new analytics code — patterns may vary by block type

### Analytics events
`sendFrictionlessEventToAdobeAnalytics()` — dispatches events for SDK interactions (upload, download, error)
Location: `/express/code/scripts/instrument.js`

---

## 9. Nala Test Structure

### Three-file pattern (mandatory)
```
nala/blocks/<block-name>/
  <block-name>.page.cjs   ← Locators and action helpers
  <block-name>.spec.cjs   ← Test data (paths, tags, expected values)
  <block-name>.test.cjs   ← Test execution
```

Always `.cjs`, never `.js`. Test pages must be pre-created AEM draft pages at `/drafts/nala/`.

### Standard test steps
1. Navigate (domcontentloaded — not networkidle)
2. Verify block visible + upload button present
3. Accessibility (runAccessibilityTest)
4. Analytics attributes (daa-lh, daa-im)
5. Core interaction (upload → verify iframe appears)

---

## 10. Key Entry Points

| File | Purpose |
|---|---|
| `express/code/scripts/scripts.js` | Page initialisation, Milo setup, decoration lifecycle |
| `express/code/scripts/utils.js` | `getMetadata`, `getMobileOperatingSystem`, `buildAutoBlocks` |
| `express/code/scripts/utils/frictionless-utils.js` | SDK loading, quick action orchestration |
| `express/code/scripts/widgets/floating-cta.js` | Floating button widget, `createFloatingButton` |
| `express/code/blocks/mobile-fork-button-utils.js` | `androidCheck`, `createMultiFunctionButton` |

---

## 11. Two Component Implementation Patterns

This repo has two distinct patterns for building block UI. Choosing the wrong one adds unnecessary complexity or breaks accessibility. Use this section to decide before writing any code.

---

### Pattern A — Vanilla JS / HTML / CSS (default)

**Use for:** Marketing blocks, content display, CTAs, simple interactivity (toggles, carousels, accordions, frictionless upload flows).

**How it works:**
1. AEM authors content in a doc. Helix renders it as `<div class="block-name">` with child divs/paragraphs.
2. The block's `decorate(block)` function reads those divs, manipulates DOM, binds events.
3. Styles live in `<block-name>.css`, auto-loaded by Milo.
4. No build step — plain ES modules, no bundler.

**Milo integration:** Metadata drives behaviour (`getMetadata()`), Milo utilities handle nav/footer/IMS/analytics. The block stays thin.

**When this is enough:**
- Static or lightly dynamic content
- Simple user interactions (click, hover, scroll)
- No complex managed state
- No design-system-level accessibility requirements (focus traps, ARIA live regions, roving tabindex)

---

### Pattern B — Spectrum Web Components + Lit (opt-in, complex UI only)

**Use for:** Interactive tools with complex state, design-system-compliant widgets, accessible form controls (color pickers, dropdowns with keyboard nav, dialogs, toasts, sliders, tabs).

**Established by:** The color tool pages (`color-wheel`, `color-explore`, `color-extract`, `color-contrast-checker`, `color-blindness`). These blocks are the canonical reference implementation.

**How it works:**
- **Spectrum Web Components (SWC) v2** (`@spectrum-web-components`) are pre-bundled with esbuild into `express/code/scripts/widgets/spectrum/dist/*.js`
- Bundles are **lazy-loaded at runtime** via `load-spectrum.js` — only the component families the page needs, only when needed
- Every SWC element is wrapped in `<sp-theme system="spectrum-two" color="light" scale="medium">` via `createThemeWrapper()`
- Express-specific Express wrapper factories (`createExpressPicker()`, `createExpressDialog()`, etc.) in `color-shared/spectrum/components/` handle: loading the bundle, wrapping in theme, applying CSS token overrides, normalising events, ARIA compliance
- State is managed via a pub/sub controller (`ColorThemeExpressController`) rather than scattered DOM mutations
- Lit is used for the stateful custom elements in `color-shared/components/` and `libs/color-components/`

**Infrastructure overview:**
```
express/code/scripts/color-shared/spectrum/
  load-spectrum.js     ← per-family lazy loaders (idempotent, cached)
  registry.js          ← customElements.define dedup guard
  utils/theme.js       ← sp-theme factory
  utils/a11y.js        ← trapFocus, announceToScreenReader, scroll lock
  components/          ← Express wrapper factories
  styles/              ← --mod-* token overrides + ::part() overrides per component

express/code/scripts/widgets/spectrum/
  build.mjs            ← esbuild bundler (run when adding new SWC packages)
  dist/                ← pre-bundled ESM files (committed, not rebuilt at page load)
```

See [SPECTRUM_2_IMPORT_AND_CONSUMPTION.md](../../express/code/scripts/color-shared/SPECTRUM_2_IMPORT_AND_CONSUMPTION.md) for the full internal reference.

---

### Decision Guide

| Signal | Use Pattern A | Use Pattern B |
|---|---|---|
| Content comes from AEM doc authoring | ✅ | — |
| Simple DOM manipulation is sufficient | ✅ | — |
| No persistent interactive state | ✅ | — |
| Marketing / SEO / CTA block | ✅ | — |
| Rich interactive tool (editor, picker, explorer) | — | ✅ |
| Complex keyboard navigation required | — | ✅ |
| Focus trap / modal / tray / toast needed | — | ✅ |
| Design-system-accurate form controls | — | ✅ |
| Multiple coordinated components sharing state | — | ✅ |
| Block is not purely driven by doc content | — | ✅ |

**Default to Pattern A.** Only reach for Pattern B when the interaction complexity or accessibility requirements clearly exceed what vanilla DOM + CSS can reasonably deliver. The Spectrum infrastructure already exists — but it adds a build step, bundle weight, and a learning curve that most blocks don't need.
