import { getLibs, getMobileOperatingSystem, getIconElementDeprecated } from '../../scripts/utils.js';
import { fetchResults, isValidTemplate } from '../../scripts/template-utils.js';
import renderTemplate from '../template-x/template-rendering.js';
import buildLoopGallery from '../../scripts/widgets/gallery/gallery-loop.js';

let createTag; let getConfig;
let replaceKey;

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

async function createTemplatesContainer(recipe, queryParams = '') {
  const templatesContainer = createTag('div', { class: 'templates-container' });

  const isIOS = getMobileOperatingSystem() === 'iOS';
  const { locale: { ietf, region } } = getConfig();
  const localeParams = `locale=${ietf}&contentRegion=${region === 'uk' ? 'gb' : region}`;
  const customProperties = isIOS ? null : {
    customUrlConfig: {
      baseUrl: 'https://adobesparkpost.app.link/8JaoEy0DrSb',
      queryParams: ['source=seo-template', queryParams, localeParams].filter(Boolean).join('&'),
    },
  };

  const templates = await createTemplates(recipe, customProperties);

  // Append the arrow icon to each CTA before the gallery clones the items,
  // so clones carry it too (matches template-x-carousel v2).
  templates.forEach((tplt) => {
    tplt.querySelectorAll('.button-container > a.button').forEach((cta) => {
      cta.append(getIconElementDeprecated('arrow-up-right'));
    });
  });

  const [prev, next, group, position] = await Promise.all([
    replaceKey('previous-template', getConfig()),
    replaceKey('next-template', getConfig()),
    replaceKey('template-carousel-label', getConfig()),
    replaceKey('template-carousel-position', getConfig()),
  ]);
  const { control } = await buildLoopGallery(templates, templatesContainer, {
    labels: {
      prev: prev || 'Previous template',
      next: next || 'Next template',
      group: group || 'Template carousel',
      // Localizable "X of N" — placeholder authors interpolate {{current}}/{{total}}.
      position: position?.includes('{{current}}') ? position : '{{current}} of {{total}}',
    },
  });
  return { templatesContainer, control };
}

const extractQueryParams = (row) => {
  if (!row) return '';
  const value = row.textContent.trim();
  row.remove();
  return value;
};

async function renderTemplates(el, recipe, toolbar, queryParams = '') {
  try {
    const { templatesContainer, control } = await createTemplatesContainer(recipe, queryParams);
    const controlsContainer = createTag('div', { class: 'controls-container' });
    controlsContainer.append(control);
    toolbar.append(controlsContainer);
    // Place the carousel before the toolbar in the DOM so tab order matches the
    // visual order (cards first, then the nav buttons that sit below them).
    el.insertBefore(templatesContainer, toolbar);
  } catch (error) {
    window.lana?.log(`Error in template-x-carousel-loop: ${error?.message || error?.detail || error}`, { tags: 'template-x-carousel-loop', severity: 'error' });
    if (getConfig().env.name === 'prod') {
      el.remove();
    } else {
      el.textContent = 'Error loading templates, please refresh the page or try again later.';
    }
  }
}

export default async function init(el) {
  ([{ createTag, getConfig }, { replaceKey }] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
  ]));

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

  await renderTemplates(el, recipe, toolbar, queryParams);
}
