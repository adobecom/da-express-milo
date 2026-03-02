import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import buildLocalCarousel from './blog-feature-carousel.js';

let createTag;
let getMetadata;
let getConfig;

const MAX_ARTICLES = 6;
const DEFAULT_PRODUCT_ICON_PATH = 'https://main--da-express-milo--adobecom.aem.page/express/learn/blog/assets/media_1f021705c13704e1e3041b414d0aa1ce883e067ec.png';
const PRODUCT_ICON_SIZE = 48;
const DEFAULT_AUTOPLAY_INTERVAL = 6;

const METADATA_KEYS = {
  eyebrow: 'category',
  headline: 'headline',
  subcopy: 'sub-heading',
  title: 'og:title',
  productName: 'author',
  productIcon: 'blog-marquee-icon',
  date: 'publication-date',
  autoplayDuration: 'blog-feature-marquee-autoplay-duration',
  slider: 'blog-feature-marquee-slider',
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

function buildCardMedia(imageUrl, title, isFirst) {
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

  return mediaArea;
}

function buildCardAuthor(authorName, iconPath, dateString) {
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
  return author;
}

function buildCardBody(title, teaser, authorName, iconPath, dateString) {
  const body = createTag('div', { class: 'blog-feature-marquee-card-body' });
  body.append(createTag('h3', { class: 'blog-feature-marquee-card-title' }, title));

  if (teaser) {
    body.append(createTag('p', { class: 'blog-feature-marquee-card-description' }, teaser));
  }

  body.append(buildCardAuthor(authorName, iconPath, dateString));
  return body;
}

function buildArticleCard(post, metadata, localeStr, isFirst = false) {
  const path = post.path.split('.')[0];
  const title = cleanTitle(post.title);
  const imageUrl = getOptimizedImageUrl(post.image, 752);
  const dateString = formatDate(post.date, localeStr);
  const authorName = post.author || metadata.productName || 'Adobe Express';
  const iconPath = metadata.productIcon || DEFAULT_PRODUCT_ICON_PATH;

  const card = createTag('a', {
    class: 'blog-feature-marquee-card',
    href: path,
    tabindex: '-1',
    'aria-hidden': 'true',
  });

  const inner = createTag('div', {
    class: 'blog-feature-marquee-card-inner',
    tabindex: '-1',
    role: 'button',
    'aria-label': title,
  });

  inner.append(
    buildCardMedia(imageUrl, title, isFirst),
    buildCardBody(title, post.teaser, authorName, iconPath, dateString),
  );
  card.append(inner);
  return card;
}

function buildEyebrowRow() {
  const injectLogo = ['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase());
  if (!injectLogo) return null;
  const logo = getIconElementDeprecated('adobe-express-white');
  logo.classList.add('express-logo');
  const row = createTag('div', { class: 'blog-feature-marquee-eyebrow-row' });
  row.append(logo);
  return row;
}

function buildHeadline(metadata, available) {
  const headlineText = metadata.headline || metadata.title;
  if (headlineText) return createTag('h2', {}, headlineText);
  const idx = available.findIndex((n) => n.nodeType === Node.ELEMENT_NODE && /^H[1-6]$/.test(n.tagName));
  return idx !== -1 ? available.splice(idx, 1)[0] : null;
}

function buildSubcopy(metadata, available) {
  if (metadata.subcopy) {
    return createTag('p', { class: 'blog-feature-marquee-subcopy' }, metadata.subcopy);
  }
  const idx = available.findIndex(
    (n) => n.nodeType === Node.ELEMENT_NODE && n.tagName === 'P' && !n.querySelector('a'),
  );
  if (idx === -1) return null;
  const fallback = available.splice(idx, 1)[0];
  fallback.classList.add('blog-feature-marquee-subcopy');
  return fallback;
}

function buildContentColumn(metadata, contentNodes) {
  const column = createTag('div', { class: 'column blog-feature-marquee-content' });
  const available = contentNodes.filter((n) => n.nodeType === Node.ELEMENT_NODE);

  const eyebrowRow = buildEyebrowRow(metadata, available);
  const headline = buildHeadline(metadata, available);
  const subcopy = buildSubcopy(metadata, available);

  if (eyebrowRow) column.append(eyebrowRow);
  if (headline) column.append(headline);
  if (subcopy) column.append(subcopy);

  return column;
}

// ─── Slider Column ────────────────────────────────────────────────────────────

function buildViewAllNode(viewAllLink) {
  if (!viewAllLink) return null;
  viewAllLink.classList.add('blog-feature-marquee-view-all-link');
  return viewAllLink;
}

function buildSliderColumn(posts, metadata, localeStr, { isStatic, viewAllLink, autoplayInterval }) { // eslint-disable-line max-len
  const column = createTag('div', { class: 'column blog-feature-marquee-slider-col' });
  if (!posts.length) return column;

  const cards = posts.map((post, i) => buildArticleCard(post, metadata, localeStr, i === 0));
  const viewAllNode = buildViewAllNode(viewAllLink);
  column.append(buildLocalCarousel(cards, createTag, { isStatic, viewAllNode, autoplayInterval }));

  return column;
}

// ─── Block Parsing ────────────────────────────────────────────────────────────

function isBlogArticleUrl(href) {
  if (!href || typeof href !== 'string') return false;
  try {
    const path = new URL(href, 'https://example.com').pathname;
    const match = path.match(/\/learn\/blog\/([^/]+)$/);
    return !!match && !!match[1];
  } catch {
    return false;
  }
}

function parseBlock(block) {
  const rows = [...block.children].filter((r) => r.tagName === 'DIV');
  if (!rows.length) {
    return {
      contentNodes: [], viewAllLink: null, featuredArticleLink: null, config: {},
    };
  }

  const editorialRow = rows[0];
  const col1 = [...editorialRow.children][0];
  const contentNodes = col1
    ? [...col1.childNodes].filter((n) => n.nodeType === Node.ELEMENT_NODE)
    : [];

  let featuredArticleLink = null;
  const linksInFirstRow = [...editorialRow.querySelectorAll('a')].filter((a) => a.href);
  const articleLink = linksInFirstRow.find((a) => isBlogArticleUrl(a.href));
  if (articleLink) {
    featuredArticleLink = articleLink.href;
    const parentP = articleLink.closest('p');
    if (parentP && contentNodes.includes(parentP)) {
      contentNodes.splice(contentNodes.indexOf(parentP), 1);
    }
  }

  const viewAllLink = rows[1]?.querySelector('a') ?? null;

  const config = {};
  rows.slice(2).forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;
    const key = cols[0].textContent.trim().toLowerCase().replace(/\s+/g, '-');
    const links = [...cols[1].querySelectorAll('a')].map((a) => a.href).filter(Boolean);
    config[key] = links.length > 1 ? links : (links[0] || cols[1].textContent.trim());
  });

  return {
    contentNodes, viewAllLink, featuredArticleLink, config,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default async function decorate(block) {
  const libs = getLibs();
  ({ createTag, getMetadata, getConfig } = await import(`${libs}/utils/utils.js`));

  block.classList.add('blog-feature-marquee');

  const metadata = getFeatureMarqueeMetadata();
  const { contentNodes, viewAllLink, featuredArticleLink, config } = parseBlock(block);

  const isStatic = block.classList.contains('no-slider')
    || ['off', 'no', 'false'].includes(metadata.slider?.toLowerCase());
  const autoplayInterval = parseInt(metadata.autoplayDuration, 10) * 1000;

  const max = Math.min(parseInt(config.max, 10) || MAX_ARTICLES, MAX_ARTICLES);
  const localePrefix = getConfig?.()?.locale?.prefix || '';
  const localeStr = getConfig?.()?.locale?.ietf || 'en-US';

  const effectiveConfig = featuredArticleLink
    ? { ...config, featured: [featuredArticleLink] }
    : config;

  const index = await fetchBlogIndex(localePrefix);
  const posts = filterFeaturedPosts(index, effectiveConfig, featuredArticleLink ? 1 : max);

  if (featuredArticleLink && posts.length === 1) block.classList.add('blog-feature-marquee-single');

  block.replaceChildren();

  const contentCol = buildContentColumn(metadata, contentNodes);
  // eslint-disable-next-line max-len
  const sliderCol = buildSliderColumn(posts, metadata, localeStr, { isStatic, viewAllLink, autoplayInterval });

  const row = createTag('div', { class: 'blog-feature-marquee-row' });
  row.append(contentCol, sliderCol);

  const inner = createTag('div', { class: 'blog-feature-marquee-inner' });
  inner.append(row);
  block.append(inner);
  block.classList.add('blog-feature-marquee-ready');
}
