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
    samples: rows.get('samples'),
  };
}
