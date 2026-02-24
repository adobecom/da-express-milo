# Adding a New Spectrum Web Component

Steps to add a new `@spectrum-web-components/*` component to the bundled set.

---

## 1. Add the package (if needed)

In the **repo root** `package.json`, add the component under `devDependencies`:

```json
"@spectrum-web-components/button": "^1.3.0"
```

Then run:

```bash
npm install
```

Skip this step if the package is already listed.

---

## 2. Add a wrapper in `src/`

Create a file in `express/code/scripts/widgets/spectrum/src/` named after the component, e.g. `button.js`.

- **Side-effect import** the custom element so it registers.
- **Re-export** whatever your app needs (elements, types, constants).

**Simple (element only):**

```js
// src/button.js
import '@spectrum-web-components/button/sp-button.js';
export { Button } from '@spectrum-web-components/button';
```

**With extra exports:**

```js
// src/overlay.js (example)
import '@spectrum-web-components/overlay/sp-overlay.js';
import { Overlay } from '@spectrum-web-components/overlay/src/Overlay.js';
import { SlottableRequestEvent } from '@spectrum-web-components/overlay/src/slottable-request-event.js';
export { Overlay, SlottableRequestEvent };
```

Use the package’s real entry (e.g. `sp-button.js`) and export paths from the package docs or `node_modules`.

---

## 3. Register it in the build map

In `build.mjs`, add the component to the **moduleMap** (so other bundles resolve `@spectrum-web-components/<name>` to your bundle):

```js
const moduleMap = {
  'base': 'base',
  'theme': 'theme',
  'picker': 'picker',
  'menu': 'menu',
  'overlay': 'overlay',
  'popover': 'popover',
  'shared': 'shared',
  'reactive-controllers': 'reactive-controllers',
  'button': 'button',   // key = package name, value = bundle filename (no .js)
};
```

- **Key:** package name after `@spectrum-web-components/` (e.g. `button`).
- **Value:** your wrapper filename without `.js`.

---

## 4. Build

From the repo root:

```bash
npm run build:spectrum
```

The build picks up every `*.js` in `src/` and outputs to `dist/`. Your new bundle will be at `dist/<name>.js`.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Add `@spectrum-web-components/<name>` in root `package.json` → `npm install` |
| 2 | Add `src/<name>.js` (import element + export what you need) |
| 3 | Add `'<name>': '<name>'` to the `moduleMap` in `build.mjs` |
| 4 | Run `npm run build:spectrum` |

Then load the new bundle in your app and use the tag (e.g. `<sp-button>`) as in the [Spectrum Web Components docs](https://opensource.adobe.com/spectrum-web-components/).
