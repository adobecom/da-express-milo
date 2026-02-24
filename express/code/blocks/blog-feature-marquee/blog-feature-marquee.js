import { getLibs } from '../../scripts/utils.js';

let createTag;
let getMetadata;

const MOBILE_MAX = 600;
const TABLET_MAX = 900;
const HERO_IMAGE_WIDTHS = { mobile: 480, tablet: 720, desktop: 960 };
const PRECONNECT_DATA_ATTRIBUTE = 'blogFeatureMarquee';
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
};

function getBlogFeatureMarqueeMetadata() {
  if (!getMetadata) return {};
  const sanitize = (value) => (typeof value === 'string' ? value.trim() : '');
  return Object.entries(METADATA_KEYS).reduce((acc, [key, metaName]) => {
    const metaValue = sanitize(getMetadata(metaName));
    if (metaValue) acc[key] = metaValue;
    return acc;
  }, {});
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

function decorateContentColumn(column, metadata = {}, contentNodes = []) {
  column.classList.add('blog-feature-marquee-content');
  column.textContent = '';

  const available = [...contentNodes];
  const take = (predicate) => {
    const index = available.findIndex(
      (node) => node.nodeType === Node.ELEMENT_NODE && predicate(node),
    );
    if (index === -1) return null;
    const [node] = available.splice(index, 1);
    return node;
  };

  // Eyebrow row: product icon + product name from metadata
  const productName = metadata.productName;
  const iconPath = metadata.productIcon || DEFAULT_PRODUCT_ICON_PATH;
  if (productName || iconPath) {
    const eyebrow = createTag('div', { class: 'blog-feature-marquee-eyebrow' });
    if (iconPath) {
      const icon = createTag('img', {
        src: iconPath,
        alt: productName ? `${productName} logo` : 'Product logo',
        loading: 'lazy',
        decoding: 'async',
        width: 20,
        height: 20,
      });
      eyebrow.append(icon);
    }
    if (productName) {
      eyebrow.append(createTag('span', { class: 'blog-feature-marquee-eyebrow-text' }, productName));
    }
    column.append(eyebrow);
  } else {
    const fallbackEyebrow = take((node) => node.matches?.('p'));
    if (fallbackEyebrow) {
      fallbackEyebrow.classList.add('blog-feature-marquee-eyebrow');
      column.append(fallbackEyebrow);
    }
  }

  // Headline
  const headlineText = metadata.headline || metadata.title;
  if (headlineText) {
    column.append(createTag('h2', null, headlineText));
  } else {
    const fallbackHeadline = take((node) => /^H[1-6]$/.test(node.tagName));
    if (fallbackHeadline) column.append(fallbackHeadline);
  }

  // Subcopy
  if (metadata.subcopy) {
    column.append(createTag('p', { class: 'blog-feature-marquee-subcopy' }, metadata.subcopy));
  } else {
    const fallbackParagraph = take((node) => node.tagName === 'P');
    if (fallbackParagraph) {
      fallbackParagraph.classList.add('blog-feature-marquee-subcopy');
      column.append(fallbackParagraph);
    }
  }
}

function buildCardAuthor(metadata = {}, authorNodes = []) {
  const { productName, productIcon, date } = metadata;
  const hasContent = productName || date || authorNodes.length;
  if (!hasContent) return null;

  const authorSection = createTag('div', { class: 'blog-feature-marquee-card-author' });

  // Author icon
  const iconPath = productIcon || DEFAULT_PRODUCT_ICON_PATH;
  const authorIcon = createTag('div', { class: 'blog-feature-marquee-card-author-icon' });
  if (authorNodes.length) {
    // Use authored icon if present
    const pictureNode = authorNodes.find((n) => n.tagName === 'PICTURE' || n.querySelector?.('picture, img'));
    if (pictureNode) {
      const img = pictureNode.querySelector?.('img') || (pictureNode.tagName === 'IMG' ? pictureNode : null);
      if (img) {
        img.setAttribute('width', PRODUCT_ICON_SIZE);
        img.setAttribute('height', PRODUCT_ICON_SIZE);
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
      }
      authorIcon.append(pictureNode);
    }
  } else if (iconPath) {
    const img = createTag('img', {
      src: iconPath,
      alt: productName ? `${productName} logo` : 'Product logo',
      loading: 'lazy',
      decoding: 'async',
      width: PRODUCT_ICON_SIZE,
      height: PRODUCT_ICON_SIZE,
    });
    authorIcon.append(img);
  }

  if (authorIcon.childElementCount) authorSection.append(authorIcon);

  // Author info (name + date)
  const infoWrapper = createTag('div', { class: 'blog-feature-marquee-card-author-info' });
  if (productName) {
    infoWrapper.append(createTag('p', { class: 'blog-feature-marquee-card-author-name' }, productName));
  }
  if (date) {
    infoWrapper.append(createTag('p', { class: 'blog-feature-marquee-card-author-date' }, date));
  }

  if (infoWrapper.childElementCount) authorSection.append(infoWrapper);
  return authorSection.childElementCount ? authorSection : null;
}

function decorateCardColumn(column, metadata = {}, cardNodes = []) {
  column.classList.add('blog-feature-marquee-card');
  column.textContent = '';

  const card = createTag('div', { class: 'blog-feature-marquee-card-inner' });

  // Card media area (image + Featured badge)
  const mediaArea = createTag('div', { class: 'blog-feature-marquee-card-media' });
  const badge = createTag('span', { class: 'blog-feature-marquee-featured-badge' }, 'Featured');
  mediaArea.append(badge);

  const available = [...cardNodes];
  let pictureNode = null;

  const pictureIdx = available.findIndex(
    (n) => n.tagName === 'PICTURE' || n.tagName === 'IMG' || n.querySelector?.('picture, img'),
  );
  if (pictureIdx !== -1) {
    [pictureNode] = available.splice(pictureIdx, 1);
  }

  if (pictureNode) {
    const columnWidth = Math.round(column.getBoundingClientRect().width);
    const targetWidth = columnWidth || getResponsiveWidth(HERO_IMAGE_WIDTHS, HERO_IMAGE_WIDTHS.desktop);
    const img = pictureNode.querySelector?.('img') || (pictureNode.tagName === 'IMG' ? pictureNode : null);
    if (img) {
      optimizeImage(img, {
        width: targetWidth,
        eager: true,
        priority: 'high',
        preload: true,
      });
      img.classList.add('blog-feature-marquee-card-image');
    }
    mediaArea.append(pictureNode);
  }

  card.append(mediaArea);

  // Card body (title, description, author)
  const cardBody = createTag('div', { class: 'blog-feature-marquee-card-body' });

  // Article title
  const titleIdx = available.findIndex((n) => /^H[1-6]$/.test(n.tagName));
  if (titleIdx !== -1) {
    const titleNode = available.splice(titleIdx, 1)[0];
    titleNode.className = 'blog-feature-marquee-card-title';
    cardBody.append(titleNode);
  } else if (metadata.title) {
    cardBody.append(createTag('h3', { class: 'blog-feature-marquee-card-title' }, metadata.title));
  }

  // Article description
  const descIdx = available.findIndex(
    (n) => n.tagName === 'P' && !n.querySelector('img, picture'),
  );
  if (descIdx !== -1) {
    const descNode = available.splice(descIdx, 1)[0];
    descNode.classList.add('blog-feature-marquee-card-description');
    cardBody.append(descNode);
  } else if (metadata.description) {
    cardBody.append(createTag('p', { class: 'blog-feature-marquee-card-description' }, metadata.description));
  }

  // Author section (uses remaining nodes + metadata)
  const authorNodes = available.filter((n) => n.nodeType === Node.ELEMENT_NODE);
  const authorSection = buildCardAuthor(metadata, authorNodes);
  if (authorSection) cardBody.append(authorSection);

  card.append(cardBody);
  column.append(card);
}

function prepareStructure(block) {
  const rows = [...block.children].filter((row) => row.tagName === 'DIV');

  const wrapper = createTag('div', { class: 'blog-feature-marquee-inner' });
  block.replaceChildren(wrapper);

  const mainRow = createTag('div', { class: 'blog-feature-marquee-row' });
  wrapper.append(mainRow);

  const contentColumn = createTag('div', { class: 'column' });
  const cardColumn = createTag('div', { class: 'column' });
  mainRow.append(contentColumn, cardColumn);

  if (!rows.length) {
    return {
      wrapper,
      mainRow,
      contentColumn,
      cardColumn,
      contentNodes: [],
      cardNodes: [],
    };
  }

  const [imageRow] = rows;
  const columns = [...imageRow.children].filter((col) => col.tagName === 'DIV');

  const contentNodes = [];
  const cardNodes = [];

  if (columns.length >= 2) {
    [...columns[0].childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) contentNodes.push(child);
    });
    [...columns[1].childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) cardNodes.push(child);
    });
  } else if (columns.length === 1) {
    const col = columns[0];
    if (isPictureOnlyColumn(col)) {
      [...col.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) cardNodes.push(child);
      });
    } else {
      [...col.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) contentNodes.push(child);
      });
    }
  } else {
    [...imageRow.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) contentNodes.push(child);
    });
  }

  imageRow.remove();

  return {
    wrapper,
    mainRow,
    contentColumn,
    cardColumn,
    contentNodes,
    cardNodes,
  };
}

export default async function decorate(block) {
  ({ createTag, getMetadata } = await import(`${getLibs()}/utils/utils.js`));
  block.classList.add('blog-feature-marquee');

  const metadata = getBlogFeatureMarqueeMetadata();

  const {
    wrapper,
    mainRow,
    contentColumn,
    cardColumn,
    contentNodes,
    cardNodes,
  } = prepareStructure(block);

  if (!mainRow || !contentColumn) return;

  decorateContentColumn(contentColumn, metadata, contentNodes);
  decorateCardColumn(cardColumn, metadata, cardNodes);

  wrapper.classList.add('blog-feature-marquee-ready');
}
