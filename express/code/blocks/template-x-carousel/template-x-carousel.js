import { getLibs, getMobileOperatingSystem, readBlockConfig } from '../../scripts/utils.js';
import { fetchResults, isValidTemplate } from '../../scripts/template-utils.js';
import renderTemplate from '../template-x/template-rendering.js';
import buildGallery from '../../scripts/widgets/gallery/gallery.js';

let createTag; let getConfig;

async function createTemplates(recipe, customProperties = null) {
  const res = await fetchResults(recipe);
  const templates = await Promise.all(
    res.items
      .filter((item) => isValidTemplate(item))
      .map((item) => renderTemplate(item, undefined, customProperties)),
  );
  templates.forEach((tplt) => tplt.classList.add('template'));
  return templates;
}

/**
 * Creates a templates container configured for search bar functionality
 * Uses custom URL config for desktop/Android, default links for iOS
 */
async function createTemplatesContainer(recipe, el, isPanel = false, queryParams = '') {
  const containerClass = isPanel ? 'templates-container search-bar-gallery' : 'templates-container';
  const templatesContainer = createTag('div', { class: containerClass });

  // Detect iOS - use default template-specific Branch.io links for iOS
  // Use custom URL config for all other platforms (desktop, Android)
  const isIOS = getMobileOperatingSystem() === 'iOS';
  const customProperties = isIOS ? null : {
    customUrlConfig: {
      baseUrl: 'https://adobesparkpost.app.link/8JaoEy0DrSb',
      queryParams: ['source=seo-template', queryParams].filter(Boolean).join('&'),
    },
  };

  const templates = await createTemplates(recipe, customProperties);
  templatesContainer.append(...templates);

  const { control: initialControl } = await buildGallery(
    templates,
    templatesContainer,
  );
  return {
    templatesContainer,
    updateTemplates: async (newRecipe) => {
      const newTemplates = await createTemplates(newRecipe, customProperties);
      templatesContainer.replaceChildren(...newTemplates);
      const { control: newControl } = await buildGallery(
        newTemplates,
        templatesContainer,
      );
      const oldControl = el.querySelector('.gallery-control');
      // hack to reduce cls. TODO: implement updateItems() for gallery
      newControl.style.display = 'flex';
      oldControl.replaceWith(newControl);
    },
    control: initialControl,
  };
}

const extractQueryParams = (row) => {
  if (!row) return '';
  const value = row.textContent.trim();
  row.remove();
  return value;
};

async function renderTemplates(el, recipe, toolbar, isPanel = false, queryParams = '') {
  try {
    const {
      templatesContainer,
      control: galleryControl,
    } = await createTemplatesContainer(recipe, el, isPanel, queryParams);

    const controlsContainer = createTag('div', { class: 'controls-container' });
    controlsContainer.append(galleryControl);
    toolbar.append(controlsContainer);

    el.append(templatesContainer);
  } catch (err) {
    window.lana?.log(`Error in template-x-carousel: ${err}`);
    if (getConfig().env.name === 'prod') {
      el.remove();
    } else {
      el.textContent = 'Error loading templates, please refresh the page or try again later.';
    }
  }
}

async function initPanelVariant(el) {
  const headings = el.querySelectorAll('h1, h2, h3');
  const rows = el.querySelectorAll(':scope > div');
  const recipeRow = rows[1];
  const recipe = recipeRow ? recipeRow.textContent.trim() : '';
  const queryParamsRow = rows[3];

  const toolbar = createTag('div', { class: 'toolbar' });

  if (headings.length) {
    const headersContainer = createTag('div', { class: 'headers-container' });
    headings.forEach((heading) => heading.classList.add('heading'));
    headersContainer.append(...headings);
    el.replaceChildren(headersContainer, toolbar);
  } else {
    el.replaceChildren(toolbar);
  }

  const queryParams = extractQueryParams(queryParamsRow);

  await renderTemplates(el, recipe, toolbar, true, queryParams);
}

async function initDefaultVariant(el) {
  const rows = [...el.children];
  const toolbar = rows[0];
  const recipeRow = rows[1];
  const viewAllRow = rows[2];
  const queryParamsRow = rows[3];

  const heading = toolbar.querySelector('h1,h2,h3');
  const description = toolbar.querySelector('p');

  if (heading || description) {
    const headersContainer = createTag('div', { class: 'headers-container' });
    if (heading) {
      heading.classList.add('heading');
      headersContainer.append(heading);
    }
    if (description) {
      description.classList.add('description');
      headersContainer.append(description);
    }
    el.prepend(headersContainer);
  }

  toolbar.classList.add('toolbar');
  const recipe = recipeRow ? recipeRow.textContent.trim() : '';
  recipeRow?.remove();

  // Handle optional view-all link (last row)
  if (viewAllRow) {
    const viewAllLink = viewAllRow.querySelector('a');
    if (viewAllLink) {
      viewAllLink.classList.add('view-all');
      const chevron = createTag('img', {
        class: 'icon icon-s2-chevron-right',
        src: '/express/code/icons/s2-chevron-right.svg',
        alt: '',
      });
      viewAllLink.append(chevron);
      el.append(viewAllLink);
    }
    viewAllRow.remove();
  }

  const queryParams = extractQueryParams(queryParamsRow);

  await renderTemplates(el, recipe, toolbar, false, queryParams);
}

export default async function init(el) {
  ({ createTag, getConfig } = await import(`${getLibs()}/utils/utils.js`));

  const section = el.closest('.section');
  const sectionMetadata = section?.querySelector(':scope > .section-metadata');
  const meta = sectionMetadata ? readBlockConfig(sectionMetadata) : {};
  const isPanel = meta.style?.toLowerCase().includes('panel');

  if (isPanel) {
    await initPanelVariant(el);
  } else {
    await initDefaultVariant(el);
  }
}
