const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';

function normalizeKey(text) {
  return text.trim().toLowerCase().replaceAll(/[-_\s]+/g, '');
}

function getTextElement(valueCol) {
  return valueCol.querySelector('p') || valueCol;
}

const CONTENT_PARSERS = {
  previewblockheading(valueCol, preview) {
    const heading = valueCol.querySelector(HEADING_SELECTOR);
    preview.heading = heading ? heading.textContent.trim() : valueCol.textContent.trim();
  },
  previewblockdescription(valueCol, preview) {
    preview.description = getTextElement(valueCol).textContent?.trim() || '';
  },
  previewblockbutton(valueCol, preview) {
    const link = valueCol.querySelector('a');
    preview.ctaText = link ? link.textContent.trim() : valueCol.textContent.trim();
  },
  previewblockimage(valueCol, preview) {
    const picture = valueCol.querySelector('picture');
    if (picture) {
      preview.image = picture.cloneNode(true);
    }
  },
};

export default function parseContent(block) {
  const preview = {};

  Array.from(block.children).forEach((row) => {
    const cols = Array.from(row.children);
    if (cols.length < 2) return;

    const parser = CONTENT_PARSERS[normalizeKey(cols[0].textContent)];
    parser?.(cols[1], preview);
  });

  return { preview };
}
