import { createTag } from '../../scripts/utils.js';
import { trackColorBlockLoad } from '../../scripts/instrument.js';
import {
  createLibrariesComponent,
  LIBRARY_SIZE,
  LIBRARY_VIEW,
} from '../../scripts/color-shared/components/libraries/createLibrariesComponent.js';
import { fetchLibrariesWithElements, deleteLibraryItem } from '../../scripts/color-shared/services/createLibrariesDataService.js';
import { showLibraryDeleteAlertDialog } from '../../scripts/color-shared/components/libraries/createLibraryDeleteAlertDialog.js';
import { openLibraryItemModal } from '../../scripts/color-shared/components/libraries/openLibraryItemModal.js';
import { createModalManager } from '../../scripts/color-shared/modal/createModalManager.js';
import loadColorModalPlaceholders from '../../scripts/color-shared/i18n/loadColorModalPlaceholders.js';
import loadColorSwatchRailPlaceholders from '../../scripts/color-shared/i18n/loadColorSwatchRailPlaceholders.js';
import loadColorExplorePlaceholders from '../../scripts/color-shared/i18n/loadColorExplorePlaceholders.js';
import { loadIconsRail, loadMenu, loadTooltip } from '../../scripts/color-shared/spectrum/load-spectrum.js';
import { showExpressToast } from '../../scripts/color-shared/spectrum/components/express-toast.js';
import loadMiloStyle from '../../scripts/color-shared/utils/loadMiloStyle.js';
import loadColorLibrariesPlaceholders from '../../scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';
import { createSearchBar, createDeepLinkManager } from '../../scripts/color-shared/components/search-bar/index.js';
import { decorateAnalyticsAttributes } from '../../scripts/color-shared/utils/utilities.js';
import { announceToScreenReader } from '../../scripts/color-shared/spectrum/utils/a11y.js';
import { ensureIms } from '../../libs/services/index.js';
import { triggerSignInFlow } from '../../libs/services/middlewares/auth.middleware.js';

const LIBRARIES_CSS = 'scripts/color-shared/components/libraries/libraries.css';
const STRIP_CSS = 'scripts/color-shared/components/strips/color-strip.css';
const GRADIENT_STRIP_CSS = 'scripts/color-shared/components/gradients/gradient-strip.css';

const CSS_CLASSES = {
  BLOCK: 'color-explore',
  CONTAINER: 'color-explore-container',
  LOADING: 'is-loading',
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
  const colorModalStringsPromise = loadColorModalPlaceholders();
  const colorSwatchRailStringsPromise = loadColorSwatchRailPlaceholders();
  const explorePlaceholdersPromise = loadColorExplorePlaceholders();

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
    block.classList.remove(CSS_CLASSES.LOADING);
    const signInLink = createTag('button', {
      type: 'button',
      class: 'color-libraries-sign-in__link',
    }, placeholders.librariesSignIn);
    decorateAnalyticsAttributes(signInLink, { linkLabel: 'Sign in to libraries' });
    signInLink.addEventListener('click', async () => {
      const { setSusiColorRedirect, buildLibrariesSignInRedirectUrl } = await import(
        '../../scripts/color-shared/utils/susiRedirect.js'
      );
      setSusiColorRedirect(buildLibrariesSignInRedirectUrl());
      await triggerSignInFlow();
    });

    container.appendChild(createTag('p', { class: 'color-libraries-sign-in' }, signInLink));
    announceToScreenReader(placeholders.librariesSignIn);
    trackColorBlockLoad('color-libraries');
    return;
  }

  modalManagerInstance = createModalManager();

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

    const confirmed = await showLibraryDeleteAlertDialog({ item, strings: placeholders });
    if (!confirmed) return;

    const itemName = item?.name || placeholders.librariesDefaultName || '';
    block.classList.add(CSS_CLASSES.LOADING);

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

    const [modalStrings, colorSwatchRailStrings, explorePlaceholders] = await Promise.all([
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
