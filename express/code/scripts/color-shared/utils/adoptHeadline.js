import { getIconElementDeprecated } from '../../utils.js';

function ensureLogo(headline) {
  if (headline.querySelector('.express-logo')) return;
  const heading = headline.querySelector('h1, h2, h3, h4, h5, h6');
  if (!heading) return;
  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.classList.add('express-logo');
  heading.before(logo);
}

export default function findHeadline(toolBlock) {
  const section = toolBlock.closest('.section');
  const headline = section?.querySelector('.color-headline.tools') || null;
  if (headline) ensureLogo(headline);
  return headline;
}

export function markAdopted(headline) {
  if (headline) headline.dataset.adopted = 'true';
}
