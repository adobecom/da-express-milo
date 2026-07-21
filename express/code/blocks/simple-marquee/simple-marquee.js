import {
  getIconElementDeprecated,
  createTag,
  formatDynamicCartLink,
  getMetadata,
} from '../../scripts/utils.js';

const iconRegex = /icon-\s*([^\s]+)/;

/**
 * Decorate the headline row: eyebrow, heading, body copy and CTA buttons.
 * Mirrors the non-grid marquee layout of grid-marquee without any card/drawer logic.
 * @param {HTMLElement} headline the row that holds the marquee copy
 * @returns {HTMLElement} the decorated headline element
 */
function decorateHeadline(headline) {
  headline.classList.add('headline');

  const heading = headline.querySelector('h1, h2, h3, h4, h5, h6');

  // Optional eyebrow: any copy authored before the heading (within its cell).
  if (heading) {
    let prev = heading.previousElementSibling;
    while (prev) {
      if (prev.textContent.trim() && !prev.querySelector('a')) {
        prev.classList.add('eyebrow');
      }
      prev = prev.previousElementSibling;
    }
  }

  const ctas = [...headline.querySelectorAll('a')];
  if (!ctas.length) {
    headline.classList.add('no-cta');
    return headline;
  }

  // Gather every CTA into one flex row so they align horizontally regardless of
  // how they were authored (one paragraph, separate paragraphs, or wrapped in
  // strong/em for primary/secondary emphasis).
  const ctaContainer = createTag('div', { class: 'ctas' });
  const wrappers = [];

  ctas.forEach((cta) => {
    wrappers.push(cta.closest('p') || cta.parentElement);
    cta.classList.add('button');
    if (!cta.querySelector('.icon')) {
      const icon = cta.parentElement?.querySelector(':scope > .icon');
      const match = icon && iconRegex.exec(icon.className);
      if (match?.[1]) {
        const hasExistingGraphic = icon.querySelector('svg, img');
        if (!hasExistingGraphic) icon.append(getIconElementDeprecated(match[1]));
        const ctaText = cta.textContent.trim();
        cta.textContent = '';
        cta.title = cta.title || ctaText;
        cta.append(createTag('div', { class: 'text-group' }, [icon, ctaText]));
      }
    }
    if (!cta.getAttribute('aria-label') && heading) {
      cta.setAttribute('aria-label', `${cta.textContent.trim()} ${heading.textContent.trim()}`);
    }
    ctaContainer.append(cta);
  });

  ctas[0].classList.add('primaryCTA');

  // Place the CTA row after the copy, then drop now-empty author wrappers.
  const cell = heading?.parentElement ?? headline;
  cell.append(ctaContainer);
  wrappers.forEach((wrapper) => {
    if (wrapper && wrapper !== ctaContainer && !wrapper.textContent.trim()
      && !wrapper.querySelector('img, picture, svg')) {
      wrapper.remove();
    }
  });
  return headline;
}

export default function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  const foreground = createTag('div', { class: 'foreground' });

  // A media-only row (picture/img/video with no heading) becomes the background.
  const background = rows.find((row) => row.querySelector('picture, img, video')
    && !row.querySelector('h1, h2, h3, h4, h5, h6'));

  // The first remaining row carries the eyebrow/headline/body/CTA copy.
  const headline = rows.find((row) => row !== background);
  if (!headline) return;

  // Optional logo injection, matching grid-marquee's branding metadata contract.
  const brandingLogoName = getMetadata('inject-branding-logo')?.trim()
    || (['on', 'yes'].includes(getMetadata('marquee-inject-acrobat-logo')?.toLowerCase())
      && 'cobrand-lockup-acrobat-express')
    || null;
  const injectLogo = brandingLogoName
    || ['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase());
  if (injectLogo) {
    const logo = getIconElementDeprecated(brandingLogoName || 'adobe-express-logo');
    logo.classList.add('express-logo');
    foreground.append(logo);
  }

  if (background) {
    background.classList.add('background');
    background.querySelectorAll('img').forEach((img) => {
      img.loading = 'lazy';
      img.decoding = 'async';
    });
  }

  decorateHeadline(headline);
  foreground.append(headline);
  el.append(foreground);

  // Defer dynamic pricing formatting on CTAs until the browser is idle.
  const ctas = [...headline.querySelectorAll('a.button')];
  if (ctas.length) {
    const idleCb = (cb) => (window.requestIdleCallback
      ? window.requestIdleCallback(cb, { timeout: 3000 })
      : setTimeout(cb, 3000));
    idleCb(() => ctas.forEach((cta) => formatDynamicCartLink(cta)));
  }
}
