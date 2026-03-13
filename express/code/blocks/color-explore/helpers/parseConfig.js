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
      case 'swatchverticalmaxperrow':
      case 'verticalmaxperrow': {
        const parsed = parseInt(value, 10);
        if (Number.isFinite(parsed)) {
          config.swatchVerticalMaxPerRow = Math.max(1, Math.min(10, parsed));
        }
        break;
      }
      case 'enablefilters':
        config.enableFilters = value.toLowerCase() === 'true';
        break;
      case 'enablesearch':
        config.enableSearch = value.toLowerCase() === 'true';
        break;
      case 'review':
      case 'showreviewsection':
        config.showReviewSection = value.toLowerCase() === 'true' || value === '1';
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
