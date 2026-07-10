import { getIconElementDeprecated, fixIcons, getMetadata } from '../../scripts/utils.js';

// Mirror the existing marquee branding-logo injection (see grid-marquee):
// authors opt in via `inject-branding-logo` (explicit icon name) or the
// `marquee-inject-acrobat-logo` toggle; default to the Adobe Express logo.
function getBrandingLogo() {
  const brandingLogoName = getMetadata('inject-branding-logo')?.trim()
    || (['on', 'yes'].includes(getMetadata('marquee-inject-acrobat-logo')?.toLowerCase()) && 'cobrand-lockup-acrobat-express')
    || 'adobe-express-logo';
  const logo = getIconElementDeprecated(brandingLogoName);
  logo.classList.add('express-logo');
  return logo;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const [textCell, bgCell] = [...rows[0].children];
  const imageCell = rows[1]?.children[0];

  // Single-value cell (EDS delivers no <p> wrapper): read textContent as fallback
  const bgColor = bgCell?.querySelector('p')?.textContent?.trim() ?? bgCell?.textContent?.trim();
  const picture = imageCell?.querySelector('picture');

  const textEls = [...textCell.children];
  const heading = textEls.find((el) => /^H[1-6]$/.test(el.tagName));
  // Every authored paragraph is body copy — the brand lockup is injected as its
  // own element, so no paragraph should be repurposed as an eyebrow.
  const bodyParas = textEls.filter((el) => el.tagName === 'P');

  const textContainer = document.createElement('div');
  textContainer.className = 'text-container';
  if (heading) textContainer.append(heading);
  bodyParas.forEach((p) => textContainer.append(p));

  const textContent = document.createElement('div');
  textContent.className = 'text-content';
  textContent.append(getBrandingLogo());
  textContent.append(textContainer);

  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';
  if (picture) imageContainer.append(picture);

  const foreground = document.createElement('div');
  foreground.className = 'foreground';
  foreground.append(textContent, imageContainer);

  block.textContent = '';
  if (bgColor) block.style.background = bgColor;
  block.append(foreground);

  fixIcons(block);
}
