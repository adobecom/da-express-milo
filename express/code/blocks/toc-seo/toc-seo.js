/* eslint-disable import/named, import/extensions */
import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import {
  FACEBOOK_ICON_PATH_D,
  LINKEDIN_ICON_PATH_D,
  TWITTER_ICON_PATH_D,
  COPYLINK_ICON_PATH_D,
} from './toc-seo-icons.js';

const CONFIG = {
  breakpoints: {
    desktop: 1024,
  },
  selectors: {
    startElement: '.section div.highlight, .blog-article-marquee',
    section: 'main .section',
    longFormSection: 'main .section.long-form',
    headers: 'main .section.long-form .content h2, main .section.long-form .content h3, main .section.long-form .content h4',
    navigation: '.global-navigation, header',
    stopElement: '.faqv2, .ax-link-list-v2-container, .ax-blog-posts-container, .banner-bg, footer',
  },
  aria: {
    navigation: 'Table of Contents',
  },
};

let createTag;
let getMetadata;

function isDesktop() {
  return window.innerWidth >= CONFIG.breakpoints.desktop;
}

/**
 * Builds configuration object from block HTML structure
 * @param {HTMLElement} block - The block element
 * @returns {Object} Configuration object with title, ariaLabel, and contents
 */
function buildBlockConfig(block) {
  const config = {};
  const rows = Array.from(block.children);

  // Read all rows to build the configuration
  rows.forEach((row) => {
    const cells = Array.from(row.children);

    if (cells.length > 0) {
      const key = cells[0]?.textContent?.trim();
      const value = cells.length > 1
        ? Array.from(cells.slice(1))
          .map((cell) => cell?.textContent?.trim())
          .filter((text) => text !== undefined)
          .join(' ')
        : '';

      if (key) {
        config[key] = value;
      }
    }
  });

  // Validate and set defaults
  // Strip trailing colon — some authors accidentally append ":" to the title label.
  const title = (config['toc-title'] || 'Table of Contents').replace(/:$/, '');
  const ariaLabel = config['toc-aria-label'] || 'Table of Contents Navigation';
  const rawStopElement = config.stopElement || config['stop-element'] || config['toc-stop-element'];
  const stopElement = rawStopElement && !rawStopElement.startsWith('.')
    ? `.${rawStopElement}`
    : rawStopElement;
  const contents = [];

  // Build content array with validation
  let i = 1;
  let content = config[`content-${i}`];
  const MAX_ITERATIONS = 40;

  while (content && i <= MAX_ITERATIONS) {
    const abbreviatedContent = config[`content-${i}-short`];
    if (abbreviatedContent) {
      contents.push({ [`content-${i}-short`]: abbreviatedContent });
    }
    contents.push({ [`content-${i}`]: content });
    i += 1;
    content = config[`content-${i}`];
  }

  return contents.reduce((acc, el) => ({
    ...acc,
    ...el,
  }), { title, ariaLabel, stopElement });
}

function createContainer() {
  return createTag('div', {
    class: 'toc-container ax-grid-col-12',
    role: 'navigation',
    'aria-label': CONFIG.aria.navigation,
  });
}

function createTitleBar(titleText) {
  const titleBar = createTag('button', {
    class: 'toc-title',
    type: 'button',
    'aria-expanded': 'false',
    'aria-controls': 'toc-content',
  });

  const titleSpan = createTag('span', { class: 'toc-title-text' });
  titleSpan.textContent = titleText;

  const chevron = getIconElementDeprecated('chevron');
  chevron.classList.add('toc-chevron');

  titleBar.appendChild(titleSpan);
  titleBar.appendChild(chevron);

  return titleBar;
}

/**
 * Creates the TOC content container with navigation links
 * @param {Object} config - Configuration object with contents
 * @returns {HTMLElement} TOC content element
 */
function createContentList(config) {
  const content = createTag('div', {
    class: 'toc-content',
    id: 'toc-content',
    role: 'region',
    'aria-label': config.ariaLabel,
  });

  // Create navigation links
  Object.keys(config).forEach((key) => {
    if (key.startsWith('content-') && !key.endsWith('-short')) {
      const link = createTag('a', {
        href: `#${key}`,
        class: 'toc-link',
      });

      // Use short version if available
      const shortKey = `${key}-short`;
      const displayText = config[shortKey] || config[key];
      link.textContent = displayText;

      // Store full text for matching during scroll
      link.dataset.fullText = config[key];

      content.appendChild(link);
    }
  });

  return content;
}

/**
 * Creates an inline SVG icon so CSS fill applies (external <use> does not inherit in browsers).
 * @param {string} iconClass - Class name for the icon (e.g. 'icon-social_icon_facebook_toc-seo')
 * @param {string} pathD - SVG path d attribute
 * @param {number} size - Width/height in pixels
 * @returns {SVGSVGElement}
 */
function createInlineSocialIcon(iconClass, pathD, size = 20) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('icon', iconClass);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  return svg;
}

function createSocialIcons() {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.querySelector('h1')?.textContent || '');
  const description = encodeURIComponent(getMetadata('description') || '');

  const platformMap = {
    'social_icon_twitter_toc-seo': {
      'data-href': `https://www.twitter.com/share?&url=${url}&text=${title}`,
      'aria-label': 'Share on Twitter',
      tabindex: '0',
      role: 'link',
      useInlineIcon: TWITTER_ICON_PATH_D,
    },
    'social_icon_facebook_toc-seo': {
      'data-type': 'Facebook',
      'data-href': `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      'aria-label': 'Share on Facebook',
      tabindex: '0',
      role: 'link',
      useInlineIcon: FACEBOOK_ICON_PATH_D,
    },
    'social_icon_linkedin_toc-seo': {
      'data-type': 'LinkedIn',
      'data-href': `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${description}`,
      'aria-label': 'Share on LinkedIn',
      tabindex: '0',
      role: 'link',
      useInlineIcon: LINKEDIN_ICON_PATH_D,
    },
    'social_icon_copylink_toc-seo': {
      id: 'toc-copy-link',
      'aria-label': 'Copy link to clipboard',
      tabindex: '0',
      role: 'link',
      useInlineIcon: COPYLINK_ICON_PATH_D,
      title: 'Copy link to clipboard',
    },
  };

  const socialContainer = createTag('div', { class: 'toc-social-icons' });

  Object.entries(platformMap).forEach(([platform, attrs]) => {
    const icon = attrs.useInlineIcon
      ? createInlineSocialIcon(`icon-${platform}`, attrs.useInlineIcon, 20)
      : getIconElementDeprecated(platform, 20, '', '');
    const link = createTag('a', attrs);
    link.appendChild(icon);
    socialContainer.appendChild(link);
  });

  return socialContainer;
}

// ============================================================================
// MOBILE/TABLET BEHAVIOR (< 1024px)
// ============================================================================

function createFloatingButton() {
  const button = createTag('button', {
    class: 'toc-floating-button',
    'aria-label': 'Back to Table of Contents',
  });

  // Load arrow SVG from img folder
  const img = createTag('img', {
    src: '/express/code/icons/arrow-up.svg',
    alt: '',
    class: 'toc-floating-icon',
    width: '26',
    height: '26',
  });

  button.appendChild(img);

  return button;
}

/**
 * Scrolls back to the TOC position relative to navigation header
 * @param {HTMLElement} tocContainer - TOC container element
 */
function scrollToTOC(tocContainer) {
  const tocRect = tocContainer.getBoundingClientRect();
  const tocAbsoluteTop = window.pageYOffset + tocRect.top;

  // Find the navigation header to calculate proper offset
  const navElement = document.querySelector(CONFIG.selectors.navigation);

  let offset = 20; // Default small offset if no nav found

  if (navElement) {
    // Get the height of the navigation header
    const navRect = navElement.getBoundingClientRect();
    const navHeight = navRect.height;
    // Position TOC just below the nav with small buffer
    offset = navHeight + 10;
  }

  const scrollDistance = tocAbsoluteTop - offset;

  window.scrollTo({
    top: Math.max(0, scrollDistance),
    behavior: 'smooth',
  });
}

/**
 * Sets up floating button behavior for mobile and tablet
 * @param {HTMLElement} floatingButton - Floating button element
 * @param {HTMLElement} tocContainer - TOC container element
 * @returns {Function} Update function for consolidated scroll handler
 */
function setupFloatingButton(floatingButton, tocContainer) {
  // Click handler
  floatingButton.addEventListener('click', () => {
    scrollToTOC(tocContainer);
  });

  // Return update function to be called by consolidated scroll handler
  return () => {
    if (!isDesktop()) {
      const tocRect = tocContainer.getBoundingClientRect();
      // Show button when TOC is scrolled out of view (above viewport)
      if (tocRect.bottom < 0) {
        floatingButton.classList.add('visible');
      } else {
        floatingButton.classList.remove('visible');
      }
    } else {
      // Hide on desktop only
      floatingButton.classList.remove('visible');
    }
  };
}

/**
 * Tracks the active TOC link based on scroll position. The last header whose
 * top edge is at or above the scroll offset threshold is the active section.
 * Header matching is built lazily on first call so Milo's section decoration
 * (which adds the `.content` and `long-form` classes) has completed. Called
 * once at init (post Phase 6 insertion) to prime hash-navigation active state,
 * then on every scroll event thereafter.
 * @param {HTMLElement} content - TOC content element containing links
 * @returns {{ onScroll: Function }} Handler for the consolidated scroll listener
 */
function setupActiveLinks(content) {
  let pairs = null;

  function getPairs() {
    if (!pairs || !pairs.length) {
      const allHeaders = Array.from(document.querySelectorAll(CONFIG.selectors.headers));
      pairs = Array.from(content.querySelectorAll('.toc-link')).reduce((acc, link) => {
        const searchText = link.dataset.fullText.replace('...', '').trim();
        const header = allHeaders.find((h) => h.textContent.trim().includes(searchText));
        if (header) acc.push({ header, link });
        return acc;
      }, []);
    }
    return pairs;
  }

  function update() {
    const currentPairs = getPairs();
    if (!currentPairs.length) return;
    let activeLink = null;
    for (const { header, link } of currentPairs) {
      // Mark active once the header clears the top 30% of the viewport (~nav + reading buffer).
      if (header.getBoundingClientRect().top <= window.innerHeight * 0.3) {
        activeLink = link;
      }
    }

    content.querySelectorAll('.toc-link').forEach((l) => l.classList.toggle('active', l === activeLink));
  }

  return { onScroll: update };
}

function setupToggle(container, titleBar, content) {
  // Click handler - simple and direct
  titleBar.addEventListener('click', () => {
    const isOpen = container.classList.toggle('open');
    titleBar.setAttribute('aria-expanded', isOpen.toString());
    content.setAttribute('aria-hidden', (!isOpen).toString());
  });

  titleBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      titleBar.click();
    }
  });
}

/**
 * Sets up navigation behavior for links. Header matching is deferred to click
 * time (and cached per link) so Milo's section decoration — which adds the
 * `.content` and `long-form` classes — has completed before we query the DOM.
 * @param {HTMLElement} content - Content element with links
 */
function setupNavigation(content) {
  const cache = new Map();

  content.querySelectorAll('.toc-link').forEach((link) => {
    link.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (!cache.has(link)) {
        const searchText = link.dataset.fullText.replace('...', '').trim();
        const allHeaders = document.querySelectorAll(CONFIG.selectors.headers);
        const matched = Array.from(allHeaders).find(
          (h) => h.textContent.trim().includes(searchText),
        ) || null;
        cache.set(link, matched);
      }
      const header = cache.get(link);
      if (header) {
        header.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      link.blur();
    });
  });
}

function openSocialPopup(e) {
  const target = e.target.closest('a');
  if (!target) return;

  const href = target.getAttribute('data-href');
  const type = target.getAttribute('data-type');
  const ariaLabel = target.getAttribute('aria-label');

  const popup = window.open(
    href,
    type,
    'popup,top=233,left=233,width=700,height=467',
  );

  // Announce to screen readers
  const announcement = createTag('div', {
    role: 'status',
    'aria-live': 'polite',
    class: 'sr-only',
    style: 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;',
  }, `${ariaLabel} window opened`);

  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);

  if (popup && !popup.closed) {
    popup.focus();
  }
}

/**
 * Copies current URL to clipboard
 * @param {HTMLElement} button - Copy button element
 */
async function copyToClipboard(button) {
  try {
    await navigator.clipboard.writeText(window.location.href);
    const copyText = 'Copied to clipboard';
    button.setAttribute('aria-label', copyText);

    const tooltip = createTag('div', {
      role: 'status',
      'aria-live': 'polite',
      class: 'toc-copied-tooltip',
    }, copyText);

    button.appendChild(tooltip);
    button.classList.add('copy-success');

    setTimeout(() => {
      tooltip.remove();
      button.classList.remove('copy-success');
    }, 3000);
  } catch (err) {
    button.classList.add('copy-failure');
    setTimeout(() => button.classList.remove('copy-failure'), 2000);
  }
}

function setupSocialSharing(socialContainer) {
  // Share links
  socialContainer.querySelectorAll('[data-href]').forEach((link) => {
    link.addEventListener('click', openSocialPopup);
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        openSocialPopup(e);
      }
    });
  });

  // Copy link button
  const copyButton = socialContainer.querySelector('#toc-copy-link');
  if (copyButton) {
    copyButton.addEventListener('click', () => copyToClipboard(copyButton));
    copyButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        copyToClipboard(copyButton);
      }
    });
  }
}

// ============================================================================
// DESKTOP BEHAVIOR (≥ 1024px)
// ============================================================================

const NAV_FALLBACK_HEIGHT = 100; // safe fallback when no fixed/sticky nav is detected
const NAV_CLEARANCE_BUFFER = 15; // gap between nav bottom and TOC top edge

/**
 * Returns the clearance needed below fixed/sticky elements pinned at the top of the viewport.
 * Only elements that are currently stuck at the top (rect.top ≤ 1) are counted.
 * @returns {number} Pixels from viewport top the TOC should clear
 */
function getTopBarClearance() {
  const candidates = [
    CONFIG.selectors.navigation,
    '.ribbon-banner',
    '.feds-promo-wrapper',
  ];
  let maxBottom = 0;
  candidates.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      const pos = getComputedStyle(el).position;
      if (pos !== 'fixed' && pos !== 'sticky') return;
      const rect = el.getBoundingClientRect();
      if (rect.top <= 1 && rect.height > 0) {
        maxBottom = Math.max(maxBottom, rect.bottom);
      }
    });
  });
  return (maxBottom || NAV_FALLBACK_HEIGHT) + NAV_CLEARANCE_BUFFER;
}

/**
 * Calculates and sets the desktop TOC position based on start element and scroll
 * @param {HTMLElement} tocContainer - TOC container element
 */
function updateDesktopPosition(tocContainer) {
  if (!isDesktop()) return;

  const longFormEl = document.querySelector(CONFIG.selectors.longFormSection);
  if (!longFormEl) return;

  const minTopPosition = getTopBarClearance();
  const sectionPaddingTop = parseFloat(getComputedStyle(longFormEl).paddingTop) || 0;
  let topPosition = Math.max(
    longFormEl.getBoundingClientRect().top + sectionPaddingTop,
    minTopPosition,
  );

  const stopSelector = tocContainer.dataset.stopSelector || CONFIG.selectors.stopElement;
  const stopElement = stopSelector
    ? Array.from(document.querySelectorAll(stopSelector)).find((el) => el.offsetHeight > 0)
    : null;
  if (stopElement && window.pageYOffset > 0) {
    const stopRect = stopElement.getBoundingClientRect();
    const maxTopPosition = stopRect.top - tocContainer.offsetHeight - 20;
    if (topPosition > maxTopPosition && stopRect.height > 0) {
      topPosition = maxTopPosition;
    }
  }

  tocContainer.style.setProperty('--toc-top-position', `${topPosition}px`);
  tocContainer.classList.add('toc-desktop');

  const contentEl = tocContainer.querySelector('.toc-content');
  if (contentEl) {
    tocContainer.classList.toggle('toc-scrollable', contentEl.scrollHeight > contentEl.clientHeight);
  }
}

/**
 * Sets up desktop positioning
 * @param {HTMLElement} tocContainer - TOC container element
 * @returns {Object} Update functions for consolidated handlers
 */
function setupDesktop(tocContainer) {
  if (isDesktop()) {
    const tryShow = () => {
      if (document.querySelector(CONFIG.selectors.longFormSection)) {
        requestAnimationFrame(() => updateDesktopPosition(tocContainer));
        return;
      }
      // section-metadata may not have decorated yet — watch for the long-form class
      const root = document.querySelector('main') || document.body;
      const observer = new MutationObserver(() => {
        if (document.querySelector(CONFIG.selectors.longFormSection)) {
          observer.disconnect();
          requestAnimationFrame(() => updateDesktopPosition(tocContainer));
        }
      });
      observer.observe(root, { subtree: true, attributeFilter: ['class'] });
    };

    if (document.readyState === 'complete') {
      tryShow();
    } else {
      window.addEventListener('load', tryShow, { once: true });
    }
  }

  return {
    onScroll: () => {
      if (isDesktop()) updateDesktopPosition(tocContainer);
    },
    onResize: () => {
      if (isDesktop()) {
        updateDesktopPosition(tocContainer);
      } else {
        tocContainer.classList.remove('toc-desktop');
        tocContainer.classList.remove('toc-desktop-fixed');
        tocContainer.style.removeProperty('--toc-top-position');
      }
    },
  };
}

// ============================================================================
// PERFORMANCE - CONSOLIDATED EVENT HANDLERS
// ============================================================================

/**
 * Creates a consolidated, optimized scroll/resize handler
 * @param {Array} updateFunctions - Array of update functions to call
 * @returns {Object} Cleanup functions
 */
function setupConsolidatedHandlers(updateFunctions) {
  let scrollTicking = false;
  let resizeTicking = false;

  // RAF-throttled scroll handler
  const handleScroll = () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateFunctions.forEach((fn) => fn && fn.onScroll && fn.onScroll());
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  };

  // RAF-throttled resize handler
  const handleResize = () => {
    if (!resizeTicking) {
      requestAnimationFrame(() => {
        updateFunctions.forEach((fn) => fn && fn.onResize && fn.onResize());
        resizeTicking = false;
      });
      resizeTicking = true;
    }
  };

  // Add passive listeners for better scroll performance
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });

  // Return cleanup function (for potential future use)
  return () => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleResize);
  };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeDependencies() {
  try {
    const utils = await import(`${getLibs()}/utils/utils.js`);
    return {
      createTag: utils.createTag,
      getMetadata: utils.getMetadata,
    };
  } catch (error) {
    window.lana?.log(`TOC: Failed to initialize dependencies: ${error?.message || error?.detail || error}`, { tags: 'toc-seo', severity: 'error' });
    throw new Error('Failed to load required utilities');
  }
}

/**
 * Main decoration function
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate(block) {
  try {
    // Phase 1: Initialize dependencies
    const utils = await initializeDependencies();
    createTag = utils.createTag;
    getMetadata = utils.getMetadata;

    // Phase 2: Extract configuration from block
    const config = buildBlockConfig(block);

    // Phase 3: Create DOM structure
    const container = createContainer();
    const rawMetaStop = getMetadata('stopelement');
    const metaStop = rawMetaStop && !rawMetaStop.startsWith('.') ? `.${rawMetaStop}` : rawMetaStop;
    const stopSelector = config.stopElement || metaStop || CONFIG.selectors.stopElement || '';
    container.dataset.stopSelector = stopSelector;
    const titleBar = createTitleBar(config.title);
    const content = createContentList(config);
    const socialIcons = createSocialIcons();
    const floatingButton = createFloatingButton();

    // Helpers for mobile/tablet default open state and toggle init
    const ensureMobileOpen = () => {
      container.classList.add('open');
      titleBar.setAttribute('aria-expanded', 'true');
      content.setAttribute('aria-hidden', 'false');
    };

    let mobileToggleInitialized = false;
    let lastIsDesktop = isDesktop();

    // Default mobile/tablet state: expanded for immediate visibility and toggle enabled
    if (!lastIsDesktop) {
      ensureMobileOpen();
      setupToggle(container, titleBar, content);
      mobileToggleInitialized = true;
    }

    // Phase 4: Assemble TOC
    container.appendChild(titleBar);
    container.appendChild(content);
    container.appendChild(socialIcons);

    // Phase 5: Setup behaviors
    setupNavigation(content);
    setupSocialSharing(socialIcons);
    const activeLinksHandlers = setupActiveLinks(content);

    // Phase 6: Insert TOC after start element
    const startElement = document.querySelector(CONFIG.selectors.startElement);
    if (startElement) {
      startElement.insertAdjacentElement('afterend', container);
    } else {
      window.lana?.log('TOC: No start element found', { tags: 'toc-seo', severity: 'error' });
    }

    // Prime active link for hash navigation; one RAF after insertion lets layout settle.
    requestAnimationFrame(() => activeLinksHandlers.onScroll());

    // Phase 7: Insert floating button and setup behavior (mobile/tablet only)
    document.body.appendChild(floatingButton);
    const floatingButtonUpdate = setupFloatingButton(floatingButton, container);

    // Phase 8: Setup desktop positioning
    const desktopHandlers = setupDesktop(container);

    // Phase 8b: Handle desktop → mobile/tablet transitions so TOC defaults open
    const responsiveHandlers = {
      onResize: () => {
        const nowDesktop = isDesktop();
        if (lastIsDesktop && !nowDesktop) {
          ensureMobileOpen();
          if (!mobileToggleInitialized) {
            setupToggle(container, titleBar, content);
            mobileToggleInitialized = true;
          }
        }
        lastIsDesktop = nowDesktop;
      },
    };

    // Phase 9: Setup consolidated, optimized event handlers
    const updateFunctions = [
      { onScroll: floatingButtonUpdate, onResize: floatingButtonUpdate },
      desktopHandlers,
      responsiveHandlers,
      activeLinksHandlers,
    ];

    setupConsolidatedHandlers(updateFunctions);

    // Initial call for floating button
    floatingButtonUpdate();

    // Hide original block
    block.style.display = 'none';
  } catch (error) {
    window.lana?.log(`TOC: Error during decoration: ${error?.message || error?.detail || error}`, { tags: 'toc-seo', severity: 'error' });
    block.style.display = 'none';
  }
}
