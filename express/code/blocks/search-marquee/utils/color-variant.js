import { createExploreSearchBar } from '../../search-bar/helpers/searchBar.js';
import { createDeepLinkManager } from '../../search-bar/helpers/deepLink.js';
import { loadComponentStyles } from '../../../libs/utils/loadComponentStyles.js';
import { addTempWrapperDeprecated } from '../../../scripts/utils.js';

const SEARCH_BAR_CSS = '../../search-bar/search-bar.css';

function parseTagsRow(row) {
  const text = row?.textContent?.trim();
  if (!text) return [];

  return text.split(',').map((tag) => tag.trim()).filter(Boolean);
}

async function loadSharedSearchBarStyles() {
  try {
    await loadComponentStyles(SEARCH_BAR_CSS, import.meta.url);
  } catch (error) {
    window.lana?.log(`[search-marquee] Failed to load color variant styles: ${error?.message}`, {
      tags: 'search-marquee,color-variant',
      severity: 'error',
    });
  }
}

export default async function decorateColorSearchMarquee(block) {
  if (!block.parentElement?.classList.contains('search-marquee-wrapper')) {
    addTempWrapperDeprecated(block, 'search-marquee');
  }

  await loadSharedSearchBarStyles();

  const rows = [...block.children];
  const tags = parseTagsRow(rows[1]);

  block.colorTags = tags;
  if (tags.length) {
    block.dataset.tags = tags.join(',');
  }

  rows.forEach((row, index) => {
    if (index > 0) row.remove();
  });

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
        headerText: 'Suggestions',
        maxItems: 3,
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

  const urlQuery = deepLinkManager.getQueryFromUrl();
  if (urlQuery) {
    searchBar.setQuery(urlQuery);
    block.dispatchEvent(new CustomEvent('floating-search:url-init', {
      detail: { query: urlQuery },
      bubbles: true,
    }));
  }

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
    destroy: () => {
      cleanupPopState();
      searchBar.destroy();
    },
  };
}
