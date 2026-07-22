# Spectrum Web Components Bundler

How to add new SWC components and regenerate bundles.

---

## Prerequisites

```bash
npm install          # installs esbuild + @spectrum-web-components packages
```

---

## Generate new component bundles

```bash
npm run build:spectrum
```

This builds bundles for: **button**, **tooltip**, **dialog**, **toast**, **tags**, **textfield**, **search**.

Output goes to `express/code/scripts/widgets/spectrum/dist/`.

---

## Regenerate all bundles (including existing)

```bash
npm run build:spectrum -- --all
```

This also regenerates: **lit**, **base**, **theme**, **shared**, **reactive-controllers**, **icons-ui**, **icons-workflow**, **overlay**, **popover**, **menu**, **picker**.

> **Warning:** Regenerating existing bundles updates them to the currently installed SWC version. Verify that the picker and existing consumers still work after a full rebuild.

---

## Adding a new component

1. **Install the SWC package:**

```bash
npm install --save-dev @spectrum-web-components/<component-name>
```

2. **Add the entry to `build.mjs`:**

Open `express/code/scripts/widgets/spectrum/build.mjs` and add to the `newComponents` array:

```js
{ name: 'component-name', pkg: '@spectrum-web-components/component-name' },
```

3. **Run the build:**

```bash
npm run build:spectrum
```

4. **Add external mappings (if needed):**

If other components should treat the new bundle as external (shared), add a mapping to `externalMappings` in `build.mjs`:

```js
{ match: /^@spectrum-web-components\/component-name(\/.*)?$/, target: './component-name.js' },
```

5. **Create a wrapper:**

Add `express/code/scripts/color-shared/spectrum/components/express-<name>.js` following the pattern of existing wrappers.

6. **Add a loader:**

Add a `load<Name>()` function to `load-spectrum.js`.

7. **Add override CSS:**

Create `express/code/scripts/color-shared/spectrum/styles/<name>.css`.

8. **Export from `index.js`:**

Add the new wrapper and loader to `spectrum/index.js`.

---

## How the bundler works

Each component is built with esbuild using a synthetic entry point:

```js
export * from '@spectrum-web-components/<pkg>';
```

Shared dependencies (lit, base, theme, shared, reactive-controllers, icons, overlay, popover, menu, button, textfield) are marked as **external** and rewritten to relative `./dist` paths. This keeps bundles lean — each component file contains only its own code and any non-shared sub-dependencies.

The external mapping plugin (`createExternalPlugin(selfName)`) intercepts `@spectrum-web-components/*` and `lit*` imports and redirects them to the corresponding local `dist/*.js` file. It automatically skips mappings that would cause a bundle to reference itself (e.g., when building `textfield.js`, the textfield external mapping is skipped).

---

## Bundle sizes (approximate)

| Bundle | Size (minified) |
|--------|----------------|
| lit.js | 22 KB |
| base.js | 6 KB |
| theme.js | 880 KB |
| picker.js | 70 KB |
| button.js | 69 KB |
| tooltip.js | 23 KB |
| dialog.js | 110 KB |
| toast.js | 31 KB |
| tags.js | 46 KB |
| textfield.js | 44 KB |
| search.js | 14 KB |

Total loaded per page depends on which components are used. The core deps (lit + base + theme + shared + icons) are ~960 KB shared across all components.

---

## Dist files are committed

The generated `dist/*.js` files **are committed to the repo**. This means:
- No build step is needed to develop or deploy
- The build step is only needed when adding/updating components
- CI does not need access to `@spectrum-web-components` packages at runtime
