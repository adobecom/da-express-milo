import { getIconElementDeprecated, getLibs } from '../../scripts/utils.js';

const LOGO = 'adobe-express-logo';
const PHOTO_LOGO = 'adobe-express-logo-photos';

export default async function init(el) {
  const heading = el.querySelector('h1, h2, h3, h4, h5, h6');

  // extract variant always injects the logo — do this synchronously so it
  // is guaranteed to render even if the async metadata import below fails.
  if (el.classList.contains('extract') && heading) {
    const logo = getIconElementDeprecated(LOGO);
    logo.classList.add('express-logo');
    heading.before(logo);
  }

  // Metadata-driven injection for non-extract variants (marquee-inject-logo /
  // marquee-inject-photo-logo), matching the pattern used by ax-columns et al.
  try {
    const { getMetadata } = await import(`${getLibs()}/utils/utils.js`);
    const injectPhotoLogo = ['on', 'yes'].includes(getMetadata('marquee-inject-photo-logo')?.toLowerCase());
    const injectViaMetadata = !el.classList.contains('extract')
      && ['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase());

    if ((injectViaMetadata || injectPhotoLogo) && heading && !el.querySelector('.express-logo')) {
      const logo = getIconElementDeprecated(injectPhotoLogo ? PHOTO_LOGO : LOGO);
      logo.classList.add('express-logo');
      heading.before(logo);
    }
  } catch { /* milo utils unavailable — extract logo already injected above */ }

  return el;
}
