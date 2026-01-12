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

async function fetchBlogIndex(locales) {
  const jointData = [];
  const urls = locales.map((l) => `${l}/express/learn/blog/query-index.json`);

  const resp = await Promise.all(urls.map((url) => fetch(url)
    .then((res) => res.ok && res.json())))
    .then((res) => res);
  resp.filter(Boolean).forEach((item) => jointData.push(...(item.data || [])));

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
  const paths = urls.map((url) => new URL(url).pathname.split('.')[0]);
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
    /* filter posts by tag and author */
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
    const limit = Number(config['page-size']) || 12;
    let numMatched = 0;
    // sort by date desc so we pick newest first
    const sorted = [...index.data].sort((a, b) => (Number(b.date) || 0) - (Number(a.date) || 0));
    /* filter and ignore if already in result */
    const feed = sorted.filter((post) => {
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

// Given a block element, construct a config object from all the links that children of the block.
function getBlogPostsConfig(block) {
  let config = {};

  const rows = [...block.children];
  const firstRow = [...rows[0].children];

  if (rows.length === 1 && firstRow.length === 1) {
    /* handle links */
    const links = [...block.querySelectorAll('a')].map((a) => a.href);
    config = {
      featured: links,
      featuredOnly: true,
    };
  } else {
    config = readBlockConfig(block);
  }
  return config;
}

async function filterAllBlogPostsOnPage() {
  if (!blogResultsLoaded) {
    let resolve;
    blogResultsLoaded = new Promise((r) => {
      resolve = r;
    });
    const results = [];
    const blocks = [...document.querySelectorAll('.blog-posts')];

    if (!blogIndex) {
      const locales = [getConfig().locale.prefix];
      const allBlogLinks = document.querySelectorAll('.blog-posts a');
      allBlogLinks.forEach((l) => {
        const blogLocale = getLocale(getConfig().locales, new URL(l).pathname).prefix;
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

// Given a post, get all the required parameters from it to construct a card or hero card
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

// For configs with a single featuredd post, get a hero sized card
async function getHeroCard(post, dateFormatter) {
  const readMoreString = await getReadMoreString();
  const {
    path, title, teaser, dateString, filteredTitle, imagePath,
  } = getCardParameters(post, dateFormatter);
  const heroPicture = createOptimizedPicture(`./media_${imagePath}?format=webply&optimize=medium&width=750`, title, false);
  const card = createTag('a', {
    class: 'blog-hero-card',
    href: path,
  });
  const pictureTag = heroPicture.outerHTML;
  card.innerHTML = `<div class="blog-card-image">
    ${pictureTag}
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
// For configs with more than one post, get regular cards
function getCard(post, dateFormatter) {
  const {
    path, title, teaser, dateString, filteredTitle, imagePath,
  } = getCardParameters(post, dateFormatter);
  const cardPicture = createOptimizedPicture(`./media_${imagePath}?format=webply&optimize=medium&width=750`, title, false, [{ width: '750' }]);
  const card = createTag('a', {
    class: 'blog-card',
    href: path,
  });
  const pictureTag = cardPicture.outerHTML;
  card.innerHTML = `<div class="blog-card-image">
        ${pictureTag}
        </div>
        <h3 class="blog-card-title">${filteredTitle}</h3>
        <p class="blog-card-teaser">${teaser}</p>
        <p class="blog-card-date">${dateString}</p>`;
  return card;
}
// Cached language and dateFormatter since creating a Dateformatter is an expensive operation
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

// Given a blog post element and a config, append all posts defined in the config to blogPosts
async function decorateBlogPosts(blogPostsElements, config, offset = 0) {
  const posts = await getFilteredResults(config);
  // If a blog config has only one featured item, then build the item as a hero card.
  const isHero = config.featured && config.featured.length === 1;

  const limit = Number(config['page-size']) || 12;

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

  if (isHero) {
    const card = await getHeroCard(posts[0], dateFormatter);
    blogPostsElements.prepend(card);
    images.push(card.querySelector('img'));
    count = 1;
  } else {
    for (let i = offset; i < posts.length && count < limit; i += 1) {
      const post = posts[i];
      const card = getCard(post, dateFormatter);
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
}

function checkStructure(element, querySelectors) {
  let matched = false;
  querySelectors.forEach((querySelector) => {
    if (element.querySelector(`:scope > ${querySelector}`)) matched = true;
  });
  return matched;
}

export default async function decorate(block) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`)]).then(([utils, placeholders]) => {
    ({ getConfig, createTag, getLocale } = utils);
    ({ replaceKey } = placeholders);
  });
  addTempWrapperDeprecated(block, 'blog-posts');
  const config = getBlogPostsConfig(block);

  // wrap p in parent section
  if (checkStructure(block.parentNode, ['h2 + p + p + div.blog-posts', 'h2 + p + div.blog-posts', 'h2 + div.blog-posts'])) {
    const wrapper = createTag('div', { class: 'blog-posts-decoration' });
    block.parentNode.insertBefore(wrapper, block);
    const allP = block.parentNode.querySelectorAll(':scope > p');
    allP.forEach((p) => {
      wrapper.appendChild(p);
    });
  }

  await decorateBlogPosts(block, config);
}
