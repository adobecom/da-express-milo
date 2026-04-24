# Figma Summary — Image Compressor (Acom marketing page)
Source: https://www.figma.com/design/RJnlFSA7WqcyMwnOuWWfmy/Shairilk-image-compress-acom?node-id=0-1
Fetched: 2026-04-24

Scope: This Figma covers the **adobe.com/express landing page** for the Image Compressor JDI feature (the Acom marketing page an AEM author assembles from content blocks). It does **not** cover the interior Express editor / CCEverywhere embed iframe. Post-upload behaviour is expected to reuse the existing `frictionless-quick-action` / `frictionless-quick-action-mobile` pattern in this repo.

---

## Page Overview

| Node ID | Name | Role | Description |
|---|---|---|---|
| 0:3 | Image Compressor | design_frame | **Primary — build this.** New Acom Image Compressor landing page, desktop 1280w, full length ≈6493px. |
| 0:540 | 1280w default | reference_screenshot | Skeleton/loading-state wireframe of the existing `/express/feature/image/resize` page. Pattern reference for the interior editor state (not part of this page). |
| 0:841 | Screenshot 2026-04-15 at 10.51.58 AM 1 | reference_screenshot | Loaded-state screenshot of the existing `/express/feature/image/resize` page. Shows the two-column resize editor (image canvas + controls panel). Pattern reference only — do not rebuild. |
| 0:842 | Video Compressor | reference_screenshot | Parallel landing-page design for the sibling Video Compressor feature. Tracks the same layout as the Image Compressor page. Included by designer as a coordinated sibling — coordinate with the video-compressor feature team. |
| 0:1379 | Frame 1 | reference_screenshot | Screenshot of a different existing Acom feature page ("Free image resizer." with upload card hero, how-to-resize steps, "Resize images online for free" / "Do more with your image" / "Stand out with Adobe Express" content blocks). Pattern reference — this is the template the new Image Compressor page follows. |
| 0:1867 | Original Image Compressor | reference_screenshot | **Previous version of the same Image Compressor page.** Old design promoted the HARMAN Image Compressor add-on inside Express desktop (step 1 = "Launch Adobe Express"). The new design (0:3) replaces that funnel with an on-page frictionless upload. Read this only to understand the diff — do not build. |

---

## Frames to Build

### Image Compressor (node 0:3)
**Role:** design_frame
**Platform:** desktop (1280px wide). No mobile/iOS/Android variants present in this Figma.

**Page layout (top → bottom, approximate y-coordinates within the 1280×6493 frame):**

1. **Global Adobe Gnav** — standard Adobe top navigation (shown in sibling screenshots 0:1379, 0:842; omitted from the Image Compressor frame itself but implied). The Image Compressor frame starts with a simpler "Adobe Express" logo row at y=0.
2. **Hero section** (~y=0–793) — Adobe Express logo, H1, subhead, two-column hero body (decorative image left, upload card right), legal line.
3. **How to compress a JPEG** 3-step strip (~y=793–1277) — gradient background, 3 white cards with icon + step heading + description.
4. **Quickly compress any image** content block (~y=1374–?) — image-left / text-right, two-column.
5. **Strike the ideal balance** content block — image-right / text-left (alternating), with decorative "Go to App"-style pink pill badge on the image asset (decorative, not an interactive CTA in the design).
6. **Streamline your workflow** content block — image-left / text-right.
7. **Customize your photo online with the compression tool, templates, and more** content block — text-left / large illustration-right. Illustration is a stacked collage of app surfaces with social share / edit icons.
8. **Discover even more** quick-action pill rail (~y=3732) — horizontal scrolling row of rounded-pill links: Remove Background, Blur Background, Convert Image File, Photo Effect, Enhance Image, Video Editor/Maker. With left/right scroll arrow affordances.
9. **Purple promo band** — "Easily compress JPEGs with Adobe Express." single-line sticky/promo strip on a solid purple/indigo background.
10. **Frequently asked questions** accordion (5 items listed below).
11. **Global Adobe footer** — standard Adobe.com footer (products, support, region switcher, legal, copyright).

**Visible text content:**

*Hero*
- H1: **"Free image compressor."**
- Subhead: "Easily compress your images in one click using Adobe Express, the quick and easy create-anything app. Use the online photo compressor to instantly change the file size of any image to share across your social channels."
- Upload card heading: **"Drag and drop an image"** / **"or browse to upload."** (the words "browse to upload." are in indigo `#5c5ce0` as an inline link-styled span within the heading)
- Upload card primary CTA: **"Upload your photo"** (indigo pill button)
- Upload card file-restriction caption: "File must be JPEG, JPG, PNG or WebP and less than 40MB"
- Upload card badges (two, side by side): "Free to use" and "No credit card required" — each prefixed by a 14px magenta (`#f06dad`) checkmark chip
- Legal line below hero: "By uploading your image or video, you agree to the Adobe Terms of Use and Privacy Policy." (links are bolded and indigo)

*How-to-3-step strip heading*
- H2 (white, on gradient): **"How to compress a JPEG."**
- Card 1: **"1. Select"** — "Upload your image to our image compressor tool." (upload icon)
- Card 2: **"2. Compress."** — "Either upload a JPEG from your device or access an image in Adobe Express. Use the slider to compress the JPEG down from 100 percent to 0 percent. The add-on will reflect, in real time, the size of the compressed image." (blur-image / slider icon)
- Card 3: **"3. Continue editing."** — "Click Add to page or Download when you've got a JPEG size that works for your project. Keep editing your image in Adobe Express by applying filters, cropping, and more." (edit/pencil icon)

*Content blocks (marquee-style, alternating image/text)*
- Block 1 H2: **"Quickly compress any image."** — Body: "If you're compressing an image for the homepage of your blog or so you can text your vacation photos to the friend chat in bulk, you want to be able to use your photos right away. Just upload your image into the image compressor, then use the slider tool to pick the ideal file size." (image left, text right)
- Block 2 H2: **"Strike the ideal balance."** — Body: "Customize the level of compression you need for your JPEG with the easy-to-use slider. Compress just a little to maintain the highest image quality or a lot if you're looking to save space in your digital storage of choice." (text left, image right; image has a pink "Go to App" decorative pill baked in)
- Block 3 H2: **"Streamline your workflow."** — Body: "Compress your JPEGs in one place in Adobe Express. You can even use images you're working within the Adobe Express editor without needing to download first. Finalize designs faster when you're not switching between programs for different tasks. Click Add to page to keep editing or download the new JPEG." (image left, text right; the "MISO RAMEN" magazine collage has a blue "Go to App" pill baked into the image)
- Block 4 H2: **"Customize your photo online with the compression tool, templates, and more."** — Body: "Adobe Express makes editing and using images easy. Take time to explore the image editing options among an array of others to develop your style. With Adobe Express on your side, all you need to do is open the app to create unique and standout designs that will captivate your audience." (text left, large collage illustration right)

*Discover-even-more rail*
- H3 (left-aligned): **"Discover even more."**
- Pills (left→right): Remove Background • Blur Background • Convert Image File • Photo Effect • Enhance Image • Video Editor/Maker

*Purple promo band*
- **"Easily compress JPEGs with Adobe Express."** (white text on purple/indigo band, bold, single line, centered)

*FAQ*
- H2: **"Frequently asked questions."**
- Q1: "How do I compress JPEGs in Adobe Express?" — A: "In the Adobe Express editor on your desktop, select "Add-ons" from the menu. Type "image compressor" into the Search bar to find the HARMAN Image Compressor add-on, then click "Try now" to install it. Upload your image and use the slider tool to set your level of compression."
- Q2: "Do I need to create a separate account with the third-party developer of the Image Compressor add-on?" — A: "No. Once you add the HARMAN Image Compressor add-on in Adobe Express, it will be ready to use right away."
- Q3: "What files are supported by the Image Compressor add-on?" — A: "JPEG, PNG, BMP, GIF, and WebP images can be compressed in the image compressor add-on. The compressed image will be converted to a JPEG on download. You can also add the compressed image to your Adobe Express editor for more downloading options."
- Q4: "Will compressing an image reduce its quality?" — A: "Compression may reduce quality, especially at higher compression levels. Use the slider to adjust the compression and find a good balance between file size and visual quality."
- Q5: "Can I get Adobe Express for free? If so, what's included?" — A: "Yes, Adobe Express has a free plan that includes core features like photo editing tools and effects and thousands of free templates. Learn more about our plans and pricing."

*Footer (standard Adobe.com footer — values captured for completeness)*
- Column headers: "For individuals & small business" • "For medium & large business" • "For organizations" • "Support" • "Contact" • "Adobe"
- Featured products chips: Acrobat Reader, Firefly, Adobe Express, Photoshop (four; each with small product icon)
- Region switcher: "Change region"
- Legal line: "Copyright © 2026 Adobe. All rights reserved." / Privacy / Terms of Use / Cookie preferences / …

**Interactive controls:**

| Control | Type | Default state | Notes |
|---|---|---|---|
| Upload card dropzone | drop target + link-style span "browse to upload." | idle | Accepts drag-and-drop; "browse to upload." opens the file picker |
| Upload your photo | primary button (indigo pill, rounded-[999px], `#5c5ce0` fill, white bold text, ~16px) | default | Opens file picker; maps to existing frictionless-quick-action upload button in this repo |
| Terms of Use / Privacy Policy | inline text links (indigo bold) | default | Standard legal links |
| Discover-even-more pills (×6) | link pills (`#e9e9e9` fill, 2px `#e8e8e8` border, `rounded-[18px]`, bold 14px `#222` text) | default | Horizontal scroller; left+right chevron arrow buttons (`rounded-[16px]` 32×32 white with soft shadow) shown at `opacity-0` — become visible on overflow/hover |
| FAQ items (×5) | accordion rows (heading 24px bold on white) | collapsed | Q1 appears expanded in the screenshot (showing the answer underneath) |
| Footer links / region switcher | links + menu | default | Standard Adobe footer — reuse shared global footer block |

**Layout:**
- Outer frame: **1280px** wide, centered body.
- Hero body container: two-column at roughly 50/50 with a vertical divider rectangle between image (`w=421px, h=379px`) and upload card (`max-w=638px`). Hero wrapper padding: `px=20px, py=40px`.
- How-to strip: 3 equal-width white cards inside a `px=165px py=80px` gradient container, `max-w=950px`. Cards have `p=20px`, `rounded-[12px]`, card gap `16px`.
- Content blocks: each block is `max-w=1088px`, `px=32px`, inner row `py=40px`, columns `px=40px`, image area `max-w=512px size=496px`, headings 45px.
- Discover-even-more: overflow-x auto scroller, `max-h=510px max-w=1024px`, pills `py=6px px=18.8px`, row centred with 32px chevrons bottom-anchored left/right.
- Purple band: `py ≈ 20px` solid indigo strip, single-line white heading.
- FAQ: full-width list on `#F3F3F3`-ish grey panel, each Q ≈ 24px bold `#242424`, A ≈ 16px regular `#242424`.
- Footer: multi-column, standard Adobe footer on dark text.

**Colors:**
- Primary CTA background + link accent: `#5c5ce0` (indigo / Adobe Express brand blue)
- Hero body text / headings: `#242424` (near-black)
- Hero subhead + card body text: `#242424`
- Upload card file-restriction caption: `#242424` at 11px
- Checkmark chip fill: `#f06dad` (magenta) — used behind the "Free to use" / "No credit card required" checkmarks
- How-to gradient: **linear-gradient(≈15deg, `#7C84FC` 0%, `#FF4DD2` 100%)** — indigo to magenta
- How-to card fill: `#FFFFFF`
- Discover-even-more pill fill: `#e9e9e9`, border `#e8e8e8`, text `#222`
- Pill scroll-arrow border: `#444`
- Purple promo band: solid indigo (matches CTA family, ~`#5c5ce0`)
- Body background: `#FFFFFF`
- Footer secondary text: `#505050`

**Typography:**
- H1 (hero "Free image compressor."): `Adobe Clean Black` 45px, leading 58.5px, `#242424`, center
- Hero subhead: `Adobe Clean Regular` 16px, leading 24px, `#242424`, center, `w=720px`
- Upload card heading ("Drag and drop an image / or browse to upload."): `Adobe Clean Black` 28px, leading 36.4px, `#242424`, center (the "browse to upload." span recoloured to `#5c5ce0`)
- Upload button label: `Adobe Clean Bold` 16px, leading 24px, white, center
- Upload card caption (file-size rules): `Adobe Clean Regular` 11px (sometimes rendered as 12px in similar blocks), center
- "Free to use" / "No credit card required": `Adobe Clean Regular` 16px, `#242424`
- Legal line below hero: `Adobe Clean Regular` 12px, `#242424`; link spans `Adobe Clean Bold` 12px, `#5c5ce0`
- How-to H2 ("How to compress a JPEG."): `Adobe Clean Black` 36px, leading 46.8px, white, center
- How-to card step heading ("1. Select" etc.): `Adobe Clean Black` 22px, leading 26px, `#242424`
- How-to card body: `Adobe Clean Regular` 14px, leading 21px, `#242424`
- Content-block H2 (45px "Quickly compress any image." etc.): `Adobe Clean Black` 45px, leading 48.6px, `#242424`
- Content-block body: `Adobe Clean Regular` 16px, leading 21.28px, `#242424`
- Discover-even-more rail H3: `Adobe Clean Black` 28px, leading 36.4px, `#242424`
- Discover-even-more pill label: `Adobe Clean Bold` 14px, `#222`, center
- Purple promo band heading: `Adobe Clean Black` 28px, leading 36.4px, white, center
- FAQ section H2 ("Frequently asked questions."): `Adobe Clean Black` 36px, leading 46.8px, `#242424`, center
- FAQ question: `Adobe Clean Bold` 24px, leading 36px, `#242424`
- FAQ answer: `Adobe Clean Regular` 16px, leading 24px, `#242424`; inline links `Adobe Clean Bold` 16px `#5c5ce0`
- Footer column headers: `Adobe Clean Bold`/heading style ~19.6px
- Footer link labels: ~`Adobe Clean Regular` 27px line-height / 16px font (standard footer)
- Footer copyright: 14px `#505050`

**Designer annotations:** None found outside the frame. No sticky notes, arrows, or explicit labels were present in the metadata pass — the sibling reference screenshots (0:1379, 0:841, 0:540, 0:842) function as the annotation layer.

**Journey phases covered:**
- Landing / entry point (hero) — yes
- Pre-upload educational content (how-to-3-step + 4 content blocks + FAQ) — yes
- Upload affordance (drag-drop zone + primary upload CTA) — yes
- **Not** covered: post-upload editor iframe (the CCEverywhere embed). The designer referenced the existing Image Resizer page (0:841, 0:540) as the pattern to follow for this next phase.

---

## Reference Frames — Do Not Build

### 1280w default (node 0:540)
**Depicts:** Skeleton / empty-canvas wireframe of the existing `/express/feature/image/resize` page. Shows the two-column interior layout: left = grey canvas placeholder (zoom slider below), right = Aspect-ratio picker + Width/Height inputs (with lock toggle + px unit) + Original size / New size readouts + Download / "Open in Adobe Express" CTA pair + Free-to-use/No-credit-card badges + "Explore more Quick Actions. It's free." cross-sell list (Remove background, Crop image, Convert to PNG, Convert to SVG, Convert to JPG).
**Relevance:** Shows the pattern for the interior editor state the user reaches after upload. The Image Compressor's equivalent interior ("upload → compress with slider → Download / Open in Express") is expected to follow the same shell. Do not rebuild this screen as part of the Acom page — it is the handoff destination.

### Screenshot 2026-04-15 at 10.51.58 AM 1 (node 0:841)
**Depicts:** Live screenshot of the same `/express/feature/image/resize` page with an image loaded (woman's portrait, pink aspect-ratio overlay). Shows the loaded state of the interior editor.
**Relevance:** Same as 0:540 — pattern for the loaded-editor state post-upload. The Image Compressor's equivalent is expected to render a similar shell with a compression slider instead of width/height inputs.

### Video Compressor (node 0:842)
**Depicts:** Parallel landing page for the **Video Compressor** sibling feature. Same block structure as the Image Compressor page (hero with upload card, how-to-3-step, 4 content blocks, discover rail, purple promo band, FAQ). Hero H1 reads "Free video compressor."
**Relevance:** Sibling feature — the two pages are being launched as a pair. Coordinate block structure with the video-compressor charter (`.claude/charters/video-compressor.md`). Do not rebuild here; the video page is a separate implementation.

### Frame 1 (node 0:1379)
**Depicts:** Screenshot of an existing `/express/feature/image/resize` **Acom page** (full page). H1 = "Free image resizer." Contains hero with upload card, "How to resize an image." 3-step, "Resize images online for free." content block, "Do more with your image." content block, "Stand out with Adobe Express." content block.
**Relevance:** The authoritative Acom pattern the Image Compressor page is modeled after. Block types, padding, and typographic scale come from here. The existing Resize page is what a Milo author already assembles today — the Image Compressor page should use the same block names / authoring shapes.

### Original Image Compressor (node 0:1867)
**Depicts:** Previous iteration of the Image Compressor Acom page, structured around the HARMAN Image Compressor **add-on** inside Adobe Express desktop.
**Key diffs vs the new design (0:3) — read this to understand what's changing:**
- Old hero H1: "Compress a JPEG for free online." (60px, two-line) → New: "Free image compressor." (45px, single line)
- Old hero subhead: "Fine tune your file size with the HARMAN Image Compressor add-on in Adobe Express. Best of all, the add-on delivers fast results." → New: generic Acom subhead, no add-on mention
- Old hero CTA button (`#5c5ce0` pill, "Upload your photo"): same label — but old hero had NO dropzone, just the button. New hero adds the full drag-and-drop upload card.
- Old how-to step 1: "1. Launch Adobe Express." — "Open Adobe Express on your desktop. Select the add-ons panel in the left menu and install the HARMAN Image Compressor add-on." → New step 1: "1. Select" — "Upload your image to our image compressor tool." (upload now happens on the web page, no add-on install funnel)
- Old steps 2 + 3 ("Compress" / "Continue editing"): copy is **identical** to the new design
- Content blocks "Quickly compress", "Strike the ideal balance", "Streamline your workflow", "Customize your photo online": copy is **identical** to the new design
- Discover-even-more pills, purple promo band, FAQ: **identical** to new design
**Relevance:** Confirms the redesign is specifically about moving from "install the Express add-on" to "upload directly on this page" — i.e. wiring a frictionless-quick-action block into the hero, same pattern the repo already uses for the Image Resize / Remove Background / Crop feature pages. Body copy, footer, FAQ, and discover rail all remain from the old page.

---

## Component States
_None of the top-level nodes in this file is a dedicated component library. State variants (hover/active/error/loading) are not explicitly provided. The Implementation Agent should derive interactive states from:_
- **Upload button** — match existing `frictionless-quick-action` upload button states in the repo (this feature reuses that block — see CLAUDE.md §5).
- **Discover-even-more pills** — the file shows both the idle pill style and the chevron scroll-arrow in the `opacity-0` resting state; hover state not authored.
- **FAQ accordion** — the screenshot shows Q1 expanded and Q2–Q5 collapsed; no explicit hover/focus spec.
- **Upload dropzone** — no drag-over / drop-active visual variant provided; inherit from the existing Acom Resize page pattern (node 0:1379 + 0:841 references).

---

## Platform Coverage
- Desktop (1280w): **yes** — node 0:3 is the sole design frame.
- Mobile: **no** — not included in this Figma. Implementation Agent must either (a) confirm scope is desktop-only or (b) derive mobile from the existing mobile Acom page conventions in this repo (frictionless-quick-action-mobile block, etc.).
- iOS-specific: no.
- Android-specific: no.

## Journey Phases with Design Coverage
- [x] Upload / entry point (hero + upload card)
- [ ] Loading / processing (no design — reference only via 0:540 / 0:841)
- [ ] Editor open (in iframe) (no design — reference only via 0:540 / 0:841)
- [ ] Success / download (not covered)
- [ ] Error state (not covered — no file-rejected / over-40MB / wrong-format variant)
- [x] Empty / initial state (the landing page itself)
