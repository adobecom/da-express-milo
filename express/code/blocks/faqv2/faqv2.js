import { createTag, getLibs } from '../../scripts/utils.js';

let replaceKey;
let getConfig;
function buildTableLayout(block) {
  const config = getConfig();
  const isLongFormVariant = block.classList.contains('longform');
  const rows = [...block.children];

  const parentContainer = createTag('div');

  const headerText = rows.shift()?.innerText.trim();
  if (headerText) {
    const rowAccordionHeader = createTag('h2', { class: 'faqv2-accordion title' });
    rowAccordionHeader.textContent = headerText;

    if (isLongFormVariant) {
      const container = createTag('div', { class: 'faqv2-longform-header-container' });
      container.appendChild(rowAccordionHeader);
      parentContainer.appendChild(container);
    } else {
      parentContainer.appendChild(rowAccordionHeader);
    }
  }

  const container = createTag('div', { class: 'faqv2-accordions-col' });
  parentContainer.appendChild(container);

  // Add live region for screen reader announcements
  const liveRegion = createTag('div', {
    'aria-live': 'polite',
    'aria-atomic': 'true',
    class: 'faqv2-live-region sr-only',
  });
  parentContainer.appendChild(liveRegion);

  // Function to announce accordion state changes
  function announceStateChange(headerTextParam, isOpen) {
    const action = isOpen ? 'opened' : 'closed';
    const message = `${headerTextParam} ${action}`;
    liveRegion.textContent = message;
  }

  const collapsibleRows = rows.map((row) => {
    const cells = [...row.children];
    return {
      header: cells[0]?.innerHTML.trim(),
      subHeader: cells[1]?.innerHTML,
    };
  });

  // Check if there's any actual content in the rows
  const hasContent = collapsibleRows.some((row) => row.header || row.subHeader);
  if (!hasContent) {
    // No content found, hide the block
    block.style.display = 'none';
    return;
  }

  collapsibleRows.forEach(({ header, subHeader }, index) => {
    const rowWrapper = createTag('div', { class: 'faqv2-wrapper' });
    container.appendChild(rowWrapper);

    if (isLongFormVariant) {
      // Simple toggle for longform
      const toggle = createTag('div', { class: 'faqv2-toggle' });
      rowWrapper.appendChild(toggle);

      const headerDiv = createTag('h3', { class: 'faqv2-header' });
      headerDiv.innerHTML = header;
      headerDiv.setAttribute('id', `faqv2-header-${index}`);
      headerDiv.setAttribute('aria-controls', `faqv2-content-${index}`);
      headerDiv.setAttribute('aria-expanded', 'false');
      headerDiv.setAttribute('tabindex', '0');
      headerDiv.setAttribute('role', 'button');
      toggle.appendChild(headerDiv);

      const iconElement = createTag('img', {
        src: `${config.codeRoot}/icons/plus-heavy.svg`,
        alt: '',
        class: 'toggle-icon',
        'aria-hidden': 'true',
      });
      headerDiv.appendChild(iconElement);

      const content = createTag('div', {
        class: 'faqv2-content',
        id: `faqv2-content-${index}`,
        'aria-labelledby': `faqv2-header-${index}`,
        'aria-hidden': 'true',
      });
      content.innerHTML = subHeader;
      toggle.appendChild(content);

      // Set initial state
      content.style.maxHeight = '0';
      content.style.overflow = 'hidden';

      const toggleAccordion = () => {
        const isOpen = content.classList.contains('open');

        // Close all other accordions first
        const allContents = block.querySelectorAll('.faqv2-content');
        const allHeaders = block.querySelectorAll('.faqv2-header');
        const allIcons = block.querySelectorAll('.toggle-icon');

        allContents.forEach((otherContent, idx) => {
          if (otherContent !== content && otherContent.classList.contains('open')) {
            otherContent.style.maxHeight = `${otherContent.scrollHeight}px`;
            otherContent.offsetHeight; // Force reflow
            otherContent.classList.remove('open');
            otherContent.style.maxHeight = '0';
            otherContent.setAttribute('aria-hidden', 'true');
            allHeaders[idx].setAttribute('aria-expanded', 'false');
            allIcons[idx].src = `${config.codeRoot}/icons/plus-heavy.svg`;
          }
        });

        if (!isOpen) {
          // Calculate height before adding open class
          content.style.maxHeight = 'none';
          const height = content.scrollHeight;
          content.style.maxHeight = '0';
          content.offsetHeight; // Force reflow
          content.classList.add('open');
          content.style.maxHeight = `${height}px`;
          content.setAttribute('aria-hidden', 'false');
          headerDiv.setAttribute('aria-expanded', 'true');
          iconElement.src = `${config.codeRoot}/icons/minus-heavy.svg`;

          // Announce state change
          const headerTextOpen = headerDiv.textContent.replace(iconElement.alt, '').trim();
          announceStateChange(headerTextOpen, true);
        } else {
          content.style.maxHeight = `${content.scrollHeight}px`;
          content.offsetHeight; // Force reflow
          content.classList.remove('open');
          content.style.maxHeight = '0';
          content.setAttribute('aria-hidden', 'true');
          headerDiv.setAttribute('aria-expanded', 'false');
          iconElement.src = `${config.codeRoot}/icons/plus-heavy.svg`;

          // Announce state change
          const headerTextClose = headerDiv.textContent.replace(iconElement.alt, '').trim();
          announceStateChange(headerTextClose, false);
        }
      };

      headerDiv.addEventListener('click', toggleAccordion);

      // Add keyboard support for Level A compliance
      headerDiv.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleAccordion();
        }
      });

      // Open first accordion by default after a small delay
      if (index === 0) {
        setTimeout(() => {
          headerDiv.click();
        }, 100);
      }
    } else {
      // Non-longform version using the same structure
      const toggle = createTag('div', { class: 'faqv2-toggle' });
      rowWrapper.appendChild(toggle);

      const headerDiv = createTag('h3', { class: 'faqv2-header' });
      headerDiv.innerHTML = header;
      headerDiv.setAttribute('id', `faqv2-header-${index}`);
      headerDiv.setAttribute('aria-controls', `faqv2-content-${index}`);
      headerDiv.setAttribute('aria-expanded', 'false');
      headerDiv.setAttribute('tabindex', '0');
      headerDiv.setAttribute('role', 'button');
      toggle.appendChild(headerDiv);

      const iconElement = createTag('img', {
        src: `${config.codeRoot}/icons/plus-heavy.svg`,
        alt: '',
        class: 'toggle-icon',
        'aria-hidden': 'true',
      });
      headerDiv.appendChild(iconElement);

      const content = createTag('div', {
        class: 'faqv2-content',
        id: `faqv2-content-${index}`,
        'aria-labelledby': `faqv2-header-${index}`,
        'aria-hidden': 'true',
      });
      content.innerHTML = subHeader;
      toggle.appendChild(content);

      // Set initial state
      content.style.maxHeight = '0';
      content.style.overflow = 'hidden';

      const toggleAccordion = () => {
        const isOpen = content.classList.contains('open');

        // Close all other accordions first
        const allContents = block.querySelectorAll('.faqv2-content');
        const allHeaders = block.querySelectorAll('.faqv2-header');
        const allIcons = block.querySelectorAll('.toggle-icon');

        allContents.forEach((otherContent, idx) => {
          if (otherContent !== content && otherContent.classList.contains('open')) {
            otherContent.style.maxHeight = `${otherContent.scrollHeight}px`;
            otherContent.offsetHeight; // Force reflow
            otherContent.classList.remove('open');
            otherContent.style.maxHeight = '0';
            otherContent.setAttribute('aria-hidden', 'true');
            allHeaders[idx].setAttribute('aria-expanded', 'false');
            allIcons[idx].src = `${config.codeRoot}/icons/plus-heavy.svg`;
          }
        });

        if (!isOpen) {
          // Calculate height before adding open class
          content.style.maxHeight = 'none';
          const height = content.scrollHeight;
          content.style.maxHeight = '0';
          content.offsetHeight; // Force reflow
          content.classList.add('open');
          content.style.maxHeight = `${height}px`;
          content.setAttribute('aria-hidden', 'false');
          headerDiv.setAttribute('aria-expanded', 'true');
          iconElement.src = `${config.codeRoot}/icons/minus-heavy.svg`;

          // Announce state change
          const headerTextOpen = headerDiv.textContent.replace(iconElement.alt, '').trim();
          announceStateChange(headerTextOpen, true);
        } else {
          content.style.maxHeight = `${content.scrollHeight}px`;
          content.offsetHeight; // Force reflow
          content.classList.remove('open');
          content.style.maxHeight = '0';
          content.setAttribute('aria-hidden', 'true');
          headerDiv.setAttribute('aria-expanded', 'false');
          iconElement.src = `${config.codeRoot}/icons/plus-heavy.svg`;

          // Announce state change
          const headerTextClose = headerDiv.textContent.replace(iconElement.alt, '').trim();
          announceStateChange(headerTextClose, false);
        }
      };

      headerDiv.addEventListener('click', toggleAccordion);

      // Add keyboard support for Level A compliance
      headerDiv.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleAccordion();
        }
      });

      // Open first accordion by default after a small delay
      if (index === 0) {
        setTimeout(() => {
          headerDiv.click();
        }, 100);
      }
    }
  });

  block.replaceChildren(...parentContainer.childNodes);
}

async function buildOriginalLayout(block) {
  const viewMoreText = await replaceKey('view-more', getConfig());
  const viewLessText = await replaceKey('view-less', getConfig());
  const collapsibleRows = [];
  const rows = Array.from(block.children);

  rows.forEach((row) => {
    const cells = Array.from(row.children);
    const header = cells[0];
    const subHeader = cells[1];
    collapsibleRows.push({
      header: header?.textContent?.trim() || '',
      subHeader: subHeader?.textContent?.trim() || '',
    });
  });

  // Check if there's any actual content
  const hasContent = collapsibleRows.some((row) => row.header || row.subHeader);
  if (!hasContent) {
    // No content found, hide the block
    block.style.display = 'none';
    return;
  }

  while (block.firstChild) {
    block.removeChild(block.firstChild);
  }

  const visibleCount = 3;
  let isExpanded = false;

  collapsibleRows.forEach((row, index) => {
    const { header, subHeader } = row;

    const accordion = createTag('div', { class: 'faqv2-accordion' });

    if (index >= visibleCount) {
      accordion.classList.add('open');
    }

    block.append(accordion);

    const headerDiv = createTag('h3', { class: 'faqv2-header' });
    accordion.append(headerDiv);
    headerDiv.textContent = header;

    let subHeaderDiv;
    if (subHeader) {
      subHeaderDiv = createTag('div', { class: 'faqv2-sub-header' });
      subHeaderDiv.textContent = subHeader;
      accordion.append(subHeaderDiv);
    }
  });

  const hiddenCount = collapsibleRows.length - visibleCount;
  const toggleButton = createTag('a', {
    class: 'faqv2-toggle-btn button',
    'aria-expanded': false,
    'aria-label': `Show ${hiddenCount} more questions`,
    role: 'button',
    tabIndex: 0,
  });

  toggleButton.textContent = viewMoreText;
  if (collapsibleRows.length > visibleCount) {
    block.append(toggleButton);
  }

  toggleButton.addEventListener('click', () => {
    const hiddenItems = block.querySelectorAll('.faqv2-accordion');
    hiddenItems.forEach((item, index) => {
      if (index >= visibleCount) {
        item.classList.toggle('open');
      }
    });

    isExpanded = !isExpanded;
    toggleButton.setAttribute('aria-expanded', isExpanded);
    toggleButton.textContent = isExpanded ? viewLessText : viewMoreText;
    toggleButton.setAttribute('aria-label', isExpanded ? `Hide ${hiddenCount} questions` : `Show ${hiddenCount} more questions`);
  });

  toggleButton.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleButton.click();
    }
  });
}

export default async function decorate(block) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`)]).then(([utils, placeholders]) => {
    ({ getConfig } = utils);
    ({ replaceKey } = placeholders);
  });
  const isExpandableVariant = block.classList.contains('expandable');

  if (isExpandableVariant) {
    buildTableLayout(block);
  } else {
    buildOriginalLayout(block);
  }
}
