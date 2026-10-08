import { getIconElementDeprecated } from '../../scripts/utils.js';

const DESKTOP_QUERY = '(min-width: 1200px)';
let instanceId = 0;

function createElement(tag, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function getCellText(cell) {
  return cell?.textContent?.trim() || '';
}

function getCellLink(cell) {
  return cell?.querySelector('a')?.href || '';
}

function buildPromptForm(configRow) {
  const cells = [...(configRow?.children || [])];
  const [labelCell, placeholderCell, buttonCell, desktopLinkCell,
    mobileLinkCell, suggestionsLabelCell, ...promptCells] = cells;

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
  textarea.placeholder = getCellText(placeholderCell);
  textarea.enterKeyHint = 'go';

  label.htmlFor = textarea.id;
  label.textContent = getCellText(labelCell);

  submit.type = 'submit';
  const icon = getIconElementDeprecated('AX_AIGenerate_18_N', 22, '');
  icon.setAttribute('aria-hidden', 'true');
  buttonText.textContent = getCellText(buttonCell);
  submit.append(icon, buttonText);

  form.dataset.desktopHref = getCellLink(desktopLinkCell);
  form.dataset.mobileHref = getCellLink(mobileLinkCell);
  field.append(label, textarea, submit);
  form.append(field);

  suggestionsLabel.textContent = getCellText(suggestionsLabelCell);
  promptCells.forEach((cell) => {
    const prompt = getCellText(cell);
    if (!prompt) return;
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

function buildContent(textRow, configRow) {
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
  content.append(text, buildPromptForm(configRow));
  return content;
}

function buildGallery(galleryRows) {
  const gallery = createElement('div', 'gen-template-gallery');
  gallery.setAttribute('aria-hidden', 'true');

  galleryRows.forEach((row, columnIndex) => {
    const column = createElement('div', 'gen-template-column');
    if (columnIndex === 0 || columnIndex === galleryRows.length - 1) {
      column.classList.add('gen-template-column-edge');
    }

    [...row.children].forEach((cell, cardIndex) => {
      const card = createElement('div', 'gen-template-card');
      const shapeLabel = [...cell.children].find((child) => child.tagName === 'P');
      const shape = shapeLabel?.textContent?.trim().toLowerCase();
      if (shape === 'square' || shape === 'portrait') card.classList.add(`gen-template-card-${shape}`);
      const pictures = [...cell.querySelectorAll('picture')];
      pictures.forEach((picture, layerIndex) => {
        const image = picture.querySelector('img');
        if (image) {
          image.alt = '';
          image.decoding = 'async';
          image.loading = columnIndex === 2 && cardIndex === 0 ? 'eager' : 'lazy';
          if (columnIndex === 2 && cardIndex === 0 && layerIndex === 0) {
            image.fetchPriority = 'high';
          } else {
            image.removeAttribute('fetchpriority');
          }
        }
        card.append(picture);
      });
      if (pictures.length) column.append(card);
    });

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

    const url = new URL(destination, window.location.href);
    url.searchParams.set('prompt', prompt);
    const { getTrackingAppendedURL } = await import('../../scripts/branchlinks.js');
    const trackedUrl = await getTrackingAppendedURL(url.toString(), {
      placement: 'gen-template-marquee',
    });
    window.location.assign(trackedUrl);
  });
}

export default async function decorate(block) {
  const rows = [...block.children];
  const [textRow, configRow, ...galleryRows] = rows;
  const content = buildContent(textRow, configRow);
  const gallery = buildGallery(galleryRows);

  block.replaceChildren(content, gallery);
  addInteractions(block);
}
