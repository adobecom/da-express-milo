# Mini Editor Widget

A configurable in-page quote-editing surface, extracted verbatim from the
`mini-editor` block so the exact same UI/UX can be reused elsewhere. It is a
vanilla-DOM widget (no Spectrum Web Components) that renders one editing stage
which adapts across breakpoints from a single config:

- **Desktop (≥1200px)** — a centred editor card (`.me-card`) with the live
  quote, flanked by a two-column zig-zag of decorative preview cards
  (`.mini-editor-decorations`). Each preview offers "Use this quote" / "Copy".
- **Tablet/mobile (<1200px)** — a 3-card arc carousel (prev / centre / next)
  with a rotating slide animation and a fading "ghost" exit card.
- **Shared controls** — a Font-style toggle and a Background-colour swatch
  row. On tablet/desktop they expand as inline rows; on mobile (≤767px) they
  open as slide-up bottom sheets. Both are driven by one `data-me-panel`
  attribute on the root, so which surface shows is pure CSS per breakpoint.

The caller supplies the data (fonts, background cards, quotes) and the shared
a11y/clipboard helpers; the widget owns all rendering, interaction, animation,
and the cross-block `mini-editor:use-quote` event wiring.

> **Note on the API shape.** This mirrors the config-driven shape of the
> Spectrum-based `mini-editor-widget` proposed in adobecom/da-express-milo#680
> (`content`, `topActions`, `fontOptions`, `backgrounds`, …) but keeps this
> project's existing pixel-identical vanilla UI rather than the Spectrum
> rendering. `topActions` now renders the top-right hover action bar (Figma
> node 1099-5050) — see the Config table below.

## Usage

```js
import createMiniEditorWidget from '../../scripts/widgets/mini-editor-widget/mini-editor-widget.js';

const editor = await createMiniEditorWidget({
  root: block,          // element the widget sets state attrs / CSS vars / mode class on
  topActions: [         // top-right hover action bar (Figma node 1099-5050)
    { type: 'edit', onClick: onEdit },
    { type: 'share', onClick: onShare },
    { type: 'download', onClick: onDownload },
  ],
  fontOptions,          // [{ label, font, italic, weight }]
  backgrounds: {        // our fetched card set + paired quotes
    cardSet: [{ card: { id, bg }, quote, author }, ...],
    decoCount: 8,       // how many of cardSet[1..] become desktop decorations / arc cards
  },
  a11y: {               // shared helpers the widget uses but does not own
    trapFocus,
    handleEscapeClose,
    disableBackgroundScroll,
    restoreBackgroundScroll,
    copyQuoteToClipboard, // async (quote, author) => boolean
  },
  deps: { createTag, getIconElementDeprecated },
});

header.append(editor.decorations); // decorations anchor to the header, not the stage
block.append(editor.stage);
```

The host block is responsible for loading the widget stylesheet:

```js
loadStyle(`${getConfig().codeRoot}/scripts/widgets/mini-editor-widget/mini-editor-widget.css`);
```

## Config

| Key           | Type          | Notes |
|---------------|---------------|-------|
| `root`        | `HTMLElement` | Element the widget sets `data-me-panel`, `--me-*` custom properties, and the `me-carousel-mode` class on. In the block this is the `.mini-editor` block element (which also defines the `--me-*` layout tokens in `mini-editor.css`). |
| `topActions`  | `Array`       | Top-right hover action bar (Figma node 1099-5050): `[{ type: 'edit'\|'share'\|'download', onClick }, ...]`. Only the types supplied are rendered, in the given order — pass `[]` (or omit) to render none. Always visible on tablet/mobile (no hover); fades in on hover/focus-within on desktop. |
| `fontOptions` | `Array`       | `{ label, font, italic, weight }`. First entry is applied on load (selected). Single-select. |
| `backgrounds` | `Object`      | `{ cardSet, decoCount }`. `cardSet` is `[{ card: { id, bg }, quote, author }, ...]`; `cardSet[0]` powers the main widget and the rest (up to `decoCount`, default 8) power the decorations / arc. |
| `a11y`        | `Object`      | `{ trapFocus, handleEscapeClose, disableBackgroundScroll, restoreBackgroundScroll, copyQuoteToClipboard }`. |
| `deps`        | `Object`      | `{ createTag, getIconElementDeprecated }` from the host's utils. |

## Returns

`Promise<{ stage, decorations, useQuote, updateCentre, syncViewportMode, destroy }>`

- `stage` — the editing surface root (`.mini-editor-stage`); append it under the block.
- `decorations` — the desktop decorative-card layer; append it to the header.
- `useQuote({ quote, author, card, font })` — swap the active quote/author (and
  optionally background/font) into the live editor.
- `updateCentre(patch)` — patch the arc carousel's centre card (`{ quote, author }`,
  `{ card }`, or carousel-wide `{ font }`).
- `syncViewportMode()` — re-evaluate the desktop/carousel breakpoint (also runs on resize).
- `destroy()` — remove listeners (resize, outside-click, the `mini-editor:use-quote`
  document listener) and the panel MutationObserver.

## Events

The widget listens on `document` for `mini-editor:use-quote`
(`{ detail: { quote, author } }`) — dispatched by the collapsible-rows block's
"Create a design" button — and swaps that quote/author into the editor, then
scrolls the root into view. The two blocks stay decoupled via this event
instead of importing one into the other.
