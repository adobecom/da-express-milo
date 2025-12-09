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
async function createTemplatesContainer(recipe, el) {
  const templatesContainer = createTag('div', { class: 'templates-container search-bar-gallery' });

  // Detect iOS - use default template-specific Branch.io links for iOS
  // Use custom URL config for all other platforms (desktop, Android)
  const isIOS = getMobileOperatingSystem() === 'iOS';
  const customProperties = isIOS ? null : {
    customUrlConfig: {
      baseUrl: 'https://adobesparkpost.app.link/8JaoEy0DrSb',
      queryParams: 'source=seo-template',
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

async function renderTemplates(el, recipe, toolbar) {
  try {
    const {
      templatesContainer,
      control: galleryControl,
    } = await createTemplatesContainer(recipe, el);

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
  const recipeRow = rows[rows.length - 1];
  const recipe = recipeRow.textContent.trim();

  const toolbar = createTag('div', { class: 'toolbar' });

  if (headings.length) {
    const headersContainer = createTag('div', { class: 'headers-container' });
    headings.forEach((heading) => heading.classList.add('heading'));
    headersContainer.append(...headings);
    el.replaceChildren(headersContainer, toolbar);
  } else {
    el.replaceChildren(toolbar);
  }

  await renderTemplates(el, recipe, toolbar);
}

async function initDefaultVariant(el) {
  const [toolbar, recipeRow] = el.children;

  const heading = toolbar.querySelector('h1,h2,h3');
  if (heading) {
    heading.classList.add('heading');
    el.prepend(heading);
  }
  toolbar.classList.add('toolbar');
  const recipe = recipeRow.textContent.trim();
  recipeRow.remove();

  await renderTemplates(el, recipe, toolbar);
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
