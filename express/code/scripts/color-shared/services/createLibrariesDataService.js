import { serviceManager } from '../../../libs/services/index.js';
import {
  GRADIENT_ELEMENT_TYPE,
  THEME_ELEMENT_TYPE,
} from '../../../libs/services/plugins/cclibrary/constants.js';

function parseThemeElement(element) {
  const rep = element.representations?.[0];
  const themeData = rep?.['colortheme#data'];
  const swatches = themeData?.swatches ?? rep?.['color:#rgb'] ?? [];
  const colors = swatches.map((swatch) => {
    if (typeof swatch === 'string') return swatch;
    return swatch?.value ?? swatch?.color ?? swatch?.hex;
  }).filter(Boolean);

  return {
    id: element.id,
    type: 'theme',
    name: element.name || 'Untitled theme',
    colors,
    colorBlindSafe: Boolean(themeData?.tags?.includes?.('colorblind-safe')
      || element.tags?.includes?.('colorblind-safe')),
  };
}

function parseGradientElement(element) {
  const rep = element.representations?.[0];
  const gradientData = rep?.['gradient#data'];
  return {
    id: element.id,
    type: 'gradient',
    name: element.name || 'Untitled gradient',
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
