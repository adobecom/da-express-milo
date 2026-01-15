# Color Tools Gap Report

This document compares the legacy `/create/color-wheel` experience to the current `color-tools` block implementation in `da-express-milo`. It highlights the gaps that must be closed to reach the Figma-defined wheel‑palette marquee.

## 1. Shell & Routing

| Capability | Legacy (`colorweb-develop`) | Current (`da-express-milo`) | Gap / File References |
| --- | --- | --- | --- |
| Tabbed experience (Wheel, Image, Gradient, Accessibility) | `src/containers/Create/Create.jsx` renders Spectrum `TabView`; URL updates via `setRouteAndCreateStateOnTabSwitch`, analytics fired through `sendAdobeAnalyticsEvent`. | New marquee block only toggles between tabs defined locally in `color-tools.js`; no integration with global router or analytics pipeline. | Need routable tab controller (block + page-level routing). Files to update: `express/code/blocks/color-tools/color-tools.js`, `express/scripts/scripts.js` (to parse metadata), Franklin page authoring instructions. |
| Save workflows (CC Libraries) | `containers/SavePanel/SavePanel.jsx` stitched into `/create` shell; uses Redux state to persist palette drafts. | No save/export concept. | Define a new save surface or embed SavePanel equivalent. Requires API bridge (CC libraries) + CTA slots. |
| Quick actions tray | `containers/CreatePageQuickActions/CreatePageQuickActions.jsx` surfaces “Randomize”, “Complementary”, etc., backed by Redux actions. | None. | Controller must expose quick action methods and block layout needs CTA slot. |
| Hero/marquee layout | Complex SCSS + React authored layout, but tied to Create tab. | Recently added hero (`color-tools-marquee`) is basic; still lacks imagery, tab styling from Figma, responsive nuance. | Expand block CSS (`color-tools.css`) to match Figma node `3357-106564`; add metadata for hero text/media. |

## 2. Color Wheel Workspace

**Legacy**
- `src/containers/Colorwheel/Colorwheel.jsx` draws canvas + wheel markers (`components/Marker/WheelMarker.jsx`) and spoke geometry (`components/Marker/MarkerSpoke.jsx`).
- Harmony rule selector lives in `containers/HarmonyRuleSelector/HarmonyRuleSelector.jsx`.
- Swatch CRUD: `components/Swatch/**` (Add, Remove, ShowTints, TintGeneration, HexValue). Drag/drop uses Redux actions (`createActions.changeSwatchesOrder`).
- Color mode sliders + eyedropper: `containers/CreateSlidersAndLabels/CreateSlidersAndLabels.jsx`, `@adobecolor/react-eyedropper`.
- Quick actions + onboarding: `containers/CreateQuickActions`, `components/OnBoarding/OnBoardingTour`.

**Current Implementation (`express/code/blocks/color-tools/color-tools.js`)**
- Embeds `<color-wheel>` and `<color-palette>`.
- Harmony rule dropdown and `ColorThemeController` keep swatches in sync.
- Emits `express:color-selected` events.

**Gaps**
- No marker overlay or swatch-specific pointer handling (functionality in `WheelMarker` + `Spoke`).
- Missing swatch CRUD controls, tint sliders, copy-to-clipboard (files: `components/Swatch/*.jsx`, `containers/CreateSlidersAndLabels`).
- No eyedropper integration or color-mode toggles.
- Missing quick actions / onboarding flows.
- SavePanel + CC Libraries not wired (requires analog to `containers/SavePanel` + `saveActions`).
- `color-wheel` web component lacks indicator UI from Figma (needs styles + controller-fed state).

## 3. Image Extraction & Gradients

**Legacy**
- Image extraction: `src/containers/CreateFromImage/CreateFromImage.jsx`.
  - Drop zone (`@react/react-spectrum/DropZone`), mood selector (`containers/MoodSelector/MoodSelector.jsx`), zoom overlay, `ImageMarker`.
  - Color extraction executed via `utils/ThreadPool` workers; results written to Redux swatches + tag suggestions.
- Gradient extractor: `containers/CreateGradientFromImage/CreateGradientFromImage.jsx` + WASM pipeline.
- Accessibility tab: `containers/AccessibilityTools/AccessibilityTools.jsx`.

**Current**
- Lightweight canvas sampler inside `createImageExtractor` (new marquee tab) – no zoom, mood selector, or accurate clustering.
- No gradient or accessibility tools.

**Gaps**
- Need worker bridge to existing extraction logic (`ThreadPool.queueTask`, ingestion events).
- Marker UI + zoom overlay (see `components/Marker/ImageMarker.jsx`).
- Mood selector + quick actions.
- Gradient tab + accessibility tab variants.
- Tagging + analytics instrumentation.

## 4. State & Data Flow

- **Legacy** (`src/reducers/create/`, `createActions.js`):
  - Redux holds `swatches`, `markers`, `activeSwatch`, `colorMode`, `colorMood`, ingest workflow, CC library metadata.
  - HarmonyEngine manipulates store via actions (`setSwatch`, `setMarker`).
- **Current**: `ColorThemeController` centralizes swatches + HarmonyEngine state but lacks metadata (theme name, mood, analytics context).
- **Gaps**:
  - Need controller extensions for theme metadata, analytics hooks, ingest workflow stack.
  - Need persistence layer (localStorage or Franklin state) so reloads maintain palette.
  - Need event bus for SavePanel integration.

## 5. Authoring & Styling

- **Legacy**: Not authorable; hard-coded React layout.
- **Current**: `Color Tools (wheel-palette-marquee)` block exists but only a subset of hero metadata is configurable; no imagery slot; Figma design (node `3357-106564`) shows pill-style tab nav and refined spacing.
- **Gaps**:
  - Add metadata parsing in `express/scripts/scripts.js` for hero copy, CTAs, default tab, hero media.
  - Extend `color-tools.css` to match Figma spacing, typography, pill buttons, palette card.
  - Document authoring contract (`express/docs/color-tools-authoring.md`) – needs expansion to cover imagery, quick actions, analytics channel, etc.

## 6. Required Parity Workstreams

1. **State Controller Enhancements**
   - Add metadata handling, analytics hooks, quick action APIs to `ColorThemeController`.
   - Provide persistence + SavePanel bridge.

2. **Component Enhancements**
   - Augment `<color-wheel>` with markers, spokes, base indicators.
   - Build reusable swatch list web component for CRUD, tints, sliders.
   - Expose eyedropper + quick actions via controller.

3. **Marquee Block & Variants**
   - Finish `Color Tools (wheel-palette-marquee)` design per Figma.
   - Plan variants (`image-marquee`, `accessibility-marquee`) sharing same controller.

4. **Image / Gradient / Accessibility Tools**
   - Port extraction UI (drop zone, mood selector, markers) to native ESM components.
   - Hook to real image-processing workers.

5. **Routing & Analytics**
   - Integrate block-level tabs with Franklin routing (hash/query) AND page-level analytics ingest.
   - Mirror legacy `sendAdobeAnalyticsEvent` semantics.

6. **Authoring + Documentation**
   - Expand `color-tools-authoring.md` with metadata tables, slot descriptions, imagery guidelines.
   - Provide demo page(s) for reviewers.

This gap list will guide the subsequent todos (component parity, block implementation, tabs/routing, etc.).

