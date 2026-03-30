const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';

function getContentCol(row) {
  const cols = Array.from(row.children);
  return cols[0] || row;
}

const ROW_PARSERS = [
  // Row 1: heading text
  function parseHeading(col, preview) {
    const heading = col.querySelector(HEADING_SELECTOR);
    preview.heading = heading ? heading.textContent.trim() : col.textContent.trim();
  },
  // Row 2: description text + link becomes CTA
  function parseDescription(col, preview) {
    const link = col.querySelector('a');
    if (link) {
      preview.ctaText = link.textContent.trim();
    }
    const p = col.querySelector('p');
    preview.description = p ? p.textContent.trim() : col.textContent.trim();
  },
  // Row 3: image
  function parseImage(col, preview) {
    const picture = col.querySelector('picture');
    if (picture) {
      preview.image = picture.cloneNode(true);
    }
  },
];

export default function parseContent(block) {
  const preview = {};
  const rows = Array.from(block.children);

  rows.forEach((row, index) => {
    const parser = ROW_PARSERS[index];
    if (parser) {
      parser(getContentCol(row), preview);
    }
  });

  return { preview };
}
