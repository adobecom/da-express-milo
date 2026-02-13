import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';

let decorateButtons; let createTag;
let getMetadata; let getConfig;
let replaceKeyArray; let generate;
let useThisPrompt; let promptTitle;

// [headingSize, bodySize, detailSize, titlesize]
const typeSizes = ['xxl', 'xl', 'l', 'xs'];

const promptTokenRegex = /(%7B%7B|)prompt%20text(%7D%7D|)/;

export const windowHelper = {
  redirect: (url) => {
    window.location.assign(url);
  },
};

// List of placeholders required
// 'describe-image-mobile
// 'describe-image-desktop
// 'generate'
// 'use-this-prompt'
// 'prompt-title'

async function handleGenAISubmit(form, link) {
  const input = form.querySelector('input');
  if (!link || input.value.trim() === '') return;
  const mod = await import('../../scripts/branchlinks.js');
  const genAILink = await mod.getTrackingAppendedURL(link.replace(promptTokenRegex, encodeURI(input.value).replaceAll(' ', '+')));
  const urlObj = new URL(genAILink);
  urlObj.searchParams.delete('referrer');
  windowHelper.redirect(urlObj.toString());
}

// eslint-disable-next-line max-len
function createEnticement(enticementDetail, enticementPlaceholder, enticementPlaceholerMobile, enticementLink, mode) {
  const enticementDiv = createTag('form', { class: 'enticement-container' });
  const svgImage = getIconElementDeprecated('enticement-arrow', 60);
  const arrowText = enticementDetail;
  const enticementText = createTag('span', { class: 'enticement-text' }, arrowText.trim());
  const input = createTag('input', { type: 'text', placeholder: window.screen.width < 600 ? enticementPlaceholerMobile : enticementPlaceholder });
  const buttonContainer = createTag('span', { class: 'button-container' });
  const button = createTag('input', { class: 'generate-small-btn', type: 'submit' });

  buttonContainer.append(button);
  button.value = generate;

  enticementDiv.addEventListener('submit', (e) => {
    e.preventDefault();
    handleGenAISubmit(enticementDiv, enticementLink);
  });
  enticementDiv.append(enticementText, svgImage, input, buttonContainer);

  if (mode === 'light') enticementText.classList.add('light');
  return enticementDiv;
}

function createPromptLinkElement(promptLink, prompt) {
  const icon = getIconElementDeprecated('external-link', 22);
  icon.classList.add('link');
  icon.addEventListener('click', async () => {
    const mod = await import('../../scripts/branchlinks.js');
    const genAILink = await mod.getTrackingAppendedURL(promptLink);
    const urlObj = new URL(genAILink);
    urlObj.searchParams.delete('referrer');
    urlObj.searchParams.append('prompt', prompt);
    windowHelper.redirect(urlObj.toString());
  });
  const wrapper = createTag('div', { class: 'external-link-element' });
  const usePrompt = createTag('div', { class: 'mobile-prompt-link' });
  usePrompt.textContent = useThisPrompt;
  wrapper.appendChild(usePrompt);
  usePrompt.appendChild(icon);
  return wrapper;
}

const LOGO = 'adobe-express-logo';
function injectExpressLogo(block, wrapper) {
  if (block.classList.contains('entitled')) return;
  if (!['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) return;
  const logo = getIconElementDeprecated(LOGO, '22px');
  logo.classList.add('express-logo');
  wrapper.prepend(logo);
}

async function setHorizontalMasonry(el) {
  const link = el.querySelector(':scope .con-button');
  if (!link) {
    console.error('Missing Generate Link');
    return;
  }

  const args = el.querySelectorAll('.interactive-container > .asset > p');
  const container = el.querySelector('.interactive-container .asset');
  container.classList.add('media-container');

  const enticementElement = args[0].querySelector('a');
  const enticementMode = el.classList.contains('light') ? 'light' : 'dark';
  const enticementText = enticementElement.textContent.trim();
  const enticementLink = enticementElement.href;
  const enticementPlaceholder = args[1].textContent;
  const enticementPlaceholerMobile = args[2].textContent;
  args[0].remove();
  args[1].remove();
  args[2].remove();

  el.querySelector('.interactive-container').appendChild(createEnticement(enticementText, enticementPlaceholder, enticementPlaceholerMobile, enticementLink, enticementMode));
  for (let i = 3; i < args.length; i += 3) {
    const divider = args[i];
    divider.remove();
    const prompt = args[i + 1];
    prompt.classList.add('overlay');

    const pictureContainer = args[i + 2];
    pictureContainer.classList.add('image-container');
    pictureContainer.appendChild(prompt);
    pictureContainer.appendChild(createPromptLinkElement(link.href, prompt.textContent));

    const image = pictureContainer.querySelector('img');
    if (image.width < image.height) {
      image.classList.add('tall-prompt-image');
    }

    const title = createTag('div', { class: 'prompt-title' });
    title.textContent = promptTitle !== 'prompt title' ? promptTitle : 'Prompt used';
    prompt.prepend(title);
  }

  injectExpressLogo(el, el.querySelector('.foreground > .text'));
}

function decorateText(el) {
  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const heading = headings[headings.length - 1];
  const config = typeSizes;
  const decorate = (headingEl, typeSize) => {
    headingEl.classList.add(`heading-${typeSize[0]}`);
    const bodyEl = headingEl.nextElementSibling;
    bodyEl?.classList.add(`body-${typeSize[1]}`);
    bodyEl?.nextElementSibling?.classList.add(`body-${typeSize[1]}`);
  };
  decorate(heading, config);
}

function extendButtonsClass(text) {
  const buttons = text.querySelectorAll('.con-button');
  if (buttons.length === 0) return;
  buttons.forEach((button) => {
    button.classList.add('button-justified-mobile');
  });
}

function interactiveInit(el) {
  const isLight = el.classList.contains('light');
  if (!isLight) el.classList.add('dark');
  const children = el.querySelectorAll(':scope > div');
  const foreground = children[children.length - 1];
  foreground.classList.add('foreground', 'container');
  const headline = foreground.querySelector('h1, h2, h3, h4, h5, h6');
  const text = headline.closest('div');
  text.classList.add('text');
  const mediaElements = foreground.querySelectorAll(':scope > div:not([class])');
  const media = mediaElements[0];
  if (media) {
    const interactiveBox = createTag('div', { class: 'interactive-container' });
    mediaElements.forEach((mediaDiv) => {
      mediaDiv.classList.add('asset');
      interactiveBox.appendChild(mediaDiv);
    });
    foreground.appendChild(interactiveBox);
  }

  const firstDivInForeground = foreground.querySelector(':scope > div');
  if (firstDivInForeground?.classList.contains('asset')) el.classList.add('row-reversed');
  decorateButtons(text, 'button-xl');
  decorateText(text, createTag);
  extendButtonsClass(text);
}

export default async function init(el) {
  if (!el.classList.contains('horizontal-masonry')) {
    window.lana?.log('Using interactive-marquee on Express requires using the horizontal-masonry class.');
    return;
  }
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`), import(`${getLibs()}/utils/decorate.js`)]).then(([utils, placeholders, decorate]) => {
    ({ createTag, getMetadata, getConfig } = utils);
    ({ replaceKeyArray } = placeholders);
    ({ decorateButtons } = decorate);
  });
  ([generate, useThisPrompt, promptTitle] = await replaceKeyArray(['generate', 'use-this-prompt', 'prompt-title'], getConfig()));
  interactiveInit(el);
  await setHorizontalMasonry(el);
}
