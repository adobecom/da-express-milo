import { getLibs, getIconElementDeprecated, decorateButtonsDeprecated, addTempWrapperDeprecated } from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { trackSearch, generateSearchId } from '../../scripts/template-search-api-v3.js';

let createTag; let getConfig;
let replaceKeyArray; let blockConfig;

function cycleThroughSuggestions(block, targetIndex = 0) {
  const suggestions = block.querySelectorAll('.suggestions-list li');
  if (targetIndex >= suggestions.length || targetIndex < 0) return;

  // Make all suggestions non-focusable first
  suggestions.forEach((li) => { li.tabIndex = -1; });

  // Make only the target suggestion focusable and focus it
  if (suggestions.length > 0 && suggestions[targetIndex]) {
    suggestions[targetIndex].tabIndex = 0;
    suggestions[targetIndex].focus();
  }
}

/**
 * Builds configuration object from block HTML structure (Word document approach)
 * @param {HTMLElement} block - The block element
 * @returns {Object} Configuration object with key-value pairs from the Word doc
 */
function buildSearchConfig(block) {
  const searchConfig = {};
  const rows = Array.from(block.children);

  // Read all rows to build the configuration
  rows.forEach((row) => {
    const cells = Array.from(row.children);

    if (cells.length >= 2) {
      const key = cells[0]?.textContent?.trim();
      const value = cells.length > 1
        ? Array.from(cells.slice(1))
          .map((cell) => cell?.textContent?.trim())
          .filter((text) => text !== undefined)
          .join(' ')
        : '';

      if (key) {
        searchConfig[key] = value;
      }
    }
  });

  return searchConfig;
}

function initSearchFunction(block, searchBarWrapper) {
  const searchDropdown = searchBarWrapper.querySelector('.search-dropdown-container');
  const searchForm = searchBarWrapper.querySelector('.search-form');
  const searchBar = searchBarWrapper.querySelector('input.search-bar');
  const clearBtn = searchBarWrapper.querySelector('.icon-search-clear');
  const trendsContainer = searchBarWrapper.querySelector('.trends-container');
  const suggestionsContainer = searchBarWrapper.querySelector('.suggestions-container');
  const suggestionsList = searchBarWrapper.querySelector('.suggestions-list');

  clearBtn.style.display = 'none';

  const searchBarWatcher = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) {
      BlockMediator.set('stickySearchBar', {
        element: searchBarWrapper.cloneNode(true),
        loadSearchBar: true,
      });
    } else {
      BlockMediator.set('stickySearchBar', {
        element: searchBarWrapper.cloneNode(true),
        loadSearchBar: false,
      });
    }
  }, { rootMargin: '0px', threshold: 1 });

  searchBarWatcher.observe(searchBarWrapper);

  searchBar.addEventListener('click', (e) => {
    e.stopPropagation();
    searchDropdown.classList.remove('hidden');
  }, { passive: true });

  searchBar.addEventListener('focus', () => {
    searchDropdown.classList.remove('hidden');
  }, { passive: true });

  searchBar.addEventListener('blur', () => {
    // Small delay to allow clicks on dropdown items to register first
    setTimeout(() => {
      const searchInputWrapper = searchBarWrapper.querySelector('.search-input-wrapper');
      if (!searchInputWrapper.contains(document.activeElement)) {
        searchDropdown.classList.add('hidden');
      }
    }, 100);
  });

  searchBar.addEventListener('keyup', () => {
    if (searchBar.value !== '') {
      clearBtn.style.display = 'inline-block';
      trendsContainer.classList.add('hidden');
      suggestionsContainer.classList.remove('hidden');
    } else {
      clearBtn.style.display = 'none';
      trendsContainer.classList.remove('hidden');
      suggestionsContainer.classList.add('hidden');
    }
  }, { passive: true });

  searchBar.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.keyCode === 40) {
      e.preventDefault();
      cycleThroughSuggestions(block);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Check if suggestions are visible and have items
      const suggestions = block.querySelectorAll('.suggestions-list li');
      if (!suggestionsContainer.classList.contains('hidden') && suggestions.length > 0) {
        e.preventDefault();
        cycleThroughSuggestions(block, 0); // Focus first suggestion
      }
    }
  });

  const handleDocumentClick = (e) => {
    const { target } = e;
    if (target !== searchBarWrapper && !searchBarWrapper.contains(target)) {
      searchDropdown.classList.add('hidden');
    }
  };

  document.addEventListener('click', handleDocumentClick, { passive: true });

  const redirectSearch = async () => {
    const { 'search-destination': searchDestination } = blockConfig;

    // If destination is authored, use simple redirect with query param
    if (searchDestination && searchDestination.trim() !== '') {
      trackSearch('search-inspire');

      const searchQuery = searchBar.value || '';
      const separator = searchDestination.includes('?') ? '&' : '?';
      const targetLocation = `${searchDestination}${separator}q=${encodeURIComponent(searchQuery)}`;

      window.location.assign(targetLocation);
    }
  };

  const onSearchSubmit = async () => {
    const { sampleRUM } = await import(`${getLibs()}/utils/samplerum.js`);
    sampleRUM('search', {
      source: block.dataset.blockName,
      target: searchBar.value,
    }, 1);
    await redirectSearch();
  };

  async function handleSubmitInteraction(item) {
    if (item.query !== searchBar.value) {
      searchBar.value = item.query;
      searchBar.dispatchEvent(new Event('input'));
    }

    await onSearchSubmit();
  }

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await onSearchSubmit();
  });

  clearBtn.addEventListener('click', () => {
    searchBar.value = '';
    suggestionsList.innerHTML = '';
    trendsContainer.classList.remove('hidden');
    suggestionsContainer.classList.add('hidden');
    clearBtn.style.display = 'none';
  }, { passive: true });

  // Shared HTML escape function to avoid recreating in loop
  const escapeHtml = (text) => text.replace(/[&<>"']/g, (match) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[match]));

  const suggestionsListUIUpdateCB = (suggestions) => {
    const searchBarVal = searchBar.value.toLowerCase();
    if (suggestions && !(suggestions.length <= 1 && suggestions[0]?.query === searchBarVal)) {
      // Get existing list items
      const existingItems = Array.from(suggestionsList.children);

      // Remove excess items if new list is shorter
      while (existingItems.length > suggestions.length) {
        const lastItem = existingItems.pop();
        lastItem.remove();
      }

      // Update existing items and add new ones as needed
      suggestions.forEach((item, index) => {
        let li = existingItems[index];

        if (li) {
          // Update existing item
          li.textContent = ''; // Clear existing content safely
          // Set tabindex: first item focusable, others not
          li.tabIndex = index === 0 ? 0 : -1;
        } else {
          // Create new item - first item focusable, others not
          li = createTag('li', { tabindex: index === 0 ? 0 : -1 });
        }

        // Use shared escapeHtml function

        // Safe highlighting with escaped HTML
        const escapedSearchValue = escapeHtml(searchBar.value);
        const escapedQuery = escapeHtml(item.query);
        const valRegEx = new RegExp(escapedSearchValue, 'i');
        const highlightedQuery = escapedQuery.replace(valRegEx, '<b>$&</b>');
        li.innerHTML = highlightedQuery;

        // Store current suggestion data on the element to avoid closure issues
        li.dataset.suggestionQuery = item.query;
        li.dataset.suggestionIndex = index;

        // Add event listeners only for new elements
        if (!existingItems[index]) {
          li.addEventListener('click', async (e) => {
            const clickedQuery = e.currentTarget.dataset.suggestionQuery;
            await handleSubmitInteraction({ query: clickedQuery });
          });

          li.addEventListener('keydown', async (e) => {
            const currentQuery = e.currentTarget.dataset.suggestionQuery;
            const currentIndex = parseInt(e.currentTarget.dataset.suggestionIndex, 10);

            if (e.key === 'Enter' || e.keyCode === 13) {
              await handleSubmitInteraction({ query: currentQuery });
            } else if (e.key === 'Tab') {
              e.preventDefault();
              const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
              if (nextIndex >= 0 && nextIndex < suggestions.length) {
                cycleThroughSuggestions(block, nextIndex);
              } else if (!e.shiftKey && nextIndex >= suggestions.length) {
                // Tab out of dropdown - return focus to search input
                searchBar.focus();
              }
            } else if (e.key === 'ArrowDown' || e.keyCode === 40) {
              e.preventDefault();
              cycleThroughSuggestions(block, currentIndex + 1);
            } else if (e.key === 'ArrowUp' || e.keyCode === 38) {
              e.preventDefault();
              cycleThroughSuggestions(block, currentIndex - 1);
            }
          });

          suggestionsList.append(li);
        }
      });
    }
  };

  import('./utils/autocomplete-api-v3.js')
    .then(({ default: useInputAutocomplete }) => {
      const { inputHandler } = useInputAutocomplete(
        suggestionsListUIUpdateCB,
        getConfig,
        { throttleDelay: 300, debounceDelay: 500, limit: 7 },
      );
      searchBar.addEventListener('input', inputHandler);
    })
    .catch((error) => {
      console.error('Failed to load autocomplete functionality:', error);
    });
}

async function decorateSearchFunctions(block) {
  const searchBarWrapper = createTag('div', { class: 'search-bar-wrapper' });

  // Read header and subheader from first block element (split by line breaks)
  const firstElementText = block.children[0]?.textContent?.trim();
  let headerText = '';
  let subheaderText = '';

  if (firstElementText) {
    const lines = firstElementText.split('\n').map((line) => line.trim()).filter((line) => line);
    headerText = lines[0] || '';
    subheaderText = lines[1] || '';
  }

  // Add header and subheader if found
  if (headerText || subheaderText) {
    const headerWrapper = createTag('div', { class: 'search-header' });

    if (headerText) {
      const header = createTag('h1', { class: 'search-title' });
      header.textContent = headerText;
      headerWrapper.append(header);
    }

    if (subheaderText) {
      const subheader = createTag('p', { class: 'search-subtitle' });
      subheader.textContent = subheaderText;
      headerWrapper.append(subheader);
    }

    searchBarWrapper.append(headerWrapper);
  }

  const searchForm = createTag('form', { class: 'search-form' });
  const searchPlaceholder = blockConfig['search-bar-text'] || 'Search for over 50,000 templates';
  const searchBar = createTag('input', {
    class: 'search-bar',
    type: 'text',
    placeholder: searchPlaceholder,
    enterKeyHint: blockConfig['search-enter-hint'] || 'Search',
    'aria-label': searchPlaceholder,
    role: 'searchbox',
    'aria-autocomplete': 'list',
  });

  searchForm.append(searchBar);

  // Create search input container for proper icon positioning
  const searchInputWrapper = createTag('div', { class: 'search-input-wrapper' });
  const searchIcon = getIconElementDeprecated('search');
  searchIcon.loading = 'lazy';
  const searchClearIcon = getIconElementDeprecated('search-clear');
  searchClearIcon.loading = 'lazy';

  searchInputWrapper.append(searchIcon, searchClearIcon, searchForm);
  searchBarWrapper.append(searchInputWrapper);

  return searchBarWrapper;
}

async function buildSearchDropdown(searchBarWrapper) {
  if (!searchBarWrapper) return;
  const dropdownContainer = createTag('div', { class: 'search-dropdown-container hidden' });
  const trendsContainer = createTag('div', { class: 'trends-container' });
  const suggestionsContainer = createTag('div', { class: 'suggestions-container hidden' });
  const suggestionsTitle = createTag('p', { class: 'dropdown-title' });
  const suggestionsList = createTag('ul', { class: 'suggestions-list' });

  // Use centralized system for trends and titles
  const [trendsTitle, searchTrends, searchSuggestionsTitle] = await replaceKeyArray(['search-trends-title', 'search-trends', 'search-suggestions-title'], getConfig());
  let trends;
  // Check for authored trending search terms first, then fall back to centralized config
  if (blockConfig['trending-search-terms']) {
    const authoredTrendingTerms = blockConfig['trending-search-terms'];

    // Parse plain text list (each line is a search term)
    const termsList = authoredTrendingTerms
      .split(/\r?\n/)
      .map((term) => term.trim())
      .filter((term) => term.length > 0);

    // Convert to trends object format
    trends = {};
    termsList.forEach((term) => {
      // Use the search destination with query parameter for each term
      const searchDestination = blockConfig['search-destination'];
      if (searchDestination) {
        const separator = searchDestination.includes('?') ? '&' : '?';
        trends[term] = `${searchDestination}${separator}q=${encodeURIComponent(term)}`;
      } else {
        // Fallback to generic search URL
        trends[term] = `/express/templates?q=${encodeURIComponent(term)}`;
      }
    });
  } else if (searchTrends && searchTrends !== 'search trends') {
    try {
      trends = JSON.parse(searchTrends);
    } catch (e) {
      // Invalid JSON in search-trends configuration
    }
  }

  if (trendsTitle) {
    const trendsTitleEl = createTag('p', { class: 'dropdown-title' });
    trendsTitleEl.textContent = trendsTitle;
    trendsContainer.append(trendsTitleEl);
  }

  if (trends) {
    const trendsWrapper = createTag('ul', { class: 'trends-wrapper' });
    for (const [key, value] of Object.entries(trends)) {
      const trendLinkWrapper = createTag('li');
      const trendLink = createTag('a', { class: 'trend-link', href: `${value}&searchId=${generateSearchId()}` });
      trendLink.textContent = key;
      trendLinkWrapper.append(trendLink);
      trendsWrapper.append(trendLinkWrapper);
    }
    trendsContainer.append(trendsWrapper);
  }

  suggestionsTitle.textContent = searchSuggestionsTitle !== 'search suggestions title' ? searchSuggestionsTitle : '';
  suggestionsContainer.append(suggestionsTitle, suggestionsList);

  const showFreePlan = blockConfig['show-free-plan']?.toLowerCase();
  if (showFreePlan && ['yes', 'on'].includes(showFreePlan)) {
    import('../../scripts/widgets/free-plan.js')
      .then(({ buildFreePlanWidget }) => buildFreePlanWidget({ typeKey: 'branded', checkmarks: true }))
      .then((freePlanTags) => {
        const freePlanContainer = createTag('div', { class: 'free-plans-container' });
        freePlanContainer.append(freePlanTags);
        dropdownContainer.append(freePlanContainer);
      })
      .catch((error) => {
        console.error('Failed to load free plan widget:', error);
      });
  }

  dropdownContainer.append(trendsContainer, suggestionsContainer);
  // Position dropdown relative to search input wrapper
  const searchInputWrapper = searchBarWrapper.querySelector('.search-input-wrapper');
  if (searchInputWrapper) {
    searchInputWrapper.append(dropdownContainer);
  } else {
    searchBarWrapper.append(dropdownContainer);
  }
}

export default async function decorate(block) {
  addTempWrapperDeprecated(block, 'standalone-search-bar');

  blockConfig = buildSearchConfig(block);

  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`), decorateButtonsDeprecated(block)]).then(([utils, placeholders]) => {
    ({ createTag, getConfig } = utils);
    ({ replaceKeyArray } = placeholders);
  });

  const searchBarWrapper = await decorateSearchFunctions(block);
  await buildSearchDropdown(searchBarWrapper);
  initSearchFunction(block, searchBarWrapper);

  block.innerHTML = '';
  block.appendChild(searchBarWrapper);
}
