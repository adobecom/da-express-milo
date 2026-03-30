import { createTag, getIconElementDeprecated, getLibs } from '../../scripts/utils.js';

const LOGO = 'adobe-express-logo';
const PHOTO_LOGO = 'adobe-express-logo-photos';

export default function init(el) {
  const heading = el.querySelector('h1, h2, h3, h4, h5, h6');

  // extract variant always injects the logo synchronously so it
  // is guaranteed to render without blocking on the async import below.
  if (el.classList.contains('extract') && heading) {
    const logo = getIconElementDeprecated(LOGO);
    logo.classList.add('express-logo');
    heading.before(logo);

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

  // Metadata-driven injection for non-extract variants (marquee-inject-logo /
  // marquee-inject-photo-logo), matching the pattern used by ax-columns et al.
  // Fire-and-forget — never blocks the decorator return.
  import(`${getLibs()}/utils/utils.js`).then(({ getMetadata }) => {
    const injectPhotoLogo = ['on', 'yes'].includes(getMetadata('marquee-inject-photo-logo')?.toLowerCase());
    const injectViaMetadata = !el.classList.contains('extract')
      && ['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase());

    if ((injectViaMetadata || injectPhotoLogo) && heading && !el.querySelector('.express-logo')) {
      const logo = getIconElementDeprecated(injectPhotoLogo ? PHOTO_LOGO : LOGO);
      logo.classList.add('express-logo');
      heading.before(logo);
    }
  }).catch(() => { /* milo utils unavailable — extract logo already injected above */ });

  return el;
}
