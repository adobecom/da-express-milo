# Legacy Create / Color Wheel Experience Audit

This document captures the behaviors implemented by the legacy `colorweb-develop` app under `/create/color-wheel` and its sibling tabs. It will serve as the parity checklist for the Color Tools lift‑and‑shift work in `da-express-milo`.

## 1. Routing & Page Shell

- **Entry point**: `CreateRouter.jsx` mounts `Create.jsx` for `/create/color-wheel`, `/create/image`, `/create/image-gradient`, `/create/color-accessibility`, etc. Initial navigation redirects `/create` to `/create/color-wheel`.
- **Tabs & URLs**: `Create.jsx` renders a Spectrum `TabView`. Tab changes call `setRouteAndCreateStateOnTabSwitch`, pushing locale-aware URLs (e.g., `/en/create/image`). Query-less routes uniquely identify each tool; analytics events fire via `sendAdobeAnalyticsEvent`.
- **Shared chrome**: `Create.jsx` wraps all tabs with:
  - `CreatePageQuickActions` (CTA shortcuts) on desktop when the Color Wheel workflow is active.
  - `SavePanel` pinned alongside the tools. It consumes ingest context to enable saving palettes/themes to CC Libraries.
  - `Helmet` metadata per tab (title, canonical, descriptions).
- **State bootstrap**: Each tab selection sets `create` reducer state via `setCreateInitialState`, toggling workflow enums (`CREATE_WORKFLOW.COLORWHEEL`, `.IMAGE`, `.ACCESSIBILITY`, etc.) that downstream components rely upon.

## 2. Color Wheel Tab (`Colorwheel.jsx`)

- **Rendering approach**: Extends `UpdatedCreatePageViewLayout`, which manages the two-pane layout (canvas + controls). Uses SCSS module `Colorwheel.scss`.
- **Canvas & markers**:
  - Draws the color wheel via `drawColorwheel` util on a `<canvas>` the size of `DEFAULT_COLORWHEEL_RADIUS`.
  - Adds `WheelMarker` and `Spoke` React components positioned over the canvas. Markers track swatch order (`create.order`), emit drag interactions, and bind to HarmonyEngine.
- **Harmony engine integration**:
  - Imports `HarmonyEngine.jsx` (the React/Redux-friendly wrapper around the same logic we ported to `express/code/libs/color-components/utils/harmony/HarmonyEngine.js`).
  - `onSwatchValueChange` updates Redux swatches, then calls `harmonyEngine.setNewTheme(...)` and `.onColorChange(index)` to recalc dependent colors.
- **Control stack**:
  - `HarmonyRuleSelector` (dropdown) – parity requires a reusable component to change rule + propagate to HarmonyEngine.
  - `ColorModeSelectorWithLabel` – toggles between RGB/HSV/other sliders.
  - `CreateQuickActions` – set of buttons (e.g., “Randomize”, “Complementary”) that mutate swatches via Redux actions.
  - `CreateSlidersAndLabels` / `ShowSlidersAndLabels` – collapsible sections per swatch to tweak H/S/B, etc.
  - `ShowTints` & `TintGeneration` – generate tint rows when toggled.
  - `EyeDropperBtn` (from `@adobecolor/react-eyedropper`) – hooks into OS picker.
  - `BaseSwatchIndicator` – sets which swatch drives harmony computations.
- **Palette area**:
  - `Swatch`, `AddSwatch`, `RemoveSwatch` components support up to `MAX_NUMBER_OF_SWATCHES`.
  - Drag-and-drop reorder via `changeSwatchesOrder`.
  - Hex editors, copy interactions, quick actions.
- **Analytics & onboarding**:
  - `fireIngestEvent` logs default workflow entry plus specific interactions (copy hex, add swatch, etc.).
  - Onboarding tours/coachmarks integrate with `OnBoardingTour`, cookies (`ON_BOARDING` constants), and notifications.
- **Save integration**: On state changes, `create` reducer updates theme name, mood, etc., making SavePanel aware of unsaved changes.

## 3. Image Tab (`CreateFromImage.jsx`)

- **Workflow**:
  - Drag-and-drop or file picker loads an image via `FileReader`, stored in Redux for persistence between tab switches.
  - Canvas rendering uses natural image size with responsive scaling and a zoom overlay near the active marker.
  - Colors extracted using `ThreadPool.queueTask` to offload clustering (k-means style) with mood-aware parameters.
  - Resulting `swatches` & marker positions stored via `setSwatchesAndMarkers`.
- **Controls**:
  - `MoodSelector` (list or dropdown) influences extraction algorithm.
  - `CreateQuickActions` reused on tablet/down view.
  - Replace image button, drop zone instructions, and copy-to-clipboard interactions for each hex.
  - Marker interactions powered by `ImageMarker` components (draggable sampling points with zoom preview).
- **Analytics**: `fireIngestEvent` logs default load, drag/drop events, hex copies, etc.
- **SEO text & personalization**: `SeoTextComponent` exposes copy blocks for logged-out users; toggles differ on mobile/desktop.

## 4. Additional Tabs (Gradient & Accessibility)

- `CreateGradientFromImage` mirrors much of `CreateFromImage` but controls gradient-specific extraction (multi-stop gradient creation, thread pool usage, mood changes).
- `AccessibilityTools` provides contrast analyzer, accessible palette suggestions, etc., and only renders on desktop (mobile routes show an error/placeholder).
- Both share the SavePanel + ingest workflows, ensuring parity for analytics and CC Libraries integration.

## 5. Shared Dependencies & Redux Contracts

- **Redux slices**:
  - `create` reducer stores swatches, markers, active swatch, color mode, mood, workflow metadata, ingest workflow chain, and CC library editing flags.
  - `user` reducer exposes locale, feature flags, login state.
  - Actions include `setSwatch`, `setMarker`, `setActiveSwatch`, `setColorMode`, `setColorMood`, `fetchSuggestedTags`, `setThemeNameAndIsUserEnteredName`, `manageImageForExtraction`, etc.
- **Utilities**:
  - `utils/util.js` (legacy) hosts helpers we already need (preventDefault, right-click detection, copy, etc.).
  - `utils/ThreadPool` orchestrates web worker tasks for color extraction.
- **Analytics**:
  - `components/Analytics/Ingest` defines ingest event constants and `fireIngestEvent`.
  - Adobe Analytics events sent per workflow step; parity requires equivalent instrumentation or stub hooks.
- **Save & Libraries**:
  - `containers/SavePanel/SavePanel.jsx` uses `ingestWorkflow` context and interacts heavily with CC Libraries (create/update theme, login gating, notifications).
  - `saveActions` include `cclibraryUpdateThemeFlow`, `setEditWorkflow`, etc., which are triggered from Create tab components.

## 6. Key Parity Requirements for `da-express-milo`

1. **Tabbed shell with routable URLs** (Color Wheel, Image, Gradient, Accessibility) and analytics hooks.
2. **Harmony-driven wheel UI** with:
   - Canvas wheel + draggable markers/spokes.
   - Harmony rule selector, color mode toggles, quick actions, eyedropper.
   - Swatch CRUD (add, remove, reorder) + tint/sliders panels.
3. **Palette extraction from image**:
   - Drag/drop + picker flow, mood selector, draggable sampling markers, zoom feedback, swatch list with copy.
4. **Save/export pathways** (even if initially stubbed) and ingest telemetry.
5. **Authorable hero/marquee** matching Figma design but still embedding reusable wheel/palette components without invasive styling.
6. **Extensibility for future experiences** (e.g., Image marquee variant) by keeping the new block modular and data-driven.

The next step is to compare this capability matrix against what currently exists in `express/code/blocks/color-tools/` and log explicit gaps.

