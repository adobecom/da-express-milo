import { getLibs } from '../../scripts/utils.js';

let createTag;

function buildTableLayout(block) {
  const parentDiv = block.closest('.section');
  parentDiv?.classList.add('collapsible-rows-grey-bg', 'collapsible-section-padding');

  const rows = Array.from(block.children);
  block.innerHTML = '';
  const background = rows.shift();
  background.classList.add('collapsible-rows-background');
  parentDiv.prepend(background);
  const headerText = rows.shift()?.innerText.trim();

  if (headerText) {
    const rowAccordionHeader = createTag('h2', { class: 'collapsible-row-accordion title' });
    rowAccordionHeader.textContent = headerText;
    block.prepend(rowAccordionHeader);
  }

  const collapsibleRows = [];
  rows.forEach((row) => {
    const cells = Array.from(row.children);
    const header = cells[0];
    const subHeader = cells[1];
    collapsibleRows.push({
      header: header.textContent.trim(),
      subHeader: subHeader.innerHTML,
    });
  });

  collapsibleRows.forEach((row) => {
    const { header, subHeader } = row;

    const rowWrapper = createTag('div', { class: 'collapsible-row-wrapper' }); // New wrapper
    const headerAccordion = createTag('div', { class: 'collapsible-row-accordion expandable header-accordion' });

    rowWrapper.append(headerAccordion);
    block.append(rowWrapper);

    const headerDiv = createTag('h3', { class: 'collapsible-row-header expandable' });
    headerDiv.innerHTML = header;
    headerAccordion.append(headerDiv);

    const iconElement = createTag('img', {
      src: '/express/code/icons/plus-heavy.svg',
      alt: 'toggle-icon',
      class: 'toggle-icon',
    });

    headerDiv.appendChild(iconElement);

    const subHeaderAccordion = createTag('div', { class: 'collapsible-row-accordion expandable sub-header-accordion' });
    rowWrapper.append(subHeaderAccordion);

    const subHeaderDiv = createTag('div', { class: 'collapsible-row-sub-header expandable' });
    subHeaderDiv.innerHTML = subHeader;
    subHeaderAccordion.append(subHeaderDiv);

    headerDiv.addEventListener('click', () => {
      headerAccordion.classList.toggle('rounded-corners');
      const isCollapsed = subHeaderAccordion.classList.toggle('collapsed');
      subHeaderAccordion.style.display = isCollapsed ? 'flex' : 'none';
      subHeaderAccordion.style.paddingTop = 0;

      iconElement.src = isCollapsed ? '/express/code/icons/minus-heavy.svg' : '/express/code/icons/plus-heavy.svg';
    });
  });
}

function buildOriginalLayout(block) {
  const collapsibleRows = [];
  const rows = Array.from(block.children);

  rows.forEach((row) => {
    const cells = Array.from(row.children);
    const header = cells[0];
    const subHeader = cells[1];
    collapsibleRows.push({
      header: header.textContent.trim(),
      subHeader: subHeader?.innerHTML,
    });
  });

  block.innerHTML = '';

  const visibleCount = 4;
  let isExpanded = false;

  collapsibleRows.forEach((row, index) => {
    const { header, subHeader } = row;

    const accordion = createTag('div', { class: 'collapsible-row-accordion', tabIndex: 0 });

    if (index >= visibleCount) {
      accordion.classList.add('collapsed');
      accordion.style.display = 'none';
    }

    block.append(accordion);

    const headerDiv = createTag('h3', { class: 'collapsible-row-header' });
    accordion.append(headerDiv);
    headerDiv.innerHTML = header;

    const subHeaderDiv = createTag('div', { class: 'collapsible-row-sub-header' });
    subHeaderDiv.innerHTML = subHeader;
    accordion.append(subHeaderDiv);
  });

  const toggleButton = createTag('a', { class: 'collapsible-row-toggle-btn button' });
  toggleButton.textContent = 'View more';
  // eslint-disable-next-line chai-friendly/no-unused-expressions
  collapsibleRows.length > 4 && block.append(toggleButton);

  toggleButton.addEventListener('click', () => {
    const hiddenItems = block.querySelectorAll('.collapsible-row-accordion');
    hiddenItems.forEach((item, index) => {
      if (index >= visibleCount) {
        if (item.classList.contains('collapsed')) {
          item.classList.remove('collapsed');
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
          item.classList.add('collapsed');
        }
      }
    });
    isExpanded = !isExpanded;
    toggleButton.textContent = isExpanded ? 'View less' : 'View more';
  });
}

export default async function decorate(block) {
  block.parentElement.classList.add('ax-collapsible-rows');
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const isExpandableVariant = block.classList.contains('expandable');

  if (isExpandableVariant) {
    buildTableLayout(block);
  } else {
    buildOriginalLayout(block);
  }
}
