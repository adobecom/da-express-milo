## Color Tools Dev Handoff

This document is the **on-ramp for engineers** picking up the Color Tools work in `da-express-milo`.  
It connects the various legacy repos, explains how the Franklin `color-tools` block is wired today, and outlines how to safely extend it.

---

## 1. Key Repositories & Design Sources

- **Active Franklin implementation**
  - **`da-express-milo` (this repo)** – Express site + `color-tools` block  
    - GitHub: [`adobecom/da-express-milo`](https://github.com/adobecom/da-express-milo)  
    - Block entrypoint: `express/code/blocks/color-tools/color-tools.js`  
    - Shared components: `express/code/libs/color-components/**`
  - **Upstream Milo libraries** – baseline Franklin patterns and utilities  
    - GitHub: [`adobecom/express-milo`](https://github.com/adobecom/express-milo)

- **Legacy implementation (React/Redux)**
  - **`colorweb-develop`** – original `/create/color-wheel` + Image/Gradient/Accessibility flows  
    - Git: `git@git.corp.adobe.com:KulerWeb/colorweb.git` (see `colorweb-develop/README.md`)  
    - Audit: `colorweb-develop/COLORWEB_OVERVIEW.md` and `express/docs/color-tools-legacy-audit.md`

- **Color math & picker monorepo**
  - **`ColorPicker`** – mono-repo hosting `@adobecolor/color-utils`, `ccx-colorpicker`, `wc-colorpicker`, etc.  
    - Git: `git@git.corp.adobe.com:KulerWeb/ColorPicker.git`  
    - Deep dive: `ColorPicker/COMPONENTS_DEEP_DIVE.md`

- **Contrast & color-vision research**
  - **`ImgContrastRatio`** – internal prototype for CVD/APCA exploration  
    - Git: `https://git.corp.adobe.com/echevarr/ImgContrastRatio` (see `ImgContrastRatio-master/docs/*.htm`)

- **Design source of truth**
  - Figma – **Final Color Expansion CCEX-221263**  
    - Marquee + tabs (hero):  
      [`Final-Color-Expansion-CCEX-221263 – node 3357:106564`](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=3357-106564&m=dev)  
    - Image upload workspace:  
      [`node 3357:103512`](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=3357-103512&m=dev)  
    - Base color tools:  
      [`node 3357:102536`](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=3357-102536&m=dev)

- **Project docs in this repo**
  - Migration context: `express/docs/color-project-migration-gaps.md`
  - Gap matrix vs. legacy: `express/docs/color-tools-gap-report.md`
  - Authoring contract: `express/docs/color-tools-authoring.md`
  - QA checklist: `express/docs/color-tools-qa.md`
  - Long-haul tracker: `express/docs/color-tools-tracker.md`

---

## 2. High-Level Architecture: How Color Tools Fits Together

- **Franklin block** – `color-tools`
  - Variation `wheel-palette-marquee` renders the Figma-style hero and the 3-tab workspace (Base color, Image, Color wheel).
  - Entry: `init(el)` in `color-tools.js` decides between:
    - Simple wheel-only demo,
    - Palette-only demo, or
    - Full hero marquee (`renderWheelPaletteMarquee(el)`).

- **Shared state controller**
  - `ColorThemeController` (`express/code/libs/color-components/controllers/ColorThemeController.js`):
    - Owns the palette state: `{ swatches[], baseColorIndex, harmonyRule, ... }`.
    - Wraps **HarmonyEngine** from `ColorPicker` (`color-utils`) to compute harmonious swatches.
    - Persists state to `localStorage` and emits structured events for analytics (`color-theme:update`, `express:color-tools-action`).

- **Web components (Lit / native ESM)**
  - `color-wheel` – canvas-based wheel + draggable markers and spokes; forwards `change` / `change-end` events.
  - `color-swatch-rail` – vertical palette rail on the right side of the marquee (hex labels, locks, quick actions in progress).
  - `color-harmony-toolbar` – icon-based rule selector directly under the wheel.
  - Planned: `color-image-extractor`, `color-base-color`, gradient and accessibility components, all under `express/code/libs/color-components/components/**`.

- **Analytics surface**
  - Tab switches dispatch `express:color-tools-tab-change` and `express:color-tools-action` custom events from the block.
  - Controller-level actions (rule changes, wheel drags, swatch edits) are also funneled through a single analytics contract so `scripts.js` can bridge to Adobe Analytics / Ingest.

---

## 3. End-to-End Flow: `wheel-palette-marquee`

1. **Block bootstrap**
   - Franklin decorates the `.color-tools` section and calls `init(el)` from `color-tools.js`.
   - If the section has variation `wheel-palette-marquee`, `renderWheelPaletteMarquee(el)` is used.

2. **Controller + components wiring**
   - `createWheelWorkspace()`:
     - Instantiates a `ColorThemeController` with:
       - Default harmony rule (`ANALOGOUS`),
       - `NUMBER_OF_SWATCHES` base-color swatches.
     - Creates a `<color-wheel>` element and attaches `change` / `change-end` listeners.
     - Creates `<color-harmony-toolbar>` and hands it the controller instance via `.controller`.
   - A **single controller instance** is shared across:
     - The wheel workspace,
     - The left-hand tab content (Base color + Image tabs),
     - The right-hand `<color-swatch-rail>` rail.

3. **Tabs and routing**
   - Tabs (`base`, `image`, `wheel`) are defined in `color-tools.js` and rendered as pill buttons below the hero copy.
   - Active tab is read from `?color-tools-tab=<id>` on load and written back via `history.replaceState` on change.
   - Tab activation:
     - Adds/removes `.active` class on tab buttons + panels,
     - Dispatches `express:color-tools-tab-change` and `express:color-tools-action` (`{ action: 'tab-view', tab }`).

4. **Per-tab behavior (today)**
   - **Color wheel tab**
     - Renders the wheel workspace (canvas + harmony toolbar).
     - Wheel drags call `ColorThemeController.setBaseColor(hex)`, which recalculates swatches via HarmonyEngine.
   - **Image tab**
     - Temporary implementation in `createImageExtractor(controller)`:
       - Drag/drop or file input → draw to `<canvas>` → naive pixel sampling → swatch list.
       - Updates controller swatches + base color, keeping wheel/rail in sync.
     - This is the main area still to be replaced with the full `CreateFromImage` parity.
   - **Base color tab**
     - Simple `<input type="color">` bound to the controller’s base swatch; updates wheel + palette reactively.

5. **Right-hand swatch rail**
   - `<color-swatch-rail>` receives the controller instance and renders one column per swatch.
   - Changes made in any tab (wheel drag, image extraction, base color input) propagate into the rail via controller subscriptions.

---

## 4. How to Contribute Safely

### 4.1 General Principles

- **Native ESM, no build step**
  - All new code lives as plain JS modules under `express/code/**`.
  - Import Lit from the shared shim (`express/code/libs/color-components/deps/lit.js` or `lit-all.min.js` as configured), not from CDN or `node_modules` directly.

- **Three-phase loading (AEM EDS)**
  - **Eager** (initial render): hero copy, tab chrome, basic wheel shell only.
  - **Lazy** (on viewport): heavy canvas drawing, wheel markers, image extraction setup.
  - **Delayed** (>3s after LCP): any non-critical network, WASM init, or cloud calls (Autotag, Stock, Libraries).

- **Controllers own state, components are dumb**
  - Add behavior to `ColorThemeController` (or new controllers) instead of pushing logic into individual web components.
  - Components should:
    - Accept primitive props / controller references,
    - Emit events or call controller methods, **not** reach into global state.

### 4.2 Adding or Modifying Web Components

- **Location**
  - New components go under `express/code/libs/color-components/components/<component-name>/`.
  - Each component directory should have:
    - `index.js` – Lit element definition,
    - `styles.css.js` – exported `css` template tagged as `style`.

- **Registration & usage**
  - Component files self-register with `customElements.define('tag-name', ClassName)`.
  - Blocks import the component module once at the top of their JS to ensure registration:
    - Example from `color-tools.js`:  
      `import '../../libs/color-components/components/color-swatch-rail/index.js';`

- **Styling**
  - Component internals are styled via `styles.css.js` using Lit’s `css` helper.
  - Block-level layout and hero styling live in `express/code/blocks/color-tools/color-tools.css`.  
    Use block CSS only for:
    - Layout (grid/flex, spacing),
    - Typography and tabs,
    - Positioning of whole components.

### 4.3 Extending `ColorThemeController`

- Add new methods/events here when:
  - You need additional palette metadata (name, mood, source image, etc.).
  - You are wiring new quick actions (randomize, shuffle, lock behaviors).
  - You are introducing new analytics events for tool interactions.
- Keep the controller framework-agnostic:
  - No direct DOM access,
  - No Franklin-specific imports,
  - Only plain JS + `CustomEvent` / callback subscribers.

### 4.4 Working on Specific Areas

- **Marquee layout & tabs**
  - Update `color-tools.js` and `color-tools.css` to adjust hero copy, tab chrome, and responsive behavior.
  - Any new metadata should be documented in `color-tools-authoring.md` and parsed in the block or shared scripts.

- **Image extractor parity**
  - Replace `createImageExtractor()` with a dedicated `color-image-extractor` component that:
    - Encapsulates drop zone, zoom overlay, and draggable markers,
    - Uses a worker bridge to the existing image extraction logic from `colorweb-develop` / `ColorPicker`,
    - Feeds extracted palettes into `ColorThemeController`.

- **Analytics**
  - When adding new interactions, emit:
    - A semantic controller-level action (e.g., `controller.trackAction('image-extract', {...})`), and/or
    - A custom DOM event (`express:color-tools-action`) with a consistent payload shape.
  - Coordinate with the analytics owner to map these into Adobe Analytics.

### 4.5 Running, Testing, and QA

- **Run locally**
  - From `da-express-milo`, follow the standard Milo README instructions (e.g., `npm install`, `npm run hlx@up`).
  - Use the demo authoring page referenced in `color-tools-qa.md` to exercise the block.

- **Manual QA**
  - Before landing changes, walk through the scenarios in `express/docs/color-tools-qa.md`:
    - Wheel markers & harmony rules,
    - Image upload + palette sync,
    - Tab routing and responsive layout.

- **Tracking work**
  - Update `express/docs/color-tools-tracker.md` when:
    - A workstream is started or completed,
    - Major architectural decisions are made (e.g., how image workers are wired).
  - When in doubt, log a short note with links to PRs and relevant legacy files.

---

## 5. How This Doc Relates to the Other Docs

- **If you need *context* or risks**, start with `color-project-migration-gaps.md`.
- **If you need to know *what’s missing* vs. legacy**, use `color-tools-gap-report.md`.
- **If you are *authoring pages***, follow `color-tools-authoring.md`.
- **If you are *testing***, run through `color-tools-qa.md`.
- **If you are *owning the roadmap***, keep `color-tools-tracker.md` up to date.

This **dev handoff** doc is the glue between those resources and the actual code structure in `da-express-milo`. New contributors should be able to read this first, clone the right repos, and then dive into the deeper docs as needed.


