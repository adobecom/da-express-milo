/* eslint-disable import/named, import/extensions */
import {
  getLibs,
  readBlockConfig,
} from '../../scripts/utils.js';
import { createOptimizedPicture } from '../../scripts/utils/media.js';

let replaceKey;
let getConfig;
let createTag;
let getLocale;

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

function getBlogArticleColumnsConfig(block) {
  let config = {};

  const rows = [...block.children];
  const firstRow = [...rows[0].children];

  if (rows.length === 1 && firstRow.length === 1) {
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
    readMoreString = readMore[locale] || 'Read More';
  }
  return readMoreString;
}

function getCardParameters(post, dateFormatter) {
  const path = post.path.split('.')[0];
  const { title, teaser, image, category } = post;
  const publicationDate = new Date(post.date * 1000);
  const dateString = dateFormatter.format(publicationDate);
  const filteredTitle = title.replace(/(\s?)(｜|\|)(\s?Adobe\sExpress\s?)$/g, '');
  const imagePath = image.split('?')[0].split('_')[1];
  return {
    path, title, teaser, dateString, filteredTitle, imagePath, category,
  };
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

async function createArticleColumn(post, formatter) {
  const readMoreString = await getReadMoreString();
  const {
    path, title, teaser, dateString, filteredTitle, imagePath, category,
  } = getCardParameters(post, formatter);

  const picture = createOptimizedPicture(
    `./media_${imagePath}?format=webply&optimize=medium&width=750`,
    title,
    false,
    [{ width: '750' }],
  );

  const article = createTag('a', {
    class: 'blog-article-column',
    href: path,
  });

  const contentSection = createTag('div', { class: 'blog-article-column-content' });
  contentSection.innerHTML = `
    ${category ? `<p class="blog-article-column-category">${category}</p>` : ''}
    <h3 class="blog-article-column-title">${filteredTitle}</h3>
    <p class="blog-article-column-teaser">${teaser}</p>
    <p class="blog-article-column-date">${dateString}</p>
    <p class="blog-article-column-cta button-container">
      <span class="button accent">${readMoreString}</span>
    </p>
  `;

  const imageSection = createTag('div', { class: 'blog-article-column-image' });
  imageSection.appendChild(picture);

  article.appendChild(contentSection);
  article.appendChild(imageSection);

  return article;
}

export default async function decorate(block) {
  await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
  ]).then(([utils, placeholders]) => {
    ({ getConfig, createTag, getLocale } = utils);
    ({ replaceKey } = placeholders);
  });

  const config = getBlogArticleColumnsConfig(block);

  // Determine locales for fetching blog index
  const locales = [getConfig().locale.prefix];
  const allBlogLinks = block.querySelectorAll('a');
  allBlogLinks.forEach((l) => {
    const blogLocale = getLocale(getConfig().locales, new URL(l).pathname).prefix;
    if (!locales.includes(blogLocale)) {
      locales.push(blogLocale);
    }
  });

  const blogIndex = await fetchBlogIndex(locales);

  // Get featured posts
  let posts = [];
  if (config.featured) {
    if (!Array.isArray(config.featured)) config.featured = [config.featured];
    posts = getFeatured(blogIndex, config.featured);
  }

  // Clear block content and build new structure
  block.innerHTML = '';
  block.classList.add('blog-article-columns');

  const newLanguage = getConfig().locale.ietf;
  if (!dateFormatter || newLanguage !== language) {
    getDateFormatter(newLanguage);
  }

  const articlesContainer = createTag('div', { class: 'blog-article-columns-container' });

  for (const post of posts) {
    const articleColumn = await createArticleColumn(post, dateFormatter);
    articlesContainer.appendChild(articleColumn);
  }

  block.appendChild(articlesContainer);
}
