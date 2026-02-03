import { getLibs, addTempWrapperDeprecated } from '../../scripts/utils.js';
let createTag; let getConfig;
const promptTokenRegex = /(?:\{\{|%7B%7B)?prompt(?:-|\+|%20|\s)text(?:\}\}|%7D%7D)?/;
const CARD_SIZES = '(min-width: 1280px) 380px, (min-width: 768px) 292px, 262px';

function isNearViewport(el, marginFactor = 1.25) {
  if (!el || !el.isConnected || !el.getBoundingClientRect) return false;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  return rect.top < vh * marginFactor;
}

function normalizePicture(picture) {
  if (!picture) return;
  picture.querySelectorAll('source, img').forEach((node) => {
    const attr = node.tagName === 'SOURCE' ? 'srcset' : 'src';
    const url = node.getAttribute(attr);
    if (!url) return;
    if (node.tagName === 'IMG' && (!node.width || !node.height)) {
      const width = node.getAttribute('width');
      const height = node.getAttribute('height');
      if (width && height) {
        node.width = width;
        node.height = height;
      }
    }
  });
}

function buildSrcsetFromUrl(urlString, widths, formatOverride) {
  const out = [];
  try {
    const u = new URL(urlString, window.location.href);
    if (!u.searchParams.has('width')) return '';
    if (formatOverride) u.searchParams.set('format', formatOverride);
    widths.forEach((w) => {
      u.searchParams.set('width', w);
      out.push(`${u.toString()} ${w}w`);
    });
  } catch (e) {
    return '';
  }
  return out.join(', ');
}

function updateResponsiveSrcset(img) {
  if (!img || !img.src) return;
  try {
    const url = new URL(img.src, window.location.href);
    if (!url.searchParams.has('width')) return;
    const widths = [240, 360, 480, 750, 1200];
    const srcset = widths.map((w) => {
      url.searchParams.set('width', w);
      return `${url.toString()} ${w}w`;
    }).join(', ');
    img.srcset = srcset;
  } catch (e) {
    // Ignore malformed URLs
  }
}

function updateResponsivePicture(picture) {
  if (!picture) return;
  const sources = picture.querySelectorAll('source');
  sources.forEach((source) => {
    const raw = source.getAttribute('srcset');
    if (!raw || raw.includes(',')) return;
    const url = raw.trim().split(/\s+/)[0];
    let max = 0;
    try {
      const u = new URL(url, window.location.href);
      max = Number(u.searchParams.get('width')) || 0;
    } catch (e) {
      return;
    }
    const widths = max >= 1500 ? [600, 900, 1200, 1600, max]
      : max >= 700 ? [240, 360, 480, max]
        : [240, 360, max];
    const srcset = buildSrcsetFromUrl(url, widths);
    if (srcset) source.setAttribute('srcset', srcset);
  });
  const img = picture.querySelector('img');
  if (img && !img.sizes) img.sizes = CARD_SIZES;
}

function preloadCardImage(img) {
  if (!img) return;
  const url = img.currentSrc || img.src;
  if (!url) return;
  if (document.querySelector(`link[rel="preload"][as="image"][href="${url}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  if (img.srcset) link.setAttribute('imagesrcset', img.srcset);
  if (img.sizes) link.setAttribute('imagesizes', img.sizes);
  document.head.append(link);
}

function setCardImagePriority(img, { isLcp = false } = {}) {
  if (!img) return;
  if (!img.sizes) img.sizes = CARD_SIZES;
  if (isLcp && isNearViewport(img)) {
    img.loading = 'eager';
    img.fetchPriority = 'high';
    preloadCardImage(img);
    return;
  }
  img.loading = 'lazy';
  img.decoding = 'async';
  img.fetchPriority = 'low';
}

function addBetaTag(card, title, betaPlaceholder) {
  const betaTag = createTag('span', { class: 'beta-tag' });
  betaTag.textContent = betaPlaceholder;
  title.append(betaTag);
  card.classList.add('has-beta-tag');
}

export function decorateTextWithTag(textSource, options = {}) {
  const {
    baseT,
    tagT,
    baseClass,
    tagClass,
  } = options;

  const text = createTag(baseT || 'p', { class: baseClass || '' });
  const tagText = textSource?.match(/\[(.*?)]/);

  if (tagText) {
    const [fullText, tagTextContent] = tagText;
    const $tag = createTag(tagT || 'span', { class: tagClass || 'tag' });
    text.textContent = textSource.replace(fullText, '').trim();
    text.dataset.text = text.textContent.toLowerCase();
    $tag.textContent = tagTextContent;
    text.append($tag);
  } else {
    text.textContent = textSource;
    text.dataset.text = text.textContent.toLowerCase();
  }
  return text;
}

export function decorateHeading(block, payload) {
  const headingSection = createTag('div', { class: 'gen-ai-cards-heading-section' });
  const headingTextWrapper = createTag('div', { class: 'text-wrapper' });
  const heading = createTag('h2', { class: 'gen-ai-cards-heading' });

  heading.textContent = payload.heading;
  headingSection.append(headingTextWrapper);
  headingTextWrapper.append(heading);

  if (payload.subHeadings.length > 0) {
    payload.subHeadings.forEach((p) => {
      headingTextWrapper.append(p);
    });
  }
  if (payload.legalLink.href) {
    const legalButton = createTag('a', {
      class: 'gen-ai-cards-link',
      href: payload.legalLink.href,
    });
    legalButton.textContent = payload.legalLink.text;
    headingSection.append(legalButton);
    headingSection.classList.add('has-legal-link');
  }

  block.append(headingSection);
}

export const windowHelper = {
  redirect: (url) => {
    window.location.assign(url);
  },
};

function handleGenAISubmit(form, link) {
  const input = form.querySelector('input');
  if (input.value.trim() === '') return;
  const genAILink = link.replace(promptTokenRegex, encodeURI(input.value).replaceAll(' ', '+'));
  if (genAILink) windowHelper.redirect(genAILink);
}

function buildGenAIForm({ title, ctaLinks, subtext }) {
  const genAIForm = createTag('form', { class: 'gen-ai-input-form' });
  const genAIInput = createTag('input', {
    'aria-label': `${subtext || ''}`,
    placeholder: subtext || '',
    type: 'text',
    enterKeyhint: 'enter',
  });
  const genAISubmit = createTag('button', {
    class: 'gen-ai-submit',
    type: 'submit',
    disabled: true,

  });

  genAISubmit.setAttribute('aria-label', `${title}`);

  genAIForm.append(genAIInput, genAISubmit);

  genAISubmit.textContent = ctaLinks[0].textContent;
  genAISubmit.disabled = genAIInput.value === '';

  genAIInput.addEventListener('input', () => {
    genAISubmit.disabled = genAIInput.value.trim() === '';
  });

  genAIInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGenAISubmit(genAIForm, ctaLinks[0].href);
    }
  });

  genAIForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleGenAISubmit(genAIForm, ctaLinks[0].href);
  });

  return genAIForm;
}

function removeLazyAfterNeighborLoaded() {
  // Previously removed `loading` on downstream images; keep a noop to avoid eager cascades.
}

async function decorateCards(block, { actions }) {
  const isHomepage = block.classList.contains('homepage');
  const cards = createTag('div', { class: 'gen-ai-cards-cards' });
  let searchBranchLinks;
  let betaTagPlaceholder;

  await import(`${getLibs()}/features/placeholders.js`).then(async (mod) => {
    searchBranchLinks = await mod.replaceKey('search-branch-links', getConfig());
    searchBranchLinks = searchBranchLinks === 'search branch links' ? '' : searchBranchLinks.replace(/\s/g, '')?.split(',');
    betaTagPlaceholder = await mod.replaceKey('beta-tag', getConfig());
    betaTagPlaceholder = betaTagPlaceholder === 'beta tag' ? 'BETA' : betaTagPlaceholder;
    return mod.replaceKey();
  });

  actions.forEach((cta, i) => {
    const {
      image,
      ctaLinks,
      text,
      title,
      betaTag,
    } = cta;
    const card = createTag('div', { class: 'card' });
    const linksWrapper = createTag('div', { class: 'links-wrapper' });
    const mediaWrapper = createTag('div', { class: 'media-wrapper' });
    const textWrapper = createTag('div', { class: 'text-wrapper' });
    const cardContentWrapper = createTag('div', { class: 'content-wrapper' });
    cardContentWrapper.append(textWrapper, linksWrapper);

    card.append(mediaWrapper, cardContentWrapper);
    if (image) {
      mediaWrapper.append(image);
      const imgEl = image.querySelector('img');
      const isLcp = i === 0 && isHomepage;
    normalizePicture(image);
    updateResponsivePicture(image);
    updateResponsiveSrcset(imgEl);
      setCardImagePriority(imgEl, { isLcp });
      if (i > 0) {
        const lastImage = actions[i - 1].image?.querySelector('img');
        removeLazyAfterNeighborLoaded(image, lastImage);
      }
    }

    const hasGenAIForm = promptTokenRegex.test(ctaLinks?.[0]?.href);

    if (ctaLinks.length > 0) {
      if (hasGenAIForm) {
        const genAIForm = buildGenAIForm(cta);
        card.classList.add('gen-ai-action');
        cardContentWrapper.append(genAIForm);
        linksWrapper.remove();
      } else {
        const a = ctaLinks[0];
        const btnUrl = new URL(a.href);
        if (searchBranchLinks.includes(`${btnUrl.origin}${btnUrl.pathname}`)) {
          btnUrl.searchParams.set('q', cta.text);
          btnUrl.searchParams.set('category', 'templates');
          a.href = decodeURIComponent(btnUrl.toString());
        }
        a.classList.add('con-button');
        a.removeAttribute('title');
        linksWrapper.append(a);
      }
    }

    const titleText = decorateTextWithTag(title, { tagT: 'sup', baseClass: 'cta-card-title', baseT: 'h3' });

    if (betaTag) {
      addBetaTag(card, titleText, betaTagPlaceholder);
    }

    textWrapper.append(titleText);
    const desc = createTag('p', { class: 'cta-card-desc' });
    desc.textContent = text;
    textWrapper.append(desc);

    cards.append(card);
  });

  block.append(cards);
}

function constructPayload(block) {
  const rows = Array.from(block.children);
  block.innerHTML = '';
  const headingDiv = rows.shift();

  const payload = {
    heading: headingDiv.querySelector('h2, h3, h4, h5, h6')?.textContent?.trim(),
    subHeadings: headingDiv.querySelectorAll('p:not(.button-container, :has(a.con-button, a[href*="legal"]))'),
    legalLink: {
      text: headingDiv.querySelector('a[href*="legal"]')?.textContent?.trim(),
      href: headingDiv.querySelector('a[href*="legal"]')?.href,
    },
    actions: [],
  };

  rows.forEach((row) => {
    const ctaObj = {
      image: row.querySelector(':scope > div:nth-of-type(1) picture'),
      videoLink: row.querySelector(':scope > div:nth-of-type(1) a'),
      title: row.querySelector(':scope > div:nth-of-type(2) p:nth-of-type(2):not(.button-container) strong')?.textContent.trim(),
      text: row.querySelector(':scope > div:nth-of-type(2) p:not(.button-container):not(:has(strong)):not(:has(em)):not(:empty)')?.textContent.trim(),
      subtext: row.querySelector(':scope > div:nth-of-type(2) p:not(.button-container) em')?.textContent.trim(),
      ctaLinks: row.querySelectorAll(':scope > div:nth-of-type(2) a'),
      betaTag: row.innerHTML.includes('#_beta'),
    };

    payload.actions.push(ctaObj);
  });

  return payload;
}

export default async function decorate(block) {
  ({ createTag, getConfig } = await import(`${getLibs()}/utils/utils.js`));
  addTempWrapperDeprecated(block, 'gen-ai-cards');
  const links = block.querySelectorAll(':scope a[href*="adobesparkpost"]');

  if (links) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: links });
    document.dispatchEvent(linksPopulated);
  }

  if (block.classList.contains('homepage')) {
    const parent = block.closest('.gen-ai-cards-wrapper');
    if (parent) {
      parent.classList.add('homepage');
    }
  }

  const payload = constructPayload(block);
  decorateHeading(block, payload);
  await decorateCards(block, payload);
  const cardsContainer = block.querySelector('.gen-ai-cards-cards');
  const cardCount = cardsContainer?.children.length || 0;

  if (block.classList.contains('homepage')) {
    if (cardCount > 1 && cardsContainer) {
      const initCarousel = async () => {
        const { default: buildCarousel } = await import('../../scripts/widgets/carousel.js');
        return buildCarousel('', cardsContainer);
      };
      const launch = () => {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(initCarousel, { timeout: 1200 });
        } else {
          setTimeout(initCarousel, 0);
        }
      };
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          const visible = entries.some((entry) => entry.isIntersecting);
          if (visible) {
            io.disconnect();
            launch();
          }
        }, { rootMargin: '200px' });
        io.observe(cardsContainer);
      } else {
        launch();
      }
    }
  } else if (cardCount > 1 && cardsContainer) {
    const { default: buildCompactNavCarousel } = await import('../../scripts/widgets/compact-nav-carousel.js');
    await buildCompactNavCarousel('.card', cardsContainer, {});
  }
}
