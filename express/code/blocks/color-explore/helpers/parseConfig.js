/**
 * Color Explore Block - Configuration Parser
 * 
 * Parses block content into configuration object
 * 
 * Expected block structure:
 * <div class="color-explore">
 *   <div>
 *     <div>Variant</div>
 *     <div>gradients</div>
 *   </div>
 *   <div>
 *     <div>Initial Load</div>
 *     <div>24</div>
 *   </div>
 * </div>
 */

import { DEFAULTS } from './constants.js';

/**
 * Parse block configuration from DOM
 * @param {Array} rows - Block rows
 * @returns {Object} Configuration object
 */
export function parseBlockConfig(rows) {
  const config = { ...DEFAULTS };

  rows.forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length < 2) return;

    const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '');
    const value = cells[1].textContent.trim();

    switch (key) {
      case 'variant':
        config.variant = value.toLowerCase();
        break;
      case 'initialload':
        config.initialLoad = parseInt(value, 10) || DEFAULTS.INITIAL_LOAD;
        break;
      case 'loadmoreincrement':
        config.loadMoreIncrement = parseInt(value, 10) || DEFAULTS.LOAD_MORE_INCREMENT;
        break;
      case 'maxitems':
        config.maxItems = parseInt(value, 10) || DEFAULTS.MAX_ITEMS;
        break;
      case 'enablefilters':
        config.enableFilters = value.toLowerCase() === 'true';
        break;
      case 'enablesearch':
        config.enableSearch = value.toLowerCase() === 'true';
        break;
      default:
        console.warn('[ColorExplore] Unknown config key:', key);
    }
  });

  return config;
}
