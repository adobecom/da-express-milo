# Figma variables → CSS

Design tokens for **Final Color Expansion CCEX-221263** are pulled from the Figma REST API so CSS stays in sync with the spec.

**Spec:** [Figma — node 6215-344297](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=6215-344297&m=dev) / [6215-344299 strip](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=6215-344299&m=dev)

## Get CSS from REST API

1. Create a [Figma access token](https://www.figma.com/developers/api#access-tokens) with `file_variables:read` (Variables REST API).
2. Run:

```bash
FIGMA_ACCESS_TOKEN=your_token node tools/figma-variables-to-css.js
```

3. To write the result to the repo (so the app can load it):

```bash
FIGMA_ACCESS_TOKEN=your_token node tools/figma-variables-to-css.js > express/code/scripts/color-shared/components/strips/color-strip-figma.css
```

4. Ensure the block loads `color-strip-figma.css` after `color-strip.css` if you want API-generated tokens to override the fallbacks in `color-strip.css`.

**API used:** `GET https://api.figma.com/v1/files/:file_key/variables/local`  
**Docs:** [Figma Variables endpoints](https://developers.figma.com/docs/rest-api/variables-endpoints/)
