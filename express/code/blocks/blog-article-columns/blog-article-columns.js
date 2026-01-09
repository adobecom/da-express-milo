/* eslint-disable import/named, import/extensions */
import {
  getLibs,
  readBlockConfig,
} from '../../scripts/utils.js';

let replaceKey;
let getConfig;
let createTag;
let getLocale;
let getIconElementDeprecated;

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

  const rows = block.children;
  const firstRow = rows[0];
  const firstRowChildren = firstRow ? [...firstRow.children] : [];

  if (rows.length === 1 && firstRowChildren.length === 1) {
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
  const { title, teaser, image, category, author } = post;
  const publicationDate = new Date(post.date * 1000);
  const dateString = dateFormatter.format(publicationDate);
  const filteredTitle = title.replace(/(\s?)(｜|\|)(\s?Adobe\sExpress\s?)$/g, '');
  const imagePath = image.split('?')[0].split('_')[1];
  return {
    path, title, teaser, dateString, filteredTitle, imagePath, category, author,
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
    path,
    title,
    teaser,
    dateString,
    filteredTitle,
    category,
    author,
  } = getCardParameters(post, formatter);

  const imgSrc = post.image;
  const picture = createTag('img', {
    src: imgSrc,
    alt: title,
    loading: 'lazy',
  });

  const article = createTag('div', {
    class: 'blog-article-column',
  });

  const contentSection = createTag('div', { class: 'blog-article-column-content' });
  if (category) {
    const categoryEl = createTag('p', { class: 'blog-article-column-category' });
    categoryEl.textContent = category;
    contentSection.appendChild(categoryEl);
  }

  const titleEl = createTag('h2', { class: 'blog-article-column-title' });
  titleEl.textContent = filteredTitle;
  contentSection.appendChild(titleEl);

  const teaserEl = createTag('p', { class: 'blog-article-column-teaser' });
  teaserEl.textContent = teaser;
  contentSection.appendChild(teaserEl);

  const metaEl = createTag('div', { class: 'blog-article-column-meta' });
  const avatarPlaceholderEl = createTag('span', { class: 'blog-article-column-avatar', 'aria-hidden': 'true' });
  const metaText = createTag('div', { class: 'blog-article-column-meta-text' });
  if (author) {
    const authorEl = createTag('span', { class: 'blog-article-column-author' });
    authorEl.textContent = author;
    metaText.appendChild(authorEl);
  }
  const dateEl = createTag('span', { class: 'blog-article-column-date' });
  dateEl.textContent = dateString;
  metaText.appendChild(dateEl);
  metaEl.appendChild(avatarPlaceholderEl);
  metaEl.appendChild(metaText);
  contentSection.appendChild(metaEl);

  const ctaWrapper = createTag('p', { class: 'blog-card-cta button-container' });
  const ctaLink = createTag('a', {
    href: path,
    title: readMoreString,
    class: 'button accent',
  });
  ctaLink.textContent = readMoreString;
  ctaWrapper.appendChild(ctaLink);
  contentSection.appendChild(ctaWrapper);

  const imageSection = createTag('div', { class: 'blog-article-column-image' });
  imageSection.appendChild(picture);

  article.appendChild(contentSection);
  article.appendChild(imageSection);

  const avatarPlaceholder = contentSection.querySelector('.blog-article-column-avatar');
  if (avatarPlaceholder) {
    let avatarIcon = getIconElementDeprecated ? getIconElementDeprecated('adobe-red-logo') : null;
    if (!avatarIcon) {
      avatarIcon = createTag('img', {
        class: 'blog-article-column-avatar',
        src: '/express/code/icons/adobe-red-logo.svg',
        alt: 'Adobe Express',
        width: '48',
        height: '48',
        loading: 'lazy',
      });
    } else {
      avatarIcon.classList.add('blog-article-column-avatar');
      if (avatarIcon.tagName === 'IMG' && !avatarIcon.getAttribute('loading')) {
        avatarIcon.setAttribute('loading', 'lazy');
      }
    }
    avatarPlaceholder.replaceWith(avatarIcon);
  }

  return article;
}

export default async function decorate(block) {
  await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
  ]).then(([utils, placeholders]) => {
    ({
      getConfig, createTag, getLocale, getIconElementDeprecated,
    } = utils);
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

  // Clear block content and build new structure, preserving existing classes (e.g., left-image)
  const existingClasses = [...block.classList];
  const hadLeftImage = existingClasses.includes('left-image');
  block.innerHTML = '';
  block.className = '';
  existingClasses.forEach((cls) => block.classList.add(cls));
  block.classList.add('blog-article-columns');
  if (hadLeftImage) {
    block.classList.add('left-image');
  }

  const newLanguage = getConfig().locale.ietf;
  if (!dateFormatter || newLanguage !== language) {
    getDateFormatter(newLanguage);
  }

  const articlesContainer = createTag('div', { class: 'blog-article-columns-container' });
  const articleColumns = await Promise.all(
    posts.map((post) => createArticleColumn(post, dateFormatter)),
  );
  articlesContainer.append(...articleColumns);
  block.appendChild(articlesContainer);
}
