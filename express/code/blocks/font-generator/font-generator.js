import { createTag } from '../../scripts/utils.js';
import { initFromUrl } from './state.js';

export default function decorate(block) {
  // ToDo: Extract authored content from DOM

  initFromUrl();

  block.innerHTML = '';
  const container = createTag('section', { class: 'fg-container' });
  // ToDo: Remove placeholder content
  const sidebar = createTag('div', { class: 'fg-sidebar' }, '<p>Sidebar: Lorem ipsum</p>');
  const main = createTag('div', { class: 'fg-main' }, '<p>Main: Lorem ipsum</p>');
  container.append(sidebar, main);
  block.appendChild(container);
}
