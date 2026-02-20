import { getLibs } from '../../scripts/utils.js';

let createTag;
let getMetadata;

const MOBILE_MAX = 600;
const TABLET_MAX = 900;
const HERO_IMAGE_WIDTHS = { mobile: 480, tablet: 720, desktop: 960 };
const PRECONNECT_DATA_ATTRIBUTE = 'blogArticleMarquee';
const DEFAULT_PRODUCT_ICON_PATH = 'https://main--da-express-milo--adobecom.aem.page/express/learn/blog/assets/media_1f021705c13704e1e3041b414d0aa1ce883e067ec.png';
const PRODUCT_ICON_SIZE = 48;

const METADATA_KEYS = {
  eyebrow: 'category',
  headline: 'headline',
  subcopy: 'sub-heading',
  title: 'og:title',
  productName: 'author',
  productIcon: 'blog-marquee-icon',
  date: 'publication-date',
  description: 'description',
  tags: 'tags',
};

function getBlogArticleMarqueeMetadata() {
  if (!getMetadata) return {};
  const sanitize = (value) => (typeof value === 'string' ? value.trim() : '');
  const meta = Object.entries(METADATA_KEYS).reduce((acc, [key, metaName]) => {
    const metaValue = sanitize(getMetadata(metaName));
    if (metaValue) acc[key] = metaValue;
    return acc;
  }, {});
  const productCopy = [];
  if (meta.description) {
    productCopy.push(meta.description);
  }
  const tags = Array.isArray(meta.tags)
    ? meta.tags
    : meta.tags
      ?.split(/\r?\n+|[|]{2,}|,+/)
      .map((entry) => entry.trim())
      .filter(Boolean);

  if (tags?.length) {
    productCopy.push(`Tags: ${tags.join(', ')}`);
  }

  if (productCopy.length) {
    meta.productCopy = productCopy;
  }

  delete meta.description;
  delete meta.tags;

  return meta;
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

function normalizeProductMedia(media) {
  if (!media) return null;
  if (typeof media.remove === 'function') media.remove();

  let wrapper = media;
  if (!wrapper.classList?.contains('blog-article-marquee-product-media')) {
    wrapper = createTag('div', { class: 'blog-article-marquee-product-media' });
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

  const wrapper = createTag('div', { class: 'blog-article-marquee-products' });
  const product = createTag('div', { class: 'blog-article-marquee-product' });

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

  const copyWrapper = createTag('div', { class: 'blog-article-marquee-product-copy' });
  if (productName) {
    copyWrapper.append(createTag('p', { class: 'blog-article-marquee-product-name' }, productName));
  }
  if (date) {
    copyWrapper.append(createTag('p', { class: 'blog-article-marquee-product-date' }, date));
  }

  if (copyWrapper.childElementCount) product.append(copyWrapper);
  if (!product.childElementCount) return null;

  wrapper.append(product);
  return wrapper;
}

function normalizeHeadingLevel(level) {
  if (typeof level !== 'string') return 'h1';
  const normalized = level.toLowerCase();
  return /^h[1-6]$/.test(normalized) ? normalized : 'h1';
}

function convertHeadingTag(element, targetTag) {
  if (!element) return null;
  if (element.tagName?.toLowerCase() === targetTag) return element;
  const replacement = createTag(targetTag);
  if (element.getAttributeNames) {
    element.getAttributeNames().forEach((attrName) => {
      replacement.setAttribute(attrName, element.getAttribute(attrName));
    });
  }
  replacement.innerHTML = element.innerHTML;
  return replacement;
}

function decorateContentColumn(column, metadata = {}, ctaNode = null, fallbackNodes = [], options = {}) {
  column.classList.add('blog-article-marquee-content');
  column.textContent = '';
  const headingLevel = normalizeHeadingLevel(options.headingLevel);

  const availableFallback = [...fallbackNodes];
  const takeFallback = (predicate) => {
    const index = availableFallback.findIndex(
      (node) => node.nodeType === Node.ELEMENT_NODE && predicate(node),
    );
    if (index === -1) return null;
    const [node] = availableFallback.splice(index, 1);
    return node;
  };

  if (metadata.eyebrow) {
    column.append(createTag('p', { class: 'blog-article-marquee-eyebrow' }, metadata.eyebrow));
  } else {
    const fallbackEyebrow = takeFallback((node) => node.matches?.('p'));
    if (fallbackEyebrow) {
      fallbackEyebrow.classList.add('blog-article-marquee-eyebrow');
      column.append(fallbackEyebrow);
    }
  }

  const headlineText = metadata.headline || metadata.title;
  if (headlineText) {
    column.append(createTag(headingLevel, null, headlineText));
  } else {
    const fallbackHeadline = takeFallback((node) => /^H[1-6]$/.test(node.tagName));
    if (fallbackHeadline) {
      const normalizedHeadline = convertHeadingTag(fallbackHeadline, headingLevel);
      column.append(normalizedHeadline);
    }
  }

  if (metadata.subcopy) {
    column.append(createTag('p', { class: 'blog-article-marquee-subcopy' }, metadata.subcopy));
  } else {
    const fallbackParagraph = takeFallback((node) => node.tagName === 'P');
    if (fallbackParagraph) {
      fallbackParagraph.classList.add('blog-article-marquee-subcopy');
      column.append(fallbackParagraph);
    }
  }

  const mergedMetadata = { ...metadata };
  const fallbackHighlightWrapper = takeFallback((node) => node.classList?.contains('blog-article-marquee-products'));
  let fallbackHighlightProduct = null;

  if (fallbackHighlightWrapper) {
    fallbackHighlightProduct = fallbackHighlightWrapper.querySelector('.blog-article-marquee-product');
  } else {
    fallbackHighlightProduct = takeFallback((node) => node.classList?.contains('blog-article-marquee-product'));
  }

  const highlightSource = fallbackHighlightProduct || fallbackHighlightWrapper;

  const extractMediaFromSource = (source) => {
    if (!source) return null;
    const directMedia = source.querySelector?.('.blog-article-marquee-product-media');
    if (directMedia) {
      return directMedia;
    }
    return source.matches?.('.blog-article-marquee-product-media') ? source : null;
  };

  let mediaCandidate = extractMediaFromSource(highlightSource);

  if (!mediaCandidate) {
    mediaCandidate = takeFallback((node) => {
      if (!node) return false;
      if (node.classList?.contains('blog-article-marquee-product-media')) return true;
      if (node.matches?.('picture, img')) return true;
      return node.querySelector?.('picture, img');
    });
  }

  let productMediaNode = null;
  if (mediaCandidate) {
    const picture = mediaCandidate.matches?.('picture, img')
      ? mediaCandidate
      : mediaCandidate.querySelector?.('picture, img');
    if (picture) {
      productMediaNode = picture;
    } else if (mediaCandidate.classList?.contains('blog-article-marquee-product-media')) {
      productMediaNode = mediaCandidate;
    }
    if (productMediaNode !== mediaCandidate) {
      mediaCandidate.remove?.();
    }
  }

  if (highlightSource) {
    const nameNode = highlightSource.querySelector('.blog-article-marquee-product-name');
    if (!mergedMetadata.productName && nameNode) {
      mergedMetadata.productName = nameNode.textContent.trim();
    }
    const dateNode = highlightSource.querySelector('.blog-article-marquee-product-date');
    if (!mergedMetadata.date && dateNode) mergedMetadata.date = dateNode.textContent.trim();
    if (!Array.isArray(mergedMetadata.productCopy) || !mergedMetadata.productCopy.length) {
      const copyParas = [...highlightSource.querySelectorAll('.blog-article-marquee-product-copy p')]
        .filter((p) => !p.classList.contains('blog-article-marquee-product-name')
          && !p.classList.contains('blog-article-marquee-product-date'))
        .map((p) => p.textContent.trim())
        .filter(Boolean);
      if (copyParas.length) mergedMetadata.productCopy = copyParas;
    }
  }

  const productHighlight = buildProductHighlight(mergedMetadata, productMediaNode);
  if (productHighlight) {
    column.append(productHighlight);
  } else if (fallbackHighlightWrapper) {
    column.append(fallbackHighlightWrapper);
  } else if (fallbackHighlightProduct) {
    const wrapper = createTag('div', { class: 'blog-article-marquee-products' });
    wrapper.append(fallbackHighlightProduct);
    column.append(wrapper);
  }

  if (ctaNode) column.append(ctaNode);
}

function decorateMediaColumn(column) {
  column.classList.add('blog-article-marquee-media');
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
  img.classList.add('blog-article-marquee-media-image');
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

function prepareStructure(block) {
  const rows = [...block.children].filter((row) => row.tagName === 'DIV');
  if (!rows.length) {
    const wrapperFallback = createTag('div', { class: 'blog-article-marquee-inner' });
    const mainRowFallback = createTag('div', { class: 'blog-article-marquee-row' });
    wrapperFallback.append(mainRowFallback);
    block.replaceChildren(wrapperFallback);
    const content = createTag('div', { class: 'column blog-article-marquee-content' });
    const media = createTag('div', { class: 'column blog-article-marquee-media' });
    mainRowFallback.append(content, media);
    return {
      wrapper: wrapperFallback,
      mainRow: mainRowFallback,
      col: content,
      mediaColumn: media,
      ctaNode: null,
      fallbackNodes: [],
    };
  }

  const [imageRow, ...maybeCtaRows] = rows;
  const wrapper = createTag('div', { class: 'blog-article-marquee-inner' });
  block.replaceChildren(wrapper);

  const mainRow = createTag('div', { class: 'blog-article-marquee-row' });
  wrapper.append(mainRow);

  const col = createTag('div', { class: 'column blog-article-marquee-content' });
  const mediaColumn = createTag('div', { class: 'column blog-article-marquee-media' });
  mainRow.append(col, mediaColumn);

  const fallbackNodes = [];

  if (imageRow) {
    const columns = [...imageRow.children].filter((col) => col.tagName === 'DIV');
    const processColumn = (col) => {
      const childNodes = Array.from(col.childNodes);

      if (isPictureOnlyColumn(col)) {
        childNodes.forEach((child) => {
          mediaColumn.append(child);
        });
      } else {
        childNodes.forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) fallbackNodes.push(child);
          child.remove();
        });
      }

      col.remove();
    };

    if (columns.length) {
      columns.forEach(processColumn);
    } else {
      processColumn(imageRow);
    }

    imageRow.remove();
  }

  const ctaNode = extractCTA(maybeCtaRows.find((row) => row.querySelector('a')));

  return {
    wrapper,
    mainRow,
    col,
    mediaColumn,
    ctaNode,
    fallbackNodes,
  };
}

export default async function decorate(block) {
  ({ createTag, getMetadata } = await import(`${getLibs()}/utils/utils.js`));
  const { decorateButtons } = await import(`${getLibs()}/utils/decorate.js`);
  block.classList.add('blog-article-marquee');

  const metadata = getBlogArticleMarqueeMetadata();

  const {
    wrapper,
    mainRow,
    col,
    mediaColumn,
    ctaNode,
    fallbackNodes,
  } = prepareStructure(block);

  if (!mainRow || !col) return;

  const headingLevel = block.classList.contains('columns') ? 'h2' : 'h1';
  decorateContentColumn(col, metadata, ctaNode, fallbackNodes, { headingLevel });
  if (mediaColumn) decorateMediaColumn(mediaColumn);
  decorateButtons(block, 'button-xl');
  if (ctaNode) {
    ctaNode.querySelectorAll('a').forEach((link) => {
      link.classList.add('button-xl');
      if (!link.classList.contains('con-button')) link.classList.add('con-button');
    });
  }
  wrapper.classList.add('blog-article-marquee-ready');
}
