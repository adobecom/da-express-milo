import { DEFAULTS } from './constants.js';

export function parseBlockConfig(rows) {
  const config = { ...DEFAULTS };

  rows.forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length < 2) return;

    const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '');
    const value = cells[1].textContent.trim();

    if (!key || !value) return;

    switch (key) {
      case 'variant':
        config.variant = value.toLowerCase();
        break;
      case 'initialload':
        config.initialLoad = parseInt(value, 10) || DEFAULTS.initialLoad;
        break;
      case 'loadmoreincrement':
        config.loadMoreIncrement = parseInt(value, 10) || DEFAULTS.loadMoreIncrement;
        break;
      case 'maxitems':
        config.maxItems = parseInt(value, 10) || DEFAULTS.maxItems;
        break;
      case 'enablefilters':
        config.enableFilters = value.toLowerCase() === 'true';
        break;
      case 'enablesearch':
        config.enableSearch = value.toLowerCase() === 'true';
        break;
      default:
    }
  });

  return config;
}
