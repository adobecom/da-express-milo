import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';

let getMetadata;
let loadStyle;
let getConfig;

const IMAGE_ASPECT_RATIO = 9 / 16;
const MOBILE_MAX = 600;
const TABLET_MAX = 900;
const DEFAULT_DESKTOP_MEDIA_WIDTH = 571;
const DEFAULT_PLACEHOLDER_TEXT = 'Enter your business name';

function getOptimalImageSize() {
  if (window.innerWidth <= MOBILE_MAX) return 400;
  if (window.innerWidth <= TABLET_MAX) return 600;
  return 900;
}

function getDesktopImageMaxWidth(block) {
  if (!block) return DEFAULT_DESKTOP_MEDIA_WIDTH;
  const computed = getComputedStyle(block).getPropertyValue('--prompt-marquee-desktop-media-max-width');
  const parsed = parseFloat(computed);
  return Number.isNaN(parsed) ? DEFAULT_DESKTOP_MEDIA_WIDTH : parsed;
}

function getDisplayImageWidth(block, optimalWidth) {
  const isDesktop = window.matchMedia(`(min-width: ${TABLET_MAX}px)`).matches;
  if (!isDesktop) return optimalWidth;
  const desktopMax = getDesktopImageMaxWidth(block);
  return Math.min(optimalWidth, desktopMax);
}

function ensureLink(tagName, attrs = {}) {
  const hrefKey = attrs.href || '';
  const relSelector = attrs.rel ? `[rel="${attrs.rel}"]` : '';
  const existing = hrefKey
    ? document.head.querySelector(`${tagName}${relSelector}[data-prompt-marquee="${hrefKey}"]`)
      || document.head.querySelector(`${tagName}${relSelector}[href="${hrefKey}"]`)
    : null;
  if (existing) return existing;
  const el = document.createElement(tagName);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) el.setAttribute(key, value);
  });
  if (hrefKey) el.dataset.promptMarquee = hrefKey;
  document.head.appendChild(el);
  return el;
}

function addImagePreconnects(imageUrl) {
  if (!imageUrl) return;
  try {
    const url = new URL(imageUrl, window.location.href);
    if (url.origin !== window.location.origin) {
      ensureLink('link', {
        rel: 'preconnect',
        href: url.origin,
        crossorigin: 'anonymous',
      });
    }
  } catch (e) {
    console.error(e);
  }
}

function preloadImage(imageUrl) {
  if (!imageUrl) return;
  ensureLink('link', { rel: 'preload', as: 'image', href: imageUrl });
}

function getPlaceholderFromCta(cta) {
  if (!cta) return DEFAULT_PLACEHOLDER_TEXT;

  const datasetPlaceholder = cta.dataset?.placeholderText ?? cta.dataset?.placeholder;
  if (datasetPlaceholder) {
    const trimmed = datasetPlaceholder.trim();
    return trimmed || DEFAULT_PLACEHOLDER_TEXT;
  }

  const host = cta.closest('p') || cta;
  const placeholderParagraph = host?.nextElementSibling;
  if (placeholderParagraph?.tagName === 'P') {
    const text = placeholderParagraph.textContent.trim();
    placeholderParagraph.remove();
    return text || DEFAULT_PLACEHOLDER_TEXT;
  }

  return DEFAULT_PLACEHOLDER_TEXT;
}

function setBackgroundFromFirstRow(block, rows) {
  const bgImg = rows[0]?.querySelector('img');
  if (!bgImg) return;

  block.firstElementChild?.remove();

  const url = new URL(bgImg.src, window.location.href);
  const { pathname } = url;
  const optimalWidth = getOptimalImageSize();
  const width = getDisplayImageWidth(block, optimalWidth);
  const optimizedImageUrl = `${pathname}?width=${width}&format=webp&optimize=medium`;
  block.style.setProperty('--bg-image', `url("${optimizedImageUrl}")`);

  preloadImage(optimizedImageUrl);
  addImagePreconnects(bgImg.src);
}

function classifyAndOptimizeCells(block, rows) {
  let pictureCellCount = 0;
  rows.forEach((row) => {
    const cells = Array.from(row.children);
    cells.forEach((cell) => {
      cell.classList.add('column');

      cell.querySelectorAll(':scope p:empty').forEach(($p) => {
        if ($p.innerHTML.trim() === '') $p.remove();
      });

      const childEls = [...cell.children];
      const isPictureColumn = childEls.length > 0 && childEls.every((el) => ['BR', 'PICTURE'].includes(el.tagName));
      if (!isPictureColumn) return;

      pictureCellCount += 1;
      cell.classList.add('column-picture');
      if (pictureCellCount === 2) cell.classList.add('column-picture-mobile');

      const isMobileVariant = cell.classList.contains('column-picture-mobile');
      const visibleOnDesktop = !isMobileVariant;
      const isDesktop = window.matchMedia(`(min-width: ${TABLET_MAX}px)`).matches;
      const shouldEagerLoad = (isDesktop && visibleOnDesktop) || (!isDesktop && isMobileVariant);

      const img = cell.querySelector('img');
      if (!img) return;

      const srcUrl = new URL(img.src, window.location.href);
      const { pathname } = srcUrl;
      const optimalWidth = getOptimalImageSize();
      const displayWidth = getDisplayImageWidth(block, optimalWidth);
      const newSrc = `${pathname}?width=${displayWidth}&format=webp&optimize=medium`;
      if (img.src !== newSrc) img.src = newSrc;
      img.setAttribute('width', displayWidth);
      img.setAttribute('height', Math.round(displayWidth * IMAGE_ASPECT_RATIO));
      img.setAttribute('decoding', 'async');

      if (shouldEagerLoad) {
        img.setAttribute('loading', 'eager');
        img.setAttribute('fetchpriority', 'high');
        addImagePreconnects(img.src);
        if (pictureCellCount === 1) preloadImage(img.src);
      } else {
        img.setAttribute('loading', 'lazy');
        img.removeAttribute('fetchpriority');
      }
    });
  });
}

export function replacePromptTokenInUrl(url, promptText) {
  if (!url || !promptText) return url;
  const encodedPrompt = encodeURIComponent(promptText).replace(/%20/g, '+');
  const patterns = [
    /%7B%7B?prompt(?:%20|-)text%7D%7D?/gi,
    /\{\{?prompt(?:\s|-)text\}\}?/gi,
  ];
  let result = url;
  patterns.forEach((re) => { result = result.replace(re, encodedPrompt); });
  return result;
}

export default async function decorate(block) {
  ({ getMetadata, loadStyle, getConfig } = await import(`${getLibs()}/utils/utils.js`));
  const { decorateButtons } = await import(`${getLibs()}/utils/decorate.js`);
  decorateButtons(block, 'button-xxl');

  loadStyle(`${getConfig().codeRoot}/blocks/prompt-marquee/prompt-marquee-delayed.css`);

  const rows = Array.from(block.children);
  if (!rows.length) return;

  setBackgroundFromFirstRow(block, rows);

  const firstContentRow = block.firstElementChild;
  const numCols = firstContentRow ? firstContentRow.children.length : 0;
  if (numCols) block.classList.add(`width-${numCols}-columns`);

  classifyAndOptimizeCells(block, Array.from(block.children));

  if (['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) {
    const logo = getIconElementDeprecated('adobe-express-logo');
    logo.classList.add('express-logo');
    block.querySelector('.column')?.prepend(logo);
  }

  let cta = block.querySelector('a.button, a.con-button');
  if (!cta) {
    const lastParagraph = block.querySelector('p:has(a)');
    const candidateLink = lastParagraph?.querySelector(':scope > a:not(.button)');
    const shouldPromote = !!(candidateLink
      && lastParagraph.childElementCount === 1
      && lastParagraph.textContent.trim() === candidateLink.textContent.trim());
    if (shouldPromote) {
      candidateLink.classList.add('button', 'accent', 'primaryCTA', 'xlarge');
      lastParagraph.classList.add('button-container');
      cta = candidateLink;
    }
  }

  if (cta) {
    const wrapper = document.createElement('div');
    wrapper.className = 'prompt-marquee-input-wrapper';

    const placeholderText = getPlaceholderFromCta(cta);
    wrapper.setAttribute('data-placeholder', placeholderText);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholderText;
    input.className = 'prompt-marquee-input';
    if (placeholderText && !input.hasAttribute('aria-label')) {
      input.setAttribute('aria-label', placeholderText);
    }
    wrapper.appendChild(input);
    cta.classList.add('same-fcta');
    cta.classList.add('suppress-until-not-visible');

    const container = cta.closest('.button-container') || cta.parentElement;
    container.classList.add('cta-with-input');
    container.prepend(wrapper);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        cta.click();
      } else if (e.key === 'Escape') {
        input.blur();
      }
    });

    cta.dataset.originalHref = cta.getAttribute('href');

    const onCtaClick = (e) => {
      e.stopPropagation();
      e.preventDefault();

      const value = input.value?.trim();
      const baseHref = cta.href || cta.dataset.originalHref;
      if (!value) {
        window.location.assign(baseHref);
        return;
      }

      let nextUrlStr = replacePromptTokenInUrl(baseHref, value);
      if (nextUrlStr === baseHref) {
        try {
          const u = new URL(baseHref, window.location.href);
          u.searchParams.set('acom-input', value);
          nextUrlStr = u.toString();
        } catch (err) {
          console.error(err);
        }
      }
      window.location.assign(nextUrlStr);
    };

    cta.addEventListener('click', onCtaClick, { capture: true });
  }
}
