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

export function isCarouselNeeded(linksContainer) {
  return linksContainer.scrollWidth > linksContainer.clientWidth;
}

export function buildCarousel(createTag, linksContainer, linksRow) {
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

  const handleKeyDown = (e, direction) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      direction === 'right' ? rightChev.click() : leftChev.click();
    }
  };

  linksContainer.addEventListener('scroll', () => toggleChevronVisibility(linksContainer, leftChev, rightChev));

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

  rightChev.addEventListener('keydown', (e) => handleKeyDown(e, 'right'));
  leftChev.addEventListener('keydown', (e) => handleKeyDown(e, 'left'));

  linksRow.append(leftChev, rightChev);
  return { leftChev, rightChev };
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
    linksContainer.setAttribute('role', 'navigation');
    linksContainer.setAttribute('aria-label', 'Links list');

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

  // Defer carousel construction until after layout so dimensions are accurate
  let carousel = null;

  const syncCarousel = () => {
    const needed = isCarouselNeeded(linksContainer);
    linksContainer.classList.toggle('centered', !needed);

    if (needed && !carousel) {
      carousel = buildCarousel(createTag, linksContainer, linksRow);
    }

    if (carousel) {
      if (needed) {
        carousel.leftChev.classList.remove('force-hidden');
        carousel.rightChev.classList.remove('force-hidden');
        toggleChevronVisibility(linksContainer, carousel.leftChev, carousel.rightChev);
      } else {
        carousel.leftChev.classList.add('force-hidden');
        carousel.rightChev.classList.add('force-hidden');
      }
    }
  };

  new ResizeObserver(syncCarousel).observe(linksContainer);
}
