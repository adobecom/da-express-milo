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
let coreLoaded = false;
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
async function loadCoreDeps() {
  if (coreLoaded) return;

  // Install once — stays active for page lifetime
  installErrorSuppression();

  const guard = installRegistryGuard();

  try {
    // 1. Lit runtime (must be first)
    const litMod = await import(`${DIST}/lit.js`);
    window.__SpectrumAdoptStyles = litMod.adoptStyles;

    // 2. Base element class (depends on Lit)
    await import(`${DIST}/base.js`);

    // 3. Theme (registers CSS fragments)
    await import(`${DIST}/theme.js`);
    await new Promise((r) => setTimeout(r, 50));

    // 4. Reactive controllers (needed by overlay & others)
    await import(`${DIST}/reactive-controllers.js`);

    // 5. Shared utilities
    await import(`${DIST}/shared.js`);

    // 6. Icons
    await import(`${DIST}/icons-ui.js`);
    await import(`${DIST}/icons-workflow.js`);

    coreLoaded = true;
  } finally {
    guard.restore();
  }
}

// ── public loaders ───────────────────────────────────────────────────

/**
 * Load picker components (sp-picker, sp-menu, sp-menu-item, sp-popover, sp-overlay).
 */
export async function loadPicker() {
  if (componentLoaded.picker) return;
  await loadCoreDeps();

  const guard = installRegistryGuard();
  try {
    await import(`${DIST}/overlay.js`);
    await import(`${DIST}/popover.js`);
    await import(`${DIST}/menu.js`);
    await import(`${DIST}/picker.js`);
    await waitForComponents(['sp-theme', 'sp-picker', 'sp-menu', 'sp-menu-item']);
    componentLoaded.picker = true;
  } finally {
    guard.restore();
  }
}

/**
 * Load button components (sp-button, sp-action-button, etc.).
 */
export async function loadButton() {
  if (componentLoaded.button) return;
  await loadCoreDeps();

  const guard = installRegistryGuard();
  try {
    await import(`${DIST}/button.js`);
    await waitForComponents(['sp-theme', 'sp-button']);
    componentLoaded.button = true;
  } finally {
    guard.restore();
  }
}

/**
 * Load tooltip component (sp-tooltip).
 * Also loads overlay since tooltips use the overlay system.
 */
export async function loadTooltip() {
  if (componentLoaded.tooltip) return;
  await loadCoreDeps();

  const guard = installRegistryGuard();
  try {
    await import(`${DIST}/overlay.js`);
    await import(`${DIST}/tooltip.js`);
    await waitForComponents(['sp-theme', 'sp-tooltip']);
    componentLoaded.tooltip = true;
  } finally {
    guard.restore();
  }
}

/**
 * Load dialog components (sp-dialog, sp-dialog-wrapper).
 * Also loads overlay for backdrop/stacking.
 */
export async function loadDialog() {
  if (componentLoaded.dialog) return;
  await loadCoreDeps();

  const guard = installRegistryGuard();
  try {
    await import(`${DIST}/overlay.js`);
    await import(`${DIST}/button.js`);
    await import(`${DIST}/dialog.js`);
    await waitForComponents(['sp-theme', 'sp-dialog']);
    componentLoaded.dialog = true;
  } finally {
    guard.restore();
  }
}

/**
 * Load toast component (sp-toast).
 */
export async function loadToast() {
  if (componentLoaded.toast) return;
  await loadCoreDeps();

  const guard = installRegistryGuard();
  try {
    await import(`${DIST}/button.js`);
    await import(`${DIST}/toast.js`);
    await waitForComponents(['sp-theme', 'sp-toast']);
    componentLoaded.toast = true;
  } finally {
    guard.restore();
  }
}

/**
 * Load tag components (sp-tag, sp-tags).
 */
export async function loadTag() {
  if (componentLoaded.tag) return;
  await loadCoreDeps();

  const guard = installRegistryGuard();
  try {
    await import(`${DIST}/tags.js`);
    await waitForComponents(['sp-theme', 'sp-tag']);
    componentLoaded.tag = true;
  } finally {
    guard.restore();
  }
}

/**
 * Load textfield component (sp-textfield).
 */
export async function loadTextfield() {
  if (componentLoaded.textfield) return;
  await loadCoreDeps();

  const guard = installRegistryGuard();
  try {
    await import(`${DIST}/textfield.js`);
    await waitForComponents(['sp-theme', 'sp-textfield']);
    componentLoaded.textfield = true;
  } finally {
    guard.restore();
  }
}

/**
 * Load search component (sp-search).
 * Also loads textfield since sp-search extends sp-textfield.
 */
export async function loadSearch() {
  if (componentLoaded.search) return;
  await loadTextfield();

  const guard = installRegistryGuard();
  try {
    await import(`${DIST}/button.js`);
    await import(`${DIST}/search.js`);
    await waitForComponents(['sp-theme', 'sp-search']);
    componentLoaded.search = true;
  } finally {
    guard.restore();
  }
}

/**
 * Load standalone menu components (sp-menu, sp-menu-item, sp-menu-divider, sp-menu-group).
 * Note: Menu is already loaded as part of loadPicker(), but this allows
 * using menus independently without the picker.
 */
export async function loadMenu() {
  if (componentLoaded.menu) return;
  await loadCoreDeps();

  const guard = installRegistryGuard();
  try {
    await import(`${DIST}/overlay.js`);
    await import(`${DIST}/popover.js`);
    await import(`${DIST}/menu.js`);
    await waitForComponents(['sp-theme', 'sp-menu', 'sp-menu-item']);
    componentLoaded.menu = true;
  } finally {
    guard.restore();
  }
}
