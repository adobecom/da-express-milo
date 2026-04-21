import {
  createExploreSearchBar,
  createDeepLinkManager,
} from '../../scripts/color-shared/components/search-bar/index.js';
import { getIconElementDeprecated, addTempWrapperDeprecated, getMetadata } from '../../scripts/utils.js';

const CHEVRON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none">
  <path d="M8.5 4.5L15 11L8.5 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const STICKY_HIDE_DELAY_PX = 100;

function parseTagsRow(row) {
  const text = row?.textContent?.trim();
  if (!text) return [];

  return text.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function updateScrollFades(container, fadeRight, fadeLeft) {
  const isOverflowing = container.scrollWidth > container.clientWidth;
  const atStart = container.scrollLeft <= 2;
  const atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 2;
  fadeRight.classList.toggle('hidden', !isOverflowing || atEnd);
  fadeLeft.classList.toggle('hidden', !isOverflowing || atStart);
  container.classList.toggle('tags-centered', !isOverflowing);
}

function renderTagPills(block, tags, searchBar, deepLinkManager) {
  if (!tags.length) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'tags-scroll-wrapper';

  const container = document.createElement('div');
  container.className = 'tags-container';

  tags.forEach((tag) => {
    const pill = document.createElement('a');
    pill.className = 'tag-pill';
    pill.textContent = tag;
    pill.href = `?q=${encodeURIComponent(tag)}`;
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      searchBar.setQuery(tag);
      deepLinkManager.updateUrl(tag);
      block.dispatchEvent(new CustomEvent('floating-search:submit', {
        detail: { query: tag },
        bubbles: true,
      }));
    });
    container.append(pill);
  });

  const fadeRight = document.createElement('div');
  fadeRight.className = 'tags-scroll-fade tags-scroll-fade-right';

  const scrollBtnRight = document.createElement('button');
  scrollBtnRight.className = 'tags-scroll-btn';
  scrollBtnRight.innerHTML = CHEVRON_SVG;
  scrollBtnRight.setAttribute('aria-label', 'Scroll tags right');
  scrollBtnRight.addEventListener('click', () => {
    container.scrollBy({ left: container.clientWidth * 0.75, behavior: 'smooth' });
  });

  fadeRight.append(scrollBtnRight);

  const fadeLeft = document.createElement('div');
  fadeLeft.className = 'tags-scroll-fade tags-scroll-fade-left hidden';

  const scrollBtnLeft = document.createElement('button');
  scrollBtnLeft.className = 'tags-scroll-btn';
  scrollBtnLeft.innerHTML = CHEVRON_SVG;
  scrollBtnLeft.setAttribute('aria-label', 'Scroll tags left');
  scrollBtnLeft.addEventListener('click', () => {
    container.scrollBy({ left: -container.clientWidth * 0.75, behavior: 'smooth' });
  });

  fadeLeft.append(scrollBtnLeft);

  wrapper.append(fadeLeft, container, fadeRight);
  block.append(wrapper);

  container.addEventListener('scroll', () => updateScrollFades(container, fadeRight, fadeLeft));
  window.addEventListener('resize', () => updateScrollFades(container, fadeRight, fadeLeft));

  requestAnimationFrame(() => updateScrollFades(container, fadeRight, fadeLeft));
}

function createEmptyResultElements(block, afterElement) {
  const container = document.createElement('div');
  container.className = 'empty-result-container';

  const heading = document.createElement('p');
  heading.className = 'empty-result-heading';

  const description = document.createElement('p');
  description.className = 'empty-result-description';

  container.append(heading, description);

  if (afterElement) {
    afterElement.after(container);
  } else {
    block.append(container);
  }

  return { container, heading, description };
}

export function findRelatedColorExploreBlock(marqueeBlock) {
  const section = marqueeBlock.closest('.section');
  let cursor = section?.nextElementSibling;

  while (cursor) {
    const colorExplore = cursor.querySelector('.color-explore');
    if (colorExplore) return colorExplore;
    cursor = cursor.nextElementSibling;
  }

  return document.querySelector('.color-explore');
}

export function setupStickyBounds(block, searchBar) {
  if (
    typeof searchBar?.initStickyBehavior !== 'function'
    || typeof searchBar?.destroyStickyBehavior !== 'function'
  ) {
    return () => {};
  }

  const colorExploreBlock = findRelatedColorExploreBlock(block);
  if (!colorExploreBlock) return () => {};

  const endSentinel = document.createElement('span');
  endSentinel.dataset.searchBarEndSentinel = 'true';
  endSentinel.setAttribute('aria-hidden', 'true');
  endSentinel.style.cssText = 'display:block;inline-size:1px;block-size:1px;';
  const footer = document.querySelector('footer');
  if (footer) {
    footer.before(endSentinel);
  } else {
    colorExploreBlock.after(endSentinel);
  }

  let stickyEnabled = true;

  const setStickyEnabled = (nextEnabled) => {
    if (nextEnabled === stickyEnabled) return;
    stickyEnabled = nextEnabled;

    if (stickyEnabled) {
      searchBar.initStickyBehavior();
      return;
    }

    searchBar.hideSuggestions?.();
    searchBar.destroyStickyBehavior();
  };

  const evaluateStickyGate = () => {
    const endRect = endSentinel.getBoundingClientRect();
    const hideThreshold = Math.max(0, window.innerHeight - STICKY_HIDE_DELAY_PX);
    const shouldDisableSticky = endRect.top <= hideThreshold;
    setStickyEnabled(!shouldDisableSticky);
  };

  let layoutGateRaf = 0;
  const scheduleEvaluateStickyGate = () => {
    if (layoutGateRaf) cancelAnimationFrame(layoutGateRaf);
    layoutGateRaf = requestAnimationFrame(() => {
      layoutGateRaf = 0;
      evaluateStickyGate();
    });
  };

  const endObserver = new IntersectionObserver(() => {
    evaluateStickyGate();
  }, {
    root: null,
    rootMargin: `0px 0px -${STICKY_HIDE_DELAY_PX}px 0px`,
    threshold: 0,
  });

  endObserver.observe(endSentinel);
  window.addEventListener('resize', evaluateStickyGate, { passive: true });

  const exploreLayoutObserver = new ResizeObserver(scheduleEvaluateStickyGate);
  exploreLayoutObserver.observe(colorExploreBlock);

  return () => {
    if (layoutGateRaf) cancelAnimationFrame(layoutGateRaf);
    exploreLayoutObserver.disconnect();
    endObserver.disconnect();
    window.removeEventListener('resize', evaluateStickyGate);
    endSentinel.remove();
    setStickyEnabled(true);
  };
}

export default async function decorate(block) {
  if (!block.parentElement?.classList.contains('search-marquee-wrapper')) {
    addTempWrapperDeprecated(block, 'search-marquee');
  }

  const rows = [...block.children];
  const tags = parseTagsRow(rows[1]);

  block.colorTags = tags;
  if (tags.length) {
    block.dataset.tags = tags.join(',');
  }

  rows.forEach((row, index) => {
    if (index > 0) row.remove();
  });

  if (['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) {
    const logo = getIconElementDeprecated('adobe-express-logo');
    logo.classList.add('express-logo');
    const textContainer = block.querySelector(':scope > div:first-of-type');
    if (textContainer) {
      textContainer.prepend(logo);
    }
  }

  const deepLinkManager = createDeepLinkManager({
    enabled: true,
    queryParam: 'q',
  });

  const searchBar = await createExploreSearchBar(
    {
      placeholder: 'Search for colors, moods, themes, etc.',
      enableSuggestions: true,
      enableStickyBehavior: true,
      enableAutocomplete: true,
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
      onInput: ({ value }) => {
        block.dispatchEvent(new CustomEvent('floating-search:input', {
          detail: { value },
          bubbles: true,
        }));
      },
      onSubmit: ({ query, suggestion }) => {
        deepLinkManager.updateUrl(query);
        block.dispatchEvent(new CustomEvent('floating-search:submit', {
          detail: { query, suggestion },
          bubbles: true,
        }));
      },
      onClear: () => {
        deepLinkManager.clearUrl();
        block.dispatchEvent(new CustomEvent('floating-search:clear', {
          bubbles: true,
        }));
        block.dispatchEvent(new CustomEvent('floating-search:submit', {
          detail: { query: '' },
          bubbles: true,
        }));
      },
      onSuggestionSelect: ({ suggestion }) => {
        const query = suggestion.label || '';
        deepLinkManager.updateUrl(query);
        block.dispatchEvent(new CustomEvent('floating-search:suggestion-select', {
          detail: { suggestion },
          bubbles: true,
        }));
      },
    },
  );

  block.append(searchBar.element);
  const cleanupStickyBounds = setupStickyBounds(block, searchBar);

  const emptyResult = createEmptyResultElements(block, searchBar.element);

  renderTagPills(block, tags, searchBar, deepLinkManager);

  const urlQuery = deepLinkManager.getQueryFromUrl();
  if (urlQuery) {
    searchBar.setQuery(urlQuery);
    block.dispatchEvent(new CustomEvent('floating-search:url-init', {
      detail: { query: urlQuery },
      bubbles: true,
    }));
  }

  document.addEventListener('color-explore:empty-result', (e) => {
    const { query } = e.detail;
    block.classList.add('empty-result');
    emptyResult.heading.textContent = `'${query}' color palettes`;
    emptyResult.description.textContent = `Sorry, no color gradients found for "${query}." See other gradients you might like...`;
  });

  document.addEventListener('color-explore:results-found', () => {
    block.classList.remove('empty-result');
    emptyResult.heading.textContent = '';
    emptyResult.description.textContent = '';
  });

  const cleanupPopState = deepLinkManager.onPopState((query) => {
    if (query) {
      searchBar.setQuery(query);
      block.dispatchEvent(new CustomEvent('floating-search:popstate', {
        detail: { query },
        bubbles: true,
      }));
    } else {
      searchBar.clear();
    }
  });

  block.floatingSearchAPI = {
    ...searchBar,
    deepLinkManager,
    showEmptyResult({ searchTerm, type = 'color palettes' }) {
      block.classList.add('empty-result');
      emptyResult.heading.textContent = `'${searchTerm}' ${type}`;
      emptyResult.description.textContent = `Sorry, no color gradients found for "${searchTerm}." See other gradients you might like...`;
    },
    clearEmptyResult() {
      block.classList.remove('empty-result');
      emptyResult.heading.textContent = '';
      emptyResult.description.textContent = '';
    },
    destroy: () => {
      cleanupStickyBounds();
      cleanupPopState();
      searchBar.destroy();
    },
  };
}
