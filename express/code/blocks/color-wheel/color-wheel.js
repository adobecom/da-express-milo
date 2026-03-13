import { createTag } from '../../scripts/utils.js';

export default async function decorate(block) {
  block.innerHTML = '';
  block.className = 'color-wheel';

  const col1 = createTag('div', { class: 'col1' });
  const col2 = createTag('div', { class: 'col2' });

  block.append(col1, col2);
}
