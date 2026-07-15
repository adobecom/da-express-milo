import {
  getIconElementDeprecated,
  fixIcons,
  getMetadata,
  formatDynamicCartLink,
} from '../../scripts/utils.js';
import trackBranchParameters from '../../scripts/branchlinks.js';

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

// Decide whether an authored background hex is "light" (needs dark text) using
// perceived luminance (ITU-R BT.601). Supports #RGB and #RRGGBB. Anything we
// can't parse falls back to the default dark treatment.
function isLightColor(value) {
  const hex = value?.replace('#', '').trim() ?? '';
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (full.length !== 6 || /[^0-9a-f]/i.test(full)) return false;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
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
  const paras = textEls.filter((el) => el.tagName === 'P');

  // Authored CTAs are links; a primary CTA is wrapped in <strong>. Paragraphs
  // with no link before the first CTA are body copy; a no-link paragraph after
  // the CTAs is the disclaimer line.
  const links = [...textCell.querySelectorAll('a')];
  const primaryLink = links.find((a) => a.closest('strong')) || links[0];
  const secondaryLink = links.find((a) => a !== primaryLink);
  const firstCtaIdx = paras.findIndex((p) => p.querySelector('a'));

  const bodyParas = [];
  const disclaimerParas = [];
  paras.forEach((p, i) => {
    if (p.querySelector('a')) return;
    if (firstCtaIdx === -1 || i < firstCtaIdx) bodyParas.push(p);
    else disclaimerParas.push(p);
  });

  const textContainer = document.createElement('div');
  textContainer.className = 'text-container';
  if (heading) textContainer.append(heading);
  bodyParas.forEach((p) => textContainer.append(p));

  const textContent = document.createElement('div');
  textContent.className = 'text-content';
  textContent.append(getBrandingLogo());
  textContent.append(textContainer);

  const mainContainer = document.createElement('div');
  mainContainer.className = 'main-container';
  mainContainer.append(textContent);

  if (primaryLink || disclaimerParas.length) {
    const ctaContainer = document.createElement('div');
    ctaContainer.className = 'cta-container';

    if (primaryLink) {
      const buttonGroup = document.createElement('div');
      buttonGroup.className = 'button-group';
      primaryLink.classList.add('cta', 'primary');
      buttonGroup.append(primaryLink);
      if (secondaryLink) {
        secondaryLink.classList.add('cta', 'secondary');
        buttonGroup.append(secondaryLink);
      }
      ctaContainer.append(buttonGroup);
    }

    disclaimerParas.forEach((p) => {
      p.classList.add('disclaimer');
      ctaContainer.append(p);
    });

    mainContainer.append(ctaContainer);
  }

  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';
  if (picture) imageContainer.append(picture);

  const foreground = document.createElement('div');
  foreground.className = 'foreground';
  foreground.append(mainContainer, imageContainer);

  block.textContent = '';
  if (bgColor) {
    block.style.background = bgColor;
    // A single authored hex activates the light (dark-text) treatment when the
    // color is light; dark backgrounds keep the default light-text treatment.
    if (isLightColor(bgColor)) block.classList.add('light');
  }
  block.append(foreground);

  fixIcons(block);

  const ctaLinks = [primaryLink, secondaryLink].filter(Boolean);
  if (ctaLinks.length) {
    await trackBranchParameters(ctaLinks);
    if (primaryLink) await formatDynamicCartLink(primaryLink);
  }
}
