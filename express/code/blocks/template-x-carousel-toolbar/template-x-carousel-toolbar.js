import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import { fetchResults, isValidTemplate } from '../../scripts/template-utils.js';
import renderTemplate from '../template-x/template-rendering.js';
import buildGallery from '../../scripts/widgets/gallery/gallery.js';

let createTag;
let getConfig;
let getMetadata;
let replaceKey;
let replaceKeyArray;
let BlockMediator;
let trackSearch;
let updateImpressionCache;
let generateSearchId;

const fromScratchFallbackLink = 'https://adobesparkpost.app.link/c4bWARQhWAb';

async function createTemplates(recipe, customProperties = null) {
  const res = await fetchResults(recipe);
  const templates = await Promise.all(
    res.items
      .filter((item) => isValidTemplate(item))
      .map((item) => renderTemplate(item, undefined, customProperties)),
  );
  templates.forEach((tplt) => tplt.classList.add('template'));
  return templates;
}

async function createFromScratch() {
  const [fromScratchText, searchBranchLinks] = await Promise.all([
    replaceKey('start-from-scratch', getConfig()),
    replaceKey('search-branch-links', getConfig()),
  ]);
  const fromScratchHref = searchBranchLinks.split(',')[0]?.trim() || fromScratchFallbackLink;
  const fromScratchBorder = createTag('div', { class: 'from-scratch-border' });
  const fromScratchContainer = createTag('a', {
    class: 'from-scratch-container',
    rel: 'nofollow',
    target: '_self',
    href: fromScratchHref,
  }, fromScratchBorder);
  const svg = getIconElementDeprecated('start-from-scratch');
  const text = createTag('div', { class: 'from-scratch-text' }, fromScratchText);
  fromScratchBorder.append(svg, text);
  return fromScratchContainer;
}

async function createTemplatesContainer(recipe, el, includesSearchBar = false) {
  const templatesContainer = createTag('div', { class: 'templates-container' });

  if (includesSearchBar) {
    templatesContainer.classList.add('search-bar-gallery');
  }

  // Create custom properties for search bar variant
  const customProperties = includesSearchBar ? {
    customUrlConfig: {
      baseUrl: 'https://adobesparkpost.app.link/8JaoEy0DrSb',
      queryParams: 'source=seo-template',
    },
  } : null;

  // Conditionally create from-scratch element
  const promises = [createTemplates(recipe, customProperties)];
  if (!includesSearchBar) {
    promises.unshift(createFromScratch());
  }

  const results = await Promise.all(promises);
  const scratch = includesSearchBar ? null : results[0];
  const templates = includesSearchBar ? results[0] : results[1];

  // Append elements conditionally
  const galleryItems = scratch ? [scratch, ...templates] : templates;
  templatesContainer.append(...galleryItems);

  const { control: initialControl } = await buildGallery(
    galleryItems,
    templatesContainer,
  );
  return {
    templatesContainer,
    updateTemplates: async (newRecipe) => {
      const newTemplates = await createTemplates(newRecipe, customProperties);
      const newGalleryItems = scratch ? [scratch, ...newTemplates] : newTemplates;
      templatesContainer.replaceChildren(...newGalleryItems);
      const { control: newControl } = await buildGallery(
        newGalleryItems,
        templatesContainer,
      );
      const oldControl = el.querySelector('.gallery-control');
      // hack to reduce cls. TODO: implement updateItems() for gallery
      newControl.style.display = 'flex';
      oldControl.replaceWith(newControl);
    },
    control: initialControl,
  };
}

function createDropdown(sortOptions, defaultIndex, updateTemplates, sortPlaceholderText) {
  let currentIndex = defaultIndex;
  const select = createTag('div', {
    class: 'select',
    role: 'combobox',
    'aria-haspopup': 'listbox',
    'aria-label': sortPlaceholderText,
    'aria-expanded': 'false',
    tabindex: '0',
  });
  const selectedOption = createTag('div', { class: 'selected-option' }, [getIconElementDeprecated('template-lightning'), sortOptions[defaultIndex].text]);
  const options = sortOptions.map(({ text }) => (createTag('li', { class: 'option', role: 'option' }, [getIconElementDeprecated('template-lightning'), text])));
  options[defaultIndex].setAttribute('aria-selected', 'true');
  const optionList = createTag('ul', { class: 'options', role: 'listbox', tabindex: -1 }, options);
  function updateFocus() {
    options.forEach((o) => o.classList.remove('hovered'));
    options[currentIndex].classList.add('hovered');
    options[currentIndex].scrollIntoView({ block: 'nearest' });
  }
  const selectedOptionWrapper = createTag('div', { class: 'selected-option-wrapper' }, [selectedOption, getIconElementDeprecated('drop-down-arrow')]);
  select.append(selectedOptionWrapper, optionList);
  const optionListProxy = optionList.cloneNode(true);
  optionListProxy.setAttribute('aria-hidden', 'true');
  optionListProxy.classList.add('sizing-proxy');
  select.append(optionListProxy);

  select.addEventListener('click', () => {
    const expanded = select.getAttribute('aria-expanded') === 'true';
    select.setAttribute('aria-expanded', String(!expanded));
    if (!expanded) {
      options.forEach((o, i) => {
        if (o.getAttribute('aria-selected') === 'true') {
          currentIndex = i;
        }
      });
      updateFocus();
    }
  });
  select.addEventListener('keydown', (e) => {
    const expanded = select.getAttribute('aria-expanded') === 'true';
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (expanded) {
        currentIndex = (currentIndex + 1) % options.length;
        updateFocus();
      } else {
        select.click();
      }
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (expanded) {
        currentIndex = (currentIndex - 1 + options.length) % options.length;
        updateFocus();
      }
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (expanded) {
        options[currentIndex].click();
      } else {
        select.click();
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      select.setAttribute('aria-expanded', 'false');
    }
    if (e.key === 'Tab') {
      if (expanded) {
        select.click();
      }
    }
  });
  options.forEach((opt, index) => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      if (opt.getAttribute('aria-selected') === 'true') {
        select.click();
        return;
      }
      options.forEach((o) => o.setAttribute('aria-selected', 'false'));
      opt.setAttribute('aria-selected', 'true');
      selectedOption.innerHTML = opt.innerHTML;
      currentIndex = index;
      select.setAttribute('aria-expanded', 'false');
      updateTemplates(sortOptions[index].recipe);
    });
    opt.addEventListener('mouseenter', () => {
      currentIndex = index;
      updateFocus();
    });
  });
  document.addEventListener('click', (e) => {
    if (select.contains(e.target)) return;
    select.getAttribute('aria-expanded') === 'true' && select.click();
  });
  return select;
}

const sortConfig = {
  popular: '-remixCount',
  'new-templates': '-createDate',
};

function handlelize(str) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/(\W+|\s+)/g, '-')
    .replace(/--+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .toLowerCase();
}

function wordExistsInString(word, inputString) {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = new RegExp(`(?:^|\\s|[.,!?()'"\\-])${escapedWord}(?:$|\\s|[.,!?()'"\\-])`, 'i');
  return regexPattern.test(inputString);
}

function cycleThroughSuggestions(el, targetIndex = 0) {
  const suggestions = el.querySelectorAll('.suggestions-list li');
  if (targetIndex >= suggestions.length || targetIndex < 0) return;
  if (suggestions.length > 0) suggestions[targetIndex].focus();
}

function initSearchFunction(el, searchBarWrapper) {
  const searchDropdown = searchBarWrapper.querySelector('.search-dropdown-container');
  const searchForm = searchBarWrapper.querySelector('.search-form');
  const searchBar = searchBarWrapper.querySelector('input.search-bar');
  const clearBtn = searchBarWrapper.querySelector('.icon-search-clear');
  const trendsContainer = searchBarWrapper.querySelector('.trends-container');
  const suggestionsContainer = searchBarWrapper.querySelector('.suggestions-container');
  const suggestionsList = searchBarWrapper.querySelector('.suggestions-list');

  clearBtn.style.display = 'none';

  searchBar.addEventListener('click', (e) => {
    e.stopPropagation();
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
      cycleThroughSuggestions(el);
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
    const cfg = getConfig();
    const { prefix } = cfg.locale;
    const taskMap = await replaceKey('task-name-mapping', cfg) || {};
    const taskXMap = await replaceKey('x-task-name-mapping', cfg) || {};
    const format = getMetadata('placeholder-format');

    const currentTasks = { xCore: '', content: '' };
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

    updateImpressionCache({ collection: currentTasks.content || 'all-templates', content_category: 'templates' });
    trackSearch('search-inspire');

    const searchId = BlockMediator.get('templateSearchSpecs')?.search_id;
    let targetLocation;
    if (allTemplatesMetadata.some((e) => e.url === targetPathX) && document.body.dataset.device !== 'mobile') {
      targetLocation = `${window.location.origin}${targetPathX}?searchId=${searchId || ''}`;
    } else if (allTemplatesMetadata.some((e) => e.url === targetPath) && document.body.dataset.device !== 'desktop') {
      targetLocation = `${window.location.origin}${targetPath}?searchId=${searchId || ''}`;
    } else {
      const searchUrlTemplate = `/express/templates/search?tasks=${encodeURIComponent(currentTasks.xCore)}&tasksx=${encodeURIComponent(currentTasks.content)}&phformat=${encodeURIComponent(format)}&topics=${encodeURIComponent(searchInput || '')}&q=${encodeURIComponent(searchBar.value || '')}&searchId=${encodeURIComponent(searchId || '')}`;
      targetLocation = `${window.location.origin}${prefix}${searchUrlTemplate}`;
    }
    window.location.assign(targetLocation);
  };

  const onSearchSubmit = async () => {
    const { sampleRUM } = await import(`${getLibs()}/utils/samplerum.js`);
    searchBar.disabled = true;
    sampleRUM('search', { source: el.dataset.blockName, target: searchBar.value }, 1);
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
        const matchStart = item.query.toLowerCase().indexOf(searchBarVal);
        if (matchStart !== -1) {
          li.append(
            document.createTextNode(item.query.slice(0, matchStart)),
            Object.assign(createTag('b'), { textContent: item.query.slice(matchStart, matchStart + searchBarVal.length) }),
            document.createTextNode(item.query.slice(matchStart + searchBarVal.length)),
          );
        } else {
          li.textContent = item.query;
        }
        li.addEventListener('click', async () => { await handleSubmitInteraction(item, index); });
        li.addEventListener('keydown', async (e) => {
          if (e.key === 'Enter' || e.keyCode === 13) await handleSubmitInteraction(item, index);
        });
        li.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown' || e.keyCode === 40) {
            e.preventDefault();
            cycleThroughSuggestions(el, index + 1);
          }
        });
        li.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowUp' || e.keyCode === 38) {
            e.preventDefault();
            cycleThroughSuggestions(el, index - 1);
          }
        });
        suggestionsList.append(li);
      });
      updateImpressionCache({
        prefix_query: searchBarVal,
        suggestion_list_shown: suggestions.map((s) => s.query).join(','),
      });
    }
  };

  import('../../scripts/autocomplete-api-v3.js').then(({ default: useInputAutocomplete }) => {
    const { inputHandler } = useInputAutocomplete(
      suggestionsListUIUpdateCB,
      getConfig,
      { throttleDelay: 300, debounceDelay: 500, limit: 5 },
    );
    searchBar.addEventListener('input', inputHandler);
  });
}

async function createSearchBarWrapper() {
  const searchBarWrapper = createTag('div', { class: 'search-bar-wrapper' });
  const searchForm = createTag('form', { class: 'search-form' });
  const cfg = getConfig();
  const searchPlaceholder = await replaceKey('template-search-placeholder', cfg) || 'Search for over 50,000 templates';
  const searchBar = createTag('input', {
    class: 'search-bar',
    type: 'text',
    placeholder: searchPlaceholder,
    'aria-label': searchPlaceholder,
    enterKeyHint: await replaceKey('search', cfg) || 'Search',
  });
  searchForm.append(searchBar);
  const searchIcon = getIconElementDeprecated('search');
  searchIcon.loading = 'lazy';
  const searchClearIcon = getIconElementDeprecated('search-clear');
  searchClearIcon.loading = 'lazy';
  searchBarWrapper.append(searchIcon, searchClearIcon, searchForm);
  return searchBarWrapper;
}

async function buildSearchDropdown(searchBarWrapper) {
  if (!searchBarWrapper) return;
  const dropdownContainer = createTag('div', { class: 'search-dropdown-container hidden' });
  const trendsContainer = createTag('div', { class: 'trends-container' });
  const suggestionsContainer = createTag('div', { class: 'suggestions-container hidden' });
  const suggestionsTitle = createTag('p', { class: 'dropdown-title' });
  const suggestionsList = createTag('ul', { class: 'suggestions-list' });

  const cfg = getConfig();
  const [trendsTitle, searchTrends, searchSuggestionsTitle] = await replaceKeyArray(
    ['search-trends-title', 'search-trends', 'search-suggestions-title'],
    cfg,
  );

  if (trendsTitle) {
    const trendsTitleEl = createTag('p', { class: 'dropdown-title' });
    trendsTitleEl.textContent = trendsTitle;
    trendsContainer.append(trendsTitleEl);
  }

  let trends;
  if (searchTrends && searchTrends !== 'search trends') {
    try { trends = JSON.parse(searchTrends); } catch { /* no trends */ }
  }

  if (trends) {
    const trendsWrapper = createTag('ul', { class: 'trends-wrapper' });
    const onTrendClick = (key, href) => {
      updateImpressionCache({ keyword_filter: key, content_category: 'templates' });
      const searchId = new URLSearchParams(new URL(href).search).get('searchId');
      trackSearch('search-inspire', searchId);
    };
    Object.entries(trends).forEach(([key, value]) => {
      const trendLinkWrapper = createTag('li');
      const href = `${value}?searchId=${generateSearchId()}`;
      const trendLink = createTag('a', { class: 'trend-link', href });
      trendLink.addEventListener('click', () => onTrendClick(key, trendLink.href));
      trendLink.textContent = key;
      trendLinkWrapper.append(trendLink);
      trendsWrapper.append(trendLinkWrapper);
    });
    trendsContainer.append(trendsWrapper);
  }

  suggestionsTitle.textContent = searchSuggestionsTitle !== 'search suggestions title' ? searchSuggestionsTitle : '';
  suggestionsContainer.append(suggestionsTitle, suggestionsList);
  dropdownContainer.append(trendsContainer, suggestionsContainer);

  const loadFreePlan = () => import('../../scripts/widgets/free-plan.js')
    .then(({ buildFreePlanWidget }) => buildFreePlanWidget({ typeKey: 'branded', checkmarks: true }))
    .then((freePlanTags) => {
      const freePlanContainer = createTag('div', { class: 'free-plans-container' });
      freePlanContainer.append(freePlanTags);
      dropdownContainer.append(freePlanContainer);
    })
    .catch(() => {});
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadFreePlan);
  } else {
    setTimeout(loadFreePlan, 0);
  }

  searchBarWrapper.append(dropdownContainer);
}

export async function extractSort(recipe) {
  const recipeParams = new URLSearchParams(recipe);
  const sortKeys = Object.keys(sortConfig);
  const sortValues = Object.values(sortConfig);
  const [sortPlaceholderText, ...sortOptionTexts] = await Promise.all([
    replaceKey('sort', getConfig()),
    ...(sortKeys.map((key) => replaceKey(key, getConfig()))),
  ]);
  const sortOptions = sortKeys.map((key, i) => {
    const sortedRecipe = new URLSearchParams(recipeParams);
    sortedRecipe.set('orderBy', sortConfig[key]);
    return {
      text: sortOptionTexts[i],
      recipe: sortedRecipe.toString(),
    };
  });
  const defaultIndex = Math.max(0, sortValues.indexOf(
    recipeParams.get('orderBy'),
  ));
  return { sortOptions, defaultIndex, sortPlaceholderText };
}

export default async function init(el) {
  [{ createTag, getConfig, getMetadata }, { replaceKey, replaceKeyArray }] = await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`)]);
  const [toolbar, recipeRow] = el.children;
  const includesSearchBar = el.classList.contains('search-bar');

  const heading = toolbar.querySelector('h1,h2,h3');
  if (heading) {
    heading.classList.add('heading');
    if (includesSearchBar) {
      heading.classList.add('centered-heading');
    }
    el.prepend(heading);
  }
  toolbar.classList.add('toolbar');
  if (includesSearchBar) {
    toolbar.classList.add('search-bar');
  }
  const recipe = recipeRow.textContent.trim();
  recipeRow.remove();

  // Extract optional 3rd paragraph from authored content for search-bar variant
  let optionalLabel = null;
  if (includesSearchBar) {
    const toolbarInner = toolbar.querySelector(':scope > div');
    const allParas = toolbarInner ? [...toolbarInner.querySelectorAll(':scope > p')] : [];
    if (allParas[1]) {
      [, optionalLabel] = allParas;
      optionalLabel.classList.add('controls-label');
      optionalLabel.remove();
    }

    // Load search-specific dependencies only for this variant
    const [
      { default: importedBlockMediator },
      {
        trackSearch: importedTrackSearch,
        updateImpressionCache: importedUpdateImpressionCache,
        generateSearchId: importedGenerateSearchId,
      },
    ] = await Promise.all([
      import('../../scripts/block-mediator.min.js'),
      import('../../scripts/template-search-api-v3.js'),
    ]);
    BlockMediator = importedBlockMediator;
    trackSearch = importedTrackSearch;
    updateImpressionCache = importedUpdateImpressionCache;
    generateSearchId = importedGenerateSearchId;
  }

  try {
    // TODO: lazy load templates
    const [
      { templatesContainer, updateTemplates, control: galleryControl },
      sortSetup,
    ] = await Promise.all([
      createTemplatesContainer(recipe, el, includesSearchBar),
      extractSort(recipe),
    ]);
    const { sortOptions, defaultIndex, sortPlaceholderText } = sortSetup;

    const dropdown = createDropdown(
      sortOptions,
      defaultIndex,
      updateTemplates,
      sortPlaceholderText,
    );

    const controlsContainer = createTag('div', { class: 'controls-container' });

    if (includesSearchBar) {
      // Right-pinned: filter + nav stacked vertically
      const rightControls = createTag('div', { class: 'right-controls' });
      rightControls.append(dropdown, galleryControl);
      if (optionalLabel) controlsContainer.append(optionalLabel);
      controlsContainer.append(rightControls);

      // Search bar sits above controls row
      const searchBarWrapper = await createSearchBarWrapper();
      await buildSearchDropdown(searchBarWrapper);
      toolbar.append(searchBarWrapper, controlsContainer);
      initSearchFunction(el, searchBarWrapper);
    } else {
      controlsContainer.append(dropdown, galleryControl);
      toolbar.append(controlsContainer);
    }

    el.append(templatesContainer);
  } catch (error) {
    window.lana?.log(`Error in template-x-carousel-toolbar: ${error?.message || error?.detail || error}`, { tags: 'template-x-carousel-toolbar', severity: 'error' });
    if (getConfig().env.name === 'prod') {
      el.remove();
    } else {
      el.textContent = 'Error loading templates, please refresh the page or try again later.';
    }
  }
}
