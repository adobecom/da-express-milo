/**
 * @typedef {Object} SearchOptions
 * @property {'term'|'tag'|'hex'|'similarHex'} [typeOfQuery='term'] - Query type
 * @property {number} [pageNumber=1] - Page number (1-indexed)
 */

/**
 * @typedef {Object} SearchCriteria
 * @property {string} main - Search query
 * @property {'term'|'tag'|'hex'|'similarHex'} typeOfQuery - Query type
 * @property {number} pageNumber - Page number
 */

/**
 * @typedef {Object} StockOptions
 * @property {number} [count=20] - Number of results
 * @property {number} [offset=0] - Results offset
 */

/**
 * @typedef {Object} StockCriteria
 * @property {number} count - Number of results
 * @property {number} offset - Results offset
 */

/**
 * Standard search criteria transform for Kuler-style queries.
 * Maps (query, options) to the criteria format expected by search actions.
 *
 * @param {string} query - Search query string
 * @param {SearchOptions} [options={}] - Search options
 * @returns {SearchCriteria} Formatted search criteria
 */
export function searchTransform(query, options = {}) {
  return {
    main: query,
    typeOfQuery: options.typeOfQuery || 'term',
    pageNumber: options.pageNumber || 1,
  };
}

/**
 * Transform for Stock API queries.
 * Provides defaults for pagination parameters.
 *
 * @param {StockOptions} [params={}] - Stock query parameters
 * @returns {StockCriteria} Formatted stock criteria
 */
export function stockTransform(params = {}) {
  return {
    count: params.count || 20,
    offset: params.offset || 0,
    ...params,
  };
}

/**
 * Identity transform - passes through the first argument unchanged.
 * Useful for actions that take a single object parameter.
 *
 * @param {any} value - Value to pass through
 * @returns {any} Same value
 */
export function identityTransform(value) {
  return value;
}

/**
 * Creates a transform that wraps a single value in an object.
 * Useful for actions that need a named parameter.
 *
 * @param {string} key - Property name to wrap value in
 * @returns {Function} Transform function
 */
export function namedTransform(key) {
  return (value) => ({ [key]: value });
}

/**
 * Transform Kuler theme to gradient format for renderer.
 * Converts theme swatches into colorStops for gradient rendering.
 *
 * @param {Object} theme - Kuler theme object from API
 * @param {string} theme.id - Theme ID
 * @param {string} [theme.name] - Theme name
 * @param {Array} [theme.swatches] - Array of swatch objects
 * @returns {Object} Gradient-compatible object for renderer
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
    _source: 'kuler',
    _theme: theme,
  };
}

/**
 * Transform array of Kuler themes to gradient format.
 * Batch transform for API responses.
 *
 * @param {Array} themes - Array of Kuler theme objects
 * @returns {Array} Array of gradient-compatible objects
 */
export function themesToGradients(themes) {
  if (!Array.isArray(themes)) return [];
  return themes.map(themeToGradient);
}

