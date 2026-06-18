import { serviceManager } from '../../../libs/services/index.js';
import {
  GRADIENT_ELEMENT_TYPE,
  THEME_ELEMENT_TYPE,
  THEME_REPRESENTATION_TYPE,
} from '../../../libs/services/plugins/cclibrary/constants.js';

function channelToHex(value) {
  const int = Math.min(255, Math.max(0, Math.round(Number(value))));
  return Number.isNaN(int) ? '00' : int.toString(16).padStart(2, '0');
}

function rgbObjectToHex(rgb) {
  if (!rgb || rgb.r == null || rgb.g == null || rgb.b == null) return null;
  return `#${channelToHex(rgb.r)}${channelToHex(rgb.g)}${channelToHex(rgb.b)}`;
}

function withHash(hex) {
  if (typeof hex !== 'string' || !hex) return null;
  return hex.startsWith('#') ? hex : `#${hex}`;
}

/**
 * Resolve a single CC Libraries swatch to a hex string.
 * Themes saved via the drawer store each swatch as an array of color-mode
 * entries, e.g. `[{ mode: 'RGB', value: { r, g, b }, profileName }]` (0-255).
 * Also tolerates plain hex strings, `{ hex }`, and Kuler-style `{ values: [r,g,b] }` (0-1).
 */
function swatchToHex(swatch) {
  if (!swatch) return null;
  if (typeof swatch === 'string') return withHash(swatch);

  if (Array.isArray(swatch)) {
    const rgbEntry = swatch.find((entry) => String(entry?.mode).toUpperCase() === 'RGB')
      ?? swatch[0];
    return rgbObjectToHex(rgbEntry?.value);
  }

  if (typeof swatch.hex === 'string') return withHash(swatch.hex);
  if (typeof swatch.color === 'string') return withHash(swatch.color);
  if (swatch.value && typeof swatch.value === 'object') return rgbObjectToHex(swatch.value);
  if (typeof swatch.value === 'string') return withHash(swatch.value);

  if (Array.isArray(swatch.values) && swatch.values.length >= 3) {
    const [r, g, b] = swatch.values;
    return rgbObjectToHex({ r: Number(r) * 255, g: Number(g) * 255, b: Number(b) * 255 });
  }

  return null;
}

function parseThemeElement(element) {
  const reps = element.representations ?? [];
  const rep = reps.find((r) => r?.['colortheme#data'])
    ?? reps.find((r) => r?.type === THEME_REPRESENTATION_TYPE)
    ?? reps[0];
  const themeData = rep?.['colortheme#data'];
  const swatches = themeData?.swatches ?? rep?.['color:#rgb'] ?? [];
  const colors = (Array.isArray(swatches) ? swatches : [])
    .map(swatchToHex)
    .filter(Boolean);

  return {
    id: element.id,
    type: 'theme',
    name: element.name || 'Untitled theme',
    colors,
    tags: Array.isArray(themeData?.tags) ? themeData.tags.filter(Boolean) : [],
    // Color-blind-safe is stored as accessibility metadata inside the theme
    // representation data (the only place that round-trips via the CC Library API).
    colorBlindSafe: Boolean(themeData?.accessibilityData?.colorBlindSafe),
  };
}

function parseGradientElement(element) {
  const rep = element.representations?.[0];
  const gradientData = rep?.['gradient#data'];
  return {
    id: element.id,
    type: 'gradient',
    name: element.name || 'Untitled gradient',
    angle: gradientData?.angle ?? 90,
    gradient: gradientData?.gradient,
    colorStops: gradientData?.stops,
  };
}

function parseElement(element) {
  const type = element.type;
  if (type === GRADIENT_ELEMENT_TYPE || type === 'gradient') return parseGradientElement(element);
  if (type === THEME_ELEMENT_TYPE || type === 'colortheme') return parseThemeElement(element);
  return null;
}

function buildLibraryModel(library, elements) {
  const items = (elements || []).map(parseElement).filter(Boolean);
  const themeCount = items.filter((i) => i.type === 'theme').length;
  const gradientCount = items.filter((i) => i.type === 'gradient').length;

  return {
    id: library.library_urn ?? library.id,
    name: library.name,
    themeCount,
    gradientCount,
    items,
  };
}

/**
 * Fetch user libraries with color themes and gradients for the Libraries UI.
 */
export async function fetchLibrariesWithElements() {
  await serviceManager.init({ plugins: ['cclibrary'] });
  const provider = await serviceManager.getProvider('cclibrary');
  if (!provider) return [];

  const result = await provider.fetchUserLibraries({}, { throwOnError: true });
  const rawLibraries = result?.libraries ?? [];

  const libraries = await Promise.all(
    rawLibraries.map(async (library) => {
      const id = library.library_urn ?? library.id;
      try {
        const elementsResult = await provider.fetchLibraryElements(id);
        return buildLibraryModel(library, elementsResult?.elements);
      } catch (err) {
        window.lana?.log(`Libraries fetch elements failed for ${id}: ${err?.message}`, {
          tags: 'color-libraries',
          severity: 'warning',
        });
        return buildLibraryModel(library, []);
      }
    }),
  );

  return libraries.filter(
    (lib) => lib.themeCount > 0 || lib.gradientCount > 0 || lib.items.length > 0,
  );
}

/**
 * Delete a theme or gradient element from a CC Library.
 * @param {string} libraryId
 * @param {string} elementId
 */
export async function deleteLibraryItem(libraryId, elementId) {
  if (!libraryId || !elementId) {
    throw new Error('Library ID and element ID are required');
  }

  await serviceManager.init({ plugins: ['cclibrary'] });
  const provider = await serviceManager.getProvider('cclibrary');
  if (!provider) {
    throw new Error('CC Library provider is unavailable');
  }

  await provider.deleteTheme(libraryId, elementId, { throwOnError: true });
}
