/**
 * Isolated Kuler palette fetching service for contrast-checker.
 * This service is designed to be easily removable when no longer needed.
 */

import { serviceManager } from '../../../libs/services/index.js';
import { themeToGradient } from '../../../libs/services/providers/transforms.js';

export default function createKulerPaletteService() {
  async function fetchRandomPalette() {
    try {
      const provider = await serviceManager.getProvider('kuler');
      if (!provider) {
        return null;
      }

      const themes = await provider.searchThemes('sunset', {
        typeOfQuery: 'term',
        page: 1,
      });
      if (!themes?.length) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * themes.length);
      const theme = themes[randomIndex];
      const gradient = themeToGradient(theme);
      const colors = gradient.coreColors?.filter(Boolean) || [];

      if (colors.length < 2) {
        return null;
      }

      return {
        id: theme.id,
        name: gradient.name,
        colors,
        source: 'kuler',
      };
    } catch (err) {
      window.lana?.log(`Kuler palette fetch error: ${err?.message}`, {
        tags: 'contrast-checker,kuler',
      });
      return null;
    }
  }

  return {
    fetchRandomPalette,
  };
}
