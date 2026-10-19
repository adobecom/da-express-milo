# Image Contrast Checker

`image-contrast-checker` pairs with Color Headline and uses the same upload,
drag/loading overlays, notifications, and tooltips as Color Extract. All UI
copy comes from placeholders. Page headings, descriptions, accuracy guidance,
and media remain authored content.

## Authoring

### Page content: the two DA block tables

Author **only these two tables in the same section**, headline first. The sample
uses real headings and paragraphs so their semantics are explicit. If recreating
the tables manually in DA, format each title as **Heading 1 or Heading 2**, not
bold/plain text.

<table>
  <tbody>
    <tr><td>Color Headline (extract, image-contrast)</td></tr>
    <tr><td>
      <h1>Check your image's color contrast levels (AA/AAA).</h1>
      <p>Upload an image to inspect local pixel contrast against WCAG AA and AAA thresholds.</p>
    </td></tr>
  </tbody>
</table>

<table>
  <tbody>
    <tr><td colspan="2">Image Contrast Checker</td></tr>
    <tr>
      <td>results</td>
      <td>
        <h1>Save your image contrast analysis.</h1>
        <p>Examine your image's contrast levels, then download your results to keep for reference.</p>
      </td>
    </tr>
    <tr>
      <td>accuracy</td>
      <td>
        <p>For the highest accuracy, upload <strong>high-resolution PNG files</strong> exported from design tools.</p>
        <p>Screenshots may produce misleading results if color management is incorrect.</p>
      </td>
    </tr>
  </tbody>
</table>

**Do not add UI-text rows to these tables.** Upload labels, button labels,
tooltips, legend text, errors, and accessibility labels belong in the external
placeholders file described below. There is no `hero` row: upload copy belongs
in Color Headline.

Optional checker rows:

| Row | Content |
| --- | --- |
| background | One decorative collage picture containing the Figma left/right artwork. Use responsive picture sources where needed. It is full-bleed behind the desktop upload marquee, hidden below 900px and in results, and excluded from assistive technology. |
| samples | Linked preview pictures. Each link must point to the **original full-resolution PNG/JPEG/WebP**, not an optimized thumbnail. Nest the preview picture inside its link and supply meaningful image alt text. The original is fetched when selected. |

No other rows are supported. Duplicate rows, missing headings/accuracy guidance,
invalid samples, and missing required checker placeholders fail explicitly.
The previous `hero` and UI-string rows are not an alternate authoring API.

### Migrating the draft

For `/drafts/nate/image-contrast-checker`, replace the earlier keyed table with
the two blocks above. Move UI-string values into the site's placeholder sheet
using the reference below. Supply the decorative Figma artwork and sample
originals separately. Save and preview in DA, then use `npm run up:color` and
open the same relative path at `http://localhost:3000`.

Code does not migrate, publish, or overwrite DA content or placeholders.

## External placeholders file (not a page block)

The following key/value table is a reference for the site's **external
placeholders file**. It is **not** another block table to paste into the DA page.

The checker batch-loads `image-contrast-checker-*` keys using the same loader
pattern as Color Extract. Every checker key below is required; there are no
English defaults or raw-key UI fallbacks. `{width}` and `{height}` are replaced
in the dimensions string. Translate values, not keys or substitutions.

### Temporary page-metadata fallback

Until the external placeholders file is available, put the same keys and values
in the page's **Metadata** table, outside the checker block. Use the exact
hyphenated names from the reference below. For example:

| Metadata | |
| --- | --- |
| image-contrast-checker-color-space | Color space |
| image-contrast-checker-save-png | Save PNG |
| image-contrast-checker-dimensions | {width} by {height} pixels |
| color-image-upload-button | Upload your image |

These are examples, not a complete bundle: provide **all 45
`image-contrast-checker-*` keys** from the reference when none resolves
externally. The six shared `color-image-upload-*` keys may also be supplied
through metadata for this checker.

For each key, a resolved external value takes precedence over page metadata.
Missing external values fall back to nonblank metadata values. Checker keys
still fail explicitly if neither source resolves; shared upload keys retain
their existing defaults after both sources are checked. This metadata fallback
is used only by Image Contrast Checker, not Color Extract or Color Wheel.
Remove the temporary metadata rows once the external entries are available.

### Key/value reference

Generic upload copy reuses the existing `color-image-upload-*` keys. Changing
those values also affects other Color tools; the shared bundle retains its
existing fallback behavior.

| Key | Sample value |
| --- | --- |
| color-image-upload-button | Upload your image |
| color-image-upload-dragdrop | Or drag and drop here |
| color-image-upload-file-hint | PNG, JPEG or WebP, up to 40 MiB |
| color-image-upload-loading | Uploading your image... |
| color-image-upload-aria | Upload an image |
| color-image-upload-error | Unable to load image. Please try again. |
| image-contrast-checker-landing-aria | Upload an image for contrast analysis |
| image-contrast-checker-analyzing-image | Analyzing image contrast... |
| image-contrast-checker-drop-overlay-text | Drop your image anywhere |
| image-contrast-checker-no-image-try-ours | Don't have an image? Try one of ours: |
| image-contrast-checker-use-this-image | Use this image |
| image-contrast-checker-toolbar-aria | Image comparison zoom |
| image-contrast-checker-color-space | Color space |
| image-contrast-checker-color-space-help | Supports sRGB and P3. Changing color space recalculates contrast with that space's luminance weights; it does not convert the image. |
| image-contrast-checker-srgb | sRGB |
| image-contrast-checker-p3 | P3 |
| image-contrast-checker-replace-image | Upload a new image |
| image-contrast-checker-save-png | Save PNG |
| image-contrast-checker-expand | Expand image comparison |
| image-contrast-checker-minimize | Close expanded image comparison |
| image-contrast-checker-fit | Fit images |
| image-contrast-checker-fill | Fill image view |
| image-contrast-checker-comparison | Image contrast comparison |
| image-contrast-checker-original | Original uploaded image |
| image-contrast-checker-analysis | Color-coded image contrast analysis. Refer to the legend for contrast thresholds. |
| image-contrast-checker-dimensions | {width} by {height} pixels |
| image-contrast-checker-legend | Legend |
| image-contrast-checker-large-text | Large text |
| image-contrast-checker-large-text-help | Large text is at least 18pt regular or 14pt bold. |
| image-contrast-checker-small-text | Small text |
| image-contrast-checker-small-text-help | Small text is below 18pt regular or 14pt bold. |
| image-contrast-checker-green | Green |
| image-contrast-checker-passes | Passes |
| image-contrast-checker-green-large | >= 4.5:1 (AAA) |
| image-contrast-checker-green-small | >= 4.5:1 (AA) |
| image-contrast-checker-blue | Blue |
| image-contrast-checker-partial | Partial |
| image-contrast-checker-blue-large | >= 3:1 (AA) |
| image-contrast-checker-blue-small | Fails all levels |
| image-contrast-checker-dark | Dark |
| image-contrast-checker-fails | Fails |
| image-contrast-checker-dark-description | Contrast below 3:1 |
| image-contrast-checker-dark-size | Inaccessible at any text size |
| image-contrast-checker-unsupported-file | Choose a PNG, JPEG or WebP image. |
| image-contrast-checker-file-too-large | Choose an image no larger than 40 MiB. |
| image-contrast-checker-image-too-large | This image exceeds the analysis limit. Choose a smaller image. |
| image-contrast-checker-unsupported-profile | Export this image in sRGB or Display P3. |
| image-contrast-checker-p3-unavailable | This browser cannot accurately decode Display P3 images. |
| image-contrast-checker-analysis-error | Unable to analyze this image. Check that WebGL is enabled and try again. |
| image-contrast-checker-save-error | Unable to save the analysis. Please try again. |
| image-contrast-checker-saved | Image contrast analysis downloaded. |


image-contrast-checker-saved  Image contrast analysis downloaded.

## Inputs and analysis

- PNG, JPEG and WebP; at most **40 MiB** and **16,000,000 pixels**. Each
  dimension must also fit the GPU's maximum texture size. No downsampling.
- Untagged inputs default to sRGB. Embedded sRGB/Display P3 ICC primaries and
  supported PNG cICP metadata select the initial space. Unsupported,
  conflicting, oversized, or corrupt profiles are rejected. ICC decompression
  is capped at 4 MiB. P3 requires actual P3 canvas and pixel-readback support.
- Decoding honors the embedded profile in the detected space. Changing the
  dropdown applies the chosen luminance coefficients to those **same decoded
  channel values**; it is not a color conversion.
- The prototype algorithm compares each pixel to eight preceding neighbors in
  a backward 3x3 neighborhood, clamping edges. Alpha is ignored. It preserves
  the prototype transfer cutoff `0.03928` and zero tolerance.
- Maximum local contrast produces green at >= 4.5:1, blue at >= 3:1, or black
  below 3:1. **Large-text AAA is 4.5:1**, not 7:1. Small-text AAA requires
  7:1 and is not certified by the green classification.
- Save exports the analyzed canvas as a native-resolution PNG, not the UI.

This is **local pixel-contrast analysis**, not certification that an entire
image meets WCAG. Compression, screenshots, resampling, text/background
semantics, and image color management can affect interpretation.

## Interaction and lifecycle

Fit/Fill retain state across expansion and responsive changes. Zoom has one
tab stop with arrow/Home/End navigation. Desktop/tablet/mobile controls follow
the annotated DOM focus order; the native modal omits the legend, contains
focus, dismisses an open tooltip before closing on Escape, and restores focus
to Expand.

Browser Back returns to upload while retaining unrelated history state and
the URL. New uploads supersede older asynchronous work, failed replacements
retain the source image, and failed analysis disables Save. Context restoration
reanalyzes the retained pixels. Removing the block, non-BFCache page exit, or
dispatching `image-contrast-checker:destroy` releases requests, listeners,
overlays, tooltips, URLs, and GPU resources. Redecoration restores the authored
rows before rebuilding the UI.

## Validation

```sh
npx wtr 'test/blocks/image-contrast-checker/*.test.js' \
  'test/blocks/color-extract/color-extract.test.js' \
  'test/blocks/color-wheel/createImageExtractComponent.test.js' \
  --node-resolve --concurrency 1

npx eslint express/code/blocks/image-contrast-checker/*.js \
  express/code/blocks/color-headline/color-headline.js \
  express/code/blocks/color-extract/color-extract.js \
  test/blocks/image-contrast-checker/*.js \
  nala/blocks/image-contrast-checker/*.cjs

npx eslint --no-ignore \
  express/code/scripts/color-shared/components/image-upload/*.js \
  express/code/scripts/color-shared/i18n/loadImageContrastCheckerPlaceholders.js

npx stylelint express/code/blocks/image-contrast-checker/*.css \
  express/code/blocks/color-headline/color-headline.css

npm run nala local @image-contrast-checker
git diff --check
```

Unit tests use local authored HTML and placeholder fixtures. Nala uses the
existing draft path with desktop, tablet, and mobile journeys, real PNG export,
four keyboard sequences, and upload/results/modal accessibility scans.
Optional schema semantic arrays can be populated after final authored copy.
Mock-page success does not verify the actual draft, authored placeholders,
or Figma artwork. Performance audits remain deferred.
