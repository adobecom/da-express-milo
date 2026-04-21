# Figma Summary — Image Compressor
Source: https://www.figma.com/design/EAYzMQMVbBiP16wHXrSP4o/shairilk-2?node-id=0-1&p=f&t=JPZw7gHcGXDAFN0r-0
Fetched: 2026-04-19

## Page Overview
| Node ID | Name | Role | Description |
|---|---|---|---|
| 0:466 | Image compressor | design_frame | Full desktop page mockup — 1280×1121px |
| 0:650 | Screenshot 2026-02-27 at 12.44.41 PM 1 | reference_screenshot | Mobile UI — compression quality picker (Medium/High/Low) with Compress CTA |
| 0:651 | cover | cover | Figma file thumbnail — ignored |
| 0:654 | Screenshot - TOU | reference_screenshot | Adobe Express in-app TOU / Terms of Use modal flow (existing) |
| 0:656 | Screenshot - LOE | reference_screenshot | Adobe Express editor open state with image selected (existing flow) |
| 0:659 | Screenshot 2026-03-03 at 9.18.46 AM 1 | reference_screenshot | In-product reference: Express Download panel (File format picker, Size slider, Download button) |
| 0:660 | Screenshot 2026-03-03 at 9.22.52 AM 1 | reference_screenshot | In-product reference: Express Resize image panel in full Express UI (Quality slider, Download + Open in editor) |
| 0:661 | In-product references | flow_annotation | Label grouping the in-product screenshot references |
| 0:662 | Existing flow coming from "Image Resize" quick action | flow_annotation | Annotation noting that the TOU → LOE flow is pre-existing (from image-resize QA) |
| 0:663 | Image compressor --> Screenshot - TOU | flow_annotation | Arrow connector: main frame leads to TOU modal |
| 0:664 | Screenshot - TOU --> Screenshot - LOE | flow_annotation | Arrow connector: TOU modal leads to Express editor open state |

---

## Frames to Build

### Image compressor (node 0:466)
**Role:** design_frame
**Platform:** desktop

**Visible text content:**
- Logo: "Adobe Express" (with Adobe Express SVG icon)
- H1: "Free image compressor."
- Body: "Easily compress your images in one click using Adobe Express, the quick and easy create-anything app. Use the online photo compressor to instantly change the file size of any image to share across your social channels."
- Breadcrumb: Home / Feature / Image Compressor
- Nav items: Creativity & Design, Adobe Express, Create, Edit, Print, Business, Education, Plans
- Nav CTAs: "Go to Adobe Express" (blue pill), "Sign in" (outlined pill)
- Picker label: "File format"
- Picker value (default): "PNG (Best for images)"
- Picker badge: "Recommended" (with checkmark circle icon, purple/accent colour)
- Slider label: "Size"
- Slider value (default): "50%"
- Stats label: "Original size:" + "293 KB"
- Stats label: "New size:" (bold) + "145 KB" (bold)
- Reset button: icon + "Reset" (greyed out — disabled state shown)
- Primary CTA: "Download" (outlined/secondary style)
- Primary CTA: "Open in Adobe Express" (solid blue)
- Trust badges: "Free to use", "No credit card required" (both with checkmark icons, pink/magenta colour)

**Interactive controls:**
| Control | Type | Default state | Notes |
|---|---|---|---|
| File format picker | dropdown / Picker M | "PNG (Best for images)" | "Recommended" badge below; Spectrum Picker component |
| Size slider | range slider / Slider M | 50% | Controls compression level; paired with numeric text input showing percentage |
| Reset button | icon+text button | disabled (greyed) | Reverts to original; icon is revert/undo arrow |
| Download | button (secondary) | enabled | Outlined pill, dark border, dark text |
| Open in Adobe Express | button (primary) | enabled | Solid blue (#3b63fb) pill |

**Layout:**
Two-column layout inside a full-width 1280px container at 20px horizontal padding (1240px inner):
- Left column (~60% width, ~739px): image preview area — light grey (#e9e9e9) rounded card, image centred inside
- Right column (~26% width, ~321px, left edge at 819px): controls panel stacked vertically top to bottom: Picker → Slider → Original/New size stats + Reset → Download + Open buttons → Trust badges
- Header: sticky top nav (64px) + breadcrumb bar (33px) = 97px total, background #f8f8f8
- Hero section: Adobe Express logo centred, H1 centred, body copy centred (max 720px), all above the tool area
- Tool area starts ~366px from top, height ~700px
- Page background: white for hero, #f8f8f8 for tool/SDK area

**Colors:**
- Primary CTA (Go to Adobe Express / Open in Adobe Express): `#3b63fb`
- Nav background / tool area background: `#f8f8f8`
- Image preview area background: `#e9e9e9`
- Picker field background: `#e9e9e9`
- Recommended badge icon colour: `#5258e4` (Spectrum accent/indigo)
- Trust badge icon colour: pink/magenta (matches Express brand — rendered as SVG)
- Nav border: `#eaeaea`
- H1 / body text: `#242424`
- Nav text: `#292929`
- Subdued label text (picker/slider label): `#505050`
- Breadcrumb text active: `#2c2c2c`
- Breadcrumb text inactive: `#707070`
- Reset button text (disabled): `#c6c6c6`
- Download button border: `#dadada`
- Slider track: `#dadada` (background), `#292929` (fill)

**Typography:**
- H1 ("Free image compressor."): Adobe Clean Black, 45px, weight 900, line-height 58.5px
- Body copy (hero description): Adobe Clean Regular, 16px, line-height 24px
- Nav menu items: Adobe Clean Regular, 14px
- Nav active item (Creativity & Design): Adobe Clean Bold, 14px
- CTA buttons (Go to Adobe Express, Open in Adobe Express): Adobe Clean Bold, 15–16px
- Sign in / Download: Adobe Clean Bold, 14–16px
- Picker label / Slider label: Adobe Clean Regular, 14px, colour #505050
- Picker value text: Adobe Clean Regular, 14px
- Original size / New size labels: Adobe Clean Regular, 15px
- New size value: Adobe Clean Bold, 15px (visually heavier — compressed result emphasis)
- Reset button text: Adobe Clean Regular, 14px
- Trust badges: Adobe Clean Regular, 18px
- Breadcrumb: Adobe Clean Regular, 12px, capitalize

**Designer annotations:**
- Flow connector arrows show that the compressed image → "Open in Adobe Express" → TOU modal → Express editor open state. This downstream flow is pre-existing (same as Image Resize quick action) and does NOT need to be rebuilt — it is the standard CCEverywhere embed flow.
- The "In-product references" group (nodes 0:659, 0:660) shows the Express Download panel and Resize image panel as design references for how the CCEverywhere SDK renders internally. These are for context only.

**Journey phases covered:**
- Upload / entry point: NOT shown — the design shows the post-upload state (image already loaded into the SDK tool)
- Loading / processing: NOT shown
- Editor open (SDK tool active): YES — the main design frame (0:466) shows the CCEverywhere standalone quick action tool rendered with image preview on the left and compression controls on the right
- Success / download: Partially — Download button is visible; result (145 KB compressed) is shown in size stats
- Error state: NOT shown
- Empty / initial state: NOT shown (no upload dropzone / upload prompt visible in this frame)

**Component names (layer tree — may map to block/component names):**
- `qa-standalone-app` → `standalone-quick-action` → `qa-app-root` — SDK component tree (CCEverywhere)
- `Picker M` — Spectrum Picker (file format selector)
- `Slider M` — Spectrum Slider (compression size control)
- `Button - Download` — secondary download button
- `Button - Open in Adobe Express` — primary CTA
- `Section - lit$090508140` — image preview region (SDK renders image here)
- `Region - Video` — image preview container inside SDK

---

## Reference Frames — Do Not Build

### Screenshot 2026-02-27 at 12.44.41 PM 1 (node 0:650)
**Depicts:** Mobile compression quality picker UI — three radio options: Medium (balanced quality, size, and speed — selected by default), High (sharper, larger, slower), Low (fastest, smallest, lowest quality). CTA: "Compress →" (black pill button).
**Relevance:** Possible mobile variant or an alternative pre-upload compression settings panel. Included for design reference only — this pattern is NOT part of the main desktop frame.

### Screenshot - TOU (node 0:654)
**Depicts:** Adobe Express in-app Terms of Use modal — "Take your image further with Adobe Express." modal overlay inside the Express editor. Includes template suggestions, sign-in prompt, and "Agree to continue" CTA.
**Relevance:** This is the existing TOU gate that fires when a user attempts to save/download from the CCEverywhere embed. Pre-existing flow — do not rebuild.

### Screenshot - LOE (node 0:656)
**Depicts:** Adobe Express editor open state (Learn on Entry panel visible on right side) after TOU is accepted. Shows image editing tools panel on left, image in canvas, Learn panel on right.
**Relevance:** This is the existing Express editor state after LOE (Learn On Entry) fires. Pre-existing flow — do not rebuild.

### Screenshot 2026-03-03 at 9.18.46 AM 1 (node 0:659)
**Depicts:** In-product reference — Express Download panel UI: File format picker ("PNG (Best for images)"), Size slider at ~1.25x, blurriness warning, Download button, Order prints option.
**Relevance:** Design reference for how the CCEverywhere Download panel renders internally. Included so the designer can cross-reference compression controls with what the SDK natively shows.

### Screenshot 2026-03-03 at 9.22.52 AM 1 (node 0:660)
**Depicts:** In-product reference — Full Express UI with "Resize image" panel open: Aspect ratio picker, Width/Height inputs, Quality slider (53%), Original/New size display, Reset button, Download + Open in editor buttons.
**Relevance:** Design reference showing how the existing Image Resize quick action renders its controls. The Image Compressor controls panel (right side of 0:466) mirrors this pattern — same layout of file format picker, size slider, stats, and action buttons.

---

## Platform Coverage
- Desktop: yes — node 0:466 (1280px wide)
- Mobile: no dedicated design_frame (node 0:650 is a reference screenshot of a mobile-style UI, not a buildable design frame)
- iOS-specific: no
- Android-specific: no

## Journey Phases with Design Coverage
- [ ] Upload / entry point — no design coverage (tool renders with image already loaded)
- [ ] Loading / processing — no design coverage
- [x] Editor open (CCEverywhere SDK tool active, in-page embed) — covered by node 0:466
- [x] Success / download — partially covered (Download button + compressed size stats shown in node 0:466)
- [ ] Error state — no design coverage
- [ ] Empty / initial state — no design coverage
