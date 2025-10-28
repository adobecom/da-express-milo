import { getLibs, getIconElementDeprecated, decorateButtonsDeprecated, addTempWrapperDeprecated } from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { trackSearch, updateImpressionCache, generateSearchId } from '../../scripts/template-search-api-v3.js';

let createTag; let getConfig;
let getMetadata; let replaceKey;
let replaceKeyArray; let config;
let prefix;

function handlelize(str) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/(\W+|\s+)/g, '-') // Replace space and other characters by hyphen
    .replace(/--+/g, '-') // Replaces multiple hyphens by one hyphen
    .replace(/(^-+|-+$)/g, '') // Remove extra hyphens from beginning or end of the string
    .toLowerCase(); // To lowercase
}

function wordExistsInString(word, inputString) {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = new RegExp(`(?:^|\\s|[.,!?()'"\\-])${escapedWord}(?:$|\\s|[.,!?()'"\\-])`, 'i');
  return regexPattern.test(inputString);
}

function cycleThroughSuggestions(block, targetIndex = 0) {
  const suggestions = block.querySelectorAll('.suggestions-list li');
  if (targetIndex >= suggestions.length || targetIndex < 0) return;
  if (suggestions.length > 0) suggestions[targetIndex].focus();
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

  BlockMediator.set('stickySearchBar', {
    element: searchBarWrapper.cloneNode(true),
    loadSearchBar: true,
  });

  searchBar.addEventListener('click', (e) => {
    e.stopPropagation();
    searchBar.scrollIntoView({ behavior: 'smooth' });
    searchDropdown.classList.remove('hidden');
  }, { passive: true });

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
    }
  });

  document.addEventListener('click', (e) => {
    const { target } = e;
    if (target !== searchBarWrapper && !searchBarWrapper.contains(target)) {
      searchDropdown.classList.add('hidden');
    }
  }, { passive: true });

  const trimInput = (tasks, input) => {
    let alteredInput = input;
    tasks[0][1].sort((a, b) => b.length - a.length).forEach((word) => {
      alteredInput = alteredInput.toLowerCase().replace(word.toLowerCase(), '');
    });

    return alteredInput.trim();
  };

  const findTask = (map) => Object.entries(map).filter((task) => task[1].some((word) => {
    const searchValue = searchBar.value.toLowerCase();
    return wordExistsInString(word.toLowerCase(), searchValue);
  })).sort((a, b) => b[0].length - a[0].length);

  const redirectSearch = async () => {
    const taskMap = await replaceKey('task-name-mapping', config) || {};
    const taskXMap = await replaceKey('x-task-name-mapping', config) || {};
    const format = getMetadata('placeholder-format');

    const currentTasks = {
      xCore: '',
      content: '',
    };
    let searchInput = searchBar.value?.toLowerCase() || getMetadata('topics');
    const tasksFoundInInput = findTask(JSON.parse(taskMap));
    const tasksXFoundInInput = findTask(JSON.parse(taskXMap));

    if (tasksFoundInInput.length > 0) {
      searchInput = trimInput(tasksFoundInInput, searchInput);
      [[currentTasks.xCore]] = tasksFoundInInput;
    }

    if (tasksXFoundInInput.length > 0) {
      searchInput = trimInput(tasksXFoundInInput, searchInput);
      [[currentTasks.content]] = tasksXFoundInInput;
    }
    const topicUrl = searchInput ? `/${searchInput}` : '';
    const taskUrl = `/${handlelize(currentTasks.xCore.toLowerCase())}`;
    const taskXUrl = `/${handlelize(currentTasks.content.toLowerCase())}`;
    const targetPath = `${prefix}/express/templates${taskUrl}${topicUrl}`;
    const targetPathX = `${prefix}/express/templates${taskXUrl}${topicUrl}`;
    const { default: fetchAllTemplatesMetadata } = await import('../../scripts/utils/all-templates-metadata.js');
    const allTemplatesMetadata = await fetchAllTemplatesMetadata(getConfig);
    const pathMatch = (e) => e.url === targetPath;
    const pathMatchX = (e) => e.url === targetPathX;
    let targetLocation;

    updateImpressionCache({ collection: currentTasks.content || 'all-templates', content_category: 'templates' });
    trackSearch('search-inspire');

    const searchId = BlockMediator.get('templateSearchSpecs').search_id;
    if (allTemplatesMetadata.some(pathMatchX) && document.body.dataset.device !== 'mobile') {
      targetLocation = `${window.location.origin}${targetPathX}?searchId=${searchId || ''}`;
    } else if (allTemplatesMetadata.some(pathMatch) && document.body.dataset.device !== 'desktop') {
      targetLocation = `${window.location.origin}${targetPath}?searchId=${searchId || ''}`;
    } else {
      const searchUrlTemplate = `/express/templates/search?tasks=${currentTasks.xCore}&tasksx=${currentTasks.content}&phformat=${format}&topics=${searchInput || "''"}&q=${searchBar.value || "''"}&searchId=${searchId || ''}`;
      targetLocation = `${window.location.origin}${prefix}${searchUrlTemplate}`;
    }
    window.location.assign(targetLocation);
  };

  const onSearchSubmit = async () => {
    const { sampleRUM } = await import(`${getLibs()}/utils/samplerum.js`);
    searchBar.disabled = true;
    sampleRUM('search', {
      source: block.dataset.blockName,
      target: searchBar.value,
    }, 1);
    await redirectSearch();
  };

  async function handleSubmitInteraction(item, index) {
    if (item.query !== searchBar.value) {
      searchBar.value = item.query;
      searchBar.dispatchEvent(new Event('input'));
    }

    updateImpressionCache({
      status_filter: 'free',
      type_filter: 'all',
      collection: 'all-templates',
      keyword_rank: index + 1,
      search_keyword: searchBar.value || 'empty search',
      search_type: 'autocomplete',
    });

    await onSearchSubmit();
  }

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    updateImpressionCache({
      status_filter: 'free',
      type_filter: 'all',
      collection: 'all-templates',
      search_keyword: searchBar.value || 'empty search',
      search_type: 'direct',
    });
    await onSearchSubmit();
  });

  clearBtn.addEventListener('click', () => {
    searchBar.value = '';
    suggestionsList.innerHTML = '';
    trendsContainer.classList.remove('hidden');
    suggestionsContainer.classList.add('hidden');
    clearBtn.style.display = 'none';
  }, { passive: true });

  const suggestionsListUIUpdateCB = (suggestions) => {
    suggestionsList.innerHTML = '';
    const searchBarVal = searchBar.value.toLowerCase();
    if (suggestions && !(suggestions.length <= 1 && suggestions[0]?.query === searchBarVal)) {
      suggestions.forEach((item, index) => {
        const li = createTag('li', { tabindex: 0 });
        const valRegEx = new RegExp(searchBar.value, 'i');
        li.innerHTML = item.query.replace(valRegEx, `<b>${searchBarVal}</b>`);
        li.addEventListener('click', async () => {
          await handleSubmitInteraction(item, index);
        });

        li.addEventListener('keydown', async (e) => {
          if (e.key === 'Enter' || e.keyCode === 13) {
            await handleSubmitInteraction(item, index);
          }
        });

        li.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown' || e.keyCode === 40) {
            e.preventDefault();
            cycleThroughSuggestions(block, index + 1);
          }
        });

        li.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowUp' || e.keyCode === 38) {
            e.preventDefault();
            cycleThroughSuggestions(block, index - 1);
          }
        });

        suggestionsList.append(li);
      });
      const suggestListString = suggestions.map((s) => s.query).join(',');
      updateImpressionCache({
        prefix_query: searchBarVal,
        suggestion_list_shown: suggestListString,
      });
    }
  };

  import('./utils/autocomplete-api-v3.js').then(({ default: useInputAutocomplete }) => {
    const { inputHandler } = useInputAutocomplete(
      suggestionsListUIUpdateCB,
      getConfig,
      { throttleDelay: 300, debounceDelay: 500, limit: 7 },
    );
    searchBar.addEventListener('input', inputHandler);
  });
}

async function decorateSearchFunctions(block) {
  const searchBarWrapper = createTag('div', { class: 'search-bar-wrapper' });
  const searchForm = createTag('form', { class: 'search-form' });
  const searchBar = createTag('input', {
    class: 'search-bar',
    type: 'text',
    placeholder: await replaceKey('template-search-placeholder', config) || 'Search for over 50,000 templates',
    enterKeyHint: await replaceKey('search', config) || 'Search',
  });

  searchForm.append(searchBar);
  const searchIcon = getIconElementDeprecated('search');
  searchIcon.loading = 'lazy';
  const searchClearIcon = getIconElementDeprecated('search-clear');
  searchClearIcon.loading = 'lazy';
  searchBarWrapper.append(searchIcon, searchClearIcon);
  searchBarWrapper.append(searchForm);

  block.insertBefore(searchBarWrapper, block.querySelector('div:nth-of-type(2)'));
  return searchBarWrapper;
}

function decorateBackground(block) {
  const mediaRow = block.querySelector('div:nth-of-type(2)');
  if (mediaRow) {
    let media = mediaRow.querySelector('picture img');
    if (!media) {
      media = createTag('img');
      media.src = mediaRow.querySelector('a')?.href;
    }
    media.classList.add('backgroundimg');
    media.loading = 'eager';
    media.setAttribute('fetchpriority', 'high');
    block.prepend(media);
    mediaRow.remove();
  }
}

async function buildSearchDropdown(block, searchBarWrapper) {
  if (!searchBarWrapper) return;
  const dropdownContainer = createTag('div', { class: 'search-dropdown-container hidden' });
  const trendsContainer = createTag('div', { class: 'trends-container' });
  const suggestionsContainer = createTag('div', { class: 'suggestions-container hidden' });
  const suggestionsTitle = createTag('p', { class: 'dropdown-title' });
  const suggestionsList = createTag('ul', { class: 'suggestions-list' });

  const fromScratchLink = block.querySelector('a');
  const [trendsTitle, searchTrends, searchSuggestionsTitle] = await replaceKeyArray(['search-trends-title', 'search-trends', 'search-suggestions-title'], config);
  let trends;
  if (searchTrends !== 'search trends') trends = JSON.parse(searchTrends);

  if (fromScratchLink) {
    const linkDiv = fromScratchLink.parentElement.parentElement;
    const templateFreeAccentIcon = getIconElementDeprecated('template-free-accent');
    templateFreeAccentIcon.loading = 'lazy';
    const arrowRightIcon = getIconElementDeprecated('arrow-right');
    arrowRightIcon.loading = 'lazy';
    fromScratchLink.prepend(templateFreeAccentIcon);
    fromScratchLink.append(arrowRightIcon);
    fromScratchLink.classList.remove('button');
    fromScratchLink.classList.add('from-scratch-link');
    fromScratchLink.href = getMetadata('search-marquee-from-scratch-link') || '/';
    trendsContainer.append(fromScratchLink);
    import('../../scripts/branchlinks.js').then(async (mod) => {
      fromScratchLink.href = await mod.getTrackingAppendedURL([fromScratchLink], { placement: 'search-marquee' });
    });
    linkDiv.remove();
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
      const trendLink = createTag('a', { class: 'trend-link', href: `${value}?searchId=${generateSearchId()}` });
      trendLink.addEventListener('click', () => {
        updateImpressionCache({
          keyword_filter: key,
          content_category: 'templates',
        });
        trackSearch('search-inspire', new URLSearchParams(new URL(trendLink.href).search).get('searchId'));
      });
      trendLink.textContent = key;
      trendLinkWrapper.append(trendLink);
      trendsWrapper.append(trendLinkWrapper);
    }
    trendsContainer.append(trendsWrapper);
  }

  suggestionsTitle.textContent = searchSuggestionsTitle !== 'search suggestions title' ? searchSuggestionsTitle : '';
  suggestionsContainer.append(suggestionsTitle, suggestionsList);

  import('../../scripts/widgets/free-plan.js')
    .then(({ buildFreePlanWidget }) => buildFreePlanWidget({ typeKey: 'branded', checkmarks: true }))
    .then((freePlanTags) => {
      const freePlanContainer = createTag('div', { class: 'free-plans-container' });
      freePlanContainer.append(freePlanTags);
      dropdownContainer.append(freePlanContainer);
    });
  dropdownContainer.append(trendsContainer, suggestionsContainer);
  searchBarWrapper.append(dropdownContainer);
}

async function decorateLinkList(block) {
  // preventing css. will be removed by buildCarousel
  block.querySelector(':scope > div:last-of-type').style.cssText = 'max-height: 90px; visibility: hidden;';
  const carouselItemsWrapper = block.querySelector(':scope > div:last-of-type > div');
  if (carouselItemsWrapper) {
    const showLinkList = getMetadata('show-search-marquee-link-list');
    if ((showLinkList && !['yes', 'true', 'on', 'Y'].includes(showLinkList))
      // no link list for templates root page
      || window.location.pathname.endsWith('/express/templates/')
      || window.location.pathname.endsWith('/express/templates')) {
      carouselItemsWrapper.remove();
    } else {
      const { default: buildCarousel } = await import('../../scripts/widgets/carousel.js');
      await buildCarousel(':scope > p', carouselItemsWrapper);
      const carousel = carouselItemsWrapper.querySelector('.carousel-container');
      block.append(carousel);
      carouselItemsWrapper.parentElement.remove();
    }
  }
  const blockLinks = block.querySelectorAll('a');
  if (blockLinks && blockLinks.length > 0) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
    document.dispatchEvent(linksPopulated);
  }
  if (window.location.href.includes('/express/templates/')) {
    const { default: updateAsyncBlocks } = await import('../../scripts/utils/template-ckg.js');
    updateAsyncBlocks();
  }
}

export default async function decorate(block) {
  addTempWrapperDeprecated(block, 'search-marquee');
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`), decorateButtonsDeprecated(block)]).then(([utils, placeholders]) => {
    ({ createTag, getConfig, getMetadata } = utils);
    ({ replaceKey, replaceKeyArray } = placeholders);
  });
  config = getConfig();
  ({ prefix } = getConfig().locale);
  decorateBackground(block);
  if (['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) {
    const logo = getIconElementDeprecated('adobe-express-logo');
    logo.classList.add('express-logo');
    block.prepend(logo);
  }
  const searchBarWrapper = await decorateSearchFunctions(block);
  await buildSearchDropdown(block, searchBarWrapper);
  initSearchFunction(block, searchBarWrapper);
  decorateLinkList(block);
}
