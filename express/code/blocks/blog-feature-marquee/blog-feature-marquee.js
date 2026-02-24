import { getLibs } from '../../scripts/utils.js';
import buildLocalCarousel from './blog-feature-carousel.js';

let createTag;
let getMetadata;
let getConfig;

const MAX_ARTICLES = 6;
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
};

function getFeatureMarqueeMetadata() {
  if (!getMetadata) return {};
  const sanitize = (v) => (typeof v === 'string' ? v.trim() : '');
  return Object.entries(METADATA_KEYS).reduce((acc, [key, metaName]) => {
    const val = sanitize(getMetadata(metaName));
    if (val) acc[key] = val;
    return acc;
  }, {});
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchBlogIndex(locale) {
  const url = `${locale}/express/learn/blog/query-index.json`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const json = await resp.json();
    const data = json.data || [];
    const byPath = {};
    data.forEach((post) => { byPath[post.path.split('.')[0]] = post; });
    return { data, byPath };
  } catch {
    return null;
  }
}

function filterFeaturedPosts(index, config, max) {
  if (!index) return [];
  const results = [];

  // Explicit featured URLs from config take priority
  if (config.featured) {
    const urls = Array.isArray(config.featured) ? config.featured : [config.featured];
    urls.forEach((url) => {
      if (results.length >= max) return;
      try {
        const path = new URL(url).pathname.split('.')[0];
        const post = index.byPath[path];
        if (post) results.push(post);
      } catch { /* invalid URL */ }
    });
    if (results.length) return results;
  }

  // Auto-filter by category or tag
  const filterCategory = config.category?.toLowerCase().trim();
  const filterTag = config.tag?.toLowerCase().trim();

  for (const post of index.data) {
    if (results.length >= max) break;
    if (filterCategory && !post.category?.toLowerCase().includes(filterCategory)) continue;
    if (filterTag) {
      const tags = typeof post.tags === 'string' ? post.tags.toLowerCase() : '';
      if (!tags.includes(filterTag)) continue;
    }
    results.push(post);
  }

  return results;
}

// ─── Card Building ────────────────────────────────────────────────────────────

function getOptimizedImageUrl(src, width = 752) {
  if (!src) return '';
  return `${src.split('?')[0]}?width=${width}&format=webp&optimize=medium`;
}

function formatDate(timestamp, localeStr) {
  try {
    return new Intl.DateTimeFormat(localeStr || 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date(timestamp * 1000));
  } catch { return ''; }
}

function cleanTitle(title = '') {
  return title.replace(/(\s?)(｜|\|)(\s?Adobe\s?Express\s?)$/g, '').trim();
}

function buildArticleCard(post, metadata, localeStr, isFirst = false) {
  const path = post.path.split('.')[0];
  const title = cleanTitle(post.title);
  const imageUrl = getOptimizedImageUrl(post.image, 752);
  const dateString = formatDate(post.date, localeStr);
  const authorName = post.author || metadata.productName || 'Adobe Express';
  const iconPath = metadata.productIcon || DEFAULT_PRODUCT_ICON_PATH;

  // Outermost element is a link so the whole card is clickable
  const card = createTag('a', {
    class: 'blog-feature-marquee-card',
    href: path,
    tabindex: '-1',
    'aria-hidden': 'true',
  });

  const inner = createTag('div', { class: 'blog-feature-marquee-card-inner' });

  // ── Media
  const mediaArea = createTag('div', { class: 'blog-feature-marquee-card-media' });
  mediaArea.append(createTag('span', { class: 'blog-feature-marquee-featured-badge' }, 'Featured'));

  if (imageUrl) {
    const img = createTag('img', {
      src: imageUrl,
      alt: title,
      loading: isFirst ? 'eager' : 'lazy',
      decoding: 'async',
      width: 752,
    });
    if (isFirst) img.setAttribute('fetchpriority', 'high');
    mediaArea.append(img);
  }

  inner.append(mediaArea);

  // ── Body
  const body = createTag('div', { class: 'blog-feature-marquee-card-body' });
  body.append(createTag('h3', { class: 'blog-feature-marquee-card-title' }, title));

  if (post.teaser) {
    body.append(createTag('p', { class: 'blog-feature-marquee-card-description' }, post.teaser));
  }

  // Author row
  const author = createTag('div', { class: 'blog-feature-marquee-card-author' });
  const iconWrapper = createTag('div', { class: 'blog-feature-marquee-card-author-icon' });
  iconWrapper.append(createTag('img', {
    src: iconPath,
    alt: authorName,
    loading: 'lazy',
    decoding: 'async',
    width: PRODUCT_ICON_SIZE,
    height: PRODUCT_ICON_SIZE,
  }));

  const authorInfo = createTag('div', { class: 'blog-feature-marquee-card-author-info' });
  authorInfo.append(createTag('p', { class: 'blog-feature-marquee-card-author-name' }, authorName));
  if (dateString) {
    authorInfo.append(createTag('p', { class: 'blog-feature-marquee-card-author-date' }, dateString));
  }

  author.append(iconWrapper, authorInfo);
  body.append(author);
  inner.append(body);
  card.append(inner);
  return card;
}

// ─── Content Column ──────────────────────────────────────────────────────────

function decorateContentColumn(column, metadata, contentNodes) {
  column.classList.add('blog-feature-marquee-content');
  column.textContent = '';

  const available = [...contentNodes];
  const take = (predicate) => {
    const idx = available.findIndex(
      (n) => n.nodeType === Node.ELEMENT_NODE && predicate(n),
    );
    if (idx === -1) return null;
    return available.splice(idx, 1)[0];
  };

  // Eyebrow: product icon + name (matching Figma NavLogo pattern)
  const { productName, productIcon } = metadata;
  if (productName || productIcon) {
    const eyebrow = createTag('div', { class: 'blog-feature-marquee-eyebrow' });
    const iconPath = productIcon || DEFAULT_PRODUCT_ICON_PATH;
    if (iconPath) {
      eyebrow.append(createTag('img', {
        src: iconPath,
        alt: productName ? `${productName} logo` : 'Product logo',
        loading: 'lazy',
        decoding: 'async',
        width: 20,
        height: 20,
      }));
    }
    if (productName) {
      eyebrow.append(createTag('span', { class: 'blog-feature-marquee-eyebrow-text' }, productName));
    }
    column.append(eyebrow);
  } else if (metadata.eyebrow) {
    column.append(createTag('p', { class: 'blog-feature-marquee-eyebrow' }, metadata.eyebrow));
  } else {
    const fallback = take((n) => n.tagName === 'P' && !n.querySelector('a'));
    if (fallback) {
      fallback.classList.add('blog-feature-marquee-eyebrow');
      column.append(fallback);
    }
  }

  // Headline
  const headlineText = metadata.headline || metadata.title;
  if (headlineText) {
    column.append(createTag('h2', {}, headlineText));
  } else {
    const fallback = take((n) => /^H[1-6]$/.test(n.tagName));
    if (fallback) column.append(fallback);
  }

  // Subcopy
  if (metadata.subcopy) {
    column.append(createTag('p', { class: 'blog-feature-marquee-subcopy' }, metadata.subcopy));
  } else {
    const fallback = take((n) => n.tagName === 'P' && !n.querySelector('a'));
    if (fallback) {
      fallback.classList.add('blog-feature-marquee-subcopy');
      column.append(fallback);
    }
  }
}

// ─── Block Parsing ────────────────────────────────────────────────────────────

function parseBlock(block) {
  const rows = [...block.children].filter((r) => r.tagName === 'DIV');
  if (!rows.length) return { contentNodes: [], viewAllLink: null, config: {} };

  // Row 0: editorial content
  const editorialRow = rows[0];
  const editorialCols = [...editorialRow.children];
  const col1 = editorialCols[0];
  const col2 = editorialCols[1];

  const contentNodes = col1
    ? [...col1.childNodes].filter((n) => n.nodeType === Node.ELEMENT_NODE)
    : [];

  // View-all link: from col2, or last paragraph in col1 that contains a link
  let viewAllLink = null;
  if (col2) {
    viewAllLink = col2.querySelector('a');
  } else {
    const last = contentNodes[contentNodes.length - 1];
    if (last?.tagName === 'P' && last.querySelector('a')) {
      viewAllLink = last.querySelector('a');
      contentNodes.pop();
    }
  }

  // Remaining rows: key–value config pairs
  const config = {};
  rows.slice(1).forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;
    const key = cols[0].textContent.trim().toLowerCase().replace(/\s+/g, '-');
    const links = [...cols[1].querySelectorAll('a')].map((a) => a.href).filter(Boolean);
    config[key] = links.length > 1 ? links : (links[0] || cols[1].textContent.trim());
  });

  return { contentNodes, viewAllLink, config };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default async function decorate(block) {
  const libs = getLibs();
  ({ createTag, getMetadata, getConfig } = await import(`${libs}/utils/utils.js`));

  block.classList.add('blog-feature-marquee');
  const isStatic = block.classList.contains('no-slider');

  const metadata = getFeatureMarqueeMetadata();

  // Parse block authored content before clearing DOM
  const { contentNodes, viewAllLink, config } = parseBlock(block);

  const max = Math.min(parseInt(config.max, 10) || MAX_ARTICLES, MAX_ARTICLES);
  const localePrefix = getConfig?.()?.locale?.prefix || '';
  const localeStr = getConfig?.()?.locale?.ietf || 'en-US';

  // Fetch articles
  const index = await fetchBlogIndex(localePrefix);
  const posts = filterFeaturedPosts(index, config, max);

  // Rebuild DOM
  block.replaceChildren();

  const inner = createTag('div', { class: 'blog-feature-marquee-inner' });
  const row = createTag('div', { class: 'blog-feature-marquee-row' });

  // Left: editorial content
  const contentCol = createTag('div', { class: 'column' });
  decorateContentColumn(contentCol, metadata, contentNodes);

  // Build view-all node for the control bar
  let viewAllNode = null;
  if (viewAllLink) {
    viewAllLink.classList.add('blog-feature-marquee-view-all-link');
    viewAllNode = viewAllLink;
  }

  // Right: slider
  const sliderCol = createTag('div', { class: 'column blog-feature-marquee-slider-col' });

  if (posts.length > 0) {
    const cards = posts.map((post, i) => buildArticleCard(post, metadata, localeStr, i === 0));
    sliderCol.append(buildLocalCarousel(cards, createTag, { isStatic, viewAllNode }));
  }

  row.append(contentCol, sliderCol);
  inner.append(row);
  block.append(inner);
  block.classList.add('blog-feature-marquee-ready');
}
