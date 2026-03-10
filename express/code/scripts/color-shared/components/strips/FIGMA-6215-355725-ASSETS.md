# Figma horizontal strip (6215-355725) – assets & color picker

**Figma:** [Final Color Expansion CCEX-221263, node 6215-355725](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=6215-355725&m=dev)

## Node structure (from `dev/figma-node-inspect.js`)

- **Color-strip** (INSTANCE): 1400×48, flex row, padding 8px 12px, gap 8px, border-radius 8px 8px 0 0, background #7b9ea6.
- **Container**: flex row, gap 6px, justify-content space-between → “Hex code and copy” + **Icon-container** (6 children: lock, copy, **color-picker circle**, etc.).
- **Color-strip-button**, **Action button (M)**: 32×32, border-radius 8px.
- **Icon-container**: 64×32, flex row, multiple icon buttons (lock, copy, **circle that opens color picker** – Figma asset “Frame 20 x 20” in Dev Mode).

## Getting assets from Figma

Icons (e.g. the 20×20 circle) are not returned by the **node** API; you need the **Images** API to export them:

1. **Get node IDs** for the icon layers (e.g. the circle icon) from the file:
   - `GET https://api.figma.com/v1/files/:file_key?ids=6215-355725&depth=10` and find the child node id for the icon.
2. **Export as PNG/SVG:**
   - `GET https://api.figma.com/v1/images/:file_key?ids=:node_id&format=svg`
   - Requires `file_content:read` (and the node you request is the one rendered; parents may include full frame).
3. **Token:** Same `FIGMA_ACCESS_TOKEN` with `file_content:read` (and `file_variables:read` if you use variables).

References: [Figma REST API – Images](https://developers.figma.com/docs/rest-api/), [Exporting nodes](https://forum.figma.com/ask-the-the-community-7/is-it-possible-to-get-an-image-for-a-specific-node-id-with-the-rest-api-36894).

## Color-picker circle – supported or build?

| Where | Support |
|--------|--------|
| **`<color-palette>`** | ✅ Slots `color-picker-button-${index}` and `mobile-color-picker-button`; host supplies the button that opens the picker. |
| **`<color-swatch-rail>`** | ❌ No slot or built-in color-picker button. **We have to build it.** |

So for the horizontal rail (and optionally vertical/stacked), we need to:

- Add a **circle button** (20×20 outline to match Figma “Frame 20 x 20”).
- On click: open a color picker (e.g. native `<input type="color">` or integrate `<color-wheel>` / modal) and update that swatch (and controller state) on change.

The rail component can expose an event (e.g. `color-swatch-rail-edit`) so the host can open a custom picker (e.g. `<ac-brand-libraries-color-picker>`) instead of the native input if desired.
