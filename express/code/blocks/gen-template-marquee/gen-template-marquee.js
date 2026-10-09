import { getIconElementDeprecated, getLibs, getMetadata } from '../../scripts/utils.js';
import {
  extractComponentLinkHref,
  extractRenditionLinkHref,
  fetchResults,
  getImageThumbnailSrc,
  isValidTemplate,
} from '../../scripts/template-utils.js';

const DESKTOP_QUERY = '(min-width: 1200px)';
const TEMPLATE_DISPLAY_LIMIT = 14;
const TEMPLATE_FETCH_LIMIT = 23;
const COLUMN_CARD_COUNTS = [3, 3, 2, 3, 3];
const PLACEHOLDERS = {
  label: ['gen-template-prompt-label', 'Prompt'],
  input: ['gen-template-prompt-placeholder', 'Describe what template you want to make'],
  submit: ['gen-template-prompt-submit', 'Generate'],
  desktopHref: ['gen-template-desktop-destination', 'https://new.express.adobe.com/neural-pixel-editor?entry=create-menu'],
  mobileHref: ['gen-template-mobile-destination', 'https://new.express.adobe.com/new?category=templates&height=1080&width=1080&unit=px&action=text+to+template'],
  suggestionsLabel: ['gen-template-suggestions-label', 'Get started with an example prompt'],
};
let instanceId = 0;

function createElement(tag, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function getCellText(cell) {
  return cell?.textContent?.trim() || '';
}

async function loadPlaceholders() {
  const [{ getConfig }, { replaceKeyArray }] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
  ]);
  const entries = Object.entries(PLACEHOLDERS);
  const values = await replaceKeyArray(entries.map(([, [key]]) => key), getConfig());

  return entries.reduce((strings, [name, [key, fallback]], index) => {
    const metadataValue = getMetadata(key)?.trim();
    const placeholderValue = values[index]?.trim();
    const isResolved = placeholderValue
      && placeholderValue !== key
      && placeholderValue !== key.replaceAll('-', ' ');
    strings[name] = metadataValue || (isResolved ? placeholderValue : fallback);
    return strings;
  }, {});
}

function getTemplateRecipe(sourceRow) {
  const source = getCellText(sourceRow?.firstElementChild).replace(/^\?/, '');
  if (!source) return '';
  if (!source.includes('=')) {
    return new URLSearchParams({
      collectionId: source.replaceAll('\\:', ':'),
      limit: TEMPLATE_FETCH_LIMIT,
    }).toString();
  }
  const params = new URLSearchParams(source);
  if (!params.has('limit')) params.set('limit', TEMPLATE_FETCH_LIMIT);
  return params.toString();
}

async function loadTemplates(sourceRow) {
  const recipe = getTemplateRecipe(sourceRow);
  if (!recipe) return [];
  try {
    const response = await fetchResults(recipe);
    return (response?.items || [])
      .filter((template) => isValidTemplate(template))
      .slice(0, TEMPLATE_DISPLAY_LIMIT);
  } catch (error) {
    window.lana?.log(`Error loading gen-template-marquee templates: ${error?.message || error}`, {
      tags: 'gen-template-marquee',
      severity: 'error',
    });
    return [];
  }
}

function redirect(url) {
  if (window.isTestEnv && typeof window.t_locationAssign === 'function') {
    window.t_locationAssign(url);
    return;
  }
  window.location.assign(url);
}

async function appendTracking(destination) {
  if (window.isTestEnv && typeof window.t_getTrackingAppendedURL === 'function') {
    return window.t_getTrackingAppendedURL(destination);
  }
  const { getTrackingAppendedURL } = await import('../../scripts/branchlinks.js');
  return getTrackingAppendedURL(destination, { placement: 'gen-template-marquee' });
}

function buildPromptForm(suggestionsRow, strings) {
  const wrapper = createElement('div', 'gen-template-prompt');
  const form = createElement('form', 'gen-template-prompt-form');
  const field = createElement('div', 'gen-template-prompt-field');
  const label = createElement('label', 'gen-template-prompt-label');
  const textarea = createElement('textarea', 'gen-template-prompt-input');
  const submit = createElement('button', 'gen-template-prompt-submit');
  const buttonText = createElement('span', 'gen-template-prompt-submit-text');
  const suggestions = createElement('div', 'gen-template-suggestions');
  const suggestionsLabel = createElement('p', 'gen-template-suggestions-label');
  const suggestionList = createElement('div', 'gen-template-suggestion-list');

  instanceId += 1;
  textarea.id = `gen-template-prompt-${instanceId}`;
  textarea.name = 'prompt';
  textarea.rows = 2;
  textarea.placeholder = strings.input;
  textarea.enterKeyHint = 'go';

  label.htmlFor = textarea.id;
  label.textContent = strings.label;

  submit.type = 'submit';
  const icon = getIconElementDeprecated('AX_AIGenerate_18_N', 22, '');
  icon.setAttribute('aria-hidden', 'true');
  buttonText.textContent = strings.submit;
  submit.append(icon, buttonText);

  form.dataset.desktopHref = strings.desktopHref;
  form.dataset.mobileHref = strings.mobileHref;
  field.append(label, textarea, submit);
  form.append(field);

  suggestionsLabel.textContent = strings.suggestionsLabel;
  const authoredSuggestions = getCellText(suggestionsRow?.firstElementChild)
    .split(',')
    .map((prompt) => prompt.trim())
    .filter(Boolean);
  authoredSuggestions.forEach((prompt) => {
    const button = createElement('button', 'gen-template-suggestion');
    button.type = 'button';
    button.dataset.prompt = prompt;
    button.textContent = prompt;
    suggestionList.append(button);
  });

  suggestions.append(suggestionsLabel, suggestionList);
  wrapper.append(form, suggestions);
  return wrapper;
}

function buildContent(textRow, suggestionsRow, strings) {
  const content = createElement('div', 'gen-template-content');
  const text = createElement('div', 'gen-template-text');
  const logoAndHeading = createElement('div', 'gen-template-logo-heading');
  const textCell = textRow?.firstElementChild;
  const heading = textCell?.querySelector('h1, h2, h3, h4, h5, h6');
  const body = [...(textCell?.children || [])].filter((child) => child !== heading);
  const logo = getIconElementDeprecated('adobe-express-logo', undefined, '');

  logo.classList.add('gen-template-logo');
  logo.setAttribute('aria-hidden', 'true');
  if (heading) logoAndHeading.append(logo, heading);
  else logoAndHeading.append(logo);
  text.append(logoAndHeading, ...body);
  content.append(text, buildPromptForm(suggestionsRow, strings));
  return content;
}

function buildGallery(templates) {
  const gallery = createElement('div', 'gen-template-gallery');
  gallery.setAttribute('aria-hidden', 'true');
  let templateIndex = 0;

  COLUMN_CARD_COUNTS.forEach((cardCount, columnIndex) => {
    const column = createElement('div', 'gen-template-column');
    if (columnIndex === 0 || columnIndex === COLUMN_CARD_COUNTS.length - 1) {
      column.classList.add('gen-template-column-edge');
    }

    templates.slice(templateIndex, templateIndex + cardCount).forEach((template, cardIndex) => {
      const page = template.pages?.[0];
      const thumbnail = page?.rendition?.image?.thumbnail;
      const imageUrl = getImageThumbnailSrc(
        extractRenditionLinkHref(template),
        extractComponentLinkHref(template),
        page,
      );
      if (!imageUrl) return;

      const card = createElement('div', 'gen-template-card');
      const isSquare = thumbnail?.width && thumbnail?.height
        && thumbnail.width / thumbnail.height >= 0.85;
      card.classList.add(`gen-template-card-${isSquare ? 'square' : 'portrait'}`);
      const picture = createElement('picture');
      const image = createElement('img');
      image.src = imageUrl;
      image.alt = '';
      image.decoding = 'async';
      image.loading = columnIndex === 2 && cardIndex === 0 ? 'eager' : 'lazy';
      if (columnIndex === 2 && cardIndex === 0) image.fetchPriority = 'high';
      picture.append(image);
      card.append(picture);
      column.append(card);
    });
    templateIndex += cardCount;
    if (column.children.length) gallery.append(column);
  });
  return gallery;
}

function addInteractions(block) {
  block.addEventListener('click', (event) => {
    const suggestion = event.target.closest('.gen-template-suggestion');
    if (!suggestion || !block.contains(suggestion)) return;
    const textarea = block.querySelector('.gen-template-prompt-input');
    textarea.value = suggestion.dataset.prompt;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
  });

  block.addEventListener('submit', async (event) => {
    const form = event.target.closest('.gen-template-prompt-form');
    if (!form || !block.contains(form)) return;
    event.preventDefault();

    const textarea = form.querySelector('.gen-template-prompt-input');
    const prompt = textarea.value.trim();
    if (!prompt) {
      textarea.focus();
      return;
    }

    const destination = window.matchMedia(DESKTOP_QUERY).matches
      ? form.dataset.desktopHref
      : form.dataset.mobileHref;
    if (!destination) return;

    const trackedDestination = await appendTracking(destination);

    const url = new URL(trackedDestination, window.location.href);
    url.searchParams.set('prompt', prompt);
    redirect(url.toString());
  });
}

export default async function decorate(block) {
  const rows = [...block.children];
  const [textRow, suggestionsRow, templateSourceRow] = rows;
  const [strings, templates] = await Promise.all([
    loadPlaceholders(),
    loadTemplates(templateSourceRow),
  ]);
  const content = buildContent(textRow, suggestionsRow, strings);
  const gallery = buildGallery(templates);

  block.replaceChildren(content, gallery);
  addInteractions(block);
}
