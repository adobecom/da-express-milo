import { getLibs, decorateButtonsDeprecated, addTempWrapperDeprecated } from '../../scripts/utils.js';
import buildCarousel from '../../scripts/widgets/carousel.js';

import { fetchRelevantRows } from '../../scripts/utils/relevant.js';
import { splitAndAddVariantsWithDash } from '../../scripts/utils/decorate.js';

let replaceKey;
let getConfig;
let createTag;
const DEFAULT_VARIANT = 'default';
const SMART_VARIANT = 'smart';

// Breakpoint constants
const BREAKPOINTS = {
  MOBILE: 599,
  TABLET: 899,
  DESKTOP: 1200,
};

export function normalizeHeadings(block, allowedHeadings) {
  const allowed = allowedHeadings.map((h) => h.toLowerCase());
  block.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((tag) => {
    const h = tag.tagName.toLowerCase();
    if (allowed.indexOf(h) === -1) {
      // current heading is not in the allowed list -> try first to "promote" the heading
      let level = parseInt(h.charAt(1), 10) - 1;
      while (allowed.indexOf(`h${level}`) === -1 && level > 0) {
        level -= 1;
      }
      if (level === 0) {
        // did not find a match -> try to "downgrade" the heading
        while (allowed.indexOf(`h${level}`) === -1 && level < 7) {
          level += 1;
        }
      }
      if (level !== 7) {
        tag.outerHTML = `<h${level}>${tag.textContent.trim()}</h${level}>`;
      }
    }
  });
}

async function loadSpreadsheetData(block, relevantRowsData) {
  const defaultContainer = block.querySelector('.button-container, a.con-button');
  const defaultContainerParent = defaultContainer.parentElement;

  relevantRowsData.linkListCategories.split('\n').forEach((listData) => {
    const list = listData.split(',');
    const listEl = defaultContainer.cloneNode(true);

    listEl.innerHTML = listEl.innerHTML.replaceAll('Default', list[0].trim());
    listEl.innerHTML = listEl.innerHTML.replace(
      '/express/templates/default',
      list[1].trim(),
    );

    defaultContainerParent.append(listEl);
  });

  defaultContainer.remove();

  if (relevantRowsData.linkListTitle) {
    block.innerHTML = block.innerHTML.replaceAll(
      'link-list-title',
      relevantRowsData.linkListTitle.trim(),
    );
  }
}

export const formatSmartBlockLinks = (links, baseURL) => {
  if (!links || !baseURL) return;

  let url = baseURL;
  const multipleURLs = baseURL?.replace(/\s/g, '').split(',');
  if (multipleURLs?.length > 0) {
    [url] = multipleURLs;
  } else {
    return;
  }

  const formattedURL = `${url}?acomx-dno=true&category=templates`;
  links.forEach((p) => {
    const a = p.querySelector('a');
    a.href = `${formattedURL}&q=${a.title}`;
    a.classList.add('floating-cta-ignore');
  });
};

const toggleLinksHighlight = (links, variant) => {
  if (variant === SMART_VARIANT) return;
  links.forEach((l) => {
    const a = l.querySelector(':scope > a');
    if (a) {
      l.classList.toggle('active', a.href === window.location.href);
    }
  });
};

/**
 * Sets up the link-text variant functionality:
 * 1. Converts the last row to a text link
 * 2. Handles responsive mobile layout (moves text link outside carousel)
 */
function setupLinkTextVariant(block) {
  // Convert the last row to a text link if needed
  const allRows = [...block.children];
  const lastRow = allRows[allRows.length - 1];

  if (lastRow && !lastRow.classList.contains('button-container')) {
    // Convert last row to a text link
    const linkText = lastRow.textContent.trim();
    const linkHref = lastRow.querySelector('a')?.href || '#';

    // Create text link container
    const textLinkContainer = createTag('p', { class: 'button-container text-link' });
    const textLink = createTag('a', {
      href: linkHref,
      class: 'text-link-style',
    });
    textLink.textContent = linkText;
    textLinkContainer.append(textLink);

    // Replace the last row with our text link
    lastRow.replaceWith(textLinkContainer);
  }

  // Handle responsive mobile layout
  const handleMobileLayout = () => {
    const textLink = block.querySelector('p.button-container.text-link');
    const carouselContainer = block.querySelector('.carousel-container');

    if (textLink && carouselContainer) {
      if (window.innerWidth <= BREAKPOINTS.MOBILE) {
        // Move text link outside carousel on mobile
        if (textLink.parentNode === carouselContainer.querySelector('.carousel-platform')) {
          carouselContainer.insertAdjacentElement('afterend', textLink);
          textLink.classList.add('text-link-mobile');
        }
      } else {
        // Move text link back into carousel on larger screens
        const platform = carouselContainer.querySelector('.carousel-platform');
        if (textLink.parentNode !== platform && platform) {
          platform.appendChild(textLink);
          textLink.classList.remove('text-link-mobile');
        }
      }
    }
  };

  // Debounced resize handler for performance
  let resizeTimeout;
  const debouncedResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleMobileLayout, 150);
  };

  // Initial layout and resize handling
  handleMobileLayout();
  window.addEventListener('resize', debouncedResize);
}

export default async function decorate(block) {
  splitAndAddVariantsWithDash(block);
  let variant = DEFAULT_VARIANT;
  if (block.classList.contains(SMART_VARIANT)) {
    variant = SMART_VARIANT;
  }
  addTempWrapperDeprecated(block, 'link-list');
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`), decorateButtonsDeprecated(block)]).then(([utils, placeholders]) => {
    ({ getConfig, createTag } = utils);
    ({ replaceKey } = placeholders);
  });
  const options = {};

  if (block.classList.contains('spreadsheet-powered')) {
    const relevantRowsData = await fetchRelevantRows(window.location.pathname);

    if (relevantRowsData && relevantRowsData.linkListCategories) {
      await loadSpreadsheetData(block, relevantRowsData);
    } else {
      block.remove();
    }
  }

  if (block.classList.contains('link-text')) {
    setupLinkTextVariant(block);
  }

  if (block.classList.contains('center')) {
    options.centerAlign = true;
  }

  normalizeHeadings(block, ['h3']);

  const links = [...block.querySelectorAll('p.button-container')];
  if (links.length) {
    links.forEach((p) => {
      const link = p.querySelector('a');

      // Apply different styling based on link type
      if (link.classList.contains('text-link-style')) {
        // Text link styling - no button classes
        link.classList.add('text-link');
      } else {
        // Button link styling
        link.classList.add('secondary');
        link.classList.add('medium');
        link.classList.remove('accent');
      }
    });
    const platformEl = document.createElement('div');
    platformEl.classList.add('link-list-platform');
    await buildCarousel('p.button-container', block, options);
  }

  window.addEventListener('popstate', () => {
    toggleLinksHighlight(links, variant);
  });

  if (window.location.href.includes('/express/templates/')) {
    const { default: updateAsyncBlocks } = await import('../../scripts/utils/template-ckg.js');
    await updateAsyncBlocks();
  }
  if (variant === SMART_VARIANT) {
    const searchBrankLinks = await replaceKey('search-branch-links', getConfig());
    formatSmartBlockLinks(links, searchBrankLinks);
  }
}
