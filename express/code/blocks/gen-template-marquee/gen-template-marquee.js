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

  form.dataset.desktopHref = strings.desktopHref;
  form.dataset.mobileHref = strings.mobileHref;
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
    const button = createElement('button', 'gen-template-suggestion');
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
  logo.classList.add('gen-template-logo');
  logo.setAttribute('aria-hidden', 'true');
  return logo;
}

function buildContent(textRow, suggestionsRow, strings) {
  const content = createElement('div', 'gen-template-content');
  const text = createElement('div', 'gen-template-text');
  const logoAndHeading = createElement('div', 'gen-template-logo-heading');
  const textCell = textRow?.firstElementChild;
  const heading = textCell?.querySelector('h1, h2, h3, h4, h5, h6');
  const body = [...(textCell?.children || [])].filter((child) => child !== heading);
  const logo = getBrandingLogo();

  if (logo) logoAndHeading.append(logo);
  if (heading) logoAndHeading.append(heading);
  text.append(logoAndHeading, ...body);
  content.append(text, buildPromptForm(suggestionsRow, strings));
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
  const card = createElement('div', 'gen-template-card');
  // Authored images size the card themselves (EDS drops width/height), so nothing is cropped.
  const isSquare = width && height && width / height >= 0.85;
  card.classList.add(authoredPicture
    ? 'gen-template-card-authored'
    : `gen-template-card-${isSquare ? 'square' : 'portrait'}`);
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
  const gallery = createElement('div', 'gen-template-gallery');
  gallery.setAttribute('aria-hidden', 'true');

  columns.forEach((items, columnIndex) => {
    const column = createElement('div', 'gen-template-column');
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

function manageScrollAnimation(block) {
  const update = () => {
    block.classList.toggle('scroll-animation-disabled', block.scrollHeight <= window.innerHeight);
  };
  const observer = new ResizeObserver(update);
  update();
  observer.observe(block);
  observer.observe(document.documentElement);
  block.addEventListener('block-unload', () => observer.disconnect(), { once: true });
}

function addInteractions(block) {
  block.addEventListener('input', (event) => {
    const textarea = event.target.closest('.gen-template-prompt-input');
    if (!textarea || !block.contains(textarea)) return;
    resizePrompt(textarea);
  });

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
  manageScrollAnimation(block);
  addInteractions(block);
  trackScrollEnd(block.querySelector('.gen-template-suggestion-list'));
  resizePrompt(block.querySelector('.gen-template-prompt-input'));
}
