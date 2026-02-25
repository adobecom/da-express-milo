import { getLibs } from '../utils.js';
import fetchAllTemplatesMetadata from './all-templates-metadata.js';

async function existsTemplatePage(url, getConfig) {
  const allTemplatesMetadata = await fetchAllTemplatesMetadata(getConfig);
  return allTemplatesMetadata.some((e) => e.url === url);
}
const sanitizeExp = /['"<>?.;{}]/gm;
export function constructTargetPath(topics, tasks, tasksx, getConfig) {
  const sanitizedTopics = topics && !topics.match(sanitizeExp) && topics !== "''" ? `/${topics}` : '';
  const sanitizedTasks = tasks && !tasks.match(sanitizeExp) && tasks !== "''" ? `/${tasks}` : '';
  const sanitizedTasksX = tasksx && !tasksx.match(sanitizeExp) && tasksx !== "''" ? `/${tasksx}` : '';
  const slash = !(sanitizedTasks || sanitizedTasksX) && !sanitizedTopics ? '/' : '';
  const targetPath = `/express/templates${slash}${sanitizedTasks || sanitizedTasksX}${sanitizedTopics}`;
  const { prefix } = getConfig().locale;
  const pathToMatch = `${prefix}${targetPath}`;

  return pathToMatch;
}

export default async function redirectToExistingPage() {
  // TODO: check if the search query points to an existing page. If so, redirect.
  const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const {
    topics,
    tasks,
    tasksx,
    searchId,
    // eslint-disable-next-line max-len
  } = new Proxy(new URLSearchParams(window.location.search), { get: (searchParams, prop) => searchParams.get(prop) });
  const pathToMatch = constructTargetPath(topics, tasks, tasksx, getConfig);
  if (await existsTemplatePage(pathToMatch, getConfig)) {
    window.location.assign(`${window.location.origin}${pathToMatch}${searchId ? `?searchId=${searchId}` : ''}`);
    document.body.style.visibility = 'hidden'; // hide the page until the redirect happens
  }
}
