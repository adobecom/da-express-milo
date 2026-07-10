import { createTag } from '../../scripts/utils.js';
import { initFromUrl, initFonts, subscribe } from './state.js';
import initFilters from './filters.js';
import initPanel from './panel.js';

export default async function decorate(block) {
  // ToDo: Extract authored content from DOM

  initFromUrl();

  let data;
  try {
    const resp = await fetch(new URL('./font-sheets/font-styles.json', import.meta.url).href);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    data = await resp.json();
  } catch (e) {
    window.lana?.log(`font-generator: failed to load font-styles.json: ${e?.message || e}`, { tags: 'font-generator', severity: 'error' });
    return;
  }
  initFonts(data.fonts);

  block.innerHTML = '';
  const container = createTag('section', { class: 'fg-container' });
  const sidebar = createTag('div', { class: 'fg-sidebar' });
  const main = createTag('div', { class: 'fg-main' });

  // ToDo: Remove placeholder content
  const placeholder = createTag('p', {}, 'Active filters: All');
  subscribe(({ activeFilters }) => {
    placeholder.textContent = `Active filters: ${activeFilters.length ? activeFilters.join(', ') : 'All'}`;
  });
  main.append(placeholder);

  // Temp trigger for panel/tray testing — remove when toolbar is implemented
  const tempTrigger = createTag('button', { class: 'fg-panel-trigger--temp' }, 'Open Filters');
  main.prepend(tempTrigger);

  const filtersDesktop = createTag('div', { class: 'fg-filters' });
  sidebar.appendChild(filtersDesktop);
  container.append(sidebar, main);
  block.appendChild(container);

  const [, { open: openPanel }] = await Promise.all([
    initFilters([filtersDesktop]),
    initPanel(block),
  ]);

  tempTrigger.addEventListener('click', openPanel);
}
