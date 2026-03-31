import { getIconElementDeprecated } from '../../utils.js';

function ensureLogo(headline) {
  if (headline.querySelector('.express-logo')) return;
  const heading = headline.querySelector('h1, h2, h3, h4, h5, h6');
  if (!heading) return;
  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.classList.add('express-logo');
  heading.before(logo);
}

function findHeadline(section) {
  let prev = section?.previousElementSibling;
  let next = section?.nextElementSibling;
  while (prev || next) {
    if (prev) {
      const h = prev.querySelector('.color-headline.tools');
      if (h) return h;
      prev = prev.previousElementSibling;
    }
    if (next) {
      const h = next.querySelector('.color-headline.tools');
      if (h) return h;
      next = next.nextElementSibling;
    }
  }
  return null;
}

export default function adoptHeadline(toolBlock, layout) {
  const section = toolBlock.closest('.section');
  const headline = findHeadline(section);
  if (!headline) return;
  ensureLogo(headline);
  layout.slots.sidebar.prepend(headline);
  headline.dataset.adopted = 'true';
}
