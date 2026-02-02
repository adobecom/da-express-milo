import {
  DEFAULTS,
  DEFAULT_DEEP_LINK_CONFIG,
  DEFAULT_SUGGESTIONS_CONFIG,
} from './helpers/constants.js';
import { createExploreSearchBar } from './helpers/searchBar.js';
import { createDeepLinkManager } from './helpers/deepLink.js';

/**
 * Parses block configuration from rows
 * @param {Element[]} rows - Block row elements
 * @returns {Object} Parsed configuration
 */
function parseBlockConfig(rows) {
  const config = {
    placeholder: DEFAULTS.PLACEHOLDER,
    floating: false,
    enableSuggestions: true,
    enableAutocomplete: true,
    deepLinkConfig: { ...DEFAULT_DEEP_LINK_CONFIG },
    suggestionsConfig: { ...DEFAULT_SUGGESTIONS_CONFIG },
  };

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;

    const key = cells[0]?.textContent?.trim().toLowerCase();
    const value = cells[1]?.textContent?.trim();

    switch (key) {
      case 'placeholder':
        config.placeholder = value;
        break;
      case 'floating':
        config.floating = value.toLowerCase() === 'on';
        break;
      case 'enable-suggestions':
        config.enableSuggestions = value.toLowerCase() !== 'off';
        break;
      case 'query-param':
        config.deepLinkConfig.queryParam = value;
        break;
      case 'max-items':
        config.suggestionsConfig.maxItems = Number.parseInt(value, 10) || 10;
        break;
      case 'header-text':
        config.suggestionsConfig.headerText = value;
        break;
      case 'deep-link':
        config.deepLinkConfig.enabled = value.toLowerCase() !== 'off';
        break;
      case 'autocomplete':
        config.enableAutocomplete = value.toLowerCase() !== 'off';
        break;
      default:
        break;
    }
  });

  return config;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const config = parseBlockConfig(rows);

  block.textContent = '';

  const deepLinkManager = createDeepLinkManager(config.deepLinkConfig);

  const searchBar = await createExploreSearchBar(
    {
      placeholder: config.placeholder,
      enableSuggestions: config.enableSuggestions,
      enableStickyBehavior: config.floating,
      suggestionsConfig: config.suggestionsConfig,
      enableAutocomplete: config.enableAutocomplete,
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
        const query = suggestion.label || suggestion[config.suggestionsConfig.itemConfig?.labelField];
        deepLinkManager.updateUrl(query);

        block.dispatchEvent(new CustomEvent('floating-search:suggestion-select', {
          detail: { suggestion },
          bubbles: true,
        }));
      },
    },
  );

  block.append(searchBar.element);

  if (config.deepLinkConfig.autoPopulate) {
    const urlQuery = deepLinkManager.getQueryFromUrl();
    if (urlQuery) {
      searchBar.setQuery(urlQuery);

      block.dispatchEvent(new CustomEvent('floating-search:url-init', {
        detail: { query: urlQuery },
        bubbles: true,
      }));
    }
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
