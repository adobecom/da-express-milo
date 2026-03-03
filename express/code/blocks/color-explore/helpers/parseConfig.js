/**
 * Parse block table rows into config. Defaults must be passed from the block entry point.
 * @param {HTMLDivElement[]} rows
 * @param {Object} defaults - Default config (variant, initialLoad, enableFilters, etc.)
 * @returns {Object} config
 */
export function parseBlockConfig(rows, defaults) {
  const config = { ...defaults };

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
        config.initialLoad = parseInt(value, 10) || defaults.initialLoad;
        break;
      case 'loadmoreincrement':
        config.loadMoreIncrement = parseInt(value, 10) || defaults.loadMoreIncrement;
        break;
      case 'maxitems':
        config.maxItems = parseInt(value, 10) || defaults.maxItems;
        break;
      case 'enablefilters':
        config.enableFilters = value.toLowerCase() === 'true';
        break;
      case 'enablesearch':
        config.enableSearch = value.toLowerCase() === 'true';
        break;
      case 'enablegradienteditor':
        config.enableGradientEditor = value.toLowerCase() === 'true';
        break;
      case 'enablesizesdemo':
        config.enableSizesDemo = value.toLowerCase() === 'true';
        break;
      default:
    }
  });

  return config;
}

export default parseBlockConfig;
