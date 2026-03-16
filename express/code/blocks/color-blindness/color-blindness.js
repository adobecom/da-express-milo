import { createTag } from '../../scripts/utils.js';

function parseContent(block) {
  const layout = {};
  const rows = Array.from(block.children);

  rows.forEach((row) => {
    const cols = Array.from(row.children);
    if (cols.length < 2) return;

    const key = cols[0].textContent.trim().toLowerCase().replaceAll(/[-_\s]+/g, '');
    const valueCol = cols[1];

    switch (key) {
      case 'pageheading': {
        const h = valueCol.querySelector('h1, h2, h3, h4, h5, h6');
        if (h) layout.heading = h.cloneNode(true);
        break;
      }
      case 'pagesubheading': {
        const p = valueCol.querySelector('p') || valueCol;
        const textContent = p.textContent?.trim();
        if (textContent) {
          layout.paragraph = createTag('p', {}, textContent);
        }
        break;
      }
      default:
        break;
    }
  });

  return { layout };
}

export default async function decorate(block) {
  const { layout } = parseContent(block);

  block.innerHTML = '';
  block.className = 'color-blindness';

  const container = document.createElement('div');
  container.className = 'color-blindness-container';
  block.appendChild(container);
}
