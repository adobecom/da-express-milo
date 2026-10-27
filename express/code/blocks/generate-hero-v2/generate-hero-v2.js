import { getIconElementDeprecated, getLibs, getMetadata } from '../../scripts/utils.js';
import {
  extractComponentLinkHref,
  extractRenditionLinkHref,
  fetchResults,
  getImageThumbnailSrc,
  isValidTemplate,
} from '../../scripts/template-utils.js';

const TEMPLATE_DISPLAY_LIMIT = 14;
const TEMPLATE_FETCH_LIMIT = 23;
const COLUMN_CARD_COUNTS = [3, 3, 2, 3, 3];
const PLACEHOLDERS = {
  label: ['generate-hero-prompt-label', 'Prompt'],
  input: ['generate-hero-prompt-placeholder', 'Describe what template you want to make'],
  submit: ['generate-hero-prompt-submit', 'Generate'],
  suggestionsLabel: ['generate-hero-suggestions-label', 'Get started with an example prompt'],
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
    window.lana?.log(`Error loading generate-hero-v2 templates: ${error?.message || error}`, {
      tags: 'generate-hero-v2',
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
  return getTrackingAppendedURL(destination, { placement: 'generate-hero-v2' });
}

function buildPromptForm(suggestionsRow, strings) {
  const wrapper = createElement('div', 'generate-hero-prompt');
  const form = createElement('form', 'generate-hero-prompt-form');
  const field = createElement('div', 'generate-hero-prompt-field');
  const label = createElement('label', 'generate-hero-prompt-label');
  const textarea = createElement('textarea', 'generate-hero-prompt-input');
  const submit = createElement('button', 'generate-hero-prompt-submit');
  const buttonText = createElement('span', 'generate-hero-prompt-submit-text');
  const suggestions = createElement('div', 'generate-hero-suggestions');
  const suggestionsLabel = createElement('p', 'generate-hero-suggestions-label');
  const suggestionList = createElement('div', 'generate-hero-suggestion-list');

  instanceId += 1;
  textarea.id = `generate-hero-prompt-${instanceId}`;
  textarea.name = 'prompt';
  textarea.rows = 1;
  textarea.placeholder = strings.input;
  textarea.enterKeyHint = 'go';

  label.htmlFor = textarea.id;
  label.textContent = strings.label;

  submit.type = 'submit';
  submit.classList.add('button', 'primary');
  const icon = getIconElementDeprecated('AX_AIGenerate_18_N', 18, '');
  icon.setAttribute('aria-hidden', 'true');
  buttonText.textContent = strings.submit;
  submit.append(icon, buttonText);

  field.append(label, textarea, submit);
  form.append(field);

  suggestionsLabel.textContent = strings.suggestionsLabel;
  // Column 1: chip labels. Column 2 (optional): prompt inserted on click, paired by position.
  const [labelCell, promptCell] = suggestionsRow?.children ?? [];
  // One <p> per item, or a single comma-separated line; trailing commas are dropped.
  const parseList = (cell) => {
    const paragraphs = [...(cell?.querySelectorAll(':scope > p') ?? [])];
    const items = paragraphs.length > 1
      ? paragraphs.map((p) => p.textContent)
      : getCellText(cell).split(',');
    return items.map((item) => item.trim().replace(/,$/, '').trim());
  };
  const prompts = parseList(promptCell);
  parseList(labelCell).forEach((text, index) => {
    if (!text) return;
    const button = createElement('button', 'generate-hero-suggestion');
    button.type = 'button';
    button.dataset.prompt = prompts[index] || text;
    button.textContent = text;
    suggestionList.append(button);
  });

  suggestions.append(suggestionsLabel, suggestionList);
  wrapper.append(form, suggestions);
  return wrapper;
}

function getBrandingLogo() {
  const brandingLogoName = getMetadata('inject-branding-logo')?.trim();
  if (!brandingLogoName) return null;

  const logo = getIconElementDeprecated(brandingLogoName);
  logo.classList.add('generate-hero-logo');
  logo.setAttribute('aria-hidden', 'true');
  return logo;
}

function buildContent(textRow, suggestionsRow, strings) {
  const content = createElement('div', 'generate-hero-content');
  const text = createElement('div', 'generate-hero-text');
  const logoAndHeading = createElement('div', 'generate-hero-logo-heading');
  const textCell = textRow?.firstElementChild;
  // Convention: the destination link is authored as the last element of the first row.
  // Only its href is used; the button copy comes from the placeholder.
  const linkContainer = textCell?.lastElementChild;
  const destination = linkContainer?.querySelector('a')?.href;
  if (destination) linkContainer.remove();
  const heading = textCell?.querySelector('h1, h2, h3, h4, h5, h6');
  const body = [...(textCell?.children || [])].filter((child) => child !== heading);
  const logo = getBrandingLogo();
  const prompt = buildPromptForm(suggestionsRow, strings);
  if (destination) prompt.querySelector('.generate-hero-prompt-form').dataset.href = destination;

  if (logo) logoAndHeading.append(logo);
  if (heading) logoAndHeading.append(heading);
  text.append(logoAndHeading, ...body);
  content.append(text, prompt);
  return content;
}

function getTemplateColumns(templates) {
  let templateIndex = 0;
  return COLUMN_CARD_COUNTS.map((cardCount) => {
    const column = templates.slice(templateIndex, templateIndex + cardCount).map((template) => {
      const page = template.pages?.[0];
      const thumbnail = page?.rendition?.image?.thumbnail;
      const src = getImageThumbnailSrc(
        extractRenditionLinkHref(template),
        extractComponentLinkHref(template),
        page,
      );
      return src && { src, width: thumbnail?.width, height: thumbnail?.height };
    }).filter(Boolean);
    templateIndex += cardCount;
    return column;
  });
}

// hardcoded-templates: one cell per column, each holding that column's authored images.
function getAuthoredColumns(row) {
  return [...(row?.children || [])].map((cell) => [...cell.querySelectorAll('img')].map((img) => ({
    picture: img.closest('picture'),
    src: img.src,
  })));
}

function buildCard({ picture: authoredPicture, src, width, height }, isLcp) {
  const card = createElement('div', 'generate-hero-card');
  // Authored images size the card themselves (EDS drops width/height), so nothing is cropped.
  const isSquare = width && height && width / height >= 0.85;
  card.classList.add(authoredPicture
    ? 'generate-hero-card-authored'
    : `generate-hero-card-${isSquare ? 'square' : 'portrait'}`);
  const picture = authoredPicture || createElement('picture');
  const image = picture.querySelector('img') || createElement('img');
  if (!image.src) image.src = src;
  image.alt = '';
  image.decoding = 'async';
  image.loading = isLcp ? 'eager' : 'lazy';
  if (isLcp) image.fetchPriority = 'high';
  picture.append(image);
  card.append(picture);
  return card;
}

function buildGallery(columns) {
  const gallery = createElement('div', 'generate-hero-gallery');
  gallery.setAttribute('aria-hidden', 'true');

  columns.forEach((items, columnIndex) => {
    const column = createElement('div', 'generate-hero-column');
    items.forEach((item, cardIndex) => {
      column.append(buildCard(item, columnIndex === 2 && cardIndex === 0));
    });
    if (column.children.length) gallery.append(column);
  });
  return gallery;
}

function resizePrompt(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function trackScrollEnd(list) {
  const update = () => {
    // Math.abs: RTL scrollLeft runs negative.
    const remaining = list.scrollWidth - list.clientWidth - Math.abs(list.scrollLeft);
    list.classList.toggle('is-scroll-end', remaining <= 1);
  };
  list.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(list);
}

function addInteractions(block) {
  block.addEventListener('input', (event) => {
    const textarea = event.target.closest('.generate-hero-prompt-input');
    if (!textarea || !block.contains(textarea)) return;
    resizePrompt(textarea);
  });

  block.addEventListener('click', (event) => {
    const suggestion = event.target.closest('.generate-hero-suggestion');
    if (!suggestion || !block.contains(suggestion)) return;
    const textarea = block.querySelector('.generate-hero-prompt-input');
    textarea.value = suggestion.dataset.prompt;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
  });

  block.addEventListener('submit', async (event) => {
    const form = event.target.closest('.generate-hero-prompt-form');
    if (!form || !block.contains(form)) return;
    event.preventDefault();

    const textarea = form.querySelector('.generate-hero-prompt-input');
    const prompt = textarea.value.trim();
    if (!prompt) {
      textarea.focus();
      return;
    }

    const destination = form.dataset.href;
    if (!destination) return;

    const trackedDestination = await appendTracking(destination);

    const url = new URL(trackedDestination, window.location.href);
    url.searchParams.set('prompt', prompt);
    redirect(url.toString());
  });
}

export default async function decorate(block) {
  const rows = [...block.children];
  const [textRow, suggestionsRow, galleryRow] = rows;
  const isHardcoded = block.classList.contains('hardcoded-templates');
  const [strings, columns] = await Promise.all([
    loadPlaceholders(),
    isHardcoded
      ? getAuthoredColumns(galleryRow)
      : loadTemplates(galleryRow).then(getTemplateColumns),
  ]);
  const content = buildContent(textRow, suggestionsRow, strings);
  const gallery = buildGallery(columns);

  block.replaceChildren(content, gallery);
  addInteractions(block);
  trackScrollEnd(block.querySelector('.generate-hero-suggestion-list'));
  resizePrompt(block.querySelector('.generate-hero-prompt-input'));
}
