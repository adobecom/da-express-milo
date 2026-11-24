# Color Wheel Placeholder Keys (MWPW-186677)

Source: `express/code/blocks/color-wheel/color-wheel.js`, `loadPlaceholders()`, commit `789638af9`
(PR [#871](https://github.com/adobecom/da-express-milo/pull/871), merged 2026-11-17, then reverted in
[#948](https://github.com/adobecom/da-express-milo/pull/948) later that day — confirm with the author
whether the modal is coming back before sending this to translation).

This document has no runtime effect. The current implementation retains the reverted 29-entry array;
the 12 modal keys below matter only if the feature code returns. Missing locale values would then fall
back to the listed English text.

Complete `KEYS` array from the block (41 entries, indices 0-40). Previous revision of this doc only
listed the 12 keys newly added by the Color Harmony Modal and dropped the pre-existing color-wheel
keys by mistake — full list below.

Note on non-1:1 mapping: `replaceKeyArray()` fetches `primary-color` at index 0, but no `v(0, ...)`
call consumes that value. The tab-panel id is a separate literal, and its visible label comes from
`baseColorStrings.title`, so `primary-color` is excluded from the translatable table.

| Placeholder key | Default (English) text | New in PR #871? |
|---|---|---|
| `image` | Image | No |
| `color-wheel` | Color Wheel | No |
| `custom` | Custom | No |
| `analogous` | Analogous | No |
| `complementary` | Complementary | No |
| `split-complementary` | Split complementary | No |
| `triad` | Triad | No |
| `square` | Square | No |
| `compound` | Compound | No |
| `shades` | Shades | No |
| `monochromatic` | Monochromatic | No |
| `color-harmonies` | Color harmonies: | No |
| `undo` | Undo | No |
| `redo` | Redo | No |
| `generate-random` | Generate random | No |
| `maximize` | Maximize | No |
| `create-palette` | Create palette | No |
| `contrast-checker` | Contrast Checker | No |
| `color-blindness-simulator` | Color Blindness Simulator | No |
| `no-image-try-ours` | Don’t have an image? Try one of ours: | No |
| `use-this-image` | Use this image | No |
| `extracting-colors` | Extracting colors... | No |
| `color-wheel-keyboard-hint` | Use Left and Right arrow keys to choose a color harmony. Home and End jump to the first or last option. | No |
| `color-wheel-harmony-aria` | {harmony} color harmony | No |
| `color-wheel-aria-with-hint` | Color Wheel - Press Enter to access color handles | No |
| `color-wheel-marker-aria` | {hex}, use arrow keys to move | No |
| `minimize` | Minimize | No |
| `learn-more` | Learn More | Yes |
| `learn-about-color-harmonies` | Learn about color harmonies | Yes |
| `apply-harmony` | Apply harmony | Yes |
| `custom-harmony-description` | Randomly selects a color combination scheme. | Yes |
| `analogous-harmony-description` | Uses colors that sit next to each other on the color wheel, creating a harmonious and natural look. | Yes |
| `complementary-harmony-description` | Uses colors opposite each other on the color wheel to create bold contrast and energy. | Yes |
| `split-complementary-harmony-description` | Uses a base color and two neighbors of its opposite for contrast with less tension. | Yes |
| `triad-harmony-description` | Uses one dominant color, with two other evenly spaced colors serving as accents. | Yes |
| `square-harmony-description` | Uses four evenly spaced colors on the wheel for a bold and dynamic palette. | Yes |
| `compound-harmony-description` | Combines one base color with two adjacent to its complement for balanced contrast and richness. | Yes |
| `shades-harmony-description` | Uses lighter and darker variations of one hue for a cohesive palette. | Yes |
| `monochromatic-harmony-description` | Uses one hue in varying tones for a cohesive look. | Yes |
| `new-random-palette-generated` | New random palette generated | No |

Content review required before translation: the `custom` label is pre-existing, but PR #871 added
the description “Randomly selects a color combination scheme.” Confirm whether this option is
user-defined or random, then align the label and description before localizing either string.

## Not covered by placeholders (flag separately)

Two ARIA label templates used inside the harmony modal are **hardcoded, not localized** —
`express/code/blocks/color-wheel/createHarmonyModal.js`, `STRIP_DEFAULTS` (lines 5-8):

| String (hardcoded, not a placeholder key) | Used for |
|---|---|
| `Color {index}: {hex}` | aria-label on each swatch in the modal's palette strip |
| `{count} colors in {type}` | aria-label on the palette strip itself |

The string templates predate PR #871 in `createPaletteModalContent.js` and
`createLibraryThemeModalContent.js`, but PR #871 copied them into the new harmony modal. That new use
would expose English-only ARIA labels if the feature returns. Localize these templates before
reintroducing the modal, even though they are not part of this placeholder-sheet key table.

## Out of scope for this doc

`color-wheel.js` also merges in placeholder sets from sibling modules (`baseColorStrings`,
`colorEditStrings`, `imageUploadStrings`, `colorExtractStrings`, `colorSwatchRailStrings`) loaded via
their own `load*Placeholders()` functions — those are separate components with their own key sets and
aren't part of this color-wheel handoff. Shout if you need those tabulated too.
