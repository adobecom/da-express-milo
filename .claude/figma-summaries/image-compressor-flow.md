# Figma Summary — Image Compressor Flow
Source: https://www.figma.com/design/EAYzMQMVbBiP16wHXrSP4o/shairilk-2?t=LYwfG07fBsW3ncLC-0
Fetched: 2026-04-24

## Page Overview

| Node ID | Name | Role | Description |
|---|---|---|---|
| 0:466 | Image compressor | design_frame | Full desktop page mockup — marketing page (da-express-milo) with an embedded quick-action panel in the loaded / post-upload state |
| 0:650 | Screenshot 2026-02-27 at 12.44.41 PM 1 | reference_screenshot | Pasted PNG of a mobile/in-product "Compress" panel showing preset Medium/High/Low radio cards + "Compress" CTA — labeled "In-product references". This is NOT part of the marketing page; it is an existing in-product pattern for reference only |
| 0:651 | cover | cover | Figma file thumbnail ("Image compressor" large text on dark bg) — ignored |
| 0:654 | Screenshot - TOU | reference_screenshot | Screenshot of the Terms-of-Use modal that appears **inside the Adobe Express editor iframe (Horizon)** after the user clicks "Open in Adobe Express". Not built by da-express-milo |
| 0:656 | Screenshot - LOE | reference_screenshot | Screenshot of the existing Adobe Express editor image-edit experience (Image panel + Learn panel) — shown as the "existing flow coming from Image Resize quick action". This is inside the Express editor iframe, not the marketing page |
| 0:659 | Screenshot 2026-03-03 at 9.18.46 AM 1 | reference_screenshot | Pasted PNG of the existing Express in-app Download modal (File format, Recommended, Size slider, "Parts of your file might appear blurry" warning, Order prints) — labeled "In-product references" |
| 0:660 | Screenshot 2026-03-03 at 9.22.52 AM 1 | reference_screenshot | Pasted PNG of the existing Express in-app "Resize image" standalone quick action (Aspect ratio, Width/Height, Quality, Original/New size, Reset, Download, Open in editor) — in-product reference showing the layout pattern the compressor copies |
| 0:661 | In-product references | flow_annotation | Label text sitting above nodes 0:650, 0:659, 0:660 grouping them as existing in-product references |
| 0:662 | Existing flow coming from "Image Resize" quick action | flow_annotation | Label text sitting below the TOU → LOE reference screenshots, noting the TOU → editor flow is existing behaviour inherited from Image Resize |
| 0:663 | Image compressor → Screenshot - TOU | flow_annotation | Connector arrow: marketing page flows into TOU modal on "Open in Adobe Express" click |
| 0:664 | Screenshot - TOU → Screenshot - LOE | flow_annotation | Connector arrow: TOU modal flows into the Express editor LOE state after user agrees |

---

## Frames to Build

### Image compressor — marketing page (node 0:466)
**Role:** design_frame
**Platform:** desktop (1280px wide frame, frame height 1121px)
**Part of:** da-express-milo marketing page (NOT inside the Express editor iframe). Everything in this frame is code that da-express-milo owns.

**Visible text content:**
- Global Adobe nav: "Creativity & Design" (active, underlined), "Adobe Express", "Create", "Edit", "Print", "Business", "Education", "Plans"
- Top-right nav CTAs: "Go to Adobe Express" (blue pill), app-switcher icon, "Sign in" (outlined pill)
- Breadcrumb: "Home / Feature / Image Compressor"
- Adobe Express logo (centered, above heading)
- H1: **"Free image compressor."**
- Sub-copy: **"Easily compress your images in one click using Adobe Express, the quick and easy create-anything app. Use the online photo compressor to instantly change the file size of any image to share across your social channels."**
- Picker label: **"File format"**
- Picker default value: **"PNG (Best for images)"**
- Badge under picker: **"Recommended"** (with circle-check icon)
- Slider label: **"Size"**
- Slider value field: **"50%"**
- Readout (regular weight): **"Original size:  293 KB"**
- Readout (bold): **"New size:  145 KB"**
- Reset button: **"Reset"** (with revert icon; shown disabled — gray text `#c6c6c6`)
- Primary CTA (secondary style): **"Download"**
- Primary CTA (primary style): **"Open in Adobe Express"**
- Trust badges (with pink check icons): **"Free to use"**, **"No credit card required"**

**Interactive controls (loaded / post-upload state only — no upload CTA is visible in this frame):**
| Control | Type | Default state | Notes |
|---|---|---|---|
| File format | picker / dropdown | "PNG (Best for images)" | Spectrum Picker M; chevron on right; "Recommended" badge shown below when current selection is the recommended format |
| Size | slider with paired numeric input | 50% (slider centered, value field shows "50%") | Spectrum Slider M; value field is 56px wide with border; percentage units |
| Reset | action button | **disabled** (gray text `#c6c6c6`, light-gray fill `#e9e9e9`) | Has revert icon; enabled when user has changed format/size from defaults |
| Download | button (secondary / outlined) | enabled; white fill, 2px border `#dadada`, black text `#292929` | Triggers client-side download of compressed image |
| Open in Adobe Express | button (primary / filled) | enabled; fill `#3b63fb`, white text | Triggers TOU modal → Express editor open (existing Image-Resize-style flow) |

**Layout:**
- Full-width page, 1280px design frame.
- Sticky header (height 97px): top row is main Adobe global nav (height 64px, bg `#f8f8f8`, border-bottom `#eaeaea`), bottom row is breadcrumb (height 34px).
- Centered hero section under header: Adobe Express logo, then H1 centered, then sub-copy constrained to 720px.
- Quick-action panel sits in a full-width light-gray (`#f8f8f8`) section that is 1240px × 700px, padded 32px.
- Panel is two-column inside a 1240px container:
  - Left column: image preview card — bg `#e9e9e9`, rounded `12px`, 800px wide × 554px tall, image centered (626×417).
  - Right column at `left: 819px` (i.e. 27px gutter after the preview card), 321px wide. Stacked from top: Picker (32px from top), Slider (138px), size readouts (214px and 246px), Reset button (anchored top-right of the readout row), CTA row (294px): [Download] [Open in Adobe Express], trust badges row (372px): [Free to use] [No credit card required].
- The outer section has `data-node-id` describing `standalone-quick-action → qa-app-root → hz-context-provider-locator` — confirming the panel is rendered by the **Horizon / Express standalone quick-action SDK** embedded in the marketing page (same pattern as Image Resize).

**Colors:**
- Page bg: `#ffffff`
- Header / panel section bg: `#f8f8f8`
- Header border: `#eaeaea`
- Image preview card bg: `#e9e9e9`
- H1 text, body text: `#242424`
- Nav text, button text: `#292929`
- Breadcrumb link text: `#707070`, separators `#2c2c2c`
- Primary CTA fill ("Open in Adobe Express", "Go to Adobe Express"): `#3b63fb`
- Primary CTA text: `#ffffff`
- Secondary CTA border ("Download", "Sign in"): `#dadada` (2px)
- Field label text: `#505050`
- Picker/value-field surface: `#e9e9e9`
- Slider track (unfilled): `#dadada`; track (filled) + dragger `#292929`
- Recommended icon color: `#5258e4`
- Disabled Reset text: `#c6c6c6`
- Trust-badge check icons: pink/magenta (Adobe brand accent — asset only, no hex in source)

**Typography:**
- H1 "Free image compressor.": `Adobe Clean Black`, 45px, line-height 58.5px, centered, color `#242424`
- Sub-copy: `Adobe Clean Regular`, 16px, line-height 24px, centered, 720px max-width, color `#242424`
- Nav link (active "Creativity & Design"): `Adobe Clean Bold`, 14px / line-height 19.6px, color `#292929`
- Nav link (inactive): `Adobe Clean Regular`, 14px / line-height 19.6px, color `#292929`
- "Go to Adobe Express" button label: `Adobe Clean Bold`, 15px, white
- "Sign in" button label: `Adobe Clean Bold`, 14px / line-height 16.8px, color `#292929`
- Breadcrumb text: `Adobe Clean Regular`, 12px, line-height 33px
- Field labels ("File format", "Size"): `Adobe Clean Regular`, 14px, color `#505050`
- Picker value ("PNG (Best for images)"), slider value ("50%"): `Adobe Clean Regular`, 14px, color `#292929`
- "Recommended" text: `Adobe Clean Regular`, 14px, color `#222`
- "Original size:" / "293 KB": `Adobe Clean Regular`, 15px / line-height 24px, color `#292929`
- "New size:" / "145 KB": `Adobe Clean Bold`, 15px / line-height 24px, color `#292929` (bold — the updated value is emphasised)
- "Reset" text (when disabled): `Adobe Clean Regular`, 14px, color `#c6c6c6`
- "Download", "Open in Adobe Express" button labels: `Adobe Clean Bold`, 16px, line-height 19.2px
- "Free to use" / "No credit card required": `Adobe Clean Regular`, 18px, line-height 27px, color `#292929`

**Component names (from Figma layer tree — these map to Spectrum / Horizon components):**
- `Picker M` (Spectrum Picker M) — https://storybooks.stage.hz.adobe.com/?path=/story/parameterized-ui_picker--picker
- `Slider M` (Spectrum Slider M, "Without steps" variant) — https://storybooks.stage.hz.adobe.com/?path=/docs/spectrum-web-components_slider--docs
- `Field label L`
- `.UI Chevron Button` with `S2_Chevron`
- `SX_CheckmarkCircle_18_N` (Recommended icon; also the trust-badge icons)
- `Button - Download`, `Button - Open in Adobe Express` (custom buttons on the marketing page, not standard Spectrum)
- `standalone-quick-action / qa-app-root / hz-context-provider-locator / qa-app / sp-theme` — the wrapping container is the Horizon "standalone quick action" SDK shell. This is the same wrapper used by other FQA blocks (e.g. Image Resize) — da-express-milo hosts a `<qa-standalone-app>` root and the Horizon web component renders the Picker / Slider / readouts / buttons inside it.

**Designer annotations:**
- None inside this frame. Adjacent text nodes on the canvas (`0:661` "In-product references", `0:662` "Existing flow coming from 'Image Resize' quick action") clarify that the right-side screenshots are references and that the TOU → LOE transition is inherited from the existing Image Resize quick-action flow.

**Journey phases covered by this frame:**
- Post-upload / loaded state (image loaded, compression controls active, Original/New size calculated, CTAs enabled).

**Journey phases NOT designed in this frame:**
- Initial / empty state with an "Upload your photo" dropzone (no upload CTA appears — the mock jumps straight to the loaded state). The marketing-page upload entry-point pattern is presumed to follow the existing FQA dropzone convention.
- Loading / processing state while compression runs (no spinner / skeleton designed).
- Error state (no error copy designed; e.g. unsupported format, file too large, compression failure).
- Mobile layout of the marketing page (no mobile-width frame present).
- Post-download confirmation / success state on the marketing page (no toast / message designed).

---

## Reference Frames — Do Not Build

### Screenshot 2026-02-27 at 12.44.41 PM 1 (node 0:650) — "Compress" preset panel
**Depicts:** An existing in-product (mobile or panel-style) "Compress" UI with three preset radio cards: **Medium** ("Balanced quality, size, and speed." — selected by default), **High** ("Sharper image, larger file, and a slower process."), **Low** ("Fastest process, smallest file, lowest quality. Great for messages."), and a black pill CTA **"Compress →"**.
**Relevance:** This is a pasted bitmap screenshot, not editable Figma layers. It is placed under the **"In-product references"** annotation (0:661) along with 0:659 and 0:660. It shows an alternate preset-based compression pattern that exists elsewhere in the Adobe Express product — included for context / inspiration, not as the design for this marketing page. The marketing-page panel (0:466) uses a **slider + percentage** approach instead of preset cards.
**Location:** Inside the Express product — NOT on the da-express-milo marketing page.

### Screenshot - TOU (node 0:654)
**Depicts:** The Adobe Express Terms-of-Use modal that appears inside the Express editor iframe after a user clicks "Open in Adobe Express". Text reads: "Take your image further with Adobe Express. Now that you have removed the background from your image, try making something new with it." and "To save or download projects, create an account or sign in. Please agree to the Adobe Terms of Use and Privacy Policy to start creating." CTA: **"Agree to continue"** (note: the visible copy references "removed the background" — this is a screenshot from the remove-background flow; the same TOU pattern applies to image-compress).
**Relevance:** Existing Express editor behaviour inherited from the Image Resize quick action (per annotation 0:662). Connector arrow 0:663 links the marketing page → TOU. **This is not built by da-express-milo** — it is rendered by the Express editor iframe (Horizon) when the SDK opens. Flagged as the hand-off point between marketing-page code and editor code.

### Screenshot - LOE (node 0:656)
**Depicts:** The Adobe Express editor "learn-on-editor" state — Image panel on the left with Edit/Effects/Animation tabs and swatches (Remove background, Erase, Remove object, Insert object, Set background, Generate similar, Auto enhance, Adjust, Corners, Position, Opacity), the user's image in the canvas, and a Learn panel on the right ("How to edit an image") with guided steps.
**Relevance:** Existing Express editor experience the user lands in after agreeing to TOU (per annotations 0:662 and connector 0:664). **Not built by da-express-milo.** This is the Express editor iframe (Horizon) continuing the session.

### Screenshot 2026-03-03 at 9.18.46 AM 1 (node 0:659) — In-product Download modal
**Depicts:** The existing Express in-app **Download** modal from within the editor. Contents: "Download" title, "File format" picker with "PNG (Best for images)", "Recommended" badge with check, "Size" slider (showing 844 × 1,000 px, value field 1.25), warning triangle with **"Parts of your file might appear blurry at this size."**, primary **"Download"** CTA (blue/purple, full-width), and an **"Order prints"** row with a NEW badge.
**Relevance:** In-product pattern reference (grouped under "In-product references" annotation 0:661). Shows the Spectrum Picker + Slider + warning + Download button pattern that the marketing-page image-compressor panel is adapting. **Not built by da-express-milo.**

### Screenshot 2026-03-03 at 9.22.52 AM 1 (node 0:660) — Existing "Resize image" standalone quick action
**Depicts:** The existing Express **Resize image** standalone quick action as seen in-product — full modal over the Express home: left column shows the image preview, right column shows "Resize image" panel with Aspect ratio picker ("Custom"), Width/Height number inputs with lock icon + px unit, **Quality** slider (shown at 53%), **Original size: 251 KB**, **New size: 63 KB**, a **Reset** button, and primary/secondary CTAs **"Download"** and **"Open in editor"**. A "Zoom" slider and **"Quality Compare"** button run along the bottom of the preview.
**Relevance:** This is the **direct in-product precedent** for the image-compressor marketing page (0:466). The marketing page reuses the same right-column layout (File format → Size/Quality slider → Original/New size → Reset → [Download][Open in editor] CTAs) and the same wrapping `<qa-standalone-app>` / `<standalone-quick-action>` SDK shell. **Not built directly — this is the blueprint.** The marketing-page delta is: (a) simplified controls (File format + Size% only — no Width/Height / Aspect ratio), (b) renamed secondary CTA "Open in editor" → "Open in Adobe Express", (c) marketing chrome (nav, breadcrumb, hero heading, trust badges) wraps the panel.

---

## Component States

No dedicated `component_library` node exists in this file — the Picker, Slider, buttons, and icons are instances from the Spectrum/Horizon component library but their state variants (hover, loading, error, etc.) are NOT mocked anywhere on the canvas.

States that can be inferred from what IS shown:

### Picker "File format" (node 0:641 / instance 0:642, Spectrum `Picker M`)
| State | Value | Notes |
|---|---|---|
| default / loaded | "PNG (Best for images)" with chevron down | Below picker: "Recommended" text + solid circle-check in Adobe accent `#5258e4` indicates the currently-selected format is flagged as recommended |
| selected-is-recommended | shows the "Recommended" badge row | Hide this row when user selects a non-recommended option |
| other states (hover / open / disabled / error) | not designed | Follow Spectrum `Picker M` defaults per the linked storybook |

### Slider "Size" (node 0:649, Spectrum `Slider M` without-steps variant)
| State | Value | Notes |
|---|---|---|
| default | 50% — dragger mid-track, left half filled `#292929`, right half track `#dadada` | Paired value input field (56px wide, border `#dadada`) echoes the same "50%" value |
| other states (hover / pressed / disabled / at-extremes) | not designed | Follow Spectrum `Slider M` defaults per the linked storybook |

### Reset button (node 0:635)
| State | Label | Colors | Notes |
|---|---|---|---|
| disabled (shown) | "Reset" + revert icon | text `#c6c6c6`, fill `#e9e9e9`, transparent border | This is the ONLY state designed — occurs when format & size are at their original values |
| enabled | "Reset" | presumed text `#292929`, fill `#e9e9e9` | Not directly designed; inferred |

### Primary CTAs (nodes 0:598, 0:601)
| Button | State | Label | Colors |
|---|---|---|---|
| Download | default (enabled) | "Download" | fill `#ffffff` (inherited from panel bg), 2px border `#dadada`, text `#292929`, rounded 20px |
| Open in Adobe Express | default (enabled) | "Open in Adobe Express" | fill `#3b63fb`, transparent border, text `#ffffff`, rounded 20px |
| loading / disabled / error | — | — | not designed |

### Trust badges
| Item | Icon | Text | Notes |
|---|---|---|---|
| Free to use | Pink/magenta circle-check (asset `imgGroup2`) | "Free to use" | 18px regular, color `#292929` |
| No credit card required | Pink/magenta circle-check (asset `imgSvgLit090508140`) | "No credit card required" | 18px regular, color `#292929` |

### Size readout (nodes 0:625, 0:630)
| Row | Label | Value | Typography |
|---|---|---|---|
| Original | "Original size:" | "293 KB" | Both `Adobe Clean Regular` 15px — neutral |
| New | "New size:" | "145 KB" | Both `Adobe Clean Bold` 15px — **bold to emphasise the reduced size** |

---

## Platform Coverage

- **Desktop (marketing page):** yes — node `0:466` (1280px wide frame)
- **Mobile (marketing page):** **no** — no mobile-width frame was designed
- **iOS-specific:** no
- **Android-specific:** no
- **In-product (Express editor iframe) flow:** represented by reference screenshots only (`0:654` TOU, `0:656` LOE) — da-express-milo does not build these; they come from Horizon

---

## Journey Phases with Design Coverage

- [x] Upload / entry point — **NOT explicitly designed** in a marketing-page mockup; the frame jumps straight to the loaded state. Will need to follow the existing FQA upload dropzone convention from Image Resize.
- [ ] Loading / processing (compression-in-progress) — **not designed**
- [x] Post-upload / loaded state — **designed** (node `0:466`, right-side panel with Picker + Slider + Original/New size + Reset + CTAs)
- [x] Editor open in iframe — **reference only** (nodes `0:654` TOU, `0:656` LOE) — the TOU-agree → LOE flow is inherited from Image Resize and rendered by Horizon, not by da-express-milo
- [ ] Success / download confirmation — **not designed**
- [ ] Error state (unsupported format, file too large, compression failed) — **not designed**
- [ ] Empty / initial state on the marketing page (before upload) — **not designed**

---

## Marketing-page vs Editor-iframe boundary (critical)

The scope split between **da-express-milo (marketing page)** and **Horizon (Express editor iframe)** is:

| Surface | What lives here | Which Figma nodes |
|---|---|---|
| **da-express-milo marketing page** | Page chrome (header nav, breadcrumb, hero heading, sub-copy, trust badges), the `<qa-standalone-app>` container hosting the quick action, and the layout / styling wrapping the Picker + Slider + readouts + buttons rendered by the Horizon SDK | `0:466` (entire frame) |
| **Horizon (Express editor iframe)** | The TOU modal after "Open in Adobe Express", and the full Express editor experience the user lands in afterwards | `0:654` (TOU), `0:656` (LOE) — reference only |
| **Existing Express in-product UI (context only, not built in either place for this feature)** | Preset "Compress" panel, existing Download modal, existing Resize image standalone QA — provided as visual references | `0:650`, `0:659`, `0:660` |

The arrows on the canvas (`0:663`, `0:664`) explicitly map the flow: marketing-page compressor → TOU modal → LOE editor, confirming the hand-off points.
