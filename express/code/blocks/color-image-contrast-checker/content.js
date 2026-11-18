import { TEMPLATE_ID } from './templates.js';

// Samples in authored order: each picture, or each whitespace/comma-separated
// Express template ID in the cell's text (e.g. `urn:aaid:sc:VA6C2:…`).
function parseSamples(cell) {
  if (!cell) return [];
  const samples = [];
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_ALL, {
    acceptNode: (node) => {
      if (node.nodeName === 'PICTURE') return NodeFilter.FILTER_ACCEPT;
      // Picture internals and the text of a link wrapping a picture are not IDs.
      if (node.closest?.('picture') || node.parentElement?.closest('picture')
        || node.parentElement?.closest('a[href]')?.querySelector('picture')) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.nodeType === Node.TEXT_NODE ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeName === 'PICTURE') {
      samples.push({ picture: node });
    } else {
      node.textContent.split(/[\s,]+/).filter(Boolean).forEach((token) => {
        if (!TEMPLATE_ID.test(token)) throw new Error(`Invalid image contrast sample: ${token}`);
        samples.push({ templateId: token });
      });
    }
  }
  return samples;
}

export default function parseContent(block) {
  const rows = new Map();
  [...block.children].forEach((row) => {
    const [key, cell] = row.children;
    const name = key?.textContent.trim().toLowerCase();
    if (!['results', 'accuracy', 'background', 'samples'].includes(name) || !cell
      || rows.has(name)) {
      throw new Error(`Invalid image contrast content row: ${name}`);
    }
    rows.set(name, cell);
  });
  if (!rows.get('results')?.querySelector('h1, h2') || !rows.get('accuracy')?.textContent.trim()) {
    throw new Error('Image contrast content requires a results heading and accuracy guidance');
  }
  const section = block.closest('.section');
  const headline = section?.querySelector('.color-headline.extract.color-image-contrast');
  if (!headline?.querySelector('h1, h2')) {
    throw new Error('Image contrast requires an authored Color Headline (extract, color-image-contrast)');
  }
  if (rows.has('background') && rows.get('background').querySelectorAll('picture').length !== 1) {
    throw new Error('Image contrast background requires one authored collage picture');
  }
  return {
    headline,
    results: rows.get('results'),
    accuracy: rows.get('accuracy'),
    background: rows.get('background'),
    samples: parseSamples(rows.get('samples')),
  };
}
