import { loadCSS } from '../utils/css.js';
import { createSpectrumIcon } from '../utils/icons.js';
import { announceToScreenReader, isMobileViewport } from '../utils/accessibility.js';
import { createCurtain, addEscapeClose, activateFocusTrap } from '../utils/overlay.js';
import { createTag } from '../../utils.js';
import loadSpectrum from './spectrum-loader.js';
import {
  THEME_ELEMENT_TYPE,
  THEME_REPRESENTATION_TYPE,
  CC_LIBRARY_COLOR_MODE,
  COLOR_PROFILE,
  getClientInfo,
} from '../../../libs/services/plugins/cclibrary/constants.js';

const TITLE = 'Save to Creative Cloud Libraries';
const PALETTE_NAME_LABEL = 'Palette name';
const LIBRARY_LABEL = 'Save to';
const TAGS_LABEL = 'Tags';
const TAGS_PLACEHOLDER = 'Enter or select from below';
const SAVE_BTN_TEXT = 'Save to library';

/* ── Dependency Loading (uses centralized spectrum-loader) ──── */

async function loadDrawerDeps() {
  const cssUrl = new URL('./drawer.css', import.meta.url).pathname;
  const tokensUrl = new URL('../color-tokens.css', import.meta.url).pathname;
  const results = await Promise.allSettled([
    loadCSS(tokensUrl),
    loadCSS(cssUrl),
    loadSpectrum(),
  ]);
  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length) {
    window.lana?.log(
      `Drawer deps failed: ${failures.map((f) => f.reason).join(', ')}`,
      { tags: 'color-floating-toolbar,drawer' },
    );
  }
  return {
    pickerOk: !!customElements.get('sp-picker'),
  };
}

/* ── Form Field Builders ─────────────────────────────────────── */

function createFormField(id, label, value) {
  const labelEl = createTag('label', { class: 'ax-drawer-field-label', for: id }, label);
  const input = createTag('input', {
    type: 'text',
    class: 'ax-drawer-field-input',
    id,
    value: value ?? '',
    'aria-label': label,
  });
  return { field: createTag('div', { class: 'ax-drawer-field' }, [labelEl, input]), input };
}

function createChevronDownIcon() {
  return createSpectrumIcon('ChevronDown');
}

function createLibraryPickerField(label, libraries, selectedId, ccLibraryProvider) {
  const wrapper = createTag('div', { class: 'ax-drawer-library-picker' });
  const labelEl = createTag('label', { class: 'ax-drawer-picker-label' }, label);

  let currentId = selectedId ?? libraries[0]?.id ?? '';
  const localLibraries = [...libraries];
  let isPopoverOpen = false;

  const selectedName = () => {
    if (!localLibraries.length) return 'No libraries available';
    return localLibraries.find((l) => l.id === currentId)?.name ?? '';
  };

  const trigger = createTag('button', {
    type: 'button',
    class: 'ax-lib-picker-trigger',
    'aria-haspopup': 'listbox',
    'aria-expanded': 'false',
  });
  const triggerLabel = createTag('span', { class: 'ax-lib-picker-trigger-label' }, selectedName());
  const triggerChevron = createTag('span', { class: 'ax-lib-picker-trigger-chevron', 'aria-hidden': 'true' });
  triggerChevron.appendChild(createChevronDownIcon());
  trigger.append(triggerLabel, triggerChevron);

  const popover = createTag('div', {
    class: 'ax-lib-picker-popover',
    role: 'listbox',
    'aria-label': label,
  });

  const menu = document.createElement('sp-menu');
  menu.setAttribute('selects', 'single');

  function closePopover() {
    isPopoverOpen = false;
    popover.classList.remove('ax-lib-picker-popover-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  function openPopover() {
    isPopoverOpen = true;
    popover.classList.add('ax-lib-picker-popover-open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function selectLibrary(lib, item) {
    currentId = lib.id;
    triggerLabel.textContent = lib.name;
    menu.querySelectorAll('sp-menu-item').forEach((mi) => mi.removeAttribute('selected'));
    item.setAttribute('selected', '');
    closePopover();
  }

  function renderMenuItems() {
    menu.replaceChildren();
    localLibraries.forEach((lib) => {
      const item = document.createElement('sp-menu-item');
      item.setAttribute('value', lib.id);
      if (lib.id === currentId) item.setAttribute('selected', '');
      item.textContent = lib.name;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectLibrary(lib, item);
      });
      menu.appendChild(item);
    });
  }

  const divider = createTag('div', { class: 'ax-lib-picker-divider' });

  const createSection = createTag('div', { class: 'ax-lib-picker-create-section' });
  const createLabelEl = createTag('span', { class: 'ax-lib-picker-create-label' }, 'Create a new library');
  const createInput = createTag('input', {
    type: 'text',
    class: 'ax-lib-picker-create-input',
    placeholder: 'Enter library name',
    'aria-label': 'Enter library name',
  });
  const createBtn = createTag('button', {
    type: 'button',
    class: 'ax-lib-picker-create-btn',
  }, 'Create');

  createSection.append(createLabelEl, createInput, createBtn);
  popover.append(menu, divider, createSection);
  wrapper.append(labelEl, trigger, popover);

  function handleOutsideClick(e) {
    if (!wrapper.contains(e.target)) closePopover();
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isPopoverOpen) {
      closePopover();
    } else {
      openPopover();
    }
  });

  document.addEventListener('click', handleOutsideClick);

  createBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const name = createInput.value.trim();
    if (!name) return;

    if (ccLibraryProvider) {
      createBtn.disabled = true;
      createBtn.textContent = 'Creating\u2026';
      try {
        const result = await ccLibraryProvider.createLibrary(name);
        const newLib = {
          id: result?.library_urn ?? result?.id ?? `lib-${Date.now()}`,
          name: result?.name ?? name,
        };
        localLibraries.push(newLib);
        currentId = newLib.id;
        triggerLabel.textContent = newLib.name;
        createInput.value = '';
        renderMenuItems();
        closePopover();
        announceToScreenReader(`Library "${newLib.name}" created and selected`);
      } catch (err) {
        window.lana?.log(`Create library failed: ${err.message}`, {
          tags: 'color-floating-toolbar,drawer',
        });
        announceToScreenReader('Failed to create library');
      } finally {
        createBtn.disabled = false;
        createBtn.textContent = 'Create';
      }
    } else {
      announceToScreenReader('Cannot create library: not signed in');
    }
  });

  createInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createBtn.click();
    }
    e.stopPropagation();
  });

  renderMenuItems();

  return {
    wrapper,
    get value() { return currentId; },
    getLibrary() { return localLibraries.find((l) => l.id === currentId) ?? null; },
    destroy() {
      document.removeEventListener('click', handleOutsideClick);
    },
  };
}

/* ── Tag Chips (Spectrum sp-tag / sp-tags) ───────────────────── */

function normalizeTagText(t) {
  if (typeof t === 'string') return t;
  return t?.tag ?? t?.name ?? '';
}

function createSpTag(text) {
  const tag = document.createElement('sp-tag');
  tag.setAttribute('deletable', '');
  tag.textContent = text;
  tag.addEventListener('delete', () => tag.remove());
  return tag;
}

function getTagValues(container) {
  return [...container.querySelectorAll('sp-tag')]
    .map((el) => el.textContent?.trim() ?? '')
    .filter(Boolean);
}

function createTagsField(label, tags, placeholder) {
  const wrapper = createTag('div', { class: 'ax-drawer-tag-section' });

  const fieldGroup = createTag('div', { class: 'ax-drawer-field' });
  const labelEl = createTag('label', { class: 'ax-drawer-field-label' }, label);
  const input = createTag('input', {
    type: 'text',
    class: 'ax-drawer-field-input',
    placeholder,
    'aria-label': placeholder,
  });
  fieldGroup.append(labelEl, input);

  const spTags = document.createElement('sp-tags');
  spTags.classList.add('ax-drawer-sp-tags');
  (tags ?? []).forEach((t) => {
    const text = normalizeTagText(t);
    if (text) spTags.appendChild(createSpTag(text));
  });

  wrapper.append(fieldGroup, spTags);
  return { wrapper, container: spTags, input };
}

function addTagFromInput(tagsInput, tagsContainer) {
  const text = tagsInput.value.trim();
  if (!text) return;
  tagsInput.value = '';
  tagsContainer.appendChild(createSpTag(text));
}

/* ── Drawer Header ───────────────────────────────────────────── */

function createHeader(titleId, onClose) {
  const header = createTag('div', { class: 'ax-drawer-header' });
  const titleSpan = createTag('span', { class: 'ax-drawer-title', id: titleId }, TITLE);
  const chevronIcon = createSpectrumIcon('ChevronLeft');
  chevronIcon.classList.add('ax-drawer-back-icon');
  const backBtn = createTag('button', {
    type: 'button',
    class: 'ax-drawer-back-btn',
    'aria-label': 'Back',
  }, [chevronIcon, titleSpan]);
  backBtn.addEventListener('click', onClose);
  header.appendChild(backBtn);
  return header;
}

/* ── Desktop Anchor Positioning ───────────────────────────────── */

function positionDesktopPanel(panel, anchor) {
  anchor.style.setProperty('anchor-name', '--ax-drawer-anchor');

  if (CSS.supports('anchor-name', '--ax-drawer-anchor')) return;

  const btnRect = anchor.getBoundingClientRect();
  const panelWidth = 307;
  const spaceAbove = btnRect.top;
  const spaceBelow = window.innerHeight - btnRect.bottom;

  if (spaceAbove >= spaceBelow) {
    panel.style.bottom = `${window.innerHeight - btnRect.top + 8}px`;
    panel.style.top = 'auto';
  } else {
    panel.style.top = `${btnRect.bottom + 8}px`;
    panel.style.bottom = 'auto';
  }
  panel.style.left = `${Math.max(0, btnRect.right - panelWidth)}px`;
}

/* ── Theme Payload ────────────────────────────────────────────── */

function parseHexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 0, g: 0, b: 0 };
  let h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return {
    r: Number.parseInt(h.substring(0, 2), 16),
    g: Number.parseInt(h.substring(2, 4), 16),
    b: Number.parseInt(h.substring(4, 6), 16),
  };
}

function buildThemePayload(palette, formData) {
  const colors = palette?.colors ?? [];
  return {
    name: formData.name || palette?.name || 'Untitled Theme',
    type: THEME_ELEMENT_TYPE,
    client: getClientInfo(),
    representations: [{
      rel: 'primary',
      type: THEME_REPRESENTATION_TYPE,
      'colortheme#data': {
        swatches: colors.map((hex) => [{
          mode: CC_LIBRARY_COLOR_MODE.RGB,
          value: parseHexToRgb(hex),
          profileName: COLOR_PROFILE,
        }]),
        tags: formData.tags ?? [],
      },
    }],
  };
}

/* ── Toast ────────────────────────────────────────────────────── */

function showToast({ variant = 'positive', message }) {
  const toast = document.createElement('sp-toast');
  toast.setAttribute('variant', variant);
  toast.setAttribute('open', '');
  toast.setAttribute('timeout', '6000');
  toast.textContent = message;

  const wrapper = document.createElement('sp-theme');
  wrapper.setAttribute('system', 'spectrum-two');
  wrapper.setAttribute('color', 'light');
  wrapper.setAttribute('scale', 'medium');
  Object.assign(wrapper.style, {
    position: 'fixed',
    bottom: '40px',
    right: '40px',
    zIndex: '10000',
  });
  wrapper.appendChild(toast);
  document.body.appendChild(wrapper);

  toast.addEventListener('close', () => wrapper.remove());
  setTimeout(() => { if (wrapper.parentNode) wrapper.remove(); }, 7000);
}

/* ── Main Export ──────────────────────────────────────────────── */

// eslint-disable-next-line import/prefer-default-export
export async function createDrawer(options) {
  const {
    paletteData, type: paletteType, anchorElement, onSave, onClose,
    libraries: userLibraries,
    ccLibraryProvider,
  } = options;
  const libraries = userLibraries?.length ? userLibraries : [];
  let isOpen = false;
  let focusTrap = null;
  let removeEscHandler = null;
  let panelEl = null;
  let curtainEl = null;
  let nameInput = null;
  let libraryPickerRef = null;
  let tagsContainer = null;
  let tagsInput = null;

  function close() {
    if (!isOpen) return;
    anchorElement?.style?.removeProperty('anchor-name');
    panelEl?.classList.remove('ax-drawer-open');
    curtainEl?.classList.remove('ax-drawer-curtain-visible');
    focusTrap?.deactivate();
    focusTrap = null;
    removeEscHandler?.();
    removeEscHandler = null;
    libraryPickerRef?.destroy();
    libraryPickerRef = null;

    setTimeout(() => {
      curtainEl?.remove();
      panelEl?.remove();
      curtainEl = null;
      panelEl = null;
    }, 220);

    isOpen = false;
    onClose?.();
  }

  function collectFormData() {
    const libraryId = libraryPickerRef?.value ?? '';
    const lib = libraryPickerRef?.getLibrary() ?? null;
    const tags = tagsContainer ? getTagValues(tagsContainer) : [];
    return {
      name: nameInput?.value?.trim() ?? '',
      libraryId,
      library: lib,
      tags,
    };
  }

  async function save() {
    const formData = collectFormData();
    const saveBtnEl = panelEl?.querySelector('.ax-drawer-save-btn');

    if (!ccLibraryProvider) {
      close();
      showToast({
        variant: 'negative',
        message: 'Unable to save: sign in to access Creative Cloud Libraries.',
      });
      announceToScreenReader('Unable to save: not signed in');
      return;
    }

    if (!formData.libraryId) {
      showToast({
        variant: 'negative',
        message: 'Please select a library before saving.',
      });
      announceToScreenReader('Please select a library');
      return;
    }

    if (saveBtnEl) {
      saveBtnEl.disabled = true;
      saveBtnEl.textContent = 'Saving\u2026';
    }

    try {
      const isGradient = paletteType === 'gradient';
      const colors = paletteData?.colors ?? [];
      const themeName = formData.name || paletteData?.name;

      if (isGradient) {
        const gradientPayload = ccLibraryProvider.buildGradientPayload({
          name: themeName || 'Untitled Gradient',
          stops: colors.map((hex, i, arr) => ({
            color: hex,
            position: arr.length > 1 ? i / (arr.length - 1) : 0,
          })),
        });
        await ccLibraryProvider.saveGradient(formData.libraryId, gradientPayload);
      } else {
        const payload = buildThemePayload(paletteData, formData);
        await ccLibraryProvider.saveTheme(formData.libraryId, payload);
      }

      close();
      const label = isGradient ? 'Gradient' : 'Color palette';
      showToast({
        variant: 'positive',
        message: `${label} successfully added to '${formData.library?.name ?? 'Your Library'}'`,
      });
      await onSave?.(formData);
    } catch (err) {
      const label = paletteType === 'gradient' ? 'gradient' : 'color palette';
      window.lana?.log(`Save ${label} failed: ${err.message}`, {
        tags: 'color-floating-toolbar,drawer',
      });
      close();
      showToast({
        variant: 'negative',
        message: `Failed to save ${label}. Please try again.`,
      });
      announceToScreenReader('Save failed');
    } finally {
      if (saveBtnEl) {
        saveBtnEl.disabled = false;
        saveBtnEl.textContent = SAVE_BTN_TEXT;
      }
    }
  }

  async function open() {
    if (isOpen) return;
    await loadDrawerDeps();

    const mobile = isMobileViewport();
    const titleId = 'ax-drawer-title';

    curtainEl = createCurtain('ax-drawer-curtain', mobile ? close : null);

    const theme = document.createElement('sp-theme');
    theme.setAttribute('system', 'spectrum-two');
    theme.setAttribute('color', 'light');
    theme.setAttribute('scale', 'medium');

    panelEl = createTag('div', {
      class: 'ax-drawer-panel',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': titleId,
    });
    panelEl.appendChild(theme);

    if (mobile) {
      theme.appendChild(createTag('div', { class: 'ax-drawer-line' }));
      theme.appendChild(createHeader(titleId, close));
    }

    const content = createTag('div', { class: 'ax-drawer-content' });
    const formFields = createTag('div', { class: 'ax-drawer-form-fields' });

    if (!mobile) {
      formFields.appendChild(
        createTag('h2', { class: 'ax-drawer-title', id: titleId }, TITLE),
      );
    }

    const { field: nameField, input: nameInputEl } = createFormField(
      'ax-drawer-palette-name',
      PALETTE_NAME_LABEL,
      paletteData?.name ?? '',
    );
    nameInput = nameInputEl;
    formFields.appendChild(nameField);

    libraryPickerRef = createLibraryPickerField(
      LIBRARY_LABEL,
      libraries,
      libraries[0]?.id,
      ccLibraryProvider,
    );
    formFields.appendChild(libraryPickerRef.wrapper);

    const {
      wrapper: tagsWrapper, container: tagsContainerEl, input: tagsInputEl,
    } = createTagsField(
      TAGS_LABEL,
      paletteData?.tags ?? [],
      TAGS_PLACEHOLDER,
    );
    tagsContainer = tagsContainerEl;
    tagsInput = tagsInputEl;
    formFields.appendChild(tagsWrapper);
    content.appendChild(formFields);

    tagsInput.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      addTagFromInput(tagsInput, tagsContainer);
    });

    const saveBtnEl = createTag('button', {
      type: 'button',
      class: 'ax-drawer-save-btn',
    }, SAVE_BTN_TEXT);
    saveBtnEl.addEventListener('click', save);
    content.appendChild(saveBtnEl);

    theme.appendChild(content);

    if (mobile) document.body.appendChild(curtainEl);
    document.body.appendChild(panelEl);

    if (!mobile && anchorElement) {
      positionDesktopPanel(panelEl, anchorElement);
    }

    requestAnimationFrame(() => {
      panelEl.classList.add('ax-drawer-open');
      curtainEl?.classList.add('ax-drawer-curtain-visible');
    });

    focusTrap = activateFocusTrap(panelEl);
    removeEscHandler = addEscapeClose(close);

    isOpen = true;
    announceToScreenReader(TITLE);
  }

  function destroy() {
    close();
    curtainEl?.remove();
    panelEl?.remove();
  }

  return {
    open,
    close,
    destroy,
    get isOpen() { return isOpen; },
  };
}
