# How to Use Spectrum in Color Explorer

The Express Spectrum 2 component system provides opt-in, lazy-loaded Spectrum Web Components wrapped for Express design tokens and accessibility. Each Color Explorer page imports only the components it needs.

---

## Quick Start

```js
import {
  createExpressPicker,
  createExpressButton,
  createExpressTooltip,
  createExpressDialog,
  showExpressToast,
  createExpressTag,
  createExpressTextfield,
  createExpressSearch,
  createExpressMenu,
} from '../spectrum/index.js';
```

Every `create*` function is **async** — it loads the Spectrum bundle on first call, then caches it. Subsequent calls are near-instant.

---

## Architecture

```
spectrum/
  index.js                  ← barrel export (import from here)
  load-spectrum.js          ← per-component lazy loaders
  registry.js               ← CE registration guards
  utils/
    theme.js                ← <sp-theme> factory
    a11y.js                 ← focus trap, ESC, ARIA, live region
  components/
    express-picker.js       ← sp-picker wrapper
    express-button.js       ← sp-button wrapper
    express-tooltip.js      ← sp-tooltip wrapper
    express-dialog.js       ← sp-dialog wrapper
    express-toast.js        ← sp-toast wrapper
    express-tag.js          ← sp-tag wrapper
    express-textfield.js    ← sp-textfield wrapper
    express-search.js       ← sp-search wrapper
    express-menu.js         ← sp-menu standalone wrapper
    style-loader.js         ← dynamic CSS <link> injection
  styles/
    picker.css              ← Express overrides for picker
    button.css              ← Express overrides for button
    tooltip.css             ← Express overrides for tooltip
    dialog.css              ← Express overrides for dialog
    toast.css               ← Express overrides for toast
    tag.css                 ← Express overrides for tag
    textfield.css           ← Express overrides for textfield
    search.css              ← Express overrides for search
    menu.css                ← Express overrides for menu
  docs/
    USAGE.md                ← this file
    COMPONENT_API.md        ← detailed API reference
    BUNDLER.md              ← how to add/rebuild bundles
```

---

## Loading Model

Components are **never** loaded globally. Loading is lazy and per-family:

| Loader | Tags registered | Triggered by |
|--------|----------------|--------------|
| `loadPicker()` | sp-picker, sp-menu, sp-menu-item, sp-popover, sp-overlay | `createExpressPicker()` |
| `loadButton()` | sp-button | `createExpressButton()` |
| `loadTooltip()` | sp-tooltip | `createExpressTooltip()` |
| `loadDialog()` | sp-dialog, sp-button | `createExpressDialog()` |
| `loadToast()` | sp-toast | `showExpressToast()` |
| `loadTag()` | sp-tag | `createExpressTag()` |
| `loadTextfield()` | sp-textfield | `createExpressTextfield()` |
| `loadSearch()` | sp-search, sp-textfield | `createExpressSearch()` |
| `loadMenu()` | sp-menu, sp-menu-item | `createExpressMenu()` |

Each loader:
1. Loads core deps once (Lit, base, theme, icons, shared)
2. Loads component-specific bundles
3. Waits for custom elements to register
4. Injects override CSS

---

## Theming

All components are wrapped in `<sp-theme system="spectrum-two" color="light" scale="medium">`. To customize:

```js
import { createThemeWrapper } from '../spectrum/utils/theme.js';

const theme = createThemeWrapper({ color: 'dark' });
```

---

## Accessibility

Built-in:
- Focus trapping for dialogs
- ESC-to-close for dialogs and tooltips
- `aria-describedby` for tooltips
- `aria-live` region for toast announcements
- `aria-modal` for dialogs
- Keyboard navigation (Tab, Space, Enter, Escape)
- `prefers-reduced-motion` support
- `prefers-contrast: high` support

---

## Opt-in / Not Site-wide

This system is scoped to Color Explorer. It does **not** modify global styles or register components site-wide. Override CSS uses element selectors (`sp-picker`, `sp-button`, etc.) that only affect pages that import the wrappers.

---

## MAS Migration Path

All wrappers abstract the underlying Spectrum component. When MAS replaces SWC:
1. Update the wrapper (e.g., swap `sp-button` → `mas-button` inside `express-button.js`)
2. Consumer code remains unchanged

---

## Which pages use what

| Page | Components |
|------|-----------|
| Explore (Strips + Gradients) | Picker, Tooltip, Dialog |
| Extract | Tooltip |
| Color Wheel | Tooltip, Dialog |
| Contrast Checker | Tooltip |
| Color Blindness | Tooltip |

These integrations are handled by page-specific tickets, not this foundation.
