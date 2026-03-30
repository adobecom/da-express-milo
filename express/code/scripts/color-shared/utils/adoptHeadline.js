import { getIconElementDeprecated } from '../../utils.js';

function ensureLogo(headline) {
  if (headline.querySelector('.express-logo')) return;
  const heading = headline.querySelector('h1, h2, h3, h4, h5, h6');
  if (!heading) return;
  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.classList.add('express-logo');
  heading.before(logo);
}

export default function adoptHeadline(layout) {
  const headline = document.querySelector('.color-headline.tools');
  if (!headline) return;
  ensureLogo(headline);
  layout.slots.sidebar.prepend(headline);
  headline.dataset.adopted = 'true';
}
