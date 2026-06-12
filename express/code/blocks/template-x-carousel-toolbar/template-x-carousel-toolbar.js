import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import { fetchResults, isValidTemplate } from '../../scripts/template-utils.js';
import renderTemplate from '../template-x/template-rendering.js';
import buildGallery from '../../scripts/widgets/gallery/gallery.js';

let createTag;
let getConfig;
let replaceKey;
let replaceKeyArray;
let trackSearch;
let updateImpressionCache;
let generateSearchId;

// Authored per-block overrides; populated during init() if the author provides them.
let authoredLoggedOutUrl = null;
let authoredLoggedInUrl = null;

const fromScratchFallbackLink = 'https://adobesparkpost.app.link/c4bWARQhWAb';

async function createTemplates(recipe, customProperties = null) {
  const res = await fetchResults(recipe);
  const validItems = res.items.filter((item) => isValidTemplate(item));
  const templates = await Promise.all(
    validItems.map((item) => renderTemplate(item, undefined, customProperties)),
  );
  templates.forEach((tplt, i) => {
    tplt.classList.add('template');
    tplt.dataset.templateId = validItems[i]?.id ?? '';
  });
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
    { intersectionThreshold: 0.9 },
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
        { intersectionThreshold: 0.9 },
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

// Redirects to the Express editor with `searchTerm` pre-filled.
// Authored URLs (authoredLoggedOutUrl / authoredLoggedInUrl) take precedence;
// the literal `<category>` token is replaced with the encoded search term.
function redirectToEditor(searchTerm) {
  const isLoggedIn = window.adobeIMS?.isSignedInUser();
  const term = searchTerm?.trim() || '';
  const navigate = window.t_locationAssign ?? ((u) => window.location.assign(u));

  const authoredTemplate = isLoggedIn ? authoredLoggedInUrl : authoredLoggedOutUrl;
  if (authoredTemplate) {
    const url = new URL(authoredTemplate);
    url.searchParams.set('q', term);
    navigate(url.toString());
    return;
  }

  const url = isLoggedIn
    ? new URL('https://new.express.adobe.com/explore/templates')
    : new URL('https://new.express.adobe.com/new?width=1080&height=1080&unit=px&aspectRatioLock=true&category=templates&taskID=standard-size-square');
  if (term) url.searchParams.set('q', term);
  navigate(url.toString());
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

  const redirectSearch = () => {
    updateImpressionCache({ collection: 'all-templates', content_category: 'templates' });
    trackSearch('search-inspire');
    redirectToEditor(searchBar.value);
  };

  const onSearchSubmit = async () => {
    const { sampleRUM } = await import(`${getLibs()}/utils/samplerum.js`);
    searchBar.disabled = true;
    sampleRUM('search', { source: el.dataset.blockName, target: searchBar.value }, 1);
    redirectSearch();
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
    Object.entries(trends).slice(0, 5).forEach(([key, value]) => {
      const trendLinkWrapper = createTag('li');
      // Keep the original templates-page href as a no-JS fallback.
      const trendLink = createTag('a', { class: 'trend-link', href: `${value}?searchId=${generateSearchId()}` });
      trendLink.textContent = key;
      trendLink.addEventListener('click', (e) => {
        e.preventDefault();
        updateImpressionCache({ keyword_filter: key, content_category: 'templates' });
        trackSearch('search-inspire', generateSearchId());
        redirectToEditor(key);
      });
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
  [{ createTag, getConfig }, { replaceKey, replaceKeyArray }] = await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`)]);
  authoredLoggedOutUrl = null;
  authoredLoggedInUrl = null;
  const isFullBleed = el.classList.contains('full-bleed');
  const isSeoLinks = el.classList.contains('seo-links');
  const includesSearchBar = el.classList.contains('search-bar');

  // Capture row references before any DOM manipulation (el.children is live)
  const [toolbar, recipeRow, ...additionalRows] = el.children;

  const heading = toolbar.querySelector('h1,h2,h3');
  if (heading) {
    heading.classList.add('heading');
    if (includesSearchBar || isSeoLinks) {
      heading.classList.add('centered-heading');
    }
    el.prepend(heading);
  }
  toolbar.classList.add('toolbar');
  if (includesSearchBar) {
    toolbar.classList.add('search-bar');
  }

  // SEO-links variant: search bar + link-button carousel, no templates
  if (isSeoLinks) {
    el.classList.add('search-bar');
    toolbar.classList.add('search-bar');
    try {
      const [
        ,
        {
          trackSearch: importedTrackSearch,
          updateImpressionCache: importedUpdateImpressionCache,
          generateSearchId: importedGenerateSearchId,
        },
      ] = await Promise.all([
        import('../../scripts/block-mediator.min.js'),
        import('../../scripts/template-search-api-v3.js'),
      ]);
      trackSearch = importedTrackSearch;
      updateImpressionCache = importedUpdateImpressionCache;
      generateSearchId = importedGenerateSearchId;

      // Collect authored link rows (all rows after toolbar row)
      const allLinkRows = recipeRow ? [recipeRow, ...additionalRows] : [...additionalRows];
      const links = [];
      allLinkRows.forEach((row) => {
        row.querySelectorAll('a').forEach((a) => links.push(a));
        row.remove();
      });

      // Build SEO link-button carousel
      const linksContainer = createTag('div', { class: 'seo-links-carousel' });
      links.forEach((a) => {
        a.classList.add('button', 'small', 'secondary');
        const p = createTag('p');
        p.append(a);
        linksContainer.append(p);
      });
      const { default: buildCarousel } = await import('../../scripts/widgets/carousel.js');
      buildCarousel('p', linksContainer);

      const searchBarWrapper = await createSearchBarWrapper();
      await buildSearchDropdown(searchBarWrapper);
      toolbar.append(searchBarWrapper);
      initSearchFunction(el, searchBarWrapper);
      el.append(linksContainer);
    } catch (error) {
      window.lana?.log(`Error in template-x-carousel-toolbar (seo-links): ${error?.message || error?.detail || error}`, { tags: 'template-x-carousel-toolbar', severity: 'error' });
      if (getConfig().env.name === 'prod') {
        el.remove();
      } else {
        el.textContent = 'Error loading SEO links, please refresh the page or try again later.';
      }
    }
    return;
  }

  const recipe = recipeRow.textContent.trim();
  recipeRow.remove();

  // Parse and remove any authored redirect-URL rows (logged-out / logged-in).
  // Rows after the first two follow the pattern: key cell | URL cell.
  [...el.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase();
    const url = cells[1].textContent.trim();
    if (key === 'logged-out') authoredLoggedOutUrl = url;
    else if (key === 'logged-in') authoredLoggedInUrl = url;
    else return;
    row.remove();
  });

  // Full-bleed variant: parse configured hover-CTA row, clean up empty toolbar
  let fullBleedCtaHref = '';
  let fullBleedCtaText = '';
  if (isFullBleed) {
    const ctaRow = [...el.children].find((c) => c !== toolbar && !c.matches('h1,h2,h3'));
    if (ctaRow) {
      const ctaLink = ctaRow.querySelector('a');
      if (ctaLink) {
        fullBleedCtaHref = ctaLink.href;
        fullBleedCtaText = ctaLink.textContent.trim();
      }
      ctaRow.remove();
    }
    if (!toolbar.textContent.trim()) toolbar.remove();
  }

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
      ,
      {
        trackSearch: importedTrackSearch,
        updateImpressionCache: importedUpdateImpressionCache,
        generateSearchId: importedGenerateSearchId,
      },
    ] = await Promise.all([
      import('../../scripts/block-mediator.min.js'),
      import('../../scripts/template-search-api-v3.js'),
    ]);
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
      isFullBleed ? Promise.resolve(null) : extractSort(recipe),
    ]);

    // Full-bleed variant: replace hover CTAs with configured link + templateId, nav below carousel
    if (isFullBleed) {
      templatesContainer.querySelectorAll('.template').forEach((tplt) => {
        const id = tplt.dataset.templateId;
        const href = fullBleedCtaHref
          ? `${fullBleedCtaHref}${id ? `?templateId=${encodeURIComponent(id)}` : ''}`
          : '';
        const btn = tplt.querySelector('.button-container a.button');
        if (btn && href) {
          btn.href = href;
          btn.textContent = fullBleedCtaText;
        }
        const ctaLink = tplt.querySelector('.cta-link');
        if (ctaLink && href) ctaLink.href = href;
        tplt.querySelector('.share-icon-wrapper')?.remove();
      });
      el.append(templatesContainer, galleryControl);
      return;
    }

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
