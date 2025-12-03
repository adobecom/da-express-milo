import { getLibs, getMobileOperatingSystem, getIconElementDeprecated } from '../../scripts/utils.js';
import { fetchResults, isValidTemplate } from '../../scripts/template-utils.js';
import renderTemplate from '../template-x/template-rendering.js';
import buildGallery from '../../scripts/widgets/gallery/gallery.js';

let createTag; let getConfig;
let replaceKey;

const fromScratchFallbackLink = 'https://adobesparkpost.app.link/c4bWARQhWAb';

async function createFromScratch() {
  const [fromScratchText, searchBranchLinks] = await Promise.all([
    replaceKey('start-from-scratch', getConfig()),
    replaceKey('search-branch-links', getConfig()),
  ]);
  const fromScratchHref = searchBranchLinks.split(',')[0]?.trim() || fromScratchFallbackLink;
  const fromScratchBorder = createTag('div', { class: 'from-scratch-border' });
  const fromScratchContainer = createTag('a', {
    class: 'from-scratch-container',
    rel: 'nofollow',
    target: '_self',
    href: fromScratchHref,
  }, fromScratchBorder);
  const svg = getIconElementDeprecated('start-from-scratch');
  const text = createTag('div', { class: 'from-scratch-text' }, fromScratchText);
  fromScratchBorder.append(svg, text);
  return fromScratchContainer;
}

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
async function createTemplatesContainer(recipe, el, includeFromScratch = false) {
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

  // Conditionally create from-scratch element
  const promises = [createTemplates(recipe, customProperties)];
  if (includeFromScratch) {
    promises.unshift(createFromScratch());
  }

  const results = await Promise.all(promises);
  const scratch = includeFromScratch ? results[0] : null;
  const templates = includeFromScratch ? results[1] : results[0];

  // Append elements conditionally
  const galleryItems = scratch ? [scratch, ...templates] : templates;
  templatesContainer.append(...galleryItems);

  const { control: initialControl } = await buildGallery(
    galleryItems,
    templatesContainer,
  );
  return {
    templatesContainer,
    updateTemplates: async (newRecipe) => {
      const newTemplates = await createTemplates(newRecipe, customProperties);
      const newGalleryItems = scratch ? [scratch, ...newTemplates] : newTemplates;
      templatesContainer.replaceChildren(...newGalleryItems);
      const { control: newControl } = await buildGallery(
        newGalleryItems,
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

async function renderTemplates(el, recipe, toolbar, includeFromScratch = false) {
  try {
    const {
      templatesContainer,
      control: galleryControl,
    } = await createTemplatesContainer(recipe, el, includeFromScratch);

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

async function initHomeVariant(el, includeFromScratch) {
  const headings = el.querySelectorAll('h1, h2, h3');
  const rows = el.querySelectorAll(':scope > div');
  const recipeRow = rows[rows.length - 1];
  const recipe = recipeRow.textContent.trim();

  const toolbar = createTag('div', { class: 'toolbar' });

  if (headings.length) {
    const headersContainer = createTag('div', { class: 'headers-container' });
    headersContainer.append(...headings);
    el.replaceChildren(headersContainer, toolbar);
  } else {
    el.replaceChildren(toolbar);
  }

  await renderTemplates(el, recipe, toolbar, includeFromScratch);
}

async function initDefaultVariant(el, includeFromScratch) {
  const [toolbar, recipeRow] = el.children;

  const heading = toolbar.querySelector('h1,h2,h3');
  if (heading) {
    heading.classList.add('heading');
    el.prepend(heading);
  }
  toolbar.classList.add('toolbar');
  const recipe = recipeRow.textContent.trim();
  recipeRow.remove();

  await renderTemplates(el, recipe, toolbar, includeFromScratch);
}

export default async function init(el) {
  [{ createTag, getConfig }, { replaceKey }] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
  ]);

  const includeFromScratch = el.classList.contains('scratch');

  if (el.classList.contains('home')) {
    await initHomeVariant(el, includeFromScratch);
  } else {
    await initDefaultVariant(el, includeFromScratch);
  }
}
