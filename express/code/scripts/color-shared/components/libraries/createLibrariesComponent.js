import { createTag } from '../../../utils.js';
import { createLibraryAccordion } from './createLibraryAccordion.js';
import { createLibrariesHeader, LIBRARY_SORT } from './createLibrariesHeader.js';
import { getSizeClass } from './libraryUtils.js';
import { createEmptySearchIcon } from './libraryIcons.js';
import { decorateAnalyticsAttributes } from '../../utils/utilities.js';

export const LIBRARY_VIEW = {
  LIBRARY: 'library',
  SEARCH_RESULT: 'search-result',
  EMPTY: 'empty',
  LOADING: 'loading',
};

export const LIBRARY_SIZE = {
  L: 'l',
  M: 'm',
  S: 's',
};

const LOADING_SKELETON_CARDS = 6;

function interpolate(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? vars[key] : ''));
}

/**
 * Sort the libraries array in place to match the active sort control.
 *   - NAME: case-insensitive A→Z by library name.
 *   - LAST_MODIFIED: restore the order the API returned (it already sorts by
 *     `-modified_date`), captured as `apiOrder` when the libraries were received.
 */
function sortLibrariesInPlace(libraries, sortKey) {
  if (sortKey === LIBRARY_SORT.NAME) {
    libraries.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
    return;
  }
  libraries.sort((a, b) => (a.apiOrder ?? 0) - (b.apiOrder ?? 0));
}

function createLoadingState() {
  // Skeleton is purely decorative: aria-busy signals the loading state while
  // aria-hidden keeps the shimmer placeholders out of the a11y tree.
  const state = createTag('div', { class: 'ax-lib-loading', 'aria-busy': 'true', 'aria-hidden': 'true' });

  const headerRow = createTag('div', { class: 'ax-lib-loading-header' });
  const headerRight = createTag('div', { class: 'ax-lib-loading-header__right' });
  headerRight.append(
    createTag('div', { class: 'ax-lib-loading-bar ax-lib-loading-bar--count ax-lib-loading-shimmer' }),
    createTag('div', { class: 'ax-lib-loading-chevron ax-lib-loading-shimmer' }),
  );
  headerRow.append(
    createTag('div', { class: 'ax-lib-loading-bar ax-lib-loading-bar--title ax-lib-loading-shimmer' }),
    headerRight,
  );
  state.appendChild(headerRow);

  const grid = createTag('div', { class: 'palettes-grid ax-lib-items-grid ax-lib-loading-grid' });
  for (let i = 0; i < LOADING_SKELETON_CARDS; i += 1) {
    const card = createTag('div', { class: 'ax-lib-loading-card' });
    const visual = createTag('div', { class: 'ax-lib-loading-card__visual ax-lib-loading-shimmer' });
    const footer = createTag('div', { class: 'ax-lib-loading-card__footer' });
    const lines = createTag('div', { class: 'ax-lib-loading-card__lines' });
    lines.append(
      createTag('div', { class: 'ax-lib-loading-bar ax-lib-loading-bar--name ax-lib-loading-shimmer' }),
      createTag('div', { class: 'ax-lib-loading-bar ax-lib-loading-bar--detail ax-lib-loading-shimmer' }),
    );
    const dots = createTag('div', { class: 'ax-lib-loading-card__dots' });
    for (let d = 0; d < 5; d += 1) {
      dots.appendChild(createTag('span', { class: 'ax-lib-loading-dot ax-lib-loading-shimmer' }));
    }
    footer.append(lines, dots);
    card.append(visual, footer);
    grid.appendChild(card);
  }
  state.appendChild(grid);

  return state;
}

function createExpandCollapseControl(onExpandAll, onCollapseAll, strings) {
  const bar = createTag('div', { class: 'ax-lib-expand-bar' });
  const actions = createTag('div', { class: 'ax-lib-expand-actions' });

  const expandBtn = createTag('button', {
    type: 'button',
    class: 'ax-lib-expand-btn',
  }, strings.librariesExpandAll);
  const divider = createTag('span', { class: 'ax-lib-expand-divider', 'aria-hidden': 'true' });
  const collapseBtn = createTag('button', {
    type: 'button',
    class: 'ax-lib-expand-btn',
  }, strings.librariesCollapseAll);

  decorateAnalyticsAttributes(expandBtn, { linkLabel: strings.librariesExpandAll });
  decorateAnalyticsAttributes(collapseBtn, { linkLabel: strings.librariesCollapseAll });
  expandBtn.addEventListener('click', () => onExpandAll?.());
  collapseBtn.addEventListener('click', () => onCollapseAll?.());

  actions.append(expandBtn, divider, collapseBtn);
  bar.appendChild(actions);
  return bar;
}

function createEmptyState(query, strings, emit) {
  const wrapper = createTag('div', { class: 'ax-lib-empty', role: 'status' });
  wrapper.appendChild(createEmptySearchIcon());

  const heading = createTag('p', { class: 'ax-lib-empty__heading' });
  heading.textContent = interpolate(strings.librariesEmptyHeading, { query });
  const description = createTag('p', { class: 'ax-lib-empty__description' });
  description.textContent = strings.librariesEmptyDescription;

  const goBack = createTag('button', {
    type: 'button',
    class: 'ax-lib-empty__cta',
  }, strings.librariesGoBack);
  decorateAnalyticsAttributes(goBack, { linkLabel: strings.librariesGoBack });
  goBack.addEventListener('click', () => emit('empty-go-back'));

  wrapper.append(heading, description, goBack);
  return wrapper;
}

/**
 * @param {Object} [options]
 * @param {'l'|'m'|'s'} [options.size='l']
 * @param {string} [options.view='library']
 * @param {Array} [options.libraries=[]]
 * @param {Object} [options.strings] - resolved placeholders
 * @param {Function} [options.emit]
 * @param {Object} [options.toolHrefs] - { contrast, colorBlindness, colorWheel }
 */
export function createLibrariesComponent(options = {}) {
  const {
    size: initialSize = LIBRARY_SIZE.L,
    view: initialView = LIBRARY_VIEW.LIBRARY,
    libraries = [],
    strings = {},
    emit = () => {},
    searchBarEl = null,
    initialSort,
    toolHrefs = {},
  } = options;

  let view = initialView;
  let size = initialSize;
  let emptyQuery = '';
  let sizeClass = getSizeClass(size);
  let currentSort = Object.values(LIBRARY_SORT).includes(initialSort)
    ? initialSort
    : LIBRARY_SORT.LAST_MODIFIED;
  const expandedState = new Map(libraries.map((lib) => [lib.id, Boolean(lib.expanded)]));
  const accordionInstances = new Map();

  // Stamp the order the API delivered (already newest-first by modified_date) so
  // the LAST_MODIFIED sort can restore it without an actual timestamp.
  function captureApiOrder() {
    libraries.forEach((lib, index) => { lib.apiOrder = index; });
  }
  captureApiOrder();

  // The header emits `sort-change`; sorting lives here because this owns the
  // libraries array and the render. Re-sort + re-render, then forward the event
  // so the block can still react (analytics, etc.).
  function handleHeaderEmit(event, detail) {
    if (event === 'sort-change') {
      if (Object.values(LIBRARY_SORT).includes(detail?.key)) currentSort = detail.key;
      render();
    }
    emit(event, detail);
  }

  const container = createTag('section', {
    class: [
      'ax-libraries',
      `ax-libraries--size-${sizeClass}`,
      `ax-libraries--view-${view}`,
    ].join(' '),
  });

  const list = createTag('div', { class: 'ax-libraries-list' });

  // Built once so the live search bar keeps its listeners across view re-renders.
  const header = createLibrariesHeader({
    strings,
    searchBarEl,
    emit: handleHeaderEmit,
    initialSort: currentSort,
  });

  function applyDefaultExpansion() {
    if (view !== LIBRARY_VIEW.LIBRARY || libraries.length === 0) return;
    const anyExpanded = libraries.some((lib) => expandedState.get(lib.id));
    if (!anyExpanded) expandedState.set(libraries[0].id, true);
  }

  function renderLibraryList() {
    list.replaceChildren();
    accordionInstances.clear();

    libraries.forEach((library) => {
      const expanded = expandedState.get(library.id) ?? false;
      const instance = createLibraryAccordion(library, {
        size,
        expanded,
        searchResult: view === LIBRARY_VIEW.SEARCH_RESULT,
        strings,
        onToggle: (id) => {
          const next = !expandedState.get(id);
          expandedState.set(id, next);
          accordionInstances.get(id)?.setExpanded(next);
          emit('accordion-toggle', { id, expanded: next });
        },
        emit,
        toolHrefs,
      });
      accordionInstances.set(library.id, instance);
      list.appendChild(instance.element);
    });
  }

  function expandAll() {
    libraries.forEach((lib) => {
      expandedState.set(lib.id, true);
      accordionInstances.get(lib.id)?.setExpanded(true);
    });
    emit('expand-all');
  }

  function collapseAll() {
    libraries.forEach((lib) => {
      expandedState.set(lib.id, false);
      accordionInstances.get(lib.id)?.setExpanded(false);
    });
    emit('collapse-all');
  }

  function render() {
    container.className = [
      'ax-libraries',
      `ax-libraries--size-${sizeClass}`,
      `ax-libraries--view-${view}`,
    ].join(' ');
    container.replaceChildren();
    // Header (count + search + sort) is persistent across every view.
    container.appendChild(header.element);

    // Order reflects the active sort before any view-specific rendering (so the
    // default-expanded first library is the first in sorted order too).
    sortLibrariesInPlace(libraries, currentSort);

    if (view === LIBRARY_VIEW.LOADING) {
      container.appendChild(createLoadingState());
      return;
    }

    if (view === LIBRARY_VIEW.EMPTY) {
      container.appendChild(createEmptyState(emptyQuery, strings, emit));
      return;
    }

    const summary = createTag('div', { class: 'ax-libraries-summary' });

    if (view === LIBRARY_VIEW.LIBRARY) {
      applyDefaultExpansion();
      if (libraries.length > 1) {
        summary.appendChild(createExpandCollapseControl(expandAll, collapseAll, strings));
      }
    }

    renderLibraryList();
    summary.appendChild(list);
    container.appendChild(summary);
  }

  render();

  return {
    element: container,
    render,
    setLibraries(nextLibraries) {
      libraries.splice(0, libraries.length, ...nextLibraries);
      // Re-stamp: the incoming order is the API's last-modified order to restore.
      captureApiOrder();
      const nextIds = new Set(nextLibraries.map((lib) => lib.id));
      [...expandedState.keys()].forEach((id) => {
        if (!nextIds.has(id)) expandedState.delete(id);
      });
      nextLibraries.forEach((lib) => {
        // Explicit expanded (e.g. search matches) always wins; otherwise keep prior toggle state.
        if (lib.expanded === true) expandedState.set(lib.id, true);
        else if (!expandedState.has(lib.id)) expandedState.set(lib.id, Boolean(lib.expanded));
      });
      render();
    },
    setView(nextView, payload = {}) {
      view = nextView;
      if (nextView === LIBRARY_VIEW.EMPTY) emptyQuery = payload.query ?? '';
      render();
    },
    setSize(nextSize) {
      if (nextSize === size) return;
      size = nextSize;
      sizeClass = getSizeClass(size);
      render();
    },
    setCount(total) {
      header.setCount(total);
    },
    setSort(key) {
      if (Object.values(LIBRARY_SORT).includes(key)) currentSort = key;
      // silent: updates the control's value without re-emitting sort-change.
      header.setSort(key);
      render();
    },
    getSort() {
      return header.getSort();
    },
    expandAll,
    collapseAll,
    destroy() {
      header.destroy();
      container.remove();
    },
  };
}
