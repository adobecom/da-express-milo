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

    // Skip empty keys/values
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
        // Silently ignore unknown keys (could be comments or empty rows)
    }
  });

  return config;
}
