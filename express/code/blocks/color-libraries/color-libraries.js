import { createTag, getLibs, getMetadata } from '../../scripts/utils.js';
import { trackColorBlockLoad } from '../../scripts/instrument.js';
import {
  createLibrariesComponent,
  LIBRARY_SIZE,
  LIBRARY_VIEW,
} from '../../scripts/color-shared/components/libraries/createLibrariesComponent.js';
import { loadIconsRail, loadMenu, loadTooltip, loadButton } from '../../scripts/color-shared/spectrum/load-spectrum.js';
import loadMiloStyle from '../../scripts/color-shared/utils/loadMiloStyle.js';
import loadColorLibrariesPlaceholders from '../../scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';
import { createSearchBar, createDeepLinkManager } from '../../scripts/color-shared/components/search-bar/index.js';
import { announceToScreenReader } from '../../scripts/color-shared/spectrum/utils/a11y.js';
import { ensureIms } from '../../libs/services/index.js';

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
let modalManagerInstance = null;

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

function filterLibraries(libraries, query) {
  const withContent = libraries.filter(hasColorContent);
  const normalized = query.trim().toLowerCase();
  if (!normalized) return withContent;

  return withContent
    .map((library) => {
      const nameMatch = library.name?.toLowerCase().includes(normalized);
      const matchedItems = (library.items || []).filter(
        (item) => item.name?.toLowerCase().includes(normalized),
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

async function renderLibraries(block, searchQuery, strings = {}) {
  const { fetchLibrariesWithElements } = await import('../../scripts/color-shared/services/createLibrariesDataService.js');
  const allLibraries = await fetchLibrariesWithElements();
  // Count reflects the total saved libraries with content (not the filtered subset).
  componentInstance.setCount(allLibraries.filter(hasColorContent).length);
  const filtered = filterLibraries(allLibraries, searchQuery);
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
    goBackHandler = null;
  }
  if (deleteHandler) {
    block.removeEventListener('libraries:item-delete', deleteHandler);
    deleteHandler = null;
  }
  if (openHandler) {
    block.removeEventListener('libraries:item-open', openHandler);
    openHandler = null;
  }
  modalManagerInstance?.destroy?.();
  modalManagerInstance = null;

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

  // Prefetch the modal/swatch/explore i18n only for signed-in users (signed-out
  // visitors return above and never open an item). openHandler awaits these.
  const colorModalStringsPromise = import('../../scripts/color-shared/i18n/loadColorModalPlaceholders.js').then((m) => m.default());
  const colorSwatchRailStringsPromise = import('../../scripts/color-shared/i18n/loadColorSwatchRailPlaceholders.js').then((m) => m.default());
  const explorePlaceholdersPromise = import('../../scripts/color-shared/i18n/loadColorExplorePlaceholders.js').then((m) => m.default());

  const deepLinkManager = createDeepLinkManager({ enabled: true, queryParam: 'q' });
  let searchQuery = new URLSearchParams(window.location.search).get('q') || '';

  searchBarInstance = await createSearchBar(
    {
      placeholder: placeholders.librariesSearchPlaceholder,
      enableSuggestions: false,
      enableAutocomplete: false,
      enableStickyBehavior: false,
    },
    {
      onSubmit: ({ query }) => {
        deepLinkManager.updateUrl(query);
        document.dispatchEvent(new CustomEvent('floating-search:submit', {
          detail: { query },
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

  const runSearch = async (query) => {
    block.classList.add(CSS_CLASSES.LOADING);
    searchQuery = query || '';
    try {
      await renderLibraries(block, searchQuery, placeholders);
    } catch (err) {
      window.lana?.log(`color-libraries search failed: ${err?.message}`, {
        tags: 'color-libraries',
        severity: 'error',
      });
      block.classList.remove(CSS_CLASSES.LOADING);
    }
  };

  floatingSearchHandler = (e) => runSearch(e.detail?.query || '');
  document.addEventListener('floating-search:submit', floatingSearchHandler);

  goBackHandler = () => {
    clearSearchUrl();
    searchBarInstance?.setQuery('');
    document.dispatchEvent(new CustomEvent('floating-search:clear', { bubbles: true }));
    runSearch('');
  };
  block.addEventListener('libraries:empty-go-back', goBackHandler);

  deleteHandler = async (event) => {
    const { item, libraryId } = event.detail || {};
    const itemId = item?.id;
    if (!libraryId || !itemId) return;

    const { showLibraryDeleteAlertDialog } = await import('../../scripts/color-shared/components/libraries/createLibraryDeleteAlertDialog.js');
    const confirmed = await showLibraryDeleteAlertDialog({ item, strings: placeholders });
    if (!confirmed) return;

    const itemName = item?.name || placeholders.librariesDefaultName || '';
    block.classList.add(CSS_CLASSES.LOADING);

    const [{ deleteLibraryItem }, { showExpressToast }] = await Promise.all([
      import('../../scripts/color-shared/services/createLibrariesDataService.js'),
      import('../../scripts/color-shared/spectrum/components/express-toast.js'),
    ]);

    try {
      await deleteLibraryItem(libraryId, itemId);
      showExpressToast({
        variant: 'positive',
        message: interpolate(placeholders.librariesDeleteSuccess, { name: itemName }),
      });
      await renderLibraries(block, searchQuery, placeholders);
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
  block.addEventListener('libraries:item-delete', deleteHandler);

  openHandler = async (event) => {
    const { item } = event.detail || {};
    if (!item) return;

    if (!modalManagerInstance) {
      const { createModalManager } = await import('../../scripts/color-shared/modal/createModalManager.js');
      modalManagerInstance = createModalManager();
    }

    const [
      { openLibraryItemModal },
      modalStrings,
      colorSwatchRailStrings,
      explorePlaceholders,
    ] = await Promise.all([
      import('../../scripts/color-shared/components/libraries/openLibraryItemModal.js'),
      colorModalStringsPromise,
      colorSwatchRailStringsPromise,
      explorePlaceholdersPromise,
    ]);

    await openLibraryItemModal(item, modalManagerInstance, {
      modalStrings,
      colorSwatchRailStrings,
      fallbackPaletteTitle: explorePlaceholders.modalDefaultPaletteTitle,
      fallbackGradientTitle: explorePlaceholders.modalDefaultGradientTitle,
    });
  };
  block.addEventListener('libraries:item-open', openHandler);

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
