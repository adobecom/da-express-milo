import { getIconElementDeprecated } from '../../scripts/utils.js';
import { ComparisonTableState } from './comparison-table-state.js';

const BREAKPOINTS = {
  DESKTOP: '(min-width: 1024px)',
  TABLET: '(min-width: 768px)',
};

const DROPDOWN = {
  MIN_COLUMNS_FOR_SELECTOR: 2,
};

let createTag;

/**
 * Set the createTag function from utils
 * @param {Function} createTagFn - The createTag function from utils
 */
export function setCreateTag(createTagFn) {
  createTag = createTagFn;
}

/**
 * Convert heading elements to divs within the sticky header
 * @param {HTMLElement} stickyHeader - The sticky header element
 */
function convertHeadingsToDivs(stickyHeader) {
  const headings = stickyHeader.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading) => {
    const div = document.createElement('div');
    Array.from(heading.attributes).forEach((attr) => {
      div.setAttribute(attr.name, attr.value);
    });
    div.classList.add('sticky-header-title');
    div.setAttribute('data-original-tag', heading.tagName.toLowerCase());
    while (heading.firstChild) {
      div.appendChild(heading.firstChild);
    }
    heading.parentNode.replaceChild(div, heading);
  });
}

/**
 * Convert divs back to their original heading elements
 * @param {HTMLElement} stickyHeader - The sticky header element
 */
function convertDivsToHeadings(stickyHeader) {
  const divs = stickyHeader.querySelectorAll('.sticky-header-title[data-original-tag]');
  divs.forEach((div) => {
    const originalTag = div.getAttribute('data-original-tag');
    const allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const safeTag = allowedTags.includes(originalTag) ? originalTag : 'div';
    const heading = document.createElement(safeTag);
    Array.from(div.attributes).forEach((attr) => {
      if (attr.name !== 'data-original-tag') {
        heading.setAttribute(attr.name, attr.value);
      }
    });
    heading.classList.remove('sticky-header-title');
    while (div.firstChild) {
      heading.appendChild(div.firstChild);
    }
    div.parentNode.replaceChild(heading, div);
  });
}

/**
 * Create plan dropdown choices for the plan selector
 * @param {Array} headers - Array of header names
 * @returns {HTMLElement} - The dropdown choices element
 */
function createPlanDropdownChoices(headers) {
  const planSelectorChoices = document.createElement('div');
  planSelectorChoices.classList.add('plan-selector-choices', 'invisible-content');
  planSelectorChoices.setAttribute('role', 'listbox');
  planSelectorChoices.setAttribute('aria-label', 'Plan options');

  for (let i = 0; i < headers.length; i += 1) {
    const option = document.createElement('div');
    const a = document.createElement('div');
    a.classList.add('plan-selector-choice-text');
    a.textContent = headers[i];
    option.appendChild(a);
    option.classList.add('plan-selector-choice');
    option.value = i;
    option.setAttribute('data-plan-index', i);
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');
    option.setAttribute('tabindex', '-1');
    planSelectorChoices.appendChild(option);
  }
  return planSelectorChoices;
}

/**
 * Create a plan selector dropdown for plan switching
 * @param {Array} headers - Array of header names
 * @param {number} planIndex - Index of the plan
 * @param {HTMLElement} planCellWrapper - The plan cell wrapper element
 */
function createPlanSelector(headers, planIndex, planCellWrapper) {
  const selectWrapper = document.createElement('div');
  selectWrapper.classList.add('plan-selector-wrapper');
  const chevron = getIconElementDeprecated('chevron-down');
  selectWrapper.appendChild(chevron);

  const planSelector = document.createElement('div');
  planSelector.classList.add('plan-selector');
  planSelector.setAttribute('data-plan-index', planIndex);

  selectWrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      planSelector.click();
    }
  });

  selectWrapper.appendChild(planSelector);
  planSelector.appendChild(createPlanDropdownChoices(headers));

  planCellWrapper.addEventListener('click', (e) => {
    if (!e.target.closest('.action-area') && !e.target.closest('.plan-selector-wrapper')) {
      planSelector.click();
    }
  });

  planCellWrapper.addEventListener('keydown', (e) => {
    if (e.target === planCellWrapper && !e.target.closest('.action-area')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        planSelector.click();
      } else if (e.key === 'ArrowDown') {
        const dropdown = planSelector.querySelector('.plan-selector-choices');
        const isOpen = !dropdown.classList.contains('invisible-content');

        if (!isOpen) {
          e.preventDefault();
          planSelector.click();
          setTimeout(() => {
            const firstOption = dropdown.querySelector(
              '.plan-selector-choice:not(.invisible-content)',
            );
            if (firstOption) {
              firstOption.classList.add('focused');
              firstOption.focus();
            }
          }, 0);
        } else {
          const focusedOption = dropdown.querySelector('.plan-selector-choice.focused');
          if (!focusedOption) {
            e.preventDefault();
            const firstOption = dropdown.querySelector(
              '.plan-selector-choice:not(.invisible-content)',
            );
            if (firstOption) {
              firstOption.classList.add('focused');
              firstOption.focus();
            }
          }
        }
      }
    }
  });
  planCellWrapper.appendChild(selectWrapper);
}

/**
 * Create the sticky header for the comparison table
 * @param {Array} headerGroup - Array containing header elements
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 * @returns {Object} - Object containing sticky header element and column titles
 */
export function createStickyHeader(headerGroup, comparisonBlock) {
  const headerGroupElement = headerGroup[1];
  headerGroupElement.classList.add('sticky-header');

  const headerWrapper = document.createElement('div');
  headerWrapper.classList.add('sticky-header-wrapper');

  while (headerGroupElement.firstChild) {
    headerWrapper.appendChild(headerGroupElement.firstChild);
  }
  headerGroupElement.appendChild(headerWrapper);

  const headerCells = headerWrapper.querySelectorAll('div');
  const headers = Array.from(headerCells).map((cell) => {
    const children = Array.from(cell.children);
    const childContent = children.filter((child) => !child.querySelector('a'));
    return childContent.map((content) => content.textContent.trim()).join(', ').replaceAll(',', '');
  });
  const totalColumns = headers.length;
  headers.splice(0, 1);
  const noSubheaders = Array.from(headerGroupElement.querySelectorAll('p')).length === 0;

  comparisonBlock.classList.add(`columns-${totalColumns}`);
  headerCells.forEach((headerCell, cellIndex) => {
    if (cellIndex === 0) {
      headerCell.classList.add('first-cell');
    } else {
      const planCellWrapper = createTag('div', { class: 'plan-cell-wrapper' });

      if (headers.length === DROPDOWN.MIN_COLUMNS_FOR_SELECTOR) {
        planCellWrapper.classList.add('two-columns');
      }

      const isDesktop = window.matchMedia(BREAKPOINTS.DESKTOP).matches;
      const hasMoreThanTwoColumns = headers.length > DROPDOWN.MIN_COLUMNS_FOR_SELECTOR;
      if (!isDesktop && hasMoreThanTwoColumns) {
        planCellWrapper.setAttribute('tabindex', '0');
        planCellWrapper.setAttribute('role', 'button');
        planCellWrapper.setAttribute('aria-label', `Select plan ${cellIndex}`);
        planCellWrapper.setAttribute('aria-expanded', 'false');
        planCellWrapper.setAttribute('aria-haspopup', 'listbox');
      }

      if (noSubheaders) {
        planCellWrapper.classList.add('no-subheaders');
      }

      headerCell.classList.add('plan-cell');
      if (cellIndex === headerCells.length - 1) {
        headerCell.classList.add('last');
      }
      const { length } = headerCell.children;
      for (let i = 0; i < length; i += 1) {
        planCellWrapper.appendChild(headerCell.children[0]);
      }

      if (headers.length > DROPDOWN.MIN_COLUMNS_FOR_SELECTOR) {
        createPlanSelector(headers, cellIndex - 1, planCellWrapper);
      }

      headerCell.appendChild(planCellWrapper);
      const button = planCellWrapper.querySelector('.action-area');
      if (button) {
        headerCell.appendChild(button);
      }
    }
    headerWrapper.appendChild(headerCell);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.plan-cell-wrapper')) {
      headerWrapper.querySelectorAll('.plan-selector-choices').forEach((choices) => {
        choices.classList.add('invisible-content');
        choices.querySelectorAll('.plan-selector-choice').forEach((opt) => {
          opt.setAttribute('tabindex', '-1');
          opt.classList.remove('focused');
        });
      });
    }
  });

  return { stickyHeaderEl: headerGroupElement, colTitles: headers };
}

/**
 * Get the bottom boundary of the comparison block content
 * Returns the bottom of the last table container regardless of collapsed state
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 * @returns {number} - The bottom Y coordinate of the block content
 */
function getContentBottom(comparisonBlock) {
  const allTableContainers = comparisonBlock.querySelectorAll('.table-container');
  if (allTableContainers.length > 0) {
    const lastContainer = allTableContainers[allTableContainers.length - 1];
    return lastContainer.getBoundingClientRect().bottom;
  }
  return comparisonBlock.getBoundingClientRect().bottom;
}

/**
 * Initialize sticky behavior for the header element
 * Uses visual bounds exclusively for all sticky state decisions
 * @param {HTMLElement} stickyHeader - The sticky header element
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 */
export function initStickyBehavior(stickyHeader, comparisonBlock) {
  const placeholder = document.createElement('div');
  placeholder.classList.add('sticky-header-placeholder');
  placeholder.style.display = 'none';
  comparisonBlock.insertBefore(placeholder, stickyHeader.nextSibling);

  let isSticky = false;
  let isRetracted = false;
  let stickyHeight = 0;

  const getCSSNumericValue = (property) => {
    const value = window.getComputedStyle(comparisonBlock).getPropertyValue(property);
    return Number.parseFloat(value) || 0;
  };

  const getStickyTriggerOffset = () => {
    if (!window.matchMedia(BREAKPOINTS.DESKTOP).matches) return 0;
    return getCSSNumericValue('--gnav-offset-height');
  };

  // Sentinel at the top of the block to detect when header should become sticky
  const headerSentinel = document.createElement('div');
  headerSentinel.style.cssText = 'position:absolute;top:0;height:1px;width:100%;pointer-events:none';
  comparisonBlock.style.position = 'relative';
  comparisonBlock.insertAdjacentElement('beforebegin', headerSentinel);

  const getParentSection = () => comparisonBlock.closest('.section')
    || comparisonBlock.closest('section');

  const isSectionHidden = () => {
    const section = getParentSection();
    if (!section) return false;
    return section.classList.contains('content-toggle-hidden')
      || section.classList.contains('display-none')
      || section.style.display === 'none';
  };

  const applyStickyState = () => {
    if (isSticky && !isRetracted) return;

    const stickyHeaderHeight = stickyHeader.offsetHeight;
    stickyHeight = stickyHeaderHeight;
    stickyHeader.classList.add('is-stuck');
    stickyHeader.classList.remove('is-retracted');
    placeholder.style.display = 'flex';
    placeholder.style.height = `${stickyHeaderHeight}px`;

    ComparisonTableState.closeDropdown(stickyHeader
      ?.querySelector('.plan-cell-wrapper[aria-expanded="true"]')?.querySelector('.plan-selector'));
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    convertHeadingsToDivs(stickyHeader);
    stickyHeader.setAttribute('aria-hidden', 'true');
    if (window.matchMedia(BREAKPOINTS.DESKTOP).matches) {
      stickyHeader.classList.add('gnav-offset');
    }

    isRetracted = false;
    isSticky = true;
  };

  const removeStickyState = () => {
    if (!isSticky) return;
    stickyHeader.classList.remove('is-stuck', 'is-retracted', 'gnav-offset');
    placeholder.style.display = 'none';
    convertDivsToHeadings(stickyHeader);
    stickyHeader.removeAttribute('aria-hidden');
    isRetracted = false;
    isSticky = false;
  };

  const retractStickyHeader = () => {
    if (!isSticky || isRetracted) return;
    placeholder.style.display = 'none';
    stickyHeader.classList.remove('gnav-offset');
    stickyHeader.classList.add('is-retracted');
    isRetracted = true;
  };

  const revealStickyHeader = () => {
    if (!isSticky || !isRetracted) return;
    placeholder.style.display = 'flex';
    placeholder.style.height = `${stickyHeight}px`;
    if (window.matchMedia(BREAKPOINTS.DESKTOP).matches) {
      stickyHeader.classList.add('gnav-offset');
    }
    stickyHeader.classList.remove('is-retracted');
    isRetracted = false;
  };

  /**
   * Update sticky state based on visual bounds
   * Single source of truth for all sticky behavior
   */
  const updateStickyState = () => {
    if (isSectionHidden()) {
      if (isSticky) removeStickyState();
      return;
    }

    const headerTop = headerSentinel.getBoundingClientRect().top;
    const stickyTriggerOffset = getStickyTriggerOffset();
    const contentBottom = getContentBottom(comparisonBlock);
    const isPastHeader = headerTop < stickyTriggerOffset;
    // Offset by sticky header height for smoother transition
    const headerOffset = stickyHeight || stickyHeader.offsetHeight;
    const isContentVisible = contentBottom > headerOffset;

    if (!isPastHeader) {
      // Header is in view - remove sticky
      removeStickyState();
    } else if (isPastHeader && !isContentVisible) {
      // Past header and content is above viewport - retract
      if (!isSticky) {
        applyStickyState();
      }
      retractStickyHeader();
    } else if (isPastHeader && isContentVisible) {
      // Past header and content is visible - show sticky header
      if (!isSticky) {
        applyStickyState();
      } else if (isRetracted) {
        revealStickyHeader();
      }
    }
  };

  // Single scroll listener handles all sticky state changes
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateStickyState();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  // Observer for initial state and when scrolling back to top
  const headerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (isSectionHidden()) {
          if (isSticky) removeStickyState();
          return;
        }
        // When sentinel comes back into view, remove sticky
        const stickyTriggerOffset = getStickyTriggerOffset();
        if (entry.isIntersecting
          && entry.boundingClientRect.top >= stickyTriggerOffset
          && isSticky) {
          removeStickyState();
        }
      });
    },
    { threshold: 0 },
  );
  headerObserver.observe(headerSentinel);

  // Watch for content-toggle visibility changes
  const parentSection = getParentSection();
  if (parentSection) {
    const mutationObserver = new MutationObserver(() => {
      if (isSectionHidden() && isSticky) {
        removeStickyState();
      }
    });
    mutationObserver.observe(parentSection, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }
}

/**
 * Synchronize the heights of plan cell wrappers
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 */
export function synchronizePlanCellHeights(comparisonBlock) {
  const planCellWrappers = Array.from(comparisonBlock.querySelectorAll('.plan-cell-wrapper'));

  if (planCellWrappers.length === 0) return;

  planCellWrappers.forEach((wrapper) => {
    wrapper.style.height = 'auto';
  });

  const stickyHeader = comparisonBlock.querySelector('.is-stuck');
  if (stickyHeader) return;

  const isDesktop = window.matchMedia(BREAKPOINTS.DESKTOP).matches;
  const visibleWrappers = isDesktop
    ? planCellWrappers
    : planCellWrappers.filter((wrapper) => {
      const parentCell = wrapper.closest('.plan-cell');
      return !parentCell || !parentCell.classList.contains('invisible-content');
    });

  if (visibleWrappers.length === 0) return;

  let maxHeight = 0;
  visibleWrappers.forEach((wrapper) => {
    const { offsetHeight } = wrapper;
    if (offsetHeight > maxHeight) {
      maxHeight = offsetHeight;
    }
  });

  visibleWrappers.forEach((wrapper) => {
    wrapper.style.height = `${maxHeight}px`;
  });
}
