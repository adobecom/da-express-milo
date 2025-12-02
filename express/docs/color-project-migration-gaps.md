# Color Project Migration Gaps (ColorWeb → Franklin `color-tools`)

This document captures the main technical gaps and risks when lifting functionality from:

- `colorweb-develop` (legacy React + Redux + Node/Express SSR app)
- `ColorPicker` mono-repo (`@adobecolor/web-components`, image tools, eyedropper, etc.)
- `ImgContrastRatio-master` (Python-based color-vision / contrast tooling)

into the **buildless** AEM Franklin environment used by `da-express-milo` (notably the `color-tools` block and `color-components` library).

---

## 1. Runtime & Backend Environment

### 1.1 Legacy (`colorweb-develop`)

- **Local runtime:**
  - Node/Express SSR server (`server/index.js`) renders React and preloads data.
  - Webpack-built client bundle (`src/**`) hydrates in the browser.
- **Backend dependencies (remote services):**
  - Ethos theme APIs, Kuler legacy APIs.
  - CC Libraries (save/export), Behance, Universal Search, Autotag, Stock.
  - Ingest / Adobe Analytics, IMS/Auth, User Feedback Lambda, VADER logging.
- **Secrets/config:**
  - Centralized in `config/config.js` (+ stage/QA overrides).
  - SSR makes authenticated/credentialed HTTP calls using environment-provided keys.

### 1.2 Target (`da-express-milo` / Franklin)

- **Buildless constraints:**
  - No long-running Node/Express SSR process per page; HTML is authored + decorated on the edge via Franklin’s JS pipeline.
  - Blocks are plain ESM modules (`export default async function init(el)`) loaded in the browser.
  - Heavy processing and third‑party network calls must respect AEM EDS three‑phase loading rules (Eager/Lazy/Delayed).
- **Backend/service access:**
  - Any calls to Ethos, CC Libraries, etc. must originate from:
    - Client-side JS (subject to CORS, auth cookies), or
    - Small serverless/edge functions configured in the Helix/Franklin project.
  - Secrets are typically provided via **GitHub/Vercel/Helix env vars** and NOT bundled into client JS.

### 1.3 Gaps / Risks

- **Config surface:**
  - Need a Franklin-friendly configuration layer (e.g. `.env` / Helix secrets + lightweight config module) to replace `config/config.js`.
- **Auth & cookies:**
  - IMS / Access Platform expectations from `colorweb-develop` may not be fully mirrored in the Franklin shell.
  - CC Libraries and some Ethos flows depend on IMS cookies + internal headers; those may be hard to reproduce purely from the edge.
- **Logging & analytics:**
  - Existing VADER logging and ingest pipelines in `colorweb-develop` assume a Node server; Franklin will instead need:
    - Browser‑only ingest calls, or
    - Helix functions as a logging proxy.

---

## 2. “Troublesome” Backend Areas in a Buildless Env

### 2.1 CC Libraries & Save Workflows

- **Legacy behavior:**
  - Save panel and Libraries integration live in containers like `SavePanel`, powered by Redux and server-side config.
  - Uses internal CC Libraries APIs that expect authenticated IMS context and possibly special headers.
- **In Franklin:**
  - Pure browser calls may hit CORS/auth walls unless:
    - The page is served under the same IMS/auth domain envelope, and
    - APIs explicitly support browser calls from the new origin.
  - Otherwise we need Helix functions as a secure proxy with secrets supplied by GitHub/Helix.
- **Risk:** High — this is one of the least “portable” aspects; fully re-enabling Libraries in a buildless environment may require coordination with platform teams or a dedicated service layer.

### 2.2 Ethos / Kuler / Search / Autotag / Stock

- **Legacy:**
  - SSR prefetches data (themes, gradients, tags) and passes hydrated Redux state to the client.
- **In Franklin:**
  - We lose server-side data shaping and must:
    - Fetch on the client inside blocks (respecting Eager vs Lazy vs Delayed), or
    - Use Helix functions for aggregation.
- **Risk:** Medium — mostly a question of performance and auth. Feature parity is achievable, but LCP/AEM EDS rules must be observed.

### 2.3 Analytics / Ingest

- **Legacy:**
  - Centralized ingest pipeline (INGEST_ENDPOINT metadata, `sendAdobeAnalyticsEvent` patterns).
- **In Franklin:**
  - Some wiring already exists (`express:color-tools-*` events), but:
    - We still need a clear bridge from these custom events to Adobe Analytics / Ingest.
    - Certain ingestion routes may require server-side signing/proxying.
- **Risk:** Medium — solvable, but needs a defined “analytics adapter” layer for Franklin.

---

## 3. `ImgContrastRatio-master` – Python & Portability

### 3.1 What’s in `ImgContrastRatio-master`

- Under `dev/`:
  - `CVD.py` uses `colour`, `numpy`, and `matplotlib` to:
    - Draw the CIE 1931 chromaticity diagram.
    - Define confusion points for protan/deutan/tritan color vision deficiency.
    - Compute line–circle intersections and derive vectors (`CP_*`, `I*_*`, `P*_*`) for simulating CVD in shader space.
- Under `docs/`:
  - HTML dev docs and assets (`ImgContrastRatio.htm`, `ImgContrastRatio-dev.htm`), plus WebGL support (`webgl-utils.js`).

### 3.2 Is the Python runtime required?

- **No** for production usage:
  - `CVD.py` is essentially an **offline numeric tool** to generate constants and visualizations.
  - The end product is typically a set of numeric parameters embedded in JS/WebGL shaders, not a Python service that must run in prod.

### 3.3 Can it be ported to JavaScript?

- **Yes, conceptually straightforward:**
  - The math in `CVD.py` (line intersection, circle intersection, Euclidean distances, chromaticity calculations) can be replicated with:
    - Plain JS + `Math` and `Float32Array`s, or
    - A light numeric helper (e.g., `gl-matrix`) if desired.
  - Any **static calibration numbers** produced by `CVD.py` could be precomputed once and hard-coded into a JS module or shader.
- **Considerations for Franklin:**
  - Heavy visualization (CIE diagrams, etc.) should not run in Eager phase; if used at all, it should be:
    - Rendered lazily in non-critical UI, or
    - Prebaked as static images/diagrams in docs, with only lightweight JS in the block.

---

## 4. Image Upload & Color Extraction Features

### 4.1 Legacy Implementations

- **In `colorweb-develop`:**
  - `CreateFromImage` and `CreateGradientFromImage` containers handle:
    - Drag/drop or file input.
    - Image decoding and resizing (often via `@techstark/opencv-js` and custom WASM).
    - Worker-based clustering and gradient extraction (`utils/ThreadPool`).
  - Results are written to Redux (swatches, tags, gradients).
- **In `ColorPicker` packages:**
  - Web components (e.g. in `web-components`, `ccx-colorpicker`) expose:
    - `<color-wheel>` and `<color-palette>`.
    - Image-based extraction and palette generation utilities.

### 4.2 Portability to Franklin / Plain JS

- **Good news:** These flows are already front-end driven; there is **no backend requirement** for:
  - Reading a local image file.
  - Sampling pixel colors via `<canvas>` or WASM.
  - Computing clusters, tints, and derived palettes.
- **What’s needed:**
  - Reuse or refactor the existing JS/WASM pieces into:
    - Standalone ESM modules (e.g., under `express/code/libs/color-components`), and/or
    - Enhanced web components that encapsulate the heavy lifting behind a clean DOM API.
  - Integrate with `ColorThemeController` so palettes produced by image tools stay in sync with the wheel + marquee.
- **Constraints in Franklin:**
  - Respect three‑phase loading:
    - **Eager:** Only minimal UI shell and LCP elements (hero text, tabs, basic wheel scaffold).
    - **Lazy:** Initialize image extraction logic once the block is visible.
    - **Delayed:** Any non-critical network calls or large WASM initializations.
  - Ensure image processing is entirely client-side; no server upload is needed unless advanced cloud services (e.g., Autotag) are required.

### 4.3 When Cloud Services Are Needed

- Some advanced behaviors (e.g., Autotag, theme search against Ethos) **do** require backend services:
  - These can be accessed either:
    - Directly from the browser (if CORS & auth permit).
    - Via Helix functions (edge/serverless) using env-provided secrets.
  - For buildless parity, we should aim to:
    - Keep basic extraction local.
    - Gate optional cloud-enhanced features behind feature flags and robust error handling.

---

## 5. Specific “Troublesome vs. Safe” Areas

### 5.1 Safer / Straightforward to Port

- **Pure UI & state:**
  - Tabbed shell, quick actions, marquee layout (`color-tools` block + CSS).
  - Wheel + palette coordination (`ColorThemeController`).
  - Local palette persistence (e.g., `localStorage`).
- **Client-side image tools:**
  - Basic image upload, palette extraction, gradient sampling.
  - Color vision simulation that only depends on precomputed constants.
- **Contrast tools front-end:**
  - APCA/WCAG contrast calculations implemented in JS.

### 5.2 Potentially Troublesome / Unavoidable Complexity

- **CC Libraries + Save workflows:**
  - High coupling to Adobe internal APIs, auth, and analytics; may not be 1:1 portable without backend support.
- **IMS / Access Platform integration:**
  - Ensuring the Franklin shell reproduces the same authentication context used by `colorweb-develop`.
- **Server-side orchestration logic:**
  - SSR-specific behavior (e.g., preloading theme data, shaping Redux state, logging to VADER) has to be rethought as:
    - Client-side fetches, and/or
    - Helix functions with smaller scope.

---

## 6. Recommended Migration Approach (High-Level)

1. **Treat all heavy backend integrations as separate workstreams:**
   - CC Libraries/Save, Ethos prefetching, analytics, Autotag/Stock.
2. **Prioritize front-end parity within Franklin:**
   - Close gaps listed in `color-tools-gap-report.md` for:
     - Wheel marker behavior, swatch CRUD, tints, quick actions.
     - Image extraction and gradient tools using local JS/WASM.
3. **Isolate config/secrets early:**
   - Define a small configuration module in `da-express-milo` that reads env + Helix secrets and exposes a minimal contract to blocks/libs.
4. **For Python-based tools (`ImgContrastRatio-master`):**
   - Extract necessary numeric constants via one-time runs of `CVD.py`.
   - Reimplement any remaining math in JS modules, scoped to non-critical phases (Lazy/Delayed) or offline docs/demos.

This document should be kept in sync with `color-tools-gap-report.md` and updated as backend integration decisions for CC Libraries, Ethos, and analytics are finalized.





