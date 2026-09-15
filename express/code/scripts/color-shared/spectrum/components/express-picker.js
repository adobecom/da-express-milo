/**
 * Express Picker — Wrapper for Spectrum Web Components <sp-picker>
 *
 * Creates a themed, accessible picker (dropdown/select) that matches
 * Express design tokens and loads Spectrum dependencies on demand.
 *
 * Usage:
 *   import { createExpressPicker } from '../spectrum/components/express-picker.js';
 *
 *   const picker = await createExpressPicker({
 *     label: 'Color gradients',
 *     value: 'linear',
 *     options: [
 *       { value: 'all',    label: 'All' },
 *       { value: 'linear', label: 'Linear' },
 *     ],
 *     onChange: ({ value }) => console.log(value),
 *   });
 *   container.appendChild(picker.element);
 */

import { loadPicker } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/picker.css';

const DEFAULT_MENU_TOKENS = {
  '--mod-menu-item-label-inline-edge-to-content': '12px',
  '--mod-menu-item-selectable-edge-to-text-not-selected': '12px',
  '--mod-menu-item-checkmark-width': '10px',
  '--mod-menu-item-text-to-control': '10px',
  '--mod-menu-item-corner-radius': '8px',
  '--mod-menu-item-focus-indicator-border-radius': '8px',
};

function waitForAnimationFrame() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}

async function waitUntilConnected(el, maxFrames = 120) {
  let frameCount = 0;
  while (!el?.isConnected && frameCount < maxFrames) {
    // eslint-disable-next-line no-await-in-loop
    await waitForAnimationFrame();
    frameCount += 1;
  }
}

async function withRetry(task, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        // eslint-disable-next-line no-await-in-loop
        await waitForAnimationFrame();
      }
    }
  }
  throw lastError;
}

/**
 * Create an Express picker (themed sp-picker with menu items).
 *
 * @param {Object}    config
 * @param {string}    config.label    — visible label / aria-label
 * @param {string}    [config.value]  — initially selected value
 * @param {string}    [config.placement='bottom-start']
 *   preferred overlay placement (Spectrum may still flip to avoid collisions)
 * @param {boolean}   [config.forcePopover=false]
 *   force dropdown/popover mode instead of Spectrum mobile tray mode
 * @param {Array<{value:string, label:string}>} config.options
 * @param {Function}  [config.onChange]   — called with { value }
 * @param {string}    [config.id]        — optional DOM id suffix
 * @param {boolean}   [config.disabled]  — disable the picker
 * @param {Object.<string,string>} [config.menuTokens]
 *   optional CSS token overrides for picker menu internals
 * @returns {Promise<{element: HTMLElement, getValue: () => string,
 *   setValue: (v:string) => void, destroy: () => void}>}
 */
export async function createExpressPicker(config) {
  const {
    label,
    value: initialValue,
    placement = 'bottom-start',
    forcePopover = false,
    options = [],
    onChange,
    id,
    disabled = false,
    menuTokens = {},
  } = config;

  // 1. Ensure Spectrum picker components are loaded
  await withRetry(() => loadPicker(), 3);

  // 2. Load Express override styles (once)
  await loadOverrideStyles('picker', STYLES_PATH);

  // 3. Wait for CEs to be ready
  await customElements.whenDefined('sp-theme');
  await customElements.whenDefined('sp-picker');
  await customElements.whenDefined('sp-menu-item');

  // 4. Create theme wrapper
  const theme = createThemeWrapper();

  // 5. Create picker element
  const picker = document.createElement('sp-picker');
  if (id) picker.id = `express-picker-${id}`;
  picker.setAttribute('label', label);
  picker.setAttribute('aria-label', `Filter by ${label}`);
  picker.setAttribute('size', 'm');
  picker.setAttribute('placement', placement);
  picker.placement = placement;
  if (forcePopover) picker.setAttribute('force-popover', '');
  picker.forcePopover = Boolean(forcePopover);
  picker.classList.add('filter-picker');
  if (disabled) picker.setAttribute('disabled', '');

  const resolvedMenuTokens = { ...DEFAULT_MENU_TOKENS, ...menuTokens };
  Object.entries(resolvedMenuTokens).forEach(([tokenName, tokenValue]) => {
    if (tokenValue !== undefined && tokenValue !== null) {
      picker.style.setProperty(tokenName, tokenValue);
    }
  });

  const selected = options.find((o) => o.value === initialValue) || options[0];
  let pendingValue = selected?.value ?? '';

  // 6. Attach picker to theme (triggers connectedCallback)
  theme.appendChild(picker);

  function applyItemsAndValue() {
    picker.replaceChildren();

    options.forEach((opt) => {
      const item = document.createElement('sp-menu-item');
      item.setAttribute('value', opt.value);
      item.textContent = opt.label;
      picker.appendChild(item);
    });

    if (pendingValue) {
      picker.setAttribute('value', pendingValue);
      picker.value = pendingValue;
    }
  }

  const readyPromise = (async () => {
    await waitUntilConnected(picker);

    let lastError = null;
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      try {
        applyItemsAndValue();
        return;
      } catch (error) {
        lastError = error;
        if (attempt < 6) {
          // eslint-disable-next-line no-await-in-loop
          await waitForAnimationFrame();
        }
      }
    }

    window.lana?.log(`Picker item init failed: ${lastError?.message}`, {
      tags: 'color-explorer,picker',
      severity: 'warning',
    });
    throw lastError;
  })();

  // 8. Event handling
  let currentValue = pendingValue;

  const onPickerChange = (e) => {
    currentValue = e.target.value;
    onChange?.({ value: currentValue });
  };
  picker.addEventListener('change', onPickerChange);

  // 10. Public API
  return {
    /** The <sp-theme> root element — append this to the DOM. */
    element: theme,

    /** Get current selected value. */
    getValue() {
      return currentValue;
    },

    /** Programmatically set the selected value. */
    setValue(v) {
      currentValue = v;
      pendingValue = v;
      picker.setAttribute('value', v);
      try {
        picker.value = v;
      } catch (error) {
        // The queued value will still be applied when readyPromise resolves.
      }
    },

    /** Resolve when picker internals are ready. */
    waitForReady() {
      return readyPromise;
    },

    /** Clean up listeners (call when removing from DOM). */
    destroy() {
      try {
        picker.open = false;
        picker.removeAttribute('open');
        picker.blur?.();
      } catch (error) {
        // Non-fatal: teardown should still remove the wrapper.
      }
      picker.removeEventListener('change', onPickerChange);
      theme.remove();
    },
  };
}
