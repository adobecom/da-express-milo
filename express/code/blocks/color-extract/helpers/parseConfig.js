/**
 * Color Extract Block - Configuration Parser
 */

import { DEFAULTS } from './constants.js';

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
      case 'maxcolors':
        config.maxColors = parseInt(value, 10) || DEFAULTS.MAX_COLORS;
        break;
      case 'enableimageupload':
        config.enableImageUpload = value.toLowerCase() === 'true';
        break;
      case 'enableurlinput':
        config.enableUrlInput = value.toLowerCase() === 'true';
        break;
      default:
        console.warn('[ColorExtract] Unknown config key:', key);
    }
  });

  return config;
}
