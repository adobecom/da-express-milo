/**
 * @typedef {Object} SearchOptions
 * @property {'term'|'tag'|'hex'|'similarHex'} [typeOfQuery='term']
 * @property {number} [pageNumber=1]
 */

/**
 * @typedef {Object} SearchCriteria
 * @property {string} main
 * @property {'term'|'tag'|'hex'|'similarHex'} typeOfQuery
 * @property {number} pageNumber
 */

/**
 * @typedef {Object} StockOptions
 * @property {number} [count=20]
 * @property {number} [offset=0]
 */

/**
 * @typedef {Object} StockCriteria
 * @property {number} count
 * @property {number} offset
 */

/**
 * @param {string} query
 * @param {SearchOptions} [options]
 * @returns {SearchCriteria}
 */
export function searchTransform(query, options = {}) {
  return {
    main: query,
    typeOfQuery: options.typeOfQuery || 'term',
    pageNumber: options.pageNumber || 1,
  };
}

/**
 * @param {StockOptions} [params]
 * @returns {StockCriteria}
 */
export function stockTransform(params = {}) {
  return {
    count: params.count || 20,
    offset: params.offset || 0,
    ...params,
  };
}

/**
 * @param {*} value
 * @returns {*}
 */
export function identityTransform(value) {
  return value;
}

/**
 * @param {string} key
 * @returns {Function}
 */
export function namedTransform(key) {
  return (value) => ({ [key]: value });
}

/**
 * Convert a theme-style API response (with swatches) to a gradient object.
 * Theme swatches use 0-1 RGB range.
 *
 * @param {Object} theme
 * @param {string} theme.id
 * @param {string} [theme.name]
 * @param {Array} [theme.swatches]
 * @returns {Object}
 */
export function themeToGradient(theme) {
  const swatches = theme.swatches || [];

  const colors = swatches.map((swatch) => {
    if (swatch.hex) {
      return `#${swatch.hex}`;
    }
    if (swatch.values && swatch.values.length >= 3) {
      const r = Math.round(Number.parseFloat(swatch.values[0]) * 255);
      const g = Math.round(Number.parseFloat(swatch.values[1]) * 255);
      const b = Math.round(Number.parseFloat(swatch.values[2]) * 255);
      return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    }
    return '#CCCCCC';
  });

  const colorStops = colors.map((color, index) => ({
    color,
    position: colors.length > 1 ? index / (colors.length - 1) : 0,
  }));

  return {
    id: theme.id,
    name: theme.name || 'Unnamed Theme',
    type: 'linear',
    angle: 90,
    colorStops,
    coreColors: colors,
    likes: theme.likes ?? theme.appreciations ?? 0,
    creator: theme.author?.name || '',
    tags: theme.tags || [],
    _source: 'kuler',
    _theme: theme,
  };
}

/**
 * @param {Array} themes
 * @returns {Array}
 */
export function themesToGradients(themes) {
  if (!Array.isArray(themes)) return [];
  return themes.map(themeToGradient);
}

/**
 * Convert an RGB stop value from the gradient API (0-255 range) to a hex color.
 * @param {Object} stopColor - color object with mode and value
 * @returns {string} hex color string
 */
function gradientStopToHex(stopColor) {
  if (!stopColor?.[0]?.mode || !stopColor?.[0]?.value) return '#CCCCCC';

  const { mode, value } = stopColor[0];
  if (mode.toLowerCase() === 'rgb') {
    const r = Math.round(value.r);
    const g = Math.round(value.g);
    const b = Math.round(value.b);
    return `#${[r, g, b].map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  }
  return '#CCCCCC';
}

/**
 * Parse a gradient API response item that uses the
 * `gradientSecondaryRepresentation.rendition` structure.
 *
 * The gradient API returns RGB values in 0-255 range (not 0-1 like themes).
 * Each stop has: { color: [{ mode, value: { r, g, b } }], midpoint, offset }
 *
 * @param {Object} apiData - Single gradient item from the API
 * @returns {Object} Normalized gradient object
 */
export function gradientApiResponseToGradient(apiData) {
  const rendition = apiData.gradientSecondaryRepresentation?.rendition;

  if (!rendition) {
    return themeToGradient(apiData);
  }

  const stops = rendition.stops || [];
  const colorStops = stops.map((stop) => ({
    color: gradientStopToHex(stop.color),
    position: stop.offset ?? 0,
    midpoint: stop.midpoint ?? 0.5,
  }));

  const coreColors = colorStops.map((s) => s.color);

  return {
    id: apiData.id,
    name: apiData.name || 'Unnamed Gradient',
    type: rendition.type || 'linear',
    angle: rendition.angle || 90,
    aspectRatio: rendition.aspectRatio || 1,
    interpolation: rendition.interpolation || 'linear',
    colorStops,
    coreColors,
    likes: apiData.likes ?? apiData.appreciations ?? 0,
    creator: apiData.author?.name || '',
    tags: apiData.tags || [],
    hasNextPage: apiData.hasNextPage,
    _source: 'kuler-gradient',
    _theme: apiData,
  };
}

/**
 * Parse an array of gradient API responses.
 * @param {Array} apiDataArray
 * @returns {Array}
 */
export function gradientApiResponsesToGradients(apiDataArray) {
  if (!Array.isArray(apiDataArray)) return [];
  return apiDataArray.map(gradientApiResponseToGradient);
}
