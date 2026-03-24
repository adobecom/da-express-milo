import {
  createExploreSearchBar,
  createDeepLinkManager,
} from '../../scripts/color-shared/components/search-bar/index.js';
import { addTempWrapperDeprecated } from '../../scripts/utils.js';

function parseTagsRow(row) {
  const text = row?.textContent?.trim();
  if (!text) return [];

  return text.split(',').map((tag) => tag.trim()).filter(Boolean);
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
