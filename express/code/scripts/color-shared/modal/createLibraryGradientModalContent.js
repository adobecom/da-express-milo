import { createTag } from '../../utils.js';
import loadMiloStyle from '../utils/loadMiloStyle.js';
import { createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';
import { createGradientEditor } from '../components/gradients/gradient-editor.js';
import { initFloatingToolbar } from '../toolbar/createFloatingToolbar.js';
import { setupSwatchColumnNav } from './createPaletteModalContent.js';
import { libraryGradientToModalGradient } from '../components/libraries/libraryDownloadUtils.js';
import {
  createTagField,
  getTagValues,
  addTagFromInput as addTagFromInputHelper,
} from '../toolbar/createTagField.js';
import { showExpressToast } from '../spectrum/components/express-toast.js';
import { announceToScreenReader } from '../spectrum/index.js';

function interpolate(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? vars[key] : ''));
}

const LIBRARY_GRADIENT_STYLES = [
  'scripts/color-shared/modal/modal-palette-content.css',
  'scripts/color-shared/components/strips/color-strip.css',
  'scripts/color-shared/components/gradients/gradient-editor.css',
  'scripts/color-shared/modal/modal-gradient-content.css',
  'scripts/color-shared/toolbar/drawer.css',
  'scripts/color-shared/components/libraries/libraries.css',
  'scripts/color-shared/modal/modal-library-gradient.css',
];

let stylesLoaded = false;
export async function ensureLibraryGradientModalStyles() {
  if (stylesLoaded) return;
  try {
    await Promise.all(LIBRARY_GRADIENT_STYLES.map((path) => loadMiloStyle(path)));
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
  // read-only palette modal behavior.
  if (colorCountRange === 'large') {
    const updateFade = () => {
      const noOverflow = railWrap.scrollHeight <= railWrap.clientHeight;
      const atBottom = !noOverflow
        && railWrap.scrollHeight - railWrap.scrollTop - railWrap.clientHeight < 2;
      railSection.classList.toggle('scrolled-to-bottom', noOverflow || atBottom);
    };
    railWrap.addEventListener('scroll', updateFade, { passive: true });
    (async () => {
      try {
        await customElements.whenDefined('color-swatch-rail');
        const rail = railWrap.querySelector('color-swatch-rail');
        if (rail?.updateComplete) await rail.updateComplete;
      } catch { /* noop */ }
      requestAnimationFrame(updateFade);
    })();
  }

  return { railSection, railWrap, railAdapter };
}

/**
 * Editable "libraries saved gradients" modal content. Renders a read-only
 * gradient preview (copyable handles), the stop swatch rail (hex + copy), an
 * editable tag field, and the library-variant toolbar (name + Share/Download/
 * Delete + Save changes). The Color-mode HEX picker + code view and the
 * "Edit" button from the Figma frame are intentionally omitted.
 *
 * @param {Object} item - library gradient item ({ id, name, colorStops, tags, ... })
 * @param {Object} [options]
 * @param {string} [options.libraryId]
 * @param {Object} [options.ccLibraryProvider]
 * @param {Object} [options.toolHrefs]
 * @param {Object} [options.librariesStrings] - resolved libraries placeholders
 * @param {Function} [options.requestClose] - closes the host modal
 */
export function createLibraryGradientModalContent(item = {}, options = {}) {
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
    showExpressToast: showToast = showExpressToast,
  } = deps;
  const strings = librariesStrings;

  const modalGradient = libraryGradientToModalGradient(item);
  const angle = modalGradient.angle ?? 90;
  let colorStops = Array.isArray(modalGradient.colorStops) ? modalGradient.colorStops : [];
  if (!colorStops.length) {
    colorStops = [{ color: '#cccccc', position: 0 }, { color: '#999999', position: 1 }];
  }
  const stopColors = colorStops.map((s) => s.color);

  let originalName = (item.name || '').trim();
  let originalTags = [...(item.tags || [])].map(String).sort();
  let currentName = item.name || '';
  let toolbarApi = null;
  let toolbarHandle = null;
  let tagObserver = null;

  const root = createTag('main', { class: 'modal-content modal-library-gradient', 'daa-lh': 'library-gradient-modal' });

  /* ── Gradient preview (read-only, copyable handles) ── */
  const previewSection = createTag('section', { class: 'modal-palette-container' });
  const previewWrap = createTag('div', {
    class: 'modal-palette-colors modal-gradient-preview',
    role: 'region',
    'aria-label': interpolate(strings.librariesModalGradientAria, { count: colorStops.length }),
    tabindex: '-1',
  });
  const gradientData = {
    type: 'linear',
    angle,
    colorStops: colorStops.map((s, i) => ({ id: i, color: s.color, position: s.position })),
  };
  const gradientEditor = createGradientEditor(gradientData, {
    layout: 'responsive',
    size: 'strip-responsive',
    draggable: false,
    copyable: true,
    ariaLabel: interpolate(strings.librariesModalGradientAria, { count: colorStops.length }),
  });
  previewWrap.appendChild(gradientEditor.element);
  previewSection.appendChild(previewWrap);
  root.appendChild(previewSection);

  /* ── Stop rail (hex + copy) ── */
  const { railSection, railWrap, railAdapter } = createRailSection(
    { ...item, colors: stopColors },
    interpolate(strings.librariesModalGradientAria, { count: stopColors.length }),
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

  /* ── Dirty tracking (name + tags) ── */
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
      const payload = ccLibraryProvider.buildGradientPayload({
        name,
        angle,
        stops: colorStops,
        tags,
      });
      // updateTheme persists gradient data (tags/stops); name lives in element metadata.
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
      window.lana?.log(`Library gradient save failed: ${err?.message}`, {
        tags: 'color-libraries,gradient-modal', severity: 'error',
      });
      showToast({ variant: 'negative', message: strings.librariesModalSaveError });
      announceToScreenReader(strings.librariesModalSaveError);
    } finally {
      toolbarApi?.setSaving?.(false);
      refreshDirty();
    }
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
    api.on('delete', () => handleDelete());
    refreshDirty();
  }

  /* ── Toolbar (library variant, gradient — no Edit button) ── */
  const toolbarMount = createTag('nav', { class: 'modal-palette-toolbar', 'aria-label': strings.librariesModalGradientActionsAria });
  root.appendChild(toolbarMount);

  initToolbar(toolbarMount, {
    palette: {
      id: item?.id ?? '', name: item?.name ?? '', angle, colors: stopColors,
    },
    type: 'gradient',
    contentVariant: 'library',
    inModal: true,
    showPaletteName: true,
    editPaletteName: true,
    showEdit: false,
    libraryNameLabel: strings.librariesModalGradientName,
    item,
    toolHrefs,
    librariesStrings: strings,
  }).then((handle) => {
    toolbarHandle = handle;
    wireToolbar(handle?.toolbar);
  }).catch((error) => {
    window.lana?.log(`Library gradient modal toolbar init failed: ${error?.message}`, {
      tags: 'color-libraries,gradient-modal', severity: 'error',
    });
  });

  return {
    element: root,
    initNav: initTabIndexes,
    destroy: () => {
      tagObserver?.disconnect();
      tagObserver = null;
      gradientEditor?.destroy?.();
      railAdapter?.destroy?.();
      toolbarHandle?.destroy?.();
      toolbarHandle = null;
      toolbarApi = null;
    },
  };
}
