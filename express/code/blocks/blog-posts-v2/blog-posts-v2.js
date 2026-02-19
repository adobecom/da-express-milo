/* eslint-disable import/named, import/extensions */
import {
  getLibs,
  readBlockConfig,
  addTempWrapperDeprecated,
} from '../../scripts/utils.js';
import { createOptimizedPicture } from '../../scripts/utils/media.js';

let replaceKey; let getConfig;
let createTag; let getLocale;

const blogPosts = [];
let blogResults;
let blogResultsLoaded;
let blogIndex;

export function resetBlogCache() {
  blogResults = null;
  blogResultsLoaded = null;
  blogIndex = null;
  blogPosts.length = 0;
}

async function fetchBlogIndex(locales) {
  const jointData = [];
  const urls = locales.map((l) => `${l}/express/learn/blog/query-index.json`);

  const resp = await Promise.all(urls.map((url) => fetch(url)
    .then((res) => res.ok && res.json())))
    .then((res) => res);
  resp.forEach((item) => jointData.push(...item.data));

  const byPath = {};
  jointData.forEach((post) => {
    if (post.tags) {
      const tags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags;
      tags.push(post.category);
      post.tags = JSON.stringify(tags);
    }

    byPath[post.path.split('.')[0]] = post;
  });

  return {
    data: jointData,
    byPath,
  };
}

function getFeatured(index, urls) {
  const paths = urls.map((url) => {
    try {
      return new URL(url).pathname.split('.')[0];
    } catch {
      return url.split('.')[0];
    }
  });
  const results = [];
  paths.forEach((path) => {
    const post = index.byPath[path];
    if (post) {
      results.push(post);
    }
  });

  return results;
}

function isDuplicate(path) {
  return blogPosts.includes(path);
}

function filterBlogPosts(config, index) {
  const result = [];

  if (config.featured) {
    if (!Array.isArray(config.featured)) config.featured = [config.featured];
    const featured = getFeatured(index, config.featured);
    result.push(...featured);
    featured.forEach((post) => {
      if (!isDuplicate(post.path)) blogPosts.push(post.path);
    });
  }

  if (!config.featuredOnly) {
    const f = {};
    for (const name of Object.keys(config)) {
      const filterNames = ['tags', 'author', 'category'];
      if (filterNames.includes(name)) {
        const vals = config[name];
        let v = vals;
        if (!Array.isArray(vals)) {
          v = [vals];
        }
        f[name] = v.map((e) => e.toLowerCase().trim());
      }
    }
    const limit = config['page-size'] || 12;
    let numMatched = 0;
    const feed = index.data.filter((post) => {
      let matchedAll = true;
      for (const name of Object.keys(f)) {
        let matched = false;
        f[name].forEach((val) => {
          if (post[name] && post[name].toLowerCase().includes(val)) {
            matched = true;
          }
        });
        if (!matched) {
          matchedAll = false;
          break;
        }
      }
      if (matchedAll && numMatched < limit) {
        if (!isDuplicate(post.path)) {
          blogPosts.push(post.path);
        } else {
          matchedAll = false;
        }
      }
      if (matchedAll) numMatched += 1;
      return (matchedAll);
    });

    result.push(...feed);
  }

  return result;
}

function getSafeHrefFromText(text) {
  const trimmed = text && text.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed, window.location.href);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch (e) {
    window.lana.log('Invalid URL', e);
    return null;
  }
  return null;
}

function normalizeConfigUrls(config) {
  const normalized = { ...config };
  if (normalized.featured) {
    if (Array.isArray(normalized.featured)) {
      normalized.featured = normalized.featured.map((url) => {
        try {
          return new URL(url).pathname;
        } catch {
          return url;
        }
      });
    } else {
      try {
        normalized.featured = new URL(normalized.featured).pathname;
      } catch {
        // Keep as is if not a valid URL
      }
    }
  }
  return normalized;
}

function getBlogPostsConfig(block) {
  let config = {};

  const rows = [...block.children];
  const firstRow = [...rows[0].children];

  if (block.classList.contains('spreadsheet-powered')) {
    [...block.querySelectorAll('a')].forEach((a) => {
      const safeHref = getSafeHrefFromText(a.innerText);
      if (safeHref) {
        a.href = safeHref;
      } else {
        a.removeAttribute('href');
      }
    });
  }

  if (rows.length === 1 && firstRow.length === 1) {
    const links = [...block.querySelectorAll('a')].map((a) => {
      try {
        return new URL(a.href).pathname;
      } catch {
        return a.href;
      }
    });
    config = {
      featured: links,
      featuredOnly: true,
    };
  } else {
    config = readBlockConfig(block);
    config = normalizeConfigUrls(config);
  }

  return config;
}

function extractHeadingContent(block) {
  const hasIncludeHeading = block.classList.contains('include-heading');
  if (!hasIncludeHeading) return null;

  const rows = [...block.children];
  if (rows.length === 0) return null;

  const firstRow = rows[0];
  const cells = [...firstRow.children];
  const headingContent = {
    headingElement: null,
    viewAllParagraph: null,
  };
  if (cells[0]) {
    const heading = cells[0].querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      headingContent.headingElement = heading.cloneNode(true);
    }
    const paragraphs = cells[0].querySelectorAll('p');
    paragraphs.forEach((p) => {
      const link = p.querySelector('a');
      if (link && !headingContent.viewAllParagraph) {
        headingContent.viewAllParagraph = p.cloneNode(true);
      }
    });
  }
  if (!headingContent.viewAllParagraph && cells[1]) {
    const link = cells[1].querySelector('a');
    if (link) {
      const p = cells[1].querySelector('p');
      if (p && p.contains(link)) {
        headingContent.viewAllParagraph = p.cloneNode(true);
      } else {
        const newP = document.createElement('p');
        newP.appendChild(link.cloneNode(true));
        headingContent.viewAllParagraph = newP;
      }
    }
  }
  firstRow.remove();

  return headingContent;
}

async function filterAllBlogPostsOnPage() {
  if (!blogResultsLoaded) {
    let resolve;
    blogResultsLoaded = new Promise((r) => {
      resolve = r;
    });
    const results = [];
    const blocks = [...document.querySelectorAll('.blog-posts-v2')];

    if (!blogIndex) {
      const locales = [getConfig().locale.prefix];
      const allBlogLinks = document.querySelectorAll('.blog-posts-v2 a');
      allBlogLinks.forEach((l) => {
        const pathname = l.pathname || new URL(l.href).pathname;
        const blogLocale = getLocale(getConfig().locales, pathname).prefix;
        if (!locales.includes(blogLocale)) {
          locales.push(blogLocale);
        }
      });

      blogIndex = await fetchBlogIndex(locales);
    }

    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      const config = getBlogPostsConfig(block);
      const posts = filterBlogPosts(config, blogIndex);
      results.push({ config, posts });
    }
    blogResults = results;
    resolve();
  } else {
    await blogResultsLoaded;
  }
  return (blogResults);
}

async function getFilteredResults(config) {
  const results = await filterAllBlogPostsOnPage();
  const configStr = JSON.stringify(config);
  let matchingResult = {};
  results.forEach((res) => {
    if (JSON.stringify(res.config) === configStr) {
      matchingResult = res.posts;
    }
  });
  return (matchingResult);
}

// Translates the Read More string into the local language
async function getReadMoreString() {
  let readMoreString = await replaceKey('read-more', getConfig());
  if (readMoreString === 'read more') {
    const locale = getConfig().locale.region;
    const readMore = {
      us: 'Read More',
      uk: 'Read More',
      jp: 'もっと見る',
      fr: 'En savoir plus',
      de: 'Mehr dazu',
    };
    readMoreString = readMore[locale] || '&nbsp;&nbsp;&nbsp;&rightarrow;&nbsp;&nbsp;&nbsp;';
  }
  return readMoreString;
}

function getCardParameters(post, dateFormatter) {
  const path = post.path.split('.')[0];
  const { title, teaser, image } = post;
  const publicationDate = new Date(post.date * 1000);
  const dateString = dateFormatter.format(publicationDate);
  const filteredTitle = title.replace(/(\s?)(｜|\|)(\s?Adobe\sExpress\s?)$/g, '');
  const imagePath = image.split('?')[0].split('_')[1];
  return {
    path, title, teaser, dateString, filteredTitle, imagePath,
  };
}

async function getHeroCard(post, dateFormatter, blogTag) {
  const readMoreString = await getReadMoreString();
  const {
    path, title, teaser, dateString, filteredTitle, imagePath,
  } = getCardParameters(post, dateFormatter);
  const heroPicture = createOptimizedPicture(`./media_${imagePath}?format=webply&optimize=medium&width=750`, title, false);

  const card = createTag('a', {
    class: 'blog-hero-card',
    href: path,
  });

  // Create image wrapper and tag
  const imageWrapper = createTag('div', { class: 'image-wrapper' });
  imageWrapper.appendChild(heroPicture);

  const pictureTag = imageWrapper.outerHTML;
  card.innerHTML = `<div class="blog-card-image">
    ${pictureTag}
    <span class="blog-tag">${blogTag}</span>
    </div>
    <div class="blog-hero-card-body">
      <h3 class="blog-card-title">${filteredTitle}</h3>
      <p class="blog-card-teaser">${teaser}</p>
      <p class="blog-card-date">${dateString}</p>
      <p class="blog-card-cta button-container">
        <a href="${path}" title="${readMoreString}" class="button accent">${readMoreString}</a></p>
    </div>`;
  return card;
}

function getCard(post, dateFormatter, blogTag) {
  const {
    path, title, teaser, dateString, filteredTitle, imagePath,
  } = getCardParameters(post, dateFormatter);
  const cardPicture = createOptimizedPicture(`./media_${imagePath}?format=webply&optimize=medium&width=750`, title, false, [{ width: '750' }]);
  const card = createTag('a', {
    class: 'blog-card',
    href: path,
  });

  // Create image wrapper and tag
  const imageWrapper = createTag('div', { class: 'image-wrapper' });
  imageWrapper.appendChild(cardPicture);

  const pictureTag = imageWrapper.outerHTML;
  card.innerHTML = `<div class="blog-card-image">
        ${pictureTag}
        <span class="blog-tag">${blogTag}</span>
        </div>
        <section class="blog-card-body">
        <h3 class="blog-card-title">${filteredTitle}</h3>
        <p class="blog-card-teaser">${teaser}</p>
        <p class="blog-card-date">${dateString}</p>
        </section>`;
  return card;
}

let language;
let dateFormatter;

function getDateFormatter(newLanguage) {
  language = newLanguage;
  dateFormatter = Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function addRightChevronToViewAll(blockElement) {
  const link = blockElement.parentElement.parentElement.querySelector('.content a');
  if (!link) return;

  const rightChevronSVGHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M5.46967 2.86029C5.76256 2.5674 6.23744 2.5674 6.53033 2.86029L11.0303 7.3603C11.3232 7.65319 11.3232 8.12806 11.0303 8.42095L6.53033 
      12.921C6.23744 13.2138 5.76256 13.2138 5.46967 12.921C5.17678 12.6281 5.17678 12.1532 5.46967 11.8603L9.43934 7.89062L5.46967 3.92096C5.17678 3.62806 5.17678 3.15319 5.46967 2.86029Z" fill="#292929"/>
    </svg>`;

  link.innerHTML = `${link.innerHTML} ${rightChevronSVGHTML}`;
}

function getBlogTag(block) {
  const activeSection = block.closest('.section.content-toggle-active');
  if (activeSection?.dataset.toggle?.trim()) {
    return activeSection.dataset.toggle.trim();
  }
  return 'Social Media';
}

function updateBlogTags(block, tagValue) {
  const blogTags = block.querySelectorAll('.blog-tag');
  blogTags.forEach((tag) => {
    tag.textContent = tagValue;
  });
}

function observeContentToggleChanges(block) {
  const section = block.closest('.section[data-toggle]');
  if (!section) return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (section.classList.contains('content-toggle-active')) {
          const tagValue = section.dataset.toggle || 'Social Media';
          updateBlogTags(block, tagValue);
        }
      }
    });
  });

  observer.observe(section, { attributes: true, attributeFilter: ['class'] });
}

async function decorateBlogPosts(blogPostsElements, config, offset = 0) {
  const posts = await getFilteredResults(config);
  const isHero = config.featured && config.featured.length === 1;

  const limit = config['page-size'] || 12;

  let cards = blogPostsElements.querySelector('.blog-cards');
  if (!cards) {
    blogPostsElements.innerHTML = '';
    cards = createTag('div', { class: 'blog-cards' });
    blogPostsElements.appendChild(cards);
  }

  const pageEnd = offset + limit;
  let count = 0;
  const images = [];

  const newLanguage = getConfig().locale.ietf;
  if (!dateFormatter || newLanguage !== language) {
    getDateFormatter(newLanguage);
  }

  const blogTag = getBlogTag(blogPostsElements);

  if (isHero) {
    const card = await getHeroCard(posts[0], dateFormatter, blogTag);
    blogPostsElements.prepend(card);
    images.push(card.querySelector('img'));
    count = 1;
  } else {
    for (let i = offset; i < posts.length && count < limit; i += 1) {
      const post = posts[i];
      const card = getCard(post, dateFormatter, blogTag);
      cards.append(card);
      images.push(card.querySelector('img'));
      count += 1;
    }
  }

  if (posts.length > pageEnd && config['load-more']) {
    const loadMore = createTag('a', { class: 'load-more button secondary', href: '#' });
    loadMore.innerHTML = config['load-more'];
    blogPostsElements.append(loadMore);
    loadMore.addEventListener('click', (event) => {
      event.preventDefault();
      loadMore.remove();
      decorateBlogPosts(blogPostsElements, config, pageEnd);
    });
  }

  return posts.length > 0;
}

function checkStructure(element, querySelectors) {
  let matched = false;
  querySelectors.forEach((querySelector) => {
    if (element.querySelector(`:scope > ${querySelector}`)) matched = true;
  });
  return matched;
}

export default async function decorate(block) {
  block.parentElement.classList.add('ax-blog-posts-container');
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`)]).then(([utils, placeholders]) => {
    ({ getConfig, createTag, getLocale } = utils);
    ({ replaceKey } = placeholders);
  });

  const headingContent = extractHeadingContent(block);
  const viewAllLink = block?.parentElement?.querySelector('.content a');

  if (viewAllLink) {
    const linkText = viewAllLink.textContent;
    const placeholderMatch = linkText.match(/\(\((.*?)\)\)/);

    if (placeholderMatch) {
      const placeholderKey = placeholderMatch[1];
      const translation = await replaceKey(placeholderKey, getConfig());

      if (translation) {
        viewAllLink.textContent = `${translation.charAt(0).toUpperCase()}${translation.slice(1)}`;
      }
    } else if (linkText.toLowerCase().includes('view')) {
      // Plain text like "view all" - translate it
      const viewAll = await replaceKey('view all', getConfig());

      if (viewAll) {
        viewAllLink.textContent = `${viewAll.charAt(0).toUpperCase()}${viewAll.slice(1)}`;
      }
    }
  }

  addTempWrapperDeprecated(block, 'blog-posts');
  const config = getBlogPostsConfig(block);

  if (checkStructure(block.parentNode, ['h2 + p + p + div.blog-posts', 'h2 + p + div.blog-posts', 'h2 + div.blog-posts'])) {
    const wrapper = createTag('div', { class: 'blog-posts-decoration' });
    block.parentNode.insertBefore(wrapper, block);
    const allP = block.parentNode.querySelectorAll(':scope > p');
    allP.forEach((p) => {
      wrapper.appendChild(p);
    });
  }

  addRightChevronToViewAll(block);

  const hasPosts = await decorateBlogPosts(block, config);

  if (headingContent) {
    if (!hasPosts) {
      const section = block.closest('.section');
      if (section) {
        section.style.display = 'none';
      }
    } else {
      const headerWrapper = createTag('div', { class: 'blog-posts-header' });

      if (headingContent.headingElement) {
        headerWrapper.appendChild(headingContent.headingElement);
      }

      if (headingContent.viewAllParagraph) {
        const link = headingContent.viewAllParagraph.querySelector('a');
        if (link) {
          const rightChevronSVGHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.46967 2.86029C5.76256 2.5674 6.23744 2.5674 6.53033 2.86029L11.0303 7.3603C11.3232 7.65319 11.3232 8.12806 11.0303 8.42095L6.53033 
            12.921C6.23744 13.2138 5.76256 13.2138 5.46967 12.921C5.17678 12.6281 5.17678 12.1532 5.46967 11.8603L9.43934 7.89062L5.46967 3.92096C5.17678 3.62806 5.17678 3.15319 5.46967 2.86029Z" fill="#292929"/>
          </svg>`;
          link.innerHTML = `${link.innerHTML} ${rightChevronSVGHTML}`;
        }
        headerWrapper.appendChild(headingContent.viewAllParagraph);
      }

      block.prepend(headerWrapper);
    }
  }

  observeContentToggleChanges(block);
}
