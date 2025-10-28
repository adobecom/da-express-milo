import { getIconElementDeprecated, createTag, formatDynamicCartLink } from '../../scripts/utils.js';

// formatDynamicCartLink now imported from utils

function decorateHeadline(headline) {
  headline.classList.add('headline');
  const ctas = headline.querySelectorAll('a');
  if (!ctas.length) {
    headline.classList.add('no-cta');
    return headline;
  }
  ctas[0].parentElement.classList.add('ctas');
  ctas.forEach((cta) => {
    cta.classList.add('button');
  });
  ctas[0].classList.add('primaryCTA');
  return headline;
}

function decorateHeadlineAsync(headline) {
  // Enhanced version with pricing for deferred loading
  const ctas = headline.querySelectorAll('a');
  ctas.forEach((cta) => {
    formatDynamicCartLink(cta);
  });
}

export default async function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const [headline] = [rows[0]];

  // Create LCP structure immediately - PURE TEXT ONLY for fastest LCP
  const foreground = createTag('div', { class: 'foreground' });
  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.classList.add('express-logo');

  // Core text decoration happens immediately
  headline.classList.add('headline');
  decorateHeadline(headline); // Basic headline decoration only

  // Insert LCP structure immediately - ZERO IMAGES
  foreground.append(logo, headline);
  el.append(foreground);

  // Postpone headline dynamic pricing until browser is idle
  if (headline.querySelectorAll('a').length) {
    const idleCb = (cb) => (
      window.requestIdleCallback
        ? window.requestIdleCallback(cb, { timeout: 3000 })
        : setTimeout(cb, 3000)
    );
    idleCb(() => {
      decorateHeadlineAsync(headline);
    });
  }
}
