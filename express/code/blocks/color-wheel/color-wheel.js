import { createTag } from '../../scripts/utils.js';

export default async function decorate(block) {
  block.innerHTML = '';
  block.className = 'color-wheel';

  const sidebar = createTag('div', { class: 'color-palette-sidebar' });

  // Tabs

  block.append(sidebar);
}
