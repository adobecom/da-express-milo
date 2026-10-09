import {
  createTag,
  formatDynamicCartLink,
  getIconElementDeprecated,
  getMetadata,
} from '../../scripts/utils.js';
import trackBranchParameters from '../../scripts/branchlinks.js';

const iconRegex = /icon-\s*([^\s]+)/;

function getBrandingLogo(block) {
  const brandingLogoName = getMetadata('inject-branding-logo')?.trim()
    || (['on', 'yes'].includes(getMetadata('marquee-inject-acrobat-logo')?.toLowerCase())
      && 'cobrand-lockup-acrobat-express')
    || (block.classList.contains('dark') ? 'adobe-express-logo-white' : 'adobe-express-logo');
  const logo = getIconElementDeprecated(brandingLogoName);
  logo.classList.add('express-logo');
  if (brandingLogoName === 'cobrand-lockup-acrobat-express') logo.classList.add('cobrand-logo');
  return logo;
}

function decorateCtaIcon(cta) {
  if (cta.querySelector('.icon')) return;
  const icon = cta.parentElement?.querySelector(':scope > .icon');
  const iconName = iconRegex.exec(icon?.className)?.[1];
  if (!icon || !iconName) return;

  if (!icon.querySelector('svg, img')) icon.append(getIconElementDeprecated(iconName));
  icon.setAttribute('aria-hidden', 'true');
  const ctaText = cta.textContent.trim();
  cta.textContent = '';
  cta.title ||= ctaText;
  const textGroup = createTag('span', { class: 'text-group' });
  textGroup.append(icon, ctaText);
  cta.append(textGroup);
}

async function decorateHeadline(block, headline) {
  headline.classList.add('headline');
  const heading = headline.querySelector('h1, h2, h3, h4, h5, h6');
  const ctas = [...headline.querySelectorAll('a')];
  if (!ctas.length) {
    headline.classList.add('no-cta');
    return;
  }

  const ctaContainer = createTag('div', { class: 'ctas' });
  const wrappers = new Set();
  ctas.forEach((cta, index) => {
    const wrapper = cta.closest('p') || cta.parentElement;
    wrappers.add(wrapper);
    cta.classList.add('button', 'button-l');
    cta.classList.toggle('primaryCTA', index === 0);
    cta.classList.toggle('secondaryCTA', index > 0);
    if (index === 0 && block.classList.contains('premium-cta')) cta.classList.add('gradient');
    decorateCtaIcon(cta);
    if (!cta.getAttribute('aria-label') && heading) {
      cta.setAttribute('aria-label', `${cta.textContent.trim()} ${heading.textContent.trim()}`);
    }
    ctaContainer.append(cta);
  });

  const cell = heading?.parentElement ?? headline;
  cell.append(ctaContainer);
  wrappers.forEach((wrapper) => {
    if (wrapper && wrapper !== ctaContainer && !wrapper.textContent.trim()
      && !wrapper.querySelector('img, picture, svg')) wrapper.remove();
  });

  await trackBranchParameters(ctas);
  await Promise.all(ctas.map((cta) => formatDynamicCartLink(cta)));
}

export default async function init(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  const background = rows.find((row) => row.querySelector('picture, img, video')
    && !row.querySelector('h1, h2, h3, h4, h5, h6'));
  const headline = rows.find((row) => row !== background);
  if (!headline) return;

  if (background) {
    background.classList.add('background');
    background.setAttribute('aria-hidden', 'true');
    background.querySelectorAll('img').forEach((img) => {
      img.alt = '';
      img.decoding = 'async';
    });
  }

  await decorateHeadline(block, headline);
  const foreground = createTag('div', { class: 'foreground' });
  foreground.append(getBrandingLogo(block), headline);
  block.replaceChildren(...(background ? [background] : []), foreground);
}
