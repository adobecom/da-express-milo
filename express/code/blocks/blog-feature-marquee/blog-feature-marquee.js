import { getLibs } from '../../scripts/utils.js';

let createTag;
let getMetadata;
let getConfig;

const MAX_ARTICLES = 6;
const AUTOPLAY_INTERVAL_MS = 3500;
const DEFAULT_PRODUCT_ICON_PATH = 'https://main--da-express-milo--adobecom.aem.page/express/learn/blog/assets/media_1f021705c13704e1e3041b414d0aa1ce883e067ec.png';
const PRODUCT_ICON_SIZE = 48;

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

// ─── Slider ───────────────────────────────────────────────────────────────────

function buildSlider(cards, isStatic) {
  const slider = createTag('div', { class: 'blog-feature-marquee-slider' });
  const viewport = createTag('div', { class: 'blog-feature-marquee-slider-viewport' });
  const track = createTag('div', { class: 'blog-feature-marquee-slider-track' });

  cards.forEach((card) => track.append(card));
  viewport.append(track);
  slider.append(viewport);

  // Static / single-card: no controls needed
  if (isStatic || cards.length <= 1) {
    const first = cards[0];
    if (first) {
      first.removeAttribute('tabindex');
      first.removeAttribute('aria-hidden');
    }
    return slider;
  }

  // ── Dot indicators + prev/next buttons
  const controls = createTag('div', { class: 'blog-feature-marquee-slider-controls' });

  const prevBtn = createTag('button', {
    class: 'blog-feature-marquee-slider-btn blog-feature-marquee-slider-prev',
    'aria-label': 'Previous article',
    type: 'button',
  });
  const nextBtn = createTag('button', {
    class: 'blog-feature-marquee-slider-btn blog-feature-marquee-slider-next',
    'aria-label': 'Next article',
    type: 'button',
  });

  const dotsWrapper = createTag('div', {
    class: 'blog-feature-marquee-slider-dots',
    role: 'tablist',
    'aria-label': 'Featured articles',
  });

  const dots = cards.map((_, i) => {
    const dot = createTag('button', {
      class: `blog-feature-marquee-slider-dot${i === 0 ? ' active' : ''}`,
      role: 'tab',
      type: 'button',
      'aria-label': `Article ${i + 1} of ${cards.length}`,
      'aria-selected': i === 0 ? 'true' : 'false',
    });
    dotsWrapper.append(dot);
    return dot;
  });

  controls.append(prevBtn, dotsWrapper, nextBtn);
  slider.append(controls);

  // ── State machine
  let currentIndex = 0;
  let autoplayTimer = null;

  const goToSlide = (rawIndex) => {
    currentIndex = ((rawIndex % cards.length) + cards.length) % cards.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    cards.forEach((card, i) => {
      const active = i === currentIndex;
      card.setAttribute('aria-hidden', active ? 'false' : 'true');
      card.setAttribute('tabindex', active ? '0' : '-1');
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
      dot.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
    });
  };

  const startAutoplay = () => {
    if (autoplayTimer) return;
    autoplayTimer = setInterval(() => goToSlide(currentIndex + 1), AUTOPLAY_INTERVAL_MS);
  };

  const stopAutoplay = () => {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  };

  // Pause on hover
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);

  // Touch swipe
  let touchStartX = 0;
  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    stopAutoplay();
  }, { passive: true });
  viewport.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goToSlide(currentIndex + (diff > 0 ? 1 : -1));
    startAutoplay();
  }, { passive: true });

  // Arrow keyboard navigation
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goToSlide(currentIndex - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goToSlide(currentIndex + 1); }
  });

  // Button and dot clicks
  prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => { stopAutoplay(); goToSlide(i); startAutoplay(); }));

  // Start autoplay only when visible
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) startAutoplay();
      else stopAutoplay();
    });
  }, { threshold: 0.3 });
  io.observe(slider);

  goToSlide(0);
  return slider;
}

// ─── Content Column ──────────────────────────────────────────────────────────

function decorateContentColumn(column, metadata, contentNodes, viewAllLink) {
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

  // Eyebrow: product icon + name from page metadata (falls back to authored paragraph)
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
  } else {
    const fallback = take((n) => n.tagName === 'P' && !n.querySelector('a'));
    if (fallback) {
      fallback.classList.add('blog-feature-marquee-eyebrow');
      column.append(fallback);
    }
  }

  // Headline
  const headline = take((n) => /^H[1-6]$/.test(n.tagName));
  if (headline) column.append(headline);

  // Subcopy
  const subcopy = take((n) => n.tagName === 'P' && !n.querySelector('a'));
  if (subcopy) {
    subcopy.classList.add('blog-feature-marquee-subcopy');
    column.append(subcopy);
  }

  // "View all" CTA
  if (viewAllLink) {
    const wrapper = createTag('div', { class: 'blog-feature-marquee-view-all' });
    viewAllLink.classList.add('blog-feature-marquee-view-all-link');
    wrapper.append(viewAllLink);
    column.append(wrapper);
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

  // Page-level metadata (relevant when block is on an article page)
  const sanitize = (v) => (typeof v === 'string' ? v.trim() : '');
  const metadata = {
    productName: sanitize(getMetadata('author')),
    productIcon: sanitize(getMetadata('blog-marquee-icon')),
  };

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
  decorateContentColumn(contentCol, metadata, contentNodes, viewAllLink);

  // Right: slider
  const sliderCol = createTag('div', { class: 'column blog-feature-marquee-slider-col' });

  if (posts.length > 0) {
    const cards = posts.map((post, i) => buildArticleCard(post, metadata, localeStr, i === 0));
    sliderCol.append(buildSlider(cards, isStatic));
  }

  row.append(contentCol, sliderCol);
  inner.append(row);
  block.append(inner);
  block.classList.add('blog-feature-marquee-ready');
}
