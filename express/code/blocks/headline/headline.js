import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';

let getMetadata;

// avoid using this kind of text-block unless necessary
export default async function init(el) {
  ({ getMetadata } = await import(`${getLibs()}/utils/utils.js`));
  const heading = el.querySelector('h1, h2, h3, h4, h5, h6');
  const cfg = el.querySelector(':scope p:last-of-type');
  try {
    if (cfg === heading) return el;
    cfg?.textContent.split(',').forEach((item) => {
      const [key, value] = item.split(':').map((t) => t.trim().toLowerCase());
      heading.style[key] = value;
    });
    cfg?.remove();
  } catch (e) {
    window.lana?.log(e);
  }

  if (document.querySelector('.ax-columns:first-of-type') === el && ['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) {
    const logo = getIconElementDeprecated('adobe-express-logo');
    logo.classList.add('express-logo');
    el.prepend(logo);
  }

  return el;
}
