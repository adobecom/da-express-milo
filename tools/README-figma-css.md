# Figma variables → CSS

Design tokens for **Final Color Expansion CCEX-221263** are pulled from the Figma REST API so CSS stays in sync with the spec.

**Spec:** [Figma — node 6215-344297](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=6215-344297&m=dev) / [6215-344299 strip](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=6215-344299&m=dev)

## Get CSS from REST API

1. Create a [Figma access token](https://www.figma.com/developers/api#access-tokens) with `file_variables:read` (Variables REST API).
2. Run to fetch tokens and write to `color-tokens.css`:

```bash
FIGMA_ACCESS_TOKEN=your_token node tools/figma-variables-to-css.js --out express/code/scripts/color-shared/color-tokens.css
```

3. Or print to stdout:

```bash
FIGMA_ACCESS_TOKEN=your_token node tools/figma-variables-to-css.js
```

**Output:** Tokens are written to `express/code/scripts/color-shared/color-tokens.css`. Figma path format (e.g. `Spacing/Spacing 50`) becomes `--Spacing-Spacing-50`. No fallbacks in component CSS; all tokens defined in `color-tokens.css`.

**API used:** `GET https://api.figma.com/v1/files/:file_key/variables/local`  
**Docs:** [Figma Variables endpoints](https://developers.figma.com/docs/rest-api/variables-endpoints/)
