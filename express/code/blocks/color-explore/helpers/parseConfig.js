const normalizeKey = (key = '') => key.trim().toLowerCase().replace(/\s+/g, '');
const normalizeValue = (value = '') => value.trim();
const parseInteger = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const parseBoolean = (value) => value.toLowerCase() === 'true';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function applyConfigKey(config, defaults, key, value) {
  switch (key) {
    case 'variant':
      return { ...config, variant: value.toLowerCase() };
    case 'initialload':
      return { ...config, initialLoad: parseInteger(value, defaults.initialLoad) };
    case 'loadmoreincrement':
      return { ...config, loadMoreIncrement: parseInteger(value, defaults.loadMoreIncrement) };
    case 'maxitems':
      return { ...config, maxItems: parseInteger(value, defaults.maxItems) };
    case 'apiendpoint':
      return { ...config, apiEndpoint: value };
    case 'usemockdata':
      return { ...config, useMockData: parseBoolean(value) || value === '1' };
    case 'usemockfallback':
      return { ...config, useMockFallback: parseBoolean(value) || value === '1' };
    case 'swatchverticalmaxperrow':
    case 'verticalmaxperrow': {
      const parsed = parseInt(value, 10);
      if (!Number.isFinite(parsed)) return config;
      return { ...config, swatchVerticalMaxPerRow: clamp(parsed, 1, 10) };
    }
    case 'enablefilters':
      return { ...config, enableFilters: parseBoolean(value) };
    case 'enablesearch':
      return { ...config, enableSearch: parseBoolean(value) };
    case 'review':
    case 'showreviewsection':
      return { ...config, showReviewSection: parseBoolean(value) || value === '1' };
    case 'enablegradienteditor':
      return { ...config, enableGradientEditor: parseBoolean(value) };
    case 'enablesizesdemo':
      return { ...config, enableSizesDemo: parseBoolean(value) };
    default:
      return config;
  }
}

export function parseBlockConfig(rows, defaults) {
  return rows.reduce((config, row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length < 2) return config;

    const key = normalizeKey(cells[0].textContent || '');
    const value = normalizeValue(cells[1].textContent || '');
    if (!key || !value) return config;

    return applyConfigKey(config, defaults, key, value);
  }, { ...defaults });
}

export default parseBlockConfig;
