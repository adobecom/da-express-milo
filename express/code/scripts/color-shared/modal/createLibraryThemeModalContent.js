import { createTag } from '../../utils.js';
import loadMiloStyle from '../utils/loadMiloStyle.js';
import { createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';
import { initFloatingToolbar } from '../toolbar/createFloatingToolbar.js';
import { getPaletteColors, setupSwatchColumnNav } from './createPaletteModalContent.js';
import {
  createTagField,
  getTagValues,
  addTagFromInput as addTagFromInputHelper,
} from '../toolbar/createTagField.js';
import { buildThemePayload } from '../toolbar/createDrawerComponent.js';
import { navigateToColorTool } from '../utils/utilities.js';
import { showExpressToast } from '../spectrum/components/express-toast.js';
import { announceToScreenReader } from '../spectrum/index.js';

function interpolate(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? vars[key] : ''));
}

const LIBRARY_THEME_STYLES = [
  'scripts/color-shared/modal/modal-palette-content.css',
  'scripts/color-shared/components/strips/color-strip.css',
  'scripts/color-shared/toolbar/drawer.css',
  'scripts/color-shared/components/libraries/libraries.css',
  'scripts/color-shared/modal/modal-library-theme.css',
];

let stylesLoaded = false;
export async function ensureLibraryThemeModalStyles() {
  if (stylesLoaded) return;
  try {
    await Promise.all(LIBRARY_THEME_STYLES.map((path) => loadMiloStyle(path)));
    stylesLoaded = true;
  } catch {
    stylesLoaded = true;
  }
}

function createRailSection(
  normalizedPalette,
  ariaLabel,
  colorSwatchRailStrings,
  verticalMaxPerRow,
) {
  const colorCount = normalizedPalette.colors.length;
  const railSection = createTag('section', {
    class: 'modal-palette-container modal-palette-container--color-rail',
    'aria-label': ariaLabel,
  });
  const colorCountRange = colorCount <= 5 ? 'small' : 'large';
  const railWrap = createTag('div', {
    class: 'modal-color-rail-wrap strip-container',
    'data-color-count-range': colorCountRange,
  });
  const railAdapter = createSwatchRailAdapter(normalizedPalette, {
    orientation: 'vertical-responsive',
    swatchFeatures: {
      copy: true,
      copyFromHex: false,
      colorPicker: false,
      hexCode: true,
      baseColor: false,
    },
    ...(Number.isFinite(verticalMaxPerRow) ? { verticalMaxPerRow } : {}),
    ...(colorSwatchRailStrings ? { strings: colorSwatchRailStrings } : {}),
  });
  railWrap.appendChild(railAdapter.element);
  railSection.appendChild(railWrap);

  // Bottom fade + scrolled-to-bottom toggle for tall (large) rails, matching the
  // read-only palette modal behavior. A ResizeObserver keeps the fade in sync as
  // the rail reflows on viewport width changes (e.g. tablet <-> desktop).
  let destroyRail = () => {};
  if (colorCountRange === 'large') {
    const updateFade = () => {
      const noOverflow = railWrap.scrollHeight <= railWrap.clientHeight;
      const atBottom = !noOverflow
        && railWrap.scrollHeight - railWrap.scrollTop - railWrap.clientHeight < 2;
      railSection.classList.toggle('scrolled-to-bottom', noOverflow || atBottom);
    };
    railWrap.addEventListener('scroll', updateFade, { passive: true });
    let resizeObserver = null;
    (async () => {
      try {
        await customElements.whenDefined('color-swatch-rail');
        const rail = railWrap.querySelector('color-swatch-rail');
        if (rail?.updateComplete) await rail.updateComplete;
      } catch { /* noop */ }
      requestAnimationFrame(() => {
        updateFade();
        resizeObserver = new ResizeObserver(updateFade);
        resizeObserver.observe(railWrap);
      });
    })();
    destroyRail = () => {
      railWrap.removeEventListener('scroll', updateFade);
      resizeObserver?.disconnect();
      resizeObserver = null;
    };
  }

  return {
    railSection, railWrap, railAdapter, destroyRail,
  };
}

/**
 * Editable "libraries saved themes" modal content. Reuses the read-only palette
 * modal's swatch rail + column navigation, adds the ax-drawer-tag-section tag
 * field, and mounts the library-variant toolbar (name + Share/Download/
 * Accessibility/Delete + Edit theme/Save changes).
 *
 * @param {Object} item - library theme item ({ id, name, colors, tags, ... })
 * @param {Object} [options]
 * @param {string} [options.libraryId]
 * @param {Object} [options.ccLibraryProvider]
 * @param {Object} [options.toolHrefs]
 * @param {Object} [options.librariesStrings] - resolved libraries placeholders
 * @param {Function} [options.requestClose] - closes the host modal
 */
export function createLibraryThemeModalContent(item = {}, options = {}) {
  const {
    libraryId = '',
    ccLibraryProvider = null,
    toolHrefs = {},
    librariesStrings = {},
    colorSwatchRailStrings = {},
    verticalMaxPerRow = 10,
    requestClose = () => {},
    deps = {},
  } = options;
  const {
    initFloatingToolbar: initToolbar = initFloatingToolbar,
    navigateToColorTool: navigateToTool = navigateToColorTool,
    showExpressToast: showToast = showExpressToast,
  } = deps;
  const strings = librariesStrings;

  const normalizedPalette = { ...item, colors: getPaletteColors(item) };

  let originalName = (item.name || '').trim();
  let originalTags = [...(item.tags || [])].map(String).sort();
  let currentName = item.name || '';
  let toolbarApi = null;
  let toolbarHandle = null;
  let tagObserver = null;

  const root = createTag('main', { class: 'modal-content modal-library-theme', 'daa-lh': 'library-theme-modal' });

  const colorCount = normalizedPalette.colors.length;
  const { railSection, railWrap, destroyRail } = createRailSection(
    normalizedPalette,
    interpolate(strings.librariesModalPaletteAria, { count: colorCount }),
    colorSwatchRailStrings,
    verticalMaxPerRow,
  );
  root.appendChild(railSection);
  const { initTabIndexes } = setupSwatchColumnNav(railWrap);

  /* ── Editable tags (reused ax-drawer-tag-section) ── */
  const tagsSection = createTag('section', { class: 'modal-lib-tags' });
  const tagField = createTagField(
    strings.librariesModalTags,
    item.tags ?? [],
    strings.librariesModalTagsPlaceholder,
    {
      helpTextStr: strings.librariesModalTagHelp,
      removeLabel: strings.librariesTagRemoveAria,
      activateOnFocusOnly: true,
    },
  );
  const {
    wrapper: tagsWrapper,
    tagsContainer,
    input: tagsInput,
    syncState: syncTagState,
  } = tagField;
  tagsInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    addTagFromInputHelper(tagsInput, tagsContainer, {
      onStateChange: syncTagState,
      removeLabel: strings.librariesTagRemoveAria,
    });
  });
  tagsSection.appendChild(tagsWrapper);
  root.appendChild(tagsSection);

  /* ── Dirty tracking ── */
  function isDirty() {
    const name = (currentName || '').trim();
    if (!name) return false;
    const tags = [...getTagValues(tagsContainer)].sort();
    const nameChanged = name !== originalName;
    const tagsChanged = tags.length !== originalTags.length
      || tags.some((tag, i) => tag !== originalTags[i]);
    return nameChanged || tagsChanged;
  }
  function refreshDirty() {
    toolbarApi?.setSaveEnabled?.(isDirty());
  }

  tagObserver = new MutationObserver(() => refreshDirty());
  tagObserver.observe(tagsContainer, { childList: true });

  /* ── Persistence ── */
  async function handleSaveChanges() {
    if (!ccLibraryProvider || !libraryId || !item?.id) {
      showToast({ variant: 'negative', message: strings.librariesModalSaveError });
      return;
    }
    const name = (currentName || item.name || '').trim();
    const tags = getTagValues(tagsContainer);
    toolbarApi?.setSaving?.(true);
    try {
      const payload = buildThemePayload(
        normalizedPalette,
        { name, tags },
        { untitledTheme: strings.librariesModalUntitledTheme },
      );
      // updateTheme persists theme data (colors/tags); name lives in element metadata.
      await Promise.all([
        ccLibraryProvider.updateTheme(libraryId, item.id, payload),
        ccLibraryProvider.updateElementMetadata(libraryId, [{ id: item.id, name }]),
      ]);
      originalName = name;
      originalTags = [...tags].sort();
      item.name = name;
      item.tags = tags;
      toolbarApi?.updateName?.(name);
      showToast({ variant: 'positive', message: strings.librariesModalSaveSuccess });
      announceToScreenReader(strings.librariesModalSaveSuccess);
      root.dispatchEvent(new CustomEvent('libraries:item-updated', {
        detail: { item, libraryId }, bubbles: true,
      }));
    } catch (err) {
      window.lana?.log(`Library theme save failed: ${err?.message}`, {
        tags: 'color-libraries,theme-modal', severity: 'error',
      });
      showToast({ variant: 'negative', message: strings.librariesModalSaveError });
      announceToScreenReader(strings.librariesModalSaveError);
    } finally {
      toolbarApi?.setSaving?.(false);
      refreshDirty();
    }
  }

  function handleEditTheme() {
    if (!toolHrefs.colorWheel || !normalizedPalette.colors.length) return;
    navigateToTool(toolHrefs.colorWheel, {
      colors: normalizedPalette.colors,
      name: currentName || item.name,
      tags: getTagValues(tagsContainer),
    });
  }

  function handleDelete() {
    root.dispatchEvent(new CustomEvent('libraries:item-delete', {
      detail: { item, libraryId }, bubbles: true,
    }));
    requestClose();
  }

  function wireToolbar(api) {
    toolbarApi = api;
    if (!api) return;
    api.on('namechange', (detail) => {
      currentName = detail?.name ?? '';
      refreshDirty();
    });
    api.on('save-changes', () => handleSaveChanges());
    api.on('edit-theme', () => handleEditTheme());
    api.on('delete', () => handleDelete());
    refreshDirty();
  }

  /* ── Toolbar (library variant) ── */
  const toolbarMount = createTag('nav', { class: 'modal-palette-toolbar', 'aria-label': strings.librariesModalActionsAria });
  root.appendChild(toolbarMount);

  initToolbar(toolbarMount, {
    palette: { id: item?.id ?? '', name: item?.name ?? '', colors: normalizedPalette.colors },
    type: 'palette',
    contentVariant: 'library',
    inModal: true,
    showPaletteName: true,
    editPaletteName: true,
    item,
    toolHrefs,
    librariesStrings: strings,
  }).then((handle) => {
    toolbarHandle = handle;
    wireToolbar(handle?.toolbar);
  }).catch((error) => {
    window.lana?.log(`Library theme modal toolbar init failed: ${error?.message}`, {
      tags: 'color-libraries,theme-modal', severity: 'error',
    });
  });

  return {
    element: root,
    initNav: initTabIndexes,
    destroy: () => {
      destroyRail();
      tagObserver?.disconnect();
      tagObserver = null;
      toolbarHandle?.destroy?.();
      toolbarHandle = null;
      toolbarApi = null;
    },
  };
}
