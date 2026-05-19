import { createTag, getIconElementDeprecated, getLibs } from '../../scripts/utils.js';

const LOGO = 'adobe-express-logo';
const PHOTO_LOGO = 'adobe-express-logo-photos';

function injectLogo(el, heading, logoName = LOGO) {
  if (!heading || el.querySelector('.express-logo')) return;
  const logo = getIconElementDeprecated(logoName);
  logo.classList.add('express-logo');
  heading.before(logo);
}

export default async function init(el) {
  const heading = el.querySelector('h1, h2, h3, h4, h5, h6');

  if (el.classList.contains('extract') && heading) {
    injectLogo(el, heading);

    // Wrap this block and the sibling color-extract in a shared container so
    // the Figma Content-container layout (640px centered flex column) is applied.
    const section = el.closest('.section');
    const colorExtract = section?.querySelector('.color-extract');
    if (colorExtract) {
      const wrapper = createTag('div', { class: 'color-extract-marquee-wrapper' });
      el.before(wrapper);
      wrapper.append(el, colorExtract);
    }
  }

  if (el.classList.contains('tools')) {
    injectLogo(el, heading);
  }

  try {
    const { getMetadata } = await import(`${getLibs()}/utils/utils.js`);
    const injectPhotoLogo = ['on', 'yes'].includes(getMetadata('marquee-inject-photo-logo')?.toLowerCase());
    const injectViaMetadata = !el.classList.contains('extract')
      && ['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase());

    if ((injectViaMetadata || injectPhotoLogo) && heading && !el.querySelector('.express-logo')) {
      injectLogo(el, heading, injectPhotoLogo ? PHOTO_LOGO : LOGO);
    }
  } catch { /* milo utils unavailable — synchronous logo already injected above */ }

  return el;
}
