# Mini Editor Widget

A configurable in-page editing surface, built on the shared Express Spectrum
wrappers (`scripts/shared/spectrum`). It renders three regions:

- **Top action bar** — right-aligned buttons (e.g. Share / Edit / Download).
- **Center canvas** — a generic content slot (caller injects the preview DOM),
  with optional prev/next navigation pills.
- **Bottom control bar** — a single-select Font toggle group and a Background
  color swatch row, separated by a divider.

The caller decides which actions and controls appear. There is no dark-mode
toggle by design.

## Usage

```js
import createMiniEditorWidget from '../../scripts/widgets/mini-editor-widget/mini-editor-widget.js';

const editor = await createMiniEditorWidget({
  content: previewEl, // any HTMLElement to edit/preview
  topActions: [
    { id: 'share', type: 'button', label: 'Share', onClick: onShare },
    { id: 'edit', type: 'action', iconOnly: true, ariaLabel: 'Edit', onClick: onEdit },
    { id: 'download', type: 'action', iconOnly: true, ariaLabel: 'Download', onClick: onDownload },
  ],
  fontOptions: [
    { id: 'sans', label: 'A', ariaLabel: 'Sans serif', selected: true, onSelect: applyFont },
    { id: 'serif', label: 'A', ariaLabel: 'Serif', fontFamily: 'Georgia, serif', onSelect: applyFont },
  ],
  backgrounds: {
    colors: ['#7FD4FF', '#8E5BFF', '#C9A27E'],
    labels: ['Sky', 'Violet', 'Sand'],
    selected: ['0'],
    onChange: ({ index }) => applyBackground(index),
  },
  strings: { actionsLabel: 'Editor actions', fontGroupLabel: 'Font', backgroundsLabel: 'Background' },
});
container.appendChild(editor.element);
```

## Config

| Key              | Type            | Notes |
|------------------|-----------------|-------|
| `content`        | `HTMLElement`   | Preview element placed in the center canvas. |
| `topActions`     | `Array`         | `{ id, type: 'button'\|'action', label, ariaLabel, variant, size, icon, iconOnly, onClick }`. |
| `fontOptions`    | `Array`         | `{ id, label, ariaLabel, fontFamily, icon, selected, onSelect(id) }`. Single-select. |
| `backgrounds`    | `Object`        | `{ colors, labels, selected, onChange({ selected, index }) }` → `createExpressSwatchGroup`. |
| `bottomControls` | `HTMLElement[]` | Extra custom control elements appended after the swatches. |
| `navigation`     | `Object`        | `{ onPrev, onNext, prevLabel, nextLabel }` → prev/next pills over the canvas. |
| `strings`        | `Object`        | a11y labels: `actionsLabel`, `fontGroupLabel`, `backgroundsLabel`, `prevLabel`, `nextLabel`. |

Well-known `id`s (`share`, `download`, `edit`, `font`) get a default icon that
callers may override via the action's `icon` (an element or SVG/HTML string).

## Returns

`Promise<{ element, setActiveFont(id), setActiveBackground(values), destroy() }>`

- `element` — the widget root (an `<sp-theme>` wrapper); append it to the DOM.
- `setActiveFont(id)` — programmatically select a font option.
- `setActiveBackground(values)` — set the selected swatch value(s).
- `destroy()` — tear down Spectrum children and remove the widget.

## Demo

Open `demo.html` from this folder on a local server to exercise the widget.
