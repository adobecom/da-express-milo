# Color Palette URL Param API

This utility provides a shared contract for reading/writing a palette from URL query params.

- Source: [utilities.js](/Users/cano/Adobe/da-express-milo/express/code/scripts/color-shared/utils/utilities.js)
- Param name: `color-palette`
- Public API: `createColorPaletteParamApi()`

## Summary

The `color-palette` query parameter is a comma-separated list of hex segments.
The API normalizes accepted values to `#RRGGBB` for in-app use, and writes URL wire values without `#` (comma-separated).

This API is used for deep-linkable color flows (for example, palette edit/open links in Color Explore).

## Contract

### Query parameter

- Name: `color-palette`
- Wire format: comma-separated hex segments, e.g. `FF0000,00AA00,ABC`

### Valid segment

- 3-digit hex (`RGB`) or 6-digit hex (`RRGGBB`)
- Optional leading `#`
- Case-insensitive
- Whitespace around each segment is trimmed

### Normalization

- All accepted values normalize to uppercase `#RRGGBB`
- 3-digit shorthand is expanded:
  - `f00` / `#f00` -> `#FF0000`

## API

## `createColorPaletteParamApi()`

Returns:

- `getResolvedPalette(urlOrString?) => string[]` (always `#RRGGBB`)
- `setOnUrl(url, colors, options?) => void`
- `PARAM_NAME` (`color-palette`)

### `getResolvedPalette(urlOrString?)`

- Reads `color-palette` from the provided URL (or `window.location.href` when omitted).
- Returns `string[]` of normalized `#RRGGBB`.
- If the param is missing or empty, returns defaults from `PALETTE_PRESETS` (via `pickRandomPalette()`).
- If any token in the param is invalid, the whole param is ignored and defaults are returned.

### `setOnUrl(url, colors, { merge = 'replace' } = {})`

- `colors` input is expected as `string[]`.
- Each item is normalized with the same hex validator/normalizer.
- Invalid entries are ignored.
- If no valid entries remain, the function is a no-op.
- Writes wire format as uppercase 6-digit hex without `#`.
- Preserves unrelated query params.

Merge modes:

- `replace` (default): replace `color-palette` entirely with normalized input.
- `append`: append normalized input to existing `color-palette` (if present).

## Defaults (Design source of truth)

Defaults are stored in `PALETTE_PRESETS` in [utilities.js](/Users/cano/Adobe/da-express-milo/express/code/scripts/color-shared/utils/utilities.js).
`getResolvedPalette()` falls back to one of these presets through `pickRandomPalette()`.

## Integration points

- Color Explore edit/open URL builder uses `setOnUrl(...)`:
  - [color-explore.js](/Users/cano/Adobe/da-express-milo/express/code/blocks/color-explore/color-explore.js:101)

## Examples

```js
import { createColorPaletteParamApi } from '../../scripts/color-shared/utils/utilities.js';

const api = createColorPaletteParamApi();

api.getResolvedPalette('https://example.test/page?color-palette=f00,00ff00');
// => ['#FF0000', '#00FF00']

const url = new URL('https://example.test/page?foo=bar&martech=off');
api.setOnUrl(url, ['#AABBCC'], { merge: 'append' });
url.toString();
// => 'https://example.test/page?foo=bar&martech=off&color-palette=AABBCC'
// (URL encoding may show commas as %2C in final string serialization)
```

## Tests

Coverage lives in:

- [colorPaletteParam.test.js](/Users/cano/Adobe/da-express-milo/test/scripts/color-shared/utils/colorPaletteParam.test.js)

Includes:

- parse + normalize
- 3-digit expansion
- missing/empty defaults
- invalid token behavior
- append/replace merge behavior
- preserving unrelated query params
