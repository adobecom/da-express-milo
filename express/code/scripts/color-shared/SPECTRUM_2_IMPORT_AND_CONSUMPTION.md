# Spectrum 2 Import and Consumption

How Spectrum Web Components v2 is loaded and used by Color Explorer.

---

## Summary

- **What:** A reusable, opt-in Spectrum 2 component system for all Color Explorer pages.
- **Components:** Picker, Button, Tooltip, Dialog, Toast, Tag — each with Express styling overrides.
- **Where:** Wrappers in `spectrum/components/`, bundles in `widgets/spectrum/dist/`, override CSS in `spectrum/styles/`.
- **When:** Loaded on demand — each page imports only the components it needs.

---

## System Architecture

The Spectrum 2 system lives in `express/code/scripts/color-shared/spectrum/`:

```
spectrum/
  index.js                  ← barrel export
  load-spectrum.js          ← per-component lazy loaders
  registry.js               ← CE registration guards
  utils/theme.js            ← <sp-theme> factory
  utils/a11y.js             ← focus trap, ESC, ARIA helpers
  components/               ← wrapper components
  styles/                   ← Express override CSS
  docs/                     ← detailed documentation
```

Bundles live in `express/code/scripts/widgets/spectrum/dist/`.

---

## Loading Model

All Spectrum components are lazy-loaded via `load-spectrum.js`:

1. **Core deps** (loaded once): lit → base → theme → reactive-controllers → shared → icons
2. **Component bundles** (loaded per-family): picker, button, tooltip, dialog, toast, tags
3. **Override CSS** (loaded once per component type): injected via `<link>` on first use

Each loader is idempotent — calling it multiple times is safe.

---

## Wrapper Pattern

Each wrapper is a vanilla JS factory function:

```js
const picker = await createExpressPicker({
  label: 'Color gradients',
  options: [...],
  onChange: ({ value }) => { ... },
});
container.appendChild(picker.element);
```

Wrappers handle:
- Loading the Spectrum bundle
- Creating `<sp-theme>` with Express defaults
- Building the component DOM
- Applying override CSS
- Normalizing events
- ARIA compliance

---

## Usage by Filters

The `createFiltersComponent.js` uses `createExpressPicker` internally. Renderers that need filters import `createFiltersComponent` as before — no changes needed at the renderer level.

---

## Detailed Documentation

- **[USAGE.md](spectrum/docs/USAGE.md)** — getting started, architecture, theming
- **[COMPONENT_API.md](spectrum/docs/COMPONENT_API.md)** — detailed props/events/returns for each component
- **[BUNDLER.md](spectrum/docs/BUNDLER.md)** — how to add components, rebuild bundles
