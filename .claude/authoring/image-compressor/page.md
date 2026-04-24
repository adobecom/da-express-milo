# Image Compressor — DA authoring package (page-level markdown)

Target page: `/express/feature/image/compress/jpg`
Scope: Hero swap (replace HARMAN add-on funnel with `frictionless-quick-action` + fallback columns + mobile block), how-to step 1 copy update, purple promo `banner` block, FAQ rewrite (HARMAN add-on references removed), breadcrumb rebrand to "Image Compressor", metadata block updated to mirror Image Resize page + add mobile fork-button CTAs.
Body content blocks (4 columns, link-list) are carried over from today's live page verbatim — shown here for completeness because DA authoring operates on the full document.

Modeled on the live `/express/feature/image/resize` page, which already exposes the three-variant hero pattern (non-qualified → qualified-desktop → qualified-mobile). Sources:
- `.claude/figma-summaries/image-compressor-acom.md` (copy authority)
- `https://main--da-express-milo--adobecom.aem.live/express/feature/image/resize` (pattern authority for the 3-variant hero split + `steps highlight image schema` how-to + `columns` content blocks + `link-list` rail + `banner` promo, metadata + mobile fork-button CTAs)
- `https://main--da-express-milo--adobecom.aem.live/express/feature/image/compress/jpg` (pattern authority for the 4 compression content blocks and the link-list; the existing sticky-promo-bar and HARMAN-add-on FAQ copy are explicitly NOT carried over)

---

## Section 1 — Fallback hero (`columns (fullsize)`)

Shown when the browser is NOT eligible for the frictionless quick-action flow (e.g. older Safari without the flag, or server-side qualification gate fails). Section-metadata `showwith = fqa-non-qualified` hides this section otherwise.

### Block: columns (fullsize)

| | |
|---|---|
| # Free image compressor.<br><br>Easily compress your images in one click using Adobe Express, the quick and easy create-anything app. Use the online photo compressor to instantly change the file size of any image to share across your social channels.<br><br>[Upload your photo](https://adobesparkpost.app.link/c4bWARQhWAb) | [Upload animation (MP4)](https://main--da-express-milo--adobecom.aem.live/media_184ba127fa10e6b95b4bf300c8397d00186227aeb.mp4) |

### Block: section-metadata
| | |
|---|---|
| showwith | fqa-non-qualified |

---

## Section 2 — Frictionless hero (desktop) — `frictionless-quick-action`

Shown on qualified desktop browsers. Uploads go through the CCEverywhere SDK `ccEverywhere.quickAction.compressImage(...)` dispatched from `executeQuickAction` in `frictionless-utils.js` once the code-layer changes land (see charter).

### Block: frictionless-quick-action

| | |
|---|---|
| # Free image compressor.<br><br>Easily compress your images in one click using Adobe Express, the quick and easy create-anything app. Use the online photo compressor to instantly change the file size of any image to share across your social channels. | |
| [Alternate video source (MP4)](https://main--da-express-milo--adobecom.aem.live/media_184ba127fa10e6b95b4bf300c8397d00186227aeb.mp4) | Drag and drop an image<br>or *browse to upload.*<br><br>[Upload your photo](https://adobesparkpost.app.link/c4bWARQhWAb)<br><br>File must be JPEG, JPG, PNG or WebP and less than 40MB<br><br>By uploading your image or video, you agree to the Adobe [Terms of Use](https://www.adobe.com/legal/terms.html) and [Privacy Policy](https://www.adobe.com/privacy/policy.html) |
| Quick-Action | compress-image |

### Block: section-metadata
| | |
|---|---|
| showwith | fqa-qualified-desktop |

---

## Section 3 — Frictionless hero (mobile) — `frictionless-quick-action-mobile`

Shown on qualified mobile browsers (including iOS Safari once `frictionless-safari = on`). Same dispatch; mobile block reads the same `QA_CONFIGS` + routes through `executeQuickAction`, so `compress-image` works with zero additional mobile code once the shared utils are updated.

### Block: frictionless-quick-action-mobile

| | |
|---|---|
| # Free image compressor.<br><br>Easily compress your images in one click using Adobe Express, the quick and easy create-anything app. Use the online photo compressor to instantly change the file size of any image to share across your social channels.<br><br>Do more with your image in Adobe Express. | |
| [Alternate video source (MP4)](https://main--da-express-milo--adobecom.aem.live/media_184ba127fa10e6b95b4bf300c8397d00186227aeb.mp4) | Tap to **upload an image.** |
| | File must be JPEG, JPG, PNG or WebP and less than 40MB<br><br>By uploading your image or video, you agree to the Adobe [Terms of Use](https://www.adobe.com/legal/terms.html) and [Privacy Policy](https://www.adobe.com/privacy/policy.html) |
| fallback | [/express/fragments/mobile-frictionless-qa/fallback-remove-background](https://main--da-express-milo--adobecom.aem.live/express/fragments/mobile-frictionless-qa/fallback-remove-background) |
| Quick-Action | compress-image |

### Block: section-metadata
| | |
|---|---|
| showwith | fqa-qualified-mobile |

---

## Section 4 — How-to-3-step strip

Live Resize page uses `steps highlight image schema`. Copy per Figma (new step 1 text; steps 2 and 3 carried over unchanged from the existing compress page, which already matches Figma).

### H2

> How to compress a JPEG.

### Block: steps (highlight, image, schema)

| | |
|---|---|
| `[ICON: Upload — reuse /media_169dfd6b66464be4577398508baf6a41c1dd26f6f.png from Resize page]` | ### 1. Select<br><br>Upload your image to our image compressor tool. |
| `[ICON: blur-image — reuse /media_102940297718a91db18c1dc3a34a429ec0e8263f9.png]` | ### 2. Compress.<br><br>Either upload a JPEG from your device or access an image in Adobe Express. Use the slider to compress the JPEG down from 100 percent to 0 percent. The add-on will reflect, in real time, the size of the compressed image. |
| `[ICON: edit — reuse /media_176db00d075195774d34896a78eeece1901f2c3e0.png]` | ### 3. Continue editing.<br><br>Click Add to page or Download when you've got a JPEG size that works for your project. Keep editing your image in Adobe Express by applying filters, cropping, and more. |

---

## Section 5 — 4 content `columns` blocks (image/text, alternating)

All 4 blocks are carried over from the live `/express/feature/image/compress/jpg` page verbatim — copy matches the new Acom Figma per the block-reuse analysis.

### Block: columns (block 1 — image left / text right)

| | |
|---|---|
| `[IMG: /media_16e016e6c2c5c3c98412229258a600db227fa4eab.png — reuse from live compress page]` | ## Quickly compress any image.<br><br>If you're compressing an image for the homepage of your blog or so you can text your vacation photos to the friend chat in bulk, you want to be able to use your photos right away. Just upload your image into the image compressor, then use the slider tool to pick the ideal file size. |

> **Note:** live page H2 reads "Quickly compress any **JPEG**" — Figma updates this to "any **image**". Updated here.
> **Note:** live page body says "upload your **JPEG**" — Figma updates this to "upload your **image**". Updated here.

### Block: columns (block 2 — text left / image right)

| | |
|---|---|
| ## Strike the ideal balance.<br><br>Customize the level of compression you need for your JPEG with the easy-to-use slider. Compress just a little to maintain the highest image quality or a lot if you're looking to save space in your digital storage of choice. | `[IMG: /media_120e681af8daed1cf89fb7b6d6c589fd9f8c8a244.png — reuse from live compress page]` |

### Block: columns (block 3 — image left / text right)

| | |
|---|---|
| `[IMG: /media_111fa92549ca4bc7b00a555f2b9034c1aa43fe154.png — reuse from live compress page]` | ## Streamline your workflow.<br><br>Compress your JPEGs in one place in Adobe Express. You can even use images you're working within the Adobe Express editor without needing to download first. Finalize designs faster when you're not switching between programs for different tasks. Click Add to page to keep editing or download the new JPEG. |

### Block: columns (block 4 — text left / large illustration right)

| | |
|---|---|
| ## Customize your photo online with the compression tool, templates, and more.<br><br>Adobe Express makes editing and using images easy. Take time to explore the image editing options among an array of others to develop your style. With Adobe Express on your side, all you need to do is open the app to create unique and standout designs that will captivate your audience. | `[IMG: /media_18c3675b239721bd64ab4893729f7bd73ed0506e1.png — reuse from live compress page]` |

---

## Section 6 — Discover even more (`link-list`)

Pills per Figma — already identical to live page.

### Block: link-list

| |
|---|
| ### Discover even more.<br><br>[Remove Background](https://www.adobe.com/express/feature/image/remove-background)<br>[Blur Background](https://www.adobe.com/express/feature/image/blur-background)<br>[Convert Image File](https://www.adobe.com/express/feature/image/convert/jpg-to-png)<br>[Photo Effect](https://www.adobe.com/express/feature/image/effect)<br>[Enhance Image](https://www.adobe.com/express/feature/image/enhance)<br>[Video Editor/Maker](https://www.adobe.com/express/create/video) |

---

## Section 7 — Purple promo band (`banner` — default variant, heading only)

Per `.claude/analysis/image-compressor/block-reuse.md`: the `banner` block's DEFAULT variant already renders solid `#5c5ce0` background + centered white Adobe Clean Black h2. **No variant class, no CTA row** (Figma shows heading only).

### Block: banner

| |
|---|
| ## Easily compress JPEGs with Adobe Express. |

---

## Section 8 — FAQ

The previous sticky-promo-bar strip ("Open Adobe Express on your desktop to try the new add-on.") has been **removed** — it referenced the deprecated HARMAN add-on flow that this feature replaces.

### H2

> Frequently asked questions.

### Block: faq

| | |
|---|---|
| How do I compress JPEGs in Adobe Express? | Upload a JPEG, JPG, PNG, or WebP file (up to 40MB) to the image compressor above. Use the slider to choose your compression level, then Download or Open in Adobe Express to keep editing. |
| What files are supported by the image compressor? | JPEG, JPG, PNG, and WebP images can be compressed with the image compressor. The compressed image will be converted to your chosen format on download. You can also open the compressed image in the Adobe Express editor for more editing options. |
| Will compressing an image reduce its quality? | Compression may reduce quality, especially at higher compression levels. Use the slider to adjust the compression and find a good balance between file size and visual quality. |
| Can I get Adobe Express for free? If so, what's included? | Yes, Adobe Express has a free plan that includes core features like photo editing tools and effects and thousands of free templates. Learn more about our [plans and pricing](https://www.adobe.com/express/pricing). |

> **FAQ changes from Figma/live:**
> - **Q1 rewritten** — original copy described installing the HARMAN Image Compressor add-on from the Express desktop editor. Replaced with on-page frictionless flow description.
> - **Q2 dropped** — original asked "Do I need to create a separate account with the third-party developer of the Image Compressor add-on?" No longer meaningful in the new flow.
> - **Q3 formats corrected** — original listed "JPEG, PNG, BMP, GIF, WebP". Updated to match `QA_CONFIGS['compress-image']`: JPEG, JPG, PNG, WebP (no BMP, no GIF).
> - **Q4, Q5 unchanged.**

---

## Section 9 — Breadcrumbs

Breadcrumb leaf rebranded from "JPEG Compressor" → "Image Compressor" per charter amendment.

### Block: breadcrumbs

| |
|---|
| - [Home](https://www.adobe.com/express)<br>- [Feature](https://www.adobe.com/express/feature)<br>- Image Compressor |

---

## Section 10 — Page metadata

Authored as the last block in the DA doc. Keys read by Milo / Franklin at page decoration time (head-meta and loading-phase routing). Values mirror the live Resize page (the frictionless-image reference template) with compressor-specific overrides.

Changes from the live compress page's metadata:
- `mobile-floating-cta` upgraded from `no-button` → `mobile-fork-button-frictionless` (mirrors Resize)
- All `fork-cta-1-*` and `fork-cta-2-*` keys added (mirrors Resize)
- All `branch-*` keys removed (HARMAN-specific; Resize has none)
- `template` key omitted (neither live compress nor Resize sets it; any `/express/feature/metadata.xlsx` inheritance still wins)

### Block: metadata

| | |
|---|---|
| Title | Free image compressor \| Adobe Express |
| Description | Easily compress your images in one click using Adobe Express. Use the online photo compressor to instantly change the file size of any image to share across your social channels. |
| Short Title | Image Compressor |
| show-floating-cta | yes |
| desktop-floating-cta | floating-button |
| mobile-floating-cta | mobile-fork-button-frictionless |
| frictionless-safari | on |
| main-cta-link | https://adobesparkpost.app.link/c4bWARQhWAb |
| fork-cta-1-icon | cc-express |
| fork-cta-1-icon-text | Adobe Express |
| fork-cta-1-text | Get free app |
| fork-cta-1-link | https://adobesparkpost.app.link/5pSIOLrnqTb |
| fork-cta-2-icon | SX_GlobeGrid_18_N |
| fork-cta-2-icon-text | Web version |
| fork-cta-2-text | Continue |
| fork-cta-2-link | https://adobesparkpost-web.app.link/e/00XSYb7H5Hb |
| fork-cta-2-link-frictionless | #mobile-fqa-upload |
| fork-cta-2-text-frictionless | Upload photo |
| breadcrumbs | n/a |
| breadcrumbs-from-url | off |
| breadcrumbs-hidden-entries | image,video,design |
| quickaction-upload-page | on |
| theme | No Brand Header |
| show-free-plan | yes |
| marquee-inject-logo | yes |

---

## Draft-page testing caveat (important)

When testing on DA draft pages at `/drafts/nala/test-gen/...` or similar, the path-level `metadata.xlsx` at `/express/feature/metadata.xlsx` does **not** inherit — draft paths sit outside the `/express/feature/*` scope. Any metadata key relied on for testing (e.g. `gnav-source`, `footer-source`, `template`, inherited floating-CTA defaults) must be authored directly on the draft page. This does not affect the production page at `/express/feature/image/compress/jpg`, where xlsx inheritance applies normally.
