import { getLibs } from '../../scripts/utils.js';
import {
  applyPaletteToChips,
  drawImageToCanvas,
  extractPaletteFromImageElement,
} from '../../scripts/color-shared/utils/imageExtractUtils.js';

const PALETTE_SIZE = 6;

let createTag;
let blockInstance = 0;

function setExpanded(button, panel, expanded) {
  button.setAttribute('aria-expanded', String(expanded));
  panel.setAttribute('aria-hidden', String(!expanded));
  panel.toggleAttribute('inert', !expanded);
}

function buildAccordionItem(row, index, instanceId, openByDefault) {
  const [titleCell, contentCell] = [...row.children];
  const title = titleCell?.textContent.trim();
  if (!title || !contentCell) return null;

  const buttonId = `color-img-accordion-button-${instanceId}-${index}`;
  const panelId = `color-img-accordion-panel-${instanceId}-${index}`;
  const item = createTag('div', { class: 'color-img-accordion-item' });
  const button = createTag('button', {
    class: 'color-img-accordion-button',
    type: 'button',
    id: buttonId,
    'aria-controls': panelId,
    'aria-expanded': 'false',
  });
  const titleElement = createTag('span', {
    class: 'color-img-accordion-title',
  }, title);
  const icon = createTag('span', {
    class: 'color-img-accordion-icon',
    'aria-hidden': 'true',
  });
  const panel = createTag('div', {
    class: 'color-img-accordion-panel',
    id: panelId,
    role: 'region',
    'aria-labelledby': buttonId,
    'aria-hidden': 'true',
    inert: '',
  });
  const panelContent = createTag('div', { class: 'color-img-accordion-panel-content' });

  panelContent.append(...contentCell.childNodes);
  panel.append(panelContent);
  button.append(titleElement, icon);
  item.append(button, panel);

  if (openByDefault) setExpanded(button, panel, true);
  return item;
}

function setupAccordion(block) {
  block.addEventListener('click', (event) => {
    const button = event.target.closest('.color-img-accordion-button');
    if (!button || !block.contains(button)) return;

    const panel = document.getElementById(button.getAttribute('aria-controls'));
    if (panel) setExpanded(button, panel, button.getAttribute('aria-expanded') !== 'true');
  });
}

async function extractPalette(image) {
  try {
    const canvas = drawImageToCanvas(image);
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { extractColorsFromImage } = await import(
      '../../scripts/color-shared/utils/extractWorker.js'
    );
    const { colors } = await extractColorsFromImage(
      imageData,
      canvas.width,
      canvas.height,
      PALETTE_SIZE,
    );
    return colors;
  } catch {
    return extractPaletteFromImageElement(image, PALETTE_SIZE);
  }
}

function setupPalette(block, image, palette, chips) {
  const updatePalette = async () => {
    const colors = await extractPalette(image);
    if (!colors?.length) return;
    applyPaletteToChips(colors, chips);
    palette.classList.add('is-ready');
  };

  if (image.complete && image.naturalWidth) {
    queueMicrotask(updatePalette);
    return;
  }

  const handleLoad = (event) => {
    if (event.target !== image) return;
    block.removeEventListener('load', handleLoad, true);
    updatePalette();
  };
  block.addEventListener('load', handleLoad, true);
}

function buildMedia(block, picture) {
  if (!picture) return null;

  const media = createTag('div', { class: 'color-img-accordion-media' });
  const photo = createTag('div', { class: 'color-img-accordion-photo' });
  photo.append(picture);
  media.append(photo);

  if (!block.classList.contains('simple-image')) {
    const palette = createTag('div', {
      class: 'color-img-accordion-palette',
      'aria-hidden': 'true',
    });
    const chips = Array.from({ length: PALETTE_SIZE }, () => (
      createTag('span', { class: 'color-img-accordion-swatch' })
    ));
    palette.append(...chips);
    photo.append(palette);

    const image = picture.querySelector('img');
    if (image) setupPalette(block, image, palette, chips);
  }

  return media;
}

function extractContent(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const introRow = rows.shift();
  const introCells = [...(introRow?.children || [])];
  const headingCell = introCells[0];
  let picture = introCells.slice(1).map((cell) => cell.querySelector('picture')).find(Boolean);
  let mediaRow;

  if (!picture) {
    mediaRow = rows.find((row) => row.children.length === 1 && row.querySelector('picture'));
    picture = mediaRow?.querySelector('picture');
  }

  return {
    headingCell,
    picture,
    itemRows: rows.filter((row) => row !== mediaRow),
  };
}

export default async function decorate(block) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));

  const instanceId = blockInstance;
  blockInstance += 1;
  const { headingCell, picture, itemRows } = extractContent(block);
  const inner = createTag('div', { class: 'color-img-accordion-inner' });
  const content = createTag('div', { class: 'color-img-accordion-content' });
  const heading = createTag('div', { class: 'color-img-accordion-heading' });
  const accordion = createTag('div', { class: 'color-img-accordion-items' });

  if (headingCell) heading.append(...headingCell.childNodes);
  itemRows.forEach((row, index) => {
    const item = buildAccordionItem(row, index, instanceId, accordion.children.length === 0);
    if (item) accordion.append(item);
  });

  content.append(heading, accordion);
  const media = buildMedia(block, picture);
  if (media) inner.append(media);
  inner.append(content);
  block.replaceChildren(inner);
  setupAccordion(block);
}
