import { getLibs, getFixedTopOffset } from '../../scripts/utils.js';
import { ComparisonTableState, initComparisonTableState } from './comparison-table-state.js';
import handleTooltip, { adjustElementPosition, getTooltipMatch } from '../../scripts/widgets/tooltip.js';
import { createStickyHeader, initStickyBehavior, synchronizePlanCellHeights, setCreateTag } from './sticky-header.js';

let createTag;

const BREAKPOINTS = {
  DESKTOP: '(min-width: 1024px)',
  TABLET: '(min-width: 768px)',
};

const DROPDOWN = {
  FIRST_PLAN_INDEX: 0,
  SECOND_PLAN_INDEX: 1,
  MIN_COLUMNS_FOR_SELECTOR: 2,
};

const POSITIONING = {
  ARIA_LIVE_LEFT: '-10000px',
  ARIA_LIVE_SIZE: '1px',
};

const ACCORDION_TRANSITION_DURATION = 400;
const ACCORDION_SCROLL_TIMEOUT = 1200;

const TOOLTIP_PATTERN = /\[\[([^]+)\]\]([^]+)\[\[\/([^]+)\]\]/g;

/**
 * Calculating final page scroll position using the sticky-header and
 * global-navigation offsets used by the comparison table.
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 * @param {number} anchorTop - target header's expected final document top
 * @param {number} maxScrollPosition - expected final maximum scroll position
 * @returns {number} - page scroll position to animate toward
 */
const getAccordionScrollTarget = (comparisonBlock, anchorTop, maxScrollPosition) => {
  if (!comparisonBlock) return window.scrollY;

  const stickyHeader = comparisonBlock.querySelector('.sticky-header');
  const isStickyActive = stickyHeader?.classList.contains('is-stuck')
    && !stickyHeader.classList.contains('is-retracted');
  const stickyHeaderHeight = stickyHeader?.offsetHeight || 0;
  const gnavOffset = getFixedTopOffset();
  const tableGap = 16;
  const safeMaxScrollPosition = Math.max(0, maxScrollPosition);
  const clampTarget = (offset) => Math.min(
    Math.max(anchorTop - offset, 0),
    safeMaxScrollPosition,
  );

  let initialOffset = tableGap;
  if (isStickyActive) {
    initialOffset = stickyHeaderHeight + gnavOffset + tableGap;
  } else if (stickyHeader) {
    const headerSentinel = comparisonBlock.previousElementSibling;
    if (headerSentinel) {
      const headerSentinelTop = headerSentinel.getBoundingClientRect().top;
      const targetScrollPosition = clampTarget(tableGap);
      const scrollDelta = targetScrollPosition - window.scrollY;
      const headerSentinelTopAfterScroll = headerSentinelTop - scrollDelta;

      if (headerSentinelTopAfterScroll < gnavOffset) {
        initialOffset = stickyHeaderHeight + gnavOffset + tableGap;
      }
    }
  }

  return clampTarget(initialOffset);
};

const easeInOutCubic = (progress) => (progress < 0.5
  ? 4 * progress * progress * progress
  : 1 - ((-2 * progress + 2) ** 3) / 2);

function handleCellIcons(cell) {
  if (cell.tagName.toLowerCase() !== 'td') return;
  let multiParagraph = false;
  let marker = cell;
  if (cell.querySelector('p')) {
    multiParagraph = true;
    marker = cell.querySelector('p');
  }

  const text = marker.textContent.trim()[0];
  if (text === '+') {
    if (multiParagraph) {
      marker.remove();
    } else {
      cell.textContent = '';
    }
    const wrapper = createTag('div', { class: 'icon-wrapper' });
    const icon = createTag('span', { class: 'icon-checkmark-no-fill', role: 'img' });
    icon.setAttribute('aria-label', 'Yes');
    wrapper.prepend(icon);

    cell.prepend(wrapper);
  } else if (text === '-') {
    if (multiParagraph) {
      marker.remove();
    } else {
      cell.textContent = '';
    }
    const wrapper = createTag('div', { class: 'icon-wrapper' });
    const icon = createTag('span', { class: 'icon-crossmark', role: 'img' });
    icon.setAttribute('aria-label', 'No');
    wrapper.prepend(icon);
    cell.prepend(wrapper);
  } else {
    const wrapper = createTag('div', { class: 'icon-wrapper' });
    const p = createTag('p', { class: 'icon-wrapper-text' });
    p.textContent = marker.textContent.trim();
    marker.textContent = '';
    wrapper.appendChild(p);
    cell.prepend(wrapper);
  }
}

function applyTextOnlyIconPadding(cell) {
  if (!cell.classList.contains('feature-cell')) return;
  cell.classList.remove('no-icon-offset');
  const wrapper = cell.querySelector('.icon-wrapper');
  if (!wrapper) return;
  const hasSpanIcon = wrapper.querySelector('span');
  const wrapperText = wrapper.textContent.trim();
  if (!hasSpanIcon && wrapperText.length > 0) {
    cell.classList.add('no-icon-offset');
  }
}

function getFooter(blockChildren) {
  let footer;
  const lastChild = blockChildren[blockChildren.length - 1];
  if (lastChild.children.length === 1) {
    footer = blockChildren.pop();
    footer.classList.add('footer');
  }
  return footer;
}

function partitionContentBySeparators(blockChildren) {
  const contentGroups = [];
  let currentSection = [];

  let isSeparator = false;
  let isOpenSeparator = false;
  let noAccordion = false;

  let nextSectionClasses = [];
  for (const childElement of blockChildren) {
    isSeparator = childElement.querySelector('hr');
    isOpenSeparator = childElement.textContent.trim() === '+++';
    noAccordion = childElement.textContent.trim() === '===';

    if (isSeparator || isOpenSeparator || noAccordion) {
      if (currentSection.length > 0) {
        currentSection[0].classList.add(...nextSectionClasses);
        nextSectionClasses = [];
        if (isOpenSeparator) {
          nextSectionClasses.push('open-separator');
        }
        if (noAccordion) {
          nextSectionClasses.push('no-accordion');
        }
        contentGroups.push(currentSection);
        currentSection = [];
      }
    } else {
      currentSection.push(childElement);
    }
  }
  if (currentSection.length > 0) {
    currentSection[0].classList.add(...nextSectionClasses);
    contentGroups.push(currentSection);
  }
  return contentGroups;
}

function createToggleButton(isHidden, noAccordion) {
  const button = document.createElement('button');
  button.classList.add('toggle-button');
  button.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
  if (noAccordion) {
    button.setAttribute('role', 'presentation');
    button.setAttribute('tabindex', '-1');
  }
  const iconSpan = document.createElement('span');
  iconSpan.classList.add('icon', 'expand-button');
  if (isHidden) {
    iconSpan.classList.add('open');
  }
  button.appendChild(iconSpan);
  return button;
}

function createTableHeader(sectionHeaderRow) {
  const sectionHeaderContainer = document.createElement('div');
  sectionHeaderContainer.classList.add('first-row');

  const cells = Array.from(sectionHeaderRow.children);
  const [titleCell, ...colorCells] = cells;

  let sectionTitle = '';
  if (titleCell) {
    sectionTitle = titleCell.textContent.trim();
    sectionHeaderContainer.appendChild(titleCell);
  }

  colorCells.forEach((colorCell) => {
    colorCell.textContent = '';
  });

  return { sectionHeaderContainer, sectionTitle };
}

function createAccessibilityHeaders(sectionTitle, colTitles) {
  const screenReaderHeaders = document.createElement('thead');
  const headerRow = document.createElement('tr');
  screenReaderHeaders.classList.add('invisible-headers');

  const sectionHeader = document.createElement('th');
  sectionHeader.textContent = sectionTitle;
  headerRow.appendChild(sectionHeader);

  colTitles.forEach((columnTitle) => {
    const columnHeader = document.createElement('th');
    columnHeader.setAttribute('scope', 'col');
    columnHeader.textContent = columnTitle;
    headerRow.appendChild(columnHeader);
  });

  screenReaderHeaders.appendChild(headerRow);
  return screenReaderHeaders;
}

function createTableRow(featureRowDiv) {
  const tableRow = document.createElement('tr');
  tableRow.classList.add('ctv2-tr');
  const featureCells = featureRowDiv.children;
  const noText = featureRowDiv.querySelectorAll('p').length === 0;
  Array.from(featureCells).forEach((cellContent, cellIndex) => {
    let tableCell;
    if (cellIndex === 0) {
      tableCell = document.createElement('th');
      tableCell.classList.add('feature-cell-header');
      tableCell.classList.add('ctv2-th');

      tableCell.setAttribute('scope', 'row');
    } else {
      tableCell = document.createElement('td');
      tableCell.classList.add('feature-cell');
      tableCell.classList.add('ctv2-td');
    }
    tableCell.innerHTML = cellContent.innerHTML;

    if (tableCell.children.length > 0) {
      tableCell.children[0].classList.add('ctv2-th-header');
      for (let i = 1; i < tableCell.children.length; i += 1) {
        tableCell.children[i].classList.add('ctv2-th-subheader');
      }
    }
    tableCell.setAttribute('data-plan-index', cellIndex - 1);

    if (noText) {
      tableCell.classList.add('no-text');
    }
    for (let i = 0; i < cellContent.classList.length; i += 1) {
      tableCell.classList.add(cellContent.classList[i]);
    }

    handleCellIcons(tableCell);

    applyTextOnlyIconPadding(tableCell);

    const tooltipElements = cellIndex === 0 ? [tableCell] : tableCell.querySelectorAll('p');

    const { tooltipMatch, tooltipContainer } = getTooltipMatch(tooltipElements, TOOLTIP_PATTERN);
    handleTooltip(tooltipElements, TOOLTIP_PATTERN, tooltipMatch, tooltipContainer);

    tableRow.appendChild(tableCell);
  });
  return tableRow;
}

function convertToTable(sectionGroup, columnHeaders) {
  const tableContainer = document.createElement('div');
  tableContainer.classList.add('table-container');
  const comparisonTable = document.createElement('table');
  const tableBody = document.createElement('tbody');

  if (sectionGroup.length === 0) return tableContainer;

  const sectionHeaderDiv = sectionGroup[0];
  const shouldHideTable = !sectionHeaderDiv.classList.contains('open-separator') && !sectionHeaderDiv.classList.contains('no-accordion');
  if (shouldHideTable) {
    comparisonTable.classList.add('hide-table');
  }
  const noAccordion = sectionHeaderDiv.classList.contains('no-accordion');
  if (noAccordion) {
    tableContainer.classList.add('no-accordion');
  }

  const { sectionHeaderContainer, sectionTitle } = createTableHeader(sectionHeaderDiv);

  const toggleButton = createToggleButton(shouldHideTable, noAccordion);
  toggleButton.onclick = () => {
    const wasExpanded = !comparisonTable.classList.contains('hide-table');
    comparisonTable.classList.toggle('hide-table');
    toggleButton.querySelector('span').classList.toggle('open');
    toggleButton.setAttribute('aria-expanded', wasExpanded ? 'false' : 'true');
  };

  const header = sectionHeaderContainer.querySelector('h2,h3,h4,h5,h6');
  if (header) {
    toggleButton.prepend(header);
    toggleButton.setAttribute('name', header.textContent.trim());
  }
  sectionHeaderContainer.appendChild(toggleButton);
  tableContainer.prepend(sectionHeaderContainer);
  const screenReaderHeaders = createAccessibilityHeaders(sectionTitle, columnHeaders);
  comparisonTable.appendChild(screenReaderHeaders);

  for (let featureIndex = 1; featureIndex < sectionGroup.length; featureIndex += 1) {
    const featureRow = createTableRow(sectionGroup[featureIndex]);
    tableBody.appendChild(featureRow);
  }

  comparisonTable.appendChild(tableBody);
  tableContainer.appendChild(comparisonTable);
  return tableContainer;
}

function applyColumnShading(headerGroup, comparisonBlock) {
  if (!headerGroup || !headerGroup[0]) return;
  let columnShadingConfig = Array.from(headerGroup[0].querySelectorAll('div')).map((d) => d.textContent.trim());
  columnShadingConfig = columnShadingConfig.map((entry) => entry.split(','));
  const rows = comparisonBlock.querySelectorAll('div');

  rows.forEach((row) => {
    const cells = row.querySelectorAll('div');
    cells.forEach((cell, cellIndex) => {
      if (columnShadingConfig[cellIndex]) {
        columnShadingConfig[cellIndex].forEach((entry) => {
          if (entry !== '') {
            cell.classList.add(entry.trim().toLowerCase());
          }
        });
      }
    });
  });
}

/**
 * Initialize the comparison table dependencies and utilities
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 * @returns {Promise<void>}
 */
async function initializeComparisonTable(comparisonBlock) {
  await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
    import(`${getLibs()}/utils/decorate.js`),
    initComparisonTableState(),
  ]).then(([utils, , { decorateButtons }]) => {
    createTag = utils.createTag;
    setCreateTag(utils.createTag);
    decorateButtons(comparisonBlock);
  });
}

/**
 * Process and prepare the comparison table content
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 * @returns {Object} - Processed content sections and footer
 */
function processComparisonContent(comparisonBlock) {
  const blockChildren = Array.from(comparisonBlock.children);
  const footer = getFooter(blockChildren);
  const contentSections = partitionContentBySeparators(blockChildren);
  if (contentSections[0]) {
    applyColumnShading(contentSections[0], comparisonBlock);
  }
  comparisonBlock.innerHTML = '';

  return { contentSections, footer };
}

/**
 * Create and configure the aria-live region for accessibility announcements
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 * @returns {HTMLElement} - The configured aria-live region
 */
function createAriaLiveRegion(comparisonBlock) {
  const ariaLiveRegion = createTag('div', {
    class: 'sr-only',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  });
  ariaLiveRegion.style.position = 'absolute';
  ariaLiveRegion.style.left = POSITIONING.ARIA_LIVE_LEFT;
  ariaLiveRegion.style.width = POSITIONING.ARIA_LIVE_SIZE;
  ariaLiveRegion.style.height = POSITIONING.ARIA_LIVE_SIZE;
  ariaLiveRegion.style.overflow = 'hidden';
  comparisonBlock.appendChild(ariaLiveRegion);

  return ariaLiveRegion;
}

function applyTabAnchorToButtons(comparisonBlock) {
  const closestTab = comparisonBlock.closest('[role="tabpanel"]');
  if (!closestTab) return;
  const tabId = parseInt(closestTab.id.split('-').pop(), 10);
  if (Number.isNaN(tabId)) return;
  comparisonBlock.setAttribute('id', `pricing-table-${tabId}`);
}

/**
 * Process button styling for fill buttons
 * @param {Array} contentSections - The content sections array
 */
function processButtonStyling(contentSections) {
  const primarySection = contentSections[0];
  const buttonContainer = primarySection && primarySection[1];
  if (!buttonContainer) return;
  const buttons = buttonContainer.querySelectorAll('.con-button');
  buttons.forEach((button) => {
    if (button.textContent.trim().includes('#_button-fill')) {
      button.classList.add('fill');
      button.textContent = button.textContent.replace('#_button-fill', '');
    }
  });
}

/**
 * Create comparison table sections
 * @param {Array} contentSections - The content sections array
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 * @param {Array} colTitles - Column titles for the table
 */
function createTableSections(contentSections, comparisonBlock, colTitles) {
  for (let sectionIndex = 1; sectionIndex < contentSections.length; sectionIndex += 1) {
    const sectionTable = convertToTable(contentSections[sectionIndex], colTitles);
    comparisonBlock.appendChild(sectionTable);
  }
}

/**
 * Initialize accordion behavior for the comparison table
 * When accordion variant is enabled:
 * - First section is open by default, others are closed
 * - Only one section can be open at a time
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 */
function initializeAccordionBehavior(comparisonBlock, stickyReleaseControls = {}) {
  if (!comparisonBlock.classList.contains('accordion')) return;

  const {
    suspendStickyRelease,
    resumeStickyRelease,
  } = stickyReleaseControls;
  const tableContainers = Array.from(
    comparisonBlock.querySelectorAll('.table-container:not(.no-accordion)'),
  );
  if (tableContainers.length === 0) return;

  let activeContainer = null;
  let currentAnimationId = null;
  let cancelCurrentAnimation = null;

  const measureExpandedTableHeight = (table) => {
    const wasCollapsed = table.classList.contains('accordion-collapsed');
    const previousHeight = table.style.height;
    const previousOpacity = table.style.opacity;

    if (wasCollapsed) table.classList.remove('accordion-collapsed');
    table.style.height = 'auto';
    table.style.opacity = '1';
    const expandedHeight = table.getBoundingClientRect().height;

    if (wasCollapsed) table.classList.add('accordion-collapsed');
    table.style.height = previousHeight;
    table.style.opacity = previousOpacity;
    return expandedHeight;
  };

  const animateTablesAndScroll = ({
    closingTable,
    closingStartHeight,
    openingTable,
    openingEndHeight,
    startScroll,
    targetScroll,
    onComplete,
  }) => {
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : ACCORDION_TRANSITION_DURATION;
    const startTime = performance.now();
    const root = document.documentElement;
    const previousScrollBehavior = root.style.getPropertyValue('scroll-behavior');
    const previousScrollBehaviorPriority = root.style.getPropertyPriority('scroll-behavior');
    root.style.setProperty('scroll-behavior', 'auto', 'important');

    const animatedTables = [closingTable, openingTable].filter(Boolean);
    animatedTables.forEach((table) => table.classList.add('accordion-animating'));

    let finished = false;
    const cleanup = () => {
      window.removeEventListener('wheel', cancelOnUserInput);
      window.removeEventListener('touchstart', cancelOnUserInput);
      window.removeEventListener('keydown', cancelOnUserInput);
      if (previousScrollBehavior) {
        root.style.setProperty('scroll-behavior', previousScrollBehavior, previousScrollBehaviorPriority);
      } else {
        root.style.removeProperty('scroll-behavior');
      }
      animatedTables.forEach((table) => {
        table.classList.remove('accordion-animating');
        table.style.height = '';
        table.style.opacity = '';
      });
      currentAnimationId = null;
      cancelCurrentAnimation = null;
      if (typeof onComplete === 'function') onComplete();
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      if (currentAnimationId) cancelAnimationFrame(currentAnimationId);
      cleanup();
    };
    const cancelOnUserInput = () => finish();

    cancelCurrentAnimation = finish;
    window.addEventListener('wheel', cancelOnUserInput, { passive: true });
    window.addEventListener('touchstart', cancelOnUserInput, { passive: true });
    window.addEventListener('keydown', cancelOnUserInput);

    const frame = (now) => {
      const progress = duration === 0 ? 1 : Math.min((now - startTime) / duration, 1);
      const eased = easeInOutCubic(progress);

      if (closingTable) {
        closingTable.style.height = `${Math.max(0, closingStartHeight * (1 - eased))}px`;
        closingTable.style.opacity = `${1 - eased}`;
      }
      if (openingTable) {
        openingTable.style.height = `${openingEndHeight * eased}px`;
        openingTable.style.opacity = `${eased}`;
      }

      const nextScroll = startScroll + ((targetScroll - startScroll) * eased);
      window.scrollTo(0, nextScroll);

      if (progress < 1) {
        currentAnimationId = requestAnimationFrame(frame);
      } else {
        finish();
      }
    };

    if (closingTable) {
      closingTable.style.height = `${closingStartHeight}px`;
      closingTable.style.opacity = '1';
    }
    if (openingTable) {
      openingTable.style.height = '0px';
      openingTable.style.opacity = '0';
    }
    currentAnimationId = requestAnimationFrame(frame);
  };

  tableContainers.forEach((container, index) => {
    const table = container.querySelector('table');
    const toggleButton = container.querySelector('.toggle-button');
    if (!table || !toggleButton) return;

    const iconSpan = toggleButton.querySelector('span');
    if (!iconSpan) return;

    table.classList.remove('hide-table');
    if (index === 0) {
      table.classList.remove('accordion-collapsed');
      table.removeAttribute('inert');
      table.removeAttribute('aria-hidden');
      iconSpan.classList.remove('open');
      toggleButton.setAttribute('aria-expanded', 'true');
      activeContainer = container;
    } else {
      table.classList.add('accordion-collapsed');
      table.setAttribute('inert', '');
      table.setAttribute('aria-hidden', 'true');
      iconSpan.classList.add('open');
      toggleButton.setAttribute('aria-expanded', 'false');
    }
  });

  tableContainers.forEach((container) => {
    const toggleButton = container.querySelector('.toggle-button');
    const table = container.querySelector('table');
    const iconSpan = toggleButton?.querySelector('span');
    if (!toggleButton || !table || !iconSpan) return;

    toggleButton.onclick = () => {
      if (cancelCurrentAnimation) cancelCurrentAnimation();
      else if (currentAnimationId) cancelAnimationFrame(currentAnimationId);

      const wasExpanded = !table.classList.contains('accordion-collapsed');
      const anchorTarget = container.querySelector('.toggle-button') || container;
      const startScroll = window.scrollY;

      if (wasExpanded) {
        const closingStartHeight = table.getBoundingClientRect().height;
        table.classList.add('accordion-collapsed');
        table.setAttribute('inert', '');
        table.setAttribute('aria-hidden', 'true');
        iconSpan.classList.add('open');
        toggleButton.setAttribute('aria-expanded', 'false');
        if (activeContainer === container) activeContainer = null;

        animateTablesAndScroll({
          closingTable: table,
          closingStartHeight,
          openingTable: null,
          openingEndHeight: 0,
          startScroll,
          targetScroll: startScroll,
        });
        return;
      }

      const closingContainer = activeContainer;
      const closingTable = closingContainer?.querySelector('table') || null;
      const closingStartHeight = closingTable
        ? closingTable.getBoundingClientRect().height
        : 0;
      const openingEndHeight = measureExpandedTableHeight(table);
      const currentAnchorTop = anchorTarget.getBoundingClientRect().top + startScroll;
      const closesAbove = closingContainer
        && closingContainer !== container
        && Boolean(closingContainer.compareDocumentPosition(container) & Node.DOCUMENT_POSITION_FOLLOWING);
      const finalAnchorTop = currentAnchorTop - (closesAbove ? closingStartHeight : 0);
      const finalDocumentHeight = document.documentElement.scrollHeight
        + openingEndHeight - closingStartHeight;
      const finalMaxScrollPosition = Math.max(0, finalDocumentHeight - window.innerHeight);
      const targetScroll = getAccordionScrollTarget(
        comparisonBlock,
        finalAnchorTop,
        finalMaxScrollPosition,
      );

      if (typeof suspendStickyRelease === 'function') suspendStickyRelease();

      let hasResumed = false;
      let fallbackResumeTimeout = null;
      const resumeOnce = () => {
        if (hasResumed) return;
        hasResumed = true;
        if (fallbackResumeTimeout) {
          window.clearTimeout(fallbackResumeTimeout);
          fallbackResumeTimeout = null;
        }
        if (typeof resumeStickyRelease === 'function') resumeStickyRelease();
      };

      if (typeof resumeStickyRelease === 'function') {
        fallbackResumeTimeout = window.setTimeout(
          resumeOnce,
          ACCORDION_TRANSITION_DURATION + ACCORDION_SCROLL_TIMEOUT,
        );
      }

      if (closingContainer && closingTable) {
        closingTable.classList.add('accordion-collapsed');
        closingTable.setAttribute('inert', '');
        closingTable.setAttribute('aria-hidden', 'true');
        const closingButton = closingContainer.querySelector('.toggle-button');
        closingButton?.querySelector('span')?.classList.add('open');
        closingButton?.setAttribute('aria-expanded', 'false');
      }

      table.classList.remove('hide-table', 'accordion-collapsed');
      iconSpan.classList.remove('open');
      toggleButton.setAttribute('aria-expanded', 'true');
      activeContainer = container;

      animateTablesAndScroll({
        closingTable,
        closingStartHeight,
        openingTable: table,
        openingEndHeight,
        startScroll,
        targetScroll,
        onComplete: () => {
          table.removeAttribute('inert');
          table.removeAttribute('aria-hidden');
          resumeOnce();
        },
      });
    };
  });
}

/**
 * Initialize state management for plan selectors
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 * @param {HTMLElement} stickyHeaderEl - The sticky header element
 * @param {HTMLElement} ariaLiveRegion - The aria-live region for announcements
 * @returns {Object} - The comparison table state instance
 */
function initializeStateManagement(comparisonBlock, stickyHeaderEl, ariaLiveRegion) {
  const planSelectors = Array.from(stickyHeaderEl.querySelectorAll('.plan-selector'));
  const comparisonTableState = new ComparisonTableState(ariaLiveRegion);
  comparisonTableState.initializePlanSelectors(comparisonBlock, planSelectors);
  const stickyControls = initStickyBehavior(stickyHeaderEl, comparisonBlock);

  return { comparisonTableState, stickyControls };
}

/**
 * Create the tabindex update handler for responsive behavior
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 * @param {Array} colTitles - Column titles for determining column count
 * @returns {Function} - The tabindex update function
 */
function createTabindexUpdateHandler(comparisonBlock, colTitles) {
  return () => {
    const isDesktop = window.matchMedia(BREAKPOINTS.DESKTOP).matches;
    const planCellWrappers = comparisonBlock.querySelectorAll('.plan-cell-wrapper');
    const hasMoreThanTwoColumns = colTitles.length > DROPDOWN.MIN_COLUMNS_FOR_SELECTOR;

    planCellWrappers.forEach((wrapper, index) => {
      if (isDesktop || !hasMoreThanTwoColumns) {
        wrapper.removeAttribute('tabindex');
        wrapper.removeAttribute('role');
        wrapper.removeAttribute('aria-label');
        wrapper.removeAttribute('aria-expanded');
        wrapper.removeAttribute('aria-haspopup');
      } else {
        wrapper.setAttribute('tabindex', '0');
        wrapper.setAttribute('role', 'button');
        wrapper.setAttribute('aria-label', `Select plan ${index + 1}`);
        wrapper.setAttribute('aria-expanded', 'false');
        wrapper.setAttribute('aria-haspopup', 'listbox');
      }
    });
  };
}

/**
 * Synchronize heights of icon-wrapper-text elements row-by-row
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 */
function synchronizeIconWrapperTextHeights(comparisonBlock) {
  const rows = comparisonBlock.querySelectorAll('.table-container tbody tr');
  const isDesktop = window.matchMedia(BREAKPOINTS.DESKTOP).matches;

  rows.forEach((row) => {
    const iconTextElements = Array.from(row.querySelectorAll('.icon-wrapper'));
    if (iconTextElements.length === 0) return;

    iconTextElements.forEach((iconText) => {
      iconText.style.height = 'auto';
    });

    const visibleIconTextElements = isDesktop
      ? iconTextElements
      : iconTextElements.filter((iconText) => {
        const parentCell = iconText.closest('.feature-cell');
        return !parentCell || !parentCell.classList.contains('invisible-content');
      });

    if (visibleIconTextElements.length <= 1) return;

    let maxHeight = 0;
    visibleIconTextElements.forEach((iconText) => {
      const { offsetHeight } = iconText;
      if (offsetHeight > maxHeight) {
        maxHeight = offsetHeight;
      }
    });

    if (maxHeight === 0) return;

    visibleIconTextElements.forEach((iconText) => {
      iconText.style.height = `${maxHeight}px`;
    });
  });
}

/**
 * Setup event listeners and observers for the comparison table
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 * @param {Function} updateTabindexOnResize - The tabindex update handler
 * @param {Object} stickyControls - The sticky behavior lifecycle controls
 */
function setupEventListeners(comparisonBlock, updateTabindexOnResize, stickyControls) {
  const handleResize = () => {
    updateTabindexOnResize();
    synchronizePlanCellHeights(comparisonBlock);
    synchronizeIconWrapperTextHeights(comparisonBlock);
  };

  window.addEventListener('resize', handleResize);

  let resizeFrame;
  const resizeObserver = new ResizeObserver(() => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null;
      if (!comparisonBlock.isConnected) {
        resizeObserver.disconnect();
        stickyControls?.destroy?.();
        window.removeEventListener('resize', handleResize);
        return;
      }
      synchronizePlanCellHeights(comparisonBlock);
      synchronizeIconWrapperTextHeights(comparisonBlock);
    });
  });

  const planCellWrappers = comparisonBlock.querySelectorAll('.plan-cell-wrapper');
  planCellWrappers.forEach((wrapper) => {
    resizeObserver.observe(wrapper);
  });

  resizeObserver.observe(comparisonBlock);

  adjustElementPosition();
}

/**
 * Main decoration function for the comparison table
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 */
export default async function decorate(comparisonBlock) {
  try {
    const parentSection = comparisonBlock.closest('section');
    if (parentSection && parentSection.classList.contains('content-toggle-hidden')) {
      const initOnReveal = (e) => {
        const panel = e?.detail?.panel;
        if (panel && panel === parentSection) {
          document.removeEventListener('content-toggle:activated', initOnReveal);
          decorate(comparisonBlock);
        }
      };
      document.addEventListener('content-toggle:activated', initOnReveal);
      return;
    }
    await initializeComparisonTable(comparisonBlock);

    const { contentSections, footer } = processComparisonContent(comparisonBlock);
    if (!contentSections.length || !contentSections[0]) {
      return;
    }

    const ariaLiveRegion = createAriaLiveRegion(comparisonBlock);

    processButtonStyling(contentSections);
    applyTabAnchorToButtons(comparisonBlock);

    const { stickyHeaderEl, colTitles } = createStickyHeader(contentSections[0], comparisonBlock);
    comparisonBlock.appendChild(stickyHeaderEl);

    createTableSections(contentSections, comparisonBlock, colTitles);

    const { stickyControls } = initializeStateManagement(
      comparisonBlock,
      stickyHeaderEl,
      ariaLiveRegion,
    );

    initializeAccordionBehavior(comparisonBlock, stickyControls);

    if (footer) {
      comparisonBlock.appendChild(footer);
    }

    synchronizeIconWrapperTextHeights(comparisonBlock);
    synchronizePlanCellHeights(comparisonBlock);

    const updateTabindexOnResize = createTabindexUpdateHandler(comparisonBlock, colTitles);

    setupEventListeners(comparisonBlock, updateTabindexOnResize, stickyControls);
    document.addEventListener('content-toggle:activated', (e) => {
      const panel = e?.detail?.panel;
      if (panel && panel.contains(comparisonBlock)) {
        synchronizeIconWrapperTextHeights(comparisonBlock);
        synchronizePlanCellHeights(comparisonBlock);
        window.dispatchEvent(new Event('resize'));
      }
    });
  } catch (error) {
    window.lana?.log(`Failed to initialize comparison table: ${error}`, { tags: 'comparison-table-v2', severity: 'error' });
    comparisonBlock.innerHTML = '<p>Unable to load comparison table. Please refresh the page.</p>';
  }
}
