import { getLibs } from '../../scripts/utils.js';

// Scroll visibility handler
export const toggleChevronVisibility = (linksContainer, leftChev, rightChev) => {
  const maxScroll = linksContainer.scrollWidth - linksContainer.clientWidth - 10;
  const atStart = linksContainer.scrollLeft <= 0;
  const atEnd = linksContainer.scrollLeft >= maxScroll && maxScroll > 0;
  leftChev.classList.toggle('hidden', atStart);
  rightChev.classList.toggle('hidden', atEnd);
  leftChev.setAttribute('aria-disabled', atStart);
  rightChev.setAttribute('aria-disabled', atEnd);
};

export function handleChevron(createTag, linksContainer, linksRow) {
  const leftChev = createTag('button', {
    class: 'link-blade-chevron left',
    'aria-label': 'Scroll left',
    tabindex: '0',
  });
  const rightChev = createTag('button', {
    class: 'link-blade-chevron',
    'aria-label': 'Scroll right',
    tabindex: '0',
  });

  // Keyboard support handler
  const handleKeyDown = (e, direction) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      direction === 'right' ? rightChev.click() : leftChev.click();
    }
  };

  // Initialize accessibility
  linksContainer.setAttribute('role', 'navigation');
  linksContainer.setAttribute('aria-label', 'Links list');
  toggleChevronVisibility(linksContainer, leftChev, rightChev);

  // Event listeners
  linksContainer.addEventListener('scroll', () => toggleChevronVisibility(linksContainer, leftChev, rightChev));
  window.addEventListener('resize', () => toggleChevronVisibility(linksContainer, leftChev, rightChev));

  rightChev.addEventListener('click', () => {
    const newScrollPos = linksContainer.scrollLeft + 400;
    const maxScroll = linksContainer.scrollWidth - linksContainer.clientWidth;
    linksContainer.scrollTo({
      left: Math.min(newScrollPos, maxScroll),
      behavior: 'smooth',
    });
  });

  leftChev.addEventListener('click', () => {
    linksContainer.scrollTo({
      left: Math.max(linksContainer.scrollLeft - 400, 0),
      behavior: 'smooth',
    });
  });

  // Keyboard events
  rightChev.addEventListener('keydown', (e) => handleKeyDown(e, 'right'));
  leftChev.addEventListener('keydown', (e) => handleKeyDown(e, 'left'));

  linksRow.append(leftChev, rightChev);
}

export default async function decorate(block) {
  const { createTag } = await import(`${getLibs()}/utils/utils.js`);
  const [headerRow, linksRow] = block.children;
  const headerContent = headerRow.querySelector('div')?.textContent.trim();

  // Header processing
  if (headerContent) {
    const header = createTag('h2', {
      class: 'link-blade-header',
      id: 'link-blade-header',
    }, headerContent);
    headerRow.innerHTML = '';
    headerRow.appendChild(header);
  }

  // Links container setup
  const linksContainer = linksRow.querySelector('div');
  linksRow.classList.add('link-blade-link-row');

  if (linksContainer) {
    linksContainer.classList.add('link-blade-links');
    linksContainer.setAttribute('tabindex', '0');
    linksContainer.setAttribute('aria-labelledby', 'link-blade-header');

    // Process links
    const paragraphs = linksContainer.querySelectorAll('p');
    const links = [];

    paragraphs.forEach((p) => {
      const a = p.querySelector('a');
      if (a) {
        a.classList.add('link-blade-item');
        links.push(a);
      }
      p.remove();
    });

    // Append clean links
    linksContainer.innerHTML = '';
    links.forEach((link) => {
      link.setAttribute('role', 'link');
      linksContainer.appendChild(link);
    });
  }

  handleChevron(createTag, linksContainer, linksRow);
}
