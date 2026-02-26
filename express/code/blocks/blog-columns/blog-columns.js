import { getLibs } from '../../scripts/utils.js';

let createTag;

const MOBILE_MAX = 600;
const TABLET_MAX = 900;
const HERO_IMAGE_WIDTHS = { mobile: 480, tablet: 720, desktop: 960 };
const PRECONNECT_DATA_ATTRIBUTE = 'blogColumns';
const DEFAULT_PRODUCT_ICON_PATH = 'https://main--da-express-milo--adobecom.aem.page/express/learn/blog/assets/media_1f021705c13704e1e3041b414d0aa1ce883e067ec.png';
const PRODUCT_ICON_SIZE = 48;

const IMAGE_URL_PATTERN = /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i;
const URL_PATTERN = /^https?:\/\/\S+/i;

function isImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return URL_PATTERN.test(trimmed) && (IMAGE_URL_PATTERN.test(trimmed) || trimmed.includes('/media_'));
}

function extractImageUrlFromNode(node) {
  if (!node) return null;
  if (node.tagName === 'A' && node.href && isImageUrl(node.href)) return node.href.trim();
  const link = node.querySelector?.('a[href]');
  if (link?.href && isImageUrl(link.href)) return link.href.trim();
  const text = node.textContent?.trim();
  if (text && isImageUrl(text)) return text;
  return null;
}

function getViewportWidth() {
  return window.innerWidth || document.documentElement?.clientWidth || 0;
}

function getResponsiveWidth(widths, fallback = 600) {
  const viewportWidth = getViewportWidth();
  if (viewportWidth && viewportWidth <= MOBILE_MAX) return widths.mobile ?? fallback;
  if (viewportWidth && viewportWidth <= TABLET_MAX) {
    return widths.tablet ?? widths.desktop ?? fallback;
  }
  return widths.desktop ?? widths.tablet ?? widths.mobile ?? fallback;
}

function ensureHeadLink(tagName, attrs = {}) {
  const hrefKey = attrs.href || '';
  const relSelector = attrs.rel ? `[rel="${attrs.rel}"]` : '';
  const existing = hrefKey
    ? document.head.querySelector(`${tagName}${relSelector}[data-${PRECONNECT_DATA_ATTRIBUTE}="${hrefKey}"]`)
    || document.head.querySelector(`${tagName}${relSelector}[href="${hrefKey}"]`)
    : null;
  if (existing) return existing;
  const el = document.createElement(tagName);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) el.setAttribute(key, value);
  });
  if (hrefKey) el.dataset[PRECONNECT_DATA_ATTRIBUTE] = hrefKey;
  document.head.appendChild(el);
  return el;
}

function addImagePreconnects(imageUrl) {
  if (!imageUrl) return;
  try {
    const url = new URL(imageUrl, window.location.href);
    if (url.origin !== window.location.origin) {
      ensureHeadLink('link', {
        rel: 'preconnect',
        href: url.origin,
        crossorigin: 'anonymous',
      });
    }
  } catch (e) {
    console.error('Error adding image preconnect:', e);
  }
}

function preloadImage(imageUrl) {
  if (!imageUrl) return;
  ensureHeadLink('link', { rel: 'preload', as: 'image', href: imageUrl });
}

function buildOptimizedImageUrl(src, width) {
  if (!src || !width) return null;
  try {
    const url = new URL(src, window.location.href);
    const roundedWidth = Math.max(1, Math.round(width));
    return `${url.pathname}?width=${roundedWidth}&format=webp&optimize=medium`;
  } catch (e) {
    console.error('Error building optimized image URL:', e);
    return null;
  }
}

function getAspectRatio(img) {
  const widthAttr = Number.parseFloat(img.getAttribute('width'));
  const heightAttr = Number.parseFloat(img.getAttribute('height'));
  if (widthAttr > 0 && heightAttr > 0) return heightAttr / widthAttr;
  return null;
}

function optimizeImage(img, {
  width,
  eager = false,
  priority,
  preload = false,
  preconnect = true,
} = {}) {
  if (!img) return;

  const originalSrc = img.currentSrc || img.src;
  const optimizedSrc = buildOptimizedImageUrl(originalSrc, width);
  if (optimizedSrc) {
    img.src = optimizedSrc;
    if (preload) preloadImage(optimizedSrc);
  }
  if (preconnect) addImagePreconnects(originalSrc);

  const ratio = getAspectRatio(img);
  if (width) {
    img.setAttribute('width', Math.round(width));
    if (ratio) img.setAttribute('height', Math.round(width * ratio));
  }

  img.setAttribute('decoding', 'async');

  if (eager) {
    img.setAttribute('loading', 'eager');
    if (priority) img.setAttribute('fetchpriority', priority);
  } else {
    img.setAttribute('loading', 'lazy');
    img.removeAttribute('fetchpriority');
  }
}

function isPictureOnlyColumn(column) {
  if (!column) return false;
  const media = column.querySelectorAll('picture, img');
  if (!media.length) return false;
  const nonDecorativeChildren = [...column.children]
    .filter((el) => !['BR', 'PICTURE'].includes(el.tagName) && !(el.tagName === 'IMG' && el.closest('picture')));
  return nonDecorativeChildren.length === 0;
}

function processImageCell(cell, mediaColumn) {
  if (!cell || !mediaColumn) return;

  const img = cell.querySelector('img');
  const picture = cell.querySelector('picture');
  const imageUrl = extractImageUrlFromNode(cell);

  if (picture || img) {
    mediaColumn.append(picture || img);
  } else if (imageUrl) {
    const imgEl = createTag('img', {
      src: imageUrl,
      alt: '',
      width: 960,
      height: 540,
      loading: 'eager',
      decoding: 'async',
    });
    mediaColumn.append(imgEl);
  }
}

function normalizeProductMedia(media) {
  if (!media) return null;
  if (typeof media.remove === 'function') media.remove();

  let wrapper = media;
  if (!wrapper.classList?.contains('blog-columns-product-media')) {
    wrapper = createTag('div', { class: 'blog-columns-product-media' });
    wrapper.append(media);
  }

  const img = wrapper.querySelector?.('img') || (wrapper.tagName === 'IMG' ? wrapper : null);
  if (img) {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
    img.setAttribute('width', PRODUCT_ICON_SIZE);
    img.setAttribute('height', PRODUCT_ICON_SIZE);
  }

  return wrapper;
}

function buildProductHighlight(metadata = {}, fallbackMedia = null) {
  const { productName, productIcon, date } = metadata;
  const productCopy = Array.isArray(metadata.productCopy) ? metadata.productCopy : [];
  const hasContent = productName || date || productCopy.length || fallbackMedia;
  if (!hasContent) return null;

  const wrapper = createTag('div', { class: 'blog-columns-products' });
  const product = createTag('div', { class: 'blog-columns-product' });

  if (fallbackMedia) {
    const mediaWrapper = normalizeProductMedia(fallbackMedia);
    if (mediaWrapper) product.append(mediaWrapper);
  } else {
    const iconPath = productIcon || DEFAULT_PRODUCT_ICON_PATH;
    if (iconPath) {
      const logoImg = createTag('img', {
        src: iconPath,
        alt: productName ? `${productName} logo` : 'Product logo',
        loading: 'lazy',
        decoding: 'async',
        width: PRODUCT_ICON_SIZE,
        height: PRODUCT_ICON_SIZE,
      });
      const mediaWrapper = normalizeProductMedia(logoImg);
      product.append(mediaWrapper);
    }
  }

  const copyWrapper = createTag('div', { class: 'blog-columns-product-copy' });
  if (productName) {
    copyWrapper.append(createTag('p', { class: 'blog-columns-product-name' }, productName));
  }
  if (date) {
    copyWrapper.append(createTag('p', { class: 'blog-columns-product-date' }, date));
  }

  if (copyWrapper.childElementCount) product.append(copyWrapper);
  if (!product.childElementCount) return null;

  wrapper.append(product);
  return wrapper;
}

function normalizeHeadingLevel(level) {
  if (typeof level !== 'string') return 'h2';
  const normalized = level.toLowerCase();
  return /^h[1-6]$/.test(normalized) ? normalized : 'h2';
}

function decorateContentColumn(column, content = {}, ctaNode = null, opt = {}) {
  column.classList.add('blog-columns-content');
  column.textContent = '';
  const headingLevel = normalizeHeadingLevel(opt.headingLevel);

  const { eyebrow, headline, subcopy, productName, date } = content;

  if (eyebrow) {
    column.append(createTag('p', { class: 'blog-columns-eyebrow' }, eyebrow));
  }

  if (headline) {
    column.append(createTag(headingLevel, null, headline));
  }

  if (subcopy) {
    column.append(createTag('p', { class: 'blog-columns-subcopy' }, subcopy));
  }

  const productHighlight = buildProductHighlight({ productName, date }, null);
  if (productHighlight) {
    column.append(productHighlight);
  }

  if (ctaNode) column.append(ctaNode);
}

function decorateMediaColumn(column) {
  column.classList.add('blog-columns-media');
  const img = column.querySelector('img');
  if (!img) return;
  const columnWidth = Math.round(column.getBoundingClientRect().width);
  const targetWidth = columnWidth || getResponsiveWidth(
    HERO_IMAGE_WIDTHS,
    HERO_IMAGE_WIDTHS.desktop,
  );
  optimizeImage(img, {
    width: targetWidth,
    eager: true,
    priority: 'high',
    preload: true,
  });
  img.classList.add('blog-columns-media-image');
}

function extractCTA(row) {
  if (!row) return null;
  const container = row.querySelector('p:has(a)') || row.querySelector('div:has(a)') || row.querySelector('a');
  if (!container) return null;
  const target = container.closest('p, div') || container;
  const childNodes = [...target.childNodes];
  target.remove();
  if (target.tagName === 'P') {
    const wrapper = createTag('div', { class: 'button-container action-area' });
    wrapper.append(...childNodes);
    return wrapper;
  }
  target.classList.add('button-container');
  target.classList.add('action-area');
  return target;
}

function parseContentRow(row) {
  if (!row) return { eyebrow: '', headline: '', subcopy: '' };
  const elements = [...row.querySelectorAll('p, h1, h2, h3, h4, h5, h6')];
  const texts = elements.map((el) => el.textContent?.trim() || '').filter(Boolean);
  const eyebrow = texts[0] || '';
  const headline = texts[1] || '';
  const subcopy = texts.slice(2).join(' ').trim() || '';
  return { eyebrow, headline, subcopy };
}

function parseProductRow(row) {
  if (!row) return { productName: '', date: '', ctaNode: null };
  const paras = [...row.querySelectorAll('p')];
  const links = [...row.querySelectorAll('a')];
  const productName = paras[0]?.textContent?.trim() || '';
  const date = paras[1]?.textContent?.trim() || '';
  const ctaNode = extractCTA(row);
  if (!ctaNode && links.length) {
    const link = links[0];
    const wrapper = createTag('div', { class: 'button-container action-area' });
    wrapper.append(link);
    return { productName, date, ctaNode: wrapper };
  }
  return { productName, date, ctaNode };
}

function prepareStructure(block) {
  const rows = [...block.children].filter((row) => row.tagName === 'DIV');
  if (!rows.length) {
    const wrapperFallback = createTag('div', { class: 'blog-columns-inner' });
    const mainRowFallback = createTag('div', { class: 'blog-columns-row' });
    wrapperFallback.append(mainRowFallback);
    block.replaceChildren(wrapperFallback);
    const content = createTag('div', { class: 'column blog-columns-content' });
    const media = createTag('div', { class: 'column blog-columns-media' });
    mainRowFallback.append(content, media);
    return {
      wrapper: wrapperFallback,
      mainRow: mainRowFallback,
      contentColumn: content,
      mediaColumn: media,
      content: { eyebrow: '', headline: '', subcopy: '', productName: '', date: '' },
      ctaNode: null,
    };
  }

  const [imageRow, contentRow, productRow] = rows;
  const wrapper = createTag('div', { class: 'blog-columns-inner' });
  block.replaceChildren(wrapper);

  const mainRow = createTag('div', { class: 'blog-columns-row' });
  wrapper.append(mainRow);

  const contentColumn = createTag('div', { class: 'column blog-columns-content' });
  const mediaColumn = createTag('div', { class: 'column blog-columns-media' });
  mainRow.append(contentColumn, mediaColumn);

  if (imageRow) {
    const columns = [...imageRow.children].filter((col) => col.tagName === 'DIV');
    const cells = columns.length ? columns : [imageRow];
    for (const cell of cells) {
      if (isPictureOnlyColumn(cell)) {
        [...cell.children].forEach((child) => mediaColumn.append(child));
      } else {
        processImageCell(cell, mediaColumn);
      }
      cell.remove();
    }
    imageRow.remove();
  }

  const hasContentRow = rows.length >= 2 && contentRow;
  const hasProductRow = rows.length >= 3 && productRow;

  const isCtaOnlyRow = (row) => {
    if (!row) return false;
    const paras = row.querySelectorAll('p');
    const links = row.querySelectorAll('a');
    return links.length === 1 && paras.length <= 1 && paras[0]?.querySelector('a');
  };

  let content = { eyebrow: '', headline: '', subcopy: '', productName: '', date: '' };
  let ctaNode = null;

  if (hasProductRow) {
    const product = parseProductRow(productRow);
    content = {
      ...parseContentRow(contentRow),
      productName: product.productName,
      date: product.date,
    };
    ctaNode = product.ctaNode;
  } else if (hasContentRow) {
    if (isCtaOnlyRow(contentRow)) {
      ctaNode = extractCTA(contentRow);
    } else {
      content = parseContentRow(contentRow);
    }
  }

  return {
    wrapper,
    mainRow,
    contentColumn,
    mediaColumn,
    content,
    ctaNode,
  };
}

export default async function decorate(block) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const { decorateButtons } = await import(`${getLibs()}/utils/decorate.js`);
  block.classList.add('blog-columns');

  decorateButtons(block, 'button-xl');

  const {
    wrapper,
    mainRow,
    contentColumn,
    mediaColumn,
    content,
    ctaNode,
  } = prepareStructure(block);

  if (!mainRow || !contentColumn) return;

  decorateContentColumn(contentColumn, content, ctaNode, { headingLevel: 'h2' });
  if (mediaColumn) decorateMediaColumn(mediaColumn);
  if (ctaNode) {
    ctaNode.querySelectorAll('a').forEach((link) => {
      link.classList.add('button-xl');
      if (!link.classList.contains('con-button')) link.classList.add('con-button');
      const customClasses = link.href && [...link.href.matchAll(/#_button-([a-zA-Z-]+)/g)];
      if (customClasses) {
        customClasses.forEach((match) => {
          link.href = link.href.replace(match[0], '');
          link.classList.add(match[1]);
        });
      }
    });
  }
  wrapper.classList.add('blog-columns-ready');
}
