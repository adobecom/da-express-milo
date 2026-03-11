import loadCSS from '../utils/loadCss.js';
import { createSpectrumIcon } from '../utils/icons.js';
import {
  isMobileViewport,
  createCurtain,
  addSwipeToClose,
  lockBodyScroll,
  unlockBodyScroll,
  saveFocusedElement,
  restoreFocusedElement,
  getNextOverlayZIndex,
} from '../utils/utilities.js';
import { announceToScreenReader, trapFocus, handleEscapeClose } from '../spectrum/index.js';
import { createTag } from '../../utils.js';
import { loadButton, loadMenu } from '../spectrum/load-spectrum.js';
import { createThemeWrapper } from '../spectrum/utils/theme.js';
import { showExpressToast } from '../spectrum/components/express-toast.js';
import { triggerSignInFlow, ensureIms } from '../../../libs/services/middlewares/auth.middleware.js';
import {
  THEME_ELEMENT_TYPE,
  THEME_REPRESENTATION_TYPE,
  CC_LIBRARY_COLOR_MODE,
  COLOR_PROFILE,
  getClientInfo,
} from '../../../libs/services/plugins/cclibrary/constants.js';

function interpolate(tpl, vars) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, v), tpl);
}

const DRAWER_DEFAULTS = {
  title: 'Save to Creative Cloud Libraries',
  paletteName: 'Palette name',
  saveTo: 'Save to',
  tags: 'Tags',
  tagsPlaceholder: 'Enter or select from below',
  saveToLibrary: 'Save to library',
  signInToSave: 'Sign in to save',
  myLibrary: 'My library',
  createNewLibrary: 'Create a new library',
  enterLibraryName: 'Enter library name',
  create: 'Create',
  creating: 'Creating\u2026',
  libraryCreated: 'Library "{{name}}" created and selected',
  createLibraryFailed: 'Failed to create library',
  createNotSignedIn: 'Cannot create library: not signed in',
  noLibraries: 'No libraries available',
  unableToSave: 'Unable to save: sign in to access Creative Cloud Libraries.',
  selectLibrary: 'Please select a library before saving.',
  savedSuccessfully: "{{label}} successfully added to '{{libraryName}}'",
  saveFailed: 'Failed to save {{label}}. Please try again.',
  saveFailedAria: 'Save failed',
  untitledTheme: 'Untitled Theme',
  untitledGradient: 'Untitled Gradient',
  saving: 'Saving\u2026',
  gradientLabel: 'Gradient',
  paletteLabel: 'Color palette',
  keywordSuggestions: 'Blue,Green,Bold,Bright,Beige',
  yourLibrary: 'Your Library',
};

const DRAWER_CSS_PATH = 'scripts/color-shared/toolbar/drawer.css';
const COLOR_TOKENS_CSS_PATH = 'scripts/color-shared/color-tokens.css';

/* ── Authentication Helpers ──────────────────────────────────── */

async function checkIsSignedIn() {
  try {
    const ims = await ensureIms();
    return ims.isSignedInUser();
  } catch {
    return false;
  }
}

/* ── Dependency Loading ───────────────────────────────────────── */
async function loadDrawerDeps() {
  const results = await Promise.allSettled([
    loadCSS(COLOR_TOKENS_CSS_PATH),
    loadCSS(DRAWER_CSS_PATH),
    loadButton(),
    loadMenu(),
  ]);
  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length) {
    window.lana?.log(
      `Drawer deps failed: ${failures.map((f) => f.reason).join(', ')}`,
      { tags: 'color-floating-toolbar,drawer' },
    );
  }
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

function createDisabledLibraryPicker(label, t) {
  const wrapper = createTag('div', { class: 'ax-drawer-library-picker' });
  const labelEl = createTag('label', { class: 'ax-drawer-picker-label' }, label);
  labelEl.classList.add('ax-drawer-picker-label-disabled');
  const trigger = createTag('button', {
    type: 'button',
    class: 'ax-lib-picker-trigger ax-lib-picker-trigger-disabled',
    disabled: '',
    'aria-disabled': 'true',
  });
  const triggerLabel = createTag('span', { class: 'ax-lib-picker-trigger-label' }, t.myLibrary);
  trigger.appendChild(triggerLabel);
  wrapper.append(labelEl, trigger);

  return {
    wrapper,
    get value() { return ''; },
    getLibrary() { return null; },
    destroy() {},
  };
}

function createLibraryPickerTrigger(selectedName) {
  const trigger = createTag('button', {
    type: 'button',
    class: 'ax-lib-picker-trigger',
    'aria-haspopup': 'listbox',
    'aria-expanded': 'false',
  });
  const triggerLabel = createTag('span', { class: 'ax-lib-picker-trigger-label' }, selectedName);
  const triggerChevron = createTag('span', { class: 'ax-lib-picker-trigger-chevron', 'aria-hidden': 'true' });
  triggerChevron.appendChild(createChevronDownIcon());
  trigger.append(triggerLabel, triggerChevron);
  return { trigger, triggerLabel };
}

function createLibraryPopover(label, t) {
  const popover = createTag('div', {
    class: 'ax-lib-picker-popover',
    role: 'listbox',
    'aria-label': label,
  });

  const menu = document.createElement('sp-menu');
  menu.setAttribute('selects', 'single');

  const divider = createTag('div', { class: 'ax-lib-picker-divider' });

  const createSection = createTag('div', { class: 'ax-lib-picker-create-section' });
  const createLabelEl = createTag('span', { class: 'ax-lib-picker-create-label' }, t.createNewLibrary);
  const createInput = createTag('input', {
    type: 'text',
    class: 'ax-lib-picker-create-input',
    placeholder: t.enterLibraryName,
    'aria-label': t.enterLibraryName,
  });
  const createBtn = document.createElement('sp-button');
  createBtn.setAttribute('variant', 'secondary');
  createBtn.setAttribute('size', 'm');
  createBtn.classList.add('ax-lib-picker-create-btn');
  createBtn.textContent = t.create;

  const createRow = createTag('div', { class: 'ax-lib-picker-create-row' });
  createRow.append(createInput, createBtn);
  createSection.append(createLabelEl, createRow);
  popover.append(menu, divider, createSection);

  return { popover, menu, createInput, createBtn };
}

function setupCreateLibraryHandler(
  createBtn,
  createInput,
  ccLibraryProvider,
  localLibraries,
  state,
  renderMenuItems,
  closePopover,
  onLibraryCreated,
  t,
) {
  createBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const name = createInput.value.trim();
    if (!name) return;

    if (ccLibraryProvider) {
      createBtn.disabled = true;
      createBtn.textContent = t.creating;
      try {
        const result = await ccLibraryProvider.createLibrary(name);
        const libId = result?.library_urn ?? result?.id;
        if (!libId) {
          throw new Error('API did not return a valid library ID');
        }
        const newLib = {
          id: libId,
          name: result.name ?? name,
        };
        localLibraries.push(newLib);
        onLibraryCreated?.(newLib);
        state.currentId = newLib.id;
        state.triggerLabel.textContent = newLib.name;
        createInput.value = '';
        renderMenuItems();
        closePopover();
        announceToScreenReader(interpolate(t.libraryCreated, { name: newLib.name }));
      } catch (err) {
        window.lana?.log(`Create library failed: ${err.message}`, {
          tags: 'color-floating-toolbar,drawer',
        });
        announceToScreenReader(t.createLibraryFailed);
      } finally {
        createBtn.disabled = false;
        createBtn.textContent = t.create;
      }
    } else {
      announceToScreenReader(t.createNotSignedIn);
    }
  });

  createInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createBtn.click();
    }
    e.stopPropagation();
  });
}

function createLibraryPickerField(
  label,
  libraries,
  selectedId,
  ccLibraryProvider,
  isSignedIn,
  onLibraryCreated,
  t,
) {
  if (!isSignedIn) {
    return createDisabledLibraryPicker(label, t);
  }

  const localLibraries = [...libraries];
  const state = { currentId: selectedId ?? libraries[0]?.id ?? '' };
  let isPopoverOpen = false;

  const selectedName = () => {
    if (!localLibraries.length) return t.noLibraries;
    return localLibraries.find((l) => l.id === state.currentId)?.name ?? '';
  };

  const { trigger, triggerLabel } = createLibraryPickerTrigger(selectedName());
  state.triggerLabel = triggerLabel;

  const wrapper = createTag('div', { class: 'ax-drawer-library-picker' });
  const labelEl = createTag('label', { class: 'ax-drawer-picker-label' }, label);
  const { popover, menu, createInput, createBtn } = createLibraryPopover(label, t);
  wrapper.append(labelEl, trigger, popover);

  function closePopover() {
    isPopoverOpen = false;
    popover.classList.remove('ax-lib-picker-popover-open');
    trigger.setAttribute('aria-expanded', 'false');
    wrapper.closest('.ax-drawer-panel')?.classList.remove('ax-drawer-dropdown-open');
  }

  function openPopover() {
    isPopoverOpen = true;
    popover.classList.add('ax-lib-picker-popover-open');
    trigger.setAttribute('aria-expanded', 'true');
    wrapper.closest('.ax-drawer-panel')?.classList.add('ax-drawer-dropdown-open');
  }

  function selectLibrary(lib, item) {
    state.currentId = lib.id;
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
      if (lib.id === state.currentId) item.setAttribute('selected', '');
      item.textContent = lib.name;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectLibrary(lib, item);
      });
      menu.appendChild(item);
    });
  }

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

  setupCreateLibraryHandler(
    createBtn,
    createInput,
    ccLibraryProvider,
    localLibraries,
    state,
    renderMenuItems,
    closePopover,
    onLibraryCreated,
    t,
  );

  renderMenuItems();

  return {
    wrapper,
    get value() { return state.currentId; },
    getLibrary() { return localLibraries.find((l) => l.id === state.currentId) ?? null; },
    destroy() {
      document.removeEventListener('click', handleOutsideClick);
    },
  };
}

/* ── Tag Chips (sp-button variant=primary) ───────────────────── */

function normalizeTagText(t) {
  if (typeof t === 'string') return t;
  return t?.tag ?? t?.name ?? '';
}

/**
 * Create a tag chip using sp-button.
 *
 * @param {string}  text     — visible label
 * @param {Object}  [opts]
 * @param {string}  [opts.size='s']        — Spectrum size token
 * @param {boolean} [opts.deletable=true]  — shows a Close icon; removes on click
 */
function createTagButton(text, opts = {}) {
  const { size = 's', deletable = true } = opts;
  const btn = document.createElement('sp-button');
  btn.setAttribute('variant', 'primary');
  btn.setAttribute('size', size);
  btn.classList.add('ax-drawer-tag-btn');
  btn.dataset.tagValue = text;
  btn.textContent = text;

  if (deletable) {
    const closeIcon = createSpectrumIcon('Cross75');
    closeIcon.setAttribute('slot', 'icon');
    closeIcon.setAttribute('aria-hidden', 'true');
    btn.prepend(closeIcon);

    closeIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.remove();
    });
  }

  return btn;
}

function getTagValues(container) {
  return [...container.querySelectorAll('sp-button.ax-drawer-tag-btn')]
    .map((el) => el.dataset.tagValue ?? '')
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

  const tagsContainer = createTag('div', { class: 'ax-drawer-added-tags' });
  (tags ?? []).forEach((t) => {
    const text = normalizeTagText(t);
    if (text) tagsContainer.appendChild(createTagButton(text));
  });

  wrapper.append(fieldGroup, tagsContainer);
  return { wrapper, container: tagsContainer, input };
}

function addTagFromInput(tagsInput, tagsContainer, mobile) {
  const text = tagsInput.value.trim();
  if (!text) return;
  tagsInput.value = '';
  tagsContainer.appendChild(createTagButton(text, { size: mobile ? 'm' : 's' }));
}

function createKeywordSuggestions(keywords, mobile) {
  const wrapper = createTag('div', { class: 'ax-drawer-keyword-suggestions' });
  const size = mobile ? 'm' : 's';
  keywords.forEach((keyword) => {
    const btn = document.createElement('sp-button');
    btn.setAttribute('variant', 'primary');
    btn.setAttribute('size', size);
    btn.classList.add('ax-drawer-tag-btn');
    btn.textContent = keyword;
    const icon = createSpectrumIcon('Add');
    icon.setAttribute('slot', 'icon');
    btn.prepend(icon);
    wrapper.appendChild(btn);
  });
  return wrapper;
}

/* ── Desktop Anchor Positioning ───────────────────────────────── */

function computePosition(panel, anchor) {
  const btnRect = anchor.getBoundingClientRect();
  const panelWidth = 307;
  const spaceAbove = btnRect.top;
  const spaceBelow = window.innerHeight - btnRect.bottom;

  const pos = {};
  if (spaceAbove >= spaceBelow) {
    pos.bottom = `${window.innerHeight - btnRect.top + 8}px`;
    pos.top = 'auto';
  } else {
    pos.top = `${btnRect.bottom + 8}px`;
    pos.bottom = 'auto';
  }
  pos.left = `${Math.max(0, btnRect.right - panelWidth)}px`;
  return pos;
}

function startJSFallback(panel, anchor) {
  const reposition = () => {
    const pos = computePosition(panel, anchor);
    Object.assign(panel.style, pos);
  };
  reposition();

  let rafId = null;
  const throttled = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      reposition();
      rafId = null;
    });
  };

  const scrollOpts = { passive: true, capture: true };
  window.addEventListener('scroll', throttled, scrollOpts);
  window.addEventListener('resize', throttled);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('scroll', throttled, scrollOpts);
    window.removeEventListener('resize', throttled);
  };
}

function isNearAnchor(panel, anchor) {
  const pr = panel.getBoundingClientRect();
  const ar = anchor.getBoundingClientRect();
  const GAP = 50;
  const vertClose = Math.abs(pr.bottom - ar.top) < GAP
    || Math.abs(pr.top - ar.bottom) < GAP;
  const horizClose = pr.right > ar.left - GAP && pr.left < ar.right + GAP;
  return vertClose && horizClose;
}

function positionDesktopPanel(panel, anchor) {
  anchor.style.setProperty('anchor-name', '--ax-drawer-anchor');

  if (!CSS.supports?.('anchor-name', '--ax-drawer-anchor')) {
    return { cleanup: startJSFallback(panel, anchor), verify: null };
  }

  return {
    cleanup: null,
    verify: () => {
      if (!isNearAnchor(panel, anchor)) {
        return startJSFallback(panel, anchor);
      }
      return null;
    },
  };
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

function buildThemePayload(palette, formData, t) {
  const colors = palette?.colors ?? [];
  return {
    name: formData.name || palette?.name || t.untitledTheme,
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

/* ── Extracted Drawer Helpers ─────────────────────────────────── */

function collectFormData(libPickerRef, tagsEl, nameEl) {
  const libraryId = libPickerRef?.value ?? '';
  const lib = libPickerRef?.getLibrary() ?? null;
  const tags = tagsEl ? getTagValues(tagsEl) : [];
  return {
    name: nameEl?.value?.trim() ?? '',
    libraryId,
    library: lib,
    tags,
  };
}

function validateSaveForm(ccLibProvider, formData, closeFn, t) {
  if (!ccLibProvider) {
    closeFn();
    showExpressToast({
      variant: 'negative',
      message: t.unableToSave,
    });
    announceToScreenReader(t.unableToSave);
    return false;
  }

  if (!formData.libraryId) {
    showExpressToast({
      variant: 'negative',
      message: t.selectLibrary,
    });
    announceToScreenReader(t.selectLibrary);
    return false;
  }

  return true;
}

async function executeSaveToLibrary(palette, palType, formData, ccLibProvider, t) {
  const isGradient = palType === 'gradient';
  const colors = palette?.colors ?? [];
  const themeName = formData.name || palette?.name;

  if (isGradient) {
    const gradientPayload = ccLibProvider.buildGradientPayload({
      name: themeName || t.untitledGradient,
      stops: colors.map((hex, i, arr) => ({
        color: hex,
        position: arr.length > 1 ? i / (arr.length - 1) : 0,
      })),
    });
    await ccLibProvider.saveGradient(formData.libraryId, gradientPayload);
  } else {
    const payload = buildThemePayload(palette, formData, t);
    await ccLibProvider.saveTheme(formData.libraryId, payload);
  }

  const label = isGradient ? t.gradientLabel : t.paletteLabel;
  return { success: true, label };
}

function buildDrawerDOM(mobile, titleId, palette, libs, ccLibProvider, isSignedIn, callbacks, t) {
  const { onClose, onSave, onSignIn, onLibraryCreated } = callbacks;

  const curtain = createCurtain(
    'ax-drawer-curtain',
    mobile ? onClose : null,
    { debounceMs: 500 },
  );

  const theme = createThemeWrapper();

  const panel = createTag('div', {
    class: 'ax-drawer-panel',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': titleId,
  });
  panel.appendChild(theme);

  if (mobile) {
    panel.classList.add('ax-drawer-mobile');
    theme.appendChild(createTag('div', { class: 'ax-drawer-line' }));
  }

  const content = createTag('div', { class: 'ax-drawer-content' });
  const formFields = createTag('div', { class: 'ax-drawer-form-fields' });

  formFields.appendChild(
    createTag('h2', { class: 'ax-drawer-title', id: titleId }, t.title),
  );

  const { field: nameField, input: nameInputEl } = createFormField(
    'ax-drawer-palette-name',
    t.paletteName,
    palette?.name ?? '',
  );
  formFields.appendChild(nameField);

  const libraryPicker = createLibraryPickerField(
    t.saveTo,
    libs,
    libs[0]?.id,
    ccLibProvider,
    isSignedIn,
    onLibraryCreated,
    t,
  );
  formFields.appendChild(libraryPicker.wrapper);

  const {
    wrapper: tagsWrapper, container: tagsContainerEl, input: tagsInputEl,
  } = createTagsField(
    t.tags,
    palette?.tags ?? [],
    t.tagsPlaceholder,
  );
  tagsWrapper.appendChild(createKeywordSuggestions(t.keywordSuggestions.split(',').map((s) => s.trim()), mobile));
  formFields.appendChild(tagsWrapper);
  content.appendChild(formFields);

  tagsInputEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    addTagFromInput(tagsInputEl, tagsContainerEl, mobile);
  });

  const saveBtnEl = document.createElement('sp-button');
  saveBtnEl.setAttribute('variant', 'accent');
  saveBtnEl.setAttribute('size', mobile ? 'xl' : 'm');
  saveBtnEl.classList.add('ax-drawer-save-btn');

  if (isSignedIn) {
    saveBtnEl.textContent = t.saveToLibrary;
    saveBtnEl.addEventListener('click', onSave);
  } else {
    saveBtnEl.textContent = t.signInToSave;
    saveBtnEl.addEventListener('click', onSignIn);
  }
  content.appendChild(saveBtnEl);

  theme.appendChild(content);

  return {
    curtainEl: curtain,
    panelEl: panel,
    nameInputEl,
    libraryPicker,
    tagsContainerEl,
    tagsInputEl,
    saveBtnEl,
  };
}

function attachDrawerToDOM(panel, curtain, mobile, anchor) {
  if (mobile) {
    curtain.style.zIndex = getNextOverlayZIndex();
    document.body.appendChild(curtain);
    lockBodyScroll();
  }
  panel.style.zIndex = getNextOverlayZIndex();
  document.body.appendChild(panel);

  let posResult = null;
  if (!mobile && anchor) {
    posResult = positionDesktopPanel(panel, anchor);
  }
  return posResult;
}

function setupDrawerInteractions(panel, curtain, anchor, mobile, saveBtnEl, closeFn, positioning) {
  const { posResult, onCleanup } = positioning;
  requestAnimationFrame(() => {
    panel.classList.add('ax-drawer-open');
    curtain?.classList.add('ax-drawer-curtain-visible');
    requestAnimationFrame(() => {
      saveBtnEl.focus();
      if (posResult?.verify) {
        const cleanup = posResult.verify();
        if (cleanup) onCleanup(cleanup);
      }
    });
  });

  const ft = trapFocus(panel);
  const esc = handleEscapeClose(panel, closeFn);

  let swipeCleanup = null;
  if (mobile) {
    swipeCleanup = addSwipeToClose(panel, {
      contentSelector: '.ax-drawer-content',
      draggingClass: 'ax-drawer-dragging',
      onClose: closeFn,
    });
  }

  let outsideClickCleanup = null;
  if (!mobile) {
    const handleOutsideClick = (e) => {
      if (panel && !panel.contains(e.target)
          && !anchor?.contains(e.target)) {
        closeFn();
      }
    };
    requestAnimationFrame(() => {
      document.addEventListener('mousedown', handleOutsideClick);
    });
    outsideClickCleanup = () => document.removeEventListener('mousedown', handleOutsideClick);
  }

  return {
    focusTrap: ft,
    escHandler: esc,
    swipeCleanup,
    outsideClickCleanup,
  };
}

/* ── Main Export ──────────────────────────────────────────────── */

// eslint-disable-next-line import/prefer-default-export
export async function createDrawer(options) {
  const {
    paletteData, type: paletteType, anchorElement, onSave, onClose,
    libraries: userLibraries,
    ccLibraryProvider,
    onLibraryCreated,
    i18n = {},
    deps = {},
  } = options;
  const {
    checkAuth = checkIsSignedIn,
    loadDeps = loadDrawerDeps,
  } = deps;
  const t = { ...DRAWER_DEFAULTS, ...i18n };
  const libraries = userLibraries?.length ? userLibraries : [];
  let isOpen = false;
  let focusTrap = null;
  let escHandler = null;
  let panelEl = null;
  let curtainEl = null;
  let nameInput = null;
  let libraryPickerRef = null;
  let tagsContainer = null;
  let removeOutsideClickHandler = null;
  let removeSwipeHandler = null;
  let removePositionHandler = null;
  let previousActiveElement = null;

  function close() {
    if (!isOpen) return;
    isOpen = false;

    anchorElement?.classList.remove('ax-drawer-anchor-active');
    anchorElement?.style?.removeProperty('anchor-name');
    panelEl?.classList.remove('ax-drawer-open');
    curtainEl?.classList.remove('ax-drawer-curtain-visible');
    unlockBodyScroll();

    focusTrap?.release();
    focusTrap = null;
    escHandler?.release();
    escHandler = null;
    removeSwipeHandler?.();
    removeSwipeHandler = null;
    removePositionHandler?.();
    removePositionHandler = null;
    removeOutsideClickHandler?.();
    removeOutsideClickHandler = null;
    libraryPickerRef?.destroy();
    libraryPickerRef = null;

    const elementToFocus = previousActiveElement;
    previousActiveElement = null;

    setTimeout(() => {
      curtainEl?.remove();
      panelEl?.remove();
      curtainEl = null;
      panelEl = null;
      restoreFocusedElement(elementToFocus);
    }, 250);

    onClose?.();
  }

  async function save() {
    const formData = collectFormData(libraryPickerRef, tagsContainer, nameInput);
    if (!validateSaveForm(ccLibraryProvider, formData, close, t)) return;

    const saveBtnEl = panelEl?.querySelector('.ax-drawer-save-btn');
    if (saveBtnEl) {
      saveBtnEl.disabled = true;
      saveBtnEl.textContent = t.saving;
    }

    try {
      const { label } = await executeSaveToLibrary(
        paletteData,
        paletteType,
        formData,
        ccLibraryProvider,
        t,
      );
      close();
      showExpressToast({
        variant: 'positive',
        message: interpolate(t.savedSuccessfully, {
          label,
          libraryName: formData.library?.name ?? t.yourLibrary,
        }),
      });
      await onSave?.(formData);
    } catch (err) {
      const label = paletteType === 'gradient' ? t.gradientLabel : t.paletteLabel;
      window.lana?.log(`Save ${label} failed: ${err.message}`, {
        tags: 'color-floating-toolbar,drawer',
      });
      close();
      showExpressToast({
        variant: 'negative',
        message: interpolate(t.saveFailed, { label }),
      });
      announceToScreenReader(t.saveFailedAria);
    } finally {
      if (saveBtnEl) {
        saveBtnEl.disabled = false;
        saveBtnEl.textContent = t.saveToLibrary;
      }
    }
  }

  async function open() {
    if (isOpen) return;
    const [, isSignedIn] = await Promise.all([loadDeps(), checkAuth()]);

    previousActiveElement = saveFocusedElement();
    const mobile = isMobileViewport();
    const titleId = 'ax-drawer-title';

    const dom = buildDrawerDOM(
      mobile,
      titleId,
      paletteData,
      libraries,
      ccLibraryProvider,
      isSignedIn,
      { onClose: close, onSave: save, onSignIn: triggerSignInFlow, onLibraryCreated },
      t,
    );
    curtainEl = dom.curtainEl;
    panelEl = dom.panelEl;
    nameInput = dom.nameInputEl;
    libraryPickerRef = dom.libraryPicker;
    tagsContainer = dom.tagsContainerEl;

    const posResult = attachDrawerToDOM(panelEl, curtainEl, mobile, anchorElement);
    removePositionHandler = posResult?.cleanup ?? null;

    anchorElement?.classList.add('ax-drawer-anchor-active');

    const interactions = setupDrawerInteractions(
      panelEl,
      curtainEl,
      anchorElement,
      mobile,
      dom.saveBtnEl,
      close,
      { posResult, onCleanup: (cleanup) => { removePositionHandler = cleanup; } },
    );
    focusTrap = interactions.focusTrap;
    escHandler = interactions.escHandler;
    removeSwipeHandler = interactions.swipeCleanup;
    removeOutsideClickHandler = interactions.outsideClickCleanup;

    isOpen = true;

    announceToScreenReader(t.title);
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
