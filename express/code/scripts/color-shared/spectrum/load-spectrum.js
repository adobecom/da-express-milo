/**
 * Spectrum Web Components — Centralized Lazy Loader
 *
 * Provides per-component-family loading functions so each Color Explorer
 * page imports only the Spectrum components it needs.
 *
 * Every loader is idempotent — calling it more than once is a no-op.
 *
 * Usage:
 *   import { loadPicker } from '../spectrum/load-spectrum.js';
 *   await loadPicker();
 *   // sp-picker, sp-menu, sp-menu-item are now registered
 */

import { installRegistryGuard, waitForComponents } from './registry.js';

// ── paths ────────────────────────────────────────────────────────────
const DIST = '../../widgets/spectrum/dist';

// ── internal state ───────────────────────────────────────────────────
// Each entry caches the loading promise so concurrent calls are safe.
let coreLoadedPromise = null;
const componentLoaded = {};

// ── persistent error suppression (non-fatal SWC menu.js WeakMap bug) ─
// These errors fire both at load time and later when menu items are
// added/removed, so the handler stays installed for the page lifetime.
let errorHandlerInstalled = false;

function installErrorSuppression() {
  if (errorHandlerInstalled) return;
  errorHandlerInstalled = true;

  const original = window.onerror;
  const seen = new Set();

  window.onerror = function handler(msg, src, line, col, err) {
    const m = String(msg || '');
    const s = String(src || '');
    const isMenu = s.includes('menu.js');
    const isUndef = m.includes('Cannot read properties of undefined');
    const isWeak = m.includes("reading 'set'") || m.includes("reading 'get'");

    if (isMenu && isUndef && isWeak) {
      const key = `${s}:${line}`;
      if (!seen.has(key)) {
        seen.add(key);
        console.warn('[Spectrum] Suppressed non-fatal menu.js error:', m);
      }
      return true;
    }
    return original ? original.call(this, msg, src, line, col, err) : false;
  };
}

// ── core dependencies (loaded once) ─────────────────────────────────
function loadCoreDeps() {
  if (!coreLoadedPromise) {
    coreLoadedPromise = (async () => {
      installErrorSuppression();

      const guard = installRegistryGuard();

      try {
        const litMod = await import(`${DIST}/lit.js`);
        window.__SpectrumAdoptStyles = litMod.adoptStyles;

        await import(`${DIST}/base.js`);

        await import(`${DIST}/theme.js`);
        await new Promise((r) => setTimeout(r, 50));

        await import(`${DIST}/reactive-controllers.js`);

        await import(`${DIST}/shared.js`);

        await import(`${DIST}/icons-ui.js`);
        await import(`${DIST}/icons-workflow.js`);
      } finally {
        guard.restore();
      }
    })();
  }
  return coreLoadedPromise;
}

// ── public loaders ───────────────────────────────────────────────────

/**
 * Load picker components (sp-picker, sp-menu, sp-menu-item, sp-popover, sp-overlay).
 */
export function loadPicker() {
  if (!componentLoaded.picker) {
    componentLoaded.picker = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/overlay.js`);
        await import(`${DIST}/popover.js`);
        await import(`${DIST}/menu.js`);
        await import(`${DIST}/picker.js`);
        await waitForComponents(['sp-theme', 'sp-picker', 'sp-menu', 'sp-menu-item']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.picker;
}

/**
 * Load button components (sp-button, sp-action-button, etc.).
 */
export function loadButton() {
  if (!componentLoaded.button) {
    componentLoaded.button = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/button.js`);
        await waitForComponents(['sp-theme', 'sp-button']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.button;
}

/**
 * Load tooltip component (sp-tooltip).
 * Also loads overlay since tooltips use the overlay system.
 */
export function loadTooltip() {
  if (!componentLoaded.tooltip) {
    componentLoaded.tooltip = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/overlay.js`);
        await import(`${DIST}/tooltip.js`);
        await waitForComponents(['sp-theme', 'sp-tooltip']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.tooltip;
}

/**
 * Load dialog components (sp-dialog, sp-dialog-wrapper).
 * Also loads overlay for backdrop/stacking.
 */
export function loadDialog() {
  if (!componentLoaded.dialog) {
    componentLoaded.dialog = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/overlay.js`);
        await import(`${DIST}/button.js`);
        await import(`${DIST}/dialog.js`);
        await waitForComponents(['sp-theme', 'sp-dialog']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.dialog;
}

/**
 * Load toast component (sp-toast).
 */
export function loadToast() {
  if (!componentLoaded.toast) {
    componentLoaded.toast = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/button.js`);
        await import(`${DIST}/toast.js`);
        await waitForComponents(['sp-theme', 'sp-toast']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.toast;
}

/**
 * Load tag components (sp-tag, sp-tags).
 */
export function loadTag() {
  if (!componentLoaded.tag) {
    componentLoaded.tag = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/tags.js`);
        await waitForComponents(['sp-theme', 'sp-tag']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.tag;
}

/**
 * Load textfield component (sp-textfield).
 */
export function loadTextfield() {
  if (!componentLoaded.textfield) {
    componentLoaded.textfield = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/textfield.js`);
        await waitForComponents(['sp-theme', 'sp-textfield']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.textfield;
}

/**
 * Load search component (sp-search).
 * Also loads textfield since sp-search extends sp-textfield.
 */
export function loadSearch() {
  if (!componentLoaded.search) {
    componentLoaded.search = (async () => {
      await loadTextfield();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/button.js`);
        await import(`${DIST}/search.js`);
        await waitForComponents(['sp-theme', 'sp-search']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.search;
}

/**
 * Load swatch components (sp-swatch, sp-swatch-group).
 */
export function loadSwatch() {
  if (!componentLoaded.swatch) {
    componentLoaded.swatch = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/swatch.js`);
        await waitForComponents(['sp-theme', 'sp-swatch']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.swatch;
}

/**
 * Load color-area component (sp-color-area).
 */
export function loadColorArea() {
  if (!componentLoaded.colorArea) {
    componentLoaded.colorArea = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/color-area.js`);
        await waitForComponents(['sp-theme', 'sp-color-area']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.colorArea;
}

/**
 * Load color-slider component (sp-color-slider).
 */
export function loadColorSlider() {
  if (!componentLoaded.colorSlider) {
    componentLoaded.colorSlider = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/color-slider.js`);
        await waitForComponents(['sp-theme', 'sp-color-slider']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.colorSlider;
}

/**
 * Load slider component (sp-slider).
 */
export function loadSlider() {
  if (!componentLoaded.slider) {
    componentLoaded.slider = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/slider.js`);
        await waitForComponents(['sp-theme', 'sp-slider']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.slider;
}

/**
 * Load action button component (sp-action-button).
 */
export async function loadActionButton() {
  if (componentLoaded.actionButton) return;
  await loadCoreDeps();

  const guard = installRegistryGuard();
  try {
    await import(`${DIST}/action-button.js`);
    await waitForComponents(['sp-theme', 'sp-action-button']);
    componentLoaded.actionButton = true;
  } finally {
    guard.restore();
  }
}

/**
 * Load action button component (sp-action-button).
 */
export async function loadActionButton() {
  if (componentLoaded.actionButton) return;
  await loadCoreDeps();

  const guard = installRegistryGuard();
  try {
    await import(`${DIST}/action-button.js`);
    await waitForComponents(['sp-theme', 'sp-action-button']);
    componentLoaded.actionButton = true;
  } finally {
    guard.restore();
  }
}

/**
 * Load standalone menu components (sp-menu, sp-menu-item, sp-menu-divider, sp-menu-group).
 * Note: Menu is already loaded as part of loadPicker(), but this allows
 * using menus independently without the picker.
 */
export function loadMenu() {
  if (!componentLoaded.menu) {
    componentLoaded.menu = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/overlay.js`);
        await import(`${DIST}/popover.js`);
        await import(`${DIST}/menu.js`);
        await waitForComponents(['sp-theme', 'sp-menu', 'sp-menu-item']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.menu;
}

/**
 * Load tray component (sp-tray).
 * Also loads overlay since tray uses the overlay system.
 */
export function loadTray() {
  if (!componentLoaded.tray) {
    componentLoaded.tray = (async () => {
      await loadCoreDeps();
      const guard = installRegistryGuard();
      try {
        await import(`${DIST}/overlay.js`);
        await import(`${DIST}/tray.js`);
        await waitForComponents(['sp-theme', 'sp-tray']);
      } finally {
        guard.restore();
      }
    })();
  }
  return componentLoaded.tray;
}

/**
 * Load tabs components (sp-tabs, sp-tab, sp-tab-panel).
 * Also loads action-button since tabs uses it for overflow navigation.
 */
export async function loadTabs() {
  if (componentLoaded.tabs) return;
  await loadActionButton();

  const guard = installRegistryGuard();
  try {
    await import(`${DIST}/tabs.js`);
    await waitForComponents(['sp-theme', 'sp-tabs', 'sp-tab', 'sp-tab-panel']);
    componentLoaded.tabs = true;
  } finally {
    guard.restore();
  }
}
