import {
  getLibs,
} from '../../scripts/utils.js';
import fetchAllTemplatesMetadata from '../../scripts/utils/all-templates-metadata.js';
import { titleCase } from '../../scripts/utils/string.js';

let createTag; let getMetadata;
let getConfig; let replaceKeyArray;
let expressPlaceholder; let templatesPlaceholder;
let xTaskCategoriesPlaceholder; let taskCategoriesPlaceholder;
let replaceKey;

function sanitize(str) {
  return str?.replaceAll(/[$@%'"]/g, '');
}

function translateTask(taskCategories, tasks) {
  return Object.entries(taskCategories)
    // eslint-disable-next-line no-unused-vars
    .find(([_, t]) => t === tasks || t === tasks.replace(/-/g, ' '))
    ?.[0]?.toLowerCase() ?? tasks;
}

function getCrumbsForSearch(templatesUrl, allTemplatesMetadata) {
  const { search, origin } = window.location;
  const { tasksx, q } = new Proxy(new URLSearchParams(search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const tasks = sanitize(tasksx);
  const crumbs = [];
  // won't have meaningful short-title with no tasks and no q
  if (!tasks && !sanitize(q)) {
    return crumbs;
  }
  const shortTitle = getMetadata('short-title');
  if (!shortTitle?.trim()) {
    return crumbs;
  }

  const lastCrumb = createTag('li');
  lastCrumb.textContent = shortTitle;
  crumbs.push(lastCrumb);
  if (!tasks) {
    return crumbs;
  }

  const taskUrl = `${templatesUrl}${tasks}`;
  const foundTaskPage = allTemplatesMetadata
    .some((t) => t.url === taskUrl.replace(origin, ''));

  if (foundTaskPage) {
    const taskCrumb = createTag('li');
    const taskAnchor = createTag('a', { href: taskUrl });
    taskCrumb.append(taskAnchor);
    const translatedTasks = translateTask(JSON.parse(xTaskCategoriesPlaceholder), tasks);
    taskAnchor.textContent = titleCase(translatedTasks);
    crumbs.unshift(taskCrumb);
  }

  return crumbs;
}

async function getCrumbsForSEOPage(templatesUrl, allTemplatesMetadata, segments) {
  const { origin } = window.location;
  // we might have an inconsistent trailing slash problem
  let builtUrl = templatesUrl.replace('templates/', 'templates');
  const crumbs = [];

  segments
    .slice(0, segments.length - 1)
    .forEach(async (currSeg) => {
      const seg = sanitize(currSeg);
      if (!seg) return;
      builtUrl = `${builtUrl}/${seg}`;
      // at least translate tasks seg
      let translatedSeg = seg;
      if (seg === getMetadata('tasks-x')) {
        translatedSeg = translateTask(JSON.parse(xTaskCategoriesPlaceholder), seg);
      } else if (seg === getMetadata('tasks')) {
        // try old v2 mapping
        translatedSeg = translateTask(JSON.parse(taskCategoriesPlaceholder), seg);
      } else if (await replaceKey(seg, getConfig()) !== seg) {
        // try placeholder sheet
        translatedSeg = await replaceKey(seg, getConfig());
      }
      const segmentCrumb = createTag('li');
      if (allTemplatesMetadata.some((t) => t.url === builtUrl.replace(origin, ''))) {
        const segmentLink = createTag('a', { href: builtUrl });
        segmentLink.textContent = titleCase(translatedSeg);
        segmentCrumb.append(segmentLink);
      } else {
        segmentCrumb.textContent = titleCase(translatedSeg);
      }
      crumbs.push(segmentCrumb);
    });
  const shortTitle = getMetadata('short-title');
  if (!shortTitle?.trim()) {
    return crumbs;
  }
  const lastCrumb = createTag('li');
  lastCrumb.textContent = shortTitle;
  crumbs.push(lastCrumb);
  return crumbs;
}

async function renderBreadcrumbs(children, breadcrumbs, templatesUrl) {
  if (!children || children === '/') {
    return;
  }
  const allTemplatesMetadata = await fetchAllTemplatesMetadata(getConfig);
  const isSearchPage = children.startsWith('/search?') || getMetadata('template-search-page') === 'Y';
  const crumbs = isSearchPage
    ? getCrumbsForSearch(templatesUrl, allTemplatesMetadata)
    : await getCrumbsForSEOPage(templatesUrl, allTemplatesMetadata, children.split('/'));

  crumbs.forEach((c) => {
    breadcrumbs.append(c);
  });
}

// returns null if no breadcrumbs
// returns breadcrumbs as an li element
export default async function getBreadcrumbs() {
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`)]).then(([utils, placeholders]) => {
    ({ createTag, getMetadata, getConfig } = utils);
    ({ replaceKey, replaceKeyArray } = placeholders);
  });
  ([expressPlaceholder, templatesPlaceholder, xTaskCategoriesPlaceholder, taskCategoriesPlaceholder] = await replaceKeyArray(['express', 'templates', 'x-task-categories', 'task-categories'], getConfig()));

  if (!document.querySelector('.search-marquee')) {
    return null;
  }
  const { origin, pathname } = window.location;
  const regex = /(.*?\/express\/)templates(.*)/;
  const matches = pathname.match(regex);
  if (!matches) {
    return null;
  }
  const [, homePath, children] = matches;
  const breadcrumbs = createTag('ol', { class: 'templates-breadcrumbs' });

  const homeCrumb = createTag('li');
  const homeUrl = `${origin}${homePath}`;
  const homeAnchor = createTag('a', { href: homeUrl });
  homeAnchor.textContent = titleCase(expressPlaceholder || '') || 'Home';
  homeCrumb.append(homeAnchor);
  breadcrumbs.append(homeCrumb);

  const templatesCrumb = createTag('li');
  const templatesUrl = `${homeUrl}templates/`;
  const templatesAnchor = createTag('a', { href: templatesUrl });
  templatesAnchor.textContent = titleCase(templatesPlaceholder || '') || 'Templates';
  templatesCrumb.append(templatesAnchor);
  breadcrumbs.append(templatesCrumb);

  const nav = createTag('nav', { 'aria-label': 'Breadcrumb' });
  nav.append(breadcrumbs);
  await renderBreadcrumbs(children, breadcrumbs, templatesUrl);
  return nav;
}
