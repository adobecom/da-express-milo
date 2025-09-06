import {
  getLottie,
  lazyLoadLottiePlayer,
  toClassName,
  getIconElementDeprecated,
  fixIcons,
  getLibs,
} from '../../scripts/utils.js';
import { titleCase } from '../../scripts/utils/string.js';
import { createOptimizedPicture, transformLinkToAnimation } from '../../scripts/utils/media.js';
import { Masonry } from '../../scripts/widgets/masonry.js';
import buildCarousel from '../../scripts/widgets/carousel.js';
import {
  fetchTemplates,
  isValidTemplate,
  fetchTemplatesCategoryCount,
  gatherPageImpression,
  trackSearch,
  updateImpressionCache,
  generateSearchId,
} from '../../scripts/template-search-api-v3.js';
import fetchAllTemplatesMetadata from '../../scripts/utils/all-templates-metadata.js';
import renderTemplate from './template-rendering.js';
import isDarkOverlayReadable from '../../scripts/color-tools.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import buildGallery from '../../scripts/widgets/gallery/gallery.js';

let replaceKey; let replaceKeyArray;
let getMetadata; let createTag;
let getConfig;
let variant;

// currently running experiment
const TWO_ROW = 'tworow';

function wordStartsWithVowels(word) {
  return word.match('^[aieouâêîôûäëïöüàéèùœAIEOUÂÊÎÔÛÄËÏÖÜÀÉÈÙŒ].*');
}

function camelize(str) {
  return str.replace(/^\w|[A-Z]|\b\w/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase())).replace(/\s+/g, '');
}

function handlelize(str) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/(\W+|\s+)/g, '-') // Replace space and other characters by hyphen
    .replace(/--+/g, '-') // Replaces multiple hyphens by one hyphen
    .replace(/(^-+|-+$)/g, '') // Remove extra hyphens from beginning or end of the string
    .toLowerCase();
}

async function getTemplates(response, fallbackMsg, props) {
  const filtered = response.items.filter((item) => isValidTemplate(item));
  // Sort templates based on templateOrder if present
  if (props.templateOrder?.length > 0) {
    filtered.sort((a, b) => {
      const indexA = props.templateOrder.indexOf(a.id);
      const indexB = props.templateOrder.indexOf(b.id);
      // If both templates are in templateOrder, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only one template is in templateOrder, put it first
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // For templates not in templateOrder, maintain their original order
      return 0;
    });
  }
  const templates = await Promise.all(
    filtered.map(async (template) => renderTemplate(template, variant, props)),
  );
  await Promise.all(templates);
  return {
    fallbackMsg,
    templates,
  };
}

async function fetchAndRenderTemplates(props) {
  const [{ response, fallbackMsg }] = await Promise.all(
    [fetchTemplates(props)],
  );
  if (!response || !response.items || !Array.isArray(response.items)) {
    return { templates: null };
  }

  if ('_links' in response) {
    // eslint-disable-next-line no-underscore-dangle
    const nextQuery = response._links.next.href;
    const starts = new URLSearchParams(nextQuery).get('start').split(',');
    props.start = starts.join(',');
  } else {
    props.start = '';
  }

  props.total = response.metadata.totalHits;
  // eslint-disable-next-line no-return-await
  return await getTemplates(response, fallbackMsg, props);
}

async function processContentRow(block, props) {
  const templateTitle = createTag('div', { class: 'template-title' });
  const textWrapper = createTag('div', { class: 'text-wrapper' });
  textWrapper.innerHTML = props.contentRow.outerHTML;
  templateTitle.append(textWrapper);
  const aTags = templateTitle.querySelectorAll(':scope a');

  if (aTags.length > 0) {
    templateTitle.classList.add('with-link');
    aTags.forEach((aTag) => {
      aTag.className = 'template-title-link';
      const p = aTag.closest('p');
      const h4 = templateTitle.querySelector('h4');
      if (p) {
        templateTitle.append(p);
        p.className = 'view-all-link-wrapper';
      }
      if (h4) {
        aTag.setAttribute('aria-label', `${aTag.textContent.trim()} ${h4.textContent.trim()}`);
      }
    });

    if (textWrapper.children.length === 1 && (textWrapper.firstElementChild.tagName === 'A' || (
      textWrapper.firstElementChild.tagName === 'DIV' && textWrapper.firstElementChild.children.length === 1 && textWrapper.firstElementChild.firstElementChild.tagName === 'A'))) {
      templateTitle.classList.add('link-only');
    }
  }

  block.prepend(templateTitle);

  if (props.orientation.toLowerCase() === 'horizontal') templateTitle.classList.add('horizontal');
}

async function formatHeadingPlaceholder(props) {
  // special treatment for express/ root url
  const config = getConfig();
  const { region } = config.locale;
  const lang = config.locale.ietf;
  const templateCount = lang === 'es-ES' ? props.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : props.total.toLocaleString(lang);
  const templatePlaceholder = await replaceKey('template-placeholder', getConfig());
  let toolBarHeading = getMetadata('toolbar-heading') ? props.templateStats : templatePlaceholder;

  const templateSearchHeadingSingular = await replaceKey('template-search-heading-singular', getConfig());
  const templateSearchHeadingPlural = await replaceKey('template-search-heading-plural', getConfig());
  if (getMetadata('template-search-page') === 'Y'
    && templateSearchHeadingSingular !== 'template search heading singular'
    && templateSearchHeadingPlural !== 'template search heading plural') {
    // eslint-disable-next-line max-len
    toolBarHeading = props.total === 1 ? templateSearchHeadingSingular : templateSearchHeadingPlural;
  }

  if (toolBarHeading) {
    if (variant.includes('print')) {
      toolBarHeading = toolBarHeading
        .replace('{{quantity}}', props.fallbackMsg ? '0' : templateCount)
        .replace('quantity', props.fallbackMsg ? '0' : templateCount)
        .replace('{{Type}}', props['toolbar-Heading'])
        .replace('{{type}}', props['toolbar-Heading']);
      if (region === 'fr') {
        toolBarHeading.split(' ').forEach((word, index, words) => {
          if (index + 1 < words.length) {
            if (word === 'de' && wordStartsWithVowels(words[index + 1])) {
              words.splice(index, 2, `d'${words[index + 1].toLowerCase()}`);
              toolBarHeading = words.join(' ');
            }
          }
        });
      }
    } else {
      toolBarHeading = toolBarHeading
        .replace('{{quantity}}', props.fallbackMsg ? '0' : templateCount)
        .replace('quantity', props.fallbackMsg ? '0' : templateCount)
        .replace('{{Type}}', titleCase(getMetadata('short-title') || getMetadata('q') || getMetadata('topics') || ''))
        .replace('{{type}}', getMetadata('short-title') || getMetadata('q') || getMetadata('topics') || '');
      if (region === 'fr') {
        toolBarHeading.split(' ').forEach((word, index, words) => {
          if (index + 1 < words.length) {
            if (word === 'de' && wordStartsWithVowels(words[index + 1])) {
              words.splice(index, 2, `d'${words[index + 1].toLowerCase()}`);
              toolBarHeading = words.join(' ');
            }
          }
        });
      }
    }
  }

  return toolBarHeading;
}

function constructProps(block) {
  const props = {
    templates: [],
    filters: {
      locales: 'en',
      topics: '',
    },
    renditionParams: {
      format: 'jpg',
      size: 151,
    },
    tailButton: '',
    limit: 70,
    total: 0,
    start: '',
    collectionId: 'urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418',
    sort: '',
    masonry: undefined,
    headingTitle: null,
    headingSlug: null,
    viewAllLink: null,
    holidayIcon: null,
    backgroundColor: '#000B1D',
    backgroundAnimation: null,
    textColor: '#FFFFFF',
    loadedOtherCategoryCounts: false,
    templateOrder: [],
  };
  Array.from(block.children).forEach((row) => {
    const cols = row.querySelectorAll('div');
    const key = cols[0].querySelector('strong')?.textContent.trim().toLowerCase();
    if (cols.length === 1) {
      [props.contentRow] = cols;
    } else if (cols.length === 2) {
      let value = cols[1].textContent.trim();
      // Treat "null" as blank
      if (value.toLowerCase() === 'null') {
        value = '';
      }

      if (key && value) {
        // FIXME: facebook-post
        // Handle template order
        if (key === 'template order') {
          props.templateOrder = value.split(',').map((id) => id.trim());
        } else if (['tasks', 'topics', 'locales', 'behaviors'].includes(key) || (['premium', 'animated'].includes(key) && value.toLowerCase() !== 'all')) {
          props.filters[camelize(key)] = value;
        } else if (['yes', 'true', 'on', 'no', 'false', 'off'].includes(value.toLowerCase())) {
          props[camelize(key)] = ['yes', 'true', 'on'].includes(value.toLowerCase());
        } else if (key === 'collection id') {
          props[camelize(key)] = value.replaceAll('\\:', ':');
        } else {
          props[camelize(key)] = value;
        }
      }
    } else if (cols.length === 3) {
      if (key === 'template stats' && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())) {
        props[camelize(key)] = cols[2].textContent.trim();
      }
    } else if (cols.length === 4) {
      if (key === 'blank template') {
        cols[0].remove();
        props.templates.push(row);
      }
    } else if (cols.length === 5) {
      if (key === 'holiday block' && ['yes', 'true', 'on'].includes(cols[1].textContent.trim().toLowerCase())) {
        const backgroundColor = cols[3].textContent.trim().toLowerCase();
        let holidayIcon = cols[2].querySelector('picture');

        if (!holidayIcon) {
          const link = cols[2].querySelector('a');
          if (link && (link.href.endsWith('.svg') || link.href.endsWith('.png'))) {
            holidayIcon = createOptimizedPicture(link.href);
          }
        }
        const backgroundAnimation = cols[4].querySelector('a');

        props.holidayBlock = true;
        props.holidayIcon = holidayIcon || null;
        if (backgroundColor) {
          props.backgroundColor = backgroundColor;
        }
        props.backgroundAnimation = backgroundAnimation || null;
        props.textColor = isDarkOverlayReadable(backgroundColor) ? 'dark-text' : 'light-text';
      }
    }
  });
  return props;
}

const SHORT_PLACEHOLDER_HEIGHT_CUTOFF = 80;
const WIDE_PLACEHOLDER_RATIO_CUTOFF = 1.3;

function adjustPlaceholderDimensions(block, props, tmplt, option) {
  const sep = option.includes(':') ? ':' : 'x';
  const ratios = option.split(sep).map((e) => +e);
  props.placeholderFormat = ratios;
  if (!ratios[1]) return;
  if (block.classList.contains(TWO_ROW)) {
    // fixed width + height calculated at load time
    const width = Math.max(60, (window.innerWidth - 10) / 2);
    const height = Math.min(200, width / (ratios[0] / ratios[1]));
    if (height >= 100) tmplt.classList.add('tall');
    tmplt.style = `height: ${height}px`;
    return;
  }
  if (block.classList.contains('horizontal')) {
    const height = block.classList.contains('mini') ? 100 : 200;
    const width = (ratios[0] / ratios[1]) * height;
    tmplt.style = `width: ${width}px`;
    if (width / height > WIDE_PLACEHOLDER_RATIO_CUTOFF) {
      tmplt.classList.add('tall');
    }
  } else {
    const width = block.classList.contains('sixcols') || block.classList.contains('fullwidth') ? 165 : 200;
    const height = (ratios[1] / ratios[0]) * width;
    tmplt.style.height = `${height}px`;
    if (height < SHORT_PLACEHOLDER_HEIGHT_CUTOFF) tmplt.classList.add('short');
    if (width / height > WIDE_PLACEHOLDER_RATIO_CUTOFF) tmplt.classList.add('wide');
  }
}

function adjustTemplateDimensions(block, props, tmplt, isPlaceholder) {
  const overlayCell = tmplt.querySelector(':scope > div:last-of-type');
  const option = overlayCell.textContent.trim();
  if (!option) return;
  if (isPlaceholder) {
    // add aspect ratio to template
    adjustPlaceholderDimensions(block, props, tmplt, option);
  } else {
    // add icon to 1st cell
    const $icon = getIconElementDeprecated(toClassName(option));
    $icon.setAttribute('title', option);
    tmplt.children[0].append($icon);
  }
  overlayCell.remove();
}

function populateTemplates(block, props, templates) {
  for (let tmplt of templates) {
    const isPlaceholder = tmplt.querySelector(':scope > div:first-of-type > img[src*=".svg"], :scope > div:first-of-type > svg');
    const linkContainer = tmplt.querySelector(':scope > div:nth-of-type(2)');
    const rowWithLinkInFirstCol = tmplt.querySelector(':scope > div:first-of-type > a');
    const innerWrapper = block.querySelector('.template-x-inner-wrapper');

    if (innerWrapper && linkContainer) {
      const link = linkContainer.querySelector(':scope a');
      if (link && isPlaceholder) {
        const aTag = createTag('a', { href: link.href || '#' });
        aTag.append(...tmplt.children);
        tmplt.remove();
        tmplt = aTag;
        // convert A to SPAN
        const newLink = createTag('span', { class: 'template-link' });
        newLink.append(link.textContent.trim());
        linkContainer.innerHTML = '';
        linkContainer.append(newLink);
      }
      innerWrapper.append(tmplt);
    }

    if (rowWithLinkInFirstCol && !tmplt.querySelector('img')) {
      props.tailButton = rowWithLinkInFirstCol;
      rowWithLinkInFirstCol.remove();
    }

    if (tmplt.children.length === 3) {
      // look for options in last cell
      adjustTemplateDimensions(block, props, tmplt, isPlaceholder);
    }

    if (!tmplt.querySelectorAll(':scope > div > *').length) {
      // remove empty row
      tmplt.remove();
    }
    tmplt.classList.add('template');
    if (isPlaceholder) {
      tmplt.classList.add('placeholder');
    }
  }
}

function updateLoadMoreButton(props, loadMore) {
  if (props.start === '') {
    loadMore.style.display = 'none';
  } else {
    loadMore.style.removeProperty('display');
  }
}

function chunkPairs(arr) {
  return Array.from(
    { length: Math.ceil(arr.length / 2) },
    (_, i) => arr.slice(i * 2, i * 2 + 2),
  );
}

// WIP
async function build2by2(parentContainer, block) {
  // preserve placeholder
  const placeholder = parentContainer.querySelector('.placeholder');
  const oldCols = [...parentContainer.querySelectorAll('.template-2x2-col')];
  // cleanup
  oldCols.forEach((col) => col.remove());
  // break into 2 rows per column
  const pairs = chunkPairs([oldCols.length ? placeholder : null, ...parentContainer.querySelectorAll('.template')].filter(Boolean));
  const cols = pairs.map((pair) => createTag('div', { class: 'template-2x2-col' }, pair));
  parentContainer.append(...cols);
  const { control } = await buildGallery(cols, parentContainer);
  const oldControl = block.querySelector('.gallery-control');
  if (oldControl) {
    oldControl.replaceWith(control);
  } else {
    block.append(control);
  }
}

// WIP
async function decorateNewTemplates(block, props, options = { reDrawMasonry: false }) {
  const { templates: newTemplates } = await fetchAndRenderTemplates(props);
  updateImpressionCache({ result_count: props.total });
  const loadMore = block.parentElement.querySelector('.load-more');

  props.templates = props.templates.concat(newTemplates);
  populateTemplates(block, props, newTemplates);
  if (block.classList.contains(TWO_ROW)) {
    await build2by2(block.querySelector('.template-x-inner-wrapper'), block);
  }
  const newCells = Array.from(block.querySelectorAll('.template:not(.appear)'));

  const templateLinks = block.querySelectorAll('.template:not(.appear) .button-container > a, a.template.placeholder');
  templateLinks.isSearchOverride = true;
  const linksPopulated = new CustomEvent('linkspopulated', { detail: templateLinks });
  document.dispatchEvent(linksPopulated);

  if (props.masonry) {
    if (options.reDrawMasonry) {
      props.masonry.cells = [props.masonry.cells[0]].concat(newCells);
    } else {
      props.masonry.cells = props.masonry.cells.concat(newCells);
    }
    props.masonry.draw(newCells);
  }

  if (loadMore) {
    updateLoadMoreButton(props, loadMore);
  }
}

async function decorateLoadMoreButton(block, props) {
  const loadMoreDiv = createTag('div', { class: 'load-more' });
  const loadMoreButton = createTag('button', { class: 'load-more-button' });
  const loadMoreText = createTag('p', { class: 'load-more-text' });
  loadMoreDiv.append(loadMoreButton, loadMoreText);
  const loadMore = await replaceKey('load-more', getConfig());
  loadMoreText.textContent = loadMore === 'load more' ? '' : loadMore;
  block.append(loadMoreDiv);
  loadMoreButton.append(getIconElementDeprecated('plus-icon'));

  loadMoreButton.addEventListener('click', async () => {
    trackSearch('select-load-more', BlockMediator.get('templateSearchSpecs').search_id);
    loadMoreButton.classList.add('disabled');
    const scrollPosition = window.scrollY;
    await decorateNewTemplates(block, props);
    window.scrollTo({
      top: scrollPosition,
      left: 0,
      behavior: 'smooth',
    });
    loadMoreButton.classList.remove('disabled');
  });

  return loadMoreDiv;
}

async function attachFreeInAppPills(block) {
  const freeInAppText = await replaceKey('free-in-app', getConfig());

  const templateLinks = block.querySelectorAll('a.template');
  for (const templateLink of templateLinks) {
    if (!block.classList.contains('apipowered')
      && templateLink.querySelectorAll('.icon-premium').length <= 0
      && !templateLink.classList.contains('placeholder')
      && !templateLink.querySelector('.icon-free-badge')
      && freeInAppText !== 'free in app') {
      const $freeInAppBadge = createTag('span', { class: 'icon icon-free-badge' });
      $freeInAppBadge.textContent = freeInAppText;
      templateLink.querySelector('div').append($freeInAppBadge);
    }
  }
}

async function makeTemplateFunctions() {
  const [templateFilterPremium, templateFilterPremiumIcons, templateFilterAnimated, templateFilterAnimatedIcons, templateXSort, templateXSortIcons] = await replaceKeyArray(['template-filter-premium', 'template-filter-premium-icons', 'template-filter-animated', 'template-filter-animated-icons', 'template-x-sort', 'template-x-sort-icons'], getConfig());
  const functions = {
    premium: {
      placeholders: JSON.parse(templateFilterPremium !== 'template filter premium' ? templateFilterPremium : '{}'),
      elements: {},
      icons: (templateFilterPremiumIcons !== 'template filter premium icons' ? templateFilterPremiumIcons.replace(/\s/g, '')?.split(',') : undefined)
        || ['template-premium-and-free', 'template-free', 'template-premium'],
    },
    animated: {
      placeholders: JSON.parse(templateFilterAnimated !== 'template filter animated' ? templateFilterAnimated : '{}'),
      elements: {},
      icons: (templateFilterAnimatedIcons !== 'template filter animated icons' ? templateFilterAnimatedIcons.replace(/\s/g, '')?.split(',') : undefined)
        || ['template-static-and-animated', 'template-static', 'template-animated'],
    },
    sort: {
      placeholders: JSON.parse(templateXSort !== 'template x sort' ? templateXSort : '{}'),
      elements: {},
      icons: (templateXSortIcons !== 'template x sort icons' ? templateXSortIcons.replace(/\s/g, '')?.split(',') : undefined)
        || ['sort', 'visibility-on', 'visibility-off', 'order-dsc', 'order-asc'],
    },
  };

  Object.entries(functions).forEach((entry) => {
    entry[1].elements.wrapper = createTag('div', {
      class: `function-wrapper function-${entry[0]}`,
      'data-param': entry[0],
    });

    entry[1].elements.wrapper.subElements = {
      button: {
        wrapper: createTag('div', { class: `button-wrapper button-wrapper-${entry[0]}` }),
        subElements: {
          iconHolder: createTag('span', { class: 'icon-holder' }),
          textSpan: createTag('span', { class: `current-option current-option-${entry[0]}` }),
          chevIcon: getIconElementDeprecated('drop-down-arrow'),
        },
      },
      options: {
        wrapper: createTag('div', { class: `options-wrapper options-wrapper-${entry[0]}` }),
        subElements: Object.entries(entry[1].placeholders).map((option, subIndex) => {
          const icon = getIconElementDeprecated(entry[1].icons[subIndex]);
          const optionButton = createTag('div', { class: 'option-button', 'data-value': option[1] });
          [optionButton.textContent] = option;
          optionButton.prepend(icon);
          return optionButton;
        }),
      },
    };

    const $span = entry[1].elements.wrapper.subElements.button.subElements.textSpan;
    [[$span.textContent]] = Object.entries(entry[1].placeholders);
  });

  return functions;
}

function updateFilterIcon(block) {
  const functionWrapper = block.querySelectorAll('.function-wrapper');
  const optionsWrapper = block.querySelectorAll('.options-wrapper');

  functionWrapper.forEach((wrap, index) => {
    const iconHolder = wrap.querySelector('.icon-holder');
    const activeOption = optionsWrapper[index].querySelector('.option-button.active');
    if (iconHolder && activeOption) {
      const activeIcon = activeOption.querySelector('.icon');
      if (activeIcon) {
        iconHolder.innerHTML = activeIcon.outerHTML;
      }
    }
  });
}

async function decorateFunctionsContainer(block, functions) {
  const functionsContainer = createTag('div', { class: 'functions-container' });
  const functionContainerMobile = createTag('div', { class: 'functions-drawer' });

  Object.values(functions).forEach((filter) => {
    const filterWrapper = filter.elements.wrapper;

    Object.values(filterWrapper.subElements).forEach((part) => {
      const innerWrapper = part.wrapper;

      Object.values(part.subElements).forEach((innerElement) => {
        if (innerElement) {
          innerWrapper.append(innerElement);
        }
      });

      filterWrapper.append(innerWrapper);
    });
    functionContainerMobile.append(filterWrapper.cloneNode({ deep: true }));
    functionsContainer.append(filterWrapper);
  });

  // restructure drawer for mobile design
  const filterContainer = createTag('div', { class: 'filter-container-mobile' });
  const mobileFilterButtonWrapper = createTag('div', { class: 'filter-button-mobile-wrapper' });
  const mobileFilterButton = createTag('span', { class: 'filter-button-mobile' });
  const drawer = createTag('div', { class: 'filter-drawer-mobile hidden retracted' });
  const drawerInnerWrapper = createTag('div', { class: 'filter-drawer-mobile-inner-wrapper' });
  const drawerBackground = createTag('div', { class: 'drawer-background hidden transparent' });
  const $closeButton = getIconElementDeprecated('search-clear');
  const applyButtonWrapper = createTag('div', { class: 'apply-filter-button-wrapper hidden transparent' });
  const applyButton = createTag('a', { class: 'apply-filter-button button gradient', href: '#' });

  $closeButton.classList.add('close-drawer');
  const [applyFilters, free, versusShorthand, premium, staticP, animated, filter, sort] = await replaceKeyArray(['apply-filters', 'free', 'versus-shorthand', 'premium', 'static', 'animated', 'filter', 'sort'], getConfig());

  applyButton.textContent = applyFilters;

  functionContainerMobile.children[0]
    .querySelector('.current-option-premium')
    .textContent = `${free} ${versusShorthand} ${premium}`;

  functionContainerMobile.children[1]
    .querySelector('.current-option-animated')
    .textContent = `${staticP} ${versusShorthand} ${animated}`;

  drawerInnerWrapper.append(
    functionContainerMobile.children[0],
    functionContainerMobile.children[1],
  );

  drawer.append($closeButton, drawerInnerWrapper);

  const buttonsInDrawer = drawer.querySelectorAll('.button-wrapper');
  const optionsInDrawer = drawer.querySelectorAll('.options-wrapper');

  [buttonsInDrawer, optionsInDrawer].forEach((category) => {
    category.forEach((element) => {
      element.classList.add('in-drawer');
      const heading = element.querySelector('.current-option');
      const iconHolder = element.querySelector('.icon-holder');
      if (heading) {
        heading.className = 'filter-mobile-option-heading';
      }
      if (iconHolder) {
        iconHolder.remove();
      }
    });
  });

  mobileFilterButtonWrapper.append(getIconElementDeprecated('scratch-icon-22'), mobileFilterButton);
  applyButtonWrapper.append(applyButton);
  filterContainer.append(
    mobileFilterButtonWrapper,
    drawer,
    applyButtonWrapper,
    drawerBackground,
  );
  functionContainerMobile.prepend(filterContainer);

  mobileFilterButton.textContent = filter;
  const sortButton = functionContainerMobile.querySelector('.current-option-sort');
  if (sortButton) {
    sortButton.textContent = sort;
    sortButton.className = 'filter-mobile-option-heading';
  }

  return { mobile: functionContainerMobile, desktop: functionsContainer };
}

function updateLottieStatus(block) {
  const drawer = block.querySelector('.filter-drawer-mobile');
  const inWrapper = drawer.querySelector('.filter-drawer-mobile-inner-wrapper');
  const lottieArrows = drawer.querySelector('.lottie-wrapper');
  if (lottieArrows) {
    if (inWrapper.scrollHeight - inWrapper.scrollTop === inWrapper.offsetHeight) {
      lottieArrows.style.display = 'none';
      drawer.classList.remove('scrollable');
    } else {
      lottieArrows.style.removeProperty('display');
      drawer.classList.add('scrollable');
    }
  }
}

async function fetchCntSpan(props, anchor, lang) {
  const cntSpan = createTag('span', { class: 'category-list-template-count' });
  const cnt = await fetchTemplatesCategoryCount(props, anchor.dataset.tasks);
  cntSpan.textContent = `(${cnt.toLocaleString(lang)})`;
  return { cntSpan, anchor };
}

async function appendCategoryTemplatesCount(block, props) {
  if (props.loadedOtherCategoryCounts) {
    return;
  }
  props.loadedOtherCategoryCounts = true;
  const categories = block.querySelectorAll('ul.category-list > li');
  const lang = getConfig().locale.ietf;

  const fetchCntSpanPromises = [...categories]
    .map((li) => fetchCntSpan(props, li.querySelector('a'), lang));
  const res = await Promise.all(fetchCntSpanPromises);

  // append one by one to gain attention
  for (const { cntSpan, anchor } of res) {
    anchor.append(cntSpan);
    // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function decorateCategoryList(block, props) {
  const { prefix } = getConfig().locale;
  const mobileDrawerWrapper = block.querySelector('.filter-drawer-mobile');
  const drawerWrapper = block.querySelector('.filter-drawer-mobile-inner-wrapper');
  const xTaskCategories = await replaceKey('x-task-categories', getConfig());
  const categories = xTaskCategories !== 'x task categories' ? JSON.parse(xTaskCategories) : {};
  const taskCategoryIcons = await replaceKey('task-category-icons', getConfig());
  const categoryIcons = taskCategoryIcons !== 'task category icons' ? taskCategoryIcons.replace(/\s/g, '')?.split(',') : undefined;
  const categoriesDesktopWrapper = createTag('div', { class: 'category-list-wrapper' });
  const categoriesToggleWrapper = createTag('div', { class: 'category-list-toggle-wrapper' });
  const categoriesToggle = getIconElementDeprecated('drop-down-arrow');
  const categoriesListHeading = createTag('div', { class: 'category-list-heading' });
  const categoriesList = createTag('ul', { class: 'category-list' });

  const jumpToCategory = await replaceKey('jump-to-category', getConfig());
  categoriesListHeading.append(getIconElementDeprecated('template-search'), jumpToCategory);
  categoriesToggleWrapper.append(categoriesToggle);
  categoriesDesktopWrapper.append(categoriesToggleWrapper, categoriesListHeading, categoriesList);

  Object.entries(categories).forEach((category, index) => {
    const format = `${props.placeholderFormat[0]}:${props.placeholderFormat[1]}`;
    const targetTasks = category[1];
    const currentTasks = props.filters.tasks ? props.filters.tasks : "''";
    const currentTopic = props.filters.topics || props.q;

    const listItem = createTag('li');
    if (category[1] === currentTasks) {
      listItem.classList.add('active');
    }

    let icon;
    if (categoryIcons[index] && categoryIcons[index] !== '') {
      icon = categoryIcons[index];
    } else {
      icon = 'template-static';
    }

    const iconElement = getIconElementDeprecated(icon);
    const a = createTag('a', {
      'data-tasks': targetTasks,
      'data-topics': currentTopic || '',
      href: `${prefix}/express/templates/search?tasks=${targetTasks}&tasksx=${targetTasks}&phformat=${format}&topics=${currentTopic || "''"}&q=${currentTopic || ''}&searchId=${generateSearchId()}`,
    });
    [a.textContent] = category;

    a.prepend(iconElement);
    listItem.append(a);
    categoriesList.append(listItem);
    a.addEventListener('click', () => {
      updateImpressionCache({
        category_filter: a.dataset.tasks,
        collection: a.dataset.topics,
        collection_path: window.location.pathname,
        content_category: 'templates',
      });
      trackSearch('search-inspire', new URLSearchParams(new URL(a.href).search).get('searchId'));
    }, { passive: true });
  });

  categoriesDesktopWrapper.addEventListener('mouseover', () => {
    appendCategoryTemplatesCount(block, props);
  }, { once: true });

  const categoriesMobileWrapper = categoriesDesktopWrapper.cloneNode({ deep: true });
  const mobileJumpCategoryLinks = categoriesMobileWrapper.querySelectorAll('.category-list > li > a');
  mobileJumpCategoryLinks.forEach((a) => {
    a.addEventListener('click', () => {
      updateImpressionCache({
        search_keyword: a.dataset.tasks,
        collection: a.dataset.topics,
        collection_path: window.location.pathname,
        content_category: 'templates',
      });
      trackSearch('search-inspire', new URLSearchParams(new URL(a.href).search).get('searchId'));
    }, { passive: true });
  });
  const mobileCategoriesToggle = createTag('span', { class: 'category-list-toggle' });
  mobileCategoriesToggle.textContent = jumpToCategory !== 'jump to category' ? jumpToCategory : '';
  categoriesMobileWrapper.querySelector('.category-list-toggle-wrapper > .icon')?.replaceWith(mobileCategoriesToggle);
  const lottieArrows = createTag('a', { class: 'lottie-wrapper' });
  mobileDrawerWrapper.append(lottieArrows);
  drawerWrapper.append(categoriesMobileWrapper);
  lottieArrows.innerHTML = getLottie('purple-arrows', '/express/code/icons/purple-arrows.json');
  lazyLoadLottiePlayer();

  block.prepend(categoriesDesktopWrapper);
  block.classList.add('with-categories-list');

  const toggleButton = categoriesMobileWrapper.querySelector('.category-list-toggle-wrapper');
  toggleButton.append(getIconElementDeprecated('drop-down-arrow'));
  toggleButton.addEventListener('click', () => {
    const listWrapper = toggleButton.parentElement;
    toggleButton.classList.toggle('collapsed');
    if (toggleButton.classList.contains('collapsed')) {
      if (listWrapper.classList.contains('desktop-only')) {
        listWrapper.classList.add('collapsed');
        listWrapper.style.maxHeight = '40px';
      } else {
        listWrapper.classList.add('collapsed');
        listWrapper.style.maxHeight = '24px';
      }
    } else {
      listWrapper.classList.remove('collapsed');
      listWrapper.style.maxHeight = '1000px';
    }

    setTimeout(() => {
      if (!listWrapper.classList.contains('desktop-only')) {
        updateLottieStatus(block);
      }
    }, 510);
  }, { passive: true });

  lottieArrows.addEventListener('click', () => {
    drawerWrapper.scrollBy({
      top: 300,
      behavior: 'smooth',
    });
  }, { passive: true });

  drawerWrapper.addEventListener('scroll', () => {
    updateLottieStatus(block);
  }, { passive: true });

  if (variant.includes('flyer')
  || variant.includes('t-shirt')
  || variant.includes('print')) {
    categoriesDesktopWrapper.remove();
  }
}

function closeDrawer(toolBar) {
  const drawerBackground = toolBar.querySelector('.drawer-background');
  const drawer = toolBar.querySelector('.filter-drawer-mobile');
  const applyButton = toolBar.querySelector('.apply-filter-button-wrapper');

  drawer.classList.add('retracted');
  drawerBackground.classList.add('transparent');
  applyButton.classList.add('transparent');

  setTimeout(() => {
    drawer.classList.add('hidden');
    drawerBackground.classList.add('hidden');
    applyButton.classList.add('hidden');
  }, 500);
}

function updateOptionsStatus(block, props, toolBar) {
  const wrappers = toolBar.querySelectorAll('.function-wrapper');
  const waysOfSort = {
    'Most Relevant': '',
    'Most Viewed': '&orderBy=-remixCount',
    'Rare & Original': '&orderBy=remixCount',
    'Newest to Oldest': '&orderBy=-createDate',
    'Oldest to Newest': '&orderBy=createDate',
  };

  wrappers.forEach((wrapper) => {
    const currentOption = wrapper.querySelector('.current-option');
    const options = wrapper.querySelectorAll('.option-button');

    options.forEach((option) => {
      const paramType = wrapper.dataset.param;
      const paramValue = option.dataset.value;
      const filterValue = props.filters[paramType] ? props.filters[paramType] : 'remove';
      const sortValue = waysOfSort[props[paramType]] || props[paramType];

      if (filterValue === paramValue || sortValue === paramValue) {
        if (currentOption) {
          currentOption.textContent = option.textContent;
        }

        options.forEach((o) => {
          if (option !== o) {
            o.classList.remove('active');
          }
        });

        option.classList.add('active');
      }
    });

    updateFilterIcon(block);
  });
}

function initDrawer(block, props, toolBar) {
  const filterButton = toolBar.querySelector('.filter-button-mobile-wrapper');
  const drawerBackground = toolBar.querySelector('.drawer-background');
  const drawer = toolBar.querySelector('.filter-drawer-mobile');
  const closeDrawerBtn = toolBar.querySelector('.close-drawer');
  const applyButton = toolBar.querySelector('.apply-filter-button-wrapper');

  const functionWrappers = drawer.querySelectorAll('.function-wrapper');

  let currentFilters;
  filterButton.addEventListener('click', () => {
    appendCategoryTemplatesCount(block, props);
  }, { once: true });
  filterButton.addEventListener('click', () => {
    currentFilters = { ...props.filters };
    drawer.classList.remove('hidden');
    drawerBackground.classList.remove('hidden');
    applyButton.classList.remove('hidden');
    updateLottieStatus(block);

    setTimeout(() => {
      drawer.classList.remove('retracted');
      drawerBackground.classList.remove('transparent');
      applyButton.classList.remove('transparent');
      functionWrappers.forEach((wrapper) => {
        const button = wrapper.querySelector('.button-wrapper');
        if (button) {
          button.style.maxHeight = `${button.nextElementSibling.offsetHeight}px`;
        }
      });
    }, 100);
  }, { passive: true });

  [drawerBackground, closeDrawerBtn].forEach((el) => {
    el.addEventListener('click', async () => {
      props.filters = { ...currentFilters };
      closeDrawer(toolBar);
      updateOptionsStatus(block, props, toolBar);
    }, { passive: true });
  });

  drawer.classList.remove('hidden');
  functionWrappers.forEach((wrapper) => {
    const button = wrapper.querySelector('.button-wrapper');
    let maxHeight;
    if (button) {
      const wrapperMaxHeightGrabbed = setInterval(() => {
        if (wrapper.offsetHeight > 0) {
          maxHeight = `${wrapper.offsetHeight}px`;
          wrapper.style.maxHeight = maxHeight;
          clearInterval(wrapperMaxHeightGrabbed);
        }
      }, 200);

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const btnWrapper = wrapper.querySelector('.button-wrapper');
        if (btnWrapper) {
          const minHeight = `${btnWrapper.offsetHeight - 8}px`;
          wrapper.classList.toggle('collapsed');
          wrapper.style.maxHeight = wrapper.classList.contains('collapsed') ? minHeight : maxHeight;
        }
      });
    }
  });

  drawer.classList.add('hidden');
}

function updateQuery(functionWrapper, props, option) {
  const paramType = functionWrapper.dataset.param;
  const paramValue = option.dataset.value;

  if (paramType === 'sort') {
    props.sort = paramValue;
    // Clear template order when user selects a sort option
    props.templateOrder = [];
  } else {
    const filtersObj = props.filters;

    if (paramType in filtersObj) {
      if (paramValue === 'remove') {
        delete filtersObj[paramType];
      } else {
        filtersObj[paramType] = `${paramValue}`;
      }
    } else if (paramValue !== 'remove') {
      filtersObj[paramType] = `${paramValue}`;
    }

    props.filters = filtersObj;
  }
}

async function redrawTemplates(block, props, toolBar) {
  const heading = toolBar.querySelector('h2');
  const currentTotal = props.total.toLocaleString('en-US');
  props.templates = [props.templates[0]];
  props.start = '';
  block.querySelectorAll('.template:not(.placeholder)').forEach((card) => {
    card.remove();
  });

  await decorateNewTemplates(block, props, { reDrawMasonry: !block.classList.contains(TWO_ROW) });

  heading.textContent = heading.textContent.replace(`${currentTotal}`, props.total.toLocaleString('en-US'));
  updateOptionsStatus(block, props, toolBar);
  if (block.querySelectorAll('.template').length <= 0) {
    const $viewButtons = toolBar.querySelectorAll('.view-toggle-button');
    $viewButtons.forEach((button) => {
      button.classList.remove('active');
    });
    ['sm-view', 'md-view', 'lg-view'].forEach((className) => {
      block.classList.remove(className);
    });
  }
}

function parseOrderBy(queryString) {
  let orderType = 'relevancy';
  let orderDirection = 'descending';

  if (!queryString) {
    return {
      orderType,
      orderDirection,
    };
  }

  const parts = queryString.split('=');

  if (parts[1]?.startsWith('-')) {
    orderDirection = 'descending';
    orderType = parts[1].substring(1);
  } else {
    orderDirection = 'ascending';
    [, orderType] = parts;
  }

  return {
    orderType,
    orderDirection,
  };
}

async function initFilterSort(block, props, toolBar) {
  const buttons = toolBar.querySelectorAll('.button-wrapper');
  const applyFilterButton = toolBar.querySelector('.apply-filter-button');
  let existingProps = { ...props, filters: { ...props.filters } };

  if (buttons.length > 0) {
    buttons.forEach((button) => {
      const wrapper = button.parentElement;
      const currentOption = wrapper.querySelector('span.current-option');
      const optionsList = button.nextElementSibling;
      const options = optionsList.querySelectorAll('.option-button');

      button.addEventListener('click', () => {
        existingProps = { ...props, filters: { ...props.filters } };
        if (!button.classList.contains('in-drawer')) {
          buttons.forEach((b) => {
            if (button !== b) {
              b.parentElement.classList.remove('opened');
            }
          });

          wrapper.classList.toggle('opened');
        }
      }, { passive: true });

      options.forEach((option) => {
        const updateOptions = () => {
          buttons.forEach((b) => {
            b.parentElement.classList.remove('opened');
          });

          if (currentOption) {
            currentOption.textContent = option.textContent;
          }

          options.forEach((o) => {
            if (option !== o) {
              o.classList.remove('active');
            }
          });
          option.classList.add('active');
        };

        option.addEventListener('click', async (e) => {
          e.stopPropagation();
          updateOptions();
          updateQuery(wrapper, props, option);
          updateFilterIcon(block);

          if (!button.classList.contains('in-drawer') && JSON.stringify(props) !== JSON.stringify(existingProps)) {
            const sortObj = parseOrderBy(props.sort);
            updateImpressionCache({
              ...gatherPageImpression(props),
              ...{
                search_type: 'adjust-filter',
                search_keyword: 'change filters, no keyword found',
                sort_type: sortObj.orderType,
                sort_order: sortObj.orderDirection,
                content_category: 'templates',
              },
            });
            trackSearch('search-inspire');
            await redrawTemplates(block, props, toolBar);
            trackSearch('view-search-result', BlockMediator.get('templateSearchSpecs').search_id);
          }
        });
      });

      document.addEventListener('click', (e) => {
        const { target } = e;
        if (target !== wrapper && !wrapper.contains(target) && !button.classList.contains('in-drawer')) {
          wrapper.classList.remove('opened');
        }
      }, { passive: true });
    });

    if (applyFilterButton) {
      applyFilterButton.addEventListener('click', async (e) => {
        e.preventDefault();
        if (JSON.stringify(props) !== JSON.stringify(existingProps)) {
          const sortObj = parseOrderBy(props.sort);
          updateImpressionCache({
            ...gatherPageImpression(props),
            ...{
              search_type: 'adjust-filter',
              search_keyword: 'change filters, no keyword found',
              sort_type: sortObj.orderType,
              sort_order: sortObj.orderDirection,
              content_category: 'templates',
            },
          });
          trackSearch('search-inspire');
          await redrawTemplates(block, props, toolBar);
        }

        closeDrawer(toolBar);
      });
    }

    // sync current filter & sorting method with toolbar current options
    updateOptionsStatus(block, props, toolBar);
  }
}

function getPlaceholderWidth(block) {
  let width;
  if (window.innerWidth >= 900) {
    if (block.classList.contains('sm-view')) {
      width = 165;
    }

    if (block.classList.contains('md-view')) {
      width = 258.5;
    }

    if (block.classList.contains('lg-view')) {
      width = 352;
    }
  } else if (window.innerWidth >= 600) {
    if (block.classList.contains('sm-view')) {
      width = 165;
    }

    if (block.classList.contains('md-view')) {
      width = 227.33;
    }

    if (block.classList.contains('lg-view')) {
      width = 352;
    }
  } else {
    if (block.classList.contains('sm-view')) {
      width = 106.33;
    }

    if (block.classList.contains('md-view')) {
      width = 165.5;
    }

    if (block.classList.contains('lg-view')) {
      width = 335;
    }
  }

  return width;
}

function toggleMasonryView(block, props, button, toggleButtons) {
  const blockEl = block.closest('.template-x');
  blockEl.classList.add('template-x-wrapper');
  const templatesToView = block.querySelectorAll('.template:not(.placeholder)');
  const blockWrapper = blockEl.closest('.template-x-wrapper');

  if (!button.classList.contains('active') && templatesToView.length > 0) {
    toggleButtons.forEach((b) => {
      if (b !== button) {
        b.classList.remove('active');
      }
    });

    ['sm-view', 'md-view', 'lg-view'].forEach((className) => {
      if (className !== `${button.dataset.view}-view`) {
        block.classList.remove(className);
        blockWrapper.classList.remove(className);
      }
    });
    button.classList.add('active');
    block.classList.add(`${button.dataset.view}-view`);
    blockWrapper.classList.add(`${button.dataset.view}-view`);

    props.masonry.draw();
  }

  const placeholder = block.querySelector('.template.placeholder');
  const ratios = props.placeholderFormat;
  const width = getPlaceholderWidth(block);

  if (ratios[1]) {
    const height = (ratios[1] / ratios[0]) * width;
    placeholder.style = `height: ${height - 21}px`;
    if (width / height > 1.3) {
      placeholder.classList.add('wide');
    }
  }
}

const views = ['sm', 'md', 'lg'];
function getInitialViewIndex(props) {
  const authoredViewIndex = views.findIndex(
    (size) => props.initialTemplateView?.toLowerCase().trim() === size,
  );
  return authoredViewIndex === -1 ? 0 : authoredViewIndex;
}

function initViewToggle(block, props, toolBar) {
  const toggleButtons = toolBar.querySelectorAll('.view-toggle-button ');
  const initViewIndex = getInitialViewIndex(props);

  toggleButtons.forEach((button, index) => {
    if (index === initViewIndex) {
      toggleMasonryView(block, props, button, toggleButtons);
    }

    button.addEventListener('click', () => {
      toggleMasonryView(block, props, button, toggleButtons);
    }, { passive: true });
  });
}

function initToolbarShadow(toolbar) {
  const toolbarWrapper = toolbar.parentElement;
  document.addEventListener('scroll', () => {
    if (toolbarWrapper.getBoundingClientRect().top <= 0) {
      toolbarWrapper.classList.add('with-box-shadow');
    } else {
      toolbarWrapper.classList.remove('with-box-shadow');
    }
  });
}

function buildViewsWrapper() {
  const viewsWrapper = createTag('div', { class: 'views' });
  const smView = createTag('a', { class: 'view-toggle-button small-view', 'data-view': 'sm' });
  smView.append(getIconElementDeprecated('small_grid'));
  const mdView = createTag('a', { class: 'view-toggle-button medium-view', 'data-view': 'md' });
  mdView.append(getIconElementDeprecated('medium_grid'));
  const lgView = createTag('a', { class: 'view-toggle-button large-view', 'data-view': 'lg' });
  lgView.append(getIconElementDeprecated('large_grid'));
  viewsWrapper.append(smView, mdView, lgView);
  return viewsWrapper;
}

async function decorateToolbar(block, props) {
  const sectionHeading = createTag('h2');
  const tBarWrapper = createTag('div', { class: 'toolbar-wrapper' });
  const tBar = createTag('div', { class: 'api-templates-toolbar' });
  const contentWrapper = createTag('div', { class: 'wrapper-content-search' });
  const functionsWrapper = createTag('div', { class: 'wrapper-functions' });

  if (props.templateStats) {
    sectionHeading.textContent = await formatHeadingPlaceholder(props) || '';
  }

  block.prepend(tBarWrapper);
  try {
    const { getGnavHeight } = await import(`${getLibs()}/blocks/global-navigation/utilities/utilities.js`);
    const gnavHeight = getGnavHeight();
    tBarWrapper.style.top = `${gnavHeight}px`;
  } catch (e) {
    window.lana?.log(`Error getting gnav height ${e}`);
  }

  tBarWrapper.append(tBar);
  tBar.append(contentWrapper, functionsWrapper);
  contentWrapper.append(sectionHeading);

  if (tBar) {
    const viewsWrapper = buildViewsWrapper();

    const functionsObj = await makeTemplateFunctions();
    const functions = await decorateFunctionsContainer(block, functionsObj);

    if (!block.classList.contains(TWO_ROW)) functionsWrapper.append(viewsWrapper);
    functionsWrapper.append(functions.desktop);

    tBar.append(contentWrapper, functionsWrapper, functions.mobile);

    initDrawer(block, props, tBar);
    initFilterSort(block, props, tBar);
    if (block.classList.contains(TWO_ROW)) {
      const initialViewIndex = getInitialViewIndex(props);
      block.classList.add(`${views[initialViewIndex]}-view`);
    } else {
      initViewToggle(block, props, tBar);
    }
    initToolbarShadow(tBar);
  }
}

function initExpandCollapseToolbar(block, templateTitle, toggle, toggleChev) {
  const onToggle = () => {
    block.classList.toggle('expanded');

    if (document.body.dataset.device === 'mobile' || block.classList.contains('mobile')) {
      const tglBtn = block.querySelector('.toggle-button');
      const heading = templateTitle.querySelector('.toggle-bar-top > h4');

      if (tglBtn && heading) {
        const rect = heading.getBoundingClientRect();
        if (!block.classList.contains('expanded')) {
          tglBtn.style.marginLeft = `${rect.x}px`;
        } else {
          tglBtn.style.removeProperty('margin-left');
        }
      }
    }
  };
  const templateImages = block.querySelectorAll('.template');

  templateImages.forEach((template) => {
    template.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  toggleChev.addEventListener('click', onToggle);
  toggle.addEventListener('click', () => onToggle());
  document.addEventListener('click', (e) => {
    if (e.target.closest('.carousel-fader-right') || e.target.closest('.carousel-fader-left')) {
      return;
    }
    if (e.target.closest('.template-x.holiday') || (
      block.classList.contains('expanded')
    )) {
      onToggle();
    }
  });

  setTimeout(() => {
    if (block.classList.contains('auto-expand')) {
      onToggle();
    }
  }, 3000);
}

function decorateHoliday(block, props) {
  const main = document.querySelector('main');
  const templateXSection = block.closest('div[class="section"]');
  const mobileViewport = window.innerWidth < 901;
  const templateTitle = block.querySelector('.template-title');
  const toggleBar = templateTitle.querySelector('div');
  const heading = templateTitle.querySelector('h4');
  const subheading = templateTitle.querySelector('p');
  const link = templateTitle.querySelector('.template-title-link');
  const linkWrapper = link.closest('p');
  const toggle = createTag('div', { class: 'toggle-button' });
  const topElements = createTag('div', { class: 'toggle-bar-top' });
  const bottomElements = createTag('div', { class: 'toggle-bar-bottom' });
  const toggleChev = createTag('div', { class: 'toggle-button-chev' });

  if (props.holidayIcon) topElements.append(props.holidayIcon);
  if (props.backgroundAnimation) {
    const animation = transformLinkToAnimation(props.backgroundAnimation);
    block.classList.add('animated');
    block.prepend(animation);
  }

  if (templateXSection && templateXSection.querySelectorAll(':scope > div').length === 1) main.classList.add('with-holiday-templates-banner');
  block.classList.add(props.textColor);
  toggleBar.classList.add('toggle-bar');
  topElements.append(heading);
  toggle.append(link, toggleChev);
  linkWrapper.remove();
  bottomElements.append(subheading);
  toggleBar.append(topElements, bottomElements);
  block.style.backgroundColor = props.backgroundColor;

  if (mobileViewport) {
    block.classList.add('mobile');
    block.append(toggle);
  } else {
    toggleBar.append(toggle);
  }

  initExpandCollapseToolbar(block, templateTitle, toggle, toggleChev);
}

async function decorateTemplates(block, props) {
  const impression = gatherPageImpression(props);
  updateImpressionCache(impression);
  const innerWrapper = block.querySelector('.template-x-inner-wrapper');

  let rows = block.children.length;

  const templates = Array.from(innerWrapper.children);
  rows = templates.length;
  let breakpoints = [{ width: '400' }];

  if (rows > 6 && !block.classList.contains('horizontal')) {
    innerWrapper.classList.add('masonry');
  }

  if (rows === 1) {
    block.classList.add('large');
    breakpoints = [{
      media: '(min-width: 600px)',
      width: '2000',
    }, { width: '750' }];
  }

  block.querySelectorAll(':scope picture > img').forEach((img) => {
    const { src, alt } = img;
    img.parentNode.replaceWith(createOptimizedPicture(src, alt, true, breakpoints));
  });

  // find the edit link and turn the template DIV into the A
  // A
  // +- DIV
  //    +- PICTURE
  // +- DIV
  //    +- SPAN
  //       +- "Edit this template"
  //
  // make copy of children to avoid modifying list while looping

  populateTemplates(block, props, templates);
  if (props.orientation.toLowerCase() !== 'horizontal') {
    if (rows > 6 || block.classList.contains('sixcols') || block.classList.contains('fullwidth')) {
      /* flex masonry */

      if (innerWrapper) {
        const cells = Array.from(innerWrapper.children);
        innerWrapper.classList.remove('masonry');
        innerWrapper.classList.add('flex-masonry');
        props.masonry = new Masonry(innerWrapper, cells);
      } else {
        block.remove();
      }

      props.masonry.draw();
      window.addEventListener('resize', () => {
        props.masonry.draw();
      });
    } else {
      block.classList.add('template-x-complete');
    }
  }

  await attachFreeInAppPills(block);

  const searchId = new URLSearchParams(window.location.search).get('searchId');
  updateImpressionCache({
    search_keyword: getMetadata('q') || getMetadata('topics-x') || getMetadata('topics'),
    result_count: props.total,
    content_category: 'templates',
  });
  if (searchId) trackSearch('view-search-result', searchId);

  const templateLinks = block.querySelectorAll('.template .button-container > a, a.template.placeholder');
  templateLinks.isSearchOverride = true;
  const linksPopulated = new CustomEvent('linkspopulated', { detail: templateLinks });
  document.dispatchEvent(linksPopulated);
}

async function decorateBreadcrumbs(block) {
  // breadcrumbs are desktop-only
  if (document.body.dataset.device !== 'desktop') return;
  const { default: getBreadcrumbs } = await import('./breadcrumbs.js');
  const breadcrumbs = await getBreadcrumbs(createTag, getMetadata, getConfig);
  if (breadcrumbs) block.prepend(breadcrumbs);
}

function cycleThroughSuggestions(block, targetIndex = 0) {
  const suggestions = block.querySelectorAll('.suggestions-list li');
  if (targetIndex >= suggestions.length || targetIndex < 0) return;
  if (suggestions.length > 0) suggestions[targetIndex].focus();
}

function importSearchBar(block, blockMediator) {
  blockMediator.subscribe('stickySearchBar', (e) => {
    const parent = block.querySelector('.api-templates-toolbar .wrapper-content-search');
    if (parent) {
      const existingStickySearchBar = parent.querySelector('.search-bar-wrapper');
      if (e.newValue.loadSearchBar && !existingStickySearchBar) {
        const searchWrapper = e.newValue.element;
        parent.prepend(searchWrapper);
        searchWrapper.classList.add('show');
        searchWrapper.classList.add('collapsed');

        const searchDropdown = searchWrapper.querySelector('.search-dropdown-container');
        const searchForm = searchWrapper.querySelector('.search-form');
        const searchBar = searchWrapper.querySelector('input.search-bar');
        const clearBtn = searchWrapper.querySelector('.icon-search-clear');
        const trendsContainer = searchWrapper.querySelector('.trends-container');
        const suggestionsContainer = searchWrapper.querySelector('.suggestions-container');
        const suggestionsList = searchWrapper.querySelector('.suggestions-list');

        searchBar.addEventListener('click', (event) => {
          event.stopPropagation();
          searchWrapper.classList.remove('collapsed');
          setTimeout(() => {
            searchDropdown.classList.remove('hidden');
          }, 500);
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

        searchBar.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowDown' || event.keyCode === 40) {
            event.preventDefault();
            cycleThroughSuggestions(block);
          }
        });

        document.addEventListener('click', (event) => {
          const { target } = event;
          if (target !== searchWrapper && !searchWrapper.contains(target)) {
            searchWrapper.classList.add('collapsed');
            searchDropdown.classList.add('hidden');
            searchBar.value = '';
            suggestionsList.innerHTML = '';
            trendsContainer.classList.remove('hidden');
            suggestionsContainer.classList.add('hidden');
            clearBtn.style.display = 'none';
          }
        }, { passive: true });

        const redirectSearch = async () => {
          const xTaskNameMapping = await replaceKey('x-task-name-mapping', getConfig());
          const taskMap = xTaskNameMapping !== 'x task name mapping' ? JSON.parse(xTaskNameMapping) : {};

          const format = getMetadata('placeholder-format');
          let currentTasks = '';
          let searchInput = searchBar.value.toLowerCase() || getMetadata('topics');

          const tasksFoundInInput = Object.entries(taskMap)
            .filter((task) => task[1].some((word) => {
              const searchValue = searchBar.value.toLowerCase();
              return searchValue.indexOf(word.toLowerCase()) >= 0;
            })).sort((a, b) => b[0].length - a[0].length);

          if (tasksFoundInInput.length > 0) {
            tasksFoundInInput[0][1].sort((a, b) => b.length - a.length).forEach((word) => {
              searchInput = searchInput.toLowerCase().replace(word.toLowerCase(), '');
            });

            searchInput = searchInput.trim();
            [[currentTasks]] = tasksFoundInInput;
          }
          updateImpressionCache({ collection: currentTasks || 'all-templates', content_category: 'templates' });
          trackSearch('search-inspire');

          const { prefix } = getConfig().locale;
          const topicUrl = searchInput ? `/${searchInput}` : '';
          const taskUrl = `/${handlelize(currentTasks.toLowerCase())}`;
          const targetPath = `${prefix}/express/templates${taskUrl}${topicUrl}`;
          const searchId = BlockMediator.get('templateSearchSpecs').search_id;
          const allTemplatesMetadata = await fetchAllTemplatesMetadata(getConfig);
          const pathMatch = (event) => event.url === targetPath;
          let targetLocation;

          if (allTemplatesMetadata.some(pathMatch)) {
            targetLocation = `${window.location.origin}${targetPath}?searchId=${searchId || ''}`;
          } else {
            const searchUrlTemplate = `/express/templates/search?tasks=${currentTasks}&phformat=${format}&topics=${searchInput || "''"}&q=${searchInput || "''"}&searchId=${searchId || ''}`;
            targetLocation = `${window.location.origin}${prefix}${searchUrlTemplate}`;
          }
          window.location.assign(targetLocation);
        };

        const onSearchSubmit = async () => {
          searchBar.disabled = true;
          await redirectSearch();
        };

        const handleSubmitInteraction = async (item, index) => {
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
        };

        searchForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          searchBar.disabled = true;
          updateImpressionCache({
            status_filter: 'free',
            type_filter: 'all',
            collection: 'all-templates',
            search_type: 'direct',
            search_keyword: searchBar.value || 'empty search',
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
                if (item.query === searchBar.value) return;
                searchBar.value = item.query;
                searchBar.dispatchEvent(new Event('input'));
                await handleSubmitInteraction(item, index);
              });

              li.addEventListener('keydown', async (event) => {
                if (event.key === 'Enter' || event.keyCode === 13) {
                  await handleSubmitInteraction(item, index);
                }
              });

              li.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowDown' || event.keyCode === 40) {
                  event.preventDefault();
                  cycleThroughSuggestions(block, index + 1);
                }
              });

              li.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowUp' || event.keyCode === 38) {
                  event.preventDefault();
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

        import('../../scripts/autocomplete-api-v3.js').then(({ default: useInputAutocomplete }) => {
          const { inputHandler } = useInputAutocomplete(
            suggestionsListUIUpdateCB,
            getConfig,
            { throttleDelay: 300, debounceDelay: 500, limit: 7 },
          );
          searchBar.addEventListener('input', inputHandler);
        });
      }

      if (e.newValue.loadSearchBar && existingStickySearchBar) {
        existingStickySearchBar.classList.add('show');
      }

      if (!e.newValue.loadSearchBar && existingStickySearchBar) {
        existingStickySearchBar.classList.remove('show');
      }
    }
  });
}

function wordExistsInString(word, inputString) {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = new RegExp(`(?:^|\\s|[.,!?()'"\\-])${escapedWord}(?:$|\\s|[.,!?()'"\\-])`, 'i');
  return regexPattern.test(inputString);
}

function getTaskNameInMapping(text, taskMap) {
  return Object.entries(taskMap)
    .filter((task) => task[1].some((word) => {
      const searchValue = text.toLowerCase();
      return wordExistsInString(word.toLowerCase(), searchValue);
    }))
    .sort((a, b) => b[0].length - a[0].length);
}

function renderFallbackMsgWrapper(block, { fallbackMsg }) {
  let fallbackMsgWrapper = block.querySelector('.template-x-fallback-msg-wrapper');
  if (!fallbackMsgWrapper) {
    fallbackMsgWrapper = createTag('div', { class: 'template-x-fallback-msg-wrapper' });
    block.append(fallbackMsgWrapper);
  }
  if (!fallbackMsg) {
    fallbackMsgWrapper.textContent = '';
  } else {
    fallbackMsgWrapper.textContent = fallbackMsg;
  }
}

async function handleTabClick(
  block,
  props,
  templatesWrapper,
  tabsWrapper,
  tabBtn,
  task,
  index,
  tabConfigs,
) {
  templatesWrapper.style.opacity = 0;
  const {
    templates: newTemplates,
    fallbackMsg: newFallbackMsg,
  } = await fetchAndRenderTemplates({
    ...props,
    start: '',
    filters: {
      ...props.filters,
      tasks: task,
    },
    collectionId: tabConfigs[index].collectionId,
  });
  if (newTemplates?.length > 0) {
    props.fallbackMsg = newFallbackMsg;
    renderFallbackMsgWrapper(block, props);

    templatesWrapper.innerHTML = '';
    props.templates = newTemplates;
    props.templates.forEach((template) => {
      templatesWrapper.append(template);
    });
    await decorateTemplates(block, props);
    buildCarousel(':scope > .template', templatesWrapper);
    templatesWrapper.style.opacity = 1;
  }

  tabsWrapper.querySelectorAll('.template-tab-button').forEach((btn) => {
    if (btn !== tabBtn) btn.classList.remove('active');
  });
  tabBtn.classList.add('active');
}

async function buildTemplateList(block, props, type = []) {
  if (type?.length > 0) {
    type.forEach((typeName) => {
      block.parentElement.classList.add(typeName);
      block.classList.add(typeName);
    });
  }

  if (!props.templateStats) {
    await processContentRow(block, props);
  }

  const { templates, fallbackMsg } = await fetchAndRenderTemplates(props);

  if (templates?.length > 0) {
    props.fallbackMsg = fallbackMsg;
    renderFallbackMsgWrapper(block, props);
    const blockInnerWrapper = createTag('div', { class: 'template-x-inner-wrapper' });
    block.append(blockInnerWrapper);
    props.templates = props.templates.concat(templates);
    props.templates.forEach((template) => {
      blockInnerWrapper.append(template);
    });

    await decorateTemplates(block, props);
  } else {
    window.lana.log(`failed to load templates with props: ${JSON.stringify(props)}`, { tags: 'templates-api' });

    if (getConfig().env.name === 'prod') {
      block.remove();
    } else {
      block.textContent = 'Error loading templates, please refresh the page or try again later.';
    }
  }

  if (templates && props.tabs) {
    block.classList.add('tabbed');
    const tabs = props.tabs.split(',');
    const templatesWrapper = block.querySelector('.template-x-inner-wrapper');
    const textWrapper = block.querySelector('.template-title .text-wrapper > div');
    const tabsWrapper = createTag('div', { class: 'template-tabs' });
    const tabBtns = [];

    const collectionRegex = /(.+?)\s*\((.+?)\)/;
    const tabConfigs = tabs.map((tab) => {
      const match = collectionRegex.exec(tab.trim());
      if (match) {
        return { tab: match[1], collectionId: match[2] };
      }
      return { tab, collectionId: props.collectionId };
    });
    const xTaskNameMapping = await replaceKey('x-task-name-mapping', getConfig());
    const taskMap = xTaskNameMapping !== 'x task name mapping' ? JSON.parse(xTaskNameMapping) : {};
    const taskNames = tabConfigs.map(({ tab }) => getTaskNameInMapping(tab, taskMap));
    let activeTabIndex = -1;
    if (taskNames.length === tabs.length) {
      taskNames.filter(({ length }) => length).forEach(([[task]], index) => {
        const tabBtn = createTag('button', { class: 'template-tab-button' });
        tabBtn.textContent = tabConfigs[index].tab;
        tabsWrapper.append(tabBtn);
        tabBtns.push(tabBtn);

        if (props.filters.tasks === task) {
          tabBtn.classList.add('active');
          activeTabIndex = index;
        }
        tabBtn.addEventListener('click', () => handleTabClick(
          block,
          props,
          templatesWrapper,
          tabsWrapper,
          tabBtn,
          task,
          index,
          tabConfigs,
        ), { passive: true });
      });

      if (activeTabIndex < 0 && tabBtns.length > 0) {
        tabBtns[0].classList.add('active');
        await handleTabClick(
          block,
          props,
          templatesWrapper,
          tabsWrapper,
          tabBtns[0],
          taskNames[0][0][0],
          0,
          tabConfigs,
        );
      }

      document.dispatchEvent(new CustomEvent('linkspopulated', { detail: tabBtns }));
    }

    textWrapper.append(tabsWrapper);
  }

  // templates are either finished rendering or API has crashed at this point.

  if (templates && props.loadMoreTemplates) {
    const loadMore = await decorateLoadMoreButton(block, props);
    if (loadMore) {
      updateLoadMoreButton(props, loadMore);
    }
  }

  if (templates && props.toolBar) {
    await decorateToolbar(block, props);
    if (!block.classList.contains(TWO_ROW)) await decorateCategoryList(block, props);
  }

  if (props.toolBar && props.searchBar) {
    import('../../scripts/block-mediator.min.js').then(({ default: blockMediator }) => {
      importSearchBar(block, blockMediator);
    });
  }

  await decorateBreadcrumbs(block);

  if (templates && props.orientation && props.orientation.toLowerCase() === 'horizontal') {
    const innerWrapper = block.querySelector('.template-x-inner-wrapper');
    if (innerWrapper) {
      if (block.classList.contains(TWO_ROW)) {
        await build2by2(innerWrapper, block);
      } else {
        buildCarousel(':scope > .template', innerWrapper);
      }
    } else {
      block.remove();
    }
  }

  if (props.holidayBlock) {
    decorateHoliday(block, props);
  }
}

function determineTemplateXType(props) {
  // todo: build layers of aspects based on props conditions - i.e. orientation -> style -> use case
  const type = [];

  // orientation aspect
  if (props.orientation && props.orientation.toLowerCase() === 'horizontal') type.push('horizontal');

  // style aspect
  if (props.width && props.width.toLowerCase() === 'full') type.push('fullwidth');
  if (props.width && props.width.toLowerCase() === 'sixcols') type.push('sixcols');
  if (props.width && props.width.toLowerCase() === 'fourcols') type.push('fourcols');
  if (props.mini) type.push('mini');

  // use case aspect
  if (props.holidayBlock) type.push('holiday');

  if (props.print && props.print) type.push('print');
  if (props.print && props.print.toLowerCase() === 'flyer') type.push('flyer');
  if (props.print && props.print.toLowerCase() === 't-shirt') type.push('t-shirt');

  variant = type;
  return type;
}

export default async function decorate(block) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`), fixIcons(block)]).then(([utils, placeholders]) => {
    ({ createTag, getConfig, getMetadata } = utils);
    ({ replaceKey, replaceKeyArray } = placeholders);
  });
  block.dataset.blockName = 'template-x';
  const props = constructProps(block);
  if (getMetadata('template-experiment') && !props.experiment) {
    props.experiment = getMetadata('template-experiment');
  }
  if (props.experiment) block.classList.add(props.experiment);
  if (block.classList.contains(TWO_ROW)) {
    // overriding variants for tworow experimentation
    props.orientation = 'horizontal';
    props.width = 'full';
  }
  block.innerHTML = '';
  await buildTemplateList(block, props, determineTemplateXType(props));
}
