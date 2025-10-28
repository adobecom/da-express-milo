// Configuration constants
const CONFIG = {
  DEFAULT_GAP: 16,
  NARROW_VIEWPORT_MAX: 1199,
  RESIZE_DEBOUNCE_MS: 150,
};

/**
 * Debounce function for performance optimization
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Calculates and applies the optimal width for the pricing footer
 * based on the adjacent merch-card container dimensions.
 * Uses read/write phase separation to avoid layout thrashing.
 *
 * @param {HTMLElement} el - The pricing-footer block element
 */
function getMerchCardWidth(el) {
  let sibling = el.previousElementSibling;

  while (sibling) {
    if (sibling.classList?.contains('content')) {
      const cards = sibling.querySelectorAll('merch-card');
      const cardCount = cards.length;

      if (cardCount > 0) {
        // PHASE 1: READ - Batch all layout queries to avoid reflows
        const contentStyles = window.getComputedStyle(sibling);
        const columnGap = parseFloat(
          contentStyles.columnGap || contentStyles.gap || CONFIG.DEFAULT_GAP,
        ) || CONFIG.DEFAULT_GAP;
        const computedWidth = parseFloat(contentStyles.width || '0') || 0;

        // Batch all getBoundingClientRect calls
        const cardMeasurements = Array.from(cards).map((card) => {
          const rect = card.getBoundingClientRect();
          const cardStyles = window.getComputedStyle(card);
          return {
            width: rect.width,
            marginLeft: parseFloat(cardStyles.marginLeft || '0') || 0,
            marginRight: parseFloat(cardStyles.marginRight || '0') || 0,
          };
        });

        // PHASE 2: CALCULATE - No DOM access
        const totalWidth = cardMeasurements.reduce((acc, measurement, index) => {
          let width = acc + measurement.width + measurement.marginLeft + measurement.marginRight;
          if (index > 0) width += columnGap;
          return width;
        }, 0);

        const firstCardWidth = cardMeasurements[0]
          ? cardMeasurements[0].width
            + cardMeasurements[0].marginLeft
            + cardMeasurements[0].marginRight
          : 0;

        const isNarrowViewport = window.matchMedia(
          `(max-width: ${CONFIG.NARROW_VIEWPORT_MAX}px)`,
        ).matches;

        let targetWidth = totalWidth > 0 ? totalWidth : computedWidth;
        if (isNarrowViewport) {
          targetWidth = firstCardWidth > 0 ? firstCardWidth : targetWidth;
        }

        if (targetWidth <= 0) return;

        // PHASE 3: WRITE - Batch DOM updates
        requestAnimationFrame(() => {
          // Update card count class
          const oldClass = Array.from(el.classList)
            .find((cls) => cls.startsWith('card-count-'));
          if (oldClass) el.classList.remove(oldClass);
          el.classList.add(`card-count-${cardCount}`);

          el.style.maxWidth = `${targetWidth}px`;
        });
      }

      break;
    }

    sibling = sibling.previousElementSibling;
  }
}

/**
 * Initializes the pricing-footer block by restructuring DOM
 * and setting up responsive width calculation.
 *
 * @param {HTMLElement} el - The pricing-footer block element
 */
export default function init(el) {
  const firstRow = el.querySelector(':scope > div');
  if (!firstRow) return;

  const columns = Array.from(firstRow.children);
  el.innerHTML = '';
  el.classList.add('ax-grid-container', 'small-gap');

  columns
    .filter((column) => column.innerHTML.trim() !== '')
    .forEach((column) => {
      el.append(column);
    });

  // Debounced calculation function for better performance
  const runWidthCalculation = debounce(
    () => getMerchCardWidth(el),
    CONFIG.RESIZE_DEBOUNCE_MS,
  );

  // Initial calculation after browser has painted
  requestAnimationFrame(() => {
    requestAnimationFrame(runWidthCalculation);
  });

  // Setup observers with proper cleanup
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(runWidthCalculation);
    resizeObserver.observe(document.documentElement);
    el.resizeObserver = resizeObserver;
  } else {
    // Fallback for older browsers
    const resizeHandler = runWidthCalculation;
    window.addEventListener('resize', resizeHandler);
    el.resizeHandler = resizeHandler;
  }

  // Cleanup function for memory management
  el.destroy = () => {
    if (el.resizeObserver) {
      el.resizeObserver.disconnect();
      el.resizeObserver = null;
    }
    if (el.resizeHandler) {
      window.removeEventListener('resize', el.resizeHandler);
      el.resizeHandler = null;
    }
  };
}
