import { loadCSS } from '../utils/css.js';
import { createSpectrumIcon } from '../utils/icons.js';
import { announceToScreenReader, isMobileViewport } from '../utils/accessibility.js';
import { createCurtain, addEscapeClose, activateFocusTrap } from '../utils/overlay.js';
import { createTag } from '../../utils.js';
import loadSpectrum from './spectrum-loader.js';

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
      const newId = `lib-${Date.now()}`;
      localLibraries.push({ id: newId, name });
      currentId = newId;
      createInput.value = '';
      triggerLabel.textContent = name;
      renderMenuItems();
      closePopover();
      announceToScreenReader(`Library "${name}" created and selected`);
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

/* ── Tag Chips (custom implementation – swap with sp-tag later) ── */

function createTagCloseIcon() {
  const icon = createSpectrumIcon('Cross75');
  icon.classList.add('ax-drawer-tag-close-icon');
  return icon;
}

function normalizeTagText(t) {
  if (typeof t === 'string') return t;
  return t?.tag ?? t?.name ?? '';
}

function createTagChip(text) {
  const chip = createTag('button', {
    type: 'button',
    class: 'ax-drawer-tag-chip',
    role: 'listitem',
    tabindex: '0',
  });
  chip.appendChild(
    createTag('span', { class: 'ax-drawer-tag-chip-label' }, text),
  );
  const removeBtn = createTag('span', {
    class: 'ax-drawer-tag-chip-remove',
    role: 'button',
    'aria-label': `Remove ${text}`,
    tabindex: '-1',
  });
  removeBtn.appendChild(createTagCloseIcon());
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chip.remove();
  });
  chip.appendChild(removeBtn);
  return chip;
}

function getTagValues(container) {
  return [...container.querySelectorAll('.ax-drawer-tag-chip-label')]
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

  const tagChips = createTag('div', { class: 'ax-drawer-tag-chips', role: 'list' });
  (tags ?? []).forEach((t) => {
    const text = normalizeTagText(t);
    if (text) tagChips.appendChild(createTagChip(text));
  });

  wrapper.append(fieldGroup, tagChips);
  return { wrapper, container: tagChips, input };
}

/* ── Tag Keyboard Navigation ─────────────────────────────────── */

function setupTagArrowNav(container) {
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const chips = [...container.querySelectorAll('.ax-drawer-tag-chip')];
    if (!chips.length) return;
    const idx = chips.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();
    let next;
    if (e.key === 'ArrowRight') {
      next = idx < chips.length - 1 ? chips[idx + 1] : chips[0];
    } else {
      next = idx > 0 ? chips[idx - 1] : chips[chips.length - 1];
    }
    next.focus();
  });
}

function addTagFromInput(tagsInput, tagsContainer) {
  const text = tagsInput.value.trim();
  if (!text) return;
  tagsInput.value = '';
  tagsContainer.appendChild(createTagChip(text));
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

/* ── Main Export ──────────────────────────────────────────────── */

// eslint-disable-next-line import/prefer-default-export
export async function createDrawer(options) {
  const {
    paletteData, anchorElement, onSave, onClose,
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
    await onSave?.(collectFormData());
    close();
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

    setupTagArrowNav(tagsContainer);

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
