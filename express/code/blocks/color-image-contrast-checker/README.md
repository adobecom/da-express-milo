# Color Image Contrast Checker

`color-image-contrast-checker` pairs with Color Headline and uses the same upload,
drag/loading overlays, notifications, and tooltips as Color Extract. All UI
copy comes from placeholders. Page headings, descriptions, accuracy guidance,
and media remain authored content.

The upload area automatically uses Color Extract's subtle checkerboard pattern
(20px tiles at 15% opacity) only while hovered. It stays hidden at rest and sits
behind the upload controls without affecting file/drop handling or overlays;
no background image or additional authoring is required.

The upload section follows Color Extract's 800px minimum and vertical centering
from 600px wide. This is a minimum, not a fixed height: long authored or localized
copy can grow naturally. Below 600px the section remains content-sized, including
the portrait samples. The minimum applies only to the real block in upload mode,
not results or the nested expanded dialog; browser Back restores it.

The upload interstitial appears immediately and receives a paint opportunity
before original-file decoding and synchronous GPU work, without imposing a
minimum loading duration. It remains visible while a sample is fetched or a file
is analyzed, including replacement inside the expanded dialog. It follows the
active dialog's top layer and returns to the page on close; completion, failure,
Back, and teardown clear it without letting stale requests hide a newer upload.
If loading disables the focused Save button or color selector in the expanded
view, keyboard focus moves to the comparison region, staying inside the dialog
without opening another toolbar tooltip. Teardown releases tooltip handlers
before closing the dialog so native focus restoration cannot reopen them.
Color Extract's shared overlay timing is unchanged.

## Authoring

### Page content: the two DA block tables

Author **only these two tables in the same section**, headline first. The sample
uses real headings and paragraphs so their semantics are explicit. If recreating
the tables manually in DA, format each title as **Heading 1 or Heading 2**, not
bold/plain text.

<table>
  <tbody>
    <tr><td>Color Headline (extract, color-image-contrast)</td></tr>
    <tr><td>
      <h1>Check your image's color contrast levels (AA/AAA).</h1>
      <p>Upload an image to inspect local pixel contrast against WCAG AA and AAA thresholds.</p>
    </td></tr>
  </tbody>
</table>

<table>
  <tbody>
    <tr><td colspan="2">Color Image Contrast Checker</td></tr>
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
| background | One decorative collage picture containing the Figma left/right artwork. Use responsive picture sources where needed. Like Color Extract, it stays at its natural size, top-aligned and horizontally centered behind the desktop upload marquee, with overflow cropped rather than stretched to the viewport. It is hidden below 1200px and in results, and excluded from assistive technology. |
| samples | Authored pictures, displayed as 5:7 portrait sample buttons cropped to fill their frames. The Figma row is 343px wide with 6px gaps: four samples are 81.25 x 113.75px each, shrinking proportionally on narrower screens. Links and alt text are optional. When alt text is absent, the button uses the `color-image-contrast-checker-use-this-image` placeholder as its accessible name. Selecting an unlinked DA image fetches its original media URL without image-optimization parameters; an optional wrapping link overrides that URL and should point to the original full-resolution PNG/JPEG/WebP. |

No other rows are supported. Duplicate rows, missing headings/accuracy guidance,
invalid samples, and missing required checker placeholders fail explicitly.
The previous `hero` and UI-string rows are not an alternate authoring API.

### Sample interaction states

Sample styling follows the established Color Extract experience: a gray resting
border, a dark hover border with a soft shadow and a dark 2px selected ring
with a white inset. Native pressed feedback uses the selected decoration without
committing selection before decoding and rendering succeed. These are **Color Extract
prior-art states, not Figma-verified state variants**: the supplied Figma image
widget (`I2010:61232;6341:488965`) confirms geometry, but its referenced
components (`2004:672` and `2004:11547`) expose no accessible state definitions.
Decorative overlays and shadows leave the 343px row, 6px gaps, 5:7 crop and
8px image radius unchanged. Keyboard focus uses the dark image border alongside
its independent blue focus ring.

Only the sample supplying the successfully decoded and rendered current image
is selected (`aria-pressed="true"`); all others remain false. Loading a sample
does not select it prematurely. Failed fetches, decoding or rendering and
canceling the replacement picker retain the current selection. A successful
custom upload or drop, browser Back to the upload view, and teardown clear it.
Stale asynchronous loads cannot change selection; color-space changes, fit/fill
and expansion do not independently change sample identity.
If rendering fails after the GPU output has been modified, the prior source and
selection are retained but Save stays disabled. The original error is reported;
only a subsequent successful analysis or upload can enable export again.

### Migrating the draft

After the block rename, update the checker table heading to **Color Image
Contrast Checker** and the headline table heading to **Color Headline (extract,
color-image-contrast)**. Update the 45 checker placeholder or page-metadata
keys to use the `color-image-contrast-checker-*` prefix.
The six shared `color-image-upload-*` keys stay unchanged. The existing draft
URL remains `/drafts/nate/image-contrast-checker`; the block name does not
require renaming the page.

For `/drafts/nate/image-contrast-checker`, replace the earlier keyed table with
the two blocks above. Move UI-string values into the site's placeholder sheet
using the reference below. Supply the decorative Figma artwork and sample
originals separately. Save and preview in DA, then use `npm run up:color` and
open the same relative path at `http://localhost:3000`.

Code does not migrate, publish, or overwrite DA content or placeholders.

## External placeholders file (not a page block)

The following key/value table is a reference for the site's **external
placeholders file**. It is **not** another block table to paste into the DA page.

The checker batch-loads `color-image-contrast-checker-*` keys using the same loader
pattern as Color Extract. Every checker key below is required; there are no
English defaults or raw-key UI fallbacks. `{width}` and `{height}` are replaced
in the dimensions string. Translate values, not keys or substitutions.

### Temporary page-metadata fallback

Until the external placeholders file is available, put the same keys and values
in the page's **Metadata** table, outside the checker block. Use the exact
hyphenated names from the reference below. For example:

| Metadata | |
| --- | --- |
| color-image-contrast-checker-color-space | Color space |
| color-image-contrast-checker-save-png | Save PNG |
| color-image-contrast-checker-dimensions | {width} by {height} pixels |
| color-image-upload-button | Upload your image |

These are examples, not a complete bundle: provide **all 45
`color-image-contrast-checker-*` keys** from the reference when none resolves
externally. The six shared `color-image-upload-*` keys may also be supplied
through metadata for this checker.

For each key, a resolved external value takes precedence over page metadata.
Missing external values fall back to nonblank metadata values. Checker keys
still fail explicitly if neither source resolves; shared upload keys retain
their existing defaults after both sources are checked. This metadata fallback
is used only by Color Image Contrast Checker, not Color Extract or Color Wheel.
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
| color-image-contrast-checker-landing-aria | Upload an image for contrast analysis |
| color-image-contrast-checker-analyzing-image | Analyzing image contrast... |
| color-image-contrast-checker-drop-overlay-text | Drop your image anywhere |
| color-image-contrast-checker-no-image-try-ours | Don't have an image? Try one of ours: |
| color-image-contrast-checker-use-this-image | Use this image |
| color-image-contrast-checker-toolbar-aria | Image comparison zoom |
| color-image-contrast-checker-color-space | Color space |
| color-image-contrast-checker-color-space-help | Supports sRGB and P3. Changing color space recalculates contrast with that space's luminance weights; it does not convert the image. |
| color-image-contrast-checker-srgb | sRGB |
| color-image-contrast-checker-p3 | P3 |
| color-image-contrast-checker-replace-image | Upload a new image |
| color-image-contrast-checker-save-png | Save PNG |
| color-image-contrast-checker-expand | Expand image comparison |
| color-image-contrast-checker-minimize | Close expanded image comparison |
| color-image-contrast-checker-fit | Fit images |
| color-image-contrast-checker-fill | Fill image view |
| color-image-contrast-checker-comparison | Image contrast comparison |
| color-image-contrast-checker-original | Original uploaded image |
| color-image-contrast-checker-analysis | Color-coded image contrast analysis. Refer to the legend for contrast thresholds. |
| color-image-contrast-checker-dimensions | {width} by {height} pixels |
| color-image-contrast-checker-legend | Legend |
| color-image-contrast-checker-large-text | Large text |
| color-image-contrast-checker-large-text-help | Large text is at least 18pt regular or 14pt bold. |
| color-image-contrast-checker-small-text | Small text |
| color-image-contrast-checker-small-text-help | Small text is below 18pt regular or 14pt bold. |
| color-image-contrast-checker-green | Green |
| color-image-contrast-checker-passes | Passes |
| color-image-contrast-checker-green-large | ≥ 4.5:1 (AAA) |
| color-image-contrast-checker-green-small | ≥ 4.5:1 (AA) |
| color-image-contrast-checker-blue | Blue |
| color-image-contrast-checker-partial | Partial |
| color-image-contrast-checker-blue-large | ≥ 3:1 (AA) |
| color-image-contrast-checker-blue-small | Fails all levels |
| color-image-contrast-checker-dark | Dark |
| color-image-contrast-checker-fails | Fails |
| color-image-contrast-checker-dark-description | Contrast below 3:1 |
| color-image-contrast-checker-dark-size | Inaccessible at any text size |
| color-image-contrast-checker-unsupported-file | Choose a PNG, JPEG or WebP image. |
| color-image-contrast-checker-file-too-large | Choose an image no larger than 40 MiB. |
| color-image-contrast-checker-image-too-large | This image exceeds the analysis limit. Choose a smaller image. |
| color-image-contrast-checker-unsupported-profile | Export this image in sRGB or Display P3. |
| color-image-contrast-checker-p3-unavailable | This browser cannot accurately decode Display P3 images. |
| color-image-contrast-checker-analysis-error | Unable to analyze this image. Check that WebGL is enabled and try again. |
| color-image-contrast-checker-save-error | Unable to save the analysis. Please try again. |
| color-image-contrast-checker-saved | Image contrast analysis downloaded. |

Legend thresholds use the `≥` glyph. Existing authored `>=` operators render
as `≥`; numeric thresholds and localized descriptions are preserved.

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
  Filenames retain the original basename and include the selected analysis space:
  `photo-contrast-srgb.png` or `photo-contrast-display-p3.png`. This identifies
  the analysis coefficients, not a conversion or an embedded PNG profile.
  Changing the image or analysis space during export discards the stale download.

This is **local pixel-contrast analysis**, not certification that an entire
image meets WCAG. Compression, screenshots, resampling, text/background
semantics, and image color management can affect interpretation.

## Interaction and lifecycle

The color-space selector is 208px wide on tablet/desktop, 224px on mobile,
and 256px in the expanded mobile view. It shrinks when necessary to fit
narrower screens; the label and selector use Figma's 14px field typography.

Fit/Fill retain state across expansion and responsive changes. Zoom has one
tab stop with arrow/Home/End navigation. Desktop/tablet/mobile controls follow
the annotated DOM focus order; the native modal shows the compact legend, contains
focus, dismisses an open tooltip before closing on Escape, and restores focus
to Expand.

The full legend uses one white bordered surface with Green/Passes,
Blue/Partial, and Dark/Fails rows, decorative swatches and status icons.
Threshold labels remain localized, with inline tooltip labels and values.
It sits beside the image at the existing 900px desktop breakpoint, below it
in three columns at 700–899px, and stacks vertically on narrower screens.
The authored accuracy note is a separate gray information card below the legend.
Expanded views show only the compact swatch/status legend, without threshold
tooltip tab stops or the accuracy note. Long localized copy can wrap; legend
and accuracy content are not clipped to fixed heights.

Browser Back returns to upload while retaining unrelated history state and
the URL. New uploads supersede older asynchronous work, failed replacements
retain the source image, and failed analysis disables Save. Context restoration
reanalyzes the retained pixels. Removing the block, non-BFCache page exit, or
dispatching `color-image-contrast-checker:destroy` releases requests, listeners,
overlays, tooltips, URLs, and GPU resources. Redecoration restores the authored
rows before rebuilding the UI.

## Validation

```sh
npx wtr 'test/blocks/color-image-contrast-checker/*.test.js' \
  'test/blocks/color-extract/color-extract.test.js' \
  'test/blocks/color-wheel/createImageExtractComponent.test.js' \
  --node-resolve --concurrency 1

npx eslint express/code/blocks/color-image-contrast-checker/*.js \
  express/code/blocks/color-headline/color-headline.js \
  express/code/blocks/color-extract/color-extract.js \
  test/blocks/color-image-contrast-checker/*.js \
  nala/blocks/color-image-contrast-checker/*.cjs

npx eslint --no-ignore \
  express/code/scripts/color-shared/components/image-upload/*.js \
  express/code/scripts/color-shared/i18n/loadColorImageContrastCheckerPlaceholders.js

npx stylelint express/code/blocks/color-image-contrast-checker/*.css \
  express/code/blocks/color-headline/color-headline.css

npm run nala local @color-image-contrast-checker
git diff --check
```

Unit tests use local authored HTML and placeholder fixtures. Nala uses the
existing draft path with desktop, tablet, and mobile journeys, real PNG export,
four keyboard sequences, and upload/results/modal accessibility scans.
Optional schema semantic arrays can be populated after final authored copy.
Mock-page success does not verify the actual draft, authored placeholders,
or Figma artwork. Performance audits remain deferred.
