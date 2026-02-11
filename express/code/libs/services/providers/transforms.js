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
