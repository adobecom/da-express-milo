import { createTag, getLibs, getMetadata } from '../../scripts/utils.js';
import { trackColorBlockLoad } from '../../scripts/instrument.js';
import {
  createLibrariesComponent,
  LIBRARY_SIZE,
  LIBRARY_VIEW,
} from '../../scripts/color-shared/components/libraries/createLibrariesComponent.js';
import { loadIconsRail, loadMenu, loadTooltip, loadButton, loadActionButton } from '../../scripts/color-shared/spectrum/load-spectrum.js';
import loadMiloStyle from '../../scripts/color-shared/utils/loadMiloStyle.js';
import loadColorLibrariesPlaceholders from '../../scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';
import { createSearchBar, createDeepLinkManager } from '../../scripts/color-shared/components/search-bar/index.js';
import { libraryGradientToModalGradient } from '../../scripts/color-shared/components/libraries/libraryDownloadUtils.js';
import { announceToScreenReader } from '../../scripts/color-shared/spectrum/utils/a11y.js';
import { ensureIms, serviceManager } from '../../libs/services/index.js';

const LIBRARIES_CSS = 'scripts/color-shared/components/libraries/libraries.css';
const STRIP_CSS = 'scripts/color-shared/components/strips/color-strip.css';
const GRADIENT_STRIP_CSS = 'scripts/color-shared/components/gradients/gradient-strip.css';

const CSS_CLASSES = {
  BLOCK: 'color-explore',
  CONTAINER: 'color-explore-container',
  LOADING: 'is-loading',
  SIGN_IN_HOST: 'color-libraries--signin',
  SIGN_IN_OVERLAY: 'color-libraries-signin-overlay',
  SIGN_IN_CARD: 'color-libraries-signin-card',
};

let componentInstance = null;
let searchBarInstance = null;
let resizeHandler = null;
let floatingSearchHandler = null;
let goBackHandler = null;
let deleteHandler = null;
let openHandler = null;
let updatedHandler = null;
let pageshowHandler = null;
let modalManagerInstance = null;
let ccLibraryProviderInstance = null;
// Tracks the open item modal's content so pageshowHandler can rebuild it.
let currentOpenItem = null;
let currentOpenLibraryId = null;

async function getCcLibraryProvider() {
  if (ccLibraryProviderInstance) return ccLibraryProviderInstance;
  try {
    if (!window.adobeIMS?.isSignedInUser()) return null;
    await serviceManager.init({ plugins: ['cclibrary'] });
    ccLibraryProviderInstance = await serviceManager.getProvider('cclibrary');
  } catch (err) {
    window.lana?.log(`color-libraries provider init failed: ${err?.message}`, {
      tags: 'color-libraries', severity: 'error',
    });
    ccLibraryProviderInstance = null;
  }
  return ccLibraryProviderInstance;
}

function interpolate(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? vars[key] : ''));
}

function getResponsiveSize() {
  if (typeof window === 'undefined') return LIBRARY_SIZE.L;
  const width = window.innerWidth;
  if (width < 680) return LIBRARY_SIZE.S;
  if (width < 1200) return LIBRARY_SIZE.M;
  return LIBRARY_SIZE.L;
}

function hasColorContent(library) {
  return (library.themeCount ?? 0) > 0
    || (library.gradientCount ?? 0) > 0
    || (library.items?.length ?? 0) > 0;
}

function getItemHexColors(item) {
  if (item.type === 'gradient') {
    return libraryGradientToModalGradient(item).colorStops
      .map((stop) => stop.color)
      .filter(Boolean);
  }
  return (item.colors || []).filter(Boolean);
}

function itemMatchesQuery(item, normalized, searchType) {
  if (searchType === 'tag') {
    return (item.tags || []).some((tag) => tag.toLowerCase().includes(normalized));
  }
  if (searchType === 'hex') {
    const target = normalized.replace(/^#/, '');
    return getItemHexColors(item)
      .some((hex) => hex.toLowerCase().replace(/^#/, '').includes(target));
  }
  return item.name?.toLowerCase().includes(normalized);
}

function filterLibraries(libraries, query, searchType = 'term') {
  const withContent = libraries.filter(hasColorContent);
  const normalized = query.trim().toLowerCase();
  if (!normalized) return withContent;

  return withContent
    .map((library) => {
      // Only a plain term search matches the library's own name; tag/hex are item-level.
      const nameMatch = searchType === 'term'
        && library.name?.toLowerCase().includes(normalized);
      const matchedItems = (library.items || []).filter(
        (item) => itemMatchesQuery(item, normalized, searchType),
      );

      if (nameMatch) {
        return { ...library, expanded: true };
      }
      if (matchedItems.length === 0) return null;

      return {
        ...library,
        items: matchedItems,
        themeCount: matchedItems.filter((i) => i.type === 'theme').length,
        gradientCount: matchedItems.filter((i) => i.type === 'gradient').length,
        expanded: true,
      };
    })
    .filter(Boolean);
}

// Libraries owns its empty-search view, so it only signals "results found" to keep
// any sibling color-search-marquee empty-result text cleared (never empty-result).
function notifyResultsFound() {
  document.dispatchEvent(new CustomEvent('color-explore:results-found', { bubbles: true }));
}

function clearSearchUrl() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('q')) {
      url.searchParams.delete('q');
      window.history.replaceState({}, '', url);
    }
  } catch (e) {
    // no-op: URL update is best-effort
  }
}

async function renderLibraries(block, searchQuery, strings = {}, searchType = 'term') {
  const { fetchLibrariesWithElements } = await import('../../scripts/color-shared/services/createLibrariesDataService.js');
  const allLibraries = await fetchLibrariesWithElements();
  // Count reflects the total saved libraries with content (not the filtered subset).
  componentInstance.setCount(allLibraries.filter(hasColorContent).length);
  const filtered = filterLibraries(allLibraries, searchQuery, searchType);
  const isSearch = Boolean(searchQuery);
  notifyResultsFound();

  if (isSearch && filtered.length === 0) {
    componentInstance.setLibraries([]);
    componentInstance.setView(LIBRARY_VIEW.EMPTY, { query: searchQuery });
    announceToScreenReader(interpolate(strings.librariesEmptyHeading, { query: searchQuery }));
  } else if (!isSearch && filtered.length === 0) {
    componentInstance.setLibraries([]);
    componentInstance.setView(LIBRARY_VIEW.NO_CONTENT);
    announceToScreenReader(strings.librariesNoContentHeading);
  } else {
    componentInstance.setLibraries(filtered);
    componentInstance.setView(isSearch ? LIBRARY_VIEW.SEARCH_RESULT : LIBRARY_VIEW.LIBRARY);
    if (isSearch) {
      const template = filtered.length === 1
        ? strings.librariesSearchResult
        : strings.librariesSearchResults;
      announceToScreenReader(interpolate(template, { count: filtered.length, query: searchQuery }));
    }
  }
  block.classList.remove(CSS_CLASSES.LOADING);
  return allLibraries;
}

function showLoadError(block, message) {
  block.classList.remove(CSS_CLASSES.LOADING);
  block.appendChild(createTag('p', { class: 'color-libraries-error', role: 'alert' }, message));
  announceToScreenReader(message, 'assertive');
}

export default async function decorate(block) {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  if (floatingSearchHandler) {
    document.removeEventListener('floating-search:submit', floatingSearchHandler);
    floatingSearchHandler = null;
  }
  if (goBackHandler) {
    block.removeEventListener('libraries:empty-go-back', goBackHandler);
    block.removeEventListener('libraries:reset-search', goBackHandler);
    goBackHandler = null;
  }
  if (deleteHandler) {
    document.removeEventListener('libraries:item-delete', deleteHandler);
    deleteHandler = null;
  }
  if (openHandler) {
    block.removeEventListener('libraries:item-open', openHandler);
    openHandler = null;
  }
  if (updatedHandler) {
    document.removeEventListener('libraries:item-updated', updatedHandler);
    updatedHandler = null;
  }
  if (pageshowHandler) {
    window.removeEventListener('pageshow', pageshowHandler);
    pageshowHandler = null;
  }
  modalManagerInstance?.destroy?.();
  modalManagerInstance = null;
  ccLibraryProviderInstance = null;
  currentOpenItem = null;
  currentOpenLibraryId = null;

  componentInstance?.destroy();
  componentInstance = null;
  searchBarInstance?.destroy();
  searchBarInstance = null;

  block.innerHTML = '';
  block.className = `${CSS_CLASSES.BLOCK} color-explore--libraries ${CSS_CLASSES.LOADING}`;

  const placeholders = await loadColorLibrariesPlaceholders();

  const toolHrefs = {
    contrast: '/create/color-contrast-analyzer',
    colorBlindness: '/create/color-accessibility',
    colorWheel: '/create/color-wheel',
  };

  await Promise.all([
    loadMiloStyle(LIBRARIES_CSS),
    loadMiloStyle(STRIP_CSS),
    loadMiloStyle(GRADIENT_STRIP_CSS),
    loadIconsRail(),
    loadMenu(),
    // Registers sp-button so the empty-search "go back to libraries" CTA upgrades.
    loadButton(),
    // Registers sp-action-button used by the card action buttons + menu triggers.
    loadActionButton(),
    // Registers sp-overlay-trigger/sp-tooltip so the palette name tooltip
    // behaves as a hover overlay (same as the Explore page) instead of
    // rendering inline as a label.
    loadTooltip(),
  ]);

  // IMS loads asynchronously; wait for the SDK before reading auth state,
  // otherwise window.adobeIMS is undefined here and signed-in users get gated.
  let isSignedIn = false;
  try {
    const ims = await ensureIms();
    isSignedIn = Boolean(ims?.isSignedInUser?.());
  } catch (err) {
    window.lana?.log(`color-libraries IMS not ready: ${err?.message}`, {
      tags: 'color-libraries',
      severity: 'info',
    });
  }

  const themeHost = createTag('sp-theme', {
    system: 'spectrum-two',
    color: 'light',
    scale: 'medium',
  });
  block.appendChild(themeHost);

  const container = createTag('div', { class: CSS_CLASSES.CONTAINER });
  themeHost.appendChild(container);

  if (!isSignedIn) {
    const { setSusiColorRedirect, buildLibrariesSignInRedirectUrl } = await import(
      '../../scripts/color-shared/utils/susiRedirect.js'
    );
    setSusiColorRedirect(buildLibrariesSignInRedirectUrl());

    // Render the libraries page chrome (search header + skeleton grid) behind the
    // sign-in overlay so the page matches the Figma layout instead of appearing
    // blank. The search bar is non-interactive here — the overlay sits on top.
    // The global page footer is Milo-rendered and already present.
    searchBarInstance = await createSearchBar(
      {
        placeholder: placeholders.librariesSearchPlaceholder,
        enableSuggestions: false,
        enableAutocomplete: false,
        enableStickyBehavior: false,
      },
      { onSubmit: () => {}, onClear: () => {} },
    );
    componentInstance = createLibrariesComponent({
      size: getResponsiveSize(),
      view: LIBRARY_VIEW.LOADING,
      strings: placeholders,
      searchBarEl: searchBarInstance.element,
      toolHrefs,
      emit() {},
    });
    container.appendChild(componentInstance.element);

    resizeHandler = () => {
      componentInstance?.setSize?.(getResponsiveSize());
    };
    window.addEventListener('resize', resizeHandler);

    block.classList.remove(CSS_CLASSES.LOADING);

    // Render the sign-in popup INLINE inside the block (not the shared full-screen
    // milo modal, which is fixed at the body level and dims the whole viewport).
    // The authored `susi-target` fragment is loaded via milo's fragment loader so
    // the SUSI card keeps its authored content, while the overlay + backdrop stay
    // within the block's area — the page nav and footer remain visible, per Figma.
    const [susiPath] = (getMetadata('susi-target') || '').split('#');
    if (susiPath) {
      // Fill the viewport below the header so the sign-in region isn't cropped.
      block.classList.add(CSS_CLASSES.SIGN_IN_HOST);
      const overlay = createTag('div', { class: CSS_CLASSES.SIGN_IN_OVERLAY });
      const card = createTag('div', { class: CSS_CLASSES.SIGN_IN_CARD });
      const fragmentAnchor = createTag('a', { href: susiPath });
      card.appendChild(fragmentAnchor);
      overlay.appendChild(card);
      block.appendChild(overlay);

      // Sign-in gate: tapping the backdrop (outside the card) must never dismiss
      // the SUSI popup — swallow those clicks so nothing behind reacts.
      overlay.addEventListener('click', (e) => {
        if (!card.contains(e.target)) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
      try {
        const { default: getFragment } = await import(`${getLibs()}/blocks/fragment/fragment.js`);
        await getFragment(fragmentAnchor);
      } catch (err) {
        window.lana?.log(`color-libraries sign-in overlay failed: ${err?.message}`, {
          tags: 'color-libraries',
          severity: 'error',
        });
      }
    }

    trackColorBlockLoad('color-libraries');
    return;
  }

  // Prefetch the swatch-rail i18n only for signed-in users (signed-out visitors
  // return above and never open an item). openHandler awaits this.
  const colorSwatchRailStringsPromise = import('../../scripts/color-shared/i18n/loadColorSwatchRailPlaceholders.js').then((m) => m.default());

  const deepLinkManager = createDeepLinkManager({ enabled: true, queryParam: 'q' });
  let searchQuery = new URLSearchParams(window.location.search).get('q') || '';
  // Term/Tag/Hex, set from the selected suggestion; deep-linked queries default to term.
  let currentSearchType = 'term';

  searchBarInstance = await createSearchBar(
    {
      placeholder: placeholders.librariesSearchPlaceholder,
      enableSuggestions: true,
      enableAutocomplete: true,
      enableStickyBehavior: false,
      // Term/Tag/Hex dropdown, matching the Explore page.
      suggestionsConfig: {
        maxItems: 3,
        showHeader: false,
      },
      autocompleteConfig: {
        throttleDelay: 300,
        debounceDelay: 500,
        minLength: 2,
      },
    },
    {
      onSubmit: ({ query, suggestion }) => {
        deepLinkManager.updateUrl(query);
        document.dispatchEvent(new CustomEvent('floating-search:submit', {
          detail: { query, searchType: suggestion?.type },
          bubbles: true,
        }));
      },
      onClear: () => {
        deepLinkManager.clearUrl();
        document.dispatchEvent(new CustomEvent('floating-search:clear', { bubbles: true }));
        document.dispatchEvent(new CustomEvent('floating-search:submit', {
          detail: { query: '' },
          bubbles: true,
        }));
      },
    },
  );

  componentInstance = createLibrariesComponent({
    size: getResponsiveSize(),
    view: LIBRARY_VIEW.LOADING,
    strings: placeholders,
    searchBarEl: searchBarInstance.element,
    toolHrefs,
    emit(event, detail) {
      block.dispatchEvent(new CustomEvent(`libraries:${event}`, { detail, bubbles: true }));
    },
  });

  container.appendChild(componentInstance.element);
  if (searchQuery) searchBarInstance.setQuery(searchQuery);

  resizeHandler = () => {
    componentInstance?.setSize?.(getResponsiveSize());
  };
  window.addEventListener('resize', resizeHandler);

  const runSearch = async (query, searchType = 'term') => {
    block.classList.add(CSS_CLASSES.LOADING);
    searchQuery = query || '';
    currentSearchType = searchType || 'term';
    try {
      return await renderLibraries(block, searchQuery, placeholders, currentSearchType);
    } catch (err) {
      window.lana?.log(`color-libraries search failed: ${err?.message}`, {
        tags: 'color-libraries',
        severity: 'error',
      });
      block.classList.remove(CSS_CLASSES.LOADING);
      return null;
    }
  };

  floatingSearchHandler = (e) => runSearch(
    e.detail?.query || '',
    e.detail?.searchType || e.detail?.suggestion?.type,
  );
  document.addEventListener('floating-search:submit', floatingSearchHandler);

  goBackHandler = () => {
    clearSearchUrl();
    searchBarInstance?.setQuery('');
    document.dispatchEvent(new CustomEvent('floating-search:clear', { bubbles: true }));
    runSearch('');
  };
  block.addEventListener('libraries:empty-go-back', goBackHandler);
  block.addEventListener('libraries:reset-search', goBackHandler);

  deleteHandler = async (event) => {
    const { item, libraryId } = event.detail || {};
    const itemId = item?.id;
    if (!libraryId || !itemId) return;

    const { showLibraryDeleteAlertDialog } = await import('../../scripts/color-shared/components/libraries/createLibraryDeleteAlertDialog.js');
    const confirmed = await showLibraryDeleteAlertDialog({ item, strings: placeholders });
    if (!confirmed) return;

    // The delete may have originated from the item modal (mounted on document.body).
    // The modal stays open while the confirm dialog is shown; close it now that the
    // user confirmed so it doesn't linger over a deleted item. Card deletes have no
    // open modal, so this is a no-op for them.
    if (modalManagerInstance?.isOpen?.()) modalManagerInstance.close();

    const itemName = item?.name || placeholders.librariesDefaultName || '';
    block.classList.add(CSS_CLASSES.LOADING);

    const [
      { deleteLibraryItem, restoreLibraryItem },
      { showExpressToast },
    ] = await Promise.all([
      import('../../scripts/color-shared/services/createLibrariesDataService.js'),
      import('../../scripts/color-shared/spectrum/components/express-toast.js'),
    ]);

    const undoDelete = async () => {
      block.classList.add(CSS_CLASSES.LOADING);
      try {
        await restoreLibraryItem(libraryId, item);
        await renderLibraries(block, searchQuery, placeholders, currentSearchType);
        showExpressToast({
          variant: 'positive',
          message: interpolate(placeholders.librariesRestoreSuccess, { name: itemName }),
        });
      } catch (err) {
        window.lana?.log(`color-libraries undo delete failed: ${err?.message}`, {
          tags: 'color-libraries',
          severity: 'error',
        });
        block.classList.remove(CSS_CLASSES.LOADING);
        showExpressToast({
          variant: 'negative',
          message: placeholders.librariesRestoreError,
        });
      }
    };

    try {
      await deleteLibraryItem(libraryId, itemId);
      const toast = await showExpressToast({
        variant: 'positive',
        message: interpolate(placeholders.librariesDeleteSuccess, { name: itemName }),
        action: {
          label: placeholders.librariesUndo,
          onClick: () => {
            toast?.close?.();
            undoDelete();
          },
        },
      });
      await renderLibraries(block, searchQuery, placeholders, currentSearchType);
    } catch (err) {
      window.lana?.log(`color-libraries delete failed: ${err?.message}`, {
        tags: 'color-libraries',
        severity: 'error',
      });
      block.classList.remove(CSS_CLASSES.LOADING);
      showExpressToast({
        variant: 'negative',
        message: placeholders.librariesDeleteError,
      });
    }
  };
  // Card deletes bubble block → document; modal deletes originate from the modal
  // mounted on document.body (never inside block). Listen on document so both paths
  // are handled (once each), matching the libraries:item-updated handler below.
  document.addEventListener('libraries:item-delete', deleteHandler);

  openHandler = async (event) => {
    const { item, libraryId } = event.detail || {};
    if (!item) return;
    currentOpenItem = item;
    currentOpenLibraryId = libraryId;

    if (!modalManagerInstance) {
      const { createModalManager } = await import('../../scripts/color-shared/modal/createModalManager.js');
      modalManagerInstance = createModalManager();
    }

    const [
      { openLibraryItemModal },
      colorSwatchRailStrings,
      ccLibraryProvider,
    ] = await Promise.all([
      import('../../scripts/color-shared/components/libraries/openLibraryItemModal.js'),
      colorSwatchRailStringsPromise,
      getCcLibraryProvider(),
    ]);

    await openLibraryItemModal(item, modalManagerInstance, {
      colorSwatchRailStrings,
      librariesStrings: placeholders,
      libraryId,
      ccLibraryProvider,
      toolHrefs,
    });
  };
  block.addEventListener('libraries:item-open', openHandler);

  // Modal mounts on document.body, so its item-updated event reaches document, not block.
  updatedHandler = () => {
    renderLibraries(block, searchQuery, placeholders, currentSearchType).catch((err) => {
      window.lana?.log(`color-libraries refresh after update failed: ${err?.message}`, {
        tags: 'color-libraries', severity: 'error',
      });
    });
  };
  document.addEventListener('libraries:item-updated', updatedHandler);

  // Bfcache restore after a color-tool save: refresh the grid, and rebuild an
  // open item modal with fresh data since its content was frozen in bfcache too.
  pageshowHandler = async (event) => {
    if (!event.persisted) return;

    const reopenItem = modalManagerInstance?.isOpen?.() ? currentOpenItem : null;
    const reopenLibraryId = currentOpenLibraryId;

    const allLibraries = await runSearch(searchQuery, currentSearchType);
    if (!reopenItem) return;

    modalManagerInstance.close();
    // close() clears content on a 300ms timer; wait it out before reopening.
    await new Promise((resolve) => { setTimeout(resolve, 320); });

    const freshLibrary = allLibraries?.find((lib) => lib.id === reopenLibraryId);
    const freshItem = freshLibrary?.items?.find((it) => it.id === reopenItem.id);
    if (!freshItem) return;

    const [
      { openLibraryItemModal },
      colorSwatchRailStrings,
      ccLibraryProvider,
    ] = await Promise.all([
      import('../../scripts/color-shared/components/libraries/openLibraryItemModal.js'),
      colorSwatchRailStringsPromise,
      getCcLibraryProvider(),
    ]);

    await openLibraryItemModal(freshItem, modalManagerInstance, {
      colorSwatchRailStrings,
      librariesStrings: placeholders,
      libraryId: reopenLibraryId,
      ccLibraryProvider,
      toolHrefs,
    });
    currentOpenItem = freshItem;
  };
  window.addEventListener('pageshow', pageshowHandler);

  try {
    await renderLibraries(block, searchQuery, placeholders);
  } catch (err) {
    window.lana?.log(`color-libraries load failed: ${err?.message}`, {
      tags: 'color-libraries',
      severity: 'error',
    });
    componentInstance.destroy();
    componentInstance = null;
    showLoadError(block, placeholders.blockError || 'Unable to load your libraries. Please refresh and try again.');
  }

  trackColorBlockLoad('color-libraries');
}
