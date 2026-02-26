import buildCarousel from '../../scripts/widgets/carousel.js';
import { addTempWrapperDeprecated } from '../../scripts/utils.js';

function decorateCarousel(links, container) {
  links.forEach((p) => {
    const link = p.querySelector('a');
    link.classList.add('button', 'small', 'secondary', 'fill');
    link.classList.remove('accent');
  });
  buildCarousel('p', container);
}

export function updatePillsByCKG(block, carouselDiv) {
  return (mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {
        if (carouselDiv.querySelector('.carousel-container')) {
          observer.disconnect();
          return;
        }

        const newLinks = [...block.querySelectorAll('p')];
        if (!newLinks.length) {
          carouselDiv.style.display = 'none';
        }
        decorateCarousel(newLinks, carouselDiv);
        observer.disconnect();
        return;
      }
    }
  };
}

export default function decorate(block) {
  addTempWrapperDeprecated(block, 'seo-nav');

  const links = [...block.querySelectorAll('p')];
  const seoCopy = block.querySelectorAll('div')[block.querySelectorAll('div').length - 1];
  const carouselDiv = block.querySelector('div:nth-of-type(2) > div');
  if (links.length) {
    decorateCarousel(links, carouselDiv);
  }

  if (seoCopy && seoCopy.innerText !== 'null') {
    const $paragraphs = seoCopy.querySelectorAll('p');
    for (let i = 0; i < $paragraphs.length; i += 1) {
      $paragraphs[i].classList.add('seo-paragraph');
    }
  } else {
    seoCopy.style.display = 'none';
  }

  const observer = new MutationObserver(updatePillsByCKG(block, carouselDiv));
  observer.observe(carouselDiv, { childList: true });
}
