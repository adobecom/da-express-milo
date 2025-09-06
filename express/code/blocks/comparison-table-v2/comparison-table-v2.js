import { getLibs } from '../../scripts/utils.js';
import { ComparisonTableState, initComparisonTableState } from './comparison-table-state.js';
import handleTooltip, { adjustElementPosition, getTooltipMatch } from '../../scripts/widgets/tooltip.js';
import { createStickyHeader, initStickyBehavior, synchronizePlanCellHeights, setCreateTag } from './sticky-header.js';

let createTag;

// Constants
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

const TOOLTIP_PATTERN = /\[\[([^]+)\]\]([^]+)\[\[\/([^]+)\]\]/g;

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
    const icon = createTag('span', { class: 'icon-checkmark-no-fill', role: 'img', alt: 'Yes' });
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
    const icon = createTag('span', { class: 'icon-crossmark', role: 'img', alt: 'No' });
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
  // Removed aria-label - button will get its name from the H3 inside it
  button.setAttribute('aria-expanded', !isHidden);
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
  // Add section title
  sectionHeaderContainer.appendChild(sectionHeaderRow.children[0]);
  const columnColors = [];
  for (let i = 0; i < sectionHeaderRow.children.length; i += 1) {
    const colorCell = sectionHeaderRow.children[i];
    const colorValue = colorCell.textContent.trim();
    columnColors.push(colorValue);
    colorCell.textContent = '';
  }

  return { sectionHeaderContainer, columnColors };
}

function createAccessibilityHeaders(sectionTitle, colTitles) {
  const screenReaderHeaders = document.createElement('thead');
  const headerRow = document.createElement('tr');
  screenReaderHeaders.classList.add('invisible-headers');

  // Add section title header
  const sectionHeader = document.createElement('th');
  sectionHeader.textContent = sectionTitle;
  headerRow.appendChild(sectionHeader);

  // Add column headers
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
  // tableRow.classList.add('ax-grid-container');
  const featureCells = featureRowDiv.children;
  const noText = featureRowDiv.querySelectorAll('p').length === 0;
  Array.from(featureCells).forEach((cellContent, cellIndex) => {
    let tableCell;
    if (cellIndex === 0) {
      tableCell = document.createElement('th');
      tableCell.classList.add('feature-cell-header');
      tableCell.setAttribute('scope', 'row');
      const tableHeaderWrapper = document.createElement('p');
      tableHeaderWrapper.innerHTML = cellContent.innerHTML;
      tableCell.appendChild(tableHeaderWrapper);
    } else {
      tableCell = document.createElement('td');
      tableCell.innerHTML = cellContent.innerHTML;
      tableCell.classList.add('feature-cell');
    }
    tableCell.setAttribute('data-plan-index', cellIndex - 1);

    if (noText) {
      tableCell.classList.add('no-text');
    }
    for (let i = 0; i < cellContent.classList.length; i += 1) {
      tableCell.classList.add(cellContent.classList[i]);
    }

    tableCell.innerHTML = cellContent.innerHTML;
    handleCellIcons(tableCell);

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

  // Process header row
  const sectionHeaderDiv = sectionGroup[0];
  const shouldHideTable = !sectionHeaderDiv.classList.contains('open-separator') && !sectionHeaderDiv.classList.contains('no-accordion');
  if (shouldHideTable) {
    comparisonTable.classList.add('hide-table');
  }
  const noAccordion = sectionHeaderDiv.classList.contains('no-accordion');
  if (noAccordion) {
    tableContainer.classList.add('no-accordion');
  }

  const { sectionHeaderContainer, columnColors } = createTableHeader(sectionHeaderDiv);

  // Add toggle button
  const toggleButton = createToggleButton(shouldHideTable, noAccordion);
  toggleButton.onclick = () => {
    const isExpanded = !comparisonTable.classList.contains('hide-table');
    comparisonTable.classList.toggle('hide-table');
    toggleButton.querySelector('span').classList.toggle('open');
    toggleButton.setAttribute('aria-expanded', !isExpanded);
  };

  const header = sectionHeaderContainer.querySelector('h2,h3,h4,h5,h6');
  if (header) {
    toggleButton.prepend(header);
    toggleButton.setAttribute('name', header.textContent.trim());
  }
  sectionHeaderContainer.appendChild(toggleButton);
  tableContainer.prepend(sectionHeaderContainer);
  // Add accessibility headers
  const sectionTitle = sectionHeaderDiv.children[0].textContent.trim();
  const screenReaderHeaders = createAccessibilityHeaders(sectionTitle, columnHeaders);
  comparisonTable.appendChild(screenReaderHeaders);

  // Process data rows
  for (let featureIndex = 1; featureIndex < sectionGroup.length; featureIndex += 1) {
    const featureRow = createTableRow(sectionGroup[featureIndex], columnColors);
    tableBody.appendChild(featureRow);
  }

  comparisonTable.appendChild(tableBody);
  tableContainer.appendChild(comparisonTable);
  return tableContainer;
}

function applyColumnShading(headerGroup, comparisonBlock) {
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
  applyColumnShading(contentSections[0], comparisonBlock);
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

/**
 * Process button styling for fill buttons
 * @param {Array} contentSections - The content sections array
 */
function processButtonStyling(contentSections) {
  const buttons = contentSections[0][1].querySelectorAll('.con-button');
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
  initStickyBehavior(stickyHeaderEl, comparisonBlock);

  return comparisonTableState;
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
 * Setup event listeners and observers for the comparison table
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 * @param {Function} updateTabindexOnResize - The tabindex update handler
 */
function setupEventListeners(comparisonBlock, updateTabindexOnResize) {
  const handleResize = () => {
    updateTabindexOnResize();
    synchronizePlanCellHeights(comparisonBlock);
  };

  window.addEventListener('resize', handleResize);

  const resizeObserver = new ResizeObserver(() => {
    synchronizePlanCellHeights(comparisonBlock);
  });

  // Observe all plan cell wrappers for size changes
  const planCellWrappers = comparisonBlock.querySelectorAll('.plan-cell-wrapper');
  planCellWrappers.forEach((wrapper) => {
    resizeObserver.observe(wrapper);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        adjustElementPosition();
      }
    });
  });
  adjustElementPosition();
}

/**
 * Main decoration function for the comparison table
 * @param {HTMLElement} comparisonBlock - The comparison table block element
 */
export default async function decorate(comparisonBlock) {
  try {
    await initializeComparisonTable(comparisonBlock);

    const { contentSections, footer } = processComparisonContent(comparisonBlock);

    const ariaLiveRegion = createAriaLiveRegion(comparisonBlock);

    processButtonStyling(contentSections);

    const { stickyHeaderEl, colTitles } = createStickyHeader(contentSections[0], comparisonBlock);
    comparisonBlock.appendChild(stickyHeaderEl);

    createTableSections(contentSections, comparisonBlock, colTitles);

    initializeStateManagement(comparisonBlock, stickyHeaderEl, ariaLiveRegion);

    if (footer) {
      comparisonBlock.appendChild(footer);
    }

    synchronizePlanCellHeights(comparisonBlock);

    const updateTabindexOnResize = createTabindexUpdateHandler(comparisonBlock, colTitles);

    setupEventListeners(comparisonBlock, updateTabindexOnResize);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize comparison table:', error);
    comparisonBlock.innerHTML = '<p>Unable to load comparison table. Please refresh the page.</p>';
  }
}
