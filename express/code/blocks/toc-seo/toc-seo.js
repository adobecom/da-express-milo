/* eslint-disable import/named, import/extensions */
import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';

const CONFIG = {
  breakpoints: {
    desktop: 1024,
  },
  selectors: {
    highlight: '.section div.highlight',
    section: 'main .section',
    headers: 'main .section.long-form .content h2, main .section.long-form .content h3, main .section.long-form .content h4',
    navigation: '.global-navigation, header',
    stopElement: '.ax-link-list-v2-container',
  },
  scrollOffset: {
    mobile: 75,
    tablet: 75,
    desktop: 120,
  },
  aria: {
    navigation: 'Table of Contents',
  },
};

let createTag;
let getMetadata;

/**
 * Checks if current viewport is desktop
 * @returns {boolean} True if desktop viewport (≥ 1024px)
 */
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
  const title = config['toc-title'] || 'Table of Contents';
  const ariaLabel = config['toc-aria-label'] || 'Table of Contents Navigation';
  const contents = [];

  // Build content array with validation
  let i = 1;
  let content = config[`content-${i}`];
  const MAX_ITERATIONS = 25; // Safety limit

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
  }), { title, ariaLabel });
}

/**
 * Creates the main TOC container
 * @returns {HTMLElement} TOC container element
 */
function createContainer() {
  return createTag('div', {
    class: 'toc-container ax-grid-col-12',
    role: 'navigation',
    'aria-label': CONFIG.aria.navigation,
  });
}

/**
 * Creates the TOC title button with chevron icon
 * @param {string} titleText - Title text content
 * @returns {HTMLElement} Title button element
 */
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
    'aria-hidden': 'true',
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
 * Creates social sharing icons section
 * @returns {HTMLElement} Social icons container
 */
function createSocialIcons() {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.querySelector('h1')?.textContent || '');
  const description = encodeURIComponent(getMetadata('description') || '');

  const platformMap = {
    x: {
      'data-href': `https://www.twitter.com/share?&url=${url}&text=${title}`,
      'aria-label': 'Share on Twitter',
      tabindex: '0',
    },
    linkedin: {
      'data-type': 'LinkedIn',
      'data-href': `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${description}`,
      'aria-label': 'Share on LinkedIn',
      tabindex: '0',
    },
    facebook: {
      'data-type': 'Facebook',
      'data-href': `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      'aria-label': 'Share on Facebook',
      tabindex: '0',
    },
    link: {
      id: 'toc-copy-link',
      'aria-label': 'Copy link to clipboard',
      tabindex: '0',
    },
  };

  const socialContainer = createTag('div', { class: 'toc-social-icons' });

  Object.entries(platformMap).forEach(([platform, attrs]) => {
    const icon = getIconElementDeprecated(platform);
    const link = createTag('a', attrs);
    link.appendChild(icon);
    socialContainer.appendChild(link);
  });

  return socialContainer;
}

// ============================================================================
// MOBILE/TABLET BEHAVIOR (< 1024px)
// ============================================================================

/**
 * Creates floating "back to TOC" button for mobile
 * @returns {HTMLElement} Floating button element
 */
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
 * Scrolls to target header with proper offset for mobile/tablet
 * @param {string} fullText - Full text content of target header
 */
function scrollToHeader(fullText) {
  const headers = document.querySelectorAll(CONFIG.selectors.headers);
  const targetHeader = Array.from(headers).find((h) => {
    const headerContent = h.textContent.trim();
    const searchText = fullText.replace('...', '').trim();
    return headerContent.includes(searchText);
  });

  if (targetHeader) {
    const headerRect = targetHeader.getBoundingClientRect();
    // Use desktop offset on desktop, mobile/tablet offset otherwise
    const offset = isDesktop() ? CONFIG.scrollOffset.desktop : CONFIG.scrollOffset.mobile;
    const scrollDistance = headerRect.top + window.pageYOffset - offset;

    window.scrollTo({
      top: Math.max(0, scrollDistance),
      behavior: 'smooth',
    });
  }
}

/**
 * Sets up toggle behavior for mobile/tablet
 * @param {HTMLElement} container - TOC container
 * @param {HTMLElement} titleBar - Title button element
 * @param {HTMLElement} content - Content element
 */
function setupToggle(container, titleBar, content) {
  // Click handler - simple and direct
  titleBar.addEventListener('click', () => {
    const isOpen = container.classList.toggle('open');
    titleBar.setAttribute('aria-expanded', isOpen.toString());
    content.setAttribute('aria-hidden', (!isOpen).toString());
  });

  // Keyboard accessibility
  titleBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const isOpen = container.classList.toggle('open');
      titleBar.setAttribute('aria-expanded', isOpen.toString());
      content.setAttribute('aria-hidden', (!isOpen).toString());
    }
  });
}

/**
 * Sets up navigation behavior for links
 * @param {HTMLElement} content - Content element with links
 */
function setupNavigation(content) {
  const links = content.querySelectorAll('.toc-link');

  links.forEach((link) => {
    // Prevent focus outline on mouse click
    link.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    // Handle click
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const { fullText } = link.dataset;
      scrollToHeader(fullText);
      // Remove focus after navigation
      link.blur();
    });
  });
}

/**
 * Opens social media sharing in popup windows
 * @param {Event} e - Click event
 */
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

/**
 * Sets up social sharing functionality
 * @param {HTMLElement} socialContainer - Social icons container
 */
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

/**
 * Calculates and sets the desktop TOC position based on highlight element and scroll
 * @param {HTMLElement} tocContainer - TOC container element
 */
function updateDesktopPosition(tocContainer) {
  if (!isDesktop()) return;

  const highlightElement = document.querySelector(CONFIG.selectors.highlight);
  if (!highlightElement) return;

  // Calculate and cache the initial absolute position if not already stored
  if (!tocContainer.dataset.initialTop) {
    const highlightRect = highlightElement.getBoundingClientRect();
    const highlightBottom = window.pageYOffset + highlightRect.bottom + 40; // 40px below highlight
    tocContainer.dataset.initialTop = highlightBottom;
  }

  const initialTop = parseFloat(tocContainer.dataset.initialTop);
  const scrollY = window.pageYOffset;

  // Calculate desired top position (115px from viewport top when fixed)
  const fixedTopPosition = 115;
  const minTopPosition = 115; // Never position higher than this

  // Calculate the current top position:
  // Before scrolling past the initial position, TOC should appear to stay with content
  // After scrolling past, it should stick to the viewport
  let topPosition;
  if (scrollY >= initialTop - fixedTopPosition) {
    // Scrolled past: stick to viewport
    topPosition = fixedTopPosition;
  } else {
    // Not scrolled past yet: calculate position relative to viewport
    topPosition = initialTop - scrollY;
  }

  // Ensure we never position higher than the minimum
  topPosition = Math.max(topPosition, minTopPosition);

  // Check if there's a stop element we shouldn't scroll past
  const stopElement = document.querySelector(CONFIG.selectors.stopElement);
  if (stopElement) {
    const stopRect = stopElement.getBoundingClientRect();
    const stopTop = stopRect.top; // Position relative to viewport
    const tocHeight = tocContainer.offsetHeight;

    // If the TOC would overlap with the stop element, limit its position
    // We want: topPosition + tocHeight <= stopTop
    // So: topPosition <= stopTop - tocHeight
    const maxTopPosition = stopTop - tocHeight - 20; // 20px buffer

    if (topPosition > maxTopPosition) {
      topPosition = maxTopPosition;
    }
  }

  tocContainer.style.setProperty('--toc-top-position', `${topPosition}px`);
  tocContainer.classList.add('toc-desktop');
}

/**
 * Updates active link based on current scroll position
 * @param {HTMLElement} tocContainer - TOC container element
 */
function updateActiveLink(tocContainer) {
  if (!isDesktop()) return;

  // Cache these queries (they don't change after page load)
  if (!updateActiveLink.headers) {
    updateActiveLink.headers = document.querySelectorAll(CONFIG.selectors.headers);
    updateActiveLink.tocLinks = tocContainer.querySelectorAll('.toc-link');
    updateActiveLink.tocTitle = tocContainer.querySelector('.toc-title');
  }

  const { headers, tocLinks, tocTitle } = updateActiveLink;

  if (!headers.length || !tocLinks.length) return;

  // Get TOC title position for offset
  const tocTitleRect = tocTitle ? tocTitle.getBoundingClientRect() : { top: 200 };
  const offset = tocTitleRect.top + 20;

  let activeHeader = null;
  let minDistance = Infinity;

  // Find the header closest to the offset position
  headers.forEach((header) => {
    const rect = header.getBoundingClientRect();
    const distance = Math.abs(rect.top - offset);

    if (rect.top <= offset && distance < minDistance) {
      minDistance = distance;
      activeHeader = header;
    }
  });

  // Remove active class from all links
  tocLinks.forEach((link) => link.classList.remove('active'));

  // Add active class to matching link
  if (activeHeader) {
    const headerText = activeHeader.textContent.trim();
    const activeLink = Array.from(tocLinks).find((link) => {
      const fullText = link.dataset.fullText || link.textContent.trim();
      return fullText.includes(headerText) || headerText.includes(fullText.replace('...', '').trim());
    });

    if (activeLink) {
      activeLink.classList.add('active');
    }
  }
}

/**
 * Sets up desktop positioning and active link tracking
 * @param {HTMLElement} tocContainer - TOC container element
 * @returns {Object} Update functions for consolidated handlers
 */
function setupDesktop(tocContainer) {
  // Initial position (only if already on desktop)
  if (isDesktop()) {
    updateDesktopPosition(tocContainer);
    updateActiveLink(tocContainer);
  }

  // Always return handlers, they check viewport internally
  return {
    onScroll: () => {
      if (isDesktop()) {
        updateDesktopPosition(tocContainer);
        updateActiveLink(tocContainer);
      }
    },
    onResize: () => {
      // Always reset cached position on resize to ensure correct positioning
      delete tocContainer.dataset.initialTop;

      if (isDesktop()) {
        updateDesktopPosition(tocContainer);
        updateActiveLink(tocContainer);
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

/**
 * Initializes required utilities and dependencies
 * @returns {Promise<Object>} Object containing createTag and getMetadata functions
 */
async function initializeDependencies() {
  try {
    const utils = await import(`${getLibs()}/utils/utils.js`);
    return {
      createTag: utils.createTag,
      getMetadata: utils.getMetadata,
    };
  } catch (error) {
    window.lana?.log('TOC: Failed to initialize dependencies:', error);
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
    const titleBar = createTitleBar(config.title);
    const content = createContentList(config);
    const socialIcons = createSocialIcons();
    const floatingButton = createFloatingButton();

    // Phase 4: Assemble TOC
    container.appendChild(titleBar);
    container.appendChild(content);
    container.appendChild(socialIcons);

    // Phase 5: Setup behaviors
    // Toggle: Mobile and Tablet (< 1024px)
    if (!isDesktop()) {
      setupToggle(container, titleBar, content);
    }
    // Navigation and Social: All viewports
    setupNavigation(content);
    setupSocialSharing(socialIcons);

    // Phase 6: Insert TOC after highlight element
    const highlightElement = document.querySelector(CONFIG.selectors.highlight);
    if (highlightElement) {
      highlightElement.insertAdjacentElement('afterend', container);
    } else {
      window.lana?.log('TOC: No highlight element found');
    }

    // Phase 7: Insert floating button and setup behavior (mobile/tablet only)
    document.body.appendChild(floatingButton);
    const floatingButtonUpdate = setupFloatingButton(floatingButton, container);

    // Phase 8: Setup desktop positioning and active link tracking
    const desktopHandlers = setupDesktop(container);

    // Phase 9: Setup consolidated, optimized event handlers
    const updateFunctions = [
      // Floating button update (has onScroll and onResize)
      { onScroll: floatingButtonUpdate, onResize: floatingButtonUpdate },
      // Desktop handlers (has onScroll and onResize)
      desktopHandlers,
    ];

    setupConsolidatedHandlers(updateFunctions);

    // Initial call for floating button
    floatingButtonUpdate();

    // Hide original block
    block.style.display = 'none';
  } catch (error) {
    window.lana?.log('TOC: Error during decoration:', error);
    block.style.display = 'none';
  }
}
