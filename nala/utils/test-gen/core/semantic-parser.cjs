/**
 * Nala Test Generator - Semantic Parser
 * Version: 1.0.0
 * Date: 11-09-2025
 * Description: Config-driven parser for texts, media, and interactives.
 */
const config = require('../config/config.cjs');

function buildSelector(el) {
  let cls = '';
  if (typeof el.className === 'string') cls = el.className;
  else if (el.className && typeof el.className.baseVal === 'string') cls = el.className.baseVal;

  const classPart = cls
    .split(' ')
    .filter(Boolean)
    .filter((c) => !/^\d+$/.test(c))
    .map((c) => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(c) : c))
    .join('.');

  const tag = el.tagName?.toLowerCase?.() || '*';
  let sel = `${tag}${classPart ? `.${classPart}` : ''}`;

  const parent = el.closest?.(config.selectors.parentContext);
  if (parent && parent !== el) {
    const pCls = typeof parent.className === 'string'
      ? parent.className.split(' ')[0]
      : (parent.className?.baseVal?.split(' ')[0] || '');
    if (pCls) sel = `.${pCls} ${sel}`;
  }
  return sel;
}

function isHidden(el) {
  const hiddenSelectors = config.selectors.hiddenOrIgnoredElements.join(', ');
  return el.matches(hiddenSelectors) || el.closest(hiddenSelectors);
}

function parseBlock(block, blockName, variants, variantName, idx, input, normalizePath) {
  const semantic = { texts: [], media: [], interactives: [] };
  const seenText = new Set();

  // TEXTS
  const textSelectors = config.selectors.textElements;

  const textEls = block.querySelectorAll(textSelectors.join(','));
  textEls.forEach((el) => {
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (!text || text.length < 2) return;
    if (
      el.querySelector(
        'button,input,select,textarea,[role="button"],[role="tab"],[role="switch"]',
      )
    ) return;

    const key = text.toLowerCase();
    if (seenText.has(key)) return;
    seenText.add(key);

    const selector = buildSelector(el);
    const all = [...block.querySelectorAll(selector)];
    const nth = all.indexOf(el);
    const markup = Array.from(el.querySelectorAll('em,strong'))
      .map((t) => t.tagName.toLowerCase())
      .join('>') || null;
    semantic.texts.push({
      selector,
      nth,
      tag: el.tagName.toLowerCase(),
      text,
      markup,
    });
  });

  // MEDIA
  const mediaEls = block.querySelectorAll(config.selectors.mediaElements.join(','));
  mediaEls.forEach((el) => {
    if (isHidden(el)) return;

    const tag = el.tagName.toLowerCase();

    if (tag === 'picture') {
      const img = el.querySelector('img');
      if (img) {
        const src = img.getAttribute('src');
        const alt = img.getAttribute('alt');
        const selector = buildSelector(el);
        const all = [...block.querySelectorAll(selector)];
        const nth = all.indexOf(el);
        semantic.media.push({ selector, nth, tag: 'picture', src, alt });
      }
      return;
    }

    if (tag === 'img' && el.closest('picture')) return;

    if (tag === 'svg') {
      const useHref = el.querySelector('use')?.getAttribute('href') || null;
      const context = el.closest('.column-video-overlay')
        ? 'column-video-overlay'
        : null;
      const selector = buildSelector(el);
      const all = [...block.querySelectorAll(selector)];
      const nth = all.indexOf(el);
      semantic.media.push({
        selector,
        nth,
        tag,
        src: null,
        alt: null,
        useHref,
        context,
      });
      return;
    }

    const src = el.getAttribute('src') || null;
    const alt = el.getAttribute('alt') || null;
    const selector = buildSelector(el);
    const all = [...block.querySelectorAll(selector)];
    const nth = all.indexOf(el);
    semantic.media.push({ selector, nth, tag, src, alt });
  });

  // === INTERACTIVES ===
  const interactiveSelectors = config.selectors.interactiveElements.join(',');

  const interEls = block.querySelectorAll(interactiveSelectors);
  interEls.forEach((el) => {
    if (isHidden(el)) return;

    const tag = el.tagName.toLowerCase();
    const href = el.getAttribute('href');
    let cleanHref = href;
    if (href && /^https?:\/\//i.test(href)) {
      try {
        const u = new URL(href);
        cleanHref = u.pathname + (u.search || '');
      } catch {
        cleanHref = href;
      }
    }
    const role = el.getAttribute('role');
    let type = 'button';
    if (tag === 'a' && href) {
      type = href.endsWith('.m3u8') ? 'video-link' : 'link';
    } else if (['input', 'select', 'textarea'].includes(tag)) type = 'input';
    else if (role === 'tab') type = 'tab';
    else if (role === 'switch') type = 'switch';

    const selector = buildSelector(el);
    const all = [...block.querySelectorAll(selector)];
    const nth = all.indexOf(el);
    semantic.interactives.push({
      type,
      selector,
      nth,
      text: (el.textContent || '').trim(),
      href: cleanHref,
      ariaLabel: el.getAttribute('aria-label') || null,
      rel: el.getAttribute('rel') || null,
      title: el.getAttribute('title') || null,
      target: el.getAttribute('target') || null,
    });
  });

  return {
    tcid: idx.toString(),
    name: `@${blockName}-${variantName}`,
    selector: buildSelector(block),
    path: normalizePath(input, blockName, variantName),
    data: { semantic },
    tags: [`@${blockName}`, `@${variantName}`, config.tags.projectTag],
  };
}

module.exports = { parseBlock, buildSelector };
