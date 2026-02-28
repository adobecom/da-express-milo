/**
 * Express Spectrum 2 Component System — Public API
 *
 * Barrel export for all Spectrum wrapper components and utilities.
 * Import from here for the simplest path, or import individual modules
 * directly for tree-shaking.
 *
 * Usage:
 *   import { createExpressPicker, createExpressButton } from '../spectrum/index.js';
 */

// ── Loaders ──────────────────────────────────────────────────────────
export {
  loadPicker,
  loadButton,
  loadTooltip,
  loadDialog,
  loadToast,
  loadTag,
  loadTextfield,
  loadSearch,
  loadSwatch,
  loadColorArea,
  loadColorSlider,
  loadSlider,
  loadMenu,
} from './load-spectrum.js';

// ── Components ───────────────────────────────────────────────────────
export { createExpressPicker } from './components/express-picker.js';
export { createExpressButton } from './components/express-button.js';
export { createExpressTooltip } from './components/express-tooltip.js';
export { createExpressDialog } from './components/express-dialog.js';
export { showExpressToast } from './components/express-toast.js';
export { createExpressTag } from './components/express-tag.js';
export { createExpressTextfield } from './components/express-textfield.js';
export { createExpressSearch } from './components/express-search.js';
export { createExpressMenu } from './components/express-menu.js';
export { createExpressSwatchGroup } from './components/express-swatch-group.js';
export { createExpressColorArea } from './components/express-color-area.js';
export { createExpressColorSlider } from './components/express-color-slider.js';
export { createExpressSlider } from './components/express-slider.js';
export { default as ExpressChannelSlider } from './components/express-channel-slider.js';

// ── Utilities ────────────────────────────────────────────────────────
export { createThemeWrapper, wrapInTheme } from './utils/theme.js';
export {
  trapFocus,
  handleEscapeClose,
  disableBackgroundScroll,
  restoreBackgroundScroll,
  ariaDescribedBy,
  announceToScreenReader,
} from './utils/a11y.js';
export { installRegistryGuard, waitForComponents } from './registry.js';
