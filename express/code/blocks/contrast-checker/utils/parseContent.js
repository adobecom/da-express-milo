import { createTag } from '../../../scripts/utils.js';

const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';

function normalizeKey(text) {
  return text.trim().toLowerCase().replaceAll(/[-_\s]+/g, '');
}

function getTextElement(valueCol) {
  return valueCol.querySelector('p') || valueCol;
}

function parseHeading(valueCol) {
  const heading = valueCol.querySelector(HEADING_SELECTOR);
  return heading ? heading.cloneNode(true) : null;
}

const CONTENT_PARSERS = {
  pageheading(valueCol, layout) {
    layout.heading = parseHeading(valueCol);
  },
  pagesubheading(valueCol, layout) {
    const textContent = getTextElement(valueCol).textContent?.trim();
    if (textContent) {
      layout.paragraph = createTag('p', {}, textContent);
    }
  },
  previewblockheading(valueCol, _layout, preview) {
    const heading = valueCol.querySelector(HEADING_SELECTOR);
    preview.heading = heading ? heading.textContent.trim() : valueCol.textContent.trim();
  },
  previewblockdescription(valueCol, _layout, preview) {
    preview.description = getTextElement(valueCol).textContent?.trim() || '';
  },
  previewblockbutton(valueCol, _layout, preview) {
    const link = valueCol.querySelector('a');
    preview.ctaText = link ? link.textContent.trim() : valueCol.textContent.trim();
  },
  previewblockimage(valueCol, _layout, preview) {
    const picture = valueCol.querySelector('picture');
    if (picture) {
      preview.image = picture.cloneNode(true);
    }
  },
};

export default function parseContent(block) {
  const layout = {};
  const preview = {};

  Array.from(block.children).forEach((row) => {
    const cols = Array.from(row.children);
    if (cols.length < 2) return;

    const parser = CONTENT_PARSERS[normalizeKey(cols[0].textContent)];
    parser?.(cols[1], layout, preview);
  });

  return { layout, preview };
}
