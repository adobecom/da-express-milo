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
    stopElement: '.faqv2, .ax-link-list-v2-container',
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
let hasPrimedFirstTocClick = false;
let pendingTocTarget = null;
let pendingScrollTimeout = null;
let scrollEndListenerInitialized = false;

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
  const stopElement = config['stop-element'] || config['toc-stop-element'];
  const contents = [];

  // Build content array with validation
  let i = 1;
  let content = config[`content-${i}`];
  const MAX_ITERATIONS = 40; // Safety limit

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
 * Facebook icon path (inlined so CSS fill applies; <use href="external.svg"> does not inherit).
 */
const FACEBOOK_ICON_PATH_D = 'M9.99088 2.47955e-05C4.47063 2.47955e-05 0 4.50533 0 10.0671C0 15.014 3.58205 19.2286 8.43587 20V12.9681H5.89789V10.0615H8.43587V7.82561C8.43587 5.29907 9.92979 3.91282 12.2123 3.91282C12.9565 3.91841 13.7007 3.98549 14.4337 4.10846V6.5847H13.1897C12.4011 6.4785 11.6736 7.03747 11.5681 7.83121C11.5514 7.93741 11.5514 8.0492 11.5681 8.15541V10.0615H14.3449L13.9006 12.9681H11.5625V20C17.0161 19.1336 20.737 13.9799 19.8762 8.49079C19.1098 3.59421 14.9113 -0.0111542 9.99088 2.47955e-05Z';
const LINKEDIN_ICON_PATH_D = 'M0 1.44321V18.5565C0.0111888 19.3621 0.671329 20.011 1.47692 19.9999H18.5231C19.3287 20.011 19.9888 19.3621 20 18.5565V1.44321C19.9888 0.637621 19.3287 -0.0113316 18.5231 -0.000143051H1.47692C0.671329 -0.0113316 0.0111888 0.637621 0 1.44321ZM5.93007 17.046H2.96503V7.50196H5.93007V17.046ZM7.79301 7.50196H10.6294V8.80545H10.6685C11.2448 7.81524 12.3189 7.22223 13.4657 7.2614C16.4699 7.2614 17.0238 9.24182 17.0238 11.8096V17.046H14.0811V12.4027C14.0811 11.2838 14.0811 9.87398 12.5371 9.87398C10.993 9.87398 10.758 11.0768 10.758 12.3075V17.0292H7.79301V7.50196ZM4.47552 2.7579C5.42657 2.77468 6.18741 3.5579 6.17063 4.50895C6.15385 5.46 5.37063 6.22084 4.41958 6.20405C3.47413 6.18727 2.71888 5.42084 2.72448 4.47538C2.72448 3.52433 3.49091 2.7579 4.44196 2.7579C4.45315 2.7579 4.46434 2.7579 4.47552 2.7579Z';
const TWITTER_ICON_PATH_D = 'M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20ZM4.44434 15.5557L8.78223 10.6221L4.44434 4.44434H7.75293L10.6221 8.5293L14.2129 4.44434H15.1934L11.0566 9.14941L15.5557 15.5557H12.2471L9.21777 11.2412L5.4248 15.5557H4.44434ZM14.2139 14.8662L10.5449 9.73145L10.1055 9.11621L7.2832 5.16602H5.77832L9.27539 10.0615L9.71484 10.6768L12.708 14.8662H14.2139Z';
const COPYLINK_ICON_PATH_D = 'M10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0ZM11.7676 7.52539C10.4008 6.15857 8.1852 6.15859 6.81836 7.52539L3.98926 10.3535C2.62257 11.7204 2.62247 13.9369 3.98926 15.3037L4.69629 16.0107C6.06307 17.3775 8.27964 17.3774 9.64648 16.0107C10.0369 15.6203 10.0367 14.9872 9.64648 14.5967C9.25596 14.2062 8.62295 14.2062 8.23242 14.5967C7.64677 15.1822 6.6971 15.182 6.11133 14.5967L5.4043 13.8887C4.81851 13.3029 4.81851 12.3534 5.4043 11.7676L8.23242 8.93945C8.81821 8.3537 9.76774 8.35368 10.3535 8.93945L10.707 9.29297C11.0975 9.68344 11.7306 9.68334 12.1211 9.29297C12.5116 8.90244 12.5116 8.26943 12.1211 7.87891L11.7676 7.52539ZM15.3037 3.98926C13.9369 2.62247 11.7204 2.62257 10.3535 3.98926C9.96308 4.37969 9.96325 5.01277 10.3535 5.40332C10.744 5.79384 11.3771 5.79384 11.7676 5.40332C12.3532 4.81783 13.3029 4.81803 13.8887 5.40332L14.5967 6.11133C15.182 6.6971 15.1822 7.64677 14.5967 8.23242L11.7676 11.0605C11.1818 11.6463 10.2323 11.6463 9.64648 11.0605L9.29297 10.707C8.90249 10.3166 8.26944 10.3167 7.87891 10.707C7.48838 11.0976 7.48838 11.7306 7.87891 12.1211L8.23242 12.4746C9.59924 13.8414 11.8148 13.8414 13.1816 12.4746L16.0107 9.64648C17.3774 8.27964 17.3775 6.06308 16.0107 4.69629L15.3037 3.98926Z';
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

/**
 * Creates social sharing icons section
 * @returns {HTMLElement} Social icons container
 */
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

function ensureScrollEndListener() {
  if (scrollEndListenerInitialized) return;
  scrollEndListenerInitialized = true;

  const handleScrollEnd = () => {
    if (!pendingTocTarget) return;
    if (pendingScrollTimeout) window.clearTimeout(pendingScrollTimeout);
    // Wait briefly for the current smooth scroll to finish
    pendingScrollTimeout = window.setTimeout(() => {
      scrollToHeader(pendingTocTarget);
      pendingTocTarget = null;
      pendingScrollTimeout = null;
    }, 140);
  };

  window.addEventListener('scroll', handleScrollEnd, { passive: true });
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
  const firstLink = links[0];

  links.forEach((link) => {
    // Prevent focus outline on mouse click
    link.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    // Handle click
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // On the very first TOC interaction, always take the user to the first entry.
      if (!hasPrimedFirstTocClick && firstLink) {
        hasPrimedFirstTocClick = true;
        ensureScrollEndListener();
        pendingTocTarget = link.dataset.fullText;
        const { fullText: firstText } = firstLink.dataset;
        scrollToHeader(firstText);
        link.blur();
        return;
      }

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
    tocContainer.dataset.initialTop = highlightBottom + 30; // additional 40px buffer
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
  const stopSelector = tocContainer.dataset.stopSelector || CONFIG.selectors.stopElement;
  const stopElement = stopSelector ? document.querySelector(stopSelector) : null;
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
    const stopSelector = config.stopElement || CONFIG.selectors.stopElement || '';
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
      // Floating button update (has onScroll and onResize)
      { onScroll: floatingButtonUpdate, onResize: floatingButtonUpdate },
      // Desktop handlers (has onScroll and onResize)
      desktopHandlers,
      // Responsive handlers for mobile default state
      responsiveHandlers,
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
