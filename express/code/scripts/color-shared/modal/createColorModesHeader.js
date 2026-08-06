import { createTag } from '../../utils.js';
import { showExpressToast } from '../spectrum/components/express-toast.js';
import { serviceManager } from '../../../libs/services/core/ServiceManager.js';
import { paletteToThemeData } from '../../../libs/services/providers/transforms.js';
import { createLibraryCardActionMenu } from '../components/libraries/createLibraryCardActionMenu.js';
import { createExpressPicker } from '../spectrum/components/express-picker.js';
import {
  VALID_COLOR_MODES,
  getPreferredColorMode,
  setPreferredColorMode,
  subscribeColorMode,
} from '../utils/colorModePreference.js';

const DEFAULTS = {
  colorModeLabel: 'Color mode',
  codesToggleLabel: 'Copy as code',
  copiedToast: 'Copied to clipboard',
  copyFailedToast: 'Failed to copy',
};

// Order + labels match the Figma "Codes" menu exactly (LESS, CSS, SASS, XML —
// the export produces SCSS-compatible syntax, but Figma's user-facing label is "SASS").
const EXPORT_FORMATS = [
  { value: 'less', label: 'Copy as LESS', method: 'exportLESS' },
  { value: 'css', label: 'Copy as CSS', method: 'exportCSS' },
  { value: 'scss', label: 'Copy as SASS', method: 'exportSCSS' },
  { value: 'xml', label: 'Copy as XML', method: 'exportXML' },
];

const hasIcon = (tagName) => Boolean(window.customElements?.get(tagName));
const SVG_NS = 'http://www.w3.org/2000/svg';

function buildSvgIcon({ viewBox, size, paths }) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('fill', 'none');
  paths.forEach((d) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
  });
  return svg;
}

// sp-icon-code isn't in this project's pruned Spectrum icon bundle — fall back
// to an inline "</>" glyph so the button is never blank.
function createCodesIcon() {
  if (hasIcon('sp-icon-code')) {
    const el = document.createElement('sp-icon-code');
    el.setAttribute('aria-hidden', 'true');
    return el;
  }
  const span = createTag('span', { class: 'modal-codes-icon-fallback', 'aria-hidden': 'true' });
  span.appendChild(buildSvgIcon({
    viewBox: '0 0 20 20',
    size: 18,
    paths: ['M7 5L2 10L7 15', 'M13 5L18 10L13 15'],
  }));
  return span;
}

async function copyAsCode(palette, type, format, t) {
  const entry = EXPORT_FORMATS.find((f) => f.value === format);
  if (!entry) return;
  try {
    const themeData = {
      ...paletteToThemeData(palette),
      ...(type === 'gradient' ? { assetType: 'gradient' } : {}),
    };
    const provider = await serviceManager.getProvider('download');
    const result = await provider?.[entry.method]?.(themeData);
    showExpressToast({
      message: result?.clipboardSuccess ? t.copiedToast : t.copyFailedToast,
      variant: result?.clipboardSuccess ? 'positive' : 'negative',
      timeout: 2000,
    });
  } catch (err) {
    window.lana?.log(`Copy as code failed: ${err.message}`, {
      tags: 'color-modal,codes',
      severity: 'error',
    });
    showExpressToast({ message: t.copyFailedToast, variant: 'negative', timeout: 2000 });
  }
}

/**
 * Shared "Color mode" picker + "Copy as code" menu for the palette/gradient
 * modal header. The mode preference is persisted via colorModePreference.js so
 * it stays in sync with the color-wheel editing tool's own mode switcher.
 *
 * @param {{name: string, colors: string[]}} palette
 * @param {{type?: 'palette'|'gradient', strings?: Object, onModeChange?: (mode: string) => void,
 *   onDestroy?: () => void}} options - onDestroy is for callers with no lifecycle hook of their
 *   own (e.g. createGradientModalContent.js returns a bare element) to piggyback extra cleanup
 *   (e.g. a swatch-rail adapter) onto this header's own self-cleaning MutationObserver.
 */
// eslint-disable-next-line import/prefer-default-export
export function createColorModesHeader(palette, options = {}) {
  const { type = 'palette', onModeChange, onDestroy } = options;
  const t = { ...DEFAULTS, ...(options.strings || {}) };

  const header = createTag('div', { class: 'modal-color-modes-header' });

  const modeField = createTag('div', { class: 'modal-color-mode-field' });
  const modeLabel = createTag('span', { class: 'modal-color-mode-label' });
  modeLabel.textContent = t.colorModeLabel;
  modeField.appendChild(modeLabel);

  const modePickerSlot = createTag('div', { class: 'modal-color-mode-picker' });
  modeField.appendChild(modePickerSlot);
  header.appendChild(modeField);

  let currentMode = getPreferredColorMode();
  let modePicker = null;
  let destroyed = false;

  // sp-picker/sp-menu-item give us Spectrum's real checkmark-on-selected,
  // typography, and popover sizing "for free" instead of a bespoke popover
  // (see spectrum/components/express-picker.js, already used by the page's
  // filter dropdowns). Loading is async, so mount into a synchronous slot and
  // swap the real picker in once ready — callers still get `header.element`
  // back immediately and can insert it into the DOM without awaiting.
  //
  // aria-label is static (not "Color mode: HEX") and set once at construction:
  // a vendored PendingStateController on sp-picker caches whatever aria-label
  // is present at first connect and silently re-applies that cached value on
  // every later Lit update, so changing it per-selection is a no-op — the
  // existing Explore filter pickers built on this same wrapper have the same
  // static-label constraint.
  const modePickerReady = (async () => {
    try {
      const picker = await createExpressPicker({
        label: t.colorModeLabel,
        ariaLabel: t.colorModeLabel,
        value: currentMode,
        options: VALID_COLOR_MODES.map((mode) => ({ value: mode, label: mode })),
        forcePopover: true,
        onChange: ({ value }) => {
          currentMode = value;
          setPreferredColorMode(value);
          onModeChange?.(value);
        },
      });
      if (destroyed) {
        picker.destroy();
        return;
      }
      modePicker = picker;
      modePickerSlot.appendChild(picker.element);
      await picker.waitForReady?.();
    } catch (err) {
      window.lana?.log(`Color mode picker failed to load: ${err?.message}`, {
        tags: 'color-modal,picker',
        severity: 'warning',
      });
    }
  })();

  const unsubscribe = subscribeColorMode((mode) => {
    if (currentMode !== mode) {
      currentMode = mode;
      modePicker?.setValue(mode);
      onModeChange?.(mode);
    }
  });

  const codesMenu = createLibraryCardActionMenu({
    triggerLabel: t.codesToggleLabel,
    renderTrigger: () => {
      const btn = createTag('sp-action-button', {
        quiet: '',
        size: 'm',
        class: 'ax-lib-card__action',
        label: t.codesToggleLabel,
      });
      const iconEl = createCodesIcon();
      iconEl.setAttribute('slot', 'icon');
      btn.appendChild(iconEl);
      return btn;
    },
    items: EXPORT_FORMATS,
    onSelect: async (format, { closePopover }) => {
      await copyAsCode(palette, type, format, t);
      closePopover({ focusTrigger: true });
    },
  });
  codesMenu.element.classList.add('modal-codes-menu');
  header.appendChild(codesMenu.element);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    unsubscribe();
    modePicker?.destroy();
    codesMenu.destroy();
    onDestroy?.();
  }

  // Callers that don't explicitly manage this content's lifecycle (e.g. the
  // Explore gradient modal, whose content builder returns a bare element) would
  // otherwise leak the colorMode subscription. Self-clean once detached, same
  // pattern used elsewhere in this modal family (see the rail fade observer in
  // createPaletteModalContent.js).
  const detachObserver = new MutationObserver(() => {
    if (!document.contains(header)) {
      destroy();
      detachObserver.disconnect();
    }
  });
  detachObserver.observe(document.body, { childList: true, subtree: true });

  return {
    element: header,
    getMode: () => currentMode,
    waitForReady: () => modePickerReady,
    destroy,
  };
}
