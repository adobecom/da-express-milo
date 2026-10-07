import {
  createTag,
  formatDynamicCartLink,
  getIconElementDeprecated,
  getMetadata,
} from '../../scripts/utils.js';
import trackBranchParameters from '../../scripts/branchlinks.js';

const iconRegex = /icon-\s*([^\s]+)/;

function getBrandingLogo() {
  const brandingLogoName = getMetadata('inject-branding-logo')?.trim()
    || (['on', 'yes'].includes(getMetadata('marquee-inject-acrobat-logo')?.toLowerCase())
      && 'cobrand-lockup-acrobat-express')
    || 'adobe-express-logo';
  const logo = getIconElementDeprecated(brandingLogoName);
  logo.classList.add('express-logo');
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

async function decorateHeadline(headline) {
  headline.classList.add('headline');
  const ctas = [...headline.querySelectorAll('a')];
  if (!ctas.length) {
    headline.classList.add('no-cta');
    return;
  }

  ctas[0].parentElement.classList.add('ctas');
  const heading = headline.querySelector('h1, h2, h3, h4, h5, h6');
  ctas.forEach((cta, index) => {
    cta.classList.add('button');
    cta.classList.toggle('primaryCTA', index === 0);
    decorateCtaIcon(cta);
    if (!cta.getAttribute('aria-label') && heading) {
      cta.setAttribute('aria-label', `${cta.textContent.trim()} ${heading.textContent.trim()}`);
    }
  });

  await trackBranchParameters(ctas);
  await Promise.all(ctas.map((cta) => formatDynamicCartLink(cta)));
}

export default async function init(el) {
  const headline = el.querySelector(':scope > div');
  if (!headline) return;

  const foreground = createTag('div', { class: 'foreground' });
  await decorateHeadline(headline);
  foreground.append(getBrandingLogo(), headline);
  el.replaceChildren(foreground);
}
