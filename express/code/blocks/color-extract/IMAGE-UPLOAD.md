# Image Upload Dropzone

A reusable drag-and-drop image upload component used inside the `color-extract` block. It supports file selection via button click, keyboard activation, and drag-and-drop — with five visual states matching the Spectrum 2 design system.

## Quick Start

The dropzone is created by calling `createDropzone()` from `color-extract.js`. It returns a container element and handlers you can wire into your own block.

```js
import { createTag } from '../../scripts/utils.js';

// Inside your block's decorate function:
const dropzone = createDropzone(block, controller, onImageReady, {
  enableImageUpload: true,
  enableUrlInput: true,
  maxColors: 5,
});

// Append the container to your layout
myWrapper.append(dropzone.container);

// Programmatically load an image by URL
dropzone.handleUrl('https://example.com/photo.jpg');

// Programmatically load a File object
dropzone.handleFile(fileFromInput);
```

## Config Options

| Key | Type | Default | Description |
|---|---|---|---|
| `enableImageUpload` | `boolean` | `true` | Enables the file input and drag-and-drop. When `false`, the dropzone renders in its **Disabled** state. |
| `enableUrlInput` | `boolean` | `true` | Allows loading images from a URL via `handleUrl()`. |
| `maxColors` | `number` | `10` | Number of palette swatches extracted from the uploaded image (1–10). |

## Visual States

The dropzone container cycles through five states, all driven by CSS classes and pseudo-classes — no JavaScript state flags are needed beyond `highlight` and `is-disabled`.

| State | Trigger | Border | Background | Overlay |
|---|---|---|---|---|
| **Default** | None | `dashed #292929` | `#f8f8f8` | Hidden |
| **Hover** | `:hover` | `dashed #292929` | `#fff` | 15% opacity |
| **Focus** | Tab / `:focus-within` | Transparent | `#f8f8f8` | Hidden |
| **Active** | `:active` or `.highlight` (dragover) | `dashed #274dea` | `#fff` | 15% opacity |
| **Disabled** | `.is-disabled` class | `dashed #dadada` | `#f8f8f8` | Hidden |

The focus ring is a `::after` pseudo-element: 2px solid `#4b75ff` at -4px inset with 10px border-radius.

The decorative overlay is a `::before` pseudo-element using a background image that fades in at 15% opacity during Hover, Active, and Drag states.

## DOM Structure

```
.color-extract-dropzone-container       <!-- outer wrapper, receives state classes -->
  .color-extract-dropzone               <!-- clickable/focusable region (role="button") -->
    .color-extract-upload-button        <!-- styled accent button -->
      .color-extract-upload-icon        <!-- upload arrow SVG -->
      .color-extract-upload-label       <!-- "Upload your image" -->
    .color-extract-dropzone-text
      .color-extract-dropzone-title     <!-- "Or drag and drop here" -->
      .color-extract-dropzone-subtitle  <!-- file type / size hint -->
  input[type="file"]                    <!-- hidden file input -->
  img.color-extract-preview             <!-- shown after upload (hidden initially) -->
  .color-extract-loading                <!-- spinner overlay (hidden initially) -->
  .color-extract-swatch-row             <!-- extracted color chips -->
```

## CSS Classes on the Container

| Class | When Applied | Effect |
|---|---|---|
| `highlight` | File dragged directly over the dropzone | Accent border + white bg |
| `is-disabled` | `enableImageUpload` is `false` | Grayed-out button/text, no interactions |
| `has-image` | After a successful image load | Hides the dropzone prompt, shows preview |

Block-level classes (on the parent `.color-extract` element):

| Class | When Applied |
|---|---|
| `is-dragging` | File dragged anywhere over the window |
| `is-loading` | Image is being read / processed |
| `has-image` | Image loaded and palette extracted |

## Events

The dropzone emits custom events on the block element, prefixed with `color-extract:`.

| Event | Payload | Fired When |
|---|---|---|
| `color-extract:image-upload` | `{ file }` | User drops or selects a file |
| `color-extract:url-input` | `{ url }` | Image loaded via `handleUrl()` |
| `color-extract:color-extract` | `{ palette, src }` | Palette extraction completes |

```js
block.addEventListener('color-extract:color-extract', (e) => {
  console.log('Extracted palette:', e.detail.palette);
  console.log('Image source:', e.detail.src);
});
```

## Adapting for Your Own Block

1. **Copy the dropzone styles** from `color-extract.css` — everything under `.color-extract-dropzone-container` and its children. Rename the `.color-extract` prefix to match your block.

2. **Copy the CSS custom properties** from the top of `color-extract.css` (the `:root` / `.color-extract` block) into your own block's scope. You only need: `--radius`, `--border`, `--accent`, `--accent-hover`, `--focus`, `--disabled-bg`, `--disabled-text`, and `--overlay-image`.

3. **Extract `createDropzone()`** and its helpers (`preventDefaults`, `isImageFile`, `createSwatchRow`) into a shared module, or import them from this block.

4. **Provide a `ColorThemeController`** (or pass `null` if you only need the raw palette). The controller drives the swatch rail web component.

5. **Wire the callback** — the third argument to `createDropzone` (`onImage`) receives the image `src` after a successful load. Use it to update your own UI.

### Minimal Example

```js
import { createTag } from '../../scripts/utils.js';

export default function decorate(block) {
  const config = { enableImageUpload: true, enableUrlInput: false, maxColors: 5 };
  const dropzone = createDropzone(block, null, (src) => {
    console.log('Image ready:', src);
  }, config);

  block.innerHTML = '';
  block.classList.add('color-extract');
  block.append(dropzone.container);
}
```

## Supported File Types

JPEG, JPG, PNG, and WebP — up to 40 MB. The `accept` attribute on the hidden input is `image/*`, with a runtime check via `file.type.startsWith('image/')`.
