import { createTag } from '../../../../scripts/utils.js';
import { createContrastCheckerPlaceholders } from '../../utils/placeholders.js';
import { createThemeWrapper } from '../../../../scripts/color-shared/spectrum/utils/theme.js';
import { trapFocus } from '../../../../scripts/color-shared/spectrum/utils/a11y.js';
import { loadPicker } from '../../../../scripts/color-shared/spectrum/load-spectrum.js';
import {
  isMobileOrTabletViewport,
  isMobileViewport,
  isValidHex,
  normalizeHex,
} from '../../../../scripts/color-shared/utils/utilities.js';
import { createColorEditAdapter } from '../../../../scripts/color-shared/adapters/litComponentAdapters.js';

const FULL_HEX = /^#?[0-9a-f]{6}$/i;

function labelToId(labelText) {
  return `color-input-${labelText.toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z0-9-]/g, '')}`;
}

export function shouldAutoFocusColorEditInput() {
  return !isMobileOrTabletViewport();
}

let activeColorInputController = null;

function claimActiveColorInput(controller) {
  activeColorInputController = controller;
}

function releaseActiveColorInput(controller) {
  if (activeColorInputController === controller) {
    activeColorInputController = null;
  }
}

function closeActiveColorInputExcept(controller) {
  if (activeColorInputController && activeColorInputController !== controller) {
    activeColorInputController.closeEditor({ restoreFocus: false });
  }
}

// eslint-disable-next-line import/prefer-default-export
export function createColorInput(config) {
  const defaultStrings = createContrastCheckerPlaceholders();
  const {
    label = '',
    ariaLabel = defaultStrings.colorValueAriaLabel,
    value = '#FFFFFF',
    onInput,
    onChange,
    onColorChangeEnd,
    getColorEditPalette,
    colorEditStrings,
    baseColorStrings,
  } = config;
  const commitCallback = onColorChangeEnd || onChange;

  let lastValidHex = value;
  let activePopover = null;
  let activeEditor = null;
  let activeColorEditAdapter = null;
  let editorOpenValue = value;
  let focusTrap = null;
  let pendingOpen = false;
  let openRequestId = 0;
  let syncingFromEditor = false;
  const dismissHandlers = [];
  const controllerRef = {};

  const theme = createThemeWrapper();
  const wrapper = createTag('div', { class: 'ax-color-input' });

  const inputId = label ? labelToId(label) : `color-input-${Date.now()}`;

  const labelId = `${inputId}-label`;
  if (label) {
    const labelEl = createTag('label', {
      id: labelId,
      class: 'ax-color-input__label',
      for: inputId,
    }, label);
    wrapper.appendChild(labelEl);
  }

  const field = createTag('div', { class: 'ax-color-input__field' });

  const swatch = createTag('button', {
    type: 'button',
    class: 'ax-color-input__swatch',
    style: `background: ${value}`,
    'aria-haspopup': 'dialog',
    'aria-expanded': 'false',
    ...(label ? { 'aria-labelledby': labelId } : { 'aria-label': ariaLabel }),
  });

  const input = createTag('input', {
    type: 'text',
    id: inputId,
    name: inputId,
    class: 'ax-color-input__input',
    value,
    maxlength: '7',
    spellcheck: 'false',
    autocomplete: 'off',
    ...(label ? {} : { 'aria-label': ariaLabel }),
  });

  field.appendChild(swatch);
  field.appendChild(input);
  wrapper.appendChild(field);
  theme.appendChild(wrapper);

  const controller = new AbortController();
  const { signal } = controller;

  function addDismissListener(evt, fn, opts) {
    const target = opts?.target || document;
    target.addEventListener(evt, fn, opts?.capture);
    dismissHandlers.push([evt, fn, opts]);
  }

  function runWithEditorSync(fn) {
    syncingFromEditor = true;
    try {
      return fn();
    } finally {
      syncingFromEditor = false;
    }
  }

  function commitEditorValueIfChanged() {
    if (lastValidHex !== editorOpenValue) {
      commitCallback?.({ value: lastValidHex });
      editorOpenValue = lastValidHex;
    }
  }

  function syncEditorHexValue(hex) {
    if (!isValidHex(hex)) return false;

    lastValidHex = hex;
    input.value = hex;
    swatch.style.background = hex;
    return true;
  }

  function resolveColorEditPalette() {
    const paletteConfig = getColorEditPalette?.({ value: lastValidHex }) || {};
    const palette = Array.isArray(paletteConfig.palette)
      ? paletteConfig.palette.filter(isValidHex)
      : [];

    if (!palette.length) {
      return {
        palette: [lastValidHex],
        selectedIndex: 0,
      };
    }

    let selectedIndex = Number.isInteger(paletteConfig.selectedIndex)
      ? paletteConfig.selectedIndex
      : palette.findIndex((hex) => hex.toUpperCase() === lastValidHex.toUpperCase());

    if (selectedIndex < 0 || selectedIndex >= palette.length) {
      selectedIndex = 0;
    }

    return { palette, selectedIndex };
  }

  function syncActiveEditorPalette() {
    if (!activeColorEditAdapter || syncingFromEditor) return;

    const { palette, selectedIndex } = resolveColorEditPalette();
    activeColorEditAdapter.setPalette(palette);
    activeColorEditAdapter.setSelectedIndex(selectedIndex);
  }

  function beginOpenRequest() {
    pendingOpen = true;
    openRequestId += 1;
    return openRequestId;
  }

  function clearOpenRequest() {
    openRequestId += 1;
    pendingOpen = false;
  }

  function completeOpenRequest(requestId) {
    if (requestId === openRequestId) {
      pendingOpen = false;
    }
  }

  function isCurrentOpenRequest(requestId) {
    return requestId === openRequestId;
  }

  function isActiveEditorRequest(requestId, editor) {
    return isCurrentOpenRequest(requestId) && activeEditor === editor;
  }

  function cleanupDismissHandlers() {
    dismissHandlers.forEach(([evt, fn, opts]) => {
      (opts?.target || document).removeEventListener(evt, fn, opts?.capture);
    });
    dismissHandlers.length = 0;
  }

  function closeEditor({ commit = true, restoreFocus = true } = {}) {
    const hadOpenUI = pendingOpen || activePopover || activeEditor;

    clearOpenRequest();
    releaseActiveColorInput(controllerRef);

    if (commit) {
      commitEditorValueIfChanged();
    }

    if (focusTrap) {
      focusTrap.release();
      focusTrap = null;
    }
    cleanupDismissHandlers();
    if (activePopover) {
      activePopover.remove();
      activePopover = null;
    }
    if (activeColorEditAdapter) {
      activeColorEditAdapter.destroy();
      activeColorEditAdapter = null;
    }
    if (activeEditor) {
      activeEditor = null;
    }
    swatch.setAttribute('aria-expanded', 'false');
    if (restoreFocus && hadOpenUI) {
      input.focus();
    }
  }

  controllerRef.closeEditor = closeEditor;

  function createColorEdit() {
    editorOpenValue = lastValidHex;
    const { palette, selectedIndex } = resolveColorEditPalette();
    const mobile = isMobileViewport();

    const adapter = createColorEditAdapter({
      palette,
      selectedIndex,
      colorMode: 'HEX',
      showPalette: palette.length > 1,
      mobile,
      ...(colorEditStrings ? { strings: colorEditStrings } : {}),
      ...(baseColorStrings ? { baseColorStrings } : {}),
    }, {
      onColorChange: ({ hex }) => {
        if (syncEditorHexValue(hex)) {
          runWithEditorSync(() => onInput?.({ value: hex }));
        }
      },
      onColorChangeEnd: ({ hex }) => {
        syncEditorHexValue(hex);
        runWithEditorSync(() => commitEditorValueIfChanged());
      },
      onSwatchSelect: ({ index }) => {
        const hex = palette[index];
        if (hex && syncEditorHexValue(hex)) {
          runWithEditorSync(() => onInput?.({ value: hex }));
        }
      },
      onClose: () => closeEditor(),
    });

    activeColorEditAdapter = adapter;
    return adapter.element;
  }

  function queueMobileEditorOpen(colorEdit, requestId) {
    document.body.appendChild(colorEdit);
    activeEditor = colorEdit;
    completeOpenRequest(requestId);

    requestAnimationFrame(() => {
      if (!isActiveEditorRequest(requestId, colorEdit)) return;
      colorEdit.show?.();
    });
  }

  async function openDesktopEditor(colorEdit, requestId) {
    await loadPicker();
    if (!isCurrentOpenRequest(requestId)) return;

    const fieldHeight = field.offsetHeight;
    const overlay = createTag('sp-overlay', {
      type: 'auto',
      placement: 'bottom-start',
      offset: String(-fieldHeight),
    });
    overlay.receivesFocus = 'false';
    overlay.appendChild(colorEdit);

    activePopover = overlay;
    activeEditor = colorEdit;
    completeOpenRequest(requestId);

    field.after(overlay);
    overlay.triggerElement = field;
    overlay.open = true;

    overlay.addEventListener('sp-closed', () => closeEditor(), { once: true });

    requestAnimationFrame(async () => {
      if (!isActiveEditorRequest(requestId, colorEdit)) return;
      await colorEdit.updateComplete;
      if (!isActiveEditorRequest(requestId, colorEdit)) return;
      if (!colorEdit.show) {
        window.lana?.log(
          'colorEdit.show is not defined — skipping focus trap',
          { tags: 'color-contrast-checker,color-input', severity: 'error' },
        );
        return;
      }
      await colorEdit.show();
      focusTrap = trapFocus(overlay);

      addDismissListener('keydown', (e) => {
        if (e.key === 'Escape') closeEditor();
      });
    });
  }

  async function openColorEdit() {
    if (activePopover || activeEditor || pendingOpen) {
      closeEditor();
      return;
    }

    const requestId = beginOpenRequest();
    claimActiveColorInput(controllerRef);
    swatch.setAttribute('aria-expanded', 'true');

    try {
      const colorEdit = createColorEdit();

      if (colorEdit.mobile) {
        queueMobileEditorOpen(colorEdit, requestId);
        return;
      }

      await openDesktopEditor(colorEdit, requestId);
    } catch (error) {
      if (isCurrentOpenRequest(requestId)) {
        pendingOpen = false;
        swatch.setAttribute('aria-expanded', 'false');
        releaseActiveColorInput(controllerRef);
      }
      throw error;
    }
  }

  field.addEventListener('pointerdown', () => {
    closeActiveColorInputExcept(controllerRef);
  }, { signal, capture: true });
  swatch.addEventListener('click', openColorEdit, { signal });

  // A focused value already fills maxlength, so select it or typing is blocked.
  // The click that focuses the field would otherwise collapse that selection.
  let selectOnMouseUp = false;
  input.addEventListener('mousedown', () => {
    selectOnMouseUp = document.activeElement !== input;
  }, { signal });
  input.addEventListener('focus', () => input.select(), { signal });
  input.addEventListener('mouseup', (e) => {
    if (!selectOnMouseUp) return;
    selectOnMouseUp = false;
    if (input.selectionStart !== input.selectionEnd) return; // keep a drag-selection
    e.preventDefault();
    input.select();
  }, { signal });

  // Live-preview only complete values; '#FFF' mid-way through '#FFF000' is not intent.
  // Like the picker's onColorChange, keep the commit baseline so Enter still commits.
  function previewTypedValue(hex) {
    if (syncEditorHexValue(hex)) {
      runWithEditorSync(() => onInput?.({ value: hex }));
    }
  }

  input.addEventListener('input', () => {
    if (FULL_HEX.test(input.value.trim())) {
      previewTypedValue(normalizeHex(input.value));
    }
  }, { signal });

  function commitTypedValue() {
    const hex = normalizeHex(input.value);
    if (!hex) {
      input.value = lastValidHex;
      return;
    }
    syncEditorHexValue(hex);
    if (hex !== editorOpenValue) {
      editorOpenValue = hex;
      commitCallback?.({ value: hex });
    }
  }

  input.addEventListener('change', commitTypedValue, { signal });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitTypedValue();
      input.select();
    } else if (e.key === 'Escape' && !activeEditor && !pendingOpen) {
      if (lastValidHex !== editorOpenValue) previewTypedValue(editorOpenValue);
      input.value = lastValidHex;
      input.select();
    }
  }, { signal });

  const api = {
    element: theme,

    getValue() {
      return lastValidHex;
    },

    setValue(hex, { resetCommitBaseline = !syncingFromEditor } = {}) {
      lastValidHex = hex;
      if (resetCommitBaseline) {
        editorOpenValue = hex;
      }
      input.value = hex;
      swatch.style.background = hex;
      syncActiveEditorPalette();
    },

    refreshColorEditPalette() {
      syncActiveEditorPalette();
    },

    destroy() {
      closeEditor({ commit: false, restoreFocus: false });
      controller.abort();
      theme.remove();
    },
  };

  return api;
}
